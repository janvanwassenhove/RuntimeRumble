// A small modelling kit shared by the robots and the venue: primitives are baked into
// their parent's space and merged per parent and material, so a model made of a few
// hundred parts draws in a handful of calls and only the joints that move stay separate.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {tex} from './textures';

export type V3 = [number, number, number];
export type Place = {p?: V3; r?: V3; q?: T.Quaternion; s?: number | V3};
const M = new T.Matrix4(), P = new T.Vector3(), Q = new T.Quaternion(), E = new T.Euler(), S = new T.Vector3();
export const UP = new T.Vector3(0, 1, 0);

// A robot is a few hundred primitives. The kit bakes every primitive into its parent's
// space and merges them per parent and material, so a whole robot draws in a few dozen
// calls and only the joints that move are separate objects.
export class Kit {
  private jobs = new Map<T.Object3D, Map<T.Material, T.BufferGeometry[]>>();
  private base = new T.Matrix4();
  /** Stamp what follows at a position, yaw and scale in the parent's space (props on a counter). */
  at(x = 0, y = 0, z = 0, yaw = 0, s = 1) { this.base.compose(new T.Vector3(x, y, z), new T.Quaternion().setFromAxisAngle(UP, yaw), new T.Vector3(s, s, s)); return this; }
  add(geo: T.BufferGeometry, mat: T.Material, parent: T.Object3D, at: Place = {}) {
    const s = at.s ?? 1;
    P.set(...(at.p ?? [0, 0, 0]));
    if (at.q) Q.copy(at.q); else Q.setFromEuler(E.set(...(at.r ?? [0, 0, 0])));
    if (Array.isArray(s)) S.set(...s); else S.setScalar(s);
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.applyMatrix4(M.compose(P, Q, S).premultiply(this.base));
    let byMat = this.jobs.get(parent);
    if (!byMat) this.jobs.set(parent, byMat = new Map());
    const list = byMat.get(mat);
    if (list) list.push(g); else byMat.set(mat, [g]);
  }
  /** A tapered rod from a to b, radius ra at a and rb at b. */
  rod(mat: T.Material, parent: T.Object3D, a: V3, b: V3, ra: number, rb = ra, seg = 10) {
    const A = new T.Vector3(...a), d = new T.Vector3(...b).sub(A), len = d.length();
    const q = new T.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
    this.add(new T.CylinderGeometry(rb, ra, len, seg), mat, parent, {p: A.addScaledVector(d, .5).toArray() as V3, q});
  }
  ball(mat: T.Material, parent: T.Object3D, p: V3, r: number, s: number | V3 = 1) {
    this.add(new T.SphereGeometry(r, 12, 8), mat, parent, {p, s});
  }
  bake(shadows = true) {
    for (const [parent, byMat] of this.jobs) for (const [mat, list] of byMat) {
      const m = new T.Mesh(mergeGeometries(list, false)!, mat);
      m.castShadow = shadows; m.receiveShadow = true;
      parent.add(m);
    }
    this.jobs.clear();
  }
}

export const pivot = (parent: T.Object3D, x: number, y: number, z: number) => {
  const g = new T.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
};

export function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, srgb = true) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!, w, h);
  const t = new T.CanvasTexture(cv);
  t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

/** A panel gap: a dark groove with a lit lower lip, so seams read as depth, not ink. */
export function seam(c: CanvasRenderingContext2D, path: () => void, dark = 'rgba(40,14,0,.7)', lit = 'rgba(255,214,170,.35)', w = 3) {
  c.save(); c.translate(0, 2); c.strokeStyle = lit; c.lineWidth = w * .7; c.beginPath(); path(); c.stroke(); c.restore();
  c.strokeStyle = dark; c.lineWidth = w; c.beginPath(); path(); c.stroke();
}

/** Lathe profile through the given points, resampled by arc length so v maps evenly. */
export function profile(pts: [number, number][], n = 48) {
  return new T.SplineCurve(pts.map(([x, y]) => new T.Vector2(x, y))).getSpacedPoints(n).map(p => (p.x = Math.max(0, p.x), p));
}
/** The v coordinate of the profile point nearest height y. */
export const vAt = (pts: T.Vector2[], y: number) => pts.reduce((best, p, i) => Math.abs(p.y - y) < Math.abs(pts[best].y - y) ? i : best, 0) / (pts.length - 1);

/** Clear-coated moulded plastic: the environment map does the rest. Nothing here goes
 *  below roughness .1: a mirror-sharp highlight overflows the half-float bloom buffer. */
export const plastic = (color: T.ColorRepresentation, map: T.Texture | null = null, rough = .24) =>
  new T.MeshPhysicalMaterial({color, map, roughness: rough, metalness: 0, clearcoat: 1, clearcoatRoughness: .1, envMapIntensity: 1.25});

/** Weathered plate: a generated paint-and-scratches map, doubling as the bump map. */
export function plate(name: string, fallback: number, o: {tint?: number; rough?: number; metal?: number; repeat?: number; bump?: number} = {}) {
  const r = o.repeat ?? 1, map = tex(name, r, r);
  const m = new T.MeshStandardMaterial({color: map ? (o.tint ?? 0xffffff) : fallback, map, roughness: o.rough ?? .6, metalness: o.metal ?? .45, envMapIntensity: 1.1});
  if (map) { m.bumpMap = tex(name, r, r, false); m.bumpScale = o.bump ?? 1.2; }
  return m;
}
export const steel = (color: number, rough = .35, metal = .85) => new T.MeshStandardMaterial({color, roughness: rough, metalness: metal, envMapIntensity: 1.2});
export const glow = (color: number, intensity = 2) => new T.MeshStandardMaterial({color: 0x120a04, emissive: color, emissiveIntensity: intensity, roughness: .3});
