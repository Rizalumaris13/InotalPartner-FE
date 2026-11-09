"""Editorial layout regression against local Vite; never reaches the real API.

uv run --offline --no-project --with playwright==1.64.1 python scripts/editorial-layout.py
The image and news responses are explicitly labelled local QA fixtures. Artikel
continues to use its actual static data module, including filtering/pagination.
"""
import argparse
import json
import shutil
import tempfile
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

IMAGE_URL = 'https://editorial.example.test/layout.svg'
IMAGE = '''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720"><rect width="1200" height="720" fill="#d2e6ef"/><path d="M0 610L300 260L540 460L870 210L1200 500V720H0Z" fill="#4494b5"/><text x="36" y="66" font-family="sans-serif" font-size="30" fill="#0c4a6e">Gambar fixture QA editorial</text></svg>'''
POSTS = [
    {
        'id': index,
        'slug': f'editorial-uji-{index}',
        'title': f'Kolaborasi Digital {index}: Peluang Belajar dan Bertumbuh Bersama Mitra',
        'excerpt': 'Konten fixture pengujian tata letak. Program kolaborasi membantu tim mengembangkan keterampilan dan berbagi pengalaman.',
        'thumbnail_url': IMAGE_URL if index != 2 else '',
        'published_at': f'2026-10-{index:02d}T09:30:00+07:00',
        'created_at': f'2026-10-{index:02d}T09:30:00+07:00',
        'view_count': index * 101,
        'category_id': index % 3 + 1,
        'category': {'id': index % 3 + 1, 'name': ['Teknologi', 'Kolaborasi', 'Program'][index % 3]},
        'categories': [{'id': index % 3 + 1, 'name': ['Teknologi', 'Kolaborasi', 'Program'][index % 3]}],
        'tags': [{'id': 1, 'name': 'Kolaborasi', 'slug': 'kolaborasi'}],
        'content': '<p>Konten fixture QA editorial, bukan publikasi resmi. Kolaborasi membantu mitra berbagi pengalaman dan mengembangkan keterampilan bersama.</p><h2>Belajar dari pengalaman bersama</h2><p>Program ini menghubungkan tim dengan kebutuhan yang berbeda. Setiap peserta dapat menyampaikan ide dan ikut membangun cara kerja yang lebih jelas.</p><ul><li>Menyepakati tujuan bersama.</li><li>Mencatat hasil dan tindak lanjut.</li></ul><h3>Langkah selanjutnya</h3><p>Seluruh informasi berikut merupakan bahan uji tampilan. Teks, gambar, kategori, dan navigasi harus tetap dapat dibaca pada layar kecil.</p>',
    }
    for index in range(1, 13)
]


def fixture_handler(mode, requests, blocked, held=None):
    posts = POSTS[:1] if mode == 'single' else [] if mode in ('empty', 'error') else POSTS

    def handle(route):
        request = route.request
        path = urlparse(request.url).path
        if path.startswith('/api/'):
            requests.append({'method': request.method, 'path': path, 'query': parse_qs(urlparse(request.url).query)})
            if request.method != 'GET':
                blocked.append(f'{request.method} {path}')
                route.fulfill(status=405, json={'success': False, 'message': 'Mutation blocked by editorial QA'})
                return
            if mode == 'loading' and (path == '/api/public/news' or path.startswith('/api/public/news/') or path == '/api/public/popular/news'):
                held.append(route)
                return  # Released after the loading screenshot, before context cleanup.
            if path == '/api/public/news':
                if mode in ('error', 'related-error'):
                    route.fulfill(status=503, json={'success': False, 'message': 'Berita fixture belum dapat dimuat.'})
                    return
                data = {'data': posts, 'total': len(posts), 'page': 1, 'limit': 100, 'total_pages': 1}
            elif path == '/api/public/popular/news':
                if mode in ('error', 'popular-error'):
                    route.fulfill(status=503, json={'success': False, 'message': 'Populer fixture belum dapat dimuat.'})
                    return
                data = {'data': sorted(posts, key=lambda post: -post['view_count']), 'total': len(posts)}
            elif path.startswith('/api/public/news/'):
                if mode in ('empty', 'error'):
                    route.fulfill(status=404 if mode == 'empty' else 503, json={'success': False, 'message': 'Detail fixture belum dapat dimuat.'})
                    return
                slug = path.rsplit('/', 1)[-1]
                data = next((post for post in POSTS if post['slug'] == slug), None)
            else:
                data = None  # Public banner fallback, no invented public records.
            route.fulfill(json={'success': True, 'data': data})
        elif request.resource_type == 'image':
            route.fulfill(content_type='image/svg+xml', body=IMAGE)
        else:
            route.continue_()

    return handle


METRICS = r'''kind => {
  const rect = e => { if (!e) return null; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,paddingTop:parseFloat(s.paddingTop),paddingBottom:parseFloat(s.paddingBottom),paddingLeft:parseFloat(s.paddingLeft),paddingRight:parseFloat(s.paddingRight),gap:s.gap,position:s.position}; };
  const list = document.querySelector(kind === 'artikel' ? '#daftar-artikel' : '#daftar-berita');
  const section = kind === 'detail' ? document.querySelector('main') : list?.closest('section');
  const grid = section?.firstElementChild;
  const aside = section?.querySelector('aside');
  const hero = kind === 'detail' ? null : document.querySelector('#root > div > section');
  const articles = section ? [...section.querySelectorAll(kind === 'detail' ? 'article' : '[id^="daftar-"] article')] : [];
  const cards = articles.map(a => {
    const image = a.querySelector('img'); const title = a.querySelector(kind === 'detail' ? 'h1' : 'h3');
    return {rect:rect(a),image:rect(image || (kind === 'berita' ? a.firstElementChild : null)),title:rect(title),titleText:title?.textContent,body:rect(kind === 'detail' ? a.querySelector('[class*="leading-"]') : a.lastElementChild),text:a.innerText,images:[...a.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.alt,decoded:i.complete && i.naturalWidth>0}))};
  });
  const statusText = [...document.querySelectorAll('p,h1')].find(e=>/^(Memuat berita\.\.\.|Nggak ada hasilnya|Gagal memuat berita|Berita Tidak Ditemukan)$/.test(e.textContent.trim()));
  const status = statusText?.parentElement;
  const clipped = section ? [...section.querySelectorAll('input,button,h1,h2,h3,h4,p,span')].filter(e => {
    const r=e.getBoundingClientRect(); if (!r.width || !r.height) return false;
    if (r.left < -1 || r.right > innerWidth+1) return true;
    if (getComputedStyle(e).webkitLineClamp !== 'none') return false;
    let p=e.parentElement;
    while(p && p!==section) {const s=getComputedStyle(p); if(s.overflowX==='hidden'){ const pr=p.getBoundingClientRect();if(r.left<pr.left-1 || r.right>pr.right+1)return true;}p=p.parentElement;}
    return false;
  }).map(e=>({tag:e.tagName,text:e.textContent,rect:rect(e)})) : [];
  return {hero:rect(hero),section:rect(section),grid:rect(grid),list:rect(list),aside:rect(aside),cards,status:rect(status),statusText:status?.innerText,overflow:document.documentElement.scrollWidth-innerWidth,clipped,headings:[...document.querySelectorAll('h1,h2,h3,h4')].map(e=>e.textContent),bodyText:section?.innerText || status?.innerText,documentHeight:document.documentElement.scrollHeight};
}'''


def layout_failures(data, kind, mode, width, checks):
    failures = []
    section, aside, cards = data['section'], data['aside'], data['cards']
    if 'readability' in checks and section:
        if width < 1280 and aside and cards:
            end = max(card['rect']['bottom'] for card in cards)
            if aside['y'] < end:
                failures.append(f'Tablet sidebar crowds reading column: sidebar y={aside["y"]:.1f}, cards end={end:.1f}')
        for index, card in enumerate(cards):
            minimum = 320 if kind == 'artikel' and width >= 768 else 260
            if card['title']['width'] < minimum:
                failures.append(f'Card {index + 1} title width {card["title"]["width"]:.1f}px < {minimum}px')
            # A lone desktop card is horizontal: text determines its image height.
            horizontal = kind == 'berita' and mode == 'single' and width >= 768
            if kind == 'berita' and not horizontal and card['image'] and card['image']['height'] > card['image']['width'] * .8:
                failures.append(f'Card {index + 1} thumbnail is too tall: {card["image"]["width"]:.1f}x{card["image"]["height"]:.1f}')
            if horizontal and card['rect']['height'] > 520:
                failures.append(f'Single news card too tall: {card["rect"]["height"]:.1f}px')
            if kind == 'artikel' and card['rect']['height'] > 590:
                failures.append(f'Article row {index + 1} too tall: {card["rect"]["height"]:.1f}px')
        if data['overflow'] > 1:
            failures.append(f'Document overflow {data["overflow"]}px')
        if data['clipped']:
            failures.append(f'Editorial content is clipped/out of bounds: {data["clipped"]}')
    if 'rhythm' in checks and section:
        limit = 64 if width >= 768 else 48
        if max(section['paddingTop'], section['paddingBottom']) > limit:
            failures.append(f'Section padding {section["paddingTop"]}/{section["paddingBottom"]} > {limit}px')
        gap = float(data['grid']['gap'].split('px')[0])
        if gap > (40 if width >= 1280 else 32):
            failures.append(f'Content/sidebar gap {gap}px exceeds section rhythm')
    if 'states' in checks:
        if data['status'] and max(data['status']['paddingTop'], data['status']['paddingBottom']) > (64 if kind == 'detail' and width >= 768 else 48):
            failures.append(f'Oversized status padding {data["status"]["paddingTop"]}/{data["status"]["paddingBottom"]}px')
        if kind == 'berita' and mode == 'single' and cards:
            blank = data['list']['width'] - cards[0]['rect']['width']
            if blank > 2:
                failures.append(f'Single news card leaves unused column: {blank:.1f}px')
    return failures


def prepare(page, kind, mode):
    if kind == 'artikel':
        page.wait_for_selector('#daftar-artikel article')
        if mode == 'empty':
            page.get_by_placeholder('Cari judul, isi, tag, atau penulis...').fill('tidak-ada-hasil-editorial-uji')
            page.get_by_text('Nggak ada hasilnya', exact=True).wait_for()
        elif mode == 'single':
            title = page.locator('#daftar-artikel article h3').first.inner_text()
            page.get_by_placeholder('Cari judul, isi, tag, atau penulis...').fill(title)
            page.wait_for_function('document.querySelectorAll("#daftar-artikel article").length === 1')
    elif mode == 'loading':
        page.get_by_text('Memuat berita...', exact=True).wait_for()
    elif kind == 'berita':
        if mode == 'empty':
            page.get_by_text('Nggak ada hasilnya', exact=True).wait_for()
        elif mode == 'error':
            page.get_by_text('Gagal memuat berita', exact=True).wait_for()
        else:
            page.wait_for_selector('#daftar-berita article')
    elif mode in ('empty', 'error'):
        page.get_by_role('heading', name='Berita Tidak Ditemukan', exact=True).wait_for()
    else:
        page.wait_for_selector('main article h1')
    page.add_style_tag(content='*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}')
    page.evaluate('document.querySelectorAll("img[loading=lazy]").forEach(i=>i.loading="eager")')
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(850)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='http://127.0.0.1:5173')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--widths', default='1440,1024,768,390')
    parser.add_argument('--pages', default='berita,artikel,detail')
    parser.add_argument('--modes', default='populated,single,empty,error,loading')
    parser.add_argument('--checks', default='readability,rhythm,states')
    parser.add_argument('--compare', type=Path, help='Baseline results.json for hero/content preservation')
    args = parser.parse_args()
    if urlparse(args.base).hostname not in ('127.0.0.1', 'localhost'):
        parser.error('Only loopback Vite URLs are allowed.')
    widths = [int(value) for value in args.widths.split(',')]
    modes = args.modes.split(',')
    checks = args.checks.split(',')
    pages = args.pages.split(',')
    out = args.output or Path(tempfile.mkdtemp(prefix='editorial-layout-'))
    out.mkdir(parents=True, exist_ok=True)
    baseline = json.loads(args.compare.read_text()) if args.compare else []
    baseline_map = {(row['page'], row['width'], row['mode']): row for row in baseline}
    rows = []
    expected = sum(1 for _ in widths for kind in pages for mode in modes if kind != 'artikel' or mode in ('populated', 'single', 'empty'))
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=shutil.which('chromium'), headless=True, args=['--no-sandbox'])
        for width in widths:
            for kind in pages:
                for mode in modes:
                    if kind == 'artikel' and mode not in ('populated', 'single', 'empty'):
                        continue
                    context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce', service_workers='block')
                    requests, blocked, errors, held = [], [], [], []
                    context.route('**/*', fixture_handler(mode, requests, blocked, held))
                    page = context.new_page()
                    page.set_default_timeout(15000)
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    key = f'{kind}-{width}-{mode}'
                    route = 'berita/editorial-uji-1' if kind == 'detail' else kind
                    try:
                        page.goto(f'{args.base}/#{route}', wait_until='domcontentloaded')
                        prepare(page, kind, mode)
                        data = page.evaluate(METRICS, kind)
                        failures = layout_failures(data, kind, mode, width, checks)
                        if mode == 'populated':
                            expected_cards = 6 if kind == 'artikel' else 10 if kind == 'berita' else 1
                            if len(data['cards']) != expected_cards:
                                failures.append(f'Fixture/content count {len(data["cards"])} != {expected_cards}')
                        if mode == 'single' and len(data['cards']) != 1:
                            failures.append(f'Expected one card, got {len(data["cards"])}')
                        if mode in ('empty', 'error', 'loading') and data['cards']:
                            failures.append('A data/status error was masked by content')
                        old = baseline_map.get((kind, width, mode))
                        if old:
                            if data['hero'] != old['metrics']['hero']:
                                failures.append('Accepted public hero geometry changed')
                            if data['bodyText'] != old['metrics']['bodyText']:
                                failures.append('Public text changed from baseline')
                            old_images = [card['images'] for card in old['metrics']['cards']]
                            new_images = [card['images'] for card in data['cards']]
                            if old_images != new_images:
                                failures.append('Public card image sources changed from baseline')
                        failures.extend(errors)
                        failures.extend(f'Blocked unexpected mutation: {item}' for item in blocked)
                        row = {'page': kind, 'width': width, 'mode': mode, 'metrics': data, 'requests': requests, 'failures': failures}
                        page.screenshot(path=str(out / f'{key}.png'), full_page=True)
                        section = page.locator('main' if kind == 'detail' else f'#daftar-{kind}').first
                        if section.count():
                            box = section.bounding_box()
                            page.evaluate('(top)=>window.scrollTo(0,top)', max(0, box['y'] - 96))
                            page.screenshot(path=str(out / f'{key}-content.png'))
                    except Exception as error:
                        row = {'page': kind, 'width': width, 'mode': mode, 'failures': [repr(error)], 'requests': requests}
                        page.screenshot(path=str(out / f'{key}-error.png'), full_page=True)
                    (out / f'{key}.json').write_text(json.dumps(row, indent=2, ensure_ascii=False))
                    rows.append(row)
                    (out / 'results.json').write_text(json.dumps(rows, indent=2, ensure_ascii=False))
                    print(json.dumps({'case': key, 'failures': row['failures']}, ensure_ascii=False), flush=True)
                    for held_route in held:
                        held_route.abort()
                    context.unroute_all(behavior='wait')
                    context.close()
        browser.close()
    assert len(rows) == expected, f'Incomplete matrix: {len(rows)} of {expected}'
    print(json.dumps({'cases': len(rows), 'failed': sum(bool(row['failures']) for row in rows), 'output': str(out)}))
    raise SystemExit(any(row['failures'] for row in rows))


if __name__ == '__main__':
    main()
