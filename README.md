# tkyiitd.github.io

Personal webpage for Tarun Kumar Yadav, built with Jekyll for GitHub Pages.

## Run locally

```sh
bundle install
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000`.

## Background

`assets/js/flow-background.js` draws a full-viewport flock of birds against a blue
twilight sky. Boids use local separation, alignment and cohesion with a slowly
changing breeze. Spatial neighbor lookup and simultaneous steering updates keep
motion efficient and consistent. Different sizes, wing phases and gliding intervals
give the flock depth. Birds gently part around the pointer, and wrap outside the
screen edges. A soft reading gradient integrates the text without a separate panel.

There are no background images, videos, animation libraries or remote animation
dependencies. CSS is inlined from `_includes/site.css`; the profile is ordinary
HTML with system fonts and appears independently of JavaScript. A dark atmospheric
gradient remains when JavaScript or canvas is unavailable.

The animation uses a fixed 60 Hz simulation step, caps display resolution and scales
the flock size to the initial viewport. It pauses in hidden tabs, honors reduced-motion
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
