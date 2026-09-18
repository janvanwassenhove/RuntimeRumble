# RUNTIME RUMBLE

### Five robots. Zero supervision.

## Game development brief

---

# 1. Concept

Build a fast, absurd **2.5D arcade robot fighting game** set inside Devoxx Belgium at Kinepolis Antwerp.

The game combines:

- classic early-1990s side-on arcade fighting
- Robot Wars-style arena chaos
- physical robot combat
- environmental hazards
- exaggerated mass and momentum
- developer humour
- five radically different robots

The playable roster:

1. Voxxy
2. Droid
3. Biggy
4. Richie Mini
5. Microduck

Two robots enter the arena.

They:

- punch
- kick
- shove
- grab
- ram
- throw
- bounce
- launch
- abuse arena machinery

The objective:

> Reduce your opponent's integrity to zero or knock them into a decisive arena hazard.

Rounds should last approximately:

**45–90 seconds**

Matches:

**Best of three**

A full arcade run should take:

**8–12 minutes**

---

# 2. Tone

The game should feel like:

> Somebody found a forgotten 1994 arcade cabinet in Kinepolis and replaced all the fighters with conference robots.

The tone is:

- absurd
- fast
- mechanical
- slightly irresponsible
- playful
- not violent in a human/gory sense

Robots:

- spark
- smoke
- lose balance
- get launched
- reboot
- fall over

No gore.

No realistic destruction.

No grim tone.

---

# 3. Title

Use:

# RUNTIME RUMBLE

Primary subtitle:

### Five robots. Zero supervision.

Alternative marketing lines:

> Fight. Crash. Reboot.

> The build passed. The robots didn't.

> What happens after Devoxx closes?

> No humans were harmed during compilation.

---

# 4. Arcade cabinet presentation

The game should visually behave like an exaggerated arcade cabinet.

Opening screen:

# RUNTIME RUMBLE

Then:

# PRESS START

Character selection:

# SELECT YOUR MACHINE

Round start:

# ROUND 1

Then:

# EXECUTE!

Rather than copying familiar fighting-game terminology everywhere, use developer/robot language where it improves personality.

Possible vocabulary:

- EXECUTE
- SYSTEM FAILURE
- CRITICAL HIT
- OVERCLOCK
- RING OUT
- REBOOTING
- CORE DUMP
- MATCH COMPLETE
- RUNTIME ERROR

Do not overdo programming jokes.

The game still needs to be readable instantly.

---

# 5. Inspirations

Broad inspiration:

- classic Mortal Kombat
- classic Street Fighter
- Robot Wars
- old arcade cabinets
- physics-heavy robot games

Do NOT reproduce copyrighted:

- characters
- animations
- fatalities
- arenas
- music
- sound effects
- interface layouts
- logos

Take only the broad design language:

> side-on arcade fighting + robot arena hazards.

Everything else should be original.

---

# 6. Core gameplay principle

This is NOT intended to become a technically perfect competitive fighting game.

It is an:

# ARCADE PARTY FIGHTER

Priorities:

1. immediately playable
2. satisfying impacts
3. radically different robots
4. funny physics
5. dangerous arenas
6. strong visual identity
7. local multiplayer
8. short matches

Avoid:

- complex frame-perfect mechanics
- giant combo systems
- elaborate counters
- forty moves per fighter
- massive character progression systems

---

# 7. Why 2.5D

Characters are rendered as modern 3D models.

The environment is 3D.

Lighting is 3D.

Physics are 3D.

But the combat largely stays on a fixed horizontal plane.

Advantages:

- dramatically simpler controls
- simpler AI
- simpler camera
- simpler collision logic
- visually strong
- arcade authenticity
- much faster development

Characters move primarily:

left / right.

They may jump or hop vertically.

Do not initially implement free depth-axis movement.

---

# 8. Canonical Devoxx assets

Use official Devoxx Robot Games material as the canonical reference for:

- Voxxy
- Droid
- Biggy
- Kinepolis Antwerp
- exhibition hall
- grand staircase
- foyer
- cinema corridors
- auditoriums
- keynote stage

Canonical reference library:

[https://game.devoxx.be/references.html](https://game.devoxx.be/references.html)

Do not turn the three official Devoxx robots into generic fighting robots.

Preserve:

- silhouette
- dimensions/proportions
- primary colours
- distinctive joints
- recognisable mechanical features

Combat versions may receive:

- scratches
- sparks
- warning lights
- dirt
- temporary electrical effects

But they should remain unmistakably themselves.

---

# 9. Richie Mini

Richie is based on the real Pollen Robotics Reachy Mini.

Canonical sources:

https://github.com/pollen-robotics/reachy_mini

[https://store.pollen-robotics.com/collections/reachy-mini](https://store.pollen-robotics.com/collections/reachy-mini)

Prefer official simulation geometry where practical.

Use product imagery to verify:

- silhouette
- colours
- body materials
- antenna placement
- head proportions

Do not add:

- legs
- wheels
- conventional arms

Richie's lack of fighting-compatible anatomy is part of his entire character.

---

# 10. Microduck

Microduck is based on the real Pollen Robotics Microduck.

Canonical product reference:

[https://pollen-robotics.com/microduck/](https://pollen-robotics.com/microduck/)

Use official Pollen Robotics sources for:

- appearance
- scale
- proportions
- locomotion
- kick behaviour
- beak manipulation
- recovery movement
- roller-skating behaviour

Microduck should not become a generic robot duck.

Its actual abilities provide most of its fighting style.

---

# 11. Character roster philosophy

The five fighters must feel radically different.

Not:

> same code + different mesh.

Each should differ in:

- mass
- acceleration
- friction
- reach
- recovery
- knockback response
- attack rhythm
- special abilities

A spectator should be able to identify the fighter simply by how it moves.

---

# 12. Voxxy

## Archetype

# Agile all-rounder

Difficulty:

Easy.

Stats:

Speed ★★★★★
Power ★★★
Weight ★★
Reach ★★★
Recovery ★★★★

Voxxy is the easiest character for a first-time player.

Movement should be:

- responsive
- quick
- playful
- accurate

## Light attack

Fast arm jab.

## Light combo

Jab → jab.

## Heavy attack

Large swinging arm.

## Low attack

Long arm sweep.

## Grab

Voxxy uses its arms to grab the opponent.

## Special

# YEET()

Grab opponent.

Aim.

Throw.

Especially powerful near hazards.

## Secondary special

# SLINGSHOT

Voxxy anchors / winds itself and launches forward.

Moderate impact.

High mobility.

## Personality

Voxxy never looks particularly angry.

After throwing somebody into a pit:

Voxxy looks down.

Tiny shrug.

---

# 13. Droid

## Archetype

# Technical control fighter

Difficulty:

Medium.

Stats:

Speed ★★★
Power ★★★
Weight ★★★
Reach ★★★★★
Recovery ★★★

Droid is tall and deliberate.

Long limbs provide excellent range.

## Light attack

Straight mechanical jab.

## Heavy attack

Large overhead swing.

## Low attack

Long leg sweep.

## Grab

Mechanical clamp / arm pull.

## Special

# SYSTEM OVERRIDE

Droid temporarily takes control of a nearby stage mechanism.

Example effects depending on arena:

- activate flipper
- reverse conveyor
- trigger cinema seat
- close/open barrier
- move platform

Position matters.

## Secondary special

# EXTENSION ERROR

Droid massively overextends an arm.

Excellent reach.

Long recovery if missed.

## Personality

Droid behaves like everything is routine maintenance.

Victory animation:

inspects defeated robot.

Checks imaginary checklist.

---

# 14. Biggy

## Archetype

# Heavy tank

Difficulty:

Easy to understand.

Harder to control accurately.

Stats:

Speed ★
Power ★★★★★
Weight ★★★★★
Reach ★★
Recovery ★★

Biggy's physics should immediately communicate:

# MASS

Acceleration:

slow.

Stopping:

slow.

Impact:

terrifying.

## Light attack

Short heavy punch.

## Heavy attack

Full body swing.

## Low attack

Ground slam.

## Grab

Short-range body grab / push.

## Special

# FULL SEND

Hold special.

Biggy accelerates.

Momentum increases.

Release / connect.

Opponent receives a massive physical impulse.

Biggy may continue sliding after the collision.

## Secondary special

# ABSOLUTE UNIT

Biggy braces.

Temporary effects:

- much higher knockback resistance
- slower movement
- more collision mass

## Critical design requirement

Being hit by Biggy should not merely cause health loss.

The opponent should visibly:

# GO SOMEWHERE ELSE.

---

# 15. Richie Mini

## Archetype

# Chaos fighter

Difficulty:

High.

Stats:

Speed ★★★
Power ★★
Weight ★★
Reach ★
Recovery ★★★★
Chaos ★★★★★

Richie has:

- no punches
- no kicks
- no useful arms
- no legs

Excellent.

## Movement

Richie hops.

Tap:

small hop.

Hold:

charged hop.

He may bounce off:

- opponent
- wall
- floor
- environmental objects

## Light attack

# BONK

Fast headbutt.

## Heavy attack

# BIG BONK

Charged forward body/head launch.

On miss:

Richie tumbles.

## Special

# UNEXPECTED TRAJECTORY

Diagonal high-energy hop.

Can rebound from surfaces.

Limited mid-air control.

## Secondary special

# TANTRUM.EXE

Richie spins rapidly.

Short-range multi-hit attack.

## Defensive move

# PLAY DEAD

Richie collapses flat.

Can dodge certain attacks.

Then springs upright.

## Design goal

A new player should think:

> This is clearly the worst fighter.

An experienced player should think:

> Oh no. Not Richie.

---

# 16. Microduck

## Archetype

# Tiny technical rushdown fighter

Difficulty:

Medium/high.

Stats:

Speed ★★★★★
Power ★★
Weight ★
Reach ★★
Recovery ★★★★★

Microduck is tiny.

That is an advantage and a problem.

Small hit profile.

Very fast.

Low mass.

Easily launched.

## Light attack

# PECK

Fast beak strike.

## Heavy attack

# DUCK KICK

Powerful robotic kick based on Microduck's real motion capability.

## Low attack

Fast low kick.

## Grab

# BEAK LOCK

Microduck grabs the opponent using its beak.

Against lighter characters:

pull / throw.

Against heavy characters:

Microduck may simply get dragged along.

Especially against Biggy.

## Special

# ROLLER MODE

Activate roller-skate mode.

Effects:

- greatly increased movement speed
- reduced friction
- increased momentum
- harder steering

Useful.

Also extremely dangerous.

## Secondary special

# KICKSTART

Fast lunging kick.

## Recovery

# NOT DEAD YET

Very fast stand-up after knockdown.

Inspired by Microduck's real recovery capability.

## Personality

Microduck believes it is much larger than it is.

Use very occasional:

**quack**

Do not spam duck sounds.

One perfectly timed quack is much funnier.

---

# 17. Character scale

Do not normalise the robots to equal size.

Their real visual differences are part of the humour.

Biggy should look huge next to Microduck.

Richie should look physically absurd in a fighting lineup.

Potential intro:

# BIGGY

VS

# MICRODUCK

Camera reveals Biggy.

Heavy mechanical noise.

Camera pans.

Tiny Microduck.

Silence.

Microduck:

**quack**

# EXECUTE!

---

# 18. Controls

Keep controls simple.

## Keyboard

A / D
Move

W
Jump / hop

S
Crouch / brace

J
Light attack

K
Heavy attack

L
Special

Space
Block

Optional:

U
Grab

or use:

Forward + Heavy

for grab.

## Gamepad

Left stick / D-pad:

movement

Face buttons:

- light
- heavy
- special
- jump

Shoulder:

block

Do NOT implement:

quarter-circle inputs.

dragon-punch inputs.

20-hit command lists.

---

# 19. Combo design

Target small readable combos.

Examples:

LIGHT → LIGHT → HEAVY

LIGHT → SPECIAL

JUMP → HEAVY

Grab → hazard

Each fighter should initially have approximately:

- 3 basic attacks
- 1 grab
- 2 specials
- block
- jump/hop

That is enough.

---

# 20. Integrity

Health is called:

# INTEGRITY

Example:

```text
VOXXY
████████████████

BIGGY
████████████████

```

At zero:

# SYSTEM FAILURE

Robot shuts down / collapses.

No gore.

---

# 21. Overclock meter

Secondary meter:

# OVERCLOCK

Fills when:

- landing attacks
- receiving damage
- being launched
- interacting with hazards

When full:

trigger temporary Overclock state.

Duration:

approximately 5 seconds.

Overclock exaggerates the character's normal identity rather than becoming a cinematic super attack.

---

# 22. Voxxy Overclock

# MULTITHREADING

Arm speed increases dramatically.

Grab range improved.

Throws become faster.

---

# 23. Droid Overclock

# ROOT ACCESS

Droid temporarily gains access to multiple arena mechanisms.

Arena becomes part of Droid's moveset.

---

# 24. Biggy Overclock

# NO BRAKES

Acceleration increases dramatically.

Maximum momentum increases.

Biggy becomes dangerous to:

- opponent
- himself

---

# 25. Richie Overclock

# BAD IDEA

Hop force increases.

Bounce increases.

Air steering increases slightly.

Richie becomes violently mobile.

Display:

# THIS WAS A BAD IDEA

---

# 26. Microduck Overclock

# TURBO DUCK

Roller mode automatically activates.

Higher speed.

Improved kicking momentum.

Very low friction.

Tiny controlled disaster.

---

# 27. Arena principle

# THE ARENA IS THE SIXTH FIGHTER.

Every arena contains:

- normal combat space
- one major hazard
- one smaller hazard
- physical props
- background activity

Hazards must be:

- predictable
- telegraphed
- avoidable
- usable intentionally

The player should think:

> Can I knock them into that?

That is core gameplay.

---

# 28. Hazard lifecycle

Every hazard follows:

```text
IDLE
↓
WARNING
↓
ARMED
↓
ACTIVE
↓
COOLDOWN

```

Never instantly trigger unavoidable damage.

Example:

floor lights flash.

Audio cue.

Then:

FLIPPER ACTIVATES.

---

# 29. Arena 1 — Exhibition Hall

Setting:

Devoxx exhibition floor.

Background:

- booths
- screens
- developers
- beanbags
- coffee
- banners
- sponsor structures

## Major hazard

# BOOTH FLIPPER

Floor panel arms.

Warning lights.

Then:

FWOOMP.

Any robot standing on it gets launched.

## Minor hazard

# CATERING CART

Physics-enabled trolley.

Can be pushed.

Can hit fighters.

Can spill coffee.

---

# 30. Arena 2 — Grand Staircase

Large Kinepolis landing.

Famous staircase visible.

## Major hazard

# STAIRCASE

Strong knockback near the edge triggers a physics fall down stairs.

Camera temporarily follows:

BONK

BONK

BONK

BONK

Large damage.

Not necessarily instant loss.

## Minor hazard

People periodically cross part of the background/arena edge.

---

# 31. Arena 3 — Cinema Corridor

Long cinema corridor.

Doors and auditorium entrances visible.

## Major hazard

# SESSION ENDED

Warning light turns on above a cinema door.

Door opens.

Large crowd exits.

Anything caught nearby gets pushed sideways.

## Minor hazard

Cleaning trolley.

Slow but heavy.

---

# 32. Arena 4 — Auditorium

Fight near rows of cinema seats.

Large Devoxx screen behind.

## Major hazard

# RECLINER LAUNCH

Powered cinema seats activate.

Robot knocked onto one can be launched.

## Minor hazard

Presentation equipment trolley.

---

# 33. Arena 5 — Keynote Stage

Final arena.

Large Devoxx stage.

Most dramatic lighting.

## Major hazard

# STAGE LIFT

Floor panels rise and fall.

Can:

- interrupt attacks
- launch fighters
- create temporary terrain

## Minor hazard

Moving presentation screen / stage equipment.

---

# 34. Optional Arena — Robot Lab

Bonus arena.

Visuals:

- robot parts
- cables
- monitors
- chargers
- test rigs
- workbenches

## Hazard

# FACTORY RESET

Short pulse.

Temporarily disables specials.

Do NOT reverse controls unless playtesting proves it is funny rather than annoying.

---

# 35. Match intro

Use fast arcade presentation.

Example:

Biggy walks in.

Heavy footsteps.

Microduck enters opposite side.

Character names slam onto screen.

# BIGGY

# VS

# MICRODUCK

Then:

# ROUND 1

Pause.

# EXECUTE!

---

# 36. Announcer vocabulary

Synthetic exaggerated announcer.

Allowed phrases:

# ROUND ONE

# EXECUTE

# FINAL ROUND

# OVERCLOCK

# SYSTEM FAILURE

# CRITICAL ERROR

# RING OUT

# PERFECT BUILD

# DOUBLE FAILURE

# MATCH COMPLETE

Avoid copying iconic fighting-game lines too closely.

---

# 37. Round endings

Normal KO:

# SYSTEM FAILURE

Arena ring-out:

# OUT OF BOUNDS

Hazard knockout:

# ENVIRONMENT ERROR

Very close match:

# RACE CONDITION

Double KO:

# DEADLOCK

---

# 38. Comedy finishers

No fatalities.

Instead use:

# POST-MORTEM

After certain decisive wins:

brief optional character-specific gag.

---

# 39. Voxxy Post-Mortem

Voxxy lifts defeated robot.

Shakes it.

One screw falls out.

Voxxy stares at screw.

---

# 40. Droid Post-Mortem

Droid connects imaginary diagnostic cable.

Screen displays:

```text
ROOT CAUSE:

USER ERROR

```

---

# 41. Biggy Post-Mortem

Biggy reverses.

Starts charging.

Camera cuts away.

Huge:

# BONK

---

# 42. Richie Post-Mortem

Richie slowly hops toward defeated robot.

Tiny:

**bonk**

Opponent falls over again.

---

# 43. Microduck Post-Mortem

Microduck inspects robot.

Small kick.

Turns away.

One:

**quack**

---

# 44. Game modes

MVP requires:

## ARCADE

Pick fighter.

Fight through four opponents.

Final match uses:

- keynote stage
- stronger opponent
- faster hazards

Full run:

8–12 minutes.

## LOCAL VERSUS

Two players.

Choose fighter.

Choose stage.

Fight.

This should become the most replayable conference mode.

---

# 45. CHAOS MODE

Optional but desirable.

Rules:

- 30-second rounds
- faster Overclock
- maximum hazards
- slightly increased knockback

Designed for:

- Devoxx booth play
- quick conference matches
- spectators

---

# 46. Character selection

Use five-character grid.

```text
VOXXY       DROID       BIGGY

      RICHIE      MICRODUCK

```

Character portrait selection triggers animation:

Voxxy:

wave.

Droid:

mechanical stance.

Biggy:

heavy stomp.

Richie:

tries to hop.

Almost falls over.

Microduck:

kick.

---

# 47. Matchup cards

Add absurd short matchup subtitles.

Examples:

Biggy vs Microduck:

# MASS vs ATTITUDE

Voxxy vs Biggy:

# SPEED vs ABSOLUTE UNIT

Richie vs Microduck:

# INTERACTION vs ACTION

Droid vs Richie:

# ARCHITECTURE vs EDGE CASE

Microduck vs Biggy:

# 800 GRAMS OF CONFIDENCE

Richie vs Biggy:

# POOR LIFE CHOICES

---

# 48. Damage visuals

No blood.

Use:

- sparks
- smoke
- tiny electrical arcs
- scratches
- warning lights
- glitch effects
- loose cosmetic panel effects

Avoid complex destructible models for MVP.

---

# 49. Physics

Each character must have individual:

- mass
- linear acceleration
- maximum movement speed
- angular stability
- knockback resistance
- friction
- jump force
- recovery speed
- centre of mass

Expected relative mass:

Microduck:

very light.

Richie:

light.

Voxxy:

light-medium.

Droid:

medium.

Biggy:

very heavy.

---

# 50. Hit response

Hits should apply:

- integrity damage
- physical impulse
- hit reaction
- optional brief hit-stop

Not every attack needs ragdoll.

Use controlled physics.

---

# 51. Hit-stop

Strong attacks briefly pause simulation/animation:

roughly:

40–100 ms.

This is especially important for:

- Biggy full-speed hit
- strong kick
- final KO
- wall impact

Small technical trick.

Huge perceived impact.

---

# 52. Slow motion

Use only for exceptional moments:

- final round knockout
- major ring-out
- huge Biggy impact
- ridiculous Richie bounce
- Microduck impossible comeback

Keep it short.

---

# 53. Camera

Fixed side-on fighting camera.

Requirements:

- both fighters remain visible
- smooth horizontal tracking
- modest zoom based on distance
- no free camera rotation during fight

Special temporary camera moves:

- major hazard
- KO
- ring-out
- match intro
- victory

Immediately return to combat framing afterward.

---

# 54. Screen shake

Scale by impact.

Microduck peck:

almost none.

Voxxy heavy:

small.

Biggy charge:

large.

Provide:

# REDUCED CAMERA SHAKE

accessibility setting.

---

# 55. CPU AI

Keep AI straightforward.

Simple states:

- approach
- retreat
- basic attack
- heavy attack
- block
- special
- grab
- avoid hazard

Difficulty changes:

- reaction delay
- aggression
- defence frequency
- hazard awareness

Do NOT use ML AI.

---

# 56. Artificial stupidity

Low/medium AI should occasionally make mistakes.

Examples:

Biggy overshoots.

Microduck skates into a wall.

Richie bounces the wrong direction.

Voxxy mistimes throw.

This improves entertainment.

---

# 57. Kinepolis authenticity

Do not build the full building.

Build only the visible slices used by the camera.

Use official references to reproduce recognisable:

- exhibition architecture
- staircases
- cinema interiors
- signage
- auditorium
- keynote stage

This is cheaper and visually stronger than modelling the full venue.

---

# 58. Crowd

Crowds should be background atmosphere.

No complex AI required.

Use:

- instancing
- looping animation
- low-poly humans
- silhouettes at distance
- simple reactions

Crowd reactions:

- cheer
- recoil
- point
- continue drinking coffee

---

# 59. Local multiplayer

Important.

Support:

- two controllers
- keyboard + controller

Optional later:

two keyboard layouts.

Versus mode should launch quickly.

No accounts.

No lobby.

No network required.

---

# 60. Attract mode

If game is idle:

AI vs AI match starts automatically.

Overlay:

# PRESS START

This is ideal for Devoxx.

The game can remain running on a screen and attract people through movement and noise.

---

# 61. Sound design

Critical.

Include:

- servo movement
- metal hits
- hydraulic impact
- sparks
- motors
- crowd reaction
- arena alarms
- announcer

Character signatures:

Biggy:

deep:

# BOOM

Richie:

# BONK

Microduck:

rare:

# QUACK

---

# 62. Music

Original/generated soundtrack.

Style:

- 90s arcade energy
- industrial electronic
- synth
- robotics

Avoid reproducing music from known fighting games.

Final round intensifies music.

---

# 63. Arcade mode structure

Example:

Player chooses:

Richie.

Fight 1:

Voxxy — Exhibition Hall.

Fight 2:

Microduck — Grand Staircase.

Fight 3:

Droid — Cinema Corridor.

Fight 4:

Biggy — Auditorium.

Final:

random remaining rival in:

# OVERCLOCKED MODE

on keynote stage.

---

# 64. Final opponent

Do not initially build a unique sixth boss.

Instead:

take one roster character.

Give:

- full Overclock meter
- more aggressive AI
- slightly faster hazards

Use dramatic presentation.

Much cheaper.

---

# 65. Secret matchup

Richie vs Microduck.

Display:

# POLLEN FAMILY DISPUTE

No special mechanics needed.

---

# 66. Richie easter egg

Perfect Richie win:

# UNTOUCHED

Then:

# SOMEHOW

---

# 67. Biggy easter egg

Biggy falls into own hazard:

# MOMENTUM

Small subtitle:

> It's complicated.

---

# 68. Microduck easter egg

Long idle animation:

Microduck settles down.

Possibly falls asleep.

Opponent remains free to attack.

Terrible strategy.

Good character moment.

---

# 69. Results screen

Example:

```text
RUNTIME COMPLETE

FIGHTER             MICRODUCK

MATCHES WON         5
ROUNDS LOST         2
SYSTEM FAILURES     7
RING OUTS           3
OVERCLOCKS          4
QUACKS              6

BIGGY HITS
SURVIVED            1

```

---

# 70. Technical stack

Recommended:

- TypeScript
- Vite
- Three.js
- Rapier
- Web Audio
- GLTF / GLB

Core game should run client-side.

No backend needed for MVP.

Target deployment:

- GitHub Pages
- static hosting

---

# 71. Architecture

Suggested structure:

```text
src/

  game/
    Game.ts
    GameState.ts
    Match.ts
    Round.ts

  fighters/
    Fighter.ts
    FighterController.ts
    FighterPhysics.ts

    voxxy/
    droid/
    biggy/
    richie/
    microduck/

  combat/
    Attack.ts
    Hitbox.ts
    Hurtbox.ts
    Damage.ts
    Knockback.ts
    Block.ts
    Grab.ts
    Overclock.ts

  ai/
    FighterAI.ts

  arenas/
    Arena.ts
    Hazard.ts
    ExhibitionHall.ts
    Staircase.ts
    Corridor.ts
    Auditorium.ts
    KeynoteStage.ts

  input/
    InputManager.ts
    KeyboardInput.ts
    GamepadInput.ts

  camera/
    FightCamera.ts

  physics/
    PhysicsWorld.ts

  audio/
    AudioManager.ts
    Announcer.ts

  ui/
    HUD.ts
    CharacterSelect.ts
    ArenaSelect.ts
    Results.ts

  cinematic/

  assets/

```

---

# 72. Attack definition

Each attack contains:

```text
startup
active
recovery

hitbox
damage
knockback
direction
hitStop

```

Each fighter has simplified:

# HURTBOXES

Do NOT initially use detailed per-mesh collision for combat.

Use simple volumes.

---

# 73. Knockback model

Conceptually:

```text
knockback =
attack impulse
× attacker power
× target knockback multiplier
÷ target mass resistance

```

Then apply physical impulse.

Tune manually for fun.

Do not chase strict simulation realism.

---

# 74. Arena hazard architecture

Common interface:

```text
Hazard

state:
  idle
  warning
  active
  cooldown

trigger()
update()
applyEffect()
reset()

```

This allows arenas to reuse hazard behaviour.

---

# 75. Accessibility

Support:

- keyboard
- controller
- reduced camera shake
- master volume
- music volume
- announcer volume

Avoid critical gameplay information encoded only by colour.

---

# 76. Development principle

# DO NOT BUILD FIVE CHARACTERS FIRST.

First determine:

# IS HITTING ANOTHER ROBOT FUN?

Everything else follows from that.

---

# 77. Sprint 1 — Combat box

Build one ugly grey arena.

Two placeholder fighters.

Implement:

- move
- jump
- light attack
- heavy attack
- block
- grab
- hitbox
- hurtbox
- knockback
- integrity
- timer
- KO
- round reset

No real models.

No Kinepolis.

No menus.

No music.

No specials.

Acceptance criterion:

> Two ugly boxes hitting one another must already feel satisfying.

---

# 78. Sprint 2 — Mass

Create:

# LIGHT FIGHTER

and:

# HEAVY FIGHTER

Tune:

- acceleration
- mass
- knockback
- friction
- stopping

Test heavy charge.

If the heavy fighter does not immediately feel heavy:

do not proceed.

---

# 79. Sprint 3 — First hazard

Add:

# FLOOR FLIPPER

Flow:

warning light

↓

alarm

↓

flip

↓

launch fighter

↓

cooldown

Watch testers.

If they deliberately start trying to push each other onto it:

the core concept works.

---

# 80. Sprint 4 — Voxxy vs Biggy

Build first real match.

Characters:

- Voxxy
- Biggy

Moves:

Voxxy:

- light
- heavy
- grab
- YEET()

Biggy:

- light
- heavy
- FULL SEND

Arena:

rough exhibition hall.

This becomes the first major vertical slice.

---

# 81. Sprint 5 — Richie

Add Richie.

Implement:

- hop locomotion
- BONK
- BIG BONK
- UNEXPECTED TRAJECTORY
- recovery

Primary challenge:

make Richie ridiculous but viable.

---

# 82. Sprint 6 — Microduck

Build Microduck using official references.

Implement:

- walk
- peck
- kick
- beak grab
- Roller Mode
- fast recovery

Microduck should immediately feel almost opposite to Biggy.

---

# 83. Sprint 7 — Droid

Add:

- long reach
- heavy mechanical attacks
- System Override
- arena interaction

Roster complete.

---

# 84. Sprint 8 — Arcade shell

Add:

- title screen
- character select
- match intro
- CPU AI
- best-of-three
- arcade progression
- results
- local versus
- announcer

At this stage:

game is functionally competition-ready.

---

# 85. Sprint 9 — Arenas

Produce:

1. Exhibition Hall
2. Grand Staircase
3. Cinema Corridor
4. Auditorium
5. Keynote Stage

Use official Kinepolis visual references.

Only model what the side camera sees.

---

# 86. Sprint 10 — Polish

Add:

- particles
- smoke
- sparks
- hit-stop
- slow-motion KOs
- screen shake
- crowd
- audio
- music
- lighting
- absurd messages
- attract mode

---

# 87. Physical Richie integration

Optional later feature.

If a physical Reachy Mini is connected:

Game Richie gets hit:

→ physical Richie reacts.

Game Richie wins:

→ physical Richie celebrates.

Game Richie loses:

→ physical Richie looks disappointed.

Must never be required for gameplay.

---

# 88. Microduck physical integration

Not part of MVP.

Use:

- official model
- simulation
- motion references

Physical Microduck support can be explored later if hardware becomes available.

---

# 89. Opening cinematic

Approximately 10–15 seconds.

Kinepolis at night.

Conference is over.

Quiet exhibition hall.

Screens shut down.

Lights begin turning off.

Then:

one monitor flickers.

Another.

Robots power up.

Camera cuts quickly:

Voxxy.

Droid.

Biggy.

Richie.

Microduck.

The five look toward each other.

Microduck:

**quack**

Alarm lights switch on.

Metal barriers close.

Huge title:

# RUNTIME RUMBLE

Subtitle:

### Five robots. Zero supervision.

Then:

# PRESS START

---

# 90. Minimal story

Someone forgot to shut down the robots after Devoxx.

At some point during the night, a completely unnecessary competition starts:

# WHO IS THE ULTIMATE DEVOXX ROBOT?

There is no sensible explanation.

Do not provide one.

---

# 91. Definition of success

Five seconds watching:

> That's a robot fighting game.

Thirty seconds:

> Wait, can I knock him into that thing?

First character select:

> I want the duck.

First Biggy hit:

> WHAT THE HELL.

First Richie match:

> How is this thing winning?

At that point:

# RUNTIME RUMBLE WORKS.

---

# 92. First instruction to Astra

Read this entire brief.

Do not build the complete game.

Execute:

# SPRINT 1 ONLY.

Create the initial browser-based 2.5D combat prototype.

Technology:

- TypeScript
- Vite
- Three.js
- Rapier

Build:

- fixed side-on camera
- one simple arena
- two placeholder fighters
- move left/right
- jump
- light attack
- heavy attack
- block
- grab
- hitboxes
- hurtboxes
- integrity
- knockback
- physical collisions
- round timer
- KO
- round restart
- gamepad-ready input abstraction

Do NOT yet implement:

- Voxxy
- Droid
- Biggy
- Richie
- Microduck
- Kinepolis
- character select
- AI
- cinematics
- announcer
- final art
- physical robots

Prioritise:

- responsiveness
- hit impact
- knockback
- readable timing

The first milestone is complete when:

> Two ugly boxes beating each other around a grey room is already fun.

Only after that proceed to fighter-specific physics and the arena hazard prototype.