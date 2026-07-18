# Vanta Birds Full-Site Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark, full-site Vanta Birds background with stronger pointer avoidance, readable translucent content surfaces, and robust motion/WebGL fallbacks.

**Architecture:** The default layout renders one fixed background host. A focused UMD initializer owns capability checks, responsive Vanta options, lifecycle, and fallback classes; a locally vendored Vanta Birds build adds configurable predator radius and strength shader uniforms. A dedicated Sass partial owns all visual integration with Minimal Mistakes.

**Tech Stack:** Jekyll, Liquid, Sass, vanilla JavaScript, Three.js r134, Vanta Birds 0.5.24, Node.js built-in test runner

---

## File Structure

- Create `test/vanta-birds-background.test.js`: executable contract tests for layout, initializer behavior, shader extension, and styles.
- Create `assets/js/vanta-birds-background.js`: capability checks, responsive options, initialization, fallback, and cleanup.
- Create `assets/js/vanta.birds.enhanced.min.js`: upstream Vanta Birds 0.5.24 distribution with predator uniforms added. This path stays outside the `assets/js/vendor` directory excluded by Jekyll configuration.
- Create `_sass/_birds-background.scss`: fixed canvas and dark translucent Minimal Mistakes integration.
- Modify `_layouts/default.html`: render one background host.
- Modify `_includes/scripts.html`: load Three.js, enhanced Birds, and initializer with `defer`.
- Modify `assets/css/main.scss`: import the dedicated background partial after the theme.

### Task 1: Layout And Initializer Contract

**Files:**
- Create: `test/vanta-birds-background.test.js`
- Create: `assets/js/vanta-birds-background.js`
- Modify: `_layouts/default.html`
- Modify: `_includes/scripts.html`

- [ ] **Step 1: Write failing layout and initializer tests**

Create tests using `node:test`, `node:assert/strict`, `fs`, and `path`. Assert that the default layout contains exactly one `id="vanta-birds-background"`; scripts load only the lightweight initializer with Three.js and enhanced Birds URLs stored as data attributes; `createBirdOptions(1280)` returns desktop predator radius/strength and quantity; `createBirdOptions(480)` returns lower mobile quantity and scale; `canAnimate()` rejects reduced motion and missing WebGL.

```js
test('default layout renders one Birds background host', () => {
  const layout = read('_layouts/default.html');
  assert.equal((layout.match(/id="vanta-birds-background"/g) || []).length, 1);
});

test('desktop options strengthen pointer avoidance', () => {
  const options = background.createBirdOptions(1280);
  assert.equal(options.predatorRadius, 260);
  assert.equal(options.predatorStrength, 220);
  assert.equal(options.quantity, 4);
});

test('mobile options reduce GPU work', () => {
  const options = background.createBirdOptions(480);
  assert.equal(options.quantity, 3);
  assert.equal(options.scaleMobile, 0.75);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/vanta-birds-background.test.js`

Expected: FAIL because the test and production initializer do not exist yet.

- [ ] **Step 3: Implement the layout host and focused initializer**

Add the host immediately inside `body`:

```html
<div id="vanta-birds-background" class="birds-background" aria-hidden="true"></div>
```

Load only the lightweight initializer at the end of `_includes/scripts.html`, with dependency URLs supplied as data attributes:

```html
<script
  src="{{ '/assets/js/vanta-birds-background.js' | relative_url }}"
  data-three-src="https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js"
  data-birds-src="{{ '/assets/js/vanta.birds.enhanced.min.js' | relative_url }}"
  defer></script>
```

Implement a UMD module exposing `createBirdOptions`, `canAnimate`, `loadScript`, `init`, and `boot`. `boot` must check motion and WebGL capability before sequentially loading Three.js and enhanced Birds. The initializer must add `birds-background--active` on success, `birds-background--static` on any gated or failed path, and destroy the effect during `pagehide`.

Desktop options use background `0x0e1824`, restrained cyan/pale birds, quantity `4`, `predatorRadius: 260`, and `predatorStrength: 220`. Mobile uses quantity `3`, scale `0.75`, lower speed, radius `210`, and strength `170`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/vanta-birds-background.test.js`

Expected: layout, ordering, options, and capability tests PASS.

- [ ] **Step 5: Commit Task 1**

```powershell
git add test/vanta-birds-background.test.js assets/js/vanta-birds-background.js _layouts/default.html _includes/scripts.html
git commit -m "feat: initialize full-site Birds background"
```

### Task 2: Enhanced Predator Shader

**Files:**
- Modify: `test/vanta-birds-background.test.js`
- Create: `assets/js/vanta.birds.enhanced.min.js`

- [ ] **Step 1: Add failing shader contract tests**

Assert that the vendor file identifies Vanta 0.5.24 and contains `uniform float predatorRadius;`, `uniform float predatorStrength;`, default option keys, uniform initialization, and `valuesChanger()` assignments for both values. Assert that the shader uses `predatorRadius` instead of a hard-coded `150.0` radius and multiplies avoidance acceleration by `predatorStrength`.

```js
test('enhanced Birds shader exposes predator controls', () => {
  const source = read('assets/js/vanta.birds.enhanced.min.js');
  for (const token of [
    'uniform float predatorRadius;',
    'uniform float predatorStrength;',
    'float preyRadius = predatorRadius;',
    'delta * predatorStrength',
    'predatorRadius:260',
    'predatorStrength:220'
  ]) assert.ok(source.includes(token), `missing ${token}`);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/vanta-birds-background.test.js`

Expected: FAIL because the enhanced vendor file is missing.

- [ ] **Step 3: Vendor and patch Vanta Birds 0.5.24**

Start from the exact jsDelivr artifact `vanta@0.5.24/dist/vanta.birds.min.js`. Add an MIT/upstream provenance comment. Make only these behavioral changes:

```glsl
uniform float predatorRadius;
uniform float predatorStrength;
float preyRadius = predatorRadius;
f = (distSquared / preyRadiusSq - 1.0) * delta * predatorStrength;
limit += predatorStrength / 44.0;
```

Add defaults `predatorRadius:260,predatorStrength:220`, create matching velocity uniforms, and copy option values in `valuesChanger()`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/vanta-birds-background.test.js`

Expected: all shader and initializer tests PASS.

- [ ] **Step 5: Commit Task 2**

```powershell
git add test/vanta-birds-background.test.js assets/js/vanta.birds.enhanced.min.js
git commit -m "feat: strengthen Birds pointer avoidance"
```

### Task 3: Dark Translucent Site Integration

**Files:**
- Modify: `test/vanta-birds-background.test.js`
- Create: `_sass/_birds-background.scss`
- Modify: `assets/css/main.scss`

- [ ] **Step 1: Add failing style contract tests**

Assert that `main.scss` imports `birds-background`; the partial defines a fixed full-viewport host with `pointer-events: none`; content layers have a positive stacking context; body fallback color is `#0e1824`; reduced-motion rules hide the canvas; and readable colors are defined for headings, body text, links, metadata, code, tables, navigation, search, and footer surfaces.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/vanta-birds-background.test.js`

Expected: FAIL because the Sass partial and import do not exist.

- [ ] **Step 3: Implement the dedicated Sass partial**

Create a fixed host beneath content, make the existing page regions translucent dark layers with modest blur, preserve responsive layout widths, and override Minimal Mistakes foreground/border/code/table/menu colors for contrast. Include:

```scss
.birds-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #0e1824;
}

@media (prefers-reduced-motion: reduce) {
  .birds-background canvas { display: none !important; }
}
```

Import the partial after `minimal-mistakes` so scoped overrides win without editing theme internals.

- [ ] **Step 4: Run tests and build**

Run: `node --test test/vanta-birds-background.test.js`

Expected: all tests PASS.

Run: `bundle exec jekyll build`

Expected: exit code 0 and `_site/assets/css/main.css` contains `.birds-background`.

- [ ] **Step 5: Commit Task 3**

```powershell
git add test/vanta-birds-background.test.js _sass/_birds-background.scss assets/css/main.scss
git commit -m "style: integrate dark Birds site surfaces"
```

### Task 4: Browser And Visual Verification

**Files:**
- Modify only if verification exposes a tested defect.

- [ ] **Step 1: Start the local Jekyll server**

Run: `bundle exec jekyll serve --host 127.0.0.1 --port 4000`

Expected: site available at `http://127.0.0.1:4000/`.

- [ ] **Step 2: Verify desktop home and article pages**

At a desktop viewport, verify one nonblank canvas, active body state, readable homepage/sidebar/footer, working links, scroll, and pointer avoidance. Open a long-form post and verify the same fixed instance pattern and readable code/table content. Confirm no console errors.

- [ ] **Step 3: Verify mobile and reduced motion**

At a mobile viewport, verify stable layout, no text overlap, reduced flock density, and usable navigation. Emulate reduced motion, reload, and verify zero canvas elements plus the static fallback class.

- [ ] **Step 4: Run final verification**

Run: `node --test test/vanta-birds-background.test.js`

Run: `bundle exec jekyll build`

Run: `git status --short`

Expected: tests and build exit 0; status shows only intentional plan tracking if not yet committed.

- [ ] **Step 5: Commit verification-driven fixes and plan**

```powershell
git add -f docs/superpowers/plans/2026-07-17-vanta-birds-background.md
git add test/vanta-birds-background.test.js assets/js/vanta-birds-background.js assets/js/vanta.birds.enhanced.min.js _sass/_birds-background.scss assets/css/main.scss _layouts/default.html _includes/scripts.html
git commit -m "test: verify Birds background integration"
```
