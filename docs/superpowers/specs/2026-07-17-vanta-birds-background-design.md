# Vanta Birds Full-Site Background Design

## Goal

Add an immersive dark Vanta Birds background to every page of the Jekyll site. Birds must react more strongly to the mouse by accelerating away from the pointer over a larger area, while navigation and long-form content remain readable and usable.

## Scope

- Render one fixed Birds background instance beneath the site shell on every page.
- Restyle the masthead, sidebar, main content, search surface, and footer as translucent dark layers with high-contrast text.
- Extend the upstream Birds effect with explicit predator radius and strength controls.
- Preserve pointer and scroll interaction for all existing page elements.
- Reduce rendering work on small screens and disable animation for reduced-motion users.
- Provide a static dark fallback when WebGL or JavaScript is unavailable.

The work does not redesign navigation, article structure, archive layouts, or content.

## Architecture

The default layout owns a single fixed background element placed immediately inside `body`. A small site script decides whether animation is allowed, creates the Birds effect once, and tears it down on page unload. The canvas layer uses `pointer-events: none`; Vanta receives normalized pointer coordinates from a document-level listener so links and scrolling remain unaffected.

The Birds implementation is based on Vanta 0.5.24. Its velocity shader is extended with two uniforms:

- `predatorRadius`: size of the pointer avoidance region.
- `predatorStrength`: multiplier applied to the avoidance acceleration.

The site loads Three.js and the local Birds effect only on browsers that support WebGL and do not request reduced motion. A body class records the active or fallback state for styling and tests.

## Visual Design

The background uses a near-black blue base with restrained cyan and pale-blue birds. The flock stays sparse enough that motion reads as atmosphere instead of foreground content.

Site surfaces use dark translucent backgrounds with modest blur. Article text, headings, links, metadata, code, tables, notices, navigation menus, and footer content keep sufficient contrast. Layers remain square or lightly rounded in sympathy with the existing Minimal Mistakes theme.

Desktop behavior uses the full flock and stronger avoidance. Mobile uses fewer birds, a lower render scale, and reduced speed. Static fallback uses the same base color so layout does not shift when animation is unavailable.

## Interaction

Moving the pointer near the flock acts as a predator:

- Birds inside the configured radius accelerate away quickly.
- Birds outside the radius continue normal separation, alignment, and cohesion behavior.
- Avoidance does not attract birds, add pointer light effects, or move the entire page.
- Pointer events remain owned by the document content, not the canvas.

## Failure Handling

- If reduced motion is requested, no Three.js or Vanta scripts are loaded.
- If WebGL is unavailable, the initialization exits without an exception and leaves the static background.
- If a dependency fails to load or initialization throws, the error is contained and the static background remains usable.
- The effect is destroyed on page unload to release GPU resources.

## Testing And Acceptance

Automated tests verify:

- The default layout includes exactly one background host.
- The initializer gates reduced motion and WebGL support.
- Desktop and mobile configurations use the intended density and render scale.
- Predator radius and strength are passed into the effect.
- The local Birds shader consumes both predator uniforms.

Manual acceptance requires:

- A successful Jekyll production build.
- Desktop and mobile screenshots of the home page and a long-form page.
- A visible, nonblank Birds canvas on supported desktop browsers.
- Strong pointer avoidance without blocking links, scrolling, or text selection.
- No uncaught browser console errors.
- Static fallback behavior under reduced motion.
