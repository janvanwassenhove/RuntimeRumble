// Kinepolis Antwerp, dressed — the same venue kit as Please Do Not Throw Richie: generated
// carpet, stone, velvet and acoustic cloth (docs/REFERENCES.md), the exhibition booths and
// their absurd robot gadgets, the Devoxx signage, the escalators, the cinema seats. arena.ts
// composes six slices of the building out of these for the fights. Walls and ceilings are
// single-sided and face inwards, so the camera never sees their backs.
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Kit, canvasTex, steel, glow, plastic, type V3} from './kit';
import {tex, hasTex} from './textures';
import logoSvg from './assets/devoxx-white.svg?raw';

type Look = {rough?: number; metal?: number; tint?: T.ColorRepresentation; bump?: number};
/** A surface that tiles in metres: `tile` is the width one copy of the image covers. */
export function textured(name: string, tile: number, fallback: number, o: Look = {}) {
  const map = tex(name);
  const m = new T.MeshStandardMaterial({color: map ? (o.tint ?? 0xffffff) : fallback, map, roughness: o.rough ?? .9, metalness: o.metal ?? 0});
  if (map && o.bump) { m.bumpMap = tex(name, 1, 1, false); m.bumpScale = o.bump; }
  m.userData.tile = tile;
  return m;
}
export const flat = (color: number, rough = .9, metal = 0) => new T.MeshStandardMaterial({color, roughness: rough, metalness: metal});

export const mats = {
  hall: textured('carpet-hall', 1.4, 0x565c63, {rough: .97, bump: 1.5, tint: 0xc9ced6}),
  cinema: textured('carpet-cinema', 3.2, 0x171c33, {rough: .97, bump: 1}),
  tiers: textured('carpet-cinema', 3.2, 0x10142a, {rough: .97, tint: 0xb4b8c8}),
  stone: textured('stone-floor', 2.5, 0x74787c, {rough: .55, tint: 0x7e7e80}),
  acoustic: textured('wall-acoustic', 4, 0x171b26, {rough: .96}),
  graphite: textured('metal-graphite', 1.6, 0x3a3f47, {rough: .55, metal: .5, tint: 0xd0d4dc, bump: 1.2}),
  plaster: flat(0xd8d5ce, .93),
  plasterDark: flat(0x3a3f47, .93),
  ceiling: flat(0x0d0f12, .95),
  stage: new T.MeshStandardMaterial({color: 0x08090b, roughness: .22, metalness: 0, envMapIntensity: 1.3}),
  laminate: plastic(0xf1efea, null, .3),
  black: flat(0x111316, .55, .2),
  chrome: steel(0xd6dadd, .16, 1),
  brass: steel(0xc9a25a, .25, 1),
  wood: flat(0x3a271a, .55),
  comb: flat(0xb9922f, .5, .35),
  rubber: flat(0x0c0d0f, .7),
  glass: new T.MeshPhysicalMaterial({color: 0xbfd8e6, roughness: .12, metalness: 0, transparent: true, opacity: .22, depthWrite: false, envMapIntensity: 1.6}),
  velvet: (() => {
    const map = tex('seat-velvet');
    const m = new T.MeshPhysicalMaterial({color: map ? 0xffffff : 0x7d1f24, map, roughness: .85, sheen: 1, sheenRoughness: .45, sheenColor: new T.Color(0xff5a5a)});
    if (map) { m.bumpMap = tex('seat-velvet', 1, 1, false); m.bumpScale = 1; }
    m.userData.tile = 1.1;
    return m;
  })(),
  warm: glow(0xffe2b8, 3), cool: glow(0xdfeaff, 3), orange: glow(0xff8a2a, 3.5), red: glow(0xff2a2a, 3), blue: glow(0x4a7dff, 2.2), green: glow(0x5cf0a8, 2.6),
};

/** Rescale a box's UVs to metres so one shared material tiles evenly on boxes of any size. */
export function worldUV(geo: T.BufferGeometry, w: number, h: number, d: number, tile: number) {
  const uv = geo.attributes.uv, f = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < 24; i++) uv.setXY(i, uv.getX(i) * f[i >> 2][0] / tile, uv.getY(i) * f[i >> 2][1] / tile);
  return geo;
}
export const boxGeo = (w: number, h: number, d: number, m: T.Material) => worldUV(new T.BoxGeometry(w, h, d), w, h, d, m.userData.tile ?? 4);

/** A textured box, tiled in metres, shadowed. */
export function slab(scene: T.Object3D, m: T.Material, w: number, h: number, d: number, x: number, y: number, z: number, shadow = true) {
  const q = new T.Mesh(boxGeo(w, h, d, m), m);
  q.position.set(x, y, z); q.castShadow = shadow; q.receiveShadow = true; scene.add(q);
  return q;
}

/** Inward-facing wall or ceiling. `face` is the direction the surface looks. */
export function panel(scene: T.Object3D, m: T.Material, w: number, h: number, x: number, y: number, z: number, face: 'x+' | 'x-' | 'z+' | 'z-' | 'down') {
  const g = new T.PlaneGeometry(w, h), tile = m.userData.tile ?? 4, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * h / tile);
  const q = new T.Mesh(g, m);
  q.position.set(x, y, z);
  if (face === 'down') q.rotation.x = Math.PI / 2; else q.rotation.y = {'x+': Math.PI / 2, 'x-': -Math.PI / 2, 'z+': 0, 'z-': Math.PI}[face];
  q.receiveShadow = true;
  scene.add(q);
  return q;
}

type TextOpts = {bg?: string; fg?: string; sub?: string; accent?: string; w?: number; h?: number; font?: number; mono?: boolean; align?: CanvasTextAlign};
export function textTex(text: string, o: TextOpts = {}) {
  const W = o.w ?? 1024, H = o.h ?? 256;
  return canvasTex(W, H, c => {
    c.fillStyle = o.bg ?? '#101418'; c.fillRect(0, 0, W, H);
    if (o.accent) { c.fillStyle = o.accent; c.fillRect(0, H - 14, W, 14); }
    c.fillStyle = o.fg ?? '#f6efe2'; c.textAlign = o.align ?? 'center'; c.textBaseline = 'middle';
    const family = o.mono ? '"Cascadia Mono", Consolas, "Courier New", monospace' : '"Helvetica Neue", Arial, sans-serif';
    c.font = `800 ${o.font ?? (o.sub ? H * .42 : H * .5)}px ${family}`;
    const x = o.align === 'left' ? W * .05 : W / 2;
    c.fillText(text, x, o.sub ? H * .4 : H * .5, W * .92);
    if (o.sub) { c.font = `600 ${H * .16}px ${family}`; c.fillText(o.sub, x, H * .76, W * .92); }
  });
}
// The official Devoxx wordmark (src/assets/devoxx-white.svg: white, with the orange XX), so
// every Devoxx sign in the building is the real logo rather than the word set in Arial. It is
// white on transparent, which means dark panels: on Devoxx orange the XX would disappear. The
// file has no intrinsic size, and some browsers will not draw a sizeless SVG to a canvas, so
// it is given one on the way in.
const LOGO_AR = 506.12 / 69.88;
const logo = new Promise<HTMLImageElement | null>(res => {
  const i = new Image();
  i.onload = () => res(i); i.onerror = () => res(null);
  i.src = URL.createObjectURL(new Blob([logoSvg.replace('<svg ', '<svg width="2024" height="280" ')], {type: 'image/svg+xml'}));
});
type LogoOpts = {bg?: string; fill?: number; vertical?: boolean; accent?: boolean; y?: number; under?: (c: CanvasRenderingContext2D, w: number, h: number) => void; over?: (c: CanvasRenderingContext2D, w: number, h: number) => void};
/** A panel carrying the logo: `fill` is the share of the panel's long side the wordmark spans. */
export function logoTex(W: number, H: number, o: LogoOpts = {}) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  let alive = true;
  const paint = (img: HTMLImageElement | null) => {
    if (!alive) return;
    const c = cv.getContext('2d')!;
    c.fillStyle = o.bg ?? '#0e1216'; c.fillRect(0, 0, W, H);
    o.under?.(c, W, H);
    if (o.accent) { c.fillStyle = '#f1a41c'; if (o.vertical) { c.fillRect(0, 0, W, 10); c.fillRect(0, H - 10, W, 10); } else c.fillRect(0, H - Math.max(6, H * .045), W, Math.max(6, H * .045)); }
    if (img) {
      const len = (o.vertical ? H : W) * (o.fill ?? .7), th = len / LOGO_AR;
      c.save(); c.translate(W / 2, H * (o.y ?? .5)); if (o.vertical) c.rotate(-Math.PI / 2);
      c.drawImage(img, -len / 2, -th / 2, len, th); c.restore();
    }
    o.over?.(c, W, H);
    t.needsUpdate = true;
  };
  paint(null); void logo.then(paint);
  t.userData.repaint = () => void logo.then(paint);   // for a panel whose `under` art arrives later
  t.addEventListener('dispose', () => { alive = false; });
  return t;
}

/** A self-lit sign: the face is unlit, so it reads as a lightbox in a dim room. */
export function lightbox(scene: T.Object3D, map: T.Texture, w: number, h: number, x: number, y: number, z: number, yaw: number, frame = true) {
  const q = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({map}));
  q.position.set(x, y, z); q.rotation.y = yaw; scene.add(q);
  if (frame) { const f = new T.Mesh(new T.BoxGeometry(w + .12, h + .12, .08), mats.black); f.position.set(x - Math.sin(yaw) * .05, y, z - Math.cos(yaw) * .05); f.rotation.y = yaw; f.castShadow = true; scene.add(f); }
  return q;
}

// ------------------------------------------------------------------ escalators
// No geometry moves: the tread and handrail textures scroll along the ramp, which reads as a
// running escalator from every angle the game shows one. Increasing offset.y walks the pattern
// towards the top: the +Y face of a box maps v backwards along z, so a rising offset moves a
// step edge the way the steps go.
export const ESCALATOR_SPEED = 2.4;                     // metres a second, along the slope
const STEP = .42, RAIL_TILE = .9;
export function escalatorSkin(len: number) {
  const treadMap = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#464c53'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {                      // cleats, running the way the steps travel
      c.fillStyle = '#292e33'; c.fillRect(i * w / 26, 0, w / 60, h);
      c.fillStyle = '#5f6970'; c.fillRect(i * w / 26 + w / 60, 0, w / 110, h);
    }
    c.fillStyle = '#16191d'; c.fillRect(0, 0, w, h * .11);     // the gap between two steps
    c.fillStyle = '#cfa130'; c.fillRect(0, h * .11, w, h * .05); // and its yellow nose
  });
  const railMap = canvasTex(32, 256, (c, w, h) => {
    c.fillStyle = '#15171a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2b3036'; c.fillRect(0, h * .45, w, h * .09);
  });
  const running: {map: T.Texture; per: number}[] = [];
  for (const [m, per] of [[treadMap, STEP], [railMap, RAIL_TILE]] as const) {
    m.wrapS = m.wrapT = T.RepeatWrapping;
    m.repeat.set(m === treadMap ? 2 : 1, len / per);
    running.push({map: m, per});
  }
  return {
    tread: new T.MeshStandardMaterial({map: treadMap, roughness: .5, metalness: .8}),
    rail: new T.MeshStandardMaterial({map: railMap, roughness: .62, metalness: .1}),
    /** Run them. Both go up, towards the keynote. */
    tick(dt: number) { for (const r of running) r.map.offset.y = (r.map.offset.y + ESCALATOR_SPEED / r.per * dt) % 1; },
    dispose() { treadMap.dispose(); railMap.dispose(); },
  };
}

// ------------------------------------------------------------------ gadgets
// What the exhibitors are selling. All of it is stamped into one kit, so a whole floor's
// worth of nonsense merges into a draw call per material.
export const G = {
  chrome: mats.chrome, black: mats.black, rubber: mats.rubber,
  yellow: plastic(0xf6c21c), orange: plastic(0xf0640f), white: plastic(0xf2f0ea), red: plastic(0xc8231f), toast: flat(0xc98a3c, .85), crumb: flat(0xe9c98a, .9),
  eye: glow(0xff2a1a, 3), lidar: glow(0x39d0ff, 3), flame: glow(0xff9a2a, 4), fabric: flat(0x1a1c20, .95),
};
const X90: V3 = [0, 0, Math.PI / 2];
export function toasterBot(k: Kit, p: T.Object3D) {
  k.add(new RoundedBoxGeometry(.36, .24, .22, 3, .05), G.chrome, p, {p: [0, .2, 0]});
  for (const x of [-.08, .08]) { k.add(new T.BoxGeometry(.1, .02, .16), G.black, p, {p: [x, .321, 0]}); k.add(new RoundedBoxGeometry(.085, .15, .14, 2, .02), G.toast, p, {p: [x, .38 + (x > 0 ? .05 : 0), 0], r: [0, 0, x]}); }
  k.add(new T.BoxGeometry(.03, .06, .05), G.black, p, {p: [.195, .22, 0]});
  for (const x of [-.07, .07]) { k.ball(G.white, p, [x, .22, .112], .038); k.ball(G.black, p, [x + .006, .22, .142], .016); }
  for (const x of [-.13, .13]) { k.rod(G.black, p, [x, .32, -.06], [x * 1.5, .5, -.08], .006); k.ball(G.red, p, [x * 1.5, .5, -.08], .022); }
  for (const x of [-.13, .13]) for (const z of [-.07, .07]) { k.rod(G.black, p, [x, .09, z], [x * 1.15, .02, z * 1.2], .012); k.ball(G.rubber, p, [x * 1.15, .02, z * 1.2], .022); }
}
export function duckDrone(k: Kit, p: T.Object3D) {
  k.add(new T.CylinderGeometry(.13, .15, .04, 24), G.black, p, {p: [0, .02, 0]});
  k.rod(G.chrome, p, [0, .04, 0], [0, .12, 0], .012);
  k.ball(G.yellow, p, [0, .24, 0], .16, [1.05, .82, 1.3]);
  k.ball(G.yellow, p, [0, .25, -.2], .06, [.8, .6, 1.2]);
  k.ball(G.yellow, p, [0, .43, .1], .11);
  k.ball(G.orange, p, [0, .41, .215], .05, [1.3, .45, 1]);
  k.ball(G.black, p, [-.05, .46, .19], .018);
  k.add(new T.CylinderGeometry(.03, .034, .03, 16), G.black, p, {p: [.05, .46, .185], r: [Math.PI / 2 - .2, 0, -.3]});
  k.ball(G.eye, p, [.053, .462, .2], .017);
  k.rod(G.black, p, [0, .53, .08], [0, .64, .08], .008);
  for (const a of [0, Math.PI / 2]) k.add(new T.BoxGeometry(.34, .006, .035), G.black, p, {p: [0, .64, .08], r: [0, a + .4, .06]});
}
export function coffeeBot(k: Kit, p: T.Object3D) {
  for (const x of [-.1, .1]) k.add(new RoundedBoxGeometry(.07, .08, .3, 2, .03), G.rubber, p, {p: [x, .04, 0]});
  k.add(new T.CylinderGeometry(.13, .1, .3, 28), G.white, p, {p: [0, .24, 0]});
  k.add(new T.CylinderGeometry(.128, .113, .12, 28), G.orange, p, {p: [0, .24, 0]});
  k.add(new T.CylinderGeometry(.137, .137, .03, 28), G.black, p, {p: [0, .405, 0]});
  k.add(new T.SphereGeometry(.12, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), G.black, p, {p: [0, .41, 0], s: [1, .35, 1]});
  k.add(new RoundedBoxGeometry(.15, .06, .02, 2, .01), G.black, p, {p: [0, .25, .122]});
  for (const x of [-.035, .035]) k.ball(G.flame, p, [x, .25, .13], .014);
  k.rod(G.chrome, p, [-.13, .28, 0], [-.23, .2, .06], .012); k.ball(G.rubber, p, [-.23, .2, .06], .025);
  k.rod(G.chrome, p, [.13, .28, 0], [.22, .42, .05], .012); k.ball(G.rubber, p, [.22, .42, .05], .025);
  k.add(new T.TorusGeometry(.05, .022, 8, 14, Math.PI), G.toast, p, {p: [.23, .47, .05], r: [0, 0, .4]});   // a croissant, held aloft
}
export function selfDrivingChair(k: Kit, p: T.Object3D) {
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * .4; k.rod(G.black, p, [0, .1, 0], [Math.sin(a) * .34, .06, Math.cos(a) * .34], .025, .018); k.ball(G.rubber, p, [Math.sin(a) * .34, .035, Math.cos(a) * .34], .035); }
  k.rod(G.chrome, p, [0, .1, 0], [0, .46, 0], .028);
  k.add(new RoundedBoxGeometry(.52, .1, .5, 3, .04), G.fabric, p, {p: [0, .5, 0]});
  k.add(new RoundedBoxGeometry(.48, .62, .08, 3, .035), G.fabric, p, {p: [0, .9, -.24], r: [-.12, 0, 0]});
  for (const x of [-.29, .29]) { k.rod(G.black, p, [x, .5, -.05], [x, .7, -.05], .015); k.add(new RoundedBoxGeometry(.06, .035, .3, 2, .015), G.black, p, {p: [x, .71, 0]}); }
  k.rod(G.chrome, p, [0, 1.18, -.27], [0, 1.4, -.27], .012);
  k.add(new T.CylinderGeometry(.075, .085, .08, 20), G.black, p, {p: [0, 1.43, -.27]});
  k.add(new T.TorusGeometry(.082, .01, 6, 24), G.lidar, p, {p: [0, 1.43, -.27], r: [Math.PI / 2, 0, 0]});
  for (const x of [-.2, .2]) { k.add(new T.CylinderGeometry(.045, .06, .26, 16), G.red, p, {p: [x, .42, -.33], r: [Math.PI / 2, 0, 0]}); k.add(new T.ConeGeometry(.04, .14, 12), G.flame, p, {p: [x, .42, -.52], r: [-Math.PI / 2, 0, 0]}); }
  for (const x of [-.18, .18]) k.ball(G.flame, p, [x, .52, .26], .025);
}
export function robotArm(k: Kit, p: T.Object3D) {
  k.add(new T.CylinderGeometry(.2, .24, .12, 24), G.black, p, {p: [0, .06, 0]});
  k.add(new T.CylinderGeometry(.12, .14, .22, 20), G.orange, p, {p: [0, .23, 0]});
  const a: V3 = [0, .34, 0], b: V3 = [.12, .95, .1], c: V3 = [.5, 1.25, .3], d: V3 = [.72, 1.02, .42];
  k.add(new T.CylinderGeometry(.09, .09, .2, 18), G.chrome, p, {p: a, r: X90});
  k.rod(G.orange, p, a, b, .07, .055); k.add(new T.CylinderGeometry(.075, .075, .17, 18), G.chrome, p, {p: b, r: X90});
  k.rod(G.orange, p, b, c, .052, .04); k.ball(G.chrome, p, c, .055);
  k.rod(G.black, p, c, d, .03); k.add(new RoundedBoxGeometry(.1, .05, .08, 2, .015), G.black, p, {p: d});
  for (const s of [-1, 1]) k.rod(G.chrome, p, [d[0] + s * .04, d[1], d[2]], [d[0] + s * .03, d[1] - .13, d[2]], .012, .007);
  k.add(new T.TorusGeometry(.045, .02, 8, 14, Math.PI), G.toast, p, {p: [d[0], d[1] - .15, d[2]], r: [0, .6, Math.PI]});
}
/** The popcorn machine from the foyer bar. */
export function popcornMachine(k: Kit, p: T.Object3D) {
  k.add(new T.BoxGeometry(.7, .12, .55), G.red, p, {p: [0, .06, 0]}); k.add(new T.BoxGeometry(.74, .1, .6), G.red, p, {p: [0, .87, 0]});
  for (const x of [-.33, .33]) for (const z of [-.25, .25]) k.add(new T.BoxGeometry(.035, .72, .035), mats.brass, p, {p: [x, .48, z]});
  k.add(new T.BoxGeometry(.66, .7, .5), mats.glass, p, {p: [0, .47, 0]});
  for (let i = 0; i < 40; i++) k.add(new T.IcosahedronGeometry(.05, 0), G.crumb, p, {p: [(i * .37 % 1 - .5) * .56, .15 + (i * .61 % 1) * .16, (i * .83 % 1 - .5) * .4]});
  k.add(new T.CylinderGeometry(.1, .08, .14, 14), mats.chrome, p, {p: [0, .7, 0]}); k.ball(mats.warm, p, [0, .8, 0], .04);
}

// ------------------------------------------------------------------ exhibition booths
export const BRANDS = [
  {name: 'ROBO-BARISTA 9000', sub: 'NOW WITH 40% FEWER BURNS', bg: '#f0640f', fg: '#fff6e8', pad: 0x6d2a08},
  {name: "DUKE'S GADGET LAB", sub: 'WRITE ONCE, GADGET ANYWHERE', bg: '#c8231f', fg: '#ffffff', pad: 0x1d3f7a},
  {name: 'RUBBER DUCK AI', sub: 'IT LISTENS. IT JUDGES.', bg: '#f6c21c', fg: '#15323a', pad: 0x0f4a52},
  {name: 'TOAST-AS-A-SERVICE', sub: '99.9% UPTIME. 100% CRUMBS.', bg: '#2f7d4f', fg: '#fdf3d8', pad: 0x1f4f33},
  {name: 'SELF-DRIVING OFFICE CHAIR', sub: 'STAND-UPS WILL NEVER BE THE SAME', bg: '#5b2a8c', fg: '#ffd9a8', pad: 0x2e1547},
  {name: 'NULLPOINTER DETECTOR', sub: 'BEEPS BEFORE PRODUCTION DOES', bg: '#111111', fg: '#f6c21c', pad: 0x3a3206},
];
/** A booth facing +z (the camera), its back wall at `z`, centred on `x`. Returns the textures it made. */
export function booth(scene: T.Object3D, k: Kit, x: number, z: number, i: number, tmp: T.Texture[]) {
  const b = BRANDS[i % BRANDS.length], side = i % 2 ? -1 : 1;
  const brand = flat(new T.Color(b.bg).getHex(), .6), pad = new T.MeshStandardMaterial({color: b.pad, roughness: .97, map: tex('carpet-hall', 2.8, 2.1), bumpMap: tex('carpet-hall', 2.8, 2.1, false), bumpScale: 1.5});
  const put = (geo: T.BufferGeometry, m: T.Material, px: number, py: number, pz: number, shadow = true) => { const q = new T.Mesh(geo, m); q.position.set(px, py, pz); q.castShadow = shadow; q.receiveShadow = true; scene.add(q); return q; };
  const T2 = (t: T.Texture) => { tmp.push(t); return t; };
  put(new T.BoxGeometry(4.2, .04, 3.2), pad, x, .02, z + 1.6, false);
  put(new T.BoxGeometry(4, 3.3, .16), brand, x, 1.65, z + .08);                          // the back wall, in the brand colour
  put(new T.BoxGeometry(.12, 3.3, 3), mats.laminate, x + side * 2.06, 1.65, z + 1.5);    // one laminate side wall
  // The backdrop: generated poster art if it is there, the brand's own typography if not.
  const art = tex(`booth-${i % 6 + 1}`);
  if (art) { art.wrapS = art.wrapT = T.ClampToEdgeWrapping; art.repeat.set(1, 1); T2(art); }
  lightbox(scene, art ?? T2(textTex(b.name, {bg: b.bg, fg: b.fg, sub: b.sub, w: 1024, h: 683, font: 96})), 2.9, 1.93, x, 1.75, z + .17, 0, false);
  lightbox(scene, T2(textTex(b.name, {bg: b.bg, fg: b.fg, h: 200, font: 92})), 3.6, .58, x, 3.6, z + .2, 0);
  // Counter, with the brand on its front and the merchandise on top.
  put(new T.BoxGeometry(2.2, 1.0, .8), brand, x - side * .6, .5, z + 2.5);
  put(new T.BoxGeometry(2.3, .05, .9), mats.laminate, x - side * .6, 1.025, z + 2.5);
  lightbox(scene, T2(textTex(b.name, {bg: b.bg, fg: b.fg, h: 256, font: 84})), 1.9, .45, x - side * .6, .58, z + 2.905, 0, false);
  const toys = [coffeeBot, toasterBot, duckDrone, toasterBot, coffeeBot, duckDrone];
  k.at(x - side * 1.2, 1.05, z + 2.45, .4, 1.15); toys[i % 6](k, scene);
  k.at(x - side * .1, 1.05, z + 2.55, -.5, 1.15); toys[(i + 2) % 6](k, scene);
  k.at(x + side * 1.3, .04, z + 1.3, side * .5, 1.1); (i % 2 ? robotArm : selfDrivingChair)(k, scene);
  // Track spots along the top of the back wall, and their light on it.
  for (const dx of [-1.2, 0, 1.2]) { k.at(x + dx, 3.28, z + .3, 0); k.add(new T.CylinderGeometry(.05, .07, .16, 12), mats.black, scene, {p: [0, 0, .08], r: [.9, 0, 0]}); k.add(new T.CircleGeometry(.05, 12), mats.warm, scene, {p: [0, -.052, .145], r: [Math.PI / 2 + .9, 0, 0]}); }
  k.at();
  // Duke, as a cardboard standee by the aisle.
  const duke = tex('duke');
  if (duke) {
    duke.wrapS = duke.wrapT = T.ClampToEdgeWrapping; T2(duke);
    const d = put(new T.PlaneGeometry(1.0, 1.5), new T.MeshStandardMaterial({map: duke, alphaTest: .5, side: T.DoubleSide, roughness: .5}), x + side * 1.55, .79, z + 3.0);
    d.rotation.y = -side * .35;
    put(new T.BoxGeometry(.5, .04, .3), mats.black, x + side * 1.55, .02, z + 3.0);
  }
}

/** One cinema seat: velvet cushion and back, moulded shell and armrests. Faces +z. */
export function seat(x: number, y: number, z: number, velvet: T.BufferGeometry[], shell: T.BufferGeometry[]) {
  const put = (g: T.BufferGeometry, to: T.BufferGeometry[], px: number, py: number, pz: number, rx = 0) => { if (rx) g.rotateX(rx); g.translate(x + px, y + py, z + pz); to.push(g.index ? g.toNonIndexed() : g); };
  put(new RoundedBoxGeometry(.94, .22, .88, 1, .08), velvet, 0, .39, .04);
  put(new RoundedBoxGeometry(.92, 1.0, .2, 1, .08), velvet, 0, .98, -.47, -.13);
  put(new T.BoxGeometry(.8, .3, .7), shell, 0, .15, 0);
  put(new T.BoxGeometry(.98, 1.04, .06), shell, 0, .94, -.6, -.13);
  for (const s of [-1, 1]) { put(new T.BoxGeometry(.1, .07, .78), shell, s * .54, .66, -.02); put(new T.BoxGeometry(.08, .38, .1), shell, s * .54, .46, -.2); }
}
export function seatMeshes(velvet: T.BufferGeometry[], shell: T.BufferGeometry[]) {
  return [[velvet, mats.velvet], [shell, mats.black]].map(([list, m]) => { const q = new T.Mesh(mergeGeometries(list as T.BufferGeometry[], false)!, m as T.Material); q.castShadow = q.receiveShadow = true; return q; });
}
export {hasTex};
