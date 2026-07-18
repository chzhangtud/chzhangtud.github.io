(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    return;
  }

  root.PixelVoyagerBirds = api;

  if (root.document) {
    var script = root.document.currentScript;
    var options = {
      window: root,
      document: root.document,
      threeSrc: script && script.dataset.threeSrc,
      birdsSrc: script && script.dataset.birdsSrc
    };

    api.boot(options);
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var ACTIVE_CLASS = 'birds-background--active';
  var STATIC_CLASS = 'birds-background--static';

  function createBirdOptions(viewportWidth) {
    var mobile = viewportWidth < 768;

    return {
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: mobile ? 0.75 : 1,
      backgroundColor: 0x0e1824,
      color1: 0x58a9d6,
      color2: 0xe7f4ff,
      colorMode: 'varianceGradient',
      birdSize: mobile ? 0.72 : 0.9,
      wingSpan: mobile ? 18 : 23,
      speedLimit: mobile ? 4.5 : 5.5,
      separation: mobile ? 42 : 46,
      alignment: 32,
      cohesion: 28,
      quantity: mobile ? 3 : 4,
      predatorRadius: mobile ? 210 : 260,
      predatorStrength: mobile ? 170 : 220
    };
  }

  function canAnimate(capabilities) {
    return Boolean(capabilities && !capabilities.reducedMotion && capabilities.webgl);
  }

  function prefersReducedMotion(win) {
    return Boolean(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function supportsWebGL(doc) {
    try {
      var canvas = doc.createElement('canvas');
      var context = canvas.getContext('webgl2');
      var isWebGL2 = Boolean(context);

      if (!context) {
        context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      }
      if (!context || typeof context.getParameter !== 'function') return false;

      var vertexTextures = context.getParameter(context.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
      if (!vertexTextures) return false;

      return isWebGL2 || Boolean(
        context.getExtension && context.getExtension('OES_texture_float')
      );
    } catch (error) {
      return false;
    }
  }

  function setBodyState(doc, stateClass) {
    if (!doc.body || !doc.body.classList) return;
    doc.body.classList.remove(ACTIVE_CLASS);
    doc.body.classList.remove(STATIC_CLASS);
    doc.body.classList.add(stateClass);
  }

  function loadScript(source, doc) {
    return new Promise(function (resolve, reject) {
      if (!source) {
        reject(new Error('Missing script source'));
        return;
      }

      var element = doc.createElement('script');
      element.src = source;
      element.async = true;
      element.onload = resolve;
      element.onerror = function () {
        reject(new Error('Unable to load ' + source));
      };
      doc.head.appendChild(element);
    });
  }

  function init(environment) {
    var win = environment.window;
    var doc = environment.document;
    var host = doc.getElementById('vanta-birds-background');

    if (!host || !win.THREE || !win.VANTA || typeof win.VANTA.BIRDS !== 'function') {
      setBodyState(doc, STATIC_CLASS);
      return null;
    }

    try {
      var options = createBirdOptions(win.innerWidth || 1280);
      options.el = host;
      options.THREE = win.THREE;
      var effect = win.VANTA.BIRDS(options);

      setBodyState(doc, ACTIVE_CLASS);
      win.addEventListener('pagehide', function (event) {
        if (event && event.persisted) return;
        effect.destroy();
      });

      return effect;
    } catch (error) {
      if (host.dataset) {
        host.dataset.birdsState = 'error';
        host.dataset.birdsError = error && error.message ? error.message : 'Birds initialization failed';
      }
      setBodyState(doc, STATIC_CLASS);
      return null;
    }
  }

  async function boot(environment) {
    var win = environment.window;
    var doc = environment.document;
    var reducedMotion = typeof environment.reducedMotion === 'boolean'
      ? environment.reducedMotion
      : prefersReducedMotion(win);
    var webgl = typeof environment.webgl === 'boolean'
      ? environment.webgl
      : supportsWebGL(doc);
    var host = doc.getElementById('vanta-birds-background');

    if (!canAnimate({ reducedMotion: reducedMotion, webgl: webgl })) {
      if (host && host.dataset) {
        host.dataset.birdsState = reducedMotion ? 'reduced-motion' : 'webgl-unavailable';
      }
      setBodyState(doc, STATIC_CLASS);
      return null;
    }

    var loadDependency = environment.loadDependency || function (source) {
      return loadScript(source, doc);
    };

    try {
      if (!win.THREE) await loadDependency(environment.threeSrc);
      if (!win.VANTA || typeof win.VANTA.BIRDS !== 'function') {
        await loadDependency(environment.birdsSrc);
      }
      return init(environment);
    } catch (error) {
      if (host && host.dataset) {
        host.dataset.birdsState = 'dependency-error';
        host.dataset.birdsError = error && error.message ? error.message : 'Birds dependency loading failed';
      }
      setBodyState(doc, STATIC_CLASS);
      return null;
    }
  }

  return {
    boot: boot,
    canAnimate: canAnimate,
    createBirdOptions: createBirdOptions,
    init: init,
    loadScript: loadScript,
    prefersReducedMotion: prefersReducedMotion,
    supportsWebGL: supportsWebGL
  };
}));
