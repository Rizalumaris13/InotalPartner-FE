"""Focused, read-only About/Contact geometry checks against a local Vite app.

Run with system Chromium (no repo dependency changes):
  uv run --offline --no-project --with playwright==1.64.1 python \
    scripts/about-contact-layout.py --base-url http://127.0.0.1:5173 \
    --output /path/in/scratch --baseline /path/in/scratch/baseline/metrics.json

All /api/ requests and remote images are intercepted in an isolated browser.
External iframe documents are blocked: map/video DOM and controls are checked,
not OpenStreetMap tiles, YouTube playback, or backend persistence.
"""
import argparse
import json
import shutil
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


WIDTHS = (1440, 1024, 768, 390)
IMAGE = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#c8e2ef"/><path d="M0 600 320 250 540 470 790 180 1200 640V800H0Z" fill="#96bdce"/><text x="40" y="80" fill="#0c4a6e" font-family="sans-serif" font-size="28">Gambar fixture — bukan foto produksi</text></svg>'
SINGLETONS = {'/about', '/about/intro', '/about/video-setting', '/homepage/join-images', '/homepage/join-cards', '/homepage/services'}


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:5173')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--scope', choices=('contact', 'about', 'intro', 'all'), default='all')
    parser.add_argument('--interactions-only', action='store_true')
    args = parser.parse_args()
    if urlparse(args.base_url).hostname not in ('127.0.0.1', 'localhost'):
        parser.error('Only loopback Vite URLs are allowed.')
    if not shutil.which('chromium'):
        parser.error('System Chromium is required.')
    args.output.mkdir(parents=True, exist_ok=True)
    return args


def payloads(defaults, scenario):
    count = 1 if scenario == 'sparse' else 3
    populated = scenario in ('populated', 'sparse')
    return {
        '/about': {'team_title': 'Orang-orang di Balik Ekosistem Ini.'},
        '/about/intro': defaults['intro'],
        '/about/cards': defaults['cards'][:count] if populated else [],
        '/about/team': [
            {'id': i + 1, 'name': f'Anggota Uji {i + 1}', 'position': 'Tim kolaborasi uji',
             'photo_url': f'/uploads/about-contact-layout-team-{i + 1}.png',
             'display_order': i + 1, 'is_active': True}
            for i in range(1 if scenario == 'sparse' else 4)
        ] if populated else [],
        '/about/faqs': [
            {'id': i + 1, 'question': question, 'answer': 'Jawaban fixture untuk pengujian tata letak dan interaksi FAQ. Bukan data perusahaan.', 'display_order': i + 1, 'is_active': True}
            for i, question in enumerate(('Bagaimana cara bergabung dalam program?', 'Bagaimana menghubungi tim kolaborasi?', 'Di mana informasi program terbaru?'))
        ] if populated else [],
        '/about/video': [{'id': 1, 'title': 'Video Profil Uji', 'description': 'Deskripsi fixture untuk pengujian pemutar.', 'video_url': 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', 'thumbnail_url': '/uploads/about-contact-layout-video.png', 'is_active': True}] if populated else [],
        '/about/video-setting': None,
        '/about/video-highlights': [
            {'id': 1, 'icon': 'film', 'title': 'Rekaman sesi uji', 'description': 'Deskripsi fixture untuk pengujian highlight video.', 'display_order': 1, 'is_active': True},
            {'id': 2, 'icon': 'quote', 'title': 'Kolaborasi uji', 'description': 'Deskripsi fixture kedua agar tinggi konten dapat diukur.', 'display_order': 2, 'is_active': True},
        ] if populated else [],
    }


def route_handler(state):
    def intercept(route):
        req = route.request
        url = urlparse(req.url)
        if url.path.startswith('/api/'):
            state['requests'].append({'method': req.method, 'path': url.path})
            if req.method != 'GET':
                if req.method == 'POST' and url.path == '/api/contacts' and state['contact_response']:
                    state['submissions'].append(req.post_data_json)
                    if state['contact_response'] == 'error':
                        route.fulfill(status=503, json={'success': False, 'message': 'Pengiriman fixture gagal. Coba lagi.'})
                    else:
                        route.fulfill(status=201, json={'success': True, 'message': 'Pesan fixture diterima.', 'data': {'id': 1, **req.post_data_json}})
                else:
                    state['unexpected_writes'].append({'method': req.method, 'path': url.path})
                    route.fulfill(status=405, json={'success': False, 'message': 'Mutation blocked by layout check.'})
                return
            stripped = url.path.removeprefix('/api').removeprefix('/public')
            if state['scenario'] in ('error', 'unavailable') and stripped.startswith('/about'):
                route.fulfill(status=500 if state['scenario'] == 'error' else 404,
                              json={'success': False, 'message': 'Data fixture belum tersedia.'})
                return
            data = state['data'].get(stripped, None if stripped in SINGLETONS or stripped.startswith('/page-banners/') else [])
            route.fulfill(json={'success': True, 'data': data, 'meta': {'total': len(data) if isinstance(data, list) else 0, 'page': 1, 'limit': 100, 'total_pages': 1}})
        elif req.resource_type == 'image' and (url.hostname not in ('127.0.0.1', 'localhost') or url.path.startswith('/uploads/')):
            route.fulfill(content_type='image/svg+xml', body=IMAGE)
        elif url.hostname not in ('127.0.0.1', 'localhost'):
            # No external frame/network dependency can mutate a real service.
            state['blocked_external'].append(req.url)
            route.abort()
        else:
            route.continue_()
    return intercept


GEOMETRY = """() => {
    const root = document.querySelector('#root > div');
    const box = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return {
        x:r.x, y:r.y + scrollY, width:r.width, height:r.height, bottom:r.bottom + scrollY,
        paddingTop:parseFloat(s.paddingTop), paddingBottom:parseFloat(s.paddingBottom),
        paddingLeft:parseFloat(s.paddingLeft), paddingRight:parseFloat(s.paddingRight),
        rowGap:s.rowGap, columnGap:s.columnGap, grid:s.gridTemplateColumns,
        marginBottom:parseFloat(s.marginBottom), marginTop:parseFloat(s.marginTop),
        scrollWidth:el.scrollWidth, clientWidth:el.clientWidth,
    }};
    const sections = [...root.children].filter(el => el.tagName === 'SECTION');
    const banner = sections[0];
    const heading = banner.querySelector('h1');
    const hero = {box:box(banner), title:heading.innerText, heading:box(heading), html:banner.outerHTML};
    const details = sections.map((el,index) => ({index, ...box(el), text:el.innerText,
        headings:[...el.querySelectorAll('h2,h3,h4')].map(e=>({text:e.innerText,...box(e)})),
        children:[...el.children].map(box)}));
    const contentElements = sections.slice(1).flatMap(s => [...s.querySelectorAll('h2,h3,h4,p,li,input,select,textarea,button,img,iframe')]);
    const outside = contentElements.filter(el => {
        const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return r.width && r.height && s.visibility !== 'hidden' && (r.left < -1 || r.right > innerWidth+1);
    }).map(el=>({tag:el.tagName,text:el.innerText,...box(el)}));
    const form = root.querySelector('form');
    const map = root.querySelector('iframe[title^="Peta lokasi"]');
    const img = [...root.querySelectorAll('img')].find(el => el.alt.includes('sesi diskusi kolaborasi'));
    let intro = null;
    if(img){
        const section = img.closest('section'), grid = section.firstElementChild;
        const textColumn = grid.lastElementChild;
        const progress = section.querySelector('h4').parentElement;
        const cards = [...section.querySelectorAll('h3')].map(el=>box(el.parentElement));
        const eyebrow = textColumn.querySelector('span');
        intro = {section:box(section), grid:box(grid), photo:box(img), progress:box(progress), text:box(textColumn),
            eyebrow:box(eyebrow), heading:box(textColumn.querySelector('h2')), cards,
            cardText:[...section.querySelectorAll('h3 + p')].map(box),
            cta:box(textColumn.querySelector('button'))};
    }
    const cards = [...root.querySelectorAll('article')].map(el=>{
        const inner=el.firstElementChild, icon=inner.children[1], h=inner.querySelector('h3');
        return {box:box(el), inner:box(inner), iconToHeading: h.getBoundingClientRect().top-icon.getBoundingClientRect().bottom};
    });
    return {width:innerWidth, documentWidth:document.documentElement.scrollWidth, documentHeight:document.documentElement.scrollHeight,
        hero, sections:details, outside, intro, cards,
        form:form?{box:box(form),card:box(form.parentElement),controls:[...form.querySelectorAll('input,select,textarea,button')].map(box),
            headerGap:form.parentElement.getBoundingClientRect().top-form.closest('section').querySelector('h2 + p').getBoundingClientRect().bottom}:null,
        map:map?{box:box(map),parent:box(map.parentElement),src:map.getAttribute('src')}:null,
        contactInfo:map?box(map.parentElement.nextElementSibling):null,
        video:img?box(sections[2].firstElementChild.firstElementChild.firstElementChild):null,
        images:[...root.querySelectorAll('section img')].map(el=>({alt:el.alt,src:el.getAttribute('src'),loaded:el.complete&&el.naturalWidth>0})),
    };
}"""


def settle(page, base, key, scenario='public'):
    page.goto(f'{base}/?about-contact-layout={key}-{scenario}#{key}', wait_until='networkidle')
    page.evaluate('document.fonts.ready')
    # Reveal fallback and reduced-motion counters must finish, even below fold.
    page.wait_for_timeout(1900)
    for image in page.locator('#root > div > section img').all():
        image.scroll_into_view_if_needed()
        image.evaluate('el => el.decode().catch(() => null)')
    page.locator('footer').scroll_into_view_if_needed()
    page.wait_for_timeout(250)
    page.evaluate('window.scrollTo(0,0)')
    page.wait_for_timeout(100)


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2))


def contact_interactions(page, base, state, width, output, check):
    state['scenario'] = 'populated'
    settle(page, base, 'kontak', 'interactions')
    submits_before = len(state['submissions'])
    page.get_by_role('button', name='Kirim Pesan', exact=True).click()
    messages = ('Nama depan minimal 2 karakter', 'Nama belakang minimal 2 karakter',
                'Format email tidak valid', 'Pilih topik pesan', 'Pesan minimal 10 karakter')
    for message in messages:
        # The select's placeholder has the same text as its validation message.
        expect(page.locator('form p').filter(has_text=message)).to_be_visible()
    check(f'contact validation @{width}: no invalid API submit', len(state['submissions']) == submits_before, len(state['submissions']) - submits_before)
    geometry = page.evaluate(GEOMETRY)
    check(f'contact validation @{width}: messages/fields fit', not geometry['outside'], geometry['outside'])
    page.locator('form').screenshot(path=str(output / f'kontak-invalid-{width}.png'))
    values = {'firstName':'Penguji', 'lastName':'Tata Letak', 'email':'layout@example.test',
              'message':'Pesan fixture untuk pengujian formulir. Jangan dikirim ke API asli.'}
    for field, value in values.items():
        page.locator(f'#{field}').fill(value)
    page.locator('#topic').select_option('Program & Kolaborasi')
    state['contact_response'] = 'error'
    page.get_by_role('button', name='Kirim Pesan', exact=True).click()
    expect(page.get_by_text('Pengiriman fixture gagal. Coba lagi.', exact=True)).to_be_visible()
    for field, value in values.items():
        expect(page.locator(f'#{field}')).to_have_value(value)
    error_geometry = page.evaluate(GEOMETRY)
    check(f'contact API error @{width}: draft retained and fits', not error_geometry['outside'], error_geometry['outside'])
    page.locator('form').locator('..').screenshot(path=str(output / f'kontak-error-{width}.png'))
    state['contact_response'] = 'success'
    page.get_by_role('button', name='Kirim Pesan', exact=True).click()
    expect(page.get_by_role('heading', name='Pesan terkirim!', exact=True)).to_be_visible()
    actual = state['submissions'][submits_before:]
    expected = {'name':'Penguji Tata Letak', 'email':values['email'], 'phone':'',
                'subject':'Program & Kolaborasi', 'message':values['message']}
    check(f'contact submit @{width}: unchanged explicit API payload', actual == [expected, expected], actual)
    success = page.get_by_role('heading', name='Pesan terkirim!', exact=True).locator('..')
    success.screenshot(path=str(output / f'kontak-success-{width}.png'))
    check(f'contact success @{width}: state fits viewport', not page.evaluate(GEOMETRY)['outside'], success.bounding_box())
    page.get_by_role('button', name='Kirim pesan lain', exact=True).click()
    for field in values:
        expect(page.locator(f'#{field}')).to_have_value('')
    check(f'contact reset @{width}: new message form restored', page.locator('form').is_visible(), True)
    state['contact_response'] = None


def about_interactions(page, base, state, defaults, width, check):
    state['scenario'] = 'populated'
    state['data'] = payloads(defaults, 'populated')
    settle(page, base, 'tentang', 'interactions')
    faq = page.get_by_role('button', name='Bagaimana menghubungi tim kolaborasi?', exact=True)
    faq.click()
    expect(faq).to_have_attribute('aria-expanded', 'true')
    answer = faq.locator('..').locator('p')
    expect(answer).to_be_visible()
    check(f'FAQ @{width}: answer contained within its card', answer.evaluate('(e)=>{const r=e.getBoundingClientRect(),p=e.closest(".rounded-xl").getBoundingClientRect();return r.left>=p.left&&r.right<=p.right}'), answer.bounding_box())
    faq.click()
    expect(faq).to_have_attribute('aria-expanded', 'false')
    check(f'FAQ @{width}: toggle closes', True, faq.get_attribute('aria-expanded'))
    check(f'video @{width}: iframe is lazy until play', page.locator('iframe[title="Video Profil Uji"]').count() == 0, page.locator('iframe').count())
    page.get_by_role('button', name='Putar video: Video Profil Uji', exact=True).click()
    frame = page.locator('iframe[title="Video Profil Uji"]')
    expect(frame).to_be_visible()
    check(f'video @{width}: existing YouTube embed and dimensions preserved', frame.get_attribute('src') == 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?autoplay=1&rel=0&modestbranding=1' and frame.bounding_box()['height'] >= 200, frame.bounding_box())
    page.get_by_role('button', name=defaults['intro']['cta_label'], exact=True).click()
    check(f'intro CTA @{width}: still navigates to program', page.evaluate('location.hash') == '#program', page.evaluate('location.hash'))
    settle(page, base, 'tentang', 'card-link')
    page.get_by_role('link', name=f"Selengkapnya: {defaults['cards'][0]['title']}", exact=True).click()
    check(f'about card @{width}: internal navigation preserved', page.evaluate('location.hash') == '#program', page.evaluate('location.hash'))
    settle(page, base, 'tentang', 'faq-link')
    page.get_by_role('button', name='Ajukan Pertanyaan', exact=True).click()
    check(f'FAQ CTA @{width}: still navigates to partnership', page.evaluate('location.hash') == '#partnership', page.evaluate('location.hash'))


PREVIEW_GEOMETRY = """el => {
    const section=el.querySelector('section'),grid=section.firstElementChild;
    const img=section.querySelector('img'),cta=section.querySelector('button');
    const cardGrid=section.querySelector('h3').parentElement.parentElement.parentElement;
    const s=getComputedStyle(grid),scale=el.getBoundingClientRect().width/el.offsetWidth;
    return {designWidth:el.offsetWidth,scale,columns:s.gridTemplateColumns,
        gap:parseFloat(s.columnGap),padding:parseFloat(getComputedStyle(section).paddingTop),
        cardColumns:getComputedStyle(cardGrid).gridTemplateColumns,
        imageHeight:img.offsetHeight,headingSize:parseFloat(getComputedStyle(section.querySelector('h2')).fontSize),
        buttonType:cta.type,overflow:grid.scrollWidth>grid.clientWidth,
        cardText:[...section.querySelectorAll('h3 + p')].map(e=>e.clientWidth),text:section.innerText,
        imageSource:img.getAttribute('src'),cta:{x:cta.getBoundingClientRect().x,y:cta.getBoundingClientRect().y}}
}"""


def preview_checks(context, base, state, defaults, output, check):
    context.add_init_script("localStorage.setItem('inotal_token','about-contact-layout-fixture-not-a-real-token');localStorage.setItem('inotal_user',JSON.stringify({id:0,full_name:'Admin Uji Layout',email:'layout@example.test',role:'super_admin'}))")
    state['scenario'] = 'populated'
    state['data'] = payloads(defaults, 'populated')
    page = context.new_page()
    results = {}
    for width in WIDTHS:
        page.set_viewport_size({'width':width, 'height':900 if width != 390 else 844})
        page.goto(f'{base}/?about-contact-layout=preview-{width}#dashboard', wait_until='networkidle')
        page.wait_for_selector('main')
        if width < 1024:
            page.locator('button').filter(has=page.locator('svg.lucide-menu')).click()
        sidebar = page.locator('aside nav')
        for label in ('About', 'Intro Tentang', 'Intro & Misi Visi'):
            sidebar.get_by_role('button', name=label, exact=True).click()
        preview = page.get_by_role('region', name='Pratinjau intro Tentang', exact=True)
        scaled = preview.locator('div[style*="width: 1280px"]')
        expect(scaled).to_be_attached()
        page.wait_for_timeout(350)
        preview.scroll_into_view_if_needed()
        preview.locator('img').evaluate('e=>e.decode().catch(()=>null)')
        m = scaled.evaluate(PREVIEW_GEOMETRY)
        results[str(width)] = m
        check(f'admin preview @{width}: fixed desktop proportions', m['designWidth'] == 1280 and m['imageHeight'] == 500 and m['headingSize'] == 42 and len(m['columns'].split()) == 2 and len(m['cardColumns'].split()) == 2 and not m['overflow'], m)
        check(f'admin preview @{width}: readable unscaled card text', all(w >= 200 for w in m['cardText']), m['cardText'])
        check(f'admin preview @{width}: desktop spacing matches public desktop', m['padding'] == 64 and m['gap'] == 40, {'padding':m['padding'], 'gap':m['gap']})
        before = len(state['unexpected_writes'])
        cta = preview.get_by_role('button', name=defaults['intro']['cta_label'], exact=True)
        cta.click()
        check(f'admin preview @{width}: CTA cannot submit form', m['buttonType'] == 'button' and len(state['unexpected_writes']) == before, {'type':m['buttonType'], 'unexpectedWrites':len(state['unexpected_writes'])-before})
        preview.screenshot(path=str(output / f'about-intro-admin-{width}.png'))
        save(output / 'preview-metrics.json', results)
    page.close()


def main():
    args = arguments()
    base = args.base_url.rstrip('/')
    baseline = json.loads(args.baseline.read_text()) if args.baseline else {}
    metrics, results = {}, []
    def check(name, condition, observed):
        results.append({'name': name, 'pass': bool(condition), 'observed': observed})
    state = {'scenario': 'empty', 'data': {}, 'requests': [], 'submissions': [], 'unexpected_writes': [], 'blocked_external': [], 'contact_response': None}
    runtime_errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce', service_workers='block')
        context.route('**/*', route_handler(state))
        page = context.new_page()
        page.on('pageerror', lambda err: runtime_errors.append(str(err)))
        page.goto(base + '/#kontak', wait_until='networkidle')
        defaults = page.evaluate("""async()=>({
            intro:(await import('/src/data/aboutIntro.js')).DEFAULT_ABOUT_INTRO,
            cards:(await import('/src/data/aboutCards.js')).previewAboutCards
        })""")
        save(args.output / 'fixtures.json', defaults)
        for width in (() if args.interactions_only else WIDTHS):
            page.set_viewport_size({'width': width, 'height': 900 if width != 390 else 844})
            if args.scope in ('contact', 'all'):
                state['scenario'] = 'populated'
                state['data'] = payloads(defaults, 'populated')
                settle(page, base, 'kontak')
                key = f'kontak-populated-{width}'
                m = page.evaluate(GEOMETRY)
                metrics[key] = m
                interval = 64 if width >= 768 else 48
                form_section = m['sections'][2]
                check(f'{key}: form uses one section interval', form_section['paddingTop'] == interval and form_section['paddingBottom'] == interval, form_section)
                check(f'{key}: no clipped page content', m['documentWidth'] <= width and not m['outside'], m['outside'])
                check(f'{key}: map iframe fills its card', abs(m['map']['box']['height'] - m['map']['parent']['height']) <= 1 and m['map']['box']['height'] >= 280, m['map'])
                check(f'{key}: form controls fit the card', all(c['width'] > 0 and c['x'] >= m['form']['card']['x'] and c['x'] + c['width'] <= m['form']['card']['x'] + m['form']['card']['width'] for c in m['form']['controls']), m['form'])
                check(f'{key}: contact card has compact usable padding', m['contactInfo']['paddingLeft'] <= 40 and float(m['contactInfo']['rowGap'].removesuffix('px')) <= 24, m['contactInfo'])
                check(f'{key}: map remains visible without oversized card', m['map']['box']['height'] <= 400, m['map']['box']['height'])
                check(f'{key}: form header gap is one content gap', 24 <= m['form']['headerGap'] <= 40, m['form']['headerGap'])
                if key in baseline:
                    check(f'{key}: hero exactly preserved', m['hero'] == baseline[key]['hero'], {'before':baseline[key]['hero']['box'], 'after':m['hero']['box']})
                page.screenshot(path=str(args.output / f'{key}.png'), full_page=True)
                page.locator('iframe[title^="Peta lokasi"]').screenshot(path=str(args.output / f'{key}-map.png'))
                page.locator('form').screenshot(path=str(args.output / f'{key}-form.png'))
                save(args.output / 'metrics.json', metrics)
                save(args.output / 'assertions.json', results)
            if args.scope in ('about', 'intro', 'all'):
                for scenario in ('populated', 'sparse', 'empty', 'error', 'unavailable'):
                    state['scenario'] = scenario
                    state['data'] = payloads(defaults, scenario)
                    settle(page, base, 'tentang', scenario)
                    key = f'tentang-{scenario}-{width}'
                    m = page.evaluate(GEOMETRY)
                    metrics[key] = m
                    interval = 64 if width >= 768 else 48
                    if args.scope in ('about', 'all'):
                        for index in (1, 2, 3, 5, 6):
                            section = m['sections'][index]
                            target_top = 0 if index in (2, 3) else interval
                            check(f'{key}: section {index} uses one interval', section['paddingTop'] == target_top and section['paddingBottom'] == interval, {'top':section['paddingTop'], 'bottom':section['paddingBottom']})
                        check(f'{key}: adjacent white sections avoid double padding', all(m['sections'][i]['paddingBottom'] + m['sections'][i + 1]['paddingTop'] == interval for i in (1,2)), [m['sections'][i]['paddingBottom'] + m['sections'][i + 1]['paddingTop'] for i in (1,2)])
                        check(f'{key}: card headings do not follow giant blank gaps', all(24 <= c['iconToHeading'] <= 32 for c in m['cards']), [c['iconToHeading'] for c in m['cards']])
                        check(f'{key}: cards have readable tablet columns', all(c['box']['width'] >= min(272, width-48) for c in m['cards']), [c['box']['width'] for c in m['cards']])
                        if scenario not in ('populated', 'sparse'):
                            check(f'{key}: empty video is content-sized', 200 <= m['video']['height'] <= 300, m['video'])
                    if args.scope in ('intro', 'all'):
                        check(f'{key}: intro uses section rhythm', m['intro']['section']['paddingTop'] == interval and m['intro']['section']['paddingBottom'] == interval, m['intro']['section'])
                        check(f'{key}: intro cards have readable text columns', all(c['width'] >= 200 for c in m['intro']['cardText']), [c['width'] for c in m['intro']['cardText']])
                        if width < 1024:
                            gap = m['intro']['eyebrow']['y'] - m['intro']['progress']['bottom']
                            check(f'{key}: photo/progress has one gap before intro text', 24 <= gap <= 40, gap)
                    check(f'{key}: no clipped page content', m['documentWidth'] <= width and not m['outside'], m['outside'])
                    expected_cards = {'populated': 3, 'sparse': 1, 'empty': 0, 'error': 0, 'unavailable': 3}[scenario]
                    check(f'{key}: correct API state/card count', len(m['cards']) == expected_cards, len(m['cards']))
                    check(f'{key}: all fixture images decode', all(img['loaded'] for img in m['images']), m['images'])
                    if key in baseline:
                        check(f'{key}: hero exactly preserved', m['hero'] == baseline[key]['hero'], {'before':baseline[key]['hero']['box'], 'after':m['hero']['box']})
                        check(f'{key}: section text and image sources preserved', [s['text'] for s in m['sections']] == [s['text'] for s in baseline[key]['sections']] and m['images'] == baseline[key]['images'], {'sections':len(m['sections']), 'images':len(m['images'])})
                    page.screenshot(path=str(args.output / f'{key}.png'), full_page=True)
                    if scenario == 'populated':
                        page.locator('section').filter(has=page.get_by_text(defaults['intro']['progress_title'], exact=True)).screenshot(path=str(args.output / f'{key}-intro.png'))
                    save(args.output / 'metrics.json', metrics)
                    save(args.output / 'assertions.json', results)
        if args.interactions_only:
            for width in WIDTHS:
                page.set_viewport_size({'width':width, 'height':900 if width != 390 else 844})
                if args.scope in ('contact', 'all'):
                    contact_interactions(page, base, state, width, args.output, check)
                if args.scope in ('about', 'intro', 'all'):
                    about_interactions(page, base, state, defaults, width, check)
            if args.scope in ('intro', 'all'):
                preview_checks(context, base, state, defaults, args.output, check)
        check('No page runtime errors', not runtime_errors, runtime_errors)
        check('No unexpected API mutations', not state['unexpected_writes'], state['unexpected_writes'])
        save(args.output / 'network.json', state)
        context.close()
        browser.close()
    save(args.output / 'assertions.json', results)
    failures = [r for r in results if not r['pass']]
    summary = {'cases':len(metrics), 'checks':len(results), 'failures':len(failures), 'failure_names':[r['name'] for r in failures], 'output':str(args.output)}
    save(args.output / 'summary.json', summary)
    print(json.dumps(summary, indent=2))
    raise SystemExit(bool(failures))


if __name__ == '__main__':
    main()
