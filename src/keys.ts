// Key bindings: one keyboard code per action per player, saved on the device. Touch
// buttons and gamepads are fixed; only the keyboard is rebound. Digit and Numpad keys are
// aliases of each other, so "1" works from either side of the keyboard.
export type KeyAction =
  | "left"
  | "right"
  | "jump"
  | "crouch"
  | "block"
  | "light"
  | "heavy"
  | "special"
  | "secondary"
  | "grab"
  | "overclock";
export const KEY_ACTIONS: { id: KeyAction; label: string }[] = [
  { id: "left", label: "MOVE LEFT" },
  { id: "right", label: "MOVE RIGHT" },
  { id: "jump", label: "JUMP" },
  { id: "crouch", label: "CROUCH" },
  { id: "light", label: "LIGHT ATTACK" },
  { id: "heavy", label: "HEAVY ATTACK" },
  { id: "special", label: "SPECIAL" },
  { id: "secondary", label: "ALTERNATE" },
  { id: "grab", label: "GRAB" },
  { id: "block", label: "BLOCK" },
  { id: "overclock", label: "OVERCLOCK" },
];
export type Bindings = Record<KeyAction, string>;
export const DEFAULT_KEYS: [Bindings, Bindings] = [
  {
    left: "KeyA",
    right: "KeyD",
    jump: "KeyW",
    crouch: "KeyS",
    block: "Space",
    light: "KeyJ",
    heavy: "KeyK",
    special: "KeyL",
    secondary: "KeyI",
    grab: "KeyU",
    overclock: "KeyO",
  },
  {
    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
    crouch: "ArrowDown",
    block: "ShiftRight",
    light: "Digit1",
    heavy: "Digit2",
    special: "Digit3",
    secondary: "Digit4",
    grab: "Digit0",
    overclock: "Digit5",
  },
];
const STORE = "rumble-keys";
export function loadKeys(): [Bindings, Bindings] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (Array.isArray(saved) && saved.length === 2)
      return [
        { ...DEFAULT_KEYS[0], ...saved[0] },
        { ...DEFAULT_KEYS[1], ...saved[1] },
      ];
  } catch {}
  return [{ ...DEFAULT_KEYS[0] }, { ...DEFAULT_KEYS[1] }];
}
export function saveKeys(keys: [Bindings, Bindings]) {
  try {
    localStorage.setItem(STORE, JSON.stringify(keys));
  } catch {}
}
/** The other spelling of a digit key, or null. */
export function alias(code: string): string | null {
  const d = /^Digit(\d)$/.exec(code);
  if (d) return "Numpad" + d[1];
  const n = /^Numpad(\d)$/.exec(code);
  if (n) return "Digit" + n[1];
  return null;
}
export const sameKey = (a: string, b: string) => a === b || alias(a) === b;
/** Codes a key must not take: Escape pauses and cancels, Enter starts. */
export const RESERVED = new Set(["Escape", "Enter", "NumpadEnter"]);
/**
 * Bind a key. If it is already bound to another action, for either player, that action
 * takes the key being replaced, so no action is ever left without a key.
 */
export function bindKey(
  keys: [Bindings, Bindings],
  player: 0 | 1,
  action: KeyAction,
  code: string,
) {
  if (!code || RESERVED.has(code)) return false;
  const old = keys[player][action];
  for (const p of [0, 1] as const)
    for (const a of KEY_ACTIONS)
      if (sameKey(keys[p][a.id], code) && !(p === player && a.id === action))
        keys[p][a.id] = old;
  keys[player][action] = code;
  return true;
}
const NAMES: Record<string, string> = {
  Space: "SPACE",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ShiftLeft: "L SHIFT",
  ShiftRight: "R SHIFT",
  ControlLeft: "L CTRL",
  ControlRight: "R CTRL",
  AltLeft: "L ALT",
  AltRight: "R ALT",
  Tab: "TAB",
  Backspace: "BKSP",
  CapsLock: "CAPS",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backslash: "\\",
  BracketLeft: "[",
  BracketRight: "]",
  Minus: "-",
  Equal: "=",
  Backquote: "`",
  NumpadAdd: "NUM +",
  NumpadSubtract: "NUM -",
  NumpadMultiply: "NUM *",
  NumpadDivide: "NUM /",
  NumpadDecimal: "NUM .",
  Insert: "INS",
  Delete: "DEL",
  Home: "HOME",
  End: "END",
  PageUp: "PG UP",
  PageDown: "PG DN",
};
/** A code for a keydown that has none (synthesised events): derived from `key` where possible. */
export function eventCode(e: { code: string; key: string }) {
  if (e.code) return e.code;
  const k = e.key;
  if (/^[a-z]$/i.test(k)) return "Key" + k.toUpperCase();
  if (/^\d$/.test(k)) return "Digit" + k;
  if (k === " ") return "Space";
  if (/^(Arrow\w+|Tab|Backspace|Enter|Escape|F\d+)$/.test(k)) return k;
  return "";
}
/** A short label for a key code: KeyJ → J, Digit1 → 1, Numpad1 → NUM 1. */
export function keyName(code: string) {
  if (NAMES[code]) return NAMES[code];
  const m = /^(Key|Digit|Numpad|F)(\w+)$/.exec(code);
  if (m) return (m[1] === "Numpad" ? "NUM " : m[1] === "F" ? "F" : "") + m[2];
  return code.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase();
}
