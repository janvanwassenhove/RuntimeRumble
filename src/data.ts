export type FighterId = "voxxy" | "droid" | "biggy" | "richie" | "microduck";
export type Mode = "arcade" | "versus" | "chaos" | "training" | "attract";
export type Action =
  | "light"
  | "heavy"
  | "low"
  | "grab"
  | "special"
  | "secondary";
export interface FighterDef {
  id: FighterId;
  name: string;
  tag: string;
  quote: string;
  color: string;
  mass: number;
  speed: number;
  accel: number;
  friction: number;
  height: number;
  width: number;
  reach: number;
  power: number;
  jump: number;
  recovery: number;
  special: string;
  secondary: string;
  overclock: string;
  stats: number[];
}
export const FIGHTERS: FighterDef[] = [
  {
    id: "voxxy",
    name: "VOXXY",
    tag: "THE FRIENDLY YEETER",
    quote: "A helping hand. At escape velocity.",
    color: "#fa763a",
    mass: 1.2,
    speed: 7.7,
    accel: 33,
    friction: 10,
    height: 2.25,
    width: 0.7,
    reach: 1.45,
    power: 1,
    jump: 8,
    recovery: 1,
    special: "YEET()",
    secondary: "SLINGSHOT",
    overclock: "MULTITHREADING",
    stats: [5, 3, 2, 3],
  },
  {
    id: "droid",
    name: "DROID",
    tag: "ROOT ACCESS GRANTED",
    quote: "Your warranty expired mid-fight.",
    color: "#a3cbd0",
    mass: 1.8,
    speed: 5.4,
    accel: 22,
    friction: 9,
    height: 3.05,
    width: 0.65,
    reach: 2.15,
    power: 1.12,
    jump: 7,
    recovery: 0.85,
    special: "SYSTEM OVERRIDE",
    secondary: "EXTENSION ERROR",
    overclock: "ROOT ACCESS",
    stats: [3, 3, 3, 5],
  },
  {
    id: "biggy",
    name: "BIGGY",
    tag: "THE ABSOLUTE UNIT",
    quote: "The stopping distance is a suggestion.",
    color: "#c99456",
    mass: 4.6,
    speed: 4.8,
    accel: 9,
    friction: 2.8,
    height: 3.15,
    width: 1.15,
    reach: 1.15,
    power: 1.65,
    jump: 5.8,
    recovery: 0.64,
    special: "FULL SEND",
    secondary: "ABSOLUTE UNIT",
    overclock: "NO BRAKES",
    stats: [1, 5, 5, 2],
  },
  {
    id: "richie",
    name: "RICHIE MINI",
    tag: "NO LIMBS. NO PROBLEM.",
    quote: "This was not in the product demo.",
    color: "#ede5ce",
    mass: 0.8,
    speed: 6,
    accel: 24,
    friction: 5,
    height: 1.25,
    width: 0.57,
    reach: 0.85,
    power: 0.85,
    jump: 8.8,
    recovery: 1.3,
    special: "UNEXPECTED TRAJECTORY",
    secondary: "TANTRUM.EXE",
    overclock: "BAD IDEA",
    stats: [3, 2, 2, 1],
  },
  {
    id: "microduck",
    name: "MICRODUCK",
    tag: "800 GRAMS OF CONFIDENCE",
    quote: "Small footprint. Large incident report.",
    color: "#c2ed72",
    mass: 0.48,
    speed: 9,
    accel: 39,
    friction: 12,
    height: 1.2,
    width: 0.43,
    reach: 0.95,
    power: 0.75,
    jump: 8.2,
    recovery: 1.7,
    special: "ROLLER MODE",
    secondary: "KICKSTART",
    overclock: "TURBO DUCK",
    stats: [5, 2, 1, 2],
  },
];
export const fighter = (id: FighterId) => FIGHTERS.find((f) => f.id === id)!;
export interface ArenaDef {
  id: string;
  name: string;
  label: string;
  hazard: string;
  minor: string;
  color: string;
  description: string;
}
export const ARENAS: ArenaDef[] = [
  {
    id: "hall",
    name: "EXHIBITION HALL",
    label: "00 / GROUND FLOOR",
    hazard: "BOOTH FLIPPER",
    minor: "CATERING CART",
    color: "#f26d3a",
    description: "The booths are closed. The floor has other plans.",
  },
  {
    id: "stairs",
    name: "GRAND STAIRCASE",
    label: "01 / THE LANDING",
    hazard: "STAIRCASE",
    minor: "PASSING DELEGATES",
    color: "#58bcd0",
    description: "Gravity is the only conference sponsor that never leaves.",
  },
  {
    id: "corridor",
    name: "CINEMA CORRIDOR",
    label: "02 / SESSION EXIT",
    hazard: "SESSION ENDED",
    minor: "CLEANING TROLLEY",
    color: "#e46599",
    description: "The session is over. The crowd is not waiting.",
  },
  {
    id: "auditorium",
    name: "AUDITORIUM",
    label: "03 / FRONT ROW",
    hazard: "RECLINER LAUNCH",
    minor: "AV TROLLEY",
    color: "#8e86f5",
    description: "Please take your seat. It will take it from there.",
  },
  {
    id: "keynote",
    name: "KEYNOTE STAGE",
    label: "04 / THE FINAL BUILD",
    hazard: "STAGE LIFT",
    minor: "MOVING SCREEN",
    color: "#ffba56",
    description: "One last demo. What could possibly go wrong?",
  },
  {
    id: "lab",
    name: "ROBOT LAB",
    label: "05 / AFTER HOURS",
    hazard: "FACTORY RESET",
    minor: "PARTS CART",
    color: "#65e9b6",
    description: "Experimental equipment. Extremely experimental decisions.",
  },
];
export interface AttackDef {
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  impulse: number;
  range: number;
  lift: number;
  hitStop: number;
}
export const ATTACKS: Record<Action, AttackDef> = {
  light: {
    startup: 0.09,
    active: 0.12,
    recovery: 0.2,
    damage: 5,
    impulse: 4,
    range: 1,
    lift: 0.4,
    hitStop: 0.035,
  },
  heavy: {
    startup: 0.28,
    active: 0.18,
    recovery: 0.44,
    damage: 11,
    impulse: 11,
    range: 1.18,
    lift: 2.8,
    hitStop: 0.075,
  },
  low: {
    startup: 0.16,
    active: 0.15,
    recovery: 0.3,
    damage: 6,
    impulse: 6,
    range: 1.2,
    lift: 1,
    hitStop: 0.04,
  },
  grab: {
    startup: 0.2,
    active: 0.12,
    recovery: 0.55,
    damage: 9,
    impulse: 14,
    range: 0.95,
    lift: 6,
    hitStop: 0.06,
  },
  special: {
    startup: 0.18,
    active: 0.28,
    recovery: 0.55,
    damage: 12,
    impulse: 15,
    range: 1.25,
    lift: 4,
    hitStop: 0.08,
  },
  secondary: {
    startup: 0.24,
    active: 0.23,
    recovery: 0.6,
    damage: 10,
    impulse: 12,
    range: 1.5,
    lift: 2,
    hitStop: 0.065,
  },
};
export interface Controls {
  move: number;
  jump: boolean;
  crouch: boolean;
  block: boolean;
  light: boolean;
  heavy: boolean;
  grab: boolean;
  special: boolean;
  secondary: boolean;
  overclock: boolean;
}
export const neutral = (): Controls => ({
  move: 0,
  jump: false,
  crouch: false,
  block: false,
  light: false,
  heavy: false,
  grab: false,
  special: false,
  secondary: false,
  overclock: false,
});
export const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));
export function knockback(
  impulse: number,
  power: number,
  mass: number,
  brace = false,
) {
  return ((impulse * power) / Math.sqrt(mass)) * (brace ? 0.25 : 1);
}
export type HazardState = "idle" | "warning" | "armed" | "active" | "cooldown";
export function hazardPhase(t: number, fast = false): HazardState {
  const c = t % (fast ? 7 : 12);
  return c < (fast ? 2 : 6)
    ? "idle"
    : c < (fast ? 3.5 : 7.5)
      ? "warning"
      : c < (fast ? 4 : 8)
        ? "armed"
        : c < (fast ? 5 : 9)
          ? "active"
          : "cooldown";
}
export function matchup(a: FighterId, b: FighterId) {
  const ids = [a, b];
  if (ids.includes("richie") && ids.includes("microduck"))
    return "POLLEN FAMILY DISPUTE";
  if (ids.includes("biggy") && ids.includes("microduck"))
    return "MASS vs ATTITUDE";
  if (ids.includes("biggy") && ids.includes("richie"))
    return "POOR LIFE CHOICES";
  if (ids.includes("droid") && ids.includes("richie"))
    return "ARCHITECTURE vs EDGE CASE";
  return "THE BUILD PASSED. THE ROBOTS DIDN’T.";
}
