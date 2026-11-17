"""Build first with bundle exec jekyll build; run this file with Python.

Verifies the rendered bilingual series, mobile layout, local asset links,
actual WebGL pixels, stage switching, orbit/reset, feature filters, and BA UI.
Screenshots are saved outside the publication tree in the system temp directory.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import gettempdir
from threading import Thread
import html
import re

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://127.0.0.1:4182'
SLUGS = ['reconstruction-intuition', 'sfm-bundle-adjustment', 'multi-view-stereo']


def inspect_html():
    for lang in ['zh', 'en']:
        index = BeautifulSoup((ROOT / f'_site/{lang}/series/3d-reconstruction/index.html').read_text(encoding='utf-8'), 'html.parser')
        links = [a['href'] for a in index.select('.series-reading-list__item a')]
        assert links == [f'/{lang}/{slug}/' for slug in SLUGS], links
        for slug in SLUGS:
            page = BeautifulSoup((ROOT / f'_site/{lang}/{slug}/index.html').read_text(encoding='utf-8'), 'html.parser')
            content = page.select_one('.page__content')
            assert content and content.select_one('[data-reconstruction]')
            assert '{{' not in str(content) and '{%' not in str(content)
            source = (ROOT / f'Reconstruction/_posts/2026-11-05-{slug}.{lang}.md').read_text(encoding='utf-8')
            rendered = (ROOT / f'_site/{lang}/{slug}/index.html').read_text(encoding='utf-8')
            for formula in re.findall(r'\$\$([\s\S]*?)\$\$', source):
                assert html.escape(formula.strip(), quote=False) in rendered, ('display math changed', lang, slug, formula)
            if lang == 'zh':
                english = (ROOT / f'Reconstruction/_posts/2026-11-05-{slug}.en.md').read_text(encoding='utf-8')
                equations = lambda text: [m for m in re.findall(r'\$\$([\s\S]*?)\$\$', text) if '\n' in m]
                assert equations(source) == equations(english), ('bilingual display equation drift', slug)
            for formula in re.findall(r'\$[^\n$]+\$', re.sub(r'\$\$[\s\S]*?\$\$', '', source)):
                assert html.escape(formula, quote=False) in rendered, ('inline math changed', lang, slug, formula)
            derivations = content.select('details.mv-derivation')
            assert len(derivations) == (3 if slug == 'multi-view-stereo' else 4)
            assert not content.select('p > details') and not content.select('details h2, details h3')
            for detail in derivations:
                assert not detail.has_attr('open') and detail.find('summary', recursive=False)
            assert not re.search(r'[？?]', ' '.join(h.get_text() for h in content.select('h2,h3')))
            other = 'en' if lang == 'zh' else 'zh'
            assert content.select_one(f'a[href="/{other}/{slug}/"]')
            for a in content.select('a[href^="/"]'):
                assert (ROOT / '_site' / a['href'].split('#')[0].lstrip('/')).exists(), a['href']
            for image in content.select('img[src^="/"]'):
                assert (ROOT / '_site' / image['src'].lstrip('/')).exists(), image['src']


def run():
    inspect_html()
    shots = Path(gettempdir()) / 'codex-reconstruction-qa'
    shots.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True,
            args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        page = browser.new_page(reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.route('**/*', lambda route: route.continue_() if route.request.url.startswith((BASE + '/', 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/')) else route.abort())
        for width in [390, 1440]:
            page.set_viewport_size({'width': width, 'height': 900})
            for lang in ['zh', 'en']:
                for slug in SLUGS:
                    assert page.goto(f'{BASE}/{lang}/{slug}/', wait_until='domcontentloaded').status == 200
                    page.wait_for_function('window.MathJax && MathJax.startup && MathJax.startup.promise && document.querySelector("mjx-container")', timeout=45000)
                    page.evaluate('MathJax.startup.promise')
                    assert page.locator('mjx-merror,[data-mjx-error]').count() == 0, ('math error', lang, slug, width)
                    # The narrative and its optional derivations must work both closed and open.
                    assert not page.locator('.mv-derivation[open]').count()
                    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), (lang, slug, width)
                    for detail in page.locator('.mv-derivation').all():
                        detail.locator('summary').click()
                        assert detail.locator('mjx-container').count() or slug == 'multi-view-stereo'
                        assert detail.evaluate('e => getComputedStyle(e).color') == 'rgb(34, 55, 70)', 'derivations must remain readable on their light background'
                    page.evaluate('MathJax.typesetPromise()')
                    assert page.locator('mjx-merror,[data-mjx-error]').count() == 0
                    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), ('expanded overflow', lang, slug, width)
                    if slug in ['reconstruction-intuition','sfm-bundle-adjustment']:
                        page.locator('.mv-derivation').nth(0 if slug == 'reconstruction-intuition' else 1).screenshot(path=str(shots / f'{lang}-{slug}-derivation-{width}.png'))
                    for detail in page.locator('.mv-derivation').all():
                        detail.locator('summary').click()
                    for fig in page.locator('[data-reconstruction]').all():
                        fig.scroll_into_view_if_needed()
                        page.wait_for_function('(f) => f.dataset.ready === "true"', arg=fig.element_handle())
                        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), (lang, slug, width)
                        assert fig.evaluate('(f) => f.scrollWidth <= f.clientWidth + 1')
                        kind = fig.get_attribute('data-reconstruction')
                        if kind == 'viewer':
                            mode = fig.locator('select').first
                            for stage in ['sparse', 'dense', 'mesh']:
                                mode.select_option(stage)
                                page.wait_for_function('([f, stage]) => f.dataset.mode === stage', arg=[fig.element_handle(), stage])
                                assert '244,247' in fig.locator('.mv-status').inner_text() if stage == 'mesh' else True
                                # Read the real rendered framebuffer. A cleared canvas has one RGB color.
                                count = fig.locator('canvas').evaluate('''c => {
                                  const gl=c.getContext('webgl'), a=new Uint8Array(c.width*c.height*4);
                                  gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,a);
                                  let n=0;for(let i=0;i<a.length;i+=4)if(a[i]>40||a[i+1]>45||a[i+2]>60)n++;
                                  return n;
                                }''')
                                assert count > 1000, (lang, slug, width, stage, count)
                            fig.screenshot(path=str(shots / f'{lang}-{slug}-{width}.png'))
                            canvas = fig.locator('canvas')
                            fig.locator('button').click()
                            fingerprint = '''c => {
                              const gl=c.getContext('webgl'),a=new Uint8Array(c.width*c.height*4);
                              gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,a);
                              let h=2166136261;for(const x of a)h=Math.imul(h^x,16777619);return h;
                            }'''
                            initial = canvas.evaluate(fingerprint)
                            initial_controls = fig.locator('input').evaluate_all('(a)=>a.map(x=>x.value)')
                            yaw = fig.locator('input[type=range]').nth(1)
                            yaw.fill('45'); yaw.dispatch_event('input')
                            assert canvas.evaluate(fingerprint) != initial, 'orbit must change pixels'
                            fig.locator('button').click()
                            assert yaw.input_value() == '0'
                            assert canvas.evaluate(fingerprint) == initial, ('reset must restore the original view', initial_controls, fig.locator('input').evaluate_all('(a)=>a.map(x=>x.value)'))
                        elif kind == 'features':
                            before = fig.locator('.mv-status').inner_text()
                            track = fig.locator('input[type=range]').nth(1)
                            track.fill('2'); track.dispatch_event('input')
                            assert before != fig.locator('.mv-status').inner_text()
                            fig.locator('select').select_option('outlier')
                            assert fig.locator('svg line[stroke-dasharray="8 5"]').count() > 0
                            fig.locator('select').select_option('all')
                            fig.screenshot(path=str(shots / f'{lang}-features-{width}.png'))
                        elif kind == 'sweep':
                            before = fig.locator('.mv-status').inner_text()
                            candidate = fig.locator('input[type=range]')
                            candidate.fill('0'); candidate.dispatch_event('input')
                            assert before != fig.locator('.mv-status').inner_text()
                            polygon = fig.locator('svg polygon').get_attribute('points')
                            candidate.fill('160'); candidate.dispatch_event('input')
                            assert polygon != fig.locator('svg polygon').get_attribute('points')
                            fig.locator('button').click()
                            assert candidate.input_value() not in ['0', '160']
                            metric = fig.locator('select').nth(2)
                            metric.select_option('ssd')
                            curve = fig.locator('.mv-cost-plot path')
                            original = curve.get_attribute('d')
                            fig.locator('input[type=checkbox]').check()
                            assert curve.get_attribute('d') != original, 'SSD must respond to exposure'
                            metric.select_option('ncc')
                            normalized = curve.get_attribute('d')
                            fig.locator('input[type=checkbox]').uncheck()
                            assert curve.get_attribute('d') == normalized, 'ZNCC must retain affine-exposure invariance'
                            fig.locator('select').first.select_option('sky')
                            assert 'Low texture' in fig.locator('.mv-status').inner_text() if lang == 'en' else '低纹理' in fig.locator('.mv-status').inner_text()
                            fig.locator('select').first.select_option('corner')
                            fig.locator('select').nth(1).select_option('21')
                            fig.locator('button').click()
                            assert '0.0176' in fig.locator('.mv-status').inner_text()
                            fig.screenshot(path=str(shots / f'{lang}-sweep-{width}.png'))
                            clipped = fig.locator('.mv-cost-plot').evaluate('''svg => [...svg.querySelectorAll('text')].filter(t => {
                              const b=t.getBBox(),v=svg.viewBox.baseVal;
                              return b.x<0||b.y<0||b.x+b.width>v.width||b.y+b.height>v.height;
                            }).map(t=>t.textContent)''')
                            assert not clipped, clipped
                            assert fig.locator('.mv-cost-plot').evaluate('svg => 12*svg.getBoundingClientRect().width/svg.viewBox.baseVal.width') >= 10, 'mobile chart labels must remain readable'
                        else:
                            before = fig.locator('.mv-status').inner_text()
                            step = fig.locator('input[type=range]')
                            step.fill(step.get_attribute('max')); step.dispatch_event('input')
                            assert before != fig.locator('.mv-status').inner_text()
                            assert '0.380' in fig.locator('.mv-status').inner_text()
                            fig.locator('button').click()
                            assert before == fig.locator('.mv-status').inner_text()
                            fig.screenshot(path=str(shots / f'{lang}-bundle-{width}.png'))
                    print('PASS', lang, slug, width, flush=True)
        assert not errors, errors
        browser.close()
    print('Verified 12 article views: real math rendering, collapsed/expanded derivations, responsive equations, 2 series indexes, and all interactive figures. Screenshots:', shots)


if __name__ == '__main__':
    class Handler(SimpleHTTPRequestHandler):
        extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.mjs': 'text/javascript', '.bin': 'application/octet-stream'}

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 4182), partial(Handler, directory=str(ROOT / '_site')))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        run()
    finally:
        server.shutdown()
        server.server_close()
