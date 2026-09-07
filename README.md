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
Dark silhouettes sit against a pale blue and warm evening sky. Birds gently part
around the pointer; a continuous light reading gradient protects the profile text.

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
