# tkyiitd.github.io

Personal webpage for Tarun Kumar Yadav, built with Jekyll for GitHub Pages.

## Run locally

```sh
bundle install
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000`.

## Background

`assets/js/flow-background.js` renders a three-dimensional murmuration with Three.js.
`assets/js/flock-model.js` computes local separation, alignment and cohesion in a
spatial grid, plus soft volume boundaries, wind and a passing repulsive disturbance.
Birds do not follow preset curves. This is an artistic simulation, not a validated
model of animal behavior. Desktop uses 3,200 birds; mobile uses 1,200.
Instanced geometry renders the flock in one draw call; vertex shaders animate
individual wingbeats and banking, while perspective and haze provide depth.
Dark silhouettes sit against an open blue sky, subtle sunlight and distant misty
mountains. The local landscape is `assets/images/open-sky-mountains.jpg` (1672×941).
A transparent screen-space shader adds gently drifting mist and faint sun rays;
it shares the flock clock, reduced-motion behavior and pause control. Birds gently
part around the pointer; a continuous light reading gradient protects the text.
The landscape loads independently, with a CSS sky fallback and no text-loading gate.

Three.js 0.180.0 is pinned and served locally from `assets/js/three/`, with its MIT
license included. The two browser modules were extracted from the npm release after
SHA-512 integrity verification. No CDN, Node server or new build pipeline is needed
on GitHub Pages. All imports are relative and compatible with a Jekyll base URL.
CSS is inlined from `_includes/site.css`; ordinary HTML and system fonts display
before the engine loads. A static sky remains if JavaScript, WebGL2 or loading fails.

The animation updates at 30 Hz with gently slowed simulation time, caps display
resolution and scales the flock size to the initial viewport. It pauses in hidden tabs, honors reduced-motion
preferences with a still composition, and has a keyboard-accessible play/pause
button. Printing uses a white background with no animation.

### Landscape generation

Created with the built-in image generator, then saved as an optimized JPEG.
The returned dimensions were 1672×941. Exact generation prompt:

```text
Use case: photorealistic-natural
Asset type: natural landscape photograph used as a website backdrop, one image only, 2048x1152 wide landscape (16:9).
Primary request: An expansive pale natural blue open sky occupying the upper 75–80% of the frame, with very distant layered blue mountain ridges confined to the lowest 20–25%.
Scene/backdrop: Quiet airy natural mountain landscape, soft morning mist filling mountain valleys, realistic gentle atmospheric perspective.
Composition/framing: Wide landscape view with no foreground objects; center remains open sky for existing website text. Keep distant mountain ridges visible along the bottom even in a narrow center crop for mobile. Mountains must remain low in the frame.
Lighting/mood: Soft natural morning light, slight warm sun rays entering from the upper right, subtle and gentle, without a hard sun disk or lens flare.
Style/medium: Photorealistic natural landscape photography, restrained realistic colors and atmospheric softness.
Constraints: No birds (a separate 3D flock will be overlaid), no people, buildings, foreground objects, text, UI, logos, watermark, hard sun disk or lens flare. Generate just one image, no variants.
```

## Updating content

Edit `index.html` for the profile, talks, paper, patent and contact links. Add future
roles or work to `_data/experience.yml`. Keep the profile structured data in
`_layouts/default.html` and the last-updated dates consistent with content changes.

The paper PDF is in `assets/docs/`. The Google ownership-verification file,
`robots.txt` and `sitemap.xml` are needed even though they are not visible on the page.

## Google indexing

After publishing changes:

1. Verify `https://tkyiitd.github.io/` in Google Search Console.
2. Submit `https://tkyiitd.github.io/sitemap.xml` in the Sitemaps report.
3. Inspect the homepage URL and request indexing after substantial updates.

The homepage includes `ProfilePage` and `Person` structured data.
