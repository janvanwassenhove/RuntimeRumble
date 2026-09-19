# References and asset sources

Reviewed 2026-09-19. The robots, the venue dressing, the textures and the crowd are shared with [Please Do Not Throw Richie](https://github.com/janvanwassenhove/PleaseDoNotThrowRichie), whose `docs/ASSET-SOURCES.md` documents them in full; this is the summary that matters for Runtime Rumble.

## Devoxx robots and venue

Source: the Robot Games reference library, https://game.devoxx.be/references.html — the three model sheets, the floor plans and the venue photographs. No reference image is redistributed. Voxxy, Droid and Biggy (`src/models.ts`) are original procedural models with proportions measured off the sheets' front and profile views and materials matched to them:

- **Voxxy** (sheet 01): a wide clear-coated orange head with bear ears, a black glass visor with dot-matrix orange eyes, white headphone discs with a lit ring, a pear-shaped body with panel seams and a white cat badge, thin black upper arms into teardrop forearms with a white band and three knuckled claws, two stick legs.
- **Droid** (sheet 02): a tall, slightly stooped graphite humanoid. Domed head with two warm lit eyes and a mouth grille, piston neck and waist, pale shoulder collars with copper trim, shoulder emblems, long arms with four fingers and a thumb, drum hip and knee joints, long thin shins with calf plates.
- **Biggy** (sheet 03): a ball on two stubby legs. A rusting orange belly with seams and a stencilled badge, blue-grey plate at the back with a hatch, speaker, exhaust and ports; a riveted helmet dome with two lens eyes, pauldrons, box forearms with three fingers, orange thigh armour over dark boots.
- **Kinepolis Antwerp** (`src/venue.ts`, `src/arena.ts`): the exhibition hall with its orange cove, sponsor stands and Duke standees; the grand staircase with its running escalators; the corridor between auditoriums 1–14; auditorium 8's raked velvet rows; the keynote stage with its screen, truss and tabs. The Robot Lab is invented. Each arena compresses one part of the building into a readable combat slice.

## Reachy Mini / Richie

`src/assets/richie.glb` is the official Pollen Robotics Reachy Mini geometry (https://github.com/pollen-robotics/reachy_mini, Apache-2.0, see `src/assets/NOTICE-reachy-mini.md`), converted by Richie's `scripts/build-richie.py`: shell parts only, head levelled about its real pivot, decimated, exported as a Y-up glTF with `base`, `body`, `head`, `antenna_left` and `antenna_right` nodes. The fight animates the head and antennas on the real joints. If the file cannot load, a procedural stand-in in the same proportions is used.

## Microduck

Source: https://pollen-robotics.com/microduck/ — the product photographs. An original procedural model (`src/models.ts`) in the same clear-coated plastic as Voxxy: an egg-shaped shell, a boxy head with one camera behind a lit ring and a hinged coral beak, a bare neck servo, exposed servo legs with wide three-toed feet, and skate wheels that drop for roller mode. No product geometry is used.

## The Devoxx logo

`src/assets/devoxx-white.svg` is the official Devoxx wordmark as served by the Robot Games site (https://game.devoxx.be/branding/devoxx-white.svg). It is a trademark of Devoxx, used unmodified to identify the conference this fan game is set at; it is not covered by this repository's licence. It is drawn onto dark panels at runtime: the hall's sign, the hanging banners, the keynote slide, the lectern.

## Generated textures

The images under `src/assets/textures/` were generated for Richie with ChatGPT image generation (OpenAI) and imported by its `scripts/import-texture.py` (tiling textures cross-faded so their edges match, posters centre-cropped, Duke cut out of his background). No third-party photograph or texture library is involved.

| File | What it is | Where Runtime Rumble uses it |
| --- | --- | --- |
| `carpet-hall.jpg` | grey needle-felt exhibition carpet | the exhibition hall, the booth pads, the lower floors by the staircase |
| `carpet-cinema.jpg` | midnight-navy cinema broadloom | the corridor, the auditorium tiers, the top of the staircase |
| `stone-floor.jpg` | honed grey terrazzo | the staircase landing, the steps |
| `wall-acoustic.jpg` | dark acoustic cloth panels | corridor, auditorium and keynote walls |
| `seat-velvet.jpg` | crimson cinema velour | the auditorium seats, the recliner, the keynote tabs |
| `metal-rust-orange.jpg` | chipped safety-orange paint over rust | Biggy's belly, cuffs, thigh armour |
| `metal-bluegrey.jpg` | worn slate-blue armour plate | Biggy's dome, back, pauldrons, forearms |
| `metal-graphite.jpg` | scuffed graphite plating | Droid, the lab floor |
| `booth-1.jpg` … `booth-6.jpg` | posters for six absurd exhibitors | the hall's booths, the corridor and foyer lightboxes |
| `duke.png` | Duke as a cardboard standee | one beside every booth |
| `keynote-bg.jpg` | a text-free keynote backdrop | the keynote screen, with the logo and KEYNOTE set over it at runtime |

Duke is the Java mascot, released by Oracle under the BSD licence (https://openjdk.org/projects/duke/). Every texture is optional at runtime: a material whose image is missing falls back to a flat colour, and a booth without a poster sets its own name in type.

## The crowd

The delegates behind the fights, the session let-out in the corridor and the seated audience are the original procedural figures from Richie's `src/people.ts`: vertex-coloured geometry on one shared material, seeded for variety in skin, hair, hoodies, glasses, lanyards, coffee cups and shirt slogans.

## Everything else

Three.js: MIT. Rapier: Apache-2.0. Barlow and Barlow Condensed: SIL Open Font License, bundled by the @fontsource packages. Original synth music, effects and announcer are generated by `src/audio.ts`. Names identify the source inspirations; this independent fan game is not endorsed by Devoxx, Kinepolis, Oracle or Pollen Robotics.
