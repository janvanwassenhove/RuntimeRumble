import * as T from "three";
import R from "@dimforge/rapier3d-compat";
import {
  Action,
  ATTACKS,
  ARENAS,
  Controls,
  FighterDef,
  FighterId,
  FIGHTERS,
  Mode,
  clamp,
  fighter,
  hazardPhase,
  knockback,
  matchup,
  neutral,
} from "./data";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Robot, robot, animateRobot, disposeRobot, loadRichie } from "./models";
import { ArenaVisual } from "./arena";
import { AudioEngine } from "./audio";
import { Input } from "./input";
import { setAnisotropy } from "./textures";
export interface Attack {
  kind: Action;
  t: number;
  hit: boolean;
  duration: number;
}
export interface Combatant {
  def: FighterDef;
  body: R.RigidBody;
  model: Robot;
  hp: number;
  meter: number;
  oc: number;
  roller: number;
  brace: number;
  disabled: number;
  stun: number;
  face: number;
  attack?: Attack;
  cooldown: number;
  hazardCooldown: number;
  previous: Controls;
  combo: number;
  comboTime: number;
  charge: number;
  aiTimer: number;
  ai: Controls;
  lastDamage: string;
  idle: number;
}
export interface Stats {
  matches: number;
  roundsLost: number;
  failures: number;
  ringOuts: number;
  overclocks: number;
  quacks: number;
  biggyHits: number;
}
export class Game {
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(39, 1, 0.1, 150);
  renderer: T.WebGLRenderer;
  world!: R.World;
  arena!: ArenaVisual;
  fighters: Combatant[] = [];
  showcase: Robot[] = [];
  cart!: R.RigidBody;
  input = new Input();
  time = 0;
  timer = 75;
  round = 1;
  wins = [0, 0];
  mode: Mode = "arcade";
  arenaIndex = 0;
  phase: "menu" | "intro" | "fight" | "roundEnd" | "matchEnd" = "menu";
  phaseTime = 0;
  paused = false;
  hitstop = 0;
  shake = 0;
  hazardTime = 0;
  hazardState = "idle";
  forceHazard = 0;
  last = 0;
  accumulator = 0;
  slowMotion = 0;
  cinematic = -1;
  route: FighterId[] = [];
  stage = 0;
  winner = -1;
  stats: Stats = this.emptyStats();
  particles: { mesh: T.Mesh; velocity: T.Vector3; life: number }[] = [];
  sparkGeo = new T.BoxGeometry(0.05, 0.05, 0.15);
  sparkMat = new T.MeshBasicMaterial({ color: "#ffcf6f" });
  spot: T.SpotLight;
  hemi: T.HemisphereLight;
  sun: T.DirectionalLight;
  fog: T.Fog;
  composer: EffectComposer | null = null;
  onUpdate: () => void = () => {};
  onEnd: (winner: number) => void = () => {};
  onAnnounce: (title: string, sub?: string) => void = () => {};
  onAttract: () => void = () => {};
  onExitAttract: () => void = () => {};
  constructor(
    canvas: HTMLCanvasElement,
    public audio: AudioEngine,
    /** Bloom on: off on touch devices and with ?nofx, to keep the frame rate up. */
    public fx = true,
    /** ?lite: no shadows and one pixel per pixel, for software renderers. */
    lite = false,
  ) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(lite ? 1 : Math.min(devicePixelRatio, fx ? 1.75 : 1.5));
    this.renderer.shadowMap.enabled = !lite;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    setAnisotropy(this.renderer.capabilities.getMaxAnisotropy());
    // An environment map is what makes plastic shells and glass lenses read as materials at all.
    const pmrem = new T.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.5;
    pmrem.dispose();
    this.fog = this.scene.fog = new T.Fog("#0b1118", 30, 100);
    this.scene.background = new T.Color("#0b1118");
    this.hemi = new T.HemisphereLight(0xe6eef6, 0x4a4f58, 1.5);
    this.scene.add(this.hemi);
    // One shadow-casting key light over the fight, graded per arena.
    this.sun = new T.DirectionalLight(0xfff0dc, 2.6);
    this.sun.position.set(-8, 16, 10);
    this.sun.castShadow = true;
    // Phones (and the software renderer in CI) get a smaller shadow map.
    this.sun.shadow.mapSize.set(fx ? 2048 : 1024, fx ? 2048 : 1024);
    Object.assign(this.sun.shadow.camera, {
      left: -20,
      right: 20,
      top: 16,
      bottom: -12,
      near: 1,
      far: 60,
    });
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);
    const rim = new T.DirectionalLight("#668fff", 1.2);
    rim.position.set(5, 7, -5);
    this.scene.add(rim);
    this.spot = new T.SpotLight("#ff7c44", 80, 30, 1, 0.8, 1.5);
    this.spot.position.set(-5, 8, 1);
    this.scene.add(this.spot);
    if (fx) {
      // Bloom makes the light fittings, lightboxes and robot eyes read as sources.
      this.composer = new EffectComposer(
        this.renderer,
        new T.WebGLRenderTarget(innerWidth, innerHeight, {
          type: T.HalfFloatType,
          samples: 4,
        }),
      );
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(
        new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.3, 0.55, 1.25),
      );
      this.composer.addPass(new OutputPass());
    }
    this.camera.position.set(0, 4.5, 24);
    this.camera.lookAt(0, 1.8, 0);
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }
  /** Ease the lights and fog towards the arena's grade: bright hall, dark auditorium. */
  grade(dt: number) {
    const g = this.arena.grade,
      k = Math.min(1, dt * 2.5);
    this.hemi.intensity += (g.hemi - this.hemi.intensity) * k;
    this.sun.intensity += (g.sun - this.sun.intensity) * k;
    this.sun.color.lerp(new T.Color(g.sunColor), k);
    this.fog.color.lerp(new T.Color(g.fog), k);
    this.fog.near += (g.near - this.fog.near) * k;
    this.fog.far += (g.far - this.fog.far) * k;
    this.scene.environmentIntensity += (g.env - this.scene.environmentIntensity) * k;
    (this.scene.background as T.Color).copy(this.fog.color);
  }
  emptyStats(): Stats {
    return {
      matches: 0,
      roundsLost: 0,
      failures: 0,
      ringOuts: 0,
      overclocks: 0,
      quacks: 0,
      biggyHits: 0,
    };
  }
  async init() {
    await Promise.all([R.init(), loadRichie()]);
    this.setArena(0);
    this.menuScene();
    requestAnimationFrame((t) => this.frame(t));
  }
  resize() {
    // A tab that opens hidden reports a 0×0 window; a zero-size target cannot be drawn to,
    // and a NaN aspect would poison the camera's lerp for good.
    const w = Math.max(1, innerWidth),
      h = Math.max(1, innerHeight);
    this.renderer.setSize(w, h);
    this.composer?.setPixelRatio(this.renderer.getPixelRatio());
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  setArena(index: number) {
    if (this.arena) {
      this.scene.remove(this.arena.root);
      this.arena.dispose();
    }
    this.arenaIndex = index;
    this.arena = new ArenaVisual(index);
    this.scene.add(this.arena.root);
  }
  menuScene() {
    this.phase = "menu";
    this.cinematic = -1;
    this.audio.active = false;
    this.paused = false;
    this.input.lastActivity = performance.now();
    this.fighters.forEach((f) => disposeRobot(f.model));
    this.fighters = [];
    // The line-up survives menu hops: rebuilding five robots per click is wasted work.
    if (this.showcase.length === FIGHTERS.length) return;
    this.showcase.forEach(disposeRobot);
    this.showcase = FIGHTERS.map((f, i) => {
      const r = robot(f);
      r.root.position.set((i - 2) * 3.3, 0, 0);
      this.scene.add(r.root);
      return r;
    });
    this.paused = false;
    this.input.lastActivity = performance.now();
  }
  start(
    mode: Mode,
    a: FighterId,
    b: FighterId,
    arenaIndex: number,
    newRun = true,
  ) {
    this.mode = mode;
    this.paused = false;
    this.showcase.forEach(disposeRobot);
    this.showcase = [];
    if (newRun) {
      this.stats = this.emptyStats();
      this.stage = 0;
      this.route = FIGHTERS.filter((f) => f.id !== a).map((f) => f.id);
      this.route.push(this.route[Math.floor(Math.random() * 4)]);
    }
    this.setArena(arenaIndex);
    this.wins = [0, 0];
    this.round = 1;
    this.resetRound(a, b);
    this.audio.active = mode !== "attract";
    this.audio.intense =
      mode === "chaos" || (mode === "arcade" && this.stage === 4);
  }
  resetRound(a = this.fighters[0].def.id, b = this.fighters[1].def.id) {
    this.fighters.forEach((f) => disposeRobot(f.model));
    this.world?.free();
    this.world = new R.World({ x: 0, y: -20, z: 0 });
    this.world.timestep = 1 / 60;
    const floor = this.world.createRigidBody(
      R.RigidBodyDesc.fixed().setTranslation(0, -0.3, 0),
    );
    this.world.createCollider(
      R.ColliderDesc.cuboid(
        this.arenaIndex === 1 ? 12 : 13,
        0.3,
        5,
      ).setFriction(0.8),
      floor,
    );
    this.fighters = [a, b].map((id, i) => {
      const def = fighter(id),
        body = this.world.createRigidBody(
          R.RigidBodyDesc.dynamic()
            .setTranslation(i ? 4 : -4, def.height / 2 + 0.08, 0)
            .enabledTranslations(true, true, false)
            .lockRotations()
            .setCcdEnabled(true),
        );
      this.world.createCollider(
        R.ColliderDesc.cuboid(def.width * 0.72, def.height / 2, 0.38)
          .setMass(def.mass)
          .setFriction(0.05)
          .setRestitution(id === "richie" ? 0.3 : 0.02),
        body,
      );
      const model = robot(def);
      this.scene.add(model.root);
      return {
        def,
        body,
        model,
        hp: 100,
        meter:
          this.mode === "training" ||
          (this.mode === "arcade" && this.stage === 4 && i === 1)
            ? 100
            : 0,
        oc: 0,
        roller: 0,
        brace: 0,
        disabled: 0,
        stun: 0,
        face: i ? -1 : 1,
        cooldown: 0,
        hazardCooldown: 0,
        previous: neutral(),
        combo: 0,
        comboTime: 0,
        charge: 0,
        aiTimer: 0,
        ai: neutral(),
        lastDamage: "",
        idle: 0,
      };
    });
    this.cart = this.world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(-6, 0.6, 0)
        .enabledTranslations(true, true, false)
        .lockRotations()
        .setLinearDamping(1.5),
    );
    this.world.createCollider(
      R.ColliderDesc.cuboid(0.55, 0.5, 0.42).setMass(1.1).setFriction(0.2),
      this.cart,
    );
    this.timer = this.mode === "chaos" ? 30 : 75;
    this.phase = "intro";
    this.phaseTime = 2.4;
    this.hazardTime = 0;
    this.hazardState = "idle";
    this.forceHazard = 0;
    this.hitstop = 0;
    this.input.clear();
    this.onAnnounce(`ROUND ${this.round}`, matchup(a, b));
    this.audio.say(this.round === 3 ? "Final round" : `Round ${this.round}`);
  }
  nextArcade() {
    this.stage++;
    if (this.stage < 5)
      this.start(
        "arcade",
        this.fighters[0].def.id,
        this.route[this.stage],
        this.stage,
        false,
      );
  }
  burst(x: number, y: number, n = 15) {
    for (let i = 0; i < n; i++) {
      const m = new T.Mesh(this.sparkGeo, this.sparkMat);
      m.position.set(x, y, 0.5);
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        velocity: new T.Vector3(
          (Math.random() - 0.5) * 10,
          Math.random() * 7,
          (Math.random() - 0.5) * 4,
        ),
        life: 0.3 + Math.random() * 0.4,
      });
    }
  }
  ai(f: Combatant, o: Combatant, dt: number): Controls {
    f.aiTimer -= dt;
    if (f.aiTimer > 0) return f.ai;
    const diff =
      this.audio.settings.difficulty +
      (this.mode === "arcade" && this.stage === 4 ? 1 : 0);
    f.aiTimer =
      [0.38, 0.22, 0.12, 0.08][clamp(diff, 0, 3)] + Math.random() * 0.13;
    const c = neutral(),
      x = f.body.translation().x,
      dx = o.body.translation().x - x,
      dist = Math.abs(dx),
      nearHazard = Math.abs(x - this.arena.hazardX) < 2;
    c.move = dist > f.def.reach + o.def.width * 0.65 ? Math.sign(dx) : 0;
    if (
      (this.hazardState === "warning" || this.hazardState === "armed") &&
      nearHazard &&
      Math.random() < 0.3 + diff * 0.25
    )
      c.move = Math.sign(x - this.arena.hazardX) || -1;
    if (dist < 3.5) {
      const n = Math.random();
      c.block = !!o.attack && n < 0.25 + diff * 0.16;
      if (!c.block) {
        c.light = n < 0.4;
        c.heavy = n >= 0.4 && n < 0.65;
        c.grab = n > 0.88;
        c.special = n >= 0.65 && n < 0.88;
        c.secondary = n > 0.94;
      }
      c.crouch = Math.random() < 0.12;
    }
    c.jump = Math.random() < 0.045;
    c.overclock = f.meter >= 100;
    c.special ||= f.def.id === "biggy" && dist > 3 && Math.random() < 0.2;
    c.special ||= f.def.id === "microduck" && dist > 4 && Math.random() < 0.1;
    if (this.arenaIndex !== 1 && Math.abs(x) > 10) c.move = -Math.sign(x);
    f.ai = c;
    return c;
  }
  beginAttack(f: Combatant, kind: Action, c: Controls) {
    if (f.attack || f.cooldown > 0 || f.stun > 0 || f.hp <= 0) return;
    if ((kind === "special" || kind === "secondary") && f.disabled > 0) return;
    if (kind === "special" && f.def.id === "droid") {
      if (
        Math.abs(f.body.translation().x - this.arena.hazardX) < 7 ||
        f.oc > 0
      ) {
        this.forceHazard = 2;
        this.onAnnounce("SYSTEM OVERRIDE", "HAZARD ARMING");
      }
      f.cooldown = 1.2;
      return;
    }
    if (kind === "secondary" && f.def.id === "biggy") {
      f.brace = 3;
      f.cooldown = 0.5;
      this.onAnnounce("ABSOLUTE UNIT", "BRACED FOR IMPACT");
      return;
    }
    if (kind === "special" && f.def.id === "microduck") {
      f.roller = f.roller > 0 ? 0 : 5;
      f.cooldown = 0.35;
      this.audio.quack();
      this.stats.quacks++;
      return;
    }
    const def = ATTACKS[kind],
      speed = (f.oc > 0 && f.def.id === "voxxy" ? 1.8 : 1) * f.def.recovery;
    f.attack = {
      kind,
      t: 0,
      hit: false,
      duration: (def.startup + def.active + def.recovery) / speed,
    };
    const v = f.body.linvel();
    if (f.def.id === "richie" && (kind === "heavy" || kind === "special"))
      f.body.setLinvel(
        {
          x: f.face * (kind === "special" ? 12 : 8) * (f.oc > 0 ? 1.4 : 1),
          y: kind === "special" ? 10 : 4,
          z: 0,
        },
        true,
      );
    if (
      (f.def.id === "voxxy" && kind === "secondary") ||
      (f.def.id === "microduck" && kind === "secondary")
    )
      f.body.setLinvel({ x: f.face * 12, y: 2, z: 0 }, true);
    if (f.def.id === "biggy" && kind === "special")
      f.body.setLinvel({ x: f.face * (8 + f.charge * 7), y: v.y, z: 0 }, true);
    if (kind === "grab" && c.move) f.face = Math.sign(c.move);
  }
  damage(
    target: Combatant,
    amount: number,
    ix: number,
    iy: number,
    source: string,
    heavy = false,
  ) {
    target.hp = clamp(target.hp - amount, 0, 100);
    target.lastDamage = source;
    target.stun = (heavy ? 0.36 : 0.17) / target.def.recovery;
    target.attack = undefined;
    target.meter = clamp(target.meter + amount * 1.35, 0, 100);
    const v = target.body.linvel();
    target.body.setLinvel(
      { x: clamp(v.x + ix, -27, 27), y: Math.max(v.y, iy), z: 0 },
      true,
    );
    this.burst(
      target.body.translation().x,
      target.body.translation().y,
      heavy ? 24 : 10,
    );
    this.audio.hit(heavy);
    this.shake = heavy ? 0.24 : 0.075;
    this.hitstop = heavy ? 0.07 : 0.03;
    if (target.hp <= 0 || Math.abs(ix) > 20) this.slowMotion = 0.45;
  }
  strike(f: Combatant, o: Combatant) {
    const a = f.attack!;
    if (a.hit) return;
    const d = ATTACKS[a.kind],
      fp = f.body.translation(),
      op = o.body.translation();
    let reach = f.def.reach * d.range;
    if (f.def.id === "droid" && a.kind === "secondary") reach *= 1.6;
    if (f.oc > 0 && f.def.id === "voxxy") reach *= 1.2;
    const dx = op.x - fp.x,
      low = a.kind === "low",
      vertical = Math.abs(fp.y - f.def.height / 2 - (op.y - o.def.height / 2));
    if (
      Math.abs(dx) > reach + o.def.width * 0.75 ||
      dx * f.face < -0.2 ||
      vertical > Math.max(0.9, f.def.height * 0.65)
    )
      return;
    if (
      o.def.id === "richie" &&
      o.previous.crouch &&
      !low &&
      a.kind === "light"
    )
      return;
    a.hit = true;
    const throwing =
      a.kind === "grab" || (f.def.id === "voxxy" && a.kind === "special");
    const block =
      o.previous.block &&
      !throwing &&
      o.stun <= 0 &&
      (op.x - fp.x) * o.face < 0 &&
      (!low || o.previous.crouch);
    let amount =
        d.damage *
        f.def.power *
        (f.oc > 0 ? 1.2 : 1) *
        (a.kind === "light" && f.combo > 0 ? 1.15 : 1),
      impulse = d.impulse;
    if (f.def.id === "biggy" && a.kind === "special") {
      impulse += Math.abs(f.body.linvel().x) * 0.7;
      amount += f.charge * 4;
      f.charge = 0;
    }
    if (f.def.id === "microduck" && f.roller > 0)
      impulse += Math.abs(f.body.linvel().x) * 0.5;
    if (block) {
      amount *= 0.12;
      impulse *= 0.22;
      this.audio.tone(740, 0.07, "triangle", 0.2);
    }
    const kb = knockback(
      impulse,
      f.def.power,
      o.def.mass,
      o.brace > 0 || (o.def.id === "biggy" && o.previous.crouch),
    );
    if (throwing && f.def.id === "microduck" && o.def.id === "biggy") {
      f.body.setLinvel({ x: f.face * 6, y: 3, z: 0 }, true);
      amount *= 0.4;
    }
    this.damage(
      o,
      amount,
      kb * f.face,
      block ? 0.25 : d.lift,
      throwing ? "throw" : "attack",
      !block && a.kind !== "light",
    );
    f.meter = clamp(
      f.meter + (block ? 3 : 10) * (this.mode === "chaos" ? 2 : 1),
      0,
      100,
    );
    f.combo = f.comboTime > 0 ? f.combo + 1 : 1;
    f.comboTime = 1.1;
    if (block) o.stun = 0.08;
    if (f.combo >= 2 && !block)
      this.onAnnounce(
        `${f.combo} HIT COMBO`,
        f.def.id === "richie" ? "BONK. BONK." : f.def.name,
      );
    if (f.def.id === "biggy" && o.hp > 0 && o === this.fighters[0])
      this.stats.biggyHits++;
  }
  updateFighter(f: Combatant, o: Combatant, c: Controls, dt: number) {
    for (const k of [
      "oc",
      "roller",
      "brace",
      "disabled",
      "stun",
      "cooldown",
      "hazardCooldown",
      "comboTime",
    ] as const)
      f[k] = Math.max(0, f[k] - dt);
    const p = f.body.translation(),
      v = f.body.linvel(),
      ground = p.y - f.def.height / 2 < 0.15;
    if (!f.attack) f.face = o.body.translation().x >= p.x ? 1 : -1;
    f.idle = c.move || c.light || c.heavy ? 0 : f.idle + dt;
    if (c.overclock && f.meter >= 100 && f.oc <= 0) {
      f.oc = 5;
      f.meter = 0;
      this.stats.overclocks++;
      this.onAnnounce(
        f.def.overclock,
        f.def.id === "richie" ? "THIS WAS A BAD IDEA" : "OVERCLOCK ACTIVE",
      );
      this.audio.say("Overclock");
      if (f.def.id === "droid") this.forceHazard = 2;
    }
    if (f.stun <= 0 && f.hp > 0) {
      const boost = f.oc > 0 ? 1.45 : 1,
        roller = f.roller > 0 || (f.oc > 0 && f.def.id === "microduck");
      let speed =
        f.def.speed *
        boost *
        (roller ? 1.55 : 1) *
        (c.block ? 0.32 : 1) *
        (c.crouch ? 0.35 : 1) *
        (f.brace > 0 ? 0.4 : 1);
      let vx = v.x;
      if (!f.attack || f.attack.kind === "light" || f.attack.kind === "low") {
        if (c.move)
          vx +=
            c.move *
            f.def.accel *
            dt *
            (ground ? 1 : f.def.id === "richie" ? 0.16 : 0.45) *
            (f.oc > 0 ? 1.3 : 1);
        else
          vx *= Math.exp(
            -dt * (roller ? 0.4 : f.def.friction) * (ground ? 1 : 0.08),
          );
        if (Math.abs(vx) > speed && Math.sign(vx) === Math.sign(c.move))
          vx = T.MathUtils.lerp(vx, Math.sign(vx) * speed, dt * 7);
        f.body.setLinvel({ x: vx, y: v.y, z: 0 }, true);
      }
      if (f.def.id === "biggy" && c.special) {
        f.charge = clamp(f.charge + dt, 0, 1.5);
        f.body.setLinvel(
          {
            x: clamp(vx + f.face * dt * 8, -14 * boost, 14 * boost),
            y: v.y,
            z: 0,
          },
          true,
        );
        if (Math.abs(o.body.translation().x - p.x) < 2.5)
          this.beginAttack(f, "special", c);
      }
      if (f.def.id === "biggy" && !c.special && f.previous.special) {
        this.beginAttack(f, "special", c);
      }
      if (f.def.id === "richie" && c.jump)
        f.charge = clamp(f.charge + dt, 0, 1);
      if (
        ground &&
        ((c.jump && !f.previous.jump && f.def.id !== "richie") ||
          (f.def.id === "richie" &&
            ((!c.jump && f.previous.jump) ||
              (Math.abs(c.move) > 0.1 && !c.jump))))
      ) {
        f.body.setLinvel(
          {
            x: f.body.linvel().x,
            y:
              (f.def.id === "richie" && f.previous.jump
                ? f.def.jump * (0.7 + f.charge * 0.6)
                : c.jump
                  ? f.def.jump
                  : f.def.jump * 0.47) * boost,
            z: 0,
          },
          true,
        );
        this.audio.tone(140, 0.07, "sine", 0.035, 120);
        if (f.def.id === "richie") f.charge = 0;
      }
      if (!c.block) {
        if (c.grab && !f.previous.grab) this.beginAttack(f, "grab", c);
        else if (c.secondary && !f.previous.secondary)
          this.beginAttack(f, "secondary", c);
        else if (c.special && !f.previous.special && f.def.id !== "biggy")
          this.beginAttack(f, "special", c);
        else if (c.heavy && !f.previous.heavy)
          this.beginAttack(f, c.crouch ? "low" : "heavy", c);
        else if (c.light && !f.previous.light)
          this.beginAttack(f, c.crouch ? "low" : "light", c);
      }
    }
    if (f.attack) {
      const a = f.attack,
        d = ATTACKS[a.kind],
        speed = f.def.recovery * (f.oc > 0 && f.def.id === "voxxy" ? 1.8 : 1);
      a.t += dt;
      const at = a.t * speed;
      if (at >= d.startup && at < d.startup + d.active) this.strike(f, o);
      if (
        f.def.id === "richie" &&
        a.kind === "secondary" &&
        at > d.startup &&
        at < d.startup + d.active
      ) {
        if (
          Math.floor((at - d.startup) * 16) !==
          Math.floor((at - d.startup - dt * speed) * 16)
        )
          a.hit = false;
      }
      if (a.t >= a.duration) {
        if (f.def.id === "richie" && a.kind === "heavy" && !a.hit) f.stun = 0.4;
        f.attack = undefined;
        f.cooldown = 0.05;
      }
    }
    if (Math.abs(p.x) > 11.6 && this.arenaIndex !== 1) {
      f.body.setTranslation({ x: Math.sign(p.x) * 11.6, y: p.y, z: 0 }, true);
      f.body.setLinvel(
        { x: -v.x * (f.def.id === "richie" ? 0.85 : 0.3), y: v.y, z: 0 },
        true,
      );
      if (Math.abs(v.x) > 9 && f.hazardCooldown <= 0) {
        this.damage(f, 4, -Math.sign(p.x) * 3, 2, "wall", true);
        f.hazardCooldown = 0.6;
      }
    }
    if (this.arenaIndex === 1 && Math.abs(p.x) > 12) {
      if (f.hazardCooldown <= 0) {
        this.damage(f, 20, -Math.sign(p.x) * 12, 6, "stairs", true);
        f.hazardCooldown = 1.8;
        this.onAnnounce("BONK. BONK. BONK.", "MIND THE STAIRS");
      }
      if (p.y < -3) {
        f.hp = 0;
        f.lastDamage = "ringout";
      }
    }
    f.previous = { ...c };
  }
  hazards(dt: number) {
    this.hazardTime += dt;
    const fast =
      this.mode === "chaos" || (this.mode === "arcade" && this.stage === 4);
    const previous = this.hazardState;
    if (this.forceHazard > 0) {
      this.forceHazard -= dt;
      this.hazardState =
        this.forceHazard > 1
          ? "warning"
          : this.forceHazard > 0.6
            ? "armed"
            : "active";
    } else this.hazardState = hazardPhase(this.hazardTime, fast);
    if (this.hazardState === "warning" && previous !== "warning") {
      this.audio.alarm();
      this.onAnnounce(
        "⚠ " + ARENAS[this.arenaIndex].hazard,
        "HAZARD ARMING — CLEAR THE STRIP",
      );
    }
    this.fighters.forEach((f) => {
      const p = f.body.translation(),
        near =
          Math.abs(p.x - this.arena.hazardX) < 1.9 &&
          p.y - f.def.height / 2 < 1.5;
      if (this.hazardState === "active" && near && f.hazardCooldown <= 0) {
        f.hazardCooldown = 1.5;
        f.meter = clamp(f.meter + 15, 0, 100);
        if (this.arenaIndex === 5) {
          f.disabled = 4;
          this.onAnnounce("FACTORY RESET", "SPECIALS OFFLINE · 4 SECONDS");
        } else if (this.arenaIndex !== 1)
          this.damage(
            f,
            this.arenaIndex === 2 ? 8 : 12,
            this.arenaIndex === 2 ? 12 : (p.x < 0 ? -1 : 1) * 5,
            this.arenaIndex === 2 ? 2 : 12,
            "hazard",
            true,
          );
      }
      const cp = this.cart.translation(),
        cv = this.cart.linvel();
      if (
        Math.abs(cp.x - p.x) < 1.2 &&
        Math.abs(cv.x) > 3 &&
        f.hazardCooldown <= 0
      ) {
        this.damage(f, 5, cv.x * 0.6, 2, "cart");
        f.hazardCooldown = 1;
        this.burst(cp.x, 0.7, 8);
      }
    });
    if (
      this.mode === "chaos" ||
      this.arenaIndex === 2 ||
      this.arenaIndex === 4
    ) {
      const cp = this.cart.translation();
      if (Math.abs(cp.x) > 9)
        this.cart.setLinvel({ x: -Math.sign(cp.x) * 4, y: 0, z: 0 }, true);
      else if (Math.abs(this.cart.linvel().x) < 1)
        this.cart.applyImpulse(
          { x: Math.sin(this.time * 0.4) > 0 ? 2 : -2, y: 0, z: 0 },
          true,
        );
    }
    if (this.cart.translation().y < -3)
      this.cart.setTranslation({ x: -6, y: 1, z: 0 }, true);
  }
  endRound() {
    const [a, b] = this.fighters;
    this.winner = Math.abs(a.hp - b.hp) < 0.01 ? -1 : a.hp > b.hp ? 0 : 1;
    if (this.winner >= 0) this.wins[this.winner]++;
    if (this.winner === 1) this.stats.roundsLost++;
    const dead = this.fighters.filter((f) => f.hp <= 0);
    this.stats.failures += dead.length;
    this.stats.ringOuts += dead.filter(
      (f) => f.lastDamage === "ringout",
    ).length;
    let title =
      this.winner === -1
        ? "DEADLOCK"
        : dead.some((f) => f.lastDamage === "ringout")
          ? "OUT OF BOUNDS"
          : dead.some((f) =>
                ["hazard", "stairs", "cart"].includes(f.lastDamage),
              )
            ? "ENVIRONMENT ERROR"
            : this.timer <= 0
              ? "TIME LIMIT"
              : "SYSTEM FAILURE";
    if (this.winner >= 0 && this.fighters[this.winner].hp <= 10)
      title = "RACE CONDITION";
    if (this.winner === 0 && a.hp === 100) {
      title = a.def.id === "richie" ? "UNTOUCHED. SOMEHOW." : "PERFECT BUILD";
    }
    this.phase = "roundEnd";
    this.phaseTime = 3.2;
    this.onAnnounce(
      title,
      this.winner < 0
        ? "REBOOTING THE ROUND"
        : `${this.fighters[this.winner].def.name} WINS`,
    );
    this.audio.say(title);
    this.shake = 0.2;
  }
  step(dt: number) {
    if (this.phase === "menu" || this.paused) return;
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }
    this.phaseTime -= dt;
    if (this.phase === "intro" && this.phaseTime <= 0) {
      this.phase = "fight";
      this.onAnnounce("EXECUTE!");
      this.audio.say("Execute");
    }
    if (this.phase === "fight") {
      if (this.mode !== "training") this.timer = Math.max(0, this.timer - dt);
      const [a, b] = this.fighters;
      const ca =
        this.mode === "attract"
          ? this.ai(a, b, dt)
          : this.input.read(0, this.mode === "versus");
      const cb =
        this.mode === "versus"
          ? this.input.read(1, true)
          : this.mode === "training"
            ? neutral()
            : this.ai(b, a, dt);
      this.updateFighter(a, b, ca, dt);
      this.updateFighter(b, a, cb, dt);
      this.hazards(dt);
      this.world.step();
      if (this.mode === "training" && (a.hp <= 0 || b.hp <= 0)) {
        a.hp = b.hp = 100;
        a.meter = b.meter = 100;
      } else if (a.hp <= 0 || b.hp <= 0 || this.timer <= 0) this.endRound();
    } else if (this.phase === "roundEnd") {
      this.world.step();
      if (this.phaseTime <= 0) {
        if (Math.max(...this.wins) >= 2) {
          this.phase = "matchEnd";
          if (this.winner === 0) this.stats.matches++;
          this.audio.active = false;
          this.onEnd(this.winner);
        } else {
          this.round++;
          this.resetRound();
        }
      }
    }
  }
  frame(now: number) {
    const dt = Math.min((now - (this.last || now)) / 1000, 0.05);
    this.last = now;
    this.time += dt;
    this.input.pollMenus();
    if (!this.paused) {
      this.accumulator += dt * (this.slowMotion > 0 ? 0.35 : 1);
      this.slowMotion = Math.max(0, this.slowMotion - dt);
      while (this.accumulator >= 1 / 60) {
        this.step(1 / 60);
        this.accumulator -= 1 / 60;
      }
      this.audio.update(dt);
    }
    if (this.phase === "menu") {
      this.showcase.forEach((r, i) =>
        animateRobot(r, {
          time: this.time + i,
          speed: 0,
          face: i < 2 ? 1 : -1,
          attackProgress: 0,
          hurt: 0,
          dead: false,
          block: false,
          crouch: false,
          air: false,
          overclock: false,
          roller: false,
        }),
      );
      if (now - this.input.lastActivity > 45000) this.onAttract();
    }
    if (
      this.mode === "attract" &&
      this.phase !== "menu" &&
      now - this.input.lastActivity < 200
    )
      this.onExitAttract();
    this.fighters.forEach((f) => {
      const p = f.body.translation(),
        v = f.body.linvel();
      f.model.root.position.set(p.x, p.y - f.def.height / 2, 0);
      animateRobot(f.model, {
        time: this.time,
        speed: this.paused ? 0 : v.x,
        face: f.face,
        attack: f.attack?.kind,
        attackProgress: f.attack ? f.attack.t / f.attack.duration : 0,
        hurt: f.stun,
        dead: f.hp <= 0,
        block: f.previous.block,
        crouch: f.previous.crouch,
        air: p.y - f.def.height / 2 > 0.2,
        overclock: f.oc > 0,
        roller: f.roller > 0,
        charge: f.def.id === "richie" ? f.charge : 0,
      });
      if (f.hp < 25 && Math.random() < dt * 6)
        this.burst(p.x, p.y + f.def.height * 0.35, 1);
    });
    if (this.cart) {
      const p = this.cart.translation();
      this.arena.cart.position.set(p.x, p.y - 0.5, 0);
    }
    this.arena.update(this.time, this.hazardState);
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        return false;
      }
      p.velocity.y -= 14 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.scale.setScalar(p.life * 2);
      return true;
    });
    const menu = this.phase === "menu",
      mid = menu
        ? 0
        : this.fighters.reduce((s, f) => s + f.body.translation().x, 0) / 2,
      dist = menu
        ? 14
        : Math.abs(
            this.fighters[0].body.translation().x -
              this.fighters[1].body.translation().x,
          );
    const aspect = this.camera.aspect,
      needed =
        (dist + 7) /
        2 /
        Math.tan(T.MathUtils.degToRad(39 / 2)) /
        Math.max(aspect, 0.6);
    const z = menu ? Math.max(22, 24 / aspect) : clamp(needed, 15, 40);
    const target = new T.Vector3(clamp(mid, -3, 3), menu ? 4.3 : 3.6, z);
    this.camera.position.lerp(target, dt * 3);
    const shake = this.audio.settings.reducedShake ? 0 : this.shake;
    this.camera.position.x += (Math.random() - 0.5) * shake;
    this.camera.position.y += (Math.random() - 0.5) * shake;
    this.shake = Math.max(0, this.shake - dt * 1.5);
    this.camera.lookAt(clamp(mid, -3, 3), menu ? 4.4 : 1.7, 0);
    if (this.cinematic >= 0) {
      const shot = this.cinematic;
      if (shot < 2) {
        this.camera.position.lerp(new T.Vector3(-10 + shot * 5, 4, 19), dt * 2);
        this.camera.lookAt(0, 2, -2);
      } else if (shot < 5) {
        const subject =
          this.showcase[Math.min(4, shot === 2 ? 0 : shot === 3 ? 2 : 4)];
        if (subject) {
          this.camera.position.lerp(
            new T.Vector3(subject.root.position.x + 1, 2.2, 8),
            dt * 3,
          );
          this.camera.lookAt(subject.root.position.x, 1.3, 0);
        }
      }
      this.spot.intensity = shot < 2 ? 8 : 80 + Math.sin(this.time * 9) * 35;
    } else this.spot.intensity = menu ? 60 : 0;
    this.grade(dt);
    // The key light follows the fight so its shadow map stays tight on the fighters.
    this.sun.target.position.set(clamp(mid, -3, 3), 0, 0);
    this.sun.position.set(clamp(mid, -3, 3) - 8, 16, 10);
    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
    this.onUpdate();
    requestAnimationFrame((t) => this.frame(t));
  }
}
