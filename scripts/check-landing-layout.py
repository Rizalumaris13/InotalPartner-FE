"""Landing-page geometry tests against local Vite with explicit API/image fixtures.
Run: uv run --no-project --with playwright==1.64.1 python scripts/check-landing-layout.py
"""
import argparse
import json
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path)
parser.add_argument('--baseline', action='store_true')
parser.add_argument('--widths', default='1440,768,390')
parser.add_argument('--modes', default='empty,single,populated,error')
args = parser.parse_args()
widths = [int(width) for width in args.widths.split(',')]
modes = args.modes.split(',')
out = args.output or Path(tempfile.mkdtemp(prefix='inotal-landing-'))
out.mkdir(parents=True, exist_ok=True)
base = 'http://127.0.0.1:5173'
image = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#c8e2ef"/><path d="M0 500L270 220L510 430L700 190L900 430V600H0Z" fill="#3e93b6"/><text x="40" y="70" fill="#0c4a6e" font-size="28">Gambar uji tata letak</text></svg>'
fixture_url = 'https://layout.example.test/image.svg'
results=[]


def handler(mode):
    count = 1 if mode == 'single' else 5 if mode == 'populated' else 0
    posts = [{'id':i, 'title':f'Kolaborasi Digital {i}', 'excerpt':'Konten uji untuk mengukur tata letak, bukan data resmi.', 'slug':f'uji-{i}', 'thumbnail_url':fixture_url, 'created_at':'2026-01-10T00:00:00Z', 'event_date':'2026-01-10', 'event_time':'10:00', 'event_location':'Bandung', 'categories':[{'name':'Kolaborasi'}]} for i in range(1,count+1)]
    def route_request(route):
        request=route.request; path=urlparse(request.url).path
        if path.startswith('/api/'):
            assert request.method=='GET', f'Unexpected mutation: {request.method} {path}'
            if mode=='error':
                route.fulfill(status=503,json={'success':False,'message':'Konten belum dapat dimuat.'});return
            if path.endswith(('/public/news','/public/events','/public/articles')):
                data={'data':posts,'total':len(posts),'page':1,'limit':9,'total_pages':1}
            elif path.endswith('/homepage/banners'):
                data=[{'id':1,'title':'Bertumbuh Bersama INOTAL','background_image':fixture_url,'is_active':True,'order':1,'buttons':[{'label':'Gabung','url':'#register'}]}] if count else []
            elif path.endswith('/testimonials'):
                data=[{'id':i,'name':f'Mitra Uji {i}','photo_url':fixture_url,'content':'Kolaborasi yang membantu tim kami tumbuh bersama.','position':'Pengelola','company':'Tim Uji'} for i in range(1,count+1)]
            elif path.endswith('/homepage/partners'):
                data=[{'id':i,'name':f'Mitra {i}','logo_url':fixture_url,'website_url':'','sort_order':i,'is_active':True} for i in range(1,count+1)]
            else:
                data=None
            route.fulfill(json={'success':True,'data':data})
        elif request.resource_type=='image':
            route.fulfill(content_type='image/svg+xml',body=image)
        else:
            route.continue_()
    return route_request


with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
    for width in widths:
        for mode in modes:
            context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
            context.route('**/*',handler(mode))
            page=context.new_page(); errors=[]
            page.on('pageerror',lambda error: errors.append(str(error)))
            # Hold autoplay still while measuring the last carousel page.
            frozen=datetime(2026,1,10,tzinfo=timezone.utc)
            page.clock.install(time=frozen);page.clock.pause_at(frozen)
            page.goto(base)
            page.wait_for_selector('h1')
            page.wait_for_timeout(350)
            sections=page.locator('#root > div > section')
            metrics=sections.evaluate_all('''es=>es.map(e=>{const c=getComputedStyle(e);const r=e.getBoundingClientRect();return {heading:e.querySelector('h1,h2')?.innerText,top:r.top,height:r.height,paddingTop:parseFloat(c.paddingTop),paddingBottom:parseFloat(c.paddingBottom),text:e.innerText}})''')
            failures=[]
            if len(metrics)!=9:failures.append(f'Expected 9 sections, got {len(metrics)}')
            limit=64 if width>=768 else 48
            for i,s in enumerate(metrics[1:],1):
                if max(s['paddingTop'],s['paddingBottom'])>limit:
                    failures.append(f'Section {i}: excessive padding {s["paddingTop"]}/{s["paddingBottom"]}')
            for left,right in ((2,3),(4,5),(5,6),(7,8)):
                gap=metrics[left]['paddingBottom']+metrics[right]['paddingTop']
                if gap>limit:failures.append(f'Adjacent same-background sections {left}/{right}: gap {gap}')
            if mode in ('empty','error'):
                for i in (2,3,4,5,7):
                    section=sections.nth(i)
                    status=section.locator('p').last
                    height=status.evaluate('e=>e.parentElement.getBoundingClientRect().height')
                    # Partner status is itself the padded element.
                    if i==5:height=status.evaluate('e=>e.getBoundingClientRect().height')
                    if height>104:failures.append(f'Section {i}: oversized status area {height}')
            carousels=[]
            if mode in ('single','populated'):
                for i in (2,3,4):
                    section=sections.nth(i); track=section.locator('div[style*="translateX"]')
                    page.mouse.move(0,0)
                    geometry=track.evaluate('''e=>{const r=e.parentElement.getBoundingClientRect();const first=e.firstElementChild.getBoundingClientRect();return {viewport:r.width,card:first.width,gap:parseFloat(getComputedStyle(e).gap)}}''')
                    desired=1 if width<640 else 2 if width<1024 else 3
                    if i==4:desired=1 if width<1024 else 2
                    per_view=min(1 if mode=='single' else 5,desired)
                    expected=(geometry['viewport']-geometry['gap']*(per_view-1))/per_view
                    if abs(geometry['card']-expected)>2:
                        failures.append(f'Section {i}: card width {geometry["card"]:.1f}, expected {expected:.1f}')
                    if mode=='populated':
                        if i==4:
                            dots=section.get_by_role('button',name='Ke slide',exact=False)
                            if dots.count():dots.last.click()
                        else:
                            next_button=section.locator(':scope > div > div:first-child button').nth(1)
                            for _ in range(6):
                                if not next_button.is_enabled():break
                                next_button.click();page.wait_for_timeout(30)
                        page.wait_for_timeout(800)
                        tail=track.evaluate('e=>e.parentElement.getBoundingClientRect().right-e.lastElementChild.getBoundingClientRect().right')
                        if abs(tail)>2:failures.append(f'Section {i}: blank/cropped tail {tail:.1f}px')
                    carousels.append({'section':i,**geometry,'expectedWidth':expected})
                if mode=='single':
                    card_height=sections.nth(3).locator('div[style*="translateX"]').evaluate('e=>e.firstElementChild.getBoundingClientRect().height')
                    if width>=768 and card_height>520:
                        failures.append(f'Single article image makes an oversized card: {card_height:.1f}px')
                    news=sections.nth(7)
                    grid=news.locator('div.grid')
                    blank=grid.evaluate('e=>e.getBoundingClientRect().width-e.firstElementChild.getBoundingClientRect().width')
                    if blank>2:failures.append(f'News leaves empty column: {blank:.1f}px')
            if mode=='populated' and width==390:
                # The last mobile slide must clamp to the final full desktop page.
                page.set_viewport_size({'width':1440,'height':900})
                page.wait_for_timeout(900)
                for i in (2,3,4):
                    track=sections.nth(i).locator('div[style*="translateX"]')
                    tail=track.evaluate('e=>e.parentElement.getBoundingClientRect().right-e.lastElementChild.getBoundingClientRect().right')
                    if abs(tail)>2:failures.append(f'Section {i}: resize leaves blank tail {tail:.1f}px')
                testimonial=sections.nth(4).locator('div[style*="translateX"]')
                page.clock.run_for(5100)
                page.wait_for_timeout(800)
                start=testimonial.evaluate('e=>e.firstElementChild.getBoundingClientRect().left-e.parentElement.getBoundingClientRect().left')
                if abs(start)>2:failures.append(f'Testimonial autoplay fails to wrap: {start:.1f}px')
                page.set_viewport_size({'width':width,'height':900})
                page.wait_for_timeout(900)
            if errors:failures.extend(errors)
            row={'width':width,'mode':mode,'sections':metrics,'carousels':carousels,'pageHeight':page.evaluate('document.documentElement.scrollHeight'),'failures':failures}
            results.append(row)
            (out/f'{width}-{mode}.json').write_text(json.dumps(row,indent=2))
            page.mouse.move(0,0);page.evaluate('window.scrollTo(0,0)')
            page.screenshot(path=str(out/f'{width}-{mode}.png'),full_page=True)
            print(json.dumps({'width':width,'mode':mode,'height':row['pageHeight'],'failures':failures}),flush=True)
            context.close()
    browser.close()
(out/'results.json').write_text(json.dumps(results,indent=2))
assert len(results)==len(widths)*len(modes)
raise SystemExit(not args.baseline and any(r['failures'] for r in results))
