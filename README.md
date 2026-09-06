# tkyiitd.github.io

Personal webpage for Tarun Kumar Yadav, built with Jekyll and intended for GitHub Pages.

## Run locally

```sh
bundle install
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000`.

## Video background

The active background is the supplied `kayak-hero.mp4`, saved to
`assets/video/kayak-hero.mp4` with streaming metadata at the front (no re-encoding).
It plays silently, inline, and on a loop. `assets/images/kayak-video-poster.jpg` is
its opening frame and remains visible until the first video frame is ready.

All page CSS is rendered inline from `_includes/site.css`. Text is ordinary
server-rendered HTML with system fonts: there is no loading screen, opacity gate,
external stylesheet request, or JavaScript requirement for reading the page.
A solid blue background appears even before the poster arrives. The video download
starts after the initial page paint and never blocks content. Reduced-motion preferences
show the still by default; the play/pause control can opt into motion. Hidden tabs
pause playback, and autoplay or media failures leave the still and text available.

## Previous illustrated ocean (inactive)

The active background is a clean illustrated island and ocean, adapted from the supplied
reference with its lettering, forms, and corner portrait removed. A separately generated
six-pose child-and-kayak sprite supplies artwork and landmarks for a continuous rowing
rig. A single character texture deforms smoothly along a cyclic cubic motion path;
the paddle is rendered separately as a rigid object, avoiding crossfade ghosts.
The hull is anchored and the journey eases toward the island without a position reset.
The animation includes bobbing, a wake, and softly fading stroke ripples. WebGL animates
wind-driven ocean swells and overlapping cloud samples that drift in one direction.
All assets are local. A static island remains if WebGL is unavailable. Pause, reduced-motion
preferences, hidden-tab suspension, and a white print layout are supported.

Current assets, made with built-in imagegen:

- `assets/images/quiet-island.jpg`
- `assets/images/kayak-rowing.png` (transparent 3×2 rowing atlas)

### Island prompt

Use case: precise-object-edit. Asset type: clean illustrated cinematic website landscape background, wide 16:9, approximately 2048x1152. Input image 1 is the edit target. Reconstruct the screenshot as a clean full-scene high-quality landscape with NO interface or lettering. Primary request: Remove ALL the huge MARBLE lettering, all other text, beta badge, form fields, button, cursor, circular lower-right portrait, and the foreground child and kayak including paddle and splashes. Reconstruct seamless sky/clouds/ocean behind every removed element. Scene: calm sapphire and turquoise ocean occupies lower approximately 48% of composition, a small fantastical tall rocky island at the horizon centered slightly right, around 62% of width. Island has warm sculpted stone spire, dark green pines, little beach and small red-white lighthouse. Immense luminous blue sky with soft white cumulus clouds. Preserve screenshot's cinematic stylized 3D storybook aesthetic, warm sunlight, saturated attractive blues, calm mood, polished rendering; not photography. Composition: island remains relatively small against vast ocean and sky, ample clear sky and foreground sea. Preserve recognizable island design and atmospheric visual character from reference while removing overlays and shifting island slightly right. Constraints: scenery only. NO text, letters, typography, logos, UI, frames, people, portraits, boats, kayaks, paddles, or watermarks. Sky and ocean continuous, no residual ghosts of removed text or objects.

### Rowing prompt

Use case: stylized-concept. Asset type: transparent PNG animation sprite sheet, SIX rowing frames, exactly 3 columns by 2 rows, canvas aspect ratio 3:2, ideally 1536x1024 so each cell is 512x512 square. Input image 1 is character/boat/style reference only. Isolate and recreate the foreground child kayaking away from the camera: rear view, short black hair, blue shirt with pale blue curved wave-like pattern, warm medium skin, red-orange kayak with visible rear deck cords, orange-red double-ended paddle with dark shaft. Match screenshot's soft cinematic stylized 3D illustration rendering and warm sunlight. Primary request: a continuous SIX-frame rowing animation, read left-to-right across top row then bottom row. Top left: left-side blade immersion; top middle: left-side pull; top right: left-side recovery; bottom left: right-side blade immersion; bottom middle: right-side pull; bottom right: right-side recovery. Paddle changes angle and hands move naturally, torso leans/twists slightly with each stroke. Strict layout: EXACTLY SIX complete sprites in a precise uniform 3-column by 2-row grid of equal square cells. Each sprite has IDENTICAL scale, framing, boat orientation and hull anchor position. Boat points away from viewer slightly toward upper right, as in reference. Child centered in each cell, full hull and entire paddle included, generous empty transparent padding all sides so no clipping or overlapping between cells. Hull position and camera never move between frames; only rowing pose changes. Treat these as six consecutive frames of ONE child in ONE boat, not six differently designed boats. Background: genuinely transparent alpha channel everywhere outside child, boat, and paddle. No ocean, sky, island, environment, ground plane, reflections, detached shadows, floating droplets, checkerboard pattern or backdrop. No gridlines, cell borders, labels, text, typography, watermark or UI. Clean isolated edges. Do not include the screenshot interface or any other character.

### Transparency correction prompt

Use case: background-extraction. Input image is the EDIT TARGET, a 1536x1024 six-frame kayak sprite sheet. Remove the baked white/light-gray checkerboard completely and output a genuinely transparent PNG with actual alpha channel. Preserve all six child/kayak/paddle poses, colors, scale, and exact pixel layout, 3 columns by 2 rows, unchanged. The child, boats and paddles must remain opaque. All checkerboard background and spaces around paddles must have alpha zero, NOT a painted checkerboard or white background. Do not add shadows or anything. This is technical background removal only, preserve artwork and identical cell positions.

## Previous forest artwork (inactive)

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
