// The Devoxx crowd: procedural conference-goers. Every person is vertex-coloured
// geometry on one shared material, so a seated audience of a hundred is a single
// draw call and a walker is five (body plus four limbs that swing).
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const peopleMaterial = new T.MeshStandardMaterial({vertexColors: true, roughness: .88, metalness: 0});

// Deterministic per-person variety.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = <X,>(r: () => number, xs: X[]) => xs[Math.floor(r() * xs.length)];

const SKIN = [0xf1c9a5, 0xe0ac86, 0xc68a5e, 0x9c6a43, 0x6b4630, 0x4a3122, 0xf6d7bd];
const HAIR = [0x2b1d14, 0x1a1412, 0x5a3a22, 0x8a5a2a, 0xc9a36a, 0x6d6d6d, 0xb03a2a, 0xe8e2d6];
const TOPS = [0x2b2f3a, 0x1c1c1e, 0x3b4a7a, 0x7a2a2a, 0x2f6b4f, 0x4a4a4a, 0xf0752a, 0x8a3fa8, 0x2a6a8a, 0xd8d0c0, 0x5a7a2a, 0x223344];
const PANTS = [0x2c3e6b, 0x1d2a4a, 0x2a2a2a, 0x6b5a45, 0x3a3a48, 0x8a8478];
const SHOES = [0x111111, 0xf4f4f4, 0x4a3a2a, 0x2a3a6a, 0x8a2a2a];
const SHIRT_TEXTS = ['JAVA', 'DEVOXX', 'I ♥ JVM', 'KOTLIN', '</>', '☕ > 🛌', 'null', 'git blame', 'HELLO\nWORLD', 'JUG', 'it works\non my machine', '42'];

function tint(geo: T.BufferGeometry, color: number) {
  const c = new T.Color(color), n = geo.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new T.BufferAttribute(arr, 3));
  return geo;
}
const M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), V = new T.Vector3(), S = new T.Vector3();
function at(geo: T.BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  M.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S.set(sx, sy, sz));
  return geo.applyMatrix4(M);
}
const box = (w: number, h: number, d: number) => new T.BoxGeometry(w, h, d);
const ball = (r: number) => new T.SphereGeometry(r, 10, 8);
const capsule = (r: number, len: number) => new T.CapsuleGeometry(r, len, 3, 8);
const tube = (r: number, len: number) => new T.CylinderGeometry(r, r, len, 8);

export type Spec = ReturnType<typeof spec>;
export function spec(seed: number) {
  const r = rng(seed);
  const hoodie = r() < .45;
  return {
    r, seed,
    skin: pick(r, SKIN), hair: pick(r, HAIR), top: pick(r, TOPS), pants: pick(r, PANTS), shoes: pick(r, SHOES),
    hoodie, hood: hoodie && r() < .3,
    hairStyle: pick(r, ['short', 'short', 'short', 'long', 'bun', 'bald', 'ponytail', 'curly']),
    glasses: r() < .45, beard: r() < .3, cap: r() < .12, backpack: r() < .4, badge: r() < .85,
    coffee: r() < .35, laptop: r() < .18, phone: r() < .25,
    text: r() < .5 ? pick(r, SHIRT_TEXTS) : null,
    height: .92 + r() * .16, wide: .9 + r() * .25,
  };
}

// Limb geometry hangs from its pivot at the origin along -Y, so a walker can rotate it
// at the hip or shoulder and a seated pose can bake the same limb at an angle.
function legGeo(s: Spec, side: number, kneeBend = 0) {
  // Thigh hangs from the hip; the shin and shoe hang from the knee, bent by kneeBend so a
  // seated pose can fold the leg instead of sticking it straight out.
  const shin = mergeGeometries([
    tint(at(capsule(.085 * s.wide, .3), 0, -.22, 0), s.pants),
    tint(at(box(.17, .1, .3), side * .01, -.46, .05), s.shoes),
  ], false)!;
  at(shin, 0, -.47, 0, kneeBend);
  return mergeGeometries([tint(at(capsule(.095 * s.wide, .3), 0, -.24, 0), s.pants), shin], false)!;
}
function armGeo(s: Spec, side: number) {
  const sleeve = s.hoodie || s.r() < .5;
  const parts = [
    tint(at(capsule(.065, .56), 0, -.33, 0), sleeve ? s.top : s.skin),
    tint(at(ball(.062), 0, -.66, 0), s.skin),
  ];
  if (!sleeve) parts.push(tint(at(capsule(.075, .16), 0, -.1, 0), s.top));
  if (s.coffee && side > 0) { parts.push(tint(at(tube(.045, .12), 0, -.7, .07), 0xf2eee4)); parts.push(tint(at(tube(.048, .02), 0, -.63, .07), 0x6a3a2a)); }
  if (s.laptop && side < 0) parts.push(tint(at(box(.04, .26, .36), -.09, -.55, .05), 0x9a9a9a));
  if (s.phone && side < 0 && !s.laptop) parts.push(tint(at(box(.02, .14, .07), -.02, -.72, .06), 0x111111));
  return mergeGeometries(parts, false)!;
}
function bodyGeo(s: Spec) {
  const p: T.BufferGeometry[] = [];
  const w = s.wide;
  p.push(tint(at(box(.36 * w, .2, .24), 0, 1.08, 0), s.pants));
  p.push(tint(at(capsule(.2 * w, .48), 0, 1.5, 0, 0, 0, 0, 1.05, 1, .7), s.top));
  p.push(tint(at(tube(.055, .12), 0, 1.86, 0), s.skin));
  p.push(tint(at(ball(.17), 0, 2.06, 0, 0, 0, 0, 1, 1.08, 1), s.skin));
  p.push(tint(at(ball(.02), .06, 2.08, .16), 0x1a1210)); p.push(tint(at(ball(.02), -.06, 2.08, .16), 0x1a1210));
  if (s.hairStyle !== 'bald' && !s.hood) {
    p.push(tint(at(ball(.178), 0, 2.1, -.02, 0, 0, 0, 1, .95, 1), s.hair));
    if (s.hairStyle === 'long') p.push(tint(at(box(.3, .34, .16), 0, 1.92, -.14), s.hair));
    if (s.hairStyle === 'bun') p.push(tint(at(ball(.07), 0, 2.27, -.1), s.hair));
    if (s.hairStyle === 'ponytail') p.push(tint(at(capsule(.05, .22), 0, 1.95, -.2, .3), s.hair));
    if (s.hairStyle === 'curly') p.push(tint(at(ball(.2), 0, 2.13, -.03, 0, 0, 0, 1.05, .95, 1.05), s.hair));
  }
  if (s.hood) p.push(tint(at(ball(.2), 0, 2.08, -.06, 0, 0, 0, 1.05, 1.05, .9), s.top));
  if (s.hoodie) p.push(tint(at(box(.1, .08, .06), 0, 1.72, .14), 0xe8e0d0)); // drawstrings
  if (s.beard) p.push(tint(at(ball(.1), 0, 1.97, .09, 0, 0, 0, 1, .6, .7), s.hair));
  if (s.glasses) { for (const x of [-.06, .06]) p.push(tint(at(new T.TorusGeometry(.045, .008, 6, 12), x, 2.07, .16), 0x1a1a1a)); p.push(tint(at(box(.03, .008, .008), 0, 2.07, .165), 0x1a1a1a)); }
  if (s.cap) { p.push(tint(at(tube(.18, .09), 0, 2.2, 0), s.top)); p.push(tint(at(box(.2, .02, .16), 0, 2.16, .2), s.top)); }
  if (s.backpack) p.push(tint(at(box(.32 * w, .42, .16), 0, 1.5, -.24), pick(s.r, [0x1c1c1c, 0x7a2a2a, 0x2a4a7a, 0x3a5a2a])));
  if (s.badge) {
    for (const x of [-.09, .09]) p.push(tint(at(box(.015, .42, .015), x, 1.62, .15, .02), 0xf0752a));
    p.push(tint(at(box(.19, .25, .02), 0, 1.36, .155), 0xf7f4ec)); p.push(tint(at(box(.19, .05, .022), 0, 1.46, .156), 0xf0752a));
  }
  return mergeGeometries(p, false)!;
}

const textures = new Map<string, T.Material>();
function shirtMaterial(text: string) {
  let m = textures.get(text);
  if (m) return m;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = text.split('\n'); g.font = `bold ${lines.length > 1 ? 44 : text.length > 6 ? 40 : 64}px Arial`;
  lines.forEach((l, i) => g.fillText(l, 128, 128 + (i - (lines.length - 1) / 2) * 52, 236));
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  m = new T.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false});
  textures.set(text, m);
  return m;
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
    const s = spec(seed);
    const body = new T.Mesh(bodyGeo(s), peopleMaterial);
    body.castShadow = true;
    this.group.add(body);
    if (s.text && !s.hoodie) {
      const t = new T.Mesh(new T.PlaneGeometry(.28, .28), shirtMaterial(s.text));
      t.position.set(0, 1.58, .148); body.add(t);
    }
    const limb = (geo: T.BufferGeometry, x: number, y: number) => { const m = new T.Mesh(geo, peopleMaterial); m.position.set(x, y, 0); m.castShadow = true; this.group.add(m); return m; };
    this.limbs = [limb(armGeo(s, -1), -.27 * s.wide, 1.78), limb(armGeo(s, 1), .27 * s.wide, 1.78), limb(legGeo(s, -1), -.11, 1.05), limb(legGeo(s, 1), .11, 1.05)];
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

/** One merged geometry for a whole seated audience: rows of people on cinema seats. */
export function seatedAudience(seats: {x: number; y: number; z: number}[], seed = 7) {
  const r = rng(seed), parts: T.BufferGeometry[] = [];
  seats.forEach((seat, i) => {
    if (r() > .62) return; // a keynote never fills the room
    const s = spec(seed * 977 + i), h = s.height, yaw = (r() - .5) * .3;
    const bend = Math.PI / 2 - .15;
    const body = bodyGeo(s), legs = [legGeo(s, -1, bend), legGeo(s, 1, bend)], arms = [armGeo(s, -1), armGeo(s, 1)];
    // Hips on the seat, thighs forward, shins down, forearms in the lap. Legs and arms are
    // built hanging, so a rotation about their pivot poses them.
    at(body, 0, -.53, 0);
    legs.forEach((l, k) => { at(l, (k ? .11 : -.11), .55, 0, -bend); });
    arms.forEach((a, k) => { at(a, (k ? .27 : -.27) * s.wide, 1.23, 0, -.9, 0, (k ? -.15 : .15)); });
    const g = mergeGeometries([body, ...legs, ...arms], false)!;
    at(g, seat.x, seat.y - .45, seat.z, 0, yaw, 0, h); // seat.y is the cushion top
    parts.push(g);
  });
  const mesh = new T.Mesh(mergeGeometries(parts, false)!, peopleMaterial);
  mesh.castShadow = true;
  return mesh;
}

/** The standing crowd at the front. They wait politely — a keynote, not a gig — until
 *  Richie lands on them; then the arms go up and the bouncing starts. Each cluster is two
 *  merged meshes (calm and hyped) so swapping them costs nothing. */
export function cheeringCrowd(spots: {x: number; y: number; z: number}[], seed = 11) {
  const group = new T.Group(), clusters: {calm: T.Mesh; hype: T.Mesh}[] = [];
  const perCluster = Math.max(1, Math.ceil(spots.length / 4));
  for (let c = 0; c < spots.length; c += perCluster) {
    const build = (hyped: boolean) => {
      const r = rng(seed + c), parts: T.BufferGeometry[] = [];
      spots.slice(c, c + perCluster).forEach((sp, i) => {
        const s = spec(seed * 131 + c + i), yaw = Math.PI + (r() - .5) * .6;
        const body = bodyGeo(s), legs = [legGeo(s, -1), legGeo(s, 1)], arms = [armGeo(s, -1), armGeo(s, 1)];
        legs.forEach((l, k) => at(l, k ? .11 : -.11, 1.05, 0));
        // Calm: arms down, one maybe holding a phone up to film the stage. Hyped: both up.
        arms.forEach((a, k) => hyped ? at(a, (k ? .27 : -.27) * s.wide, 1.78, 0, Math.PI - .35, 0, (k ? -.4 : .4))
          : at(a, (k ? .27 : -.27) * s.wide, 1.78, 0, k && s.phone ? -2.6 : (r() - .5) * .15, 0, (k ? -.08 : .08)));
        const g = mergeGeometries([body, ...legs, ...arms], false)!;
        at(g, sp.x, sp.y, sp.z, 0, yaw, 0, s.height);
        parts.push(g);
      });
      const m = new T.Mesh(mergeGeometries(parts, false)!, peopleMaterial);
      m.castShadow = true;
      group.add(m);
      return m;
    };
    clusters.push({calm: build(false), hype: build(true)});
  }
  return {group, update(t: number, excitement = 0) {
    const hyped = excitement > .05;
    clusters.forEach(({calm, hype}, i) => {
      calm.visible = !hyped; hype.visible = hyped;
      const m = hyped ? hype : calm;
      m.position.y = hyped ? Math.abs(Math.sin(t * 2.4 + i)) * (.05 + Math.min(1, excitement) * .25) : 0;
      m.rotation.z = Math.sin(t * (hyped ? 1.6 : .5) + i * 1.3) * (hyped ? .02 : .006);
    });
  }};
}

// ------------------------------------------------------------------ security
/** What a guard needs to know about Richie each frame. */
export type Quarry = {pos: T.Vector3; catchable: boolean; canSee: (eye: T.Vector3, target: T.Vector3) => boolean};
export type GuardEvent = 'spotted' | 'grabbed' | 'thrown' | 'lost' | null;

/** Kinepolis security: patrols a loop, sees a cone in front, and does not like robots.
 *  Spot Richie and the guard gives chase; get caught and he hoists Richie overhead and
 *  throws him back. The cone is drawn on the floor so the player can plan around it. */
export class Guard {
  group = new T.Group();
  state: 'patrol' | 'alert' | 'chase' | 'grab' | 'throw' | 'return' = 'patrol';
  speed = 1.25;
  chaseSpeed = 3.3;
  range = 9;
  fov = .7; // half-angle, radians
  /** Where a held Richie sits: overhead. */
  readonly hands = new T.Vector3();
  private cone: T.Mesh;
  private bang: T.Sprite;
  private limbs: T.Mesh[];
  private phase = 0;
  private moving = 0;
  private wp = 0;
  private pause = 0;
  private yaw = 0;
  private timer = 0;
  private lastSeen = new T.Vector3();
  private unseen = 0;
  private cooldown = 0;
  private home: T.Vector3;
  private homeYaw: number;

  constructor(seed: number, public waypoints: T.Vector3[]) {
    const s = spec(seed);
    Object.assign(s, {top: 0x15181d, pants: 0x15181d, shoes: 0x111111, hoodie: false, hood: false, cap: true, badge: false, backpack: false, coffee: false, laptop: false, phone: false, text: null, hairStyle: 'short', height: 1.02 + s.r() * .08, wide: 1.05 + s.r() * .15});
    const body = new T.Mesh(bodyGeo(s), peopleMaterial);
    body.castShadow = true;
    this.group.add(body);
    // SECURITY across the chest and the back, a radio on the shoulder, an earpiece.
    for (const [z, ry] of [[.148, 0], [-.148, Math.PI]] as const) {
      const tag = new T.Mesh(new T.PlaneGeometry(.34, .34), shirtMaterial('SECURITY'));
      tag.position.set(0, 1.56, z); tag.rotation.y = ry; body.add(tag);
    }
    const radio = new T.Mesh(new T.BoxGeometry(.07, .12, .05), new T.MeshStandardMaterial({color: 0x222222, roughness: .6}));
    radio.position.set(.2, 1.78, .12); body.add(radio);
    const ear = new T.Mesh(new T.SphereGeometry(.025, 6, 6), new T.MeshStandardMaterial({color: 0xdddddd}));
    ear.position.set(.17, 2.06, .02); body.add(ear);
    const limb = (geo: T.BufferGeometry, x: number, y: number) => { const m = new T.Mesh(geo, peopleMaterial); m.position.set(x, y, 0); m.castShadow = true; this.group.add(m); return m; };
    this.limbs = [limb(armGeo(s, -1), -.27 * s.wide, 1.78), limb(armGeo(s, 1), .27 * s.wide, 1.78), limb(legGeo(s, -1), -.11, 1.05), limb(legGeo(s, 1), .11, 1.05)];
    // The vision cone, flat on the floor, pointing the way the guard faces (+Z).
    this.cone = new T.Mesh(new T.CircleGeometry(this.range, 28, -Math.PI / 2 - this.fov, this.fov * 2),
      new T.MeshBasicMaterial({color: 0xffd25c, transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide}));
    this.cone.rotation.x = -Math.PI / 2; this.cone.position.y = .06; this.group.add(this.cone);
    // The "!" over the head when Richie is spotted.
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!;
    g.fillStyle = '#ff4a3a'; g.font = 'bold 56px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 32, 34);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    this.bang = new T.Sprite(new T.SpriteMaterial({map: tex, transparent: true, depthTest: false}));
    this.bang.scale.setScalar(.7); this.bang.position.y = 2.75; this.bang.visible = false; this.group.add(this.bang);
    this.group.scale.setScalar(s.height);
    this.wp = Math.floor(s.r() * waypoints.length);
    const start = waypoints[this.wp];
    this.group.position.set(start.x, start.y, start.z);
    this.yaw = s.r() * 6.28;
    this.home = start.clone(); this.homeYaw = this.yaw;
  }

  /** Put the guard somewhere on purpose (the debug hook uses this to stage a catch). */
  place(x: number, y: number, z: number, yaw: number) {
    this.group.position.set(x, y, z); this.yaw = yaw; this.group.rotation.y = yaw; this.pause = 3;
    return this;
  }

  reset() {
    this.state = 'patrol'; this.timer = 0; this.cooldown = 0; this.unseen = 0; this.pause = 0;
    this.group.position.copy(this.home); this.yaw = this.homeYaw; this.group.rotation.y = this.yaw;
    this.bang.visible = false; this.tint(false);
  }

  private tint(alert: boolean) {
    const m = this.cone.material as T.MeshBasicMaterial;
    m.color.set(alert ? 0xff4a3a : 0xffd25c); m.opacity = alert ? .28 : .16;
  }

  private sees(q: Quarry) {
    if (!q.catchable || this.cooldown > 0) return false;
    const p = this.group.position, dx = q.pos.x - p.x, dz = q.pos.z - p.z, d = Math.hypot(dx, dz);
    if (d > this.range || Math.abs(q.pos.y - p.y) > 4) return false;
    const rel = Math.atan2(Math.sin(Math.atan2(dx, dz) - this.yaw), Math.cos(Math.atan2(dx, dz) - this.yaw));
    if (Math.abs(rel) > this.fov) return false;
    return q.canSee(new T.Vector3(p.x, p.y + 2, p.z), new T.Vector3(q.pos.x, q.pos.y + .3, q.pos.z));
  }

  private stepTo(x: number, z: number, speed: number, dt: number) {
    const p = this.group.position, dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz);
    if (d < .05) return d;
    const target = Math.atan2(dx, dz);
    this.yaw += Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw)) * Math.min(1, dt * 8);
    const s = Math.min(speed * dt, d);
    p.x += dx / d * s; p.z += dz / d * s;
    return d - s;
  }

  update(dt: number, t: number, q: Quarry): GuardEvent {
    const p = this.group.position;
    let ev: GuardEvent = null, moving = 0;
    this.cooldown = Math.max(0, this.cooldown - dt);
    const seen = this.sees(q);
    if (seen) { this.lastSeen.copy(q.pos); this.unseen = 0; } else this.unseen += dt;

    switch (this.state) {
      case 'patrol':
      case 'return': {
        if (seen) { this.state = 'alert'; this.timer = .45; this.bang.visible = true; this.tint(true); ev = 'spotted'; break; }
        if (this.pause > 0) { this.pause -= dt; break; }
        const w = this.waypoints[this.wp];
        if (this.stepTo(w.x, w.z, this.speed, dt) < .3) { this.wp = (this.wp + 1) % this.waypoints.length; this.pause = .5 + Math.random() * 2.5; this.state = 'patrol'; }
        else moving = 1;
        break;
      }
      case 'alert': { // a beat of "HEY!" before the running starts
        this.timer -= dt;
        const dx = q.pos.x - p.x, dz = q.pos.z - p.z, target = Math.atan2(dx, dz);
        this.yaw += Math.atan2(Math.sin(target - this.yaw), Math.cos(target - this.yaw)) * Math.min(1, dt * 10);
        if (this.timer <= 0) this.state = 'chase';
        break;
      }
      case 'chase': {
        if (this.unseen > 5) { this.state = 'return'; this.bang.visible = false; this.tint(false); ev = 'lost'; break; }
        const goal = seen ? q.pos : this.lastSeen;
        const d = this.stepTo(goal.x, goal.z, this.chaseSpeed, dt);
        moving = 1;
        if (seen && d < 1.3 && Math.abs(q.pos.y - p.y) < 1.7) { this.state = 'grab'; this.timer = 1.0; ev = 'grabbed'; }
        break;
      }
      case 'grab': { // hoist and hold: Richie sits in `hands`
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'throw'; this.timer = .35; ev = 'thrown'; }
        break;
      }
      case 'throw': {
        this.timer -= dt;
        if (this.timer <= 0) { this.state = 'return'; this.cooldown = 4; this.bang.visible = false; this.tint(false); }
        break;
      }
    }
    this.group.rotation.y = this.yaw;
    this.hands.set(p.x - Math.sin(this.yaw) * .2, p.y + 2.7, p.z + Math.cos(this.yaw) * .2);
    this.moving += (moving - this.moving) * Math.min(1, dt * 8);
    this.phase += dt * (this.state === 'chase' ? 12 : 7.5) * this.moving;
    const [aL, aR, lL, lR] = this.limbs, ph = this.phase, m = this.moving, holding = this.state === 'grab' || this.state === 'throw';
    lL.rotation.x = Math.sin(ph) * .6 * m; lR.rotation.x = -Math.sin(ph) * .6 * m;
    // Arms: pump while running, straight up while holding Richie, swinging through on the throw.
    const armUp = holding ? (this.state === 'throw' ? Math.PI - .2 + (.35 - this.timer) * 3 : Math.PI - .25) : 0;
    aL.rotation.x = holding ? armUp : -Math.sin(ph) * .5 * m; aR.rotation.x = holding ? armUp : Math.sin(ph) * .5 * m;
    this.bang.position.y = 2.75 + Math.sin(t * 8) * .05;
    return ev;
  }
}
