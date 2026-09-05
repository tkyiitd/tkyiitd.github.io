# tkyiitd.github.io

Personal webpage for Tarun Kumar Yadav, built with Jekyll and intended for GitHub Pages.

## Run locally

```sh
bundle install
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000`.

## Forest background

The forest uses a local photograph with WebGL foliage displacement, shifting sunlight,
drifting mist, and falling photographic leaves. Animated swallows use a four-frame
flight atlas; butterflies flutter beside the reading column. The wide forest valley
includes an open blue sky and distant wooded hills. Wildlife and leaves are softened where they pass
behind text. A static photograph remains available without WebGL
or JavaScript. Animation pauses in hidden tabs, follows reduced-motion preferences,
and can be paused with the on-page control. No animation libraries or external assets
are loaded. The printable page has a white background.

Images were created with the built-in image generator and optimized for the website:

- `assets/images/forest-valley.jpg`
- `assets/images/forest-leaf.png` (transparent leaf sprite)
- `assets/images/forest-birds.png` (transparent 2×2 flight atlas)
- `assets/images/forest-butterfly.png` (transparent butterfly sprite)

### Final forest prompt

Use case: photorealistic-natural
Asset type: wide landscape website background, single image
Primary request: A wide panoramic view from the edge of a sunny woodland into a broad forest valley. Clearly visible natural blue sky and soft white clouds occupy the upper 30–35% of the frame. Layered deciduous green forests recede over rolling hills into blue atmospheric distance. A meadow and fern clearing fills the foreground, with trees framing only the far outer left and right edges, never a close wall of trunks.
Style/medium: Tasteful photorealistic landscape photography with realistic leaf, fern, and forest-canopy textures.
Composition/framing: Wide 16:9 composition. Convey an expansive forest area and open sky, not a few nearby trees. The mobile center crop must retain the open sky and forest valley. Keep the middle and lower central area naturally green and somewhat shaded so white website text can later be overlaid using CSS shading; do not render text or create any blank graphic panel.
Lighting/mood: Calm, fresh morning with natural sunlight illuminating the rich green canopy and soft atmospheric depth.
Constraints: No animals, people, buildings, text, logos, watermark, graphical overlays, or fabricated blank space.

### Final leaf prompt

Use case: photorealistic-natural
Asset type: isolated photographic leaf sprite for a small falling-leaf website animation.
Primary request: One single small beech leaf, olive green with muted ochre patches, delicate natural veins and a slight curl.
Composition/framing: Leaf fills most of the frame, entirely visible including its short natural stem, with a little padding around every edge. Photographic close-up detail, natural irregular organic form.
Background: Genuinely transparent background, preserve actual alpha transparency. No painted checkerboard, no opaque backdrop.
Constraints: One leaf only. No shadow, no background, no text, no lettering, no logo, no watermark, no extra objects.

### Final wildlife prompts

Built-in imagegen was used once for each of the following transparent assets.

**Swallow atlas:** Use case: photorealistic-natural. Asset type: transparent wildlife animation sprite atlas for a website, displayed at 25–45 px per bird. Create one square PNG containing EXACTLY four equal square cells in a precise 2 by 2 arrangement, without visible cell borders. In each cell, show the SAME tiny realistic woodland swallow in strict side view flying RIGHT, same size and identical body position at the center of its cell. Reading order: top left wings high/up; top right wings diagonal down; bottom left wings fully down; bottom right wings diagonal up. Four sequential flight poses, natural anatomically plausible feathers and wings. Natural gray-blue feathers with subtly warm chest, photographic nature-documentary realism, not cartoon. Each complete bird has generous transparent padding, no clipped wings. Genuinely transparent alpha background everywhere outside the four birds: no colored backdrop, no checkerboard rendered into the image, no shadows, no ground, no labels, no gridlines, no text, no watermark.

**Butterfly:** Use case: photorealistic-natural. Asset type: isolated transparent wildlife cutout for a website, displayed at 18–35 px during a flutter animation. Create ONE photorealistic orange-amber woodland butterfly, seen exactly from above in dorsal view, wings fully open symmetrically. Show the complete delicate body, all four wings and both antennae. Natural orange and amber wing coloration with authentic subtle darker veins and margins, realistic nature-documentary photography, never cartoon or illustration. Center the entire butterfly in a square canvas with generous empty margin on every side. Genuinely transparent alpha background, clean natural cutout edges, no background color, no rendered checkerboard, no flowers, no additional insects, no scenery, no ground, no cast shadow, no text, no watermark.

## Google indexing

After publishing changes:

1. Verify `https://tkyiitd.github.io/` in Google Search Console.
2. Submit `https://tkyiitd.github.io/sitemap.xml` in the Sitemaps report.
3. Inspect the homepage URL and request indexing after substantial updates.

The homepage includes `ProfilePage` and `Person` structured data. Keep the visible page and structured data consistent when adding future experience.
