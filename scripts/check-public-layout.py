"""Read-only public layout regression using local API/image fixtures.

Run with uv run --no-project --with playwright==1.64.1 python scripts/check-public-layout.py
The baseline flag records current failures without treating them as a successful audit.
"""
import argparse
import json
import shutil
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

PAGES = ('tentang', 'program', 'event', 'berita', 'artikel', 'partnership', 'kontak', 'berita/layout-1')
WIDTHS = (1440, 1024, 768, 390)
IMAGE = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="900" height="600" fill="#c8e2ef"/><path d="M0 500L270 220L510 430L700 190L900 430V600H0Z" fill="#3e93b6"/><text x="40" y="70" fill="#0c4a6e" font-size="28">Gambar uji tata letak</text></svg>'
IMAGE_URL = 'https://layout.example.test/image.svg'
POSTS = [{
    'id': i, 'title': f'Kolaborasi Digital {i}', 'slug': f'layout-{i}',
    'excerpt': 'Konten uji tata letak, bukan berita resmi.',
    'content': '<p>Paragraf pengujian tata letak berita.</p><p>Konten tetap bisa dibaca di semua ukuran layar.</p>',
    'thumbnail_url': IMAGE_URL, 'published_at': '2026-01-10T00:00:00Z',
    'created_at': '2026-01-10T00:00:00Z', 'view_count': i,
    'categories': [{'id': 1, 'name': 'Kolaborasi'}], 'tags': [],
} for i in range(1, 6)]


def intercept(route):
    request = route.request
    url = urlparse(request.url)
    if url.path.startswith('/api/'):
        if request.method != 'GET':
            raise AssertionError(f'Unexpected mutation: {request.method} {url.path}')
        if url.path == '/api/public/news/layout-1':
            data = POSTS[0]
        elif url.path in ('/api/public/news', '/api/public/popular/news'):
            data = {'data': POSTS, 'total': len(POSTS), 'page': 1, 'limit': 100, 'total_pages': 1}
        elif url.path.endswith(('/team', '/faqs', '/video', '/video-highlights', '/cards')):
            data = []
        else:
            data = None
        route.fulfill(json={'success': True, 'data': data})
    elif request.resource_type == 'image':
        route.fulfill(content_type='image/svg+xml', body=IMAGE)
    elif url.hostname not in ('127.0.0.1', 'localhost'):
        route.fulfill(content_type='text/html', body='<p>Konten eksternal tidak diuji.</p>')
    else:
        route.continue_()


def measure(page):
    return page.evaluate('''() => {
      const box = e => { const r=e.getBoundingClientRect(); const s=getComputedStyle(e);
        return {left:r.left, right:r.right, top:r.top+scrollY, width:r.width, height:r.height,
          paddingTop:parseFloat(s.paddingTop), paddingBottom:parseFloat(s.paddingBottom)}; };
      const shown = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
      const sections=[...document.querySelectorAll('#root > div > section, #root > div > main')];
      return {
        height:document.documentElement.scrollHeight,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        text:document.querySelector('#root').innerText,
        images:[...document.images].map(e=>({src:e.getAttribute('src'),alt:e.alt})),
        sections:sections.map(e=>({...box(e),heading:e.querySelector('h1,h2')?.textContent})),
        controls:[...document.querySelectorAll('button,input,select,textarea,a')].filter(shown)
          .map(e=>({...box(e),text:e.textContent.trim().slice(0,60)}))
          .filter(e=>e.left < -1 || e.right > innerWidth+1),
      };
    }''')


def check_event(page, width, failures):
    sections = page.locator('#root > div > section')
    for i in (1, 2):
        padding = sections.nth(i).evaluate('e=>parseFloat(getComputedStyle(e).paddingTop)')
        if padding > (64 if width >= 768 else 48):
            failures.append(f'Event section {i}: excessive top padding {padding}')
    featured = page.locator('#daftar-event article').first
    text_width = featured.locator('h2').evaluate('e=>e.getBoundingClientRect().width')
    if text_width < min(260, width - 98):
        failures.append(f'Featured event text squeezed to {text_width}px')
    for heading in page.locator('#daftar-event article h3').all():
        text_width = heading.evaluate('e=>e.getBoundingClientRect().width')
        if text_width < min(280, width - 48):
            failures.append(f'Event row text squeezed to {text_width}px')
            break
    banner_title_width = sections.nth(1).locator('h3').evaluate('e=>e.getBoundingClientRect().width')
    if width >= 640 and banner_title_width < 280:
        failures.append(f'Next event title squeezed to {banner_title_width}px')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://127.0.0.1:5173')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--pages', nargs='+', choices=PAGES, default=PAGES)
    parser.add_argument('--widths', type=int, nargs='+', default=WIDTHS)
    parser.add_argument('--baseline', action='store_true')
    args = parser.parse_args()
    if urlparse(args.base_url).hostname not in ('127.0.0.1', 'localhost'):
        parser.error('Only local development servers are permitted.')
    chromium = shutil.which('chromium') or shutil.which('chromium-browser')
    if not chromium:
        parser.error('Chromium must be installed.')
    out = args.output or Path(tempfile.mkdtemp(prefix='inotal-public-layout-'))
    out.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chromium, headless=True, args=['--no-sandbox'])
        for width in args.widths:
            for name in args.pages:
                context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce')
                context.route('**/*', intercept)
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto(f'{args.base_url}/#{name}')
                page.wait_for_selector('h1')
                # Allow the app's reveal fallback to run; this is not a data assertion.
                page.wait_for_timeout(1600)
                page.add_style_tag(content='*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}')
                metrics = measure(page)
                failures = list(errors)
                if metrics['overflow'] > 1:
                    failures.append(f'Document overflow: {metrics["overflow"]}px')
                if metrics['controls']:
                    failures.append(f'Controls outside viewport: {metrics["controls"]}')
                if name == 'event':
                    check_event(page, width, failures)
                if name in ('program', 'partnership'):
                    card = page.locator('h1').locator('..')
                    if card.bounding_box()['height'] > 360:
                        failures.append('Placeholder card has excessive height')
                    if not card.get_by_text('Halaman ini sedang dalam pengembangan.', exact=True).count():
                        failures.append('Placeholder status missing')
                key = name.replace('/', '-')
                page.screenshot(path=str(out / f'{key}-{width}.png'), full_page=True)
                # Mobile navigation must remain reachable in a short landscape viewport.
                if name == 'event' and width == 390:
                    page.set_viewport_size({'width': width, 'height': 360})
                    page.get_by_role('button', name='Toggle menu', exact=True).click()
                    signup = page.locator('nav').first.get_by_role('button', name='Gabung', exact=True)
                    signup.scroll_into_view_if_needed()
                    bounds = signup.bounding_box()
                    if bounds['y'] + bounds['height'] > page.viewport_size['height']:
                        failures.append(f'Mobile menu CTA clipped on short screen: {bounds}')
                row = {'page': name, 'width': width, **metrics, 'failures': failures}
                results.append(row)
                (out / f'{key}-{width}.json').write_text(json.dumps(row, ensure_ascii=False, indent=2))
                print(json.dumps({'page': name, 'width': width, 'height': metrics['height'], 'failures': failures}), flush=True)
                context.close()
        browser.close()
    (out / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
    assert len(results) == len(args.pages) * len(args.widths)
    return 0 if args.baseline else int(any(row['failures'] for row in results))


if __name__ == '__main__':
    raise SystemExit(main())
