const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function loadBackground() {
  const modulePath = path.join(root, 'assets/js/vanta-birds-background.js');
  assert.ok(fs.existsSync(modulePath), 'background initializer must exist');
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function makeClassList() {
  const values = new Set();
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); }
  };
}

function makeEnvironment(width = 1280) {
  const host = { dataset: {} };
  const bodyClassList = makeClassList();
  const listeners = new Map();
  const document = {
    body: { classList: bodyClassList },
    getElementById(id) {
      return id === 'vanta-birds-background' ? host : null;
    }
  };
  const window = {
    innerWidth: width,
    addEventListener(type, handler, options) { listeners.set(type, { handler, options }); }
  };
  function dispatch(type, event = {}) {
    const listener = listeners.get(type);
    if (!listener) return;
    listener.handler(event);
    if (listener.options && listener.options.once) listeners.delete(type);
  }
  return { host, bodyClassList, listeners, dispatch, document, window };
}

test('default layout renders one Birds background host', () => {
  const layout = read('_layouts/default.html');
  assert.equal((layout.match(/id="vanta-birds-background"/g) || []).length, 1);
});

test('scripts expose dependency URLs through the lightweight initializer', () => {
  const scripts = read('_includes/scripts.html');
  assert.match(scripts, /vanta-birds-background\.js/);
  assert.match(scripts, /data-three-src="https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.134\.0\/build\/three\.min\.js"/);
  assert.match(scripts, /data-birds-src="\{\{ '\/assets\/js\/vanta\.birds\.enhanced\.min\.js' \| relative_url \}\}"/);
  assert.doesNotMatch(scripts, /<script\b[^>]*\ssrc="https:\/\/cdn\.jsdelivr\.net\/npm\/three/);
});

test('desktop options strengthen pointer avoidance', () => {
  const background = loadBackground();
  const options = background.createBirdOptions(1280);
  assert.equal(options.predatorRadius, 260);
  assert.equal(options.predatorStrength, 220);
  assert.equal(options.quantity, 4);
  assert.equal(options.backgroundColor, 0x0e1824);
});

test('mobile options reduce GPU work', () => {
  const background = loadBackground();
  const options = background.createBirdOptions(480);
  assert.equal(options.quantity, 3);
  assert.equal(options.scaleMobile, 0.75);
  assert.equal(options.predatorRadius, 210);
  assert.equal(options.predatorStrength, 170);
});

test('animation capability rejects reduced motion and missing WebGL', () => {
  const background = loadBackground();
  assert.equal(background.canAnimate({ reducedMotion: true, webgl: true }), false);
  assert.equal(background.canAnimate({ reducedMotion: false, webgl: false }), false);
  assert.equal(background.canAnimate({ reducedMotion: false, webgl: true }), true);
});

test('WebGL capability accepts the GPU features Birds requires', () => {
  const background = loadBackground();
  const webgl2 = {
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
    getParameter() { return 8; }
  };
  const webgl1 = {
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
    getExtension(name) { return name === 'OES_texture_float' ? {} : null; },
    getParameter() { return 4; }
  };

  assert.equal(background.supportsWebGL({
    createElement() { return { getContext(type) { return type === 'webgl2' ? webgl2 : null; } }; }
  }), true);
  assert.equal(background.supportsWebGL({
    createElement() { return { getContext(type) { return type === 'webgl' ? webgl1 : null; } }; }
  }), true);
});

test('WebGL capability rejects WebGL1 without float textures', () => {
  const background = loadBackground();
  const context = {
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
    getExtension() { return null; },
    getParameter() { return 4; }
  };
  const document = {
    createElement() { return { getContext(type) { return type === 'webgl' ? context : null; } }; }
  };

  assert.equal(background.supportsWebGL(document), false);
});

test('WebGL capability rejects contexts without vertex texture support', () => {
  const background = loadBackground();
  const context = {
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8b4c,
    getExtension() { return {}; },
    getParameter() { return 0; }
  };
  const document = {
    createElement() { return { getContext(type) { return type === 'webgl' ? context : null; } }; }
  };

  assert.equal(background.supportsWebGL(document), false);
});

test('init creates one effect and destroys it on a non-cached pagehide', () => {
  const background = loadBackground();
  const environment = makeEnvironment();
  let receivedOptions;
  let destroyCount = 0;
  environment.window.THREE = {};
  environment.window.VANTA = {
    BIRDS(options) {
      receivedOptions = options;
      return { destroy() { destroyCount += 1; } };
    }
  };

  const effect = background.init(environment);

  assert.ok(effect);
  assert.equal(receivedOptions.el, environment.host);
  assert.equal(receivedOptions.THREE, environment.window.THREE);
  assert.equal(receivedOptions.predatorStrength, 220);
  assert.equal(environment.bodyClassList.contains('birds-background--active'), true);
  environment.dispatch('pagehide', { persisted: false });
  assert.equal(destroyCount, 1);
});

test('init preserves the effect through a back-forward cache round trip', () => {
  const background = loadBackground();
  const environment = makeEnvironment();
  let destroyCount = 0;
  environment.window.THREE = {};
  environment.window.VANTA = {
    BIRDS() { return { destroy() { destroyCount += 1; } }; }
  };

  background.init(environment);
  environment.dispatch('pagehide', { persisted: true });
  assert.equal(destroyCount, 0);

  environment.dispatch('pagehide', { persisted: false });
  assert.equal(destroyCount, 1);
});

test('init records the fallback reason when effect creation fails', () => {
  const background = loadBackground();
  const environment = makeEnvironment();
  environment.window.THREE = {};
  environment.window.VANTA = {
    BIRDS() { throw new Error('shader setup failed'); }
  };

  const effect = background.init(environment);

  assert.equal(effect, null);
  assert.equal(environment.host.dataset.birdsState, 'error');
  assert.equal(environment.host.dataset.birdsError, 'shader setup failed');
  assert.equal(environment.bodyClassList.contains('birds-background--static'), true);
});

test('boot does not load graphics dependencies for reduced motion', async () => {
  const background = loadBackground();
  const environment = makeEnvironment();
  const loaded = [];

  const result = await background.boot({
    ...environment,
    reducedMotion: true,
    webgl: true,
    threeSrc: 'three.js',
    birdsSrc: 'birds.js',
    loadDependency: async (source) => { loaded.push(source); }
  });

  assert.equal(result, null);
  assert.deepEqual(loaded, []);
  assert.equal(environment.host.dataset.birdsState, 'reduced-motion');
  assert.equal(environment.bodyClassList.contains('birds-background--static'), true);
});

test('boot records when WebGL is unavailable', async () => {
  const background = loadBackground();
  const environment = makeEnvironment();

  const result = await background.boot({
    ...environment,
    reducedMotion: false,
    webgl: false,
    loadDependency: async () => { throw new Error('must not load'); }
  });

  assert.equal(result, null);
  assert.equal(environment.host.dataset.birdsState, 'webgl-unavailable');
});

test('boot records dependency loading failures', async () => {
  const background = loadBackground();
  const environment = makeEnvironment();

  const result = await background.boot({
    ...environment,
    reducedMotion: false,
    webgl: true,
    threeSrc: 'three.js',
    birdsSrc: 'birds.js',
    loadDependency: async () => { throw new Error('network blocked'); }
  });

  assert.equal(result, null);
  assert.equal(environment.host.dataset.birdsState, 'dependency-error');
  assert.equal(environment.host.dataset.birdsError, 'network blocked');
});

test('boot loads dependencies in order before initialization', async () => {
  const background = loadBackground();
  const environment = makeEnvironment();
  const loaded = [];

  const effect = await background.boot({
    ...environment,
    reducedMotion: false,
    webgl: true,
    threeSrc: 'three.js',
    birdsSrc: 'birds.js',
    loadDependency: async (source) => {
      loaded.push(source);
      if (source === 'three.js') environment.window.THREE = {};
      if (source === 'birds.js') {
        environment.window.VANTA = { BIRDS: () => ({ destroy() {} }) };
      }
    }
  });

  assert.ok(effect);
  assert.deepEqual(loaded, ['three.js', 'birds.js']);
});

test('enhanced Birds shader exposes predator controls', () => {
  const relativePath = 'assets/js/vanta.birds.enhanced.min.js';
  assert.ok(fs.existsSync(path.join(root, relativePath)), 'enhanced Birds vendor file must exist');
  const source = read(relativePath);

  for (const token of [
    'Vanta Birds 0.5.24',
    'uniform float predatorRadius;',
    'uniform float predatorStrength;',
    'float preyRadius = predatorRadius;',
    'delta * predatorStrength',
    'limit += predatorStrength / 44.0;',
    'predatorRadius:260',
    'predatorStrength:220',
    'this.velocityUniforms.predatorRadius={value:1}',
    'this.velocityUniforms.predatorStrength={value:1}',
    'this.velocityUniforms.predatorRadius.value=this.options.predatorRadius',
    'this.velocityUniforms.predatorStrength.value=this.options.predatorStrength'
  ]) {
    assert.ok(source.includes(token), `missing ${token}`);
  }

  assert.equal(source.includes('float preyRadius = 150.0;'), false);
  assert.equal(source.includes('delta * 100.;'), false);
});

test('Sass integrates a readable dark Birds surface across the site', () => {
  const partialPath = '_sass/_birds-background.scss';
  assert.ok(fs.existsSync(path.join(root, partialPath)), 'Birds Sass partial must exist');
  const main = read('assets/css/main.scss');
  const styles = read(partialPath);

  assert.match(main, /@import "birds-background";/);
  for (const token of [
    '.birds-background',
    'position: fixed;',
    'inset: 0;',
    'pointer-events: none;',
    'background: #0e1824;',
    'z-index: 1;',
    '.masthead',
    '.initial-content',
    '.search-content',
    '.page__content',
    '.sidebar',
    '.greedy-nav',
    '.toc',
    'code',
    'table',
    '.page__footer',
    '@media (prefers-reduced-motion: reduce)',
    '.birds-background canvas'
  ]) {
    assert.ok(styles.includes(token), `missing style contract: ${token}`);
  }

  assert.match(styles, /\.masthead\s*\{[^}]*z-index: 30;/s);
});

test('mobile content surfaces reveal more of the Birds background', () => {
  const styles = read('_sass/_birds-background.scss');
  const mobileStart = styles.indexOf('@media (max-width: 767px)');
  const mobileEnd = styles.indexOf('@media (prefers-reduced-motion: reduce)', mobileStart);
  const mobileStyles = styles.slice(mobileStart, mobileEnd);

  assert.match(
    mobileStyles,
    /\.archive,[\s\S]*\.page__related\s*\{[^}]*background: rgba\(10, 19, 29, 0\.56\);[^}]*backdrop-filter: blur\(3px\);/
  );
  assert.match(
    mobileStyles,
    /\.sidebar\s*\{[^}]*background: rgba\(18, 30, 42, 0\.5\);[^}]*backdrop-filter: blur\(3px\);/
  );
});

test('print styles restore readable text, links, code, and tables', () => {
  const styles = read('_sass/_birds-background.scss');
  const printStyles = styles.slice(styles.indexOf('@media print'));

  assert.match(printStyles, /h1,[\s\S]*\.archive__item-title\s*\{[^}]*color: #000;/);
  assert.match(printStyles, /a,[\s\S]*\.page__content a:not\(\.btn\):hover\s*\{[^}]*color: #000;/);
  assert.match(printStyles, /code,[\s\S]*\.highlight\s*\{[^}]*color: #000;[^}]*background: #fff;/);
  assert.match(printStyles, /table\s*\{[^}]*color: #000;[^}]*background: #fff;/);
  assert.match(printStyles, /table th,[\s\S]*table td\s*\{[^}]*color: #000;[^}]*border-color: #000;/);
});
