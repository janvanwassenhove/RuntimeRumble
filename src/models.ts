// The five fighters. Voxxy, Droid and Biggy are the Robot Games model-sheet builds shared
// with Please Do Not Throw Richie (https://game.devoxx.be/references.html, see
// docs/REFERENCES.md): proportions measured off the front and profile views, materials to
// match — Voxxy is clear-coated injection-moulded plastic, Droid scuffed graphite plate,
// Biggy chipped paint over rusting steel. Richie is the real Reachy Mini geometry
// (src/assets/richie.glb, Apache-2.0, see src/assets/NOTICE-reachy-mini.md). Microduck is
// built the same way from Pollen's product photographs. Every model is a few hundred
// primitives baked by the kit into a handful of merged meshes; only the joints that the
// fight animates stay separate groups. Models face +Z and stand with their feet at y=0;
// `robot()` scales each one to its fighter definition's height.
import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import richieUrl from "./assets/richie.glb?url";
import { FighterDef } from "./data";
import {
  Kit,
  pivot,
  canvasTex,
  seam,
  profile,
  vAt,
  plastic,
  plate,
  steel,
  glow,
  UP,
  type V3,
} from "./kit";
import { tex, image } from "./textures";

export const mat = (color: string | number, metal = 0.45, rough = 0.4) =>
  new T.MeshStandardMaterial({ color, metalness: metal, roughness: rough });

export interface Pose {
  time: number;
  speed: number;
  face: number;
  attack?: string;
  attackProgress: number;
  hurt: number;
  dead: boolean;
  block: boolean;
  crouch: boolean;
  air: boolean;
  overclock: boolean;
  roller: boolean;
  /** Richie's hop charge, 0..1: his head sinks into the shell as it builds. */
  charge?: number;
}
export interface Robot {
  root: T.Group;
  body: T.Group;
  head: T.Group;
  arms: T.Group[];
  legs: T.Group[];
  eyes: T.Mesh[];
  rollers: T.Group;
  animate: (p: Pose) => void;
  dispose: () => void;
}

const L = (cur: number, target: number, k = 0.22) => cur + (target - cur) * k;
/** The swing of an attack: 0 at the start, 1 at the moment of contact, back to 0. */
const swing = (p: Pose) => Math.sin(Math.min(1, p.attackProgress) * Math.PI);
/** Wind-up then strike: negative while the arm draws back, 1 at contact. */
const strike = (p: Pose) => {
  const x = Math.min(1, p.attackProgress);
  return x < 0.3 ? -x / 0.3 : Math.sin(((x - 0.3) / 0.7) * Math.PI);
};

type Rig = {
  root: T.Group;
  rig: T.Group;
  lean: T.Group;
  natural: number;
  mats: Set<T.Material>;
};
function rigFor(def: FighterDef, natural: number): Rig {
  const root = new T.Group(),
    rig = new T.Group(),
    lean = new T.Group();
  root.add(rig);
  rig.add(lean);
  rig.scale.setScalar(def.height / natural);
  root.userData.id = def.id;
  return { root, rig, lean, natural, mats: new Set() };
}
/** Facing, the fallen pose and the crouch are common to everyone. */
function common(r: Rig, p: Pose, squat: number) {
  r.root.rotation.y = L(r.root.rotation.y, p.face > 0 ? 0.78 : -0.78, 0.18);
  const target = p.dead ? -p.face * 1.42 : p.hurt > 0 ? -p.face * 0.22 : 0;
  r.lean.rotation.z = L(r.lean.rotation.z, target, p.dead ? 0.1 : 0.2);
  r.lean.position.y = L(r.lean.position.y, p.dead ? 0.06 : p.crouch ? -squat : 0, 0.25);
}
/** Every material a robot's meshes use, for disposal. Textures are shared and stay. */
function collect(r: Rig) {
  r.root.traverse((o) => {
    const m = (o as T.Mesh).material;
    if (m && !o.userData.shared) (Array.isArray(m) ? m : [m]).forEach((x) => r.mats.add(x));
  });
}
function finish(r: Rig, parts: Partial<Robot>, animate: (p: Pose) => void): Robot {
  collect(r);
  return {
    root: r.root,
    body: parts.body ?? r.lean,
    head: parts.head ?? r.lean,
    arms: parts.arms ?? [],
    legs: parts.legs ?? [],
    eyes: parts.eyes ?? [],
    rollers: parts.rollers ?? new T.Group(),
    animate,
    dispose: () => {
      r.root.removeFromParent();
      r.root.traverse((o) => {
        if ((o as T.Mesh).isMesh && !o.userData.shared) (o as T.Mesh).geometry.dispose();
      });
      r.mats.forEach((m) => m.dispose());
    },
  };
}

// ------------------------------------------------------------------ Voxxy
// Model sheet 01: a wide glossy head with bear ears and a black LED visor, headphone discs
// on the sides, a pear-shaped body with a cat badge, thin black upper arms into big teardrop
// forearms with a white band and three-claw hands, and two stick legs.
const ORANGE = "#f0640f";
let voxxyMaps: {
  body: T.Texture;
  head: T.Texture;
  arm: T.Texture;
  visorAlpha: T.Texture;
  visorEyes: T.Texture;
  bodyPts: T.Vector2[];
  armPts: T.Vector2[];
} | null = null;
function voxxyTextures() {
  if (voxxyMaps) return voxxyMaps;
  const bodyPts = profile(
    [[0, 0.3], [0.17, 0.31], [0.285, 0.38], [0.335, 0.52], [0.325, 0.66], [0.285, 0.82], [0.225, 0.98], [0.165, 1.1], [0.115, 1.18], [0, 1.215]],
    36,
  );
  const Y = (y: number, h: number) => (1 - vAt(bodyPts, y)) * h;
  const body = canvasTex(1024, 1024, (c, w, h) => {
    c.fillStyle = ORANGE;
    c.fillRect(0, 0, w, h);
    // Chest plate, belly hatch with its slot, side seams and a back panel (u=.5 is the front).
    seam(c, () => c.roundRect(w * 0.5 - 150, Y(1.12, h), 300, Y(0.63, h) - Y(1.12, h), 70));
    seam(c, () => c.roundRect(w * 0.5 - 185, Y(0.6, h), 370, Y(0.36, h) - Y(0.6, h), [30, 30, 90, 90]));
    for (const u of [0.24, 0.76]) seam(c, () => { c.moveTo(w * u, Y(1.15, h)); c.lineTo(w * u, Y(0.34, h)); });
    for (const x of [0, w]) seam(c, () => c.roundRect(x - 170, Y(1.05, h), 340, Y(0.5, h) - Y(1.05, h), 60));
    c.fillStyle = "rgba(40,14,0,.8)";
    c.beginPath(); c.roundRect(w * 0.5 - 40, Y(0.47, h), 80, 13, 6); c.fill();
    c.fillStyle = "rgba(60,20,0,.75)";
    for (const [x, y] of [[-128, 1.06], [128, 1.06], [-128, 0.68], [128, 0.68], [-160, 0.56], [160, 0.56]]) { c.beginPath(); c.arc(w * 0.5 + x, Y(y, h), 4, 0, 7); c.fill(); }
    // The badge: a white cat face, eyes and nose cut out in body colour.
    const cx = w * 0.5, cy = Y(0.95, h);
    c.fillStyle = "#f6f3ee";
    c.beginPath(); c.ellipse(cx, cy, 52, 44, 0, 0, 7); c.fill();
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * 50, cy - 8); c.lineTo(cx + s * 48, cy - 50); c.lineTo(cx + s * 14, cy - 36); c.fill(); }
    c.fillStyle = ORANGE;
    for (const s of [-1, 1]) { c.beginPath(); c.arc(cx + s * 20, cy - 2, 7, 0, 7); c.fill(); }
    c.beginPath(); c.moveTo(cx - 7, cy + 12); c.lineTo(cx + 7, cy + 12); c.lineTo(cx, cy + 21); c.fill();
  });
  const head = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = ORANGE;
    c.fillRect(0, 0, w, h);
    seam(c, () => { c.moveTo(0, h * 0.7); c.lineTo(w, h * 0.7); });
    seam(c, () => { c.moveTo(w * 0.75, h * 0.08); c.lineTo(w * 0.75, h * 0.7); });
    seam(c, () => c.roundRect(w * 0.75 - 120, h * 0.3, 240, 150, 40));
  });
  const arm = canvasTex(256, 512, (c, w, h) => {
    c.fillStyle = ORANGE;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#f4f1ec";
    c.fillRect(0, h * 0.36, w, h * 0.25);
    seam(c, () => { c.moveTo(0, h * 0.36); c.lineTo(w, h * 0.36); }, "rgba(30,20,10,.6)");
    seam(c, () => { c.moveTo(0, h * 0.61); c.lineTo(w, h * 0.61); }, "rgba(30,20,10,.6)");
    seam(c, () => c.roundRect(w * 0.5 - 50, h * 0.68, 100, 110, 22));
  });
  const visorAlpha = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#000"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 100); c.fill(); }, false);
  const visorEyes = canvasTex(512, 384, (c, w, h) => {
    c.fillStyle = "#000";
    c.fillRect(0, 0, w, h);
    for (const ex of [0.3, 0.7]) for (let y = 0; y < h; y += 7) for (let x = 0; x < w; x += 7) {
      const dx = (x - w * ex) / 66, dy = (y - h * 0.5) / 44, d = dx * dx + dy * dy;
      if (d < 1) { c.fillStyle = `rgba(255,${(150 - d * 60) | 0},${(40 - d * 30) | 0},${(1 - d) ** 0.7})`; c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill(); }
    }
  });
  const armPts = profile([[0, -0.655], [0.095, -0.63], [0.14, -0.56], [0.15, -0.46], [0.125, -0.34], [0.085, -0.2], [0.05, -0.06], [0.035, -0.005], [0, 0]], 22);
  return (voxxyMaps = { body, head, arm, visorAlpha, visorEyes, bodyPts, armPts });
}
function buildVoxxy(def: FighterDef): Robot {
  const R = rigFor(def, 2.06), g = R.lean, k = new Kit(), M = voxxyTextures();
  const shell = plastic(0xffffff, M.body), skull = plastic(0xffffff, M.head), arm = plastic(0xffffff, M.arm);
  const orange = plastic(ORANGE), white = plastic(0xf4f1ec), rubber = new T.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.55, metalness: 0.1 });
  const dark = steel(0x15171b, 0.4, 0.7), ring = glow(0xff7a1a, 2.4);
  // The visor: black glass with a dot-matrix pair of eyes, masked to a rounded screen.
  const visor = new T.MeshPhysicalMaterial({
    color: 0x020203, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.6, alphaTest: 0.5,
    alphaMap: M.visorAlpha, emissive: 0xffffff, emissiveIntensity: 2.2, emissiveMap: M.visorEyes,
  });
  const body = pivot(g, 0, 0, 0);
  k.add(new T.LatheGeometry(M.bodyPts, 36, Math.PI), shell, body);
  k.add(new T.CylinderGeometry(0.055, 0.07, 0.1, 10), dark, body, { p: [0, 1.21, 0] });
  const head = pivot(body, 0, 1.22, 0), HS: V3 = [0.63, 0.4, 0.475];
  k.add(new T.SphereGeometry(1, 36, 22), skull, head, { p: [0, 0.4, 0], s: HS });
  k.add(new T.SphereGeometry(1.012, 28, 16, Math.PI / 2 - 0.8, 1.6, 1.0, 1.36), visor, head, { p: [0, 0.4, 0], s: HS });
  k.add(new T.TorusGeometry(0.1, 0.028, 10, 28), dark, head, { p: [0, 0.025, 0], r: [Math.PI / 2, 0, 0] });
  const ears = [-1, 1].map((s) => {
    const ear = pivot(head, s * 0.4, 0.7, -0.01);
    k.ball(orange, ear, [0, 0.07, 0], 0.115, [1, 1, 0.78]);
    k.ball(white, ear, [0, 0.085, -0.035], 0.1, [0.98, 1, 0.7]);
    // Headphone discs: white housing, black face, a lit ring round a square sensor.
    const q = new T.Quaternion().setFromUnitVectors(UP, new T.Vector3(s, 0, 0));
    k.ball(white, head, [s * 0.595, 0.39, -0.04], 1, [0.085, 0.2, 0.2]);
    k.add(new T.CylinderGeometry(0.128, 0.135, 0.03, 20), rubber, head, { p: [s * 0.672, 0.39, -0.04], q });
    k.add(new T.TorusGeometry(0.078, 0.013, 10, 32), ring, head, { p: [s * 0.688, 0.39, -0.04], r: [0, Math.PI / 2, 0] });
    k.add(new T.BoxGeometry(0.012, 0.07, 0.07), ring, head, { p: [s * 0.686, 0.39, -0.04] });
    k.add(new T.BoxGeometry(0.016, 0.046, 0.046), rubber, head, { p: [s * 0.688, 0.39, -0.04] });
    return ear;
  });
  const arms = [-1, 1].map((s) => {
    const sh = pivot(body, s * 0.215, 1.03, 0);
    k.ball(orange, sh, [0, 0, 0], 0.058);
    k.rod(rubber, sh, [0, 0, 0], [0, -0.3, 0], 0.021);
    const el = pivot(sh, 0, -0.3, 0);
    k.ball(dark, el, [0, 0, 0], 0.034);
    k.add(new T.LatheGeometry(M.armPts, 20, Math.PI), arm, el);
    for (const a of [0, 2.1, 4.2]) {
      const dx = Math.sin(a + s * 0.5), dz = Math.cos(a + s * 0.5);
      const b: V3 = [dx * 0.05, -0.64, dz * 0.05], kn: V3 = [dx * 0.1, -0.71, dz * 0.1], tip: V3 = [dx * 0.075, -0.79, dz * 0.075];
      k.ball(rubber, el, b, 0.03); k.rod(rubber, el, b, kn, 0.02); k.ball(rubber, el, kn, 0.027); k.rod(rubber, el, kn, tip, 0.019, 0.012); k.ball(rubber, el, tip, 0.015);
    }
    return { sh, el, s };
  });
  const legs = [-1, 1].map((s) => {
    const hip = pivot(g, s * 0.115, 0.34, 0);
    k.ball(dark, hip, [0, 0, 0], 0.04);
    k.rod(dark, hip, [0, 0, 0], [0, -0.25, 0], 0.022);
    k.add(new T.CylinderGeometry(0.034, 0.04, 0.04, 14), orange, hip, { p: [0, -0.24, 0] });
    k.ball(orange, hip, [0, -0.29, 0.045], 0.085, [0.78, 0.5, 1.5]);
    return hip;
  });
  k.bake();
  let ph = 0, m = 0, blink = 0;
  return finish(R, { body, head, arms: arms.map((a) => a.sh), legs }, (p) => {
    const t = p.time, mv = Math.min(1, Math.abs(p.speed) / 6);
    m = L(m, mv, 0.2); ph += 0.19 * m; blink = Math.sin(t * 1.3) > 0.985 ? 1 : 0;
    const a = p.attack, hit = a ? swing(p) : 0, st = a ? strike(p) : 0, oc = p.overclock ? 1 : 0;
    common(R, p, 0.22);
    body.position.y = Math.abs(Math.sin(ph)) * 0.07 * m + Math.sin(t * 2.3) * 0.012 + (a === "secondary" ? 0.15 * hit : 0);
    body.rotation.z = Math.sin(ph) * 0.05 * m;
    body.rotation.x = L(body.rotation.x, 0.06 * m + (a === "heavy" ? 0.35 * st : a === "special" ? -0.25 + 0.5 * st : a === "secondary" ? 0.55 * hit : p.block ? 0.12 : p.crouch ? 0.3 : 0), 0.3);
    head.rotation.z = Math.sin(t * 0.9) * 0.05 - Math.sin(ph) * 0.04 * m;
    head.rotation.x = L(head.rotation.x, Math.sin(t * 1.3) * 0.03 + (p.hurt > 0 ? -0.35 : p.block ? 0.25 : a ? -0.15 * st : 0), 0.3);
    head.rotation.y = Math.sin(t * 0.6) * 0.12 * (1 - m);
    legs.forEach((hip, i) => {
      const s = Math.sin(ph + i * Math.PI);
      const kick = a === "low" && i === 0 ? -1.5 * hit : 0;
      hip.rotation.x = L(hip.rotation.x, p.air ? 0.55 : p.crouch ? 0.7 : s * 0.7 * m + kick, 0.3);
      hip.position.y = 0.34 + Math.max(0, -s) * 0.05 * m;
    });
    arms.forEach(({ sh, el, s }, i) => {
      let x = -Math.sin(ph + i * Math.PI) * 0.45 * m + Math.sin(t * 1.7 + i) * 0.04, z = s * 0.62, ez = -s * 0.5, ex = 0;
      if (p.block) { x = -1.25; z = s * 0.1; ez = -s * 0.9; ex = -0.6; }
      else if (a === "light") { if (i === 0) { x = -1.55 * st; ex = -0.4 * st; z = s * 0.25; } else { x = 0.4 * st; } }
      else if (a === "heavy") { x = -2.6 * st; z = s * 0.35; ex = -0.5 * (1 - Math.max(0, st)); }
      else if (a === "grab") { x = -1.3 * hit; z = s * 0.12; ez = -s * 0.35; }
      else if (a === "special") { x = st < 0 ? 0.9 * -st : -0.3 - 2.6 * st; z = s * 0.4; }
      else if (a === "secondary") { x = 1.1 * hit; z = s * 0.7; }
      else if (a === "low") { x = 0.5 * hit; }
      if (p.hurt > 0) { x = -0.9; z = s * 1.0; }
      if (oc) { x -= 0.15 * Math.abs(Math.sin(t * 9 + i)); }
      sh.rotation.x = L(sh.rotation.x, x, 0.35); sh.rotation.z = L(sh.rotation.z, z, 0.3);
      el.rotation.z = L(el.rotation.z, ez, 0.3); el.rotation.x = L(el.rotation.x, ex, 0.35);
    });
    ears.forEach((ear, i) => { ear.rotation.z = Math.sin(t * (6 + oc * 8) + i * 2 + ph) * (0.03 + 0.1 * m + 0.3 * hit + 0.25 * oc); });
    visor.emissiveIntensity = blink ? 0.05 : 2 + Math.sin(t * 3) * 0.3 + hit * 1.5 + oc * 2.5;
    ring.emissiveIntensity = 2 + Math.sin(t * 4) * 0.6 + hit * 2 + oc * 4;
    if (p.dead) visor.emissiveIntensity = 0.15 + (Math.sin(t * 20) > 0.9 ? 1.5 : 0);
  });
}

// ------------------------------------------------------------------ Droid
// Model sheet 02: a tall graphite humanoid, slightly stooped. Domed head with two lit round
// eyes and a mouth grille on a thin neck, a breastplate that tapers to an exposed piston
// waist, pale shoulder collars trimmed in copper, shoulder pads with a white emblem, long
// arms to the knees, drum hip and knee joints, long thin shins.
let droidEmblem: T.Texture | null = null;
function buildDroid(def: FighterDef): Robot {
  const R = rigFor(def, 4.42), g = R.lean, k = new Kit();
  const skin = plate("metal-graphite", 0x3a3f47, { rough: 0.58, metal: 0.5, repeat: 1, bump: 1.5 });
  const skin2 = plate("metal-graphite", 0x2c3036, { tint: 0xb9bcc4, rough: 0.62, metal: 0.5, repeat: 2, bump: 1.5 });
  // The generated plate is near-black; a multiplier above one lifts it to the sheet's graphite.
  if (skin.map) { skin.color.setRGB(1.9, 1.95, 2.1); skin2.color.setRGB(1.35, 1.4, 1.5); }
  const joint = steel(0x1d2024, 0.42, 0.8), bright = steel(0x9aa2aa, 0.3, 0.9), collar = steel(0x8d9399, 0.5, 0.55);
  const copper = steel(0xb4642a, 0.38, 0.95), eye = glow(0xffd9a0, 3);
  droidEmblem ??= canvasTex(128, 128, (c, w) => {
    c.fillStyle = "#34383f"; c.fillRect(0, 0, w, w); c.strokeStyle = c.fillStyle = "#e9e7e1"; c.lineWidth = 9;
    c.beginPath(); c.arc(w / 2, w / 2, 44, 0, 7); c.stroke();
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; c.beginPath(); c.arc(w / 2 + Math.cos(a) * 25, w / 2 + Math.sin(a) * 25, 6.5, 0, 7); c.fill(); }
    c.beginPath(); c.arc(w / 2, w / 2, 9, 0, 7); c.fill();
  });
  const emblem = new T.MeshStandardMaterial({ roughness: 0.6, metalness: 0.2, map: droidEmblem });
  const X: V3 = [0, 0, Math.PI / 2];
  const tapered = (w: number, h: number, d: number, r: number, bx: number, bz: number) => {
    const geo = new RoundedBoxGeometry(w, h, d, 5, r), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const f = pos.getY(i) / h + 0.5; pos.setX(i, pos.getX(i) * (bx + (1 - bx) * f)); pos.setZ(i, pos.getZ(i) * (bz + (1 - bz) * f)); }
    geo.computeVertexNormals();
    return geo;
  };
  const legs = [-1, 1].map((s) => {
    const hip = pivot(g, s * 0.33, 2.34, 0);
    k.add(new T.CylinderGeometry(0.18, 0.18, 0.17, 17), joint, hip, { r: X });
    k.add(new T.CylinderGeometry(0.125, 0.125, 0.2, 15), skin2, hip, { r: X, p: [s * 0.02, 0, 0] });
    k.ball(skin, hip, [0, -0.1, 0], 0.15);
    k.rod(skin, hip, [0, -0.1, 0], [0, -0.82, 0], 0.15, 0.1, 20);
    k.add(new RoundedBoxGeometry(0.19, 0.46, 0.07, 3, 0.03), skin2, hip, { p: [0, -0.42, 0.115], r: [0.07, 0, 0] });
    const knee = pivot(hip, 0, -0.88, 0);
    k.add(new T.CylinderGeometry(0.115, 0.115, 0.25, 15), joint, knee, { r: X });
    k.add(new T.CylinderGeometry(0.075, 0.075, 0.28, 12), bright, knee, { r: X });
    k.rod(skin, knee, [0, -0.06, 0], [0, -1.2, 0], 0.085, 0.058, 18);
    k.add(new RoundedBoxGeometry(0.17, 0.5, 0.2, 3, 0.04), skin2, knee, { p: [0, -0.4, -0.015] });
    k.rod(bright, knee, [s * 0.065, -0.1, -0.1], [s * 0.06, -1.12, -0.07], 0.017);
    k.add(new T.CylinderGeometry(0.075, 0.075, 0.2, 12), joint, knee, { p: [0, -1.26, 0], r: X });
    k.add(new RoundedBoxGeometry(0.2, 0.1, 0.46, 3, 0.04), skin, knee, { p: [0, -1.375, 0.08] });
    k.add(new RoundedBoxGeometry(0.22, 0.045, 0.2, 2, 0.02), joint, knee, { p: [0, -1.41, 0.21] });
    return { hip, knee };
  });
  const upper = pivot(g, 0, 2.34, 0);
  k.add(tapered(0.64, 0.4, 0.38, 0.08, 0.45, 0.7), skin, upper, { p: [0, 0.02, 0] });
  k.add(new RoundedBoxGeometry(0.2, 0.3, 0.3, 3, 0.06), skin2, upper, { p: [0, -0.17, 0.01] });
  k.rod(joint, upper, [0, 0.12, 0], [0, 0.36, 0], 0.08);
  for (const [x, z] of [[-0.13, 0.07], [0.13, 0.07], [-0.12, -0.08], [0.12, -0.08], [0, 0.13]]) { k.rod(bright, upper, [x, 0.14, z], [x * 1.25, 0.36, z], 0.024); k.rod(joint, upper, [x, 0.1, z], [x * 1.12, 0.25, z], 0.036); }
  const torso = pivot(upper, 0, 0.28, 0);
  k.add(tapered(1.02, 0.92, 0.62, 0.17, 0.68, 0.74), skin, torso, { p: [0, 0.49, 0] });
  k.add(new RoundedBoxGeometry(0.2, 0.44, 0.05, 3, 0.02), skin2, torso, { p: [0, 0.4, 0.268], r: [-0.04, 0, 0] });
  for (const [x, y, w, h] of [[-0.03, 0.33, 0.07, 0.09], [0.05, 0.36, 0.04, 0.05], [0.05, 0.28, 0.04, 0.05], [0.2, 0.42, 0.05, 0.06]]) k.add(new T.BoxGeometry(w, h, 0.03), joint, torso, { p: [x, y, 0.292] });
  k.add(new RoundedBoxGeometry(0.42, 0.28, 0.07, 3, 0.03), skin2, torso, { p: [0, 0.68, -0.3] });
  for (let i = -1; i <= 1; i++) k.add(new T.BoxGeometry(0.06, 0.16, 0.03), joint, torso, { p: [i * 0.1, 0.69, -0.335] });
  k.add(new RoundedBoxGeometry(0.5, 0.2, 0.06, 3, 0.03), skin2, torso, { p: [0, 0.3, -0.25], r: [0.12, 0, 0] });
  k.add(new T.CylinderGeometry(0.15, 0.2, 0.07, 17), collar, torso, { p: [0, 0.965, 0.01] });
  k.add(new T.TorusGeometry(0.13, 0.028, 10, 28), joint, torso, { p: [0, 1.0, 0.01], r: [Math.PI / 2, 0, 0] });
  k.rod(joint, torso, [0, 0.95, 0.01], [0, 1.14, 0.03], 0.06);
  for (const s of [-1, 1]) k.rod(bright, torso, [s * 0.075, 0.98, -0.03], [s * 0.06, 1.13, 0.0], 0.014);
  const arms = [-1, 1].map((s) => {
    k.add(new T.CylinderGeometry(0.275, 0.275, 0.17, 20), collar, torso, { p: [s * 0.5, 0.68, 0], r: X });
    k.add(new T.TorusGeometry(0.278, 0.015, 8, 36), copper, torso, { p: [s * 0.412, 0.68, 0], r: [0, Math.PI / 2, 0] });
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; k.add(new T.BoxGeometry(0.172, 0.012, 0.03), joint, torso, { p: [s * 0.5, 0.68 + Math.sin(a) * 0.272, Math.cos(a) * 0.272], r: [-a, 0, 0] }); }
    const sh = pivot(torso, s * 0.66, 0.7, 0);
    k.ball(skin, sh, [s * 0.03, 0.03, 0], 0.2, [0.8, 1.15, 1.08]);
    k.add(new T.CircleGeometry(0.085, 28), emblem, sh, { p: [s * 0.192, 0.04, 0], r: [0, (s * Math.PI) / 2, 0] });
    k.rod(joint, sh, [0, -0.1, 0], [0, -0.62, 0], 0.072, 0.058, 16);
    k.add(new RoundedBoxGeometry(0.12, 0.3, 0.13, 2, 0.03), skin2, sh, { p: [0, -0.33, 0] });
    const el = pivot(sh, 0, -0.67, 0);
    k.add(new T.CylinderGeometry(0.088, 0.088, 0.17, 14), joint, el, { r: X });
    k.add(new T.CylinderGeometry(0.05, 0.05, 0.2, 10), bright, el, { r: X });
    // The forearm hangs in its own group so EXTENSION ERROR can stretch it.
    const fore = pivot(el, 0, 0, 0);
    k.add(new RoundedBoxGeometry(0.15, 0.76, 0.17, 3, 0.04), skin, fore, { p: [0, -0.47, 0] });
    k.rod(bright, fore, [s * 0.03, -0.12, -0.1], [s * 0.03, -0.8, -0.095], 0.014);
    k.add(new T.CylinderGeometry(0.052, 0.052, 0.09, 10), joint, fore, { p: [0, -0.9, 0] });
    k.add(new RoundedBoxGeometry(0.11, 0.15, 0.05, 2, 0.02), skin2, fore, { p: [0, -1.01, 0] });
    for (let f = 0; f < 4; f++) {
      const x = (f - 1.5) * 0.028, a: V3 = [x, -1.08, 0.005], b: V3 = [x * 1.15, -1.17, 0.035], c: V3 = [x * 1.2, -1.245, 0.02];
      k.rod(joint, fore, a, b, 0.012); k.ball(bright, fore, b, 0.014); k.rod(joint, fore, b, c, 0.011, 0.008);
    }
    k.rod(joint, fore, [-s * 0.055, -0.98, 0.01], [-s * 0.085, -1.08, 0.04], 0.013); k.rod(joint, fore, [-s * 0.085, -1.08, 0.04], [-s * 0.07, -1.15, 0.05], 0.011, 0.008);
    return { sh, el, fore, s };
  });
  const head = pivot(torso, 0, 1.12, 0.03), HS: V3 = [1, 1.12, 1.2];
  k.add(new T.SphereGeometry(0.27, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), skin, head, { p: [0, 0.36, 0], s: HS });
  k.add(new T.CylinderGeometry(0.251, 0.165, 0.2, 22), skin, head, { p: [0, 0.149, 0], s: [1, 1, 1.2] });
  k.add(new T.TorusGeometry(0.252, 0.008, 6, 40), joint, head, { p: [0, 0.25, 0], r: [Math.PI / 2, 0, 0], s: [1, 1.2, 1] });
  k.add(new RoundedBoxGeometry(0.15, 0.12, 0.1, 3, 0.025), joint, head, { p: [0, 0.12, 0.2] });
  for (let i = -2; i <= 2; i++) k.add(new T.BoxGeometry(0.008, 0.045, 0.01), bright, head, { p: [i * 0.022, 0.1, 0.252] });
  for (const s of [-1, 1]) {
    k.ball(eye, head, [s * 0.095, 0.33, 0.283], 0.036);
    k.add(new T.TorusGeometry(0.043, 0.012, 8, 22), joint, head, { p: [s * 0.095, 0.33, 0.298], r: [0.05, s * 0.33, 0] });
    k.add(new RoundedBoxGeometry(0.05, 0.2, 0.2, 2, 0.02), skin2, head, { p: [s * 0.262, 0.3, -0.03] });
  }
  k.add(new RoundedBoxGeometry(0.4, 0.12, 0.08, 2, 0.03), skin2, head, { p: [0, 0.25, -0.3] });
  k.bake();
  let ph = 0, m = 0;
  return finish(R, { body: torso, head, arms: arms.map((a) => a.sh), legs: legs.map((l) => l.hip) }, (p) => {
    const t = p.time, mv = Math.min(1, Math.abs(p.speed) / 5);
    m = L(m, mv, 0.2); ph += 0.1 * m;
    const a = p.attack, hit = a ? swing(p) : 0, st = a ? strike(p) : 0, oc = p.overclock ? 1 : 0;
    common(R, p, 0.55);
    upper.position.y = 2.34 + Math.abs(Math.sin(ph)) * 0.04 * m + (p.crouch ? 0.0 : 0);
    upper.rotation.z = Math.sin(ph) * 0.025 * m;
    torso.rotation.x = L(torso.rotation.x, 0.1 + 0.04 * m + (a === "heavy" ? 0.45 * st : a === "secondary" ? 0.3 * hit : p.block ? 0.15 : p.crouch ? 0.35 : p.hurt > 0 ? -0.2 : 0), 0.3);
    torso.rotation.z = oc ? Math.sin(t * 6) * 0.04 : 0;
    legs.forEach((l, i) => {
      const s = Math.sin(ph + i * Math.PI);
      const kick = a === "low" && i === 0 ? -1.3 * hit : 0;
      l.hip.rotation.x = L(l.hip.rotation.x, p.air ? -0.5 : p.crouch ? -0.9 : -s * 0.42 * m + kick, 0.3);
      l.knee.rotation.x = L(l.knee.rotation.x, p.air ? 0.9 : p.crouch ? 1.4 : Math.max(0, s) * 0.75 * m + 0.02 + (kick ? 0.4 * hit : 0), 0.3);
    });
    arms.forEach((ar, i) => {
      let x = Math.sin(ph + i * Math.PI) * 0.32 * m + Math.sin(t * 0.8 + i * 2) * 0.04 - 0.04, z = 0, ex = -0.18 - Math.max(0, -Math.sin(ph + i * Math.PI)) * 0.3 * m, stretch = 1;
      if (p.block) { x = -1.35; z = -ar.s * 0.55; ex = -1.7; }
      else if (a === "light") { if (i === 0) { x = -1.6 * st; ex = -0.9 * (1 - Math.max(0, st)); } else { x = 0.5 * st; ex = -0.8; } }
      else if (a === "heavy") { x = -2.8 * st; ex = -0.3; z = -ar.s * 0.2; }
      else if (a === "grab") { x = -1.35 * hit; ex = -0.5 * hit; z = -ar.s * 0.35 * hit; }
      else if (a === "secondary") { x = -1.55 * hit; ex = 0; stretch = 1 + 0.75 * hit; }
      else if (a === "special") { x = -2.7 * hit; z = ar.s * 0.5 * hit; ex = -0.4; }
      else if (a === "low") { x = 0.6 * hit; }
      if (p.hurt > 0) { x = -0.6; z = ar.s * 0.9; ex = -0.9; }
      ar.sh.rotation.x = L(ar.sh.rotation.x, x, 0.35); ar.sh.rotation.z = L(ar.sh.rotation.z, z, 0.3);
      ar.el.rotation.x = L(ar.el.rotation.x, ex, 0.35);
      ar.fore.scale.y = L(ar.fore.scale.y, stretch, 0.3);
    });
    // A slow scan of the room, interrupted by a sharp turn when something happens.
    head.rotation.y = L(head.rotation.y, a === "special" ? Math.sin(t * 30) * 0.2 : Math.sin(t * 0.45) * 0.4 * (1 - hit), 0.3);
    head.rotation.x = L(head.rotation.x, 0.08 + (p.hurt > 0 ? -0.3 : a ? -0.2 * st : p.block ? 0.2 : 0), 0.3);
    eye.emissiveIntensity = p.dead ? 0.2 : 2.6 + Math.sin(t * 2.5) * 0.5 + hit * 3 + oc * 3 + (a === "special" ? 4 : 0);
  });
}

// ------------------------------------------------------------------ Biggy
// Model sheet 03: a ball on two stubby legs. The front of the ball is a rusting orange belly
// with a stencilled badge, the back is blue-grey plate with a hatch and an exhaust; a
// riveted helmet dome with two lens eyes sits on top over a dark slit, pauldrons hang off
// the shoulders and the forearms are boxes with three fingers.
let bellyMap: T.CanvasTexture | null = null;
function biggyBelly() {
  if (bellyMap) return bellyMap;
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 640;
  const map = (bellyMap = new T.CanvasTexture(cv)); map.colorSpace = T.SRGBColorSpace; map.anisotropy = 8;
  const paint = (img: HTMLImageElement | null) => {
    const c = cv.getContext("2d")!, w = cv.width, h = cv.height;
    if (img) { for (let x = 0; x < w; x += 512) for (let y = 0; y < h; y += 512) c.drawImage(img, x, y, 512, 512); } else { c.fillStyle = "#c2562b"; c.fillRect(0, 0, w, h); }
    const groove = "rgba(20,10,6,.75)", lip = "rgba(255,190,150,.22)";
    seam(c, () => { c.moveTo(w / 2, 0); c.lineTo(w / 2, h); }, groove, lip, 4);
    seam(c, () => { c.moveTo(w * 0.12, h * 0.74); c.quadraticCurveTo(w / 2, h * 0.8, w * 0.88, h * 0.74); }, groove, lip, 4);
    for (const u of [0.12, 0.88]) seam(c, () => { c.moveTo(w * u, h * 0.06); c.lineTo(w * u, h * 0.94); }, groove, lip, 3);
    c.strokeStyle = c.fillStyle = "rgba(238,230,218,.9)"; c.lineWidth = 9;
    const cx = w * 0.5 - 86, cy = h * 0.2;
    c.beginPath(); c.arc(cx, cy, 36, 0, 7); c.stroke();
    for (const s of [-1, 1]) { c.beginPath(); c.roundRect(cx + s * 12 - 4.5, cy - 8, 9, 26, 4); c.fill(); c.beginPath(); c.arc(cx + s * 12, cy - 17, 5, 0, 7); c.fill(); }
    if (img) { c.globalCompositeOperation = "multiply"; c.globalAlpha = 0.55; c.drawImage(img, cx - 60, cy - 60, 120, 120, cx - 60, cy - 60, 120, 120); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; }
    map.needsUpdate = true;
  };
  paint(null);
  void image("metal-rust-orange").then((i) => i && paint(i));
  return map;
}
function buildBiggy(def: FighterDef): Robot {
  const R = rigFor(def, 2.72), g = R.lean, k = new Kit();
  const armour = plate("metal-bluegrey", 0x4a6378, { tint: 0xd6e6ff, rough: 0.66, metal: 0.2, repeat: 2, bump: 2 });
  const rusty = plate("metal-rust-orange", 0xc2562b, { rough: 0.7, metal: 0.25, repeat: 1, bump: 2 });
  const dark = steel(0x1b1e22, 0.5, 0.75), boot = new T.MeshStandardMaterial({ color: 0x2e2c2a, roughness: 0.8, metalness: 0.3 }), rim = steel(0x7d848b, 0.4, 0.85), glass = steel(0x050607, 0.14, 0.6), lens = glow(0xff7a1a, 0.6);
  const belly = new T.MeshStandardMaterial({ map: biggyBelly(), roughness: 0.68, metalness: 0.25, envMapIntensity: 1.1 });
  const rustBump = tex("metal-rust-orange", 2, 1.25, false); if (rustBump) { belly.bumpMap = rustBump; belly.bumpScale = 2; }

  const body = pivot(g, 0, 0, 0), BS: V3 = [1, 0.96, 0.97], X: V3 = [0, 0, Math.PI / 2], Zq: V3 = [Math.PI / 2, 0, 0];
  k.add(new T.SphereGeometry(0.9, 36, 24), armour, body, { p: [0, 1.22, 0], s: BS });
  k.add(new T.SphereGeometry(0.935, 36, 22, Math.PI / 2 - 1.7, 3.4, 0.5, 2.05), belly, body, { p: [0, 1.2, 0.05], s: BS });
  k.add(new T.CylinderGeometry(0.76, 0.8, 0.2, 27), dark, body, { p: [0, 2.0, 0] });
  const DY = 2.04, DR = 0.86, DK = 0.74;
  const onDome = (az: number, lat: number, lift = 0) => {
    const n = new T.Vector3(Math.sin(az) * Math.cos(lat), Math.sin(lat) / DK, Math.cos(az) * Math.cos(lat)).normalize();
    const p = new T.Vector3(Math.sin(az) * Math.cos(lat) * DR, DY + Math.sin(lat) * DR * DK, Math.cos(az) * Math.cos(lat) * DR).addScaledVector(n, lift);
    return { p: p.toArray() as V3, q: new T.Quaternion().setFromUnitVectors(UP, n) };
  };
  const head = pivot(body, 0, 0, 0);
  k.add(new T.SphereGeometry(DR, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), armour, head, { p: [0, DY, 0], s: [1, DK, 1] });
  k.add(new T.TorusGeometry(DR, 0.042, 8, 44), armour, head, { p: [0, DY, 0], r: Zq, s: [1, 1, 0.8] });
  k.add(new T.CylinderGeometry(DR + 0.01, DR + 0.03, 0.07, 35, 1, true), armour, head, { p: [0, DY - 0.05, 0] });
  for (const lat of [0.5, 1.02]) k.add(new T.TorusGeometry(DR * Math.cos(lat) + 0.004, 0.02, 8, 48), rim, head, { p: [0, DY + Math.sin(lat) * DR * DK, 0], r: Zq });
  for (let i = 0; i < 18; i++) { const o = onDome((i / 18) * Math.PI * 2 + 0.17, 0.1, 0.005); k.add(new T.SphereGeometry(0.022, 8, 6), rim, head, o); }
  for (const [az, lat, r] of [[-0.42, 0.27, 0.088], [0.42, 0.27, 0.088], [-0.55, 0.78, 0.07], [0.55, 0.78, 0.07]]) {
    const o = onDome(az, lat, 0.015);
    k.add(new T.CylinderGeometry(r, r * 1.12, 0.06, 15), rim, head, o);
    k.add(new T.CylinderGeometry(r * 0.62, r * 0.62, 0.07, 12), glass, head, o);
    if (lat < 0.5) k.add(new T.CylinderGeometry(r * 0.24, r * 0.24, 0.075, 12), lens, head, o);
  }
  for (const s of [-1, 1]) k.add(new RoundedBoxGeometry(0.2, 0.09, 0.13, 2, 0.025), armour, head, onDome(s * 2.5, 1.0, 0.03));
  k.rod(dark, head, onDome(-0.9, 1.15).p, [-0.24, 3.1, 0.1], 0.009, 0.005); k.ball(dark, head, [-0.24, 3.1, 0.1], 0.013);
  // The back: a hatch with a speaker, an exhaust stub and two ports.
  k.add(new RoundedBoxGeometry(0.62, 0.6, 0.1, 3, 0.05), armour, body, { p: [0, 1.4, -0.83], r: [0.16, 0, 0] });
  k.add(new T.CylinderGeometry(0.14, 0.14, 0.05, 17), dark, body, { p: [0, 1.5, -0.9], r: [Math.PI / 2 + 0.16, 0, 0] });
  k.add(new T.TorusGeometry(0.14, 0.018, 8, 28), rim, body, { p: [0, 1.505, -0.925], r: [0.16, 0, 0] });
  k.add(new T.CylinderGeometry(0.1, 0.11, 0.22, 15, 1, true), rim, body, { p: [-0.2, 1.0, -0.88], r: [Math.PI / 2 - 0.2, 0, 0] });
  k.add(new T.CylinderGeometry(0.095, 0.095, 0.02, 12), glass, body, { p: [-0.2, 0.99, -0.84], r: [Math.PI / 2 - 0.2, 0, 0] });
  for (const [x, y] of [[0.32, 1.02], [0.46, 1.72], [-0.46, 1.72]]) k.add(new T.CylinderGeometry(0.05, 0.06, 0.07, 10), rim, body, { p: [x, y, -Math.sqrt(Math.max(0.01, 0.78 - x * x - (y - 1.22) ** 2)) - 0.02], r: Zq });
  k.add(new RoundedBoxGeometry(0.56, 0.2, 0.3, 3, 0.06), armour, body, { p: [0, 0.44, 0.3], r: [0.5, 0, 0] });
  const arms = [-1, 1].map((s) => {
    k.add(new T.SphereGeometry(0.37, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), armour, body, { p: [s * 0.88, 1.58, 0], r: [0, 0, -s * 1.05], s: [1.05, 0.62, 1.08] });
    k.add(new T.SphereGeometry(0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), rusty, body, { p: [s * 1.1, 1.47, 0.2], r: [0.5, 0, -s * 1.5], s: [0.9, 0.5, 1] });
    k.add(new T.CylinderGeometry(0.13, 0.13, 0.22, 14), dark, body, { p: [s * 0.98, 1.45, 0], r: X });
    const arm = pivot(body, s * 1.08, 1.42, 0);
    k.rod(dark, arm, [0, 0, 0], [s * 0.03, -0.22, 0], 0.1, 0.085);
    k.add(new T.CylinderGeometry(0.115, 0.115, 0.14, 12), rim, arm, { p: [s * 0.03, -0.2, 0], r: X });
    k.add(new RoundedBoxGeometry(0.36, 0.64, 0.46, 4, 0.09), armour, arm, { p: [s * 0.05, -0.52, 0.02] });
    k.add(new RoundedBoxGeometry(0.3, 0.14, 0.4, 3, 0.04), rusty, arm, { p: [s * 0.05, -0.8, 0.02] });
    k.add(new T.CylinderGeometry(0.1, 0.1, 0.08, 11), dark, arm, { p: [s * 0.05, -0.89, 0.02] });
    k.add(new RoundedBoxGeometry(0.2, 0.13, 0.22, 3, 0.04), boot, arm, { p: [s * 0.05, -0.97, 0.02] });
    for (const [fx, fz] of [[-0.07, 0.08], [0.07, 0.08], [0, -0.09]]) {
      const a: V3 = [s * 0.05 + fx, -1.02, 0.02 + fz], b: V3 = [s * 0.05 + fx * 1.3, -1.13, 0.02 + fz * 1.45], c: V3 = [s * 0.05 + fx * 1.05, -1.22, 0.02 + fz * 1.2];
      k.rod(boot, arm, a, b, 0.04, 0.036); k.ball(dark, arm, b, 0.04); k.rod(boot, arm, b, c, 0.036, 0.026); k.ball(boot, arm, c, 0.026);
    }
    return { arm, s };
  });
  const legs = [-1, 1].map((s) => {
    const leg = pivot(g, s * 0.37, 0.52, 0);
    k.add(new T.CylinderGeometry(0.215, 0.24, 0.28, 17), rusty, leg, { p: [0, -0.05, 0] });
    k.add(new T.CylinderGeometry(0.185, 0.185, 0.09, 15), dark, leg, { p: [0, -0.22, 0] });
    k.add(new T.CylinderGeometry(0.17, 0.2, 0.17, 15), boot, leg, { p: [0, -0.33, 0] });
    k.add(new RoundedBoxGeometry(0.36, 0.13, 0.5, 3, 0.05), boot, leg, { p: [0, -0.45, 0.06] });
    k.add(new RoundedBoxGeometry(0.3, 0.06, 0.2, 2, 0.025), dark, leg, { p: [0, -0.4, 0.24] });
    return leg;
  });
  k.bake();
  let ph = 0, m = 0;
  return finish(R, { body, head, arms: arms.map((a) => a.arm), legs }, (p) => {
    const t = p.time, mv = Math.min(1, Math.abs(p.speed) / 5);
    m = L(m, mv, 0.2); ph += (0.09 + (p.attack === "special" ? 0.12 : 0)) * Math.max(m, p.attack === "special" ? 1 : 0);
    const a = p.attack, hit = a ? swing(p) : 0, st = a ? strike(p) : 0, oc = p.overclock ? 1 : 0;
    common(R, p, 0.2);
    body.rotation.z = Math.sin(ph) * 0.07 * m + hit * Math.sin(t * 22) * 0.02 + (oc ? Math.sin(t * 5) * 0.04 : 0);
    body.rotation.x = L(body.rotation.x, Math.cos(ph * 2) * 0.02 * m + (a === "special" ? 0.42 : a === "heavy" ? 0.4 * st : a === "secondary" ? 0.2 : p.block ? 0.15 : p.crouch ? 0.25 : p.hurt > 0 ? -0.25 : 0), 0.25);
    body.position.y = Math.abs(Math.sin(ph)) * 0.05 * m + Math.sin(t * 1.1) * 0.008 - (a === "secondary" || p.block ? 0.12 : 0);
    legs.forEach((leg, i) => {
      const s = Math.sin(ph + i * Math.PI);
      const stomp = a === "low" && i === 0 ? -1.1 * hit : 0;
      leg.position.y = 0.52 + Math.max(0, s) * 0.1 * m;
      leg.rotation.x = L(leg.rotation.x, p.air ? -0.4 : -s * 0.3 * m + stomp, 0.3);
    });
    arms.forEach(({ arm, s }, i) => {
      let x = Math.sin(ph + i * Math.PI) * 0.25 * m, z = 0;
      if (p.block || a === "secondary") { x = -1.2; z = -s * 0.55; }
      else if (a === "light") { if (i === 0) x = -1.5 * st; else x = 0.5 * st; }
      else if (a === "heavy") { x = -2.5 * st; z = -s * 0.15; }
      else if (a === "grab") { x = -1.25 * hit; z = -s * 0.3 * hit; }
      else if (a === "special") { x = 0.9; z = s * 0.35; }
      else if (a === "low") { x = 0.4 * hit; }
      if (p.hurt > 0) { x = -0.8; z = s * 0.8; }
      if (oc) x -= 0.2 * Math.abs(Math.sin(t * 8 + i * 2));
      arm.rotation.x = L(arm.rotation.x, x, 0.3); arm.rotation.z = L(arm.rotation.z, z, 0.3);
    });
    head.rotation.y = L(head.rotation.y, p.hurt > 0 ? Math.sin(t * 25) * 0.1 : Math.sin(t * 0.7) * 0.08, 0.3);
    lens.emissiveIntensity = p.dead ? 0.1 : 0.5 + Math.sin(t * 1.7) * 0.25 + hit * 4 + oc * 4 + (a === "special" ? 3 : 0);
  });
}

// ------------------------------------------------------------------ Richie
// The official Reachy Mini geometry, converted by Please Do Not Throw Richie's
// scripts/build-richie.py: a Y-up glTF with the base at y=0 and named nodes whose pivots sit
// on the real joints. Loaded once, then cloned per fighter; geometry and materials are shared.
let richieScene: T.Group | null = null;
let richieLoading: Promise<void> | null = null;
export function loadRichie() {
  return (richieLoading ??= new GLTFLoader()
    .loadAsync(richieUrl)
    .then((gltf) => {
      const s = gltf.scene;
      s.traverse((o) => {
        const m = o as T.Mesh;
        if (!m.isMesh) return;
        m.castShadow = m.receiveShadow = true;
        m.userData.shared = true;
        // Decimation leaves a few zero-length normals; lit, they are NaN, and bloom smears a NaN across the frame.
        const nn = m.geometry.attributes.normal;
        for (let i = 0; i < nn.count; i++) if (!(Math.hypot(nn.getX(i), nn.getY(i), nn.getZ(i)) > 1e-4)) nn.setXYZ(i, 0, 1, 0);
        const src = m.material as T.MeshStandardMaterial, c = src.color, shell = c.r > 0.8;
        m.material = src.transparent
          ? new T.MeshPhysicalMaterial({ color: 0x9fc4d8, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.5, depthWrite: false })
          : new T.MeshPhysicalMaterial({ color: shell ? c.clone().multiplyScalar(0.84) : c, roughness: shell ? 0.32 : 0.45, metalness: shell ? 0 : 0.4, clearcoat: shell ? 0.7 : 0.15, clearcoatRoughness: 0.25 });
      });
      richieScene = s;
    })
    .catch((e) => {
      console.warn("Richie's GLB did not load; using the stand-in.", e);
    }));
}
function buildRichie(def: FighterDef): Robot {
  const R = rigFor(def, 0.285), g = R.lean;
  let model: T.Object3D, head: T.Object3D, antL: T.Object3D | null, antR: T.Object3D | null;
  if (richieScene) {
    model = richieScene.clone(true);
    head = model.getObjectByName("head") ?? model;
    antL = model.getObjectByName("antenna_left") ?? null; antR = model.getObjectByName("antenna_right") ?? null;
  } else {
    // A stand-in in the same proportions, for when the GLB is unavailable.
    const k = new Kit(), white = plastic(0xe6e0d4, null, 0.32), dark = steel(0x1e2126, 0.45, 0.6), lensM = steel(0x0a0c10, 0.12, 0.5);
    model = new T.Group();
    k.add(new T.CylinderGeometry(0.075, 0.08, 0.09, 28), white, model, { p: [0, 0.045, 0] });
    k.add(new T.CylinderGeometry(0.03, 0.03, 0.05, 12), dark, model, { p: [0, 0.11, 0] });
    head = pivot(model, 0, 0.13, 0);
    k.ball(white, head, [0, 0.06, 0], 0.085, [1, 0.8, 1]);
    for (const s of [-1, 1]) { k.add(new T.CylinderGeometry(0.02, 0.02, 0.02, 14), dark, head, { p: [s * 0.035, 0.065, 0.075], r: [Math.PI / 2, 0, 0] }); k.add(new T.CylinderGeometry(0.012, 0.012, 0.024, 12), lensM, head, { p: [s * 0.035, 0.065, 0.078], r: [Math.PI / 2, 0, 0] }); }
    antL = pivot(head, -0.045, 0.11, -0.02); antR = pivot(head, 0.045, 0.11, -0.02);
    for (const a of [antL, antR]) { k.rod(dark, a, [0, 0, 0], [0, 0.09, 0], 0.003); k.ball(white, a, [0, 0.095, 0], 0.008); }
    k.bake();
  }
  g.add(model);
  const headBase = head.position.y, HEAD_DIP = 0.045, HEAD_POP = 0.05;
  let headY = 0, headV = 0, wasAir = false, lastAttack: string | undefined, wobble = 0, spin = 0;
  return finish(R, { body: g, head: head as T.Group, arms: [], legs: [] }, (p) => {
    const t = p.time, a = p.attack, hit = a ? swing(p) : 0, oc = p.overclock ? 1 : 0;
    R.root.rotation.y = L(R.root.rotation.y, p.face > 0 ? 0.78 : -0.78, 0.18);
    // Play dead is a crouch: he keels over sideways, and gets up when it is over.
    const down = p.dead || p.crouch;
    R.lean.rotation.z = L(R.lean.rotation.z, down ? -p.face * 1.5 : p.hurt > 0 ? -p.face * 0.3 : a === "heavy" ? -p.face * 0.75 * hit : p.air ? -p.face * 0.22 : 0, down ? 0.14 : 0.2);
    R.lean.position.y = L(R.lean.position.y, down ? 0.02 : 0, 0.25);
    // Unexpected trajectory: a full spin in the air. Tantrum: shaking on the spot.
    if (a === "special") spin = p.attackProgress * Math.PI * 2; else spin = L(spin, Math.round(spin / (Math.PI * 2)) * Math.PI * 2, 0.3);
    R.lean.rotation.y = spin;
    R.lean.rotation.x = a === "secondary" ? Math.sin(t * 40) * 0.12 : 0;
    // Landings and launches set the antennas ringing, as in the original.
    const launched = p.air && !wasAir;
    if (p.air !== wasAir || (a && a !== lastAttack)) wobble = Math.min(1.2, wobble + 0.7);
    wasAir = p.air; lastAttack = a;
    wobble *= 0.94;
    const ring = Math.sin(t * 16) * wobble + (a === "secondary" ? Math.sin(t * 45) * 0.5 : 0) + (oc ? Math.sin(t * 9) * 0.3 : 0) + (p.dead ? 0 : Math.sin(t * 2.2) * 0.06);
    if (antL) antL.rotation.z = p.dead ? 0.9 : ring; if (antR) antR.rotation.z = p.dead ? -0.9 : -ring;
    head.rotation.x = L(head.rotation.x, a === "light" || a === "heavy" || a === "grab" ? 0.7 * hit : p.block ? 0.35 : p.air ? -0.15 : 0, 0.35);
    head.rotation.y = a === "secondary" ? Math.sin(t * 38) * 0.35 : L(head.rotation.y, Math.sin(t * 0.7) * 0.15, 0.2);
    // The head rides a spring on the real neck: a charge pulls it into the body, the hop lets it go.
    const target = p.crouch ? -HEAD_DIP : -(p.charge ?? 0) * HEAD_DIP;
    if (launched) headV += 1.3;
    for (let i = 0; i < 3; i++) { headV += ((target - headY) * 90 - headV * 9) * 0.0055; headY += headV * 0.0055; if (headY > HEAD_POP) { headY = HEAD_POP; headV = Math.min(headV, 0); } if (headY < -HEAD_DIP) { headY = -HEAD_DIP; headV = Math.max(headV, 0); } }
    head.position.y = headBase + headY;
  });
}

// ------------------------------------------------------------------ Microduck
// Pollen's Microduck (https://pollen-robotics.com/microduck/): an egg-shaped white shell on
// two exposed servo legs with wide duck feet, a boxy white head with one central camera and
// a hinged coral beak, the neck servo bare. Built in the same clear-coated plastic as Voxxy,
// with black anodised servos and copper trim. Roller mode drops yellow skate wheels under
// the feet.
function buildMicroduck(def: FighterDef): Robot {
  const R = rigFor(def, 1.22), g = R.lean, k = new Kit();
  const shell = plastic(0xf2efe8), coral = plastic(0xf06a3c), servo = steel(0x15181c, 0.45, 0.6), bright = steel(0x9aa2aa, 0.3, 0.9), copper = steel(0xb4642a, 0.38, 0.95);
  const rubber = new T.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.7, metalness: 0.05 }), glass = new T.MeshPhysicalMaterial({ color: 0x06080c, roughness: 0.08, metalness: 0, clearcoat: 1, envMapIntensity: 1.8 });
  const led = glow(0x7cf0ff, 2.2), wheel = new T.MeshStandardMaterial({ color: 0xf2c53d, roughness: 0.5, metalness: 0.1 });
  const X: V3 = [0, 0, Math.PI / 2];
  const body = pivot(g, 0, 0.52, 0);
  // The shell: an egg, slightly flattened, with a seam round its waist and a vent at the back.
  k.ball(shell, body, [0, 0.02, 0], 0.27, [0.92, 0.82, 1.08]);
  k.add(new T.TorusGeometry(0.245, 0.006, 6, 40), servo, body, { p: [0, 0.0, 0.01], r: [Math.PI / 2, 0, 0], s: [0.93, 1.06, 1] });
  for (let i = -2; i <= 2; i++) k.add(new T.BoxGeometry(0.06, 0.008, 0.02), servo, body, { p: [i * 0.035, 0.06, -0.278], r: [0.3, 0, 0] });
  for (const [x, y] of [[-0.12, 0.1], [0.12, 0.1], [0, -0.12]]) k.ball(servo, body, [x, y, 0.262], 0.008);
  // A tail: a short tuft of shell at the back, cocked up.
  k.ball(shell, body, [0, 0.05, -0.28], 0.07, [1, 0.5, 1.3]);
  // The neck servo, bare, with its horn and cable.
  k.add(new RoundedBoxGeometry(0.11, 0.09, 0.09, 2, 0.015), servo, body, { p: [0, 0.24, 0.02] });
  k.add(new T.CylinderGeometry(0.035, 0.035, 0.04, 14), bright, body, { p: [0, 0.29, 0.02] });
  k.add(new T.TorusGeometry(0.036, 0.006, 6, 20), copper, body, { p: [0, 0.31, 0.02], r: [Math.PI / 2, 0, 0] });
  k.rod(rubber, body, [-0.04, 0.2, -0.05], [-0.06, 0.34, -0.09], 0.006);
  const head = pivot(body, 0, 0.32, 0.02);
  k.add(new RoundedBoxGeometry(0.42, 0.26, 0.34, 4, 0.08), shell, head, { p: [0, 0.12, 0.02] });
  k.add(new RoundedBoxGeometry(0.38, 0.03, 0.3, 2, 0.01), servo, head, { p: [0, 0.0, 0.02] });
  // The camera: a black bezel, glass, and a lit status ring round it. Two tiny mic dots.
  k.add(new T.CylinderGeometry(0.075, 0.08, 0.03, 24), servo, head, { p: [0, 0.13, 0.195], r: [Math.PI / 2, 0, 0] });
  k.add(new T.CylinderGeometry(0.05, 0.05, 0.035, 20), glass, head, { p: [0, 0.13, 0.2], r: [Math.PI / 2, 0, 0] });
  k.add(new T.TorusGeometry(0.062, 0.006, 6, 28), led, head, { p: [0, 0.13, 0.208] });
  for (const s of [-1, 1]) k.ball(servo, head, [s * 0.15, 0.17, 0.185], 0.008);
  // The beak: the upper half fixed, the lower on a hinge at the back.
  k.add(new RoundedBoxGeometry(0.2, 0.035, 0.2, 2, 0.015), coral, head, { p: [0, 0.055, 0.28] });
  const beak = pivot(head, 0, 0.035, 0.19);
  k.add(new RoundedBoxGeometry(0.19, 0.03, 0.18, 2, 0.012), coral, beak, { p: [0, 0, 0.09] });
  // A speaker grille on top and the power LED.
  for (let i = 0; i < 5; i++) k.add(new T.TorusGeometry(0.012 + i * 0.013, 0.003, 4, 16), servo, head, { p: [0, 0.252, -0.02], r: [Math.PI / 2, 0, 0] });
  k.ball(led, head, [0.14, 0.255, -0.08], 0.01);
  // Legs: a hip servo on the shell, a bare thigh linkage, a knee servo, the shin, and a wide foot.
  const legs = [-1, 1].map((s) => {
    const hip = pivot(g, s * 0.13, 0.42, 0);
    k.add(new RoundedBoxGeometry(0.09, 0.1, 0.08, 2, 0.015), servo, hip, { p: [s * 0.02, 0.02, 0] });
    k.add(new T.CylinderGeometry(0.035, 0.035, 0.03, 14), bright, hip, { p: [s * 0.075, 0.02, 0], r: X });
    k.rod(bright, hip, [s * 0.075, 0.02, 0.02], [s * 0.07, -0.16, 0.01], 0.012);
    k.rod(bright, hip, [s * 0.075, 0.02, -0.02], [s * 0.07, -0.16, -0.01], 0.012);
    const knee = pivot(hip, s * 0.07, -0.17, 0);
    k.add(new RoundedBoxGeometry(0.07, 0.08, 0.07, 2, 0.012), servo, knee, { p: [0, 0, 0] });
    k.add(new T.CylinderGeometry(0.028, 0.028, 0.085, 12), bright, knee, { r: X });
    k.rod(servo, knee, [0, -0.03, 0], [0, -0.17, 0.02], 0.014, 0.011);
    k.add(new T.CylinderGeometry(0.022, 0.022, 0.07, 10), copper, knee, { p: [0, -0.18, 0.02], r: X });
    const foot = pivot(knee, 0, -0.19, 0.02);
    k.add(new RoundedBoxGeometry(0.14, 0.035, 0.24, 2, 0.015), coral, foot, { p: [0, -0.03, 0.05] });
    for (const dx of [-0.05, 0, 0.05]) k.add(new RoundedBoxGeometry(0.035, 0.03, 0.09, 2, 0.012), coral, foot, { p: [dx, -0.03, 0.19], r: [0, dx * 4, 0] });
    k.add(new RoundedBoxGeometry(0.08, 0.02, 0.06, 2, 0.008), rubber, foot, { p: [0, -0.045, -0.06] });
    return { hip, knee, foot };
  });
  // Roller mode: a pair of skate wheels under each foot, hidden until it is on.
  const rollers = new T.Group();
  g.add(rollers);
  const wheels: T.Group[] = [];
  for (const s of [-1, 1]) for (const z of [-0.02, 0.12]) {
    const w = pivot(rollers, s * 0.2, 0.04, z);
    k.add(new T.CylinderGeometry(0.045, 0.045, 0.03, 16), wheel, w, { r: X });
    k.add(new T.CylinderGeometry(0.02, 0.02, 0.036, 8), bright, w, { r: X });
    wheels.push(w);
  }
  rollers.visible = false;
  k.bake();
  let ph = 0, m = 0, roll = 0, quackT = 0;
  return finish(R, { body, head, arms: [], legs: legs.map((l) => l.hip), rollers }, (p) => {
    const t = p.time, mv = Math.min(1, Math.abs(p.speed) / 6);
    m = L(m, mv, 0.2);
    const rolling = p.roller || p.overclock;
    roll = L(roll, rolling ? 1 : 0, 0.15);
    ph += 0.24 * m * (1 - roll);
    const a = p.attack, hit = a ? swing(p) : 0, st = a ? strike(p) : 0, oc = p.overclock ? 1 : 0;
    common(R, p, 0.12);
    rollers.visible = roll > 0.02;
    rollers.scale.setScalar(Math.max(0.01, roll));
    wheels.forEach((w) => (w.rotation.x -= p.speed * 0.05 * roll));
    // The waddle: the shell rolls side to side, the head bobs against it; on wheels it crouches and leans in.
    body.position.y = 0.52 + Math.abs(Math.sin(ph)) * 0.04 * m - roll * 0.08 - (p.crouch || p.block ? 0.08 : 0);
    body.rotation.z = Math.sin(ph) * 0.12 * m * (1 - roll) + (p.hurt > 0 ? Math.sin(t * 30) * 0.05 : 0);
    body.rotation.x = L(body.rotation.x, roll * 0.32 * Math.min(1, Math.abs(p.speed) / 4) + (a === "secondary" ? 0.5 * hit : a === "heavy" ? 0.3 * st : p.block ? 0.2 : 0), 0.25);
    legs.forEach((l, i) => {
      const s = Math.sin(ph + i * Math.PI), kick = (a === "low" || a === "heavy" || a === "secondary") && i === 0 ? 1 : 0;
      l.hip.rotation.x = L(l.hip.rotation.x, roll * 0.25 + (kick ? -2.0 * st : p.air ? 0.5 : p.crouch ? 0.6 : s * 0.8 * m), 0.35);
      l.knee.rotation.x = L(l.knee.rotation.x, roll * -0.15 + (kick ? 0.5 * (1 - Math.max(0, st)) : p.air ? 0.8 : p.crouch ? 0.9 : Math.max(0, s) * 0.9 * m), 0.35);
      l.foot.rotation.x = L(l.foot.rotation.x, kick ? -0.4 * st : Math.max(0, -s) * 0.3 * m, 0.3);
    });
    // Peck, beak lock and the quack: head forward, beak open, snap shut on contact.
    const peck = a === "light" || a === "grab";
    head.rotation.x = L(head.rotation.x, peck ? 0.85 * st : p.hurt > 0 ? -0.4 : p.block ? 0.45 : a === "special" ? -0.2 : roll * 0.15, 0.35);
    head.rotation.z = L(head.rotation.z, Math.sin(t * 1.1) * 0.05 + (p.crouch ? 0.25 : 0), 0.2);
    // The idle gag: a slow, judgemental head tilt every so often.
    const tilt = Math.abs(p.speed) < 0.1 && !a && !p.dead && Math.sin(t * 0.12) > 0.98 ? 0.4 : 0;
    head.rotation.y = L(head.rotation.y, tilt + (a === "secondary" ? Math.sin(t * 20) * 0.2 : 0), 0.15);
    if (a === "grab" && p.attackProgress > 0.4) quackT = 1; quackT = Math.max(0, quackT - 0.05);
    beak.rotation.x = L(beak.rotation.x, peck ? (st > 0.6 ? 0.05 : 0.55 * Math.max(0, st)) : oc ? 0.35 + Math.sin(t * 12) * 0.15 : p.hurt > 0 ? 0.5 : quackT > 0.5 ? 0.6 : 0.03, 0.4);
    led.emissiveIntensity = p.dead ? 0.1 : 2 + Math.sin(t * 3) * 0.5 + hit * 2 + oc * 4 + roll * 1.5;
    R.lean.rotation.y = L(R.lean.rotation.y, 0, 0.2);
  });
}

export function robot(def: FighterDef): Robot {
  switch (def.id) {
    case "voxxy": return buildVoxxy(def);
    case "droid": return buildDroid(def);
    case "biggy": return buildBiggy(def);
    case "richie": return buildRichie(def);
    default: return buildMicroduck(def);
  }
}
export function animateRobot(r: Robot, p: Pose) {
  r.animate(p);
}
/** Release per-instance GPU resources. Shared textures and Richie's GLB stay. */
export function disposeRobot(r: Robot) {
  r.dispose();
}
