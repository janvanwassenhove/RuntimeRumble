# Runtime Rumble

**Five robots. Zero supervision.** A client-side 2.5D arcade party fighter set after hours at Devoxx / Kinepolis Antwerp.

Play: https://janvanwassenhove.github.io/RuntimeRumble/

No install, no account, no backend. One tab. On a phone, *Add to Home Screen* installs it as an app and it runs offline after the first visit.

## Run locally

Requires Node.js 22+ and a WebGL 2 browser.

```sh
npm ci
npm run dev
```

## Play

- **Arcade:** four roster opponents, then an overclocked rival on the keynote stage. Best of three, 75-second rounds.
- **Local versus:** two keyboards, two controllers, or keyboard + controller. With one connected controller, it controls Player 2.
- **Chaos:** 30-second rounds, faster hazards and Overclock gain.
- **Training:** unlimited time, stationary dummy, full initial Overclock, automatic integrity reset.
- **Attract:** the title starts an AI demonstration after 45 seconds idle. Any input returns to the title.

| Action | Player 1 | Player 2 | Standard gamepad |
| --- | --- | --- | --- |
| Move | A / D | Left / Right | Stick / D-pad |
| Jump | W | Up | Y |
| Crouch / low attack | S + J or K | Down + 1 or 2 | Down + A or B |
| Light / heavy | J / K | 1 / 2 | A / B |
| Special / alternate | L / I | 3 / 4 | X / LT |
| Grab | U | 0 | RB |
| Block | Space | Right Shift | LB |
| Overclock | O | 5 | RT |
| Pause | Escape | Escape | Start |

Tap attacks, hold block. Hold Biggy's special to charge. Gamepads can navigate menus with the stick/D-pad and A.

Those are the defaults: every keyboard action for either player can be rebound under **SETTINGS** (click a key, press the new one; a key already in use swaps with the one it replaces, and RESET KEYS restores the table above). Bindings are saved on the device; the HUD and help screen show whatever is current. Gamepad and touch controls are fixed.

### On a phone or tablet

One build, two editions: the game reads the device and rebuilds its controls around it. On a coarse-pointer device a stick appears on the left (push up to jump, down to crouch) and a fight-stick cluster on the right — LIGHT, HEAVY, GRAB over SPEC, ALT, OC, with BLOCK across the top — plus a MENU button in the HUD to pause. Landscape works best. Input is one path internally: the stick and buttons feed the same controls the keyboard does, so the physics never knows which device it is on.

It is a **PWA** (vite-plugin-pwa): the service worker precaches every asset, the physics wasm, Richie's model and the venue textures included, so after one visit it runs completely offline. Post-processing steps aside on touch devices to keep the frame rate up; add `?nofx` to do the same on a tired desktop GPU, or `?touch` to see the phone layout on a desktop.

## Roster

- **Voxxy:** fast articulated all-rounder. YEET() throws and Slingshot lunges.
- **Droid:** tall, long-reach control fighter. System Override arms nearby hazards; Extension Error extends reach — literally.
- **Biggy:** heavy and slow to stop. Full Send builds momentum; Absolute Unit braces.
- **Richie Mini:** no limbs or wheels. Hop locomotion, Bonk, Big Bonk, Unexpected Trajectory, Tantrum.exe, and Play Dead crouch dodge.
- **Microduck:** tiny rushdown biped. Peck, kick, Beak Lock, Roller Mode, and Kickstart.

All fighters have separate mass, acceleration, friction, reach, power, jump and recovery. Overclock lasts five seconds and amplifies the fighter's identity.

Voxxy, Droid and Biggy are the model-sheet builds shared with [Please Do Not Throw Richie](https://github.com/janvanwassenhove/PleaseDoNotThrowRichie): clear-coated plastic, scuffed graphite and rusting steel, measured off the official [Robot Games references](https://game.devoxx.be/references.html). Richie is the real [Reachy Mini](https://github.com/pollen-robotics/reachy_mini) geometry, animated on its actual neck and antenna joints. Microduck is built the same way from Pollen's product photographs.

## Arenas

Six slices of Kinepolis Antwerp, dressed the way Richie dresses the whole building: the **Exhibition Hall** with its orange cove, sponsor stands, gadgets and Duke standees (booth flipper); the **Grand Staircase** with its running escalators and a drop either side (edge fall); the **Cinema Corridor** between auditoriums 1–14 (session let-out crowd surge); the **Auditorium**'s raked velvet rows and seated audience (recliner launch); the **Keynote Stage** with its screen, truss, tabs and sweeping spots (stage lift); and the **Robot Lab** (special-disabling factory reset). Each includes a movable cart, background activity, warnings and hazard states, and its own light grade — a bright hall, a dark room with a lit stage.

## Architecture

- `src/game.ts`: fixed-step Rapier world, combat, AI, rounds, arcade route, camera, lights and the bloom pass.
- `src/data.ts`: fighter/attack definitions, knockback and hazard timing.
- `src/models.ts`: the five fighters — the shared robot builds, Richie's GLB, Microduck — and their fight animation.
- `src/kit.ts`, `src/textures.ts`: the modelling kit (primitives baked and merged per material) and the generated texture set, shared with Richie.
- `src/venue.ts`: the venue kit — materials, signage, booths, gadgets, escalators, seats.
- `src/arena.ts`: the six arena sets, hazards, carts and crowds.
- `src/people.ts`: the procedural conference crowd — eight-heads-tall figures with faces, hands, fabric grain and glossy eyes, and the fans behind every fight, each cheering on their own beat: fist pumps, jumping, filming on a phone, live-blogging, waving a sign (`git push --force`, `SUDO WIN`), a foam finger.
- `src/input.ts`, `src/keys.ts`: keyboard (rebindable), touch stick and buttons, controller abstraction.
- `src/audio.ts`: original Web Audio effects/music and optional browser speech synthesis.
- `src/main.ts`, `src/style.css`: menus, portraits, HUD, touch layout, settings, results and intro.

All music and effects are generated locally. Fonts are bundled. No account, server or physical robot is required. Browser speech synthesis availability and voice quality vary by platform.

## Checks and deployment

```sh
npm test                          # vitest unit tests
npm run build                     # type-check + production build to dist/, with the service worker
npx playwright install chromium   # once
npm run test:e2e                  # browser gameplay tests (PORT=5199 npm run test:e2e if 5173 is busy)
npm run icons                     # re-render the PWA icons from public/favicon.svg
```

GitHub Actions runs unit tests, a production build, and browser gameplay tests before deploying `dist/` to GitHub Pages. Browser checks cover menus, every fighter, combat, blocking/grabs, hazards, Overclock, round reset, results, a phone viewport and the touch controls. Screenshots are retained in the `gameplay-checks` workflow artifact. Pages must use **GitHub Actions** as its source.

`dist/` is a self-contained static site with relative asset paths, so it runs from a domain root, a project subpath or a local folder served over HTTP. A boot overlay stays up until the first frame and explains itself if WebGL 2 or WebAssembly is unavailable instead of leaving a black page.

See [references and asset sources](docs/REFERENCES.md) and [the original brief](docs/BRIEF.md).
