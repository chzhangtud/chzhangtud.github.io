"""Inspect a built site with a local MIME-correct server and real Chromium.

Run: python test/generative-pages.browser.py
Screenshots go to the system temporary directory, never docs/exports.
"""
from pathlib import Path
from tempfile import gettempdir
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import html
import re

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:4174"
SLUGS = ["diffusion-intuition", "denoising-diffusion", "diffusion-sampling", "score-based-models",
         "normalizing-flows", "flow-matching", "generative-geometry"]


def inspect_html():
    for lang in ("zh", "en"):
        for slug in SLUGS:
            path = ROOT / "_site" / lang / slug / "index.html"
            soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
            rendered = path.read_text(encoding="utf-8")
            source = (ROOT / "ProbabilisticModels/_posts" / f"2026-11-03-{slug}.{lang}.md").read_text(encoding="utf-8")
            without_display = re.sub(r"\$\$[\s\S]*?\$\$", "", source)
            for formula in re.findall(r"\$[^\n$]+\$", without_display):
                assert html.escape(formula, quote=False) in rendered, f"Markdown changed {formula}: {path}"
            for formula in re.findall(r"\$\$([\s\S]*?)\$\$", source):
                assert html.escape(formula.strip(), quote=False) in rendered, f"Markdown changed display math: {path}"
            content = soup.select_one(".page__content")
            assert content is not None, path
            assert content.select_one("h2"), path
            assert not content.select("p > details"), f"collapsed derivation escaped its block: {path}"
            assert "{%" not in str(content) and "{{" not in str(content), f"Liquid did not render: {path}"
            other = "en" if lang == "zh" else "zh"
            assert content.select_one(f'a[href="/{other}/{slug}/"]'), f"language switch: {path}"
            for anchor in content.select('a[href^="/"]'):
                target = ROOT / "_site" / anchor["href"].split("#")[0].lstrip("/")
                assert target.exists(), f"broken local link {anchor['href']}: {path}"
        index = BeautifulSoup((ROOT / "_site" / lang / "series/generative-models/index.html").read_text(encoding="utf-8"), "html.parser")
        assert len(index.select(".series-reading-list__item")) == 11


def main():
    inspect_html()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(reduced_motion="reduce")
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        # Keep the public MathJax CDN so real formulas, not just source TeX, are checked.
        page.route("**/*", lambda route: route.continue_() if route.request.url.startswith(
            (BASE + "/", "https://cdn.jsdelivr.net/")) else route.abort())
        screenshots = Path(gettempdir()) / "codex-generative-qa"
        screenshots.mkdir(exist_ok=True)
        for width in (390, 1440):
            page.set_viewport_size({"width": width, "height": 1000 if width == 1440 else 844})
            for lang in ("zh", "en"):
                for slug in SLUGS:
                    context = f"{lang}/{slug} @ {width}"
                    response = page.goto(f"{BASE}/{lang}/{slug}/", wait_until="domcontentloaded")
                    assert response.status == 200, context
                    page.wait_for_function("[...document.querySelectorAll('[data-generative]')].every(f => f.dataset.ready === 'true')")
                    page.wait_for_function("window.MathJax && MathJax.startup && MathJax.startup.promise && document.querySelector('mjx-container')", timeout=45000)
                    page.evaluate("MathJax.startup.promise")
                    assert page.locator("mjx-merror, [data-mjx-error]").count() == 0, context
                    assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"), context
                    # Optional derivations need the same math and mobile-width guarantees.
                    page.locator("details.generative-details").evaluate_all("nodes => nodes.forEach(d => d.open = true)")
                    assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1"), f"expanded details: {context}"
                    assert page.locator("mjx-merror, [data-mjx-error]").count() == 0, context
                    page.locator("details.generative-details").evaluate_all("nodes => nodes.forEach(d => d.open = false)")
                    issues = page.locator("[data-generative]").evaluate_all("""figures => figures.flatMap(f => {
                      const problems = [];
                      if (f.scrollWidth > f.clientWidth + 1) problems.push('figure overflow');
                      for (const svg of f.querySelectorAll('svg')) {
                        if (!svg.getBoundingClientRect().width) continue;
                        for (const label of svg.querySelectorAll('text')) {
                          const b = label.getBBox(), v = svg.viewBox.baseVal;
                          if (b.x < -1 || b.y < -1 || b.x + b.width > v.width + 1 || b.y + b.height > v.height + 1)
                            problems.push('clipped label: ' + label.textContent);
                        }
                      }
                      return problems;
                    })""")
                    assert not issues, (context, issues)
                    for figure in page.locator("[data-generative]").all():
                        before = figure.locator(".statistics-figure__readout").inner_text()
                        control = figure.locator("input").first
                        control.evaluate("i => { i.value = i.max; i.dispatchEvent(new Event('input', {bubbles:true})); }")
                        page.wait_for_timeout(80)
                        assert before != figure.locator(".statistics-figure__readout").inner_text(), context
                        if figure.locator('[role="tab"]').count() and width < 620:
                            tabs = figure.locator('[role="tab"]')
                            tabs.last.click()
                            assert tabs.last.get_attribute("aria-selected") == "true", context
                            assert figure.locator(".figure-panel:visible").count() == 1, context
                            tabs.last.press("ArrowLeft")
                            assert tabs.first.get_attribute("aria-selected") == "true", context
                        figure.locator("[data-reset]").click()
                        page.wait_for_timeout(50)
                        assert before == figure.locator(".statistics-figure__readout").inner_text(), context
                    if lang == "zh" and slug in ("diffusion-intuition", "flow-matching", "generative-geometry"):
                        page.locator("[data-generative]").first.screenshot(path=str(screenshots / f"{slug}-{width}.png"))
                    print(f"PASS {context}", flush=True)
            for lang in ("zh", "en"):
                page.goto(f"{BASE}/{lang}/series/probabilistic-graphical-models/", wait_until="domcontentloaded")
                page.wait_for_url(f"**/{lang}/series/generative-models/")
        assert not errors, errors
        browser.close()
        print(f"Verified 28 article views, formulas, controls, links, and redirects. Screenshots: {screenshots}")


if __name__ == "__main__":
    class Handler(SimpleHTTPRequestHandler):
        extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript"}

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 4174), partial(Handler, directory=str(ROOT / "_site")))
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        main()
    finally:
        server.shutdown()
        server.server_close()
