"""Read-only Chromium layout regressions; requires a running local Vite server.

Run: uv run --no-project --with playwright==1.64.1 python scripts/check-layout.py
API responses and remote images are test fixtures, never live backend data.
"""
import argparse
import json
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:5173')
parser.add_argument('--output', type=Path)
args = parser.parse_args()
BASE = args.base_url.rstrip('/')
if urlparse(BASE).hostname not in ('127.0.0.1', 'localhost'):
    parser.error('This fixture-based check is restricted to a local development server.')
OUT = args.output or Path(tempfile.mkdtemp(prefix='inotal-layout-'))
OUT.mkdir(parents=True, exist_ok=True)
CHROMIUM = shutil.which('chromium') or shutil.which('chromium-browser')
if not CHROMIUM:
    parser.error('Install Chromium first, or set it on PATH.')

SINGLETONS = ('/homepage/join-images', '/homepage/join-cards', '/homepage/services', '/about/intro', '/about/video-setting', '/about')
FIXTURE_IMG = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#c8e2ef"/><text x="40" y="70" fill="#0c4a6e" font-size="28">Gambar uji tata letak</text></svg>'

def intercept(route):
    req = route.request
    u = urlparse(req.url)
    # Do not intercept Vite source modules such as /src/api/about.js.
    if u.path.startswith('/api/'):
        if req.method != 'GET':
            raise AssertionError(f'Unexpected mutation: {req.method} {u.path}')
        stripped = u.path.removeprefix('/api').removeprefix('/public')
        data = None if stripped in SINGLETONS or stripped.startswith('/page-banners/') else []
        route.fulfill(json={'success': True, 'data': data, 'meta': {'total': 0, 'page': 1, 'limit': 10, 'total_pages': 0}})
    elif req.resource_type == 'image' and u.hostname not in ('127.0.0.1', 'localhost'):
        route.fulfill(content_type='image/svg+xml', body=FIXTURE_IMG)
    elif req.resource_type == 'document' and u.hostname not in ('127.0.0.1', 'localhost'):
        route.fulfill(content_type='text/html', body='<p>Konten eksternal tidak diuji.</p>')
    else:
        route.continue_()

results=[]
def check(name, condition, observed):
    results.append({'name':name,'pass':bool(condition),'observed':observed})

def admin(page,key):
    page.goto(BASE+'/?regression='+key+'#dashboard')
    page.wait_for_selector('main')
    if page.viewport_size['width']<1024:
        page.locator('button').filter(has=page.locator('svg.lucide-menu')).click()
    sidebar=page.locator('aside nav')
    for i,label in enumerate(nav[key]):
        buttons=sidebar.get_by_role('button',name=label,exact=True)
        if buttons.count()>1:
            buttons=sidebar.get_by_role('group',name=nav[key][i-1],exact=True).get_by_role('button',name=label,exact=True)
        buttons.click()
    page.wait_for_timeout(350)

def settle(page,route):
    page.goto(BASE+'/?regression=public#'+route)
    page.wait_for_timeout(400)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=CHROMIUM,headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
    context.route('**/*',intercept)
    context.add_init_script("localStorage.setItem('inotal_token','layout-fixture-not-a-real-token');localStorage.setItem('inotal_user',JSON.stringify({id:0,full_name:'Admin Uji Layout',email:'layout@example.test',role:'super_admin'}))")
    page=context.new_page()
    page.goto(BASE+'/#dashboard')
    page.wait_for_selector('main')
    nav = page.evaluate("""async()=>{
        const {navItems}=await import('/src/components/Sidebar.jsx');
        const out={};
        function walk(items,parents=[]){for(const i of items){
            const kids=i.subItems||i.subGroups||i.items;
            if(kids)walk(kids,[...parents,i.label]);else out[i.key]=[...parents,i.label];
        }}
        walk(navItems);return out;
    }""")
    for width in (1440,768,390):
        page.set_viewport_size({'width':width,'height':900})
        for key in ('program','partnership'):
            settle(page,key)
            box=page.locator('h1').bounding_box()
            check(f'{key} content starts below navbar without full-screen gap @{width}',80<=box['y']<=260,box)
        for key in ('company','settings'):
            admin(page,key)
            box=page.locator('main > div').first.bounding_box()
            check(f'{key} placeholder is content-sized @{width}',box['height']<=360,box)
        settle(page,'tentang')
        gap=page.locator('#root>div>section').evaluate_all('(s)=>parseFloat(getComputedStyle(s[1]).paddingBottom)+parseFloat(getComputedStyle(s[2]).paddingTop)')
        check(f'Tentang adjacent white sections use one spacing interval @{width}',gap<=(112 if width>=768 else 80),gap)
        if width in (768,390):
            toggle=page.get_by_role('button',name='Toggle menu',exact=True)
            check(f'Compact navbar available @{width}',toggle.is_visible(),toggle.is_visible())
            if toggle.is_visible():
                toggle.click()
                expect(page.locator('nav').first.get_by_role('button',name='Gabung',exact=True)).to_be_visible()
                box=page.locator('nav').first.get_by_role('button',name='Gabung',exact=True).bounding_box()
                check(f'Navbar CTA not clipped @{width}',box['x']+box['width']<=width,box)
                page.locator('nav').first.get_by_role('button',name='Gabung',exact=True).click()
                check(f'Navbar CTA still navigates @{width}',page.evaluate('location.hash')=='#register',page.evaluate('location.hash'))
    page.set_viewport_size({'width':390,'height':844})
    settle(page,'artikel')
    article=page.locator('article').first
    article.scroll_into_view_if_needed();page.wait_for_timeout(800)
    metrics=article.evaluate('e=>{const r=e.getBoundingClientRect();const img=e.querySelector("img").getBoundingClientRect();const t=e.querySelector("h3").getBoundingClientRect();return {width:r.width,imageWidth:img.width,imageBottom:img.bottom,textTop:t.top,overflow:e.scrollWidth-e.clientWidth}}')
    check('Artikel mobile stacks image above readable content',metrics['textTop']>=metrics['imageBottom'] and metrics['imageWidth']>=metrics['width']-4 and metrics['overflow']<=1,metrics)
    page.set_viewport_size({'width':1440,'height':900})
    admin(page,'createPost')
    page.get_by_role('button',name='Preview',exact=True).click()
    gap=page.locator('main').first.evaluate('e=>{const wrapper=e.firstElementChild;return wrapper.getBoundingClientRect().bottom-wrapper.lastElementChild.getBoundingClientRect().bottom}')
    check('Create Post preview has no viewport-height blank tail',gap<=32,gap)
    # Short desktop viewport: sticky panels must remain scrollable, not clip their lower content.
    page.set_viewport_size({'width':1440,'height':500})
    for key in ('aboutIntro','homeServices','homeJoinCards','homeJoinImages','bannerTentang'):
        admin(page,key)
        preview=page.locator('.editor-preview')
        if not preview.count():
            check(f'Short desktop preview @{key}',False,'missing editor-preview')
            continue
        page.locator('main').first.evaluate('e=>e.scrollTop=e.scrollHeight/2')
        page.wait_for_timeout(100)
        bounds=preview.bounding_box()
        main_bounds=page.locator('main').first.bounding_box()
        check(f'Preview stays beside form @{key}',bounds['y']>=main_bounds['y']-1 and bounds['y']+bounds['height']<=500,bounds)
        metrics=preview.evaluate('e=>({overflow:getComputedStyle(e).overflowY,height:e.clientHeight,content:e.scrollHeight,position:getComputedStyle(e).position})')
        check(f'Short desktop preview content accessible @{key}',metrics['position']=='sticky' and (metrics['content']<=metrics['height'] or metrics['overflow'] in ('auto','scroll')),metrics)
        preview.evaluate('e=>e.scrollTop=e.scrollHeight')
        reached=preview.evaluate('e=>e.scrollTop+e.clientHeight>=e.scrollHeight-1')
        check(f'Short desktop preview end reachable @{key}',reached,reached)
    context.close();browser.close()
(OUT/'regressions.json').write_text(json.dumps(results,indent=2))
print(json.dumps({'checks':len(results),'failures':[r for r in results if not r['pass']]},indent=2))
print(f'Report: {OUT / "regressions.json"}')
raise SystemExit(any(not r['pass'] for r in results))
