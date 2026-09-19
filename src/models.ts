import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { FighterDef } from "./data";
export const mat = (color: string | number, metal = 0.45, rough = 0.4) =>
  new T.MeshStandardMaterial({ color, metalness: metal, roughness: rough });
const dark = mat("#20262d", 0.8),
  white = mat("#e2e3de", 0.2),
  chrome = mat("#7d8c95", 0.85, 0.25);
const glow = (c: string) =>
  new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2 });
export function mesh(
  g: T.BufferGeometry,
  m: T.Material,
  p: T.Object3D,
  x = 0,
  y = 0,
  z = 0,
) {
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  p.add(o);
  return o;
}
export function box(
  p: T.Object3D,
  w: number,
  h: number,
  d: number,
  m: T.Material,
  x = 0,
  y = 0,
  z = 0,
  r = 0.08,
) {
  return mesh(new RoundedBoxGeometry(w, h, d, 2, r), m, p, x, y, z);
}
export function ball(
  p: T.Object3D,
  r: number,
  m: T.Material,
  x = 0,
  y = 0,
  z = 0,
  s = [1, 1, 1],
) {
  const o = mesh(new T.SphereGeometry(r, 24, 16), m, p, x, y, z);
  o.scale.set(...(s as [number, number, number]));
  return o;
}
export function cyl(
  p: T.Object3D,
  r: number,
  h: number,
  m: T.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  return mesh(new T.CylinderGeometry(r, r, h, 16), m, p, x, y, z);
}
export interface Robot {
  root: T.Group;
  body: T.Group;
  head: T.Group;
  arms: T.Group[];
  legs: T.Group[];
  eyes: T.Mesh[];
  rollers: T.Group;
}
export function robot(def: FighterDef): Robot {
  const root = new T.Group(),
    body = new T.Group(),
    head = new T.Group(),
    rollers = new T.Group();
  root.add(body);
  body.add(head, rollers);
  const arms: T.Group[] = [],
    legs: T.Group[] = [],
    eyes: T.Mesh[] = [];
  const color = mat(def.color, 0.45, 0.33),
    black = mat("#0b1118", 0.6, 0.18);
  const limb = (
    x: number,
    y: number,
    len: number,
    thick: number,
    isArm: boolean,
    m: T.Material,
  ) => {
    const g = new T.Group();
    g.position.set(x, y, 0);
    body.add(g);
    ball(g, thick * 1.15, chrome);
    cyl(g, thick * 0.52, len * 0.8, dark, 0, -len * 0.45);
    box(g, thick * 1.6, len * 0.45, thick * 1.8, m, 0, -len * 0.35);
    ball(g, thick, chrome, 0, -len * 0.6);
    box(g, thick * 1.7, len * 0.38, thick * 1.8, m, 0, -len * 0.83);
    if (isArm) {
      ball(g, thick * 1.25, m, 0, -len);
      for (let j = 0; j < 3; j++)
        cyl(
          g,
          thick * 0.2,
          thick * 1.4,
          dark,
          (j - 1) * thick * 0.65,
          -len - thick * 0.8,
          0.08,
        );
    } else box(g, thick * 2.3, thick * 0.8, thick * 3.5, dark, 0, -len, 0.13);
    (isArm ? arms : legs).push(g);
    return g;
  };
  if (def.id === "voxxy") {
    ball(body, 0.53, color, 0, 1.05, 0, [0.82, 1.25, 0.72]);
    box(body, 0.56, 0.64, 0.13, color, 0, 1.04, 0.4, 0.12);
    cyl(body, 0.13, 0.25, dark, 0, 1.63);
    head.position.y = 1.95;
    ball(head, 0.64, color, 0, 0, 0, [1.15, 0.78, 0.82]);
    ball(head, 0.49, black, 0, 0.015, 0.32, [1.24, 0.75, 0.47]);
    for (const s of [-1, 1]) {
      ball(head, 0.14, color, s * 0.43, 0.43, 0);
      const ear = cyl(head, 0.22, 0.12, white, s * 0.68, 0);
      ear.rotation.z = Math.PI / 2;
      ball(head, 0.09, glow("#ffab48"), s * 0.23, 0, 0.55, [1, 0.55, 0.5]);
      limb(s * 0.43, 1.45, 1.1, 0.14, true, color);
      limb(s * 0.22, 0.48, 0.34, 0.1, false, color);
    }
    box(body, 0.18, 0.15, 0.025, white, 0, 1.35, 0.39);
  } else if (def.id === "droid") {
    box(body, 0.77, 0.77, 0.48, mat("#4e5b66"), 0, 1.99, 0, 0.16);
    cyl(body, 0.17, 0.32, dark, 0, 1.48);
    ball(body, 0.3, chrome, 0, 1.24, 0, [1, 0.65, 0.7]);
    for (const s of [-1, 1]) {
      limb(s * 0.52, 2.3, 1.32, 0.14, true, mat("#4e5b66"));
      limb(s * 0.24, 1.2, 1.12, 0.13, false, mat("#4e5b66"));
      cyl(body, 0.06, 0.57, chrome, s * 0.19, 1.62, 0.17);
    }
    head.position.y = 2.8;
    ball(head, 0.32, mat("#4e5b66"), 0, 0, 0, [0.95, 1.12, 0.9]);
    box(head, 0.4, 0.18, 0.18, dark, 0, -0.19, 0.14);
    for (const s of [-1, 1])
      eyes.push(ball(head, 0.055, glow("#ffdda0"), s * 0.14, 0, 0.285));
    for (let i = 0; i < 4; i++)
      box(body, 0.17, 0.035, 0.02, chrome, 0.16, 2.15 - i * 0.08, 0.25);
  } else if (def.id === "biggy") {
    const armor = mat("#4b616e", 0.8, 0.57),
      belly = mat("#b9693a", 0.68, 0.6);
    ball(body, 1.19, armor, 0, 1.59, 0, [1, 1.05, 0.88]);
    ball(body, 0.95, belly, 0, 1.49, 0.57, [1, 1, 0.55]);
    head.position.y = 2.73;
    ball(head, 0.86, armor, 0, 0, -0.02, [1, 0.5, 0.9]);
    box(head, 1.38, 0.13, 0.3, dark, 0, -0.17, 0.64, 0.03);
    for (const s of [-1, 1]) {
      ball(head, 0.095, chrome, s * 0.36, 0.12, 0.69);
      ball(head, 0.036, black, s * 0.36, 0.12, 0.77);
      limb(s * 1.03, 2.05, 1.37, 0.23, true, armor);
      limb(s * 0.52, 0.51, 0.37, 0.22, false, armor);
    }
    cyl(head, 0.018, 0.7, chrome, 0.6, 0.55, 0);
    ball(head, 0.045, glow("#fd9f47"), 0.6, 0.92, 0);
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ball(
        body,
        0.042,
        chrome,
        Math.cos(a) * 0.95,
        1.5 + Math.sin(a) * 0.94,
        0.86,
      );
    }
    box(body, 0.035, 1.55, 0.03, armor, 0, 1.5, 1.08, 0.01);
  } else if (def.id === "richie") {
    cyl(body, 0.43, 0.33, white, 0, 0.18);
    ball(body, 0.43, white, 0, 0.33, 0, [1, 0.6, 1]);
    cyl(body, 0.15, 0.22, dark, 0, 0.56);
    head.position.y = 0.88;
    ball(head, 0.48, white, 0, 0, 0, [1.2, 0.72, 0.87]);
    for (const s of [-1, 1]) {
      ball(head, 0.187, dark, s * 0.245, 0.035, 0.32, [1, 1, 0.55]);
      ball(head, 0.135, chrome, s * 0.245, 0.035, 0.395, [1, 1, 0.25]);
      ball(head, 0.1, black, s * 0.245, 0.035, 0.423, [1, 1, 0.25]);
      ball(head, 0.026, white, s * 0.22, 0.069, 0.45);
      const ant = cyl(head, 0.024, 0.35, white, s * 0.39, 0.38, -0.08);
      ant.rotation.z = -s * 0.24;
      ball(head, 0.065, color, s * 0.43, 0.55, -0.08);
    }
  } else {
    const pink = mat("#ed7735", 0.4, 0.4);
    box(body, 0.47, 0.37, 0.36, white, 0, 0.55, 0, 0.1);
    cyl(body, 0.095, 0.21, dark, 0, 0.81);
    head.position.y = 1.04;
    box(head, 0.59, 0.34, 0.43, white, 0, 0, 0.02, 0.09);
    box(head, 0.48, 0.065, 0.35, pink, 0, -0.12, 0.34, 0.02);
    ball(head, 0.145, dark, 0, 0.005, 0.24, [1, 1, 0.3]);
    ball(head, 0.09, pink, 0, 0.005, 0.283, [1, 1, 0.25]);
    ball(head, 0.055, black, 0, 0.005, 0.305, [1, 1, 0.2]);
    for (const s of [-1, 1]) {
      ball(head, 0.025, black, s * 0.21, 0.015, 0.24);
      limb(s * 0.24, 0.53, 0.39, 0.07, false, white);
      const wheel = cyl(
        rollers,
        0.08,
        0.11,
        mat("#e8bd45"),
        s * 0.25,
        0.09,
        0.13,
      );
      wheel.rotation.z = Math.PI / 2;
    }
    rollers.visible = false;
  }
  root.userData.id = def.id;
  return { root, body, head, arms, legs, eyes, rollers };
}
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
}
export function animateRobot(r: Robot, p: Pose) {
  const id = r.root.userData.id,
    walk =
      Math.sin(p.time * (id === "biggy" ? 8 : 15)) *
      Math.min(Math.abs(p.speed) / 5, 1),
    hit = Math.sin(Math.min(1, p.attackProgress) * Math.PI);
  r.root.rotation.y = T.MathUtils.lerp(
    r.root.rotation.y,
    p.face > 0 ? 0.67 : -0.67,
    0.18,
  );
  r.body.position.y = p.dead ? 0.12 : Math.sin(p.time * 2.7) * 0.018;
  r.body.rotation.z = T.MathUtils.lerp(
    r.body.rotation.z,
    p.dead
      ? -p.face * 1.35
      : p.hurt > 0
        ? -p.face * 0.24
        : id === "richie" && p.air
          ? -p.face * 0.3
          : walk * 0.035,
    0.16,
  );
  r.body.scale.y = T.MathUtils.lerp(
    r.body.scale.y,
    p.crouch ? (id === "richie" ? 0.35 : 0.7) : 1,
    0.25,
  );
  r.head.rotation.z =
    id === "richie"
      ? Math.sin(p.time * 3) * 0.09
      : Math.sin(p.time * 1.4) * 0.025;
  r.head.rotation.x = p.attack && id === "richie" ? hit * 0.8 : 0;
  r.arms.forEach((a, i) => {
    a.rotation.x = walk * (i === 0 ? 1 : -1) * 0.5;
    a.rotation.z = (i === 0 ? 1 : -1) * 0.12;
    if (p.block) a.rotation.x = -1.15;
    if (p.attack) {
      a.rotation.x = -hit * (p.attack === "heavy" ? 2.5 : 1.7);
      a.rotation.z = (i === 0 ? 1 : -1) * hit * 0.5;
    }
  });
  r.legs.forEach((l, i) => {
    l.rotation.x = walk * (i === 0 ? 1 : -1) * 0.65;
    if (p.attack && (p.attack === "low" || id === "microduck") && i === 0)
      l.rotation.x = -hit * 1.7;
  });
  r.rollers.visible = id === "microduck" && (p.roller || p.overclock);
  if (
    id === "microduck" &&
    Math.abs(p.speed) < 0.1 &&
    !p.attack &&
    !p.dead &&
    Math.sin(p.time * 0.12) > 0.98
  )
    r.head.rotation.x = 0.4;
}
