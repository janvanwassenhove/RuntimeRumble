// Six slices of Kinepolis Antwerp, dressed the way Please Do Not Throw Richie dresses the
// whole building (src/venue.ts): the fight happens on the z=0 line, the camera looks in from
// +z, so every arena is built as a stage set — floor, back wall and ceiling, then the venue
// behind the fighters. Each arena keeps the movable cart the physics pushes about, a hazard
// strip that warns before it fires, and a crowd that reacts when it does.
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ARENAS} from './data';
import {Kit, plastic, steel, glow, type V3} from './kit';
import {tex, image} from './textures';
import {mats, flat, slab, panel, textTex, logoTex, lightbox, escalatorSkin, G, toasterBot, duckDrone, coffeeBot, robotArm, selfDrivingChair, popcornMachine, booth, seat, seatMeshes} from './venue';
import {Walker, cheeringCrowd, seatedAudience, peopleMaterial, glossMaterial, screenMaterial} from './people';

/** How the scene is lit here: the hall is bright, the auditorium dark with a lit stage. */
export type Grade = {hemi: number; sun: number; sunColor: number; fog: number; near: number; far: number; env: number};
const BACK = -5.2, W = 64;
const shared = new Set<T.Material>([...Object.values(mats), ...Object.values(G), peopleMaterial, glossMaterial, screenMaterial]);

export class ArenaVisual {
  root = new T.Group();
  /** The movable prop: rendered here, simulated by Rapier in Game, which places it each frame. */
  cart = new T.Group();
  hazardX = 0;
  grade: Grade = {hemi: 1.5, sun: 2.6, sunColor: 0xfff0dc, fog: 0x0b1118, near: 30, far: 100, env: .5};
  /** Lights the arena brings: the keynote's spots and wash. */
  lamps: T.Light[] = [];
  private tmp: T.Texture[] = [];
  private leds: T.Object3D[] = [];
  private plate: T.Mesh | null = null;
  private plateMat = new T.MeshStandardMaterial({color: 0x625238, roughness: .6, metalness: .3});
  private lift: T.Group | null = null;
  private recliner: T.Group | null = null;
  private ring: T.Mesh | null = null;
  private ringMat: T.MeshStandardMaterial | null = null;
  private crowd: ReturnType<typeof cheeringCrowd> | null = null;
  private audience: ReturnType<typeof seatedAudience> | null = null;
  private surge: Walker[] = [];
  private escalators: ReturnType<typeof escalatorSkin> | null = null;
  private spots: T.SpotLight[] = [];
  private last = -1;

  constructor(public index: number) {
    const k = new Kit(), f = new Kit();
    [this.hall, this.stairs, this.corridor, this.auditorium, this.keynote, this.lab][index].call(this, k, f);
    this.buildCart(k);
    k.bake(); f.bake(false);
    this.root.add(this.cart);
  }

  /** The strip a hazard fires on: a plate in the floor, edged with warning LEDs, labelled. */
  private strip(k: Kit, x: number, plate: T.Material | null = this.plateMat, label = true) {
    this.hazardX = x;
    if (plate) { this.plate = new T.Mesh(new RoundedBoxGeometry(3, .1, 3, 2, .04), plate); this.plate.position.set(x, .03, 0); this.plate.receiveShadow = true; this.root.add(this.plate); }
    for (const z of [-1.55, 1.55]) for (let i = 0; i < 10; i++) {
      const b = new T.Mesh(new T.BoxGeometry(.18, .06, .14), mats.orange); b.position.set(x - 1.35 + i * .3, .1, z); this.root.add(b); this.leds.push(b);
    }
    if (label) { const l = lightbox(this.root, this.T(textTex(ARENAS[this.index].hazard, {bg: '#101520', fg: '#ffc46c', h: 100, font: 66})), 3, .3, x, .065, 1.95, 0, false); l.rotation.x = -Math.PI / 2; }
    void k;
  }
  private T<X extends T.Texture>(t: X) { this.tmp.push(t); return t; }
  /** Floor, back wall and ceiling: the box every arena is a slice of. */
  private room(floor: T.Material, wall: T.Material, height: number, depth = 18, wallZ = BACK) {
    slab(this.root, floor, W, .4, depth + 5, 0, -.2, depth / 2 - 5, false);
    panel(this.root, wall, W, height, 0, height / 2, wallZ, 'z+');
    panel(this.root, mats.ceiling, W, depth + 6, 0, height, depth / 2 - 5, 'down');
  }
  private downlights(f: Kit, y: number, m: T.Material, dx = 6, dz = 6, zs = [-3, 3, 9], skip: (x: number, z: number) => boolean = () => false, r = .13) {
    for (let x = -30; x <= 30; x += dx) for (const z of zs) { if (skip(x, z)) continue; f.add(new T.CircleGeometry(r, 12), m, this.root, {p: [x, y - .015, z], r: [Math.PI / 2, 0, 0]}); }
    void dz;
  }

  // ------------------------------------------------------------------ 00 exhibition hall
  private hall(k: Kit, f: Kit) {
    this.grade = {hemi: 1.5, sun: 2.6, sunColor: 0xfff0dc, fog: 0x0b1118, near: 32, far: 110, env: .5};
    this.room(mats.hall, mats.plaster, 7.6);
    // The raised ceiling island with its orange cove, as in the exhibition hall photographs.
    const cove = flat(0x2b2e34, .9);
    f.add(new T.BoxGeometry(14, .25, 13), cove, this.root, {p: [0, 7.5, 1]});
    for (const [w, d, x, z] of [[13.8, .12, 0, -5.4], [13.8, .12, 0, 7.4], [.12, 12.8, -6.9, 1], [.12, 12.8, 6.9, 1]]) f.add(new T.BoxGeometry(w, .06, d), mats.orange, this.root, {p: [x, 7.36, z]});
    this.downlights(f, 7.6, mats.cool, 6, 6, [-3, 3, 9], (x, z) => Math.abs(x) < 7 && z < 7.5);
    for (const [x, z, r] of [[-15, 2, 1.7], [17, 6, 2.1], [-22, 8, 1.5]]) {
      f.add(new T.TorusGeometry(r, .07, 6, 40), mats.black, this.root, {p: [x, 6.32, z], r: [Math.PI / 2, 0, 0]});
      f.add(new T.TorusGeometry(r, .055, 6, 40), mats.cool, this.root, {p: [x, 6.27, z], r: [Math.PI / 2, 0, 0]});
      for (let i = 0; i < 3; i++) { const a = i * 2.1; f.rod(mats.black, this.root, [x + Math.sin(a) * r, 6.3, z + Math.cos(a) * r], [x + Math.sin(a) * r, 7.6, z + Math.cos(a) * r], .008, .008, 6); }
    }
    // Pillars down the back wall, clear of the booths.
    for (const x of [-13.5, -22.5, -31, 13.5, 22.5, 31]) { k.add(new T.BoxGeometry(.8, 7.6, .8), mats.plaster, this.root, {p: [x, 3.8, BACK + .6]}); k.add(new T.BoxGeometry(.84, .12, .84), mats.black, this.root, {p: [x, .06, BACK + .6]}); }
    // The logo over the middle of the hall, and the way to the keynote.
    lightbox(this.root, this.T(logoTex(2048, 420, {fill: .62, accent: true})), 9, 1.85, 0, 5.55, BACK + .06, 0);
    lightbox(this.root, this.T(textTex('KEYNOTE ↑', {accent: '#f0640f', h: 220, font: 110})), 4, .86, 18, 5.8, BACK + .06, 0);
    lightbox(this.root, this.T(textTex('REGISTRATION', {accent: '#f0640f', h: 220, font: 110})), 4.6, 1.0, -18, 5.8, BACK + .06, 0);
    // Six stands, Duke beside every one. Hanging banners either side of the aisle.
    [[0, 1], [-9, 0], [9, 2], [-18, 3], [18, 4], [-27, 5], [27, 1]].forEach(([x, i]) => booth(this.root, k, x, BACK + .2, i, this.tmp));
    const banner = new T.MeshStandardMaterial({map: this.T(logoTex(512, 1280, {vertical: true, fill: .78, accent: true})), roughness: .8});
    for (const x of [-4.5, 4.5, -13.5, 13.5]) for (const yaw of [0, Math.PI]) { const q = new T.Mesh(new T.PlaneGeometry(1.1, 2.75), banner); q.position.set(x, 5.9, -2.2); q.rotation.y = yaw; this.root.add(q); }
    // Rope barriers along the front, delegates who never left, and the flipper in the floor.
    for (const x of [-16, -12, 12, 16]) { k.add(new T.CylinderGeometry(.06, .06, 1.4, 16), mats.chrome, this.root, {p: [x, .7, -1.6]}); k.add(new T.CylinderGeometry(.22, .22, .06, 16), mats.chrome, this.root, {p: [x, .03, -1.6]}); }
    for (const x of [-14, 14]) k.add(new T.BoxGeometry(4, .12, .08), flat(0x7a1414, .7), this.root, {p: [x, .8, -1.6]});
    this.crowd = cheeringCrowd([[-4.6, -3.3], [-4.0, -2.2], [-5.6, -2.5], [4.6, -3.3], [4.2, -2.3], [5.8, -2.6], [-13.6, -2.9], [-14.7, -2.1], [13.4, -3.0], [14.6, -2.2], [-22.6, -2.6], [22.8, -2.8], [-9, -3.4], [9.2, -3.4]].map(([x, z]) => ({x, y: 0, z})), 21);
    this.root.add(this.crowd.group);
    this.strip(k, 0, mats.laminate);
  }

  // ------------------------------------------------------------------ 01 grand staircase
  private stairs(k: Kit, f: Kit) {
    this.grade = {hemi: 1.0, sun: 2.1, sunColor: 0xffcf9c, fog: 0x120c08, near: 30, far: 120, env: .45};
    // A landing with a drop either side: seven terrazzo steps down to the ground floor.
    slab(this.root, mats.stone, 24, .4, 22, 0, -.2, 4, false);
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) slab(this.root, mats.stone, 1.1, .4, 22, s * (12.55 + i * 1.1), -.4 - i * .4, 4);
    for (const s of [-1, 1]) slab(this.root, mats.hall, 20, .4, 22, s * 29, -3.4, 4, false);
    panel(this.root, mats.plasterDark, W, 22, 0, 3, -30, 'z+');
    panel(this.root, mats.ceiling, W, 46, 0, 14, -7, 'down');
    // The grand staircase, rising away from the fight, lit nosings on every step.
    for (let i = 0; i < 24; i++) { const h = (i + 1) * .25; slab(this.root, mats.stone, 14, h, 1, 0, h / 2, -4 - i - .5); f.add(new T.BoxGeometry(13.6, .03, .05), mats.warm, this.root, {p: [0, h + .005, -4 - i - .03]}); }
    slab(this.root, mats.cinema, 30, .4, 6, 0, 5.8, -31);
    for (const s of [-1, 1]) {                                                    // chrome rails between stairs and escalators
      k.rod(mats.chrome, this.root, [s * 6.95, 1.2, -4], [s * 6.95, 7.2, -28], .035, .035, 10);
      for (let i = 0; i <= 24; i += 4) k.rod(mats.chrome, this.root, [s * 6.95, i * .25, -4 - i], [s * 6.95, 1.2 + i * .25, -4 - i], .022, .022, 8);
    }
    // Escalators flank it and run: treads and handrails scroll up the slope.
    const esc = this.escalators = escalatorSkin(24.8), A = Math.atan2(6, 24);
    for (const s of [-1, 1]) {
      const q = new T.Mesh(new T.BoxGeometry(2.6, .3, 24.8), esc.tread); q.position.set(s * 8.4, 3.1, -16); q.rotation.x = A; q.receiveShadow = true; this.root.add(q);
      for (const r of [-1.2, 1.2]) { const h = new T.Mesh(new T.BoxGeometry(.04, 1, 24.8), mats.glass); h.position.set(s * 8.4 + r, 4.0, -16); h.rotation.x = A; this.root.add(h); const hr = new T.Mesh(new T.BoxGeometry(.1, .07, 24.9), esc.rail); hr.position.set(s * 8.4 + r, 4.52, -16); hr.rotation.x = A; this.root.add(hr); }
      for (const [cz, cy] of [[-3.98, .1], [-28.02, 6.1]] as const) k.add(new T.BoxGeometry(2.6, .08, .55), mats.comb, this.root, {p: [s * 8.4, cy + .17, cz]});
      lightbox(this.root, this.T(textTex('ESCALATOR', {h: 220, font: 100, accent: '#f0640f'})), 2.6, .56, s * 8.4, 7.6, -28.5, 0);
    }
    lightbox(this.root, this.T(textTex('GRAND STAIRCASE', {h: 220, font: 100, accent: '#f0640f'})), 7, 1.5, 0, 8.6, -28.5, 0);
    lightbox(this.root, this.T(logoTex(2048, 440, {fill: .66, accent: true})), 11, 2.36, 0, 11.6, -29.9, 0);
    lightbox(this.root, this.T(textTex('↑ AUDITORIUMS 1 – 14', {h: 220, font: 96})), 5, 1.07, -12, 7.6, -29.9, 0);
    for (let z = -26; z <= 10; z += 7) for (const x of [-7, 0, 7, -14, 14, -21, 21]) f.add(new T.CircleGeometry(.16, 12), mats.warm, this.root, {p: [x, 13.985, z], r: [Math.PI / 2, 0, 0]});
    for (const [x, z, r] of [[-17, 3, 2.2], [19, 7, 1.7]]) { f.add(new T.TorusGeometry(r, .07, 6, 40), mats.black, this.root, {p: [x, 12.32, z], r: [Math.PI / 2, 0, 0]}); f.add(new T.TorusGeometry(r, .055, 6, 40), mats.warm, this.root, {p: [x, 12.27, z], r: [Math.PI / 2, 0, 0]}); }
    // The foyer bar on the far side of the drop, popcorn included, and the sponsors' lightboxes.
    k.add(new T.BoxGeometry(4.2, .07, 1.6), mats.brass, this.root, {p: [24, -2.165, -2]}); k.add(new T.BoxGeometry(4, 1.2, 1.4), mats.wood, this.root, {p: [24, -2.8, -2]});
    k.at(22.9, -2.13, -1.95, 0); popcornMachine(k, this.root); k.at();
    [3, 5].forEach((n, j) => { const art = tex(`booth-${n}`); if (!art) return; art.wrapS = art.wrapT = T.ClampToEdgeWrapping; this.T(art); lightbox(this.root, art, 3.6, 2.4, (j ? 1 : -1) * 24, 2.4, -29.8, 0); });
    this.crowd = cheeringCrowd([[-21.5, -3.4, -1.5], [-23, -3.4, -.5], [-25.5, -3.4, 1.2], [21, -3.4, -1], [26.5, -3.4, .2], [19.5, -3.4, 1.4], [-4.5, 0, -3.5], [4.8, 0, -3.5]].map(([x, y, z]) => ({x, y, z})), 31);
    this.root.add(this.crowd.group);
    // The edges are the hazard: a comb plate and warning LEDs mark the top step.
    this.strip(k, 9.5, mats.comb);
    for (const z of [-1.55, 1.55]) for (let i = 0; i < 10; i++) { const b = new T.Mesh(new T.BoxGeometry(.18, .06, .14), mats.orange); b.position.set(-9.5 - 1.35 + i * .3, .1, z); this.root.add(b); this.leds.push(b); }
    k.add(new T.BoxGeometry(3, .1, 3), mats.comb, this.root, {p: [-9.5, .03, 0]});
  }

  // ------------------------------------------------------------------ 02 cinema corridor
  private corridor(k: Kit, f: Kit) {
    this.grade = {hemi: .8, sun: 1.6, sunColor: 0xd4dcff, fog: 0x06080f, near: 24, far: 90, env: .4};
    this.room(mats.cinema, mats.acoustic, 5.7);
    f.add(new T.BoxGeometry(W, .05, .05), mats.blue, this.root, {p: [0, 2.06, BACK + .03]});
    for (const z of [-3, 3]) { f.add(new T.BoxGeometry(62, .08, .3), mats.black, this.root, {p: [0, 5.62, z]}); f.add(new T.BoxGeometry(61.8, .02, .16), mats.cool, this.root, {p: [0, 5.57, z]}); }
    // The auditorium doors, 8 is where the keynote is; sponsor lightboxes between them.
    [[-14, 6], [-7, 7], [0, 8], [7, 9], [14, 10], [-21, 5], [21, 11], [-28, 4], [28, 12]].forEach(([x, n]) => {
      k.add(new T.BoxGeometry(2.4, 2.6, .4), mats.wood, this.root, {p: [x, 1.3, BACK + .2]});
      for (const s of [-1, 1]) k.add(new T.BoxGeometry(.06, .5, .08), mats.chrome, this.root, {p: [x + s * .9, 1.1, BACK + .44]});
      f.add(new T.BoxGeometry(2.4, .06, .06), n === 8 ? mats.orange : mats.red, this.root, {p: [x, 2.72, BACK + .42]});
      lightbox(this.root, this.T(textTex(n === 8 ? 'AUDITORIUM 8 · KEYNOTE' : 'AUDITORIUM ' + n, {h: 220, font: 100})), 2.6, .56, x, 3.1, BACK + .04, 0);
    });
    [1, 2, 4, 6, 3, 5].forEach((n, j) => { const art = tex(`booth-${n}`); if (!art) return; art.wrapS = art.wrapT = T.ClampToEdgeWrapping; this.T(art); lightbox(this.root, art, 3.6, 2.4, [-3.5, 3.5, -10.5, 10.5, -17.5, 17.5][j], 4.3, BACK + .02, 0); });
    // A bin, a fire extinguisher and a session board by the doors.
    for (const x of [-4.2, 10.8]) { k.add(new T.CylinderGeometry(.28, .25, .8, 16), mats.black, this.root, {p: [x, .4, BACK + .5]}); k.add(new T.CylinderGeometry(.3, .3, .05, 16), mats.chrome, this.root, {p: [x, .82, BACK + .5]}); }
    k.add(new T.CylinderGeometry(.09, .09, .55, 12), G.red, this.root, {p: [4.6, .5, BACK + .35]});
    lightbox(this.root, this.T(textTex('NOW: THE ROBOTS', {bg: '#0e1216', fg: '#f6efe2', sub: 'AUDITORIUM 8 · 02:14', h: 300, font: 80})), 1.8, .55, -2.2, 1.9, BACK + .3, 0);
    // Session let-out: the crowd that pours across the corridor when a session ends.
    for (let i = 0; i < 10; i++) {
      const x = -4 + ((i * 7) % 5) - 2 + (i % 2) * .4, w = new Walker(400 + i, [new T.Vector3(x, 0, -4.5 - (i % 3) * .45), new T.Vector3(x + (i % 2 ? .6 : -.6), 0, 15)]);
      w.speed = 5.2 + (i % 4) * .35; w.restart(0); this.root.add(w.group); this.surge.push(w);
    }
    this.crowd = cheeringCrowd([[8, 0, -4.2], [9.4, 0, -3.6], [14.5, 0, -4.2], [-12, 0, -4.0], [-13.6, 0, -3.5], [3.5, 0, -4.3]].map(([x, y, z]) => ({x, y, z})), 51);
    this.root.add(this.crowd.group);
    this.strip(k, -4, null);
  }

  // ------------------------------------------------------------------ 03 auditorium
  private auditorium(k: Kit, f: Kit) {
    this.grade = {hemi: .62, sun: 1.45, sunColor: 0xccd6ff, fog: 0x030408, near: 22, far: 80, env: .35};
    this.room(mats.tiers, mats.acoustic, 9, 18, -10.6);
    // The front row: raked tiers of gently curved velvet seats climbing away from the fight.
    const velvet: T.BufferGeometry[] = [], shell: T.BufferGeometry[] = [], spots: {x: number; y: number; z: number}[] = [];
    for (let i = 0; i < 5; i++) {
      const y = i * .6, z = -2.3 - i * 1.6;
      slab(this.root, mats.tiers, W, y + .02, 1.6, 0, y / 2, z, false);
      for (const s of [-1, 1]) for (let x = 4.25; x <= 5.4; x += .14) f.add(new T.BoxGeometry(.035, .03, .035), mats.red, this.root, {p: [s * x, y + .03, z + .73]});
      for (let c = -22; c <= 22; c++) { const x = c * 1.2; if (Math.abs(c) === 4) continue; const zz = z + x * x * .004; seat(x, y, zz, velvet, shell); spots.push({x, y: y + .5, z: zz - .02}); }
    }
    this.root.add(...seatMeshes(velvet, shell));
    this.audience = seatedAudience(spots, 7 + this.index); this.root.add(this.audience.group);
    for (const s of [-1, 1]) f.add(new T.BoxGeometry(.05, .7, .22), mats.warm, this.root, {p: [s * 31.9, 2.6, -6]});
    this.downlights(f, 9, mats.cool, 6, 8, [-9, -3, 3, 9], () => false, .11);
    lightbox(this.root, this.T(textTex('PLEASE SILENCE YOUR ROBOTS', {h: 220, font: 96, accent: '#f0640f'})), 10, 2.15, 0, 6.2, -10.5, 0);
    lightbox(this.root, this.T(logoTex(2048, 440, {fill: .66, accent: true})), 6, 1.29, -14, 6.2, -10.5, 0);
    lightbox(this.root, this.T(logoTex(2048, 440, {fill: .66, accent: true})), 6, 1.29, 14, 6.2, -10.5, 0);
    // The stage lip in front of the row, and its red aisle lights.
    slab(this.root, mats.stage, W, .12, 8, 0, -.06, 8.5);
    f.add(new T.BoxGeometry(W, .06, .06), mats.orange, this.root, {p: [0, .03, 4.5]});
    // The recliner: Droid's questionable machinery, on the hazard strip.
    this.strip(k, 0, mats.tiers);
    const r = this.recliner = new T.Group(); r.position.set(0, .1, -.9); this.root.add(r);
    const rk = new Kit();
    rk.add(new RoundedBoxGeometry(1.5, .28, 1.1, 2, .08), mats.velvet, r, {p: [0, .3, .1]});
    rk.add(new RoundedBoxGeometry(1.4, 1.1, .26, 2, .08), mats.velvet, r, {p: [0, .85, -.5], r: [-.15, 0, 0]});
    rk.add(new T.BoxGeometry(1.3, .3, 1.0), mats.black, r, {p: [0, .12, .1]});
    for (const s of [-1, 1]) rk.add(new T.BoxGeometry(.14, .1, 1.0), mats.black, r, {p: [s * .8, .6, .05]});
    rk.bake();
    lightbox(r, this.T(textTex('RECLINE', {bg: '#5a1a1a', h: 220, font: 110})), 1.2, .26, 0, 1.1, -.36, 0, false);
    this.crowd = cheeringCrowd([[-4.8, 0, -2.4], [4.8, 0, -2.4], [-4.8, .6, -4.0], [4.8, .6, -4.0], [-11, 0, -1.6], [11.2, 0, -1.6]].map(([x, y, z]) => ({x, y, z})), 61);
    this.root.add(this.crowd.group);
  }

  // ------------------------------------------------------------------ 04 keynote stage
  private keynote(k: Kit, f: Kit) {
    this.grade = {hemi: .5, sun: 1.2, sunColor: 0xccd6ff, fog: 0x030408, near: 26, far: 90, env: .35};
    this.room(mats.stage, mats.acoustic, 16, 18, BACK - .1);
    // The screen: the keynote slide over the generated backdrop, the logo and KEYNOTE set at runtime.
    let backdrop: HTMLImageElement | null = null;
    const slide = this.T(logoTex(1920, 1080, {bg: '#1a0a12', fill: .56, y: .27,
      under: (g, w, h) => { if (backdrop) g.drawImage(backdrop, 0, 0, w, h); else { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f08a1c'); gr.addColorStop(.6, '#a02a4a'); gr.addColorStop(1, '#1a0a12'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } const sh = g.createLinearGradient(0, 0, 0, h * .55); sh.addColorStop(0, 'rgba(10,4,8,.62)'); sh.addColorStop(1, 'rgba(10,4,8,0)'); g.fillStyle = sh; g.fillRect(0, 0, w, h * .55); },
      over: (g, w, h) => { g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${h * .062}px "Helvetica Neue", Arial, sans-serif`; (g as any).letterSpacing = `${h * .045}px`; g.fillText('KEYNOTE', w / 2 + h * .022, h * .435); }}));
    void image('keynote-bg').then(i => { if (i) { backdrop = i; slide.userData.repaint(); } });
    lightbox(this.root, slide, 19.2, 10.8, 0, 5.9, BACK, 0, false); k.add(new T.BoxGeometry(19.8, 11.4, .1), mats.black, this.root, {p: [0, 5.9, BACK - .08]});
    const wash = new T.PointLight(0xff8a4a, 90, 50, 1.8); wash.position.set(0, 7, -3); this.root.add(wash); this.lamps.push(wash);
    // Lighting truss over the stage, par cans lit, and velvet tabs either side of the screen.
    for (const z of [-2.6, -1.8]) for (const y of [12, 12.7]) f.rod(mats.chrome, this.root, [-13.5, y, z], [13.5, y, z], .045, .045, 8);
    for (let x = -13.5; x < 13.5; x += 1) { f.rod(mats.chrome, this.root, [x, 12, -2.6], [x + 1, 12.7, -1.8], .02, .02, 6); f.rod(mats.chrome, this.root, [x + 1, 12, -1.8], [x, 12.7, -2.6], .02, .02, 6); }
    [-12, -9, -6, -3, 0, 3, 6, 9, 12].forEach((x, i) => { f.at(x, 11.6, -2.2, 0); f.add(new T.CylinderGeometry(.2, .16, .42, 16), mats.black, this.root, {p: [0, 0, .1], r: [-.95, 0, 0]}); f.add(new T.CircleGeometry(.17, 16), [mats.warm, mats.orange, mats.cool][i % 3], this.root, {p: [0, -.125, .272], r: [Math.PI / 2 - .95, 0, 0]}); });
    f.at();
    for (const s of [-1, 1]) {
      const g = new T.PlaneGeometry(3.6, 13, 48, 1), pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * .14);
      g.computeVertexNormals();
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 8);
      const q = new T.Mesh(g, mats.velvet); q.position.set(s * 11.6, 6.5, BACK + .3); q.receiveShadow = true; this.root.add(q);
    }
    // The lectern, the floor monitors and the confidence screen, all Devoxx-branded.
    k.add(new T.BoxGeometry(.9, 1.3, .7), mats.wood, this.root, {p: [4.5, .65, -2.6]}); k.add(new T.BoxGeometry(1.0, .05, .8), mats.black, this.root, {p: [4.5, 1.32, -2.6]});
    lightbox(this.root, this.T(logoTex(1024, 300, {fill: .7, accent: true})), .8, .23, 4.5, .9, -2.24, 0, false);
    for (const x of [-6, 6]) { k.add(new T.BoxGeometry(1.2, .5, .7), mats.black, this.root, {p: [x, .25, 2.6], r: [-.5, 0, 0]}); k.add(new T.CircleGeometry(.14, 16), mats.rubber, this.root, {p: [x, .42, 2.95], r: [-.5 + Math.PI / 2, 0, 0]}); }
    f.add(new T.BoxGeometry(W, .06, .06), mats.orange, this.root, {p: [0, .02, 12.4]});
    // Spotlights that sweep the stage, and the stage lift on the strip.
    for (const x of [-8, 8]) { const s = new T.SpotLight(0xffd29b, 80, 40, Math.PI / 5, .7); s.position.set(x, 13, 3); s.target.position.set(0, 1, 0); this.root.add(s, s.target); this.spots.push(s); this.lamps.push(s); }
    this.strip(k, 0, null);
    const lift = this.lift = new T.Group(); lift.position.set(0, -.15, 0); this.root.add(lift);
    const lk = new Kit();
    lk.add(new T.BoxGeometry(3, .2, 3), mats.stage, lift, {p: [0, .1, 0]});
    lk.add(new T.BoxGeometry(3.1, 1.2, 3.1), mats.black, lift, {p: [0, -.6, 0]});
    for (const s of [-1, 1]) { lk.add(new T.BoxGeometry(3.1, .12, .12), mats.comb, lift, {p: [0, .14, s * 1.5]}); lk.add(new T.BoxGeometry(.12, .12, 3.1), mats.comb, lift, {p: [s * 1.5, .14, 0]}); }
    lk.bake();
    this.crowd = cheeringCrowd([[-14.5, 0, 1.5], [-15.5, 0, 2.6], [-13.2, 0, 3.4], [15, 0, 1.2], [16.2, 0, 2.4], [13.6, 0, 3.6]].map(([x, y, z]) => ({x, y, z})), 41);
    this.root.add(this.crowd.group);
  }

  // ------------------------------------------------------------------ 05 robot lab
  private lab(k: Kit, f: Kit) {
    this.grade = {hemi: 1.2, sun: 2.0, sunColor: 0xdfeaff, fog: 0x0a0e14, near: 30, far: 100, env: .55};
    this.room(mats.graphite, mats.plasterDark, 5.5);
    f.add(new T.BoxGeometry(W, .05, .05), mats.blue, this.root, {p: [0, .08, BACK + .03]});
    this.downlights(f, 5.5, mats.cool, 4, 6, [-3, 3, 9], () => false, .11);
    for (const z of [-2.5, 2.5]) { f.add(new T.BoxGeometry(60, .08, .16), mats.black, this.root, {p: [0, 5.44, z]}); f.add(new T.BoxGeometry(59.8, .02, .1), mats.cool, this.root, {p: [0, 5.39, z]}); }
    // Benches along the back wall, the exhibitors' gadgets in pieces on them, a monitor each.
    const bench = (x: number, i: number) => {
      k.add(new T.BoxGeometry(3, .06, 1.0), mats.laminate, this.root, {p: [x, .92, BACK + 1.0]});
      for (const dx of [-1.4, 1.4]) for (const dz of [-.4, .4]) k.add(new T.BoxGeometry(.06, .9, .06), mats.black, this.root, {p: [x + dx, .45, BACK + 1.0 + dz]});
      k.add(new T.BoxGeometry(2.9, .04, .8), mats.black, this.root, {p: [x, .2, BACK + 1.0]});
      k.add(new RoundedBoxGeometry(.9, .5, .7, 2, .04), G.red, this.root, {p: [x - .9, .45, BACK + 1.0]});
      for (let d = 0; d < 3; d++) k.add(new T.BoxGeometry(.8, .02, .02), mats.chrome, this.root, {p: [x - .9, .28 + d * .14, BACK + 1.36]});
      k.at(x + .9, .95, BACK + .9, -.4, 1.1); [toasterBot, duckDrone, coffeeBot, robotArm, toasterBot, duckDrone][i % 6](k, this.root);
      k.at(x - .2, .95, BACK + 1.1, .7, .9); [duckDrone, coffeeBot, toasterBot, coffeeBot, duckDrone, robotArm][i % 6](k, this.root); k.at();
      const text = ['> TEST PASSED', '> ROBOTS: AWAKE', '> SUPERVISION: 0', '> BUILD: GREEN', '> WARRANTY: VOID', '> git blame'][i % 6];
      k.add(new T.BoxGeometry(1.8, 1.0, .06), mats.black, this.root, {p: [x, 1.75, BACK + .55]}); k.add(new T.BoxGeometry(.3, .3, .1), mats.black, this.root, {p: [x, 1.1, BACK + .58]});
      lightbox(this.root, this.T(textTex(text, {bg: '#05100a', fg: '#76e4b7', h: 300, font: 64, mono: true, align: 'left'})), 1.7, .9, x, 1.75, BACK + .59, 0, false);
    };
    [[-9, 0], [-3, 1], [3, 2], [9, 3], [-15, 4], [15, 5], [-21, 1], [21, 3], [-27, 2], [27, 0]].forEach(([x, i]) => bench(x, i));
    // A whiteboard with the logo, cable trays, a charging dock, a parts rack and a server cabinet.
    // The lab's wall display: the logo over a build log nobody has read since the keynote.
    lightbox(this.root, this.T(logoTex(1024, 512, {bg: '#0b1410', fill: .6, y: .32, over: (c, w, h) => { c.fillStyle = '#76e4b7'; c.font = `600 ${h * .07}px "Cascadia Mono", Consolas, monospace`; c.textAlign = 'left'; ['> robots.wake()      ok', '> supervision.start() … not found', '> hazards.arm()       ok  (why)'].forEach((l, i) => c.fillText(l, w * .08, h * (.62 + i * .11))); }})), 3.6, 1.8, 0, 3.6, BACK + .04, 0);
    lightbox(this.root, this.T(textTex('ROBOT LAB · AUTHORISED ROBOTS ONLY', {h: 220, font: 90, accent: '#4a7dff'})), 6, 1.29, -12, 3.9, BACK + .04, 0);
    lightbox(this.root, this.T(textTex('CHARGING · DO NOT UNPLUG', {h: 220, font: 90, accent: '#4a7dff'})), 5, 1.07, 12, 3.9, BACK + .04, 0);
    f.add(new T.BoxGeometry(W, .12, .3), mats.black, this.root, {p: [0, 2.7, BACK + .15]});
    for (const x of [-14, 14]) { k.add(new T.CylinderGeometry(.9, .95, .12, 32), mats.black, this.root, {p: [x, .06, -3.2]}); f.add(new T.TorusGeometry(.75, .03, 8, 48), mats.blue, this.root, {p: [x, .13, -3.2], r: [Math.PI / 2, 0, 0]}); k.add(new T.BoxGeometry(.3, 1.6, .2), mats.black, this.root, {p: [x, .8, -4.2]}); }
    k.add(new T.BoxGeometry(1.0, 2.2, .8), mats.black, this.root, {p: [-19, 1.1, BACK + .6]});
    for (let i = 0; i < 12; i++) f.add(new T.BoxGeometry(.05, .05, .02), i % 3 ? mats.green : mats.orange, this.root, {p: [-19.3 + (i % 4) * .2, .3 + Math.floor(i / 4) * .6, BACK + 1.01]});
    for (let s = 0; s < 4; s++) { k.add(new T.BoxGeometry(2, .04, .6), mats.chrome, this.root, {p: [19, .4 + s * .55, BACK + .6]}); for (let j = 0; j < 4; j++) k.add(j % 2 ? new T.CylinderGeometry(.12, .12, .3, 12) : new T.SphereGeometry(.16, 12, 8), j % 2 ? G.orange : mats.chrome, this.root, {p: [18.3 + j * .48, .6 + s * .55, BACK + .6]}); }
    for (const dx of [-1, 1]) k.add(new T.BoxGeometry(.05, 2.3, .6), mats.chrome, this.root, {p: [19 + dx, 1.15, BACK + .6]});
    k.at(-6, .04, -2.8, .8, 1.2); selfDrivingChair(k, this.root); k.at();
    this.crowd = cheeringCrowd([[-12, 0, -3.2], [12.5, 0, -3.2], [-18.5, 0, -2.6], [18.2, 0, -2.8]].map(([x, y, z]) => ({x, y, z})), 71, ['laptop', 'phone', 'laptop', 'clap']);
    this.root.add(this.crowd.group);
    // The reset pad: a lidar ring in the floor that spins up before it wipes a robot's specials.
    this.strip(k, 0, null);
    k.add(new T.CylinderGeometry(1.5, 1.5, .08, 40), mats.black, this.root, {p: [0, .04, 0]});
    this.ringMat = glow(0x39d0ff, 2.5);
    this.ring = new T.Mesh(new T.TorusGeometry(1.2, .05, 8, 64), this.ringMat); this.ring.rotation.x = Math.PI / 2; this.ring.position.y = .1; this.root.add(this.ring);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const m = new T.Mesh(new T.BoxGeometry(.3, .04, .04), this.ringMat); m.position.set(Math.cos(a) * 1.2, .1, Math.sin(a) * 1.2); m.rotation.y = -a; this.ring.attach(m); }
  }

  // ------------------------------------------------------------------ the cart
  // Rendered here, simulated by Rapier in Game: a trolley of some sort in every arena.
  private buildCart(k: Kit) {
    const c = this.cart, i = this.index;
    for (const x of [-.46, .46]) { k.rod(mats.chrome, c, [x, .1, -.3], [x, .95, -.3], .02); k.rod(mats.chrome, c, [x, .1, .3], [x, .95, .3], .02); for (const z of [-.3, .3]) { k.ball(mats.rubber, c, [x, .1, z], .1); k.add(new T.CylinderGeometry(.03, .03, .08, 8), mats.chrome, c, {p: [x, .2, z]}); } }
    for (const y of [.42, .95]) k.add(new T.BoxGeometry(1.1, .04, .8), i === 3 || i === 4 ? mats.black : mats.laminate, c, {p: [0, y, 0]});
    if (i === 0) {                                                           // catering: cups, a thermos, croissants
      for (let n = 0; n < 6; n++) k.add(new T.CylinderGeometry(.045, .035, .12, 14), G.white, c, {p: [-.35 + (n % 3) * .16, 1.03, -.2 + Math.floor(n / 3) * .2]});
      k.add(new T.CylinderGeometry(.11, .11, .4, 18), mats.chrome, c, {p: [.3, 1.17, -.15]}); k.add(new T.CylinderGeometry(.04, .04, .05, 10), mats.black, c, {p: [.3, 1.39, -.15]});
      for (let n = 0; n < 4; n++) k.add(new T.TorusGeometry(.06, .025, 8, 14, Math.PI), G.toast, c, {p: [.1 + n * .1, 1.0, .25], r: [Math.PI / 2, 0, n * .6]});
    } else if (i === 1) {                                                    // delegates' swag: boxes of the sponsors' nonsense
      for (const [x, y, z, w, col] of [[-.25, 1.13, 0, .5, G.orange], [.3, 1.1, -.1, .4, G.yellow], [.05, 1.5, 0, .45, G.red]] as const) k.add(new RoundedBoxGeometry(w, .32, .5, 2, .02), col, c, {p: [x, y, z]});
      k.at(.3, 1.28, .2, .5, .8); duckDrone(k, c); k.at();
    } else if (i === 2) {                                                    // cleaning: a bucket, a mop and the sprays
      k.add(new T.CylinderGeometry(.22, .18, .34, 18, 1, true), G.yellow, c, {p: [-.2, 1.14, 0]}); k.add(new T.CylinderGeometry(.2, .2, .02, 18), flat(0x5a6a7a, .3), c, {p: [-.2, 1.25, 0]});
      k.rod(mats.chrome, c, [.25, .5, -.2], [.4, 2.1, -.25], .015); k.add(new RoundedBoxGeometry(.14, .22, .14, 2, .04), flat(0xd8d3c4, .95), c, {p: [.25, .5, -.2]});
      for (const x of [.15, .32]) { k.add(new T.CylinderGeometry(.04, .045, .2, 10), G.white, c, {p: [x, 1.07, .25]}); k.add(new T.CylinderGeometry(.015, .02, .06, 8), G.red, c, {p: [x, 1.2, .25]}); }
    } else if (i === 3) {                                                    // AV: a flight case, the projector, the cables
      k.add(new RoundedBoxGeometry(.9, .3, .6, 2, .03), mats.black, c, {p: [0, 1.12, 0]}); for (const x of [-.44, .44]) k.add(new T.BoxGeometry(.03, .3, .6), mats.chrome, c, {p: [x, 1.12, 0]});
      k.add(new RoundedBoxGeometry(.5, .16, .4, 2, .03), flat(0xd8d3c4, .5), c, {p: [0, 1.35, 0]}); k.add(new T.CylinderGeometry(.06, .06, .05, 14), mats.glass, c, {p: [0, 1.35, .22], r: [Math.PI / 2, 0, 0]}); k.ball(mats.cool, c, [0, 1.35, .2], .035);
      k.add(new T.TorusGeometry(.18, .02, 8, 24), mats.rubber, c, {p: [-.25, .46, .1], r: [Math.PI / 2, 0, 0]});
    } else if (i === 4) {                                                    // the moving screen: LIVE DEMO
      k.add(new T.BoxGeometry(1.5, 1.1, .15), flat(0x111822, .5, .3), c, {p: [0, 1.55, 0]});
      lightbox(c, this.T(textTex('LIVE DEMO', {bg: '#0e1216', fg: '#fc7948', sub: 'NOTHING CAN GO WRONG', h: 512, font: 150})), 1.4, .7, 0, 1.6, .09, 0, false);
    } else {                                                                 // parts: a tool chest with an arm on top
      k.add(new RoundedBoxGeometry(1.0, .5, .7, 2, .04), G.red, c, {p: [0, 1.22, 0]}); for (let d = 0; d < 3; d++) k.add(new T.BoxGeometry(.85, .02, .02), mats.chrome, c, {p: [0, 1.05 + d * .14, .36]});
      k.at(-.1, 1.47, 0, .6, .55); robotArm(k, c); k.at();
    }
  }

  update(time: number, state: string) {
    const dt = this.last < 0 ? 0 : Math.min(.1, time - this.last); this.last = time;
    const warning = state === 'warning' || state === 'armed', active = state === 'active';
    this.leds.forEach(l => (l.visible = active || (warning && Math.sin(time * 16) > 0)));
    this.plateMat.color.set(active ? '#ff5522' : warning ? '#ffc75e' : '#625238');
    if (this.plate) { this.plate.rotation.z = this.index === 0 && active ? -.4 : 0; this.plate.position.y = this.index === 0 && active ? .5 : .03; }
    if (this.lift) this.lift.position.y += ((active ? .75 : -.15) - this.lift.position.y) * .18;
    if (this.recliner) this.recliner.rotation.x += ((active ? -1.1 : warning ? -.15 : 0) - this.recliner.rotation.x) * .2;
    if (this.ring && this.ringMat) { this.ring.rotation.z += dt * (active ? 9 : warning ? 4 : .8); this.ringMat.emissiveIntensity = active ? 6 : warning ? 3 + Math.sin(time * 16) * 2 : 1.6 + Math.sin(time * 2) * .5; }
    this.escalators?.tick(-dt);
    this.crowd?.update(time, active ? 1 : warning ? .3 : 0);
    this.audience?.update(time, active ? 1 : warning ? .3 : 0);
    // The corridor's let-out: they cross the strip, disappear behind the camera and queue up again.
    for (const w of this.surge) {
      const z = w.group.position.z;
      if (warning || active || z > -4.4) w.update(dt, time);
      if (z > 14 || (state === 'idle' && z > -4.3 && z < -4.2)) w.restart(0);
    }
    this.spots.forEach((s, i) => { s.target.position.x = Math.sin(time * .9 + i * Math.PI) * 6; s.target.position.z = Math.cos(time * .7 + i) * 2; s.intensity = active ? 140 : 80; if (active) s.color.setHSL((time * .3 + i * .5) % 1, .7, .6); else s.color.set(0xffd29b); });
  }

  dispose() {
    this.root.removeFromParent();
    const own = new Set<T.Material>();
    this.root.traverse(o => {
      const m = o as T.Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      for (const x of Array.isArray(m.material) ? m.material : [m.material]) if (!shared.has(x) && !x.userData.shared) own.add(x);
    });
    own.forEach(m => m.dispose());
    this.tmp.forEach(t => t.dispose());
    this.escalators?.dispose();
    this.lamps.forEach(l => l.dispose());
  }
}
export {plastic, steel, type V3};
