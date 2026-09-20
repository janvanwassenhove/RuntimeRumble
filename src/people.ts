// The Devoxx crowd: procedural conference-goers. Every person is vertex-coloured geometry
// on two shared materials — a matte skin-and-cloth surface with a fabric bump, and a glossy
// one for eyes, glasses and screens — so a seated audience of a hundred is two draw calls
// and a fan is a dozen small meshes that move. Proportions are eight heads tall with real
// shoulders, elbows, knees and hands; faces have eyes, brows, a nose, ears and a mouth that
// opens when they shout. The fans behind a fight cheer the way developers cheer: fist pumps,
// jumping, filming on a phone, hoisting a laptop, waving a sign, a foam finger — and always
// with both hands up: a crowd of developers, never anything that reads as a salute.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A fine grain shared by skin and cloth: weave, pores and knit catch the light.
const grain = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!, img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const v = 118 + Math.random() * 20 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(9, 9);
  return t;
})();
export const peopleMaterial = new T.MeshPhysicalMaterial({vertexColors: true, roughness: .74, metalness: 0, sheen: .35, sheenRoughness: .75, sheenColor: new T.Color(0x7a6a60), bumpMap: grain, bumpScale: .006});
export const glossMaterial = new T.MeshPhysicalMaterial({vertexColors: true, roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.4});
export const screenMaterial = new T.MeshStandardMaterial({color: 0x9fc8ff, emissive: 0xbfe0ff, emissiveIntensity: 1.3, roughness: .3});
for (const m of [peopleMaterial, glossMaterial, screenMaterial]) m.userData.shared = true;

// Deterministic per-person variety.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = <X,>(r: () => number, xs: X[]) => xs[Math.floor(r() * xs.length)];

const SKIN = [0xf1c9a5, 0xe0ac86, 0xc68a5e, 0x9c6a43, 0x6b4630, 0x4a3122, 0xf6d7bd, 0xd9a07a];
const HAIR = [0x2b1d14, 0x1a1412, 0x5a3a22, 0x8a5a2a, 0xc9a36a, 0x6d6d6d, 0xb03a2a, 0xe8e2d6, 0x3a2a4a];
const EYES = [0x3a2414, 0x2a4a6a, 0x4a6a3a, 0x1c1c1c, 0x6a4a2a];
const TOPS = [0x2b2f3a, 0x1c1c1e, 0x3b4a7a, 0x7a2a2a, 0x2f6b4f, 0x4a4a4a, 0xf0752a, 0x8a3fa8, 0x2a6a8a, 0xd8d0c0, 0x5a7a2a, 0x223344, 0x111111, 0xc8231f];
const PANTS = [0x2c3e6b, 0x1d2a4a, 0x2a2a2a, 0x6b5a45, 0x3a3a48, 0x8a8478, 0x1a2a3a];
const SHOES = [0x111111, 0xf4f4f4, 0x4a3a2a, 0x2a3a6a, 0x8a2a2a, 0xe8e8e8];
const SHIRT_TEXTS = ['JAVA', 'DEVOXX', 'I ♥ JVM', 'KOTLIN', '</>', '☕ > 🛌', 'null', 'git blame', 'HELLO\nWORLD', 'JUG', 'it works\non my machine', '42', 'sudo', 'NaN', '#!/bin/sh'];
const SIGNS = ['git push\n--force', 'SUDO WIN', 'I ♥ ROBOTS', 'BONK!', '404\nMERCY NOT FOUND', 'while(true)\n  cheer();', 'PR APPROVED', 'NO TESTS\nNO MERCY', 'TEAM\nRICHIE', 'VOXXY > *', 'quack.', 'CTRL+ALT+\nDEFEAT', 'SEGFAULT\nHIM', 'DROID\nHAS ROOT', 'BIGGY\nIS A FEATURE', 'ship it'];

function tint(geo: T.BufferGeometry, color: number, noise = .04) {
  const c = new T.Color(color), n = geo.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const k = 1 + (Math.random() - .5) * noise; arr[i * 3] = c.r * k; arr[i * 3 + 1] = c.g * k; arr[i * 3 + 2] = c.b * k; }
  geo.setAttribute('color', new T.BufferAttribute(arr, 3));
  return geo;
}
const M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), V = new T.Vector3(), S = new T.Vector3();
function at(geo: T.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz));
  return geo.applyMatrix4(M);
}
const box = (w: number, h: number, d: number) => new T.BoxGeometry(w, h, d);
const ball = (r: number, d = 14) => new T.SphereGeometry(r, d, Math.max(6, d - 4));
const capsule = (r: number, len: number) => new T.CapsuleGeometry(r, len, 4, 12);
const tube = (r: number, len: number) => new T.CylinderGeometry(r, r, len, 10);
const merge = (parts: T.BufferGeometry[]) => mergeGeometries(parts.map(g => g.index ? g.toNonIndexed() : g), false)!;
/** Matte and glossy geometry for one person, kept apart so each goes to its material. */
type Parts = {m: T.BufferGeometry[]; g: T.BufferGeometry[]; s: T.BufferGeometry[]};
const parts = (): Parts => ({m: [], g: [], s: []});

export type Spec = ReturnType<typeof spec>;
export function spec(seed: number) {
  const r = rng(seed);
  const hoodie = r() < .45;
  return {
    r, seed,
    skin: pick(r, SKIN), hair: pick(r, HAIR), eyes: pick(r, EYES), top: pick(r, TOPS), pants: pick(r, PANTS), shoes: pick(r, SHOES),
    hoodie, hood: hoodie && r() < .3, sleeves: hoodie || r() < .4,
    hairStyle: pick(r, ['short', 'short', 'fade', 'long', 'bun', 'bald', 'ponytail', 'curly', 'quiff']),
    glasses: r() < .45, beard: r() < .3, cap: r() < .12, backpack: r() < .35, badge: r() < .85,
    coffee: r() < .3, laptop: r() < .15, phone: r() < .25,
    text: r() < .5 ? pick(r, SHIRT_TEXTS) : null,
    height: .92 + r() * .16, wide: .9 + r() * .25,
  };
}

// Landmarks, in metres at scale 1: eight heads tall, the head centre at 2.06.
const HIP = 1.05, SHOULDER = 1.78, NECK = 1.9, HEAD = 2.06, ELBOW = .3, HAND = .34;

/** Thigh from the hip, shin and shoe from the knee, bent by `knee` for a seated pose. */
export function legGeo(s: Spec, side: number, knee = 0) {
  const shin = merge([
    tint(at(capsule(.08 * s.wide, .3), 0, -.22, 0), s.pants),
    tint(at(ball(.075 * s.wide), 0, -.04, 0), s.pants),                         // the knee
    tint(at(ball(.045), 0, -.42, .01), s.skin, .02),                              // an ankle
    tint(at(box(.15, .08, .3), side * .01, -.47, .05), s.shoes),
    tint(at(ball(.075), side * .01, -.47, .2, 0, 0, 0, 1, .9, .8), s.shoes),     // the toe
    tint(at(box(.16, .025, .32), side * .01, -.505, .05), 0x1a1a1a, .01),         // the sole
  ]);
  at(shin, 0, -.47, 0, knee);
  return merge([tint(at(capsule(.095 * s.wide, .3), 0, -.24, 0), s.pants), shin]);
}
/** Shoulder to elbow. Sleeves, or skin below a T-shirt's cuff. */
export function upperArmGeo(s: Spec, side: number) {
  const p = [tint(at(capsule(.062, .22), 0, -.16, 0), s.sleeves ? s.top : s.skin, s.sleeves ? .05 : .02), tint(at(ball(.075), side * .01, .0, 0), s.top)];
  if (!s.sleeves) p.push(tint(at(capsule(.075, .1), 0, -.07, 0), s.top));
  return merge(p);
}
/** Elbow to fingertips, with a hand: palm, fingers, thumb. `prop` is what the hand carries. */
export function forearmGeo(s: Spec, side: number, prop: 'coffee' | 'laptop' | 'phone' | null = null) {
  const p = [
    tint(at(ball(.058), 0, 0, 0), s.sleeves ? s.top : s.skin, .02),
    tint(at(capsule(.052, .24), 0, -.17, 0), s.sleeves ? s.top : s.skin, s.sleeves ? .05 : .02),
    tint(at(box(.07, .085, .03), 0, -.36, .0), s.skin, .02),
    tint(at(ball(.036), 0, -.415, 0, 0, 0, 0, 1, .85, .6), s.skin, .02),
    tint(at(ball(.017), side * .042, -.35, .015), s.skin, .02),
  ];
  if (prop === 'coffee') { p.push(tint(at(tube(.045, .12), 0, -.4, .06), 0xf2eee4, .01)); p.push(tint(at(tube(.048, .02), 0, -.33, .06), 0x6a3a2a)); }
  if (prop === 'laptop') p.push(tint(at(box(.04, .26, .36), -side * .09, -.25, .05), 0x9a9a9a, .01));
  if (prop === 'phone') p.push(tint(at(box(.02, .14, .07), -side * .02, -.42, .06), 0x111111, .01));
  return merge(p);
}
/** A whole arm hanging from the shoulder, for anyone who does not need an elbow. */
export function armGeo(s: Spec, side: number, prop: 'coffee' | 'laptop' | 'phone' | null = null) {
  return merge([upperArmGeo(s, side), at(forearmGeo(s, side, prop), 0, -ELBOW, 0)]);
}
/** Hips to neck: trousers, top, shoulders, hoodie and lanyard. No head, no limbs. */
export function torsoParts(s: Spec) {
  const o = parts(), w = s.wide, m = o.m;
  m.push(tint(at(capsule(.19 * w, .12), 0, HIP + .04, 0, 0, 0, 0, 1, .6, .72), s.pants));                    // hips
  m.push(tint(at(box(.34 * w, .04, .22), 0, HIP + .14, 0), 0x2a2420, .01));                                 // a belt
  m.push(tint(at(capsule(.2 * w, .46), 0, HIP + .45, 0, 0, 0, 0, 1.08, 1, .72), s.top));                    // the torso
  m.push(tint(at(ball(.22 * w), 0, SHOULDER - .05, 0, 0, 0, 0, 1.25, .5, .78), s.top));                       // shoulders
  m.push(tint(at(tube(.055, .13), 0, NECK - .04, 0), s.skin, .02));
  m.push(tint(at(new T.TorusGeometry(.075, .018, 8, 20), 0, SHOULDER + .06, .01, Math.PI / 2), s.top));       // the collar
  if (s.hood) m.push(tint(at(ball(.2), 0, HEAD + .02, -.06, 0, 0, 0, 1.05, 1.05, .9), s.top));
  else if (s.hoodie) m.push(tint(at(ball(.16), 0, SHOULDER - .02, -.1, 0, 0, 0, 1.2, .5, .8), s.top));      // the hood, down
  if (s.hoodie) { m.push(tint(at(box(.26 * w, .12, .02), 0, HIP + .3, .16), s.top)); for (const x of [-.03, .03]) m.push(tint(at(tube(.006, .16), x, SHOULDER - .1, .16), 0xe8e0d0)); }
  if (s.backpack) {
    const c = pick(s.r, [0x1c1c1c, 0x7a2a2a, 0x2a4a7a, 0x3a5a2a]);
    m.push(tint(at(box(.32 * w, .42, .16), 0, HIP + .45, -.24), c)); for (const x of [-.11, .11]) m.push(tint(at(box(.05, .36, .02), x, HIP + .55, .15), c));
  }
  if (s.badge) {
    for (const x of [-.09, .09]) m.push(tint(at(box(.012, .4, .012), x, SHOULDER - .17, .155, .02), 0xf0752a, .01));
    m.push(tint(at(box(.19, .25, .02), 0, HIP + .31, .16), 0xf7f4ec, .01)); m.push(tint(at(box(.19, .05, .022), 0, HIP + .41, .161), 0xf0752a, .01));
    m.push(tint(at(box(.12, .012, .023), 0, HIP + .33, .162), 0x333333, .01)); m.push(tint(at(box(.08, .012, .023), 0, HIP + .29, .162), 0x777777, .01));
  }
  return o;
}
/** The head, built around the neck pivot at y=0 so a fan can nod and turn it. `mouth` is left off for the fans, who animate one. */
export function headParts(s: Spec, mouth = true) {
  const o = parts(), m = o.m, g = o.g, y0 = NECK, Y = (y: number) => y - y0;
  m.push(tint(at(ball(.17, 18), 0, Y(HEAD), 0, 0, 0, 0, 1, 1.1, 1), s.skin, .025));
  m.push(tint(at(ball(.12), 0, Y(HEAD - .1), .02, 0, 0, 0, 1.1, .8, 1), s.skin, .025));                        // the jaw
  m.push(tint(at(ball(.026), 0, Y(HEAD - .02), .17, 0, 0, 0, .8, 1.2, 1), s.skin, .02));                       // a nose
  for (const x of [-1, 1]) {
    m.push(tint(at(ball(.035), x * .168, Y(HEAD - .01), 0, 0, 0, 0, .5, 1, .7), s.skin, .02));                   // ears
    m.push(tint(at(box(.055, .012, .018), x * .06, Y(HEAD + .06), .152, 0, 0, x * -.15), s.hair));              // brows
    g.push(tint(at(ball(.026, 10), x * .06, Y(HEAD + .02), .148), 0xf4f2ee, 0));                                // eyes
    g.push(tint(at(ball(.013, 8), x * .06, Y(HEAD + .02), .167), s.eyes, 0));
    g.push(tint(at(ball(.006, 6), x * .06, Y(HEAD + .02), .177), 0x050505, 0));
  }
  if (mouth) m.push(tint(at(box(.05, .012, .012), 0, Y(HEAD - .09), .14), 0x7a3a3a, .01));
  if (s.hairStyle !== 'bald' && !s.hood && !s.cap) {
    m.push(tint(at(ball(.178, 18), 0, Y(HEAD + .04), -.02, 0, 0, 0, 1, .95, 1), s.hair));
    if (s.hairStyle === 'fade') m.push(tint(at(ball(.16), 0, Y(HEAD + .09), -.01, 0, 0, 0, 1, .8, 1), s.hair));
    if (s.hairStyle === 'long') m.push(tint(at(box(.3, .34, .16), 0, Y(HEAD - .14), -.14), s.hair));
    if (s.hairStyle === 'bun') m.push(tint(at(ball(.07), 0, Y(HEAD + .21), -.1), s.hair));
    if (s.hairStyle === 'ponytail') m.push(tint(at(capsule(.05, .22), 0, Y(HEAD - .11), -.2, .3), s.hair));
    if (s.hairStyle === 'curly') for (let i = 0; i < 9; i++) { const a = i * .7; m.push(tint(at(ball(.07, 8), Math.sin(a) * .13, Y(HEAD + .08) + Math.cos(a * 1.3) * .06, Math.cos(a) * .11 - .03), s.hair)); }
    if (s.hairStyle === 'quiff') m.push(tint(at(ball(.09), 0, Y(HEAD + .2), .08, .5, 0, 0, 1.2, .6, 1), s.hair));
  } else if (s.hairStyle === 'bald' && !s.cap && !s.hood) m.push(tint(at(ball(.05), 0, Y(HEAD + .05), -.16, 0, 0, 0, 1.6, .6, .7), s.hair));
  if (s.beard) m.push(tint(at(ball(.1), 0, Y(HEAD - .09), .09, 0, 0, 0, 1, .6, .7), s.hair));
  if (s.glasses) {
    for (const x of [-.06, .06]) g.push(tint(at(new T.TorusGeometry(.04, .006, 6, 14), x, Y(HEAD + .02), .165), 0x1a1a1a, 0));
    g.push(tint(at(box(.03, .006, .006), 0, Y(HEAD + .02), .17), 0x1a1a1a, 0));
    for (const x of [-1, 1]) g.push(tint(at(box(.006, .006, .16), x * .1, Y(HEAD + .03), .08), 0x1a1a1a, 0));
  }
  if (s.cap) { m.push(tint(at(ball(.18), 0, Y(HEAD + .04), 0, 0, 0, 0, 1, .7, 1), s.top)); m.push(tint(at(box(.2, .015, .16), 0, Y(HEAD + .1), .2), s.top)); }
  return o;
}
type Pose = {armX: [number, number]; armZ?: [number, number]; foreX?: [number, number]; foreZ?: [number, number]; legX?: number; knee?: number; headX?: number; headY?: number; props?: ('coffee' | 'laptop' | 'phone' | null)[]; lapTop?: boolean};
/** A whole person as static geometry, limbs posed by the caller's angles. */
function personParts(s: Spec, pose: Pose = {armX: [0, 0]}) {
  const o = parts(), t = torsoParts(s), h = headParts(s);
  o.m.push(...t.m, ...h.m.map(g => at(g, 0, NECK, 0, pose.headX ?? 0, pose.headY ?? 0))); o.g.push(...h.g.map(g => at(g, 0, NECK, 0, pose.headX ?? 0, pose.headY ?? 0)));
  [-1, 1].forEach((side, i) => {
    const prop = pose.props ? pose.props[i] : i && s.coffee ? 'coffee' : !i && s.laptop ? 'laptop' : !i && s.phone ? 'phone' : null;
    const fore = at(forearmGeo(s, side, prop), 0, -ELBOW, 0, pose.foreX?.[i] ?? 0, 0, pose.foreZ?.[i] ?? 0);
    o.m.push(at(merge([upperArmGeo(s, side), fore]), side * .27 * s.wide, SHOULDER, 0, pose.armX[i], 0, pose.armZ?.[i] ?? 0));
    o.m.push(at(legGeo(s, side, pose.knee ?? 0), side * .11, HIP, 0, pose.legX ?? 0));
  });
  if (pose.lapTop) lapTopParts(o);
  return o;
}
/** An open laptop on the knees of someone sitting, its screen towards them, its logo lit. */
function lapTopParts(o: Parts) {
  const grey = 0xb4b4b8;
  o.m.push(tint(at(box(.32, .015, .22), 0, HIP + .05, .3), grey, .01));
  o.m.push(tint(at(box(.32, .21, .014), 0, HIP + .15, .41, -.3), grey, .01));
  for (let i = 0; i < 18; i++) o.m.push(tint(at(box(.02, .004, .02), -.1 + (i % 6) * .04, HIP + .058, .24 + Math.floor(i / 6) * .035), 0x1a1a1a, 0));
  o.s.push(at(new T.PlaneGeometry(.28, .17), 0, HIP + .15, .402, -.3 + Math.PI));
  o.s.push(at(new T.CircleGeometry(.025, 14), 0, HIP + .16, .418, -.3));
}
const textures = new Map<string, T.Material>();
function textMaterial(text: string, fg = '#ffffff', bg: string | null = null, size = 64) {
  const key = text + fg + bg;
  let m = textures.get(key);
  if (m) return m;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, 256, 256); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = text.split('\n'); g.font = `bold ${lines.length > 1 ? Math.min(size, 44) : text.length > 6 ? Math.min(size, 40) : size}px Arial`;
  lines.forEach((l, i) => g.fillText(l, 128, 128 + (i - (lines.length - 1) / 2) * 52, 236));
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  m = new T.MeshBasicMaterial({map: tex, transparent: !bg, depthWrite: !!bg, side: T.DoubleSide});
  m.userData.shared = true;
  textures.set(key, m);
  return m;
}
const shirtMaterial = (text: string) => textMaterial(text);
function meshes(o: Parts, parent: T.Object3D, shadows = true) {
  const out: T.Mesh[] = [];
  for (const [list, mat] of [[o.m, peopleMaterial], [o.g, glossMaterial], [o.s, screenMaterial]] as const) {
    if (!list.length) continue;
    const q = new T.Mesh(merge(list), mat); q.castShadow = shadows; q.receiveShadow = shadows; parent.add(q); out.push(q);
  }
  return out;
}

/** A person who walks between waypoints, with a walk cycle and the odd pause. */
export class Walker {
  group = new T.Group();
  speed: number;
  private limbs: T.Mesh[];
  private phase = 0;
  private moving = 0;
  private wp = 0;
  private pause = 0;
  private yaw = 0;
  constructor(seed: number, public waypoints: T.Vector3[]) {
    const s = spec(seed), o = parts(), t = torsoParts(s), h = headParts(s);
    o.m.push(...t.m, ...h.m.map(g => at(g, 0, NECK, 0))); o.g.push(...h.g.map(g => at(g, 0, NECK, 0)));
    const [body] = meshes(o, this.group);
    if (s.text && !s.hoodie) { const q = new T.Mesh(new T.PlaneGeometry(.28, .28), shirtMaterial(s.text)); q.position.set(0, HIP + .53, .155); body.add(q); }
    const limb = (geo: T.BufferGeometry, x: number, y: number) => { const m = new T.Mesh(geo, peopleMaterial); m.position.set(x, y, 0); m.castShadow = true; this.group.add(m); return m; };
    this.limbs = [limb(armGeo(s, -1, s.laptop ? 'laptop' : s.phone ? 'phone' : null), -.27 * s.wide, SHOULDER), limb(armGeo(s, 1, s.coffee ? 'coffee' : null), .27 * s.wide, SHOULDER), limb(legGeo(s, -1), -.11, HIP), limb(legGeo(s, 1), .11, HIP)];
    this.group.scale.setScalar(s.height);
    this.speed = 1.1 + s.r() * .9;
    this.wp = Math.floor(s.r() * waypoints.length);
    this.pause = s.r() * 4;
    this.phase = s.r() * 6;
    const start = waypoints[this.wp];
    this.group.position.set(start.x, start.y, start.z);
    this.yaw = s.r() * 6.28;
    this.group.rotation.y = this.yaw;
  }
  /** Back to the first waypoint, heading for the next: the corridor's crowd surge resets this way. */
  restart(yaw?: number) {
    this.wp = 1 % this.waypoints.length; this.pause = 0; this.moving = 0;
    const s = this.waypoints[0]; this.group.position.set(s.x, s.y, s.z);
    if (yaw !== undefined) { this.yaw = yaw; this.group.rotation.y = yaw; }
  }
  update(dt: number, t: number) {
    const p = this.group.position;
    let moving = 0;
    if (this.pause > 0) this.pause -= dt;
    else {
      const w = this.waypoints[this.wp], dx = w.x - p.x, dz = w.z - p.z, d = Math.hypot(dx, dz);
      if (d < .3) { this.wp = (this.wp + 1 + Math.floor(Math.random() * 2)) % this.waypoints.length; this.pause = 1 + Math.random() * 6; }
      else {
        const target = Math.atan2(dx, dz);
        this.yaw += Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw)) * Math.min(1, dt * 5);
        const s = Math.min(this.speed * dt, d);
        p.x += dx / d * s; p.z += dz / d * s; moving = 1;
      }
    }
    this.group.rotation.y = this.yaw;
    this.moving += (moving - this.moving) * Math.min(1, dt * 6);
    this.phase += dt * 7.5 * this.moving;
    const [aL, aR, lL, lR] = this.limbs, ph = this.phase, m = this.moving, idle = Math.sin(t * 1.3 + this.phase) * .03;
    lL.rotation.x = Math.sin(ph) * .6 * m;
    lR.rotation.x = -Math.sin(ph) * .6 * m;
    aL.rotation.x = -Math.sin(ph) * .45 * m + idle;
    aR.rotation.x = Math.sin(ph) * .45 * m - idle;
    this.group.position.y = this.waypoints[0].y + Math.abs(Math.sin(ph)) * .03 * m;
  }
}

const BEND = Math.PI / 2 - .15;
/** How someone sits: hands in the lap, on the armrests, folded, a phone, a laptop, chin on a hand, arms up. */
const SEATED_POSES: ((r: () => number) => Pose)[] = [
  r => ({armX: [-.3, -.3], armZ: [.14, -.14], foreX: [-1.3 - r() * .2, -1.3 - r() * .2], headY: (r() - .5) * .4}),                       // hands in the lap
  r => ({armX: [-.1, -.1], armZ: [.42, -.42], foreX: [-1.55, -1.55], headY: (r() - .5) * .5}),                                              // elbows on the armrests
  r => ({armX: [-.55, -.55], armZ: [.75, -.75], foreX: [-2.0, -2.0], foreZ: [-.9, .9], headX: .04, headY: (r() - .5) * .3}),                // arms folded
  r => ({armX: [-.35, -.35], armZ: [.1, -.12], foreX: [-1.5, -1.65], headX: .42, props: [null, 'phone']}),                                  // on a phone, head down
  () => ({armX: [-.3, -.3], armZ: [.12, -.12], foreX: [-1.3, -1.3], headX: .36, lapTop: true, props: [null, null]}),                         // typing on a laptop
  r => ({armX: [-.15, -.5], armZ: [.4, -.12], foreX: [-1.5, -2.35], headX: .08, headY: .2 + r() * .2}),                                     // chin on a hand
  r => ({armX: [-.4, -.35], armZ: [.15, -.3], foreX: [-1.35, -1.2], headY: -.5 - r() * .3}),                                                // turned to a neighbour
  r => ({armX: [-2.7, -2.8], armZ: [.3, -.3], foreX: [.25, .25], headX: -.15, headY: (r() - .5) * .3}),                                    // arms up
];
/**
 * A seated audience: the rows nearest the fight are individually animated fans, the rest
 * one merged pair of meshes in varied, natural poses. Same shape as a cheering crowd.
 */
export function seatedAudience(seats: {x: number; y: number; z: number}[], seed = 7, animated = 28) {
  const r = rng(seed), all = parts(), group = new T.Group(), fans: Fan[] = [];
  // The nearest, most central seats are the ones the camera sees: those get the live fans.
  const near = [...seats].map((sp, i) => ({sp, i, d: sp.y * 6 + Math.abs(sp.x) * .35})).sort((a, b) => a.d - b.d).slice(0, Math.round(animated * 1.4)).map(x => x.i);
  seats.forEach((seat, i) => {
    if (r() > .62) return; // a keynote never fills the room
    const s = spec(seed * 977 + i), h = s.height, yaw = (r() - .5) * .3;
    if (near.includes(i) && fans.length < animated) {
      const f = new Fan(seed * 977 + i, seat.x, seat.y - .45 - .53 * h, seat.z, yaw, undefined, true);
      group.add(f.group); fans.push(f);
      return;
    }
    const o = personParts(s, {...pick(r, SEATED_POSES)(r), legX: -BEND, knee: BEND});
    for (const list of [o.m, o.g, o.s]) for (const g of list) { at(g, 0, -.53, 0); at(g, seat.x, seat.y - .45, seat.z, 0, yaw, 0, h); }
    all.m.push(...o.m); all.g.push(...o.g); all.s.push(...o.s);
  });
  meshes(all, group);
  return {group, fans, update(t: number, excitement = 0) { for (const f of fans) f.update(t, excitement); }};
}

// ------------------------------------------------------------------ the fans
export type CheerStyle = 'arms' | 'pump' | 'jump' | 'phone' | 'sign' | 'clap' | 'laptop' | 'foam' | 'wave' | 'rest' | 'chat' | 'type' | 'scroll';
const STYLES: CheerStyle[] = ['arms', 'pump', 'jump', 'phone', 'sign', 'clap', 'laptop', 'foam', 'wave', 'laptop', 'jump', 'pump'];
/** Sitting down: mostly watching, some typing or scrolling, a few clapping or with their arms up. */
const SEATED_STYLES: CheerStyle[] = ['rest', 'rest', 'rest', 'chat', 'type', 'type', 'scroll', 'clap', 'clap', 'arms', 'wave', 'rest'];
/**
 * A standing fan who cheers on their own beat: shoulders, elbows, head and mouth are
 * separate meshes, and what the hands hold depends on the style — a phone filming, a
 * laptop to live-blog on, a sign, a foam finger.
 */
export class Fan {
  group = new T.Group();
  style: CheerStyle;
  private head: T.Group;
  private mouth: T.Mesh;
  private sh: T.Group[];
  private fore: T.Group[];
  private legs: T.Mesh[];
  private phase: number;
  private rate: number;
  private base: number;
  private lean: number;
  constructor(seed: number, x: number, y: number, z: number, yaw = 0, style?: CheerStyle, public seated = false) {
    const s = spec(seed), r = s.r;
    this.style = style ?? pick(r, seated ? SEATED_STYLES : STYLES);
    this.phase = r() * 20; this.rate = .85 + r() * .4; this.base = y; this.lean = (r() - .5) * .08;
    const [body] = meshes(torsoParts(s), this.group);
    if (s.text && !s.hoodie) { const q = new T.Mesh(new T.PlaneGeometry(.28, .28), shirtMaterial(s.text)); q.position.set(0, HIP + .53, .155); body.add(q); }
    this.head = new T.Group(); this.head.position.y = NECK; this.group.add(this.head);
    meshes(headParts(s, false), this.head);
    this.mouth = new T.Mesh(tint(ball(.02, 10), 0x4a1c1c, 0), peopleMaterial); this.mouth.position.set(0, HEAD - NECK - .09, .145); this.mouth.scale.set(1.4, .5, .5); this.head.add(this.mouth);
    this.sh = []; this.fore = [];
    [-1, 1].forEach((side, i) => {
      const sh = new T.Group(); sh.position.set(side * .27 * s.wide, SHOULDER, 0); this.group.add(sh);
      const u = new T.Mesh(upperArmGeo(s, side), peopleMaterial); u.castShadow = true; sh.add(u);
      const fo = new T.Group(); fo.position.y = -ELBOW; sh.add(fo);
      const f = new T.Mesh(forearmGeo(s, side), peopleMaterial); f.castShadow = true; fo.add(f);
      this.sh.push(sh); this.fore.push(fo);
      if (i === 1) this.prop(fo, s);
    });
    this.legs = [-1, 1].map(side => { const m = new T.Mesh(legGeo(s, side, seated ? BEND : 0), peopleMaterial); m.position.set(side * .11, HIP, 0); if (seated) m.rotation.x = -BEND; m.castShadow = true; this.group.add(m); return m; });
    if (this.style === 'type') { const o = parts(); lapTopParts(o); meshes(o, this.group, false); }
    this.group.scale.setScalar(s.height);
    this.group.position.set(x, y, z);
    this.group.rotation.y = yaw;
  }
  /**
   * What the right hand holds. These are held aloft, and a raised forearm is turned about
   * half a turn about x, so the prop is built in a group flipped the same way: in it +Y is
   * up when the arm is up and +Z faces the fight (and the camera).
   */
  private prop(hand: T.Object3D, s: Spec) {
    const held = new T.Group(); held.position.y = -HAND; held.rotation.x = Math.PI; hand.add(held);
    const add = (g: T.BufferGeometry, mat: T.Material = peopleMaterial) => { const m = new T.Mesh(g, mat); m.castShadow = true; held.add(m); return m; };
    if (this.style === 'scroll') {
      // A phone in the lap: the forearm is not turned over here, so this one is built in hand space.
      held.rotation.x = 0; held.position.y = -HAND - .06;
      add(tint(at(box(.072, .15, .009), 0, 0, .02), 0x15151a, .01), glossMaterial);
      const scr = new T.Mesh(new T.PlaneGeometry(.062, .13), screenMaterial); scr.position.set(0, 0, .026); held.add(scr);
    } else if (this.style === 'phone') {
      add(tint(at(box(.072, .15, .009), 0, .1, 0), 0x15151a, .01), glossMaterial);
      add(tint(at(ball(.008, 8), .022, .15, .006), 0x222233, 0), glossMaterial);                             // the lens, on the fight
      const scr = new T.Mesh(new T.PlaneGeometry(.062, .13), screenMaterial); scr.position.set(0, .1, -.005); scr.rotation.y = Math.PI; held.add(scr);
    } else if (this.style === 'sign') {
      add(tint(at(tube(.012, .5), 0, .25, 0), 0xc9a26a, .03));
      const board = pick(s.r, ['#f7f4ec', '#f0752a', '#f6c21c', '#1c1c1e']), ink = board === '#1c1c1e' ? '#f6c21c' : '#15171b';
      add(tint(at(box(.44, .3, .012), 0, .62, 0), new T.Color(board).getHex(), .01));
      const text = new T.Mesh(new T.PlaneGeometry(.42, .28), textMaterial(pick(s.r, SIGNS), ink, board, 58)); text.position.set(0, .62, .008); held.add(text);
      const back = text.clone(); back.position.z = -.008; back.rotation.y = Math.PI; held.add(back);
    } else if (this.style === 'laptop') {
      // A laptop hoisted overhead in both hands, lid open, its logo lit towards the fight.
      const grey = pick(s.r, [0xb8b8bc, 0x2a2a2e, 0xd8d5cc]);
      add(tint(at(box(.34, .015, .24), -.14, .05, -.02), grey, .01));
      add(tint(at(box(.34, .22, .014), -.14, .17, -.13, .3), grey, .01));
      const scr = new T.Mesh(new T.PlaneGeometry(.3, .19), screenMaterial); scr.position.set(-.14, .17, -.12); scr.rotation.x = .3; scr.rotation.y = Math.PI; held.add(scr);
      const logo = new T.Mesh(new T.CircleGeometry(.03, 16), screenMaterial); logo.position.set(-.14, .18, -.138); logo.rotation.x = .3; held.add(logo);
      for (let i = 0; i < 18; i++) add(tint(at(box(.02, .004, .02), -.25 + (i % 6) * .034, .058, -.06 + Math.floor(i / 6) * .03), 0x1a1a1a, 0));
    } else if (this.style === 'foam') {
      add(tint(at(box(.17, .26, .06), 0, .13, 0), 0xf0752a, .02));
      add(tint(at(box(.06, .15, .06), 0, .33, 0), 0xf0752a, .02));
      const one = new T.Mesh(new T.PlaneGeometry(.15, .2), textMaterial('#1', '#ffffff', null, 90)); one.position.set(0, .13, .032); held.add(one);
    }
  }
  /** `excitement` 0..1 is the arena's; a fan at a fight is never below half. */
  update(t: number, excitement = 0) {
    if (this.seated) return this.updateSeated(t, excitement);
    const e = .5 + .5 * Math.min(1, excitement), tt = t * this.rate + this.phase, st = this.style;
    const [L, R] = this.sh, [fL, fR] = this.fore, up = -2.85, s1 = Math.sin(tt * 3), s2 = Math.sin(tt * 4);
    let ax = [0, 0], az = [0, 0], fx = [-.15, -.15], hx = -.1 * e, jump = 0;
    switch (st) {
      // Both arms always move together: no style ever raises one arm alone.
      // With the arm up the forearm is turned over: a positive elbow bend brings the hand forward.
      case 'arms': ax = [up + s1 * .15, up - s1 * .15]; az = [.35 + s1 * .2, -.35 + s1 * .2]; fx = [.3, .3]; break;
      case 'jump': ax = [up, up]; az = [.5, -.5]; fx = [.2, .2]; jump = Math.abs(Math.sin(tt * 2.2)) * .22 * e; break;
      case 'pump': { const k = .5 + .5 * s2; ax = [-2.2 - .5 * k, -2.2 - .5 * k]; az = [.25, -.25]; fx = [.9 - .5 * k, .9 - .5 * k]; break; }
      case 'phone': ax = [-2.3, -2.35]; az = [.12, -.12]; fx = [.6, .55]; hx = -.28; break;
      case 'sign': ax = [-2.55 + Math.sin(tt * 2.5) * .22, -2.6 + Math.sin(tt * 2.5) * .22]; az = [.3, -.28]; fx = [.35, .35]; break;
      case 'clap': { const k = .5 + .5 * Math.sin(tt * 7); ax = [-1.55, -1.55]; az = [.1 + .28 * k, -.1 - .28 * k]; fx = [-1.15, -1.15]; break; }
      case 'laptop': { const w = Math.sin(tt * 2.2) * .3; ax = [-2.6, -2.62]; az = [.28 + w, -.28 + w]; fx = [.35, .35]; hx = -.22; break; }
      case 'foam': ax = [-2.7 + s1 * .1, -2.75 + s1 * .12]; az = [.3 + s1 * .3, -.3 + s1 * .35]; fx = [.3, .25]; break;
      case 'wave': ax = [-2.75, -2.75]; az = [.2 + s2 * .5, -.2 + s2 * .5]; fx = [.3, .3]; break;
    }
    L.rotation.x = ax[0]; R.rotation.x = ax[1]; L.rotation.z = az[0]; R.rotation.z = az[1]; fL.rotation.x = fx[0]; fR.rotation.x = fx[1];
    const bob = st === 'jump' ? jump : Math.abs(Math.sin(tt * 2)) * .035 * e;
    this.group.position.y = this.base + bob;
    this.group.rotation.z = this.lean + Math.sin(tt * 1.1) * .025;
    this.legs.forEach((l, i) => { l.rotation.x = st === 'jump' ? -(1 - Math.min(1, jump / .1)) * .2 : Math.sin(tt * 2 + i * Math.PI) * .04; });
    this.head.rotation.x = hx + Math.sin(tt * 2) * .04;
    this.head.rotation.y = Math.sin(tt * .7) * .18;
    this.head.rotation.z = Math.sin(tt * 1.6) * .05;
    // The shout: the mouth opens on the beat, wider the more excited they are.
    const open = Math.max(0, Math.sin(tt * 3)) * e;
    this.mouth.scale.set(1.2 + open * .5, .3 + open * 1.9, .5 + open * .5);
  }
  /** Sitting: small, slow movements — a look around, a shift in the seat — and what the hands are doing. */
  private updateSeated(t: number, excitement: number) {
    const e = Math.min(1, excitement), tt = t * this.rate + this.phase, st = this.style;
    const [L, R] = this.sh, [fL, fR] = this.fore, slow = Math.sin(tt * .6), s2 = Math.sin(tt * 1.3);
    let ax = [-.3, -.3], az = [.14, -.14], fx = [-1.35, -1.35], hx = .02 + slow * .03, hy = Math.sin(tt * .35) * .35, open = 0, lean = 0;
    switch (st) {
      case 'rest': ax = [-.12 + slow * .04, -.12 - slow * .04]; az = [.4, -.4]; fx = [-1.55 + s2 * .05, -1.55 - s2 * .05]; lean = Math.max(0, Math.sin(tt * .25)) * .12; break;
      case 'chat': { const k = .5 + .5 * Math.sin(tt * 2.6); ax = [-.35, -.45 - k * .3]; az = [.15, -.25 - k * .3]; fx = [-1.3, -1.4 - k * .4]; hy = -.55 + Math.sin(tt * .9) * .12; open = .4 + .4 * Math.sin(tt * 5); break; }
      case 'type': { const look = Math.sin(tt * .3) > .8; ax = [-.32, -.32]; az = [.1, -.1]; fx = [-1.3 + Math.sin(tt * 11) * .05, -1.3 + Math.cos(tt * 9) * .05]; hx = look ? -.05 : .38; hy = look ? Math.sin(tt) * .3 : Math.sin(tt * 3) * .04; break; }
      case 'scroll': ax = [-.3, -.4]; az = [.12, -.1]; fx = [-1.4, -1.75 + Math.sin(tt * 2) * .04]; hx = .42; hy = -.12; break;
      case 'clap': { const k = .5 + .5 * Math.sin(tt * 7); ax = [-1.2, -1.2]; az = [.1 + .28 * k, -.1 - .28 * k]; fx = [-1.2, -1.2]; hx = -.05; open = .5 * e; break; }
      case 'arms': ax = [-2.7 + s2 * .1, -2.75 - s2 * .1]; az = [.3, -.3]; fx = [.3, .3]; hx = -.18; lean = -.08; open = .6 + .4 * Math.sin(tt * 3); break;
      case 'wave': ax = [-2.7, -2.7]; az = [.2 + Math.sin(tt * 4) * .45, -.2 + Math.sin(tt * 4) * .45]; fx = [.3, .3]; hx = -.15; open = .5 + .5 * Math.sin(tt * 3); break;
    }
    // A hazard brings everyone forward in their seat, hands up.
    if (e > .2 && st !== 'arms' && st !== 'wave') { ax = [ax[0] * (1 - e) - 2.6 * e, ax[1] * (1 - e) - 2.6 * e]; fx = [fx[0] * (1 - e) + .3 * e, fx[1] * (1 - e) + .3 * e]; az = [az[0] * (1 - e) + .3 * e, az[1] * (1 - e) - .3 * e]; hx = hx * (1 - e) - .2 * e; open = Math.max(open, e); }
    L.rotation.x = ax[0]; R.rotation.x = ax[1]; L.rotation.z = az[0]; R.rotation.z = az[1]; fL.rotation.x = fx[0]; fR.rotation.x = fx[1];
    this.group.position.y = this.base + Math.abs(Math.sin(tt * 2)) * .012 * e;
    this.group.rotation.x = lean + e * .1;
    this.group.rotation.z = this.lean * .5 + Math.sin(tt * .5) * .012;
    this.head.rotation.x = hx; this.head.rotation.y = hy; this.head.rotation.z = Math.sin(tt * .8) * .03;
    const o = Math.max(0, open);
    this.mouth.scale.set(1.2 + o * .5, .3 + o * 1.9, .5 + o * .5);
  }
}
/**
 * The crowd behind a fight: one fan per spot, each with their own style and beat. Facing
 * +z, towards the fighters and the camera. Keeps the old shape: {group, update}.
 */
export function cheeringCrowd(spots: {x: number; y: number; z: number}[], seed = 11, styles?: CheerStyle[]) {
  const group = new T.Group(), r = rng(seed);
  const fans = spots.map((sp, i) => { const f = new Fan(seed * 131 + i, sp.x, sp.y, sp.z, (r() - .5) * .7, styles?.[i % (styles.length || 1)]); group.add(f.group); return f; });
  return {group, fans, update(t: number, excitement = 0) { for (const f of fans) f.update(t, excitement); }};
}
