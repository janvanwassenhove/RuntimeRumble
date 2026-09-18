# Runtime Rumble

**Five robots. Zero supervision.** A client-side 2.5D arcade party fighter set after hours at Devoxx / Kinepolis Antwerp.

Play: https://janvanwassenhove.github.io/RuntimeRumble/

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

Tap attacks, hold block. Hold Biggy's special to charge. Gamepads can navigate menus with the stick/D-pad and A. Touch controls appear on touch devices. Landscape is recommended on phones.

## Roster

- **Voxxy:** fast articulated all-rounder. YEET() throws and Slingshot lunges.
- **Droid:** tall, long-reach control fighter. System Override arms nearby hazards; Extension Error extends reach.
- **Biggy:** heavy and slow to stop. Full Send builds momentum; Absolute Unit braces.
- **Richie Mini:** no limbs or wheels. Hop locomotion, Bonk, Big Bonk, Unexpected Trajectory, Tantrum.exe, and Play Dead crouch dodge.
- **Microduck:** tiny rushdown biped. Peck, kick, Beak Lock, Roller Mode, and Kickstart.

All fighters have separate mass, acceleration, friction, reach, power, jump and recovery. Overclock lasts five seconds and amplifies the fighter's identity.

## Arenas

Exhibition Hall (flipper), Grand Staircase (edge fall), Cinema Corridor (crowd surge), Auditorium (recliner launch), Keynote Stage (lift), Robot Lab (special-disabling reset). Each includes a movable cart/prop, background activity, warnings and hazard states.

## Architecture

- `src/game.ts`: fixed-step Rapier world, combat, AI, rounds, arcade route and camera.
- `src/data.ts`: fighter/attack definitions, knockback and hazard timing.
- `src/models.ts`: original articulated procedural robot models and animation.
- `src/arena.ts`: venue scenes and hazard visuals.
- `src/input.ts`: keyboard, touch and controller abstraction.
- `src/audio.ts`: original Web Audio effects/music and optional browser speech synthesis.
- `src/main.ts`, `src/style.css`: menus, portraits, HUD, settings, results and intro.

All models, music and effects are generated locally. Fonts are bundled. No account, server, external model download or physical robot is required. Browser speech synthesis availability and voice quality vary by platform. Physical Reachy/Microduck hardware integration is intentionally outside this release, as marked optional in the brief.

## Checks and deployment

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs unit tests, a production build, and browser gameplay tests before deploying `dist/` to GitHub Pages. Browser checks cover menus, every fighter, combat, blocking/grabs, hazards, Overclock, round reset, results and a phone viewport. Screenshots are retained in the `gameplay-checks` workflow artifact. Pages must use **GitHub Actions** as its source.

Art is stylised procedural interpretation of the official references, not imported production robot geometry or a surveyed venue reconstruction. Human playtesting remains useful for competitive balance and physical controller ergonomics.

See [reference and attribution notes](docs/REFERENCES.md) and [the original brief](docs/BRIEF.md).
