import { Controls, neutral } from "./data";
import {
  Bindings,
  KEY_ACTIONS,
  KeyAction,
  loadKeys,
  sameKey,
} from "./keys";
export class Input {
  keys = new Set<string>();
  taps = new Set<string>();
  touchTaps = new Set<string>();
  touch = new Set<string>();
  /** The touch stick, -1..1 each way: x is move, up is jump, down is crouch. */
  stick = { x: 0, y: 0 };
  lastActivity = performance.now();
  paused: () => void = () => {};
  start: () => void = () => {};
  padPrevious: boolean[][] = [];
  menu: (direction: number, activate: boolean) => void = () => {};
  menuClock = 0;
  /** Keyboard bindings per player, rebound from the settings screen. */
  constructor(public binds: [Bindings, Bindings] = loadKeys()) {
    window.addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement).matches("input,select,textarea")) return;
      this.lastActivity = performance.now();
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        ) &&
        document.activeElement === document.body
      )
        e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat) this.taps.add(e.code);
      if (!e.repeat && e.code === "Escape") this.paused();
      if (!e.repeat && e.code === "Enter") this.start();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.clear());
    window.addEventListener(
      "pointerdown",
      () => (this.lastActivity = performance.now()),
    );
  }
  clear() {
    this.keys.clear();
    this.taps.clear();
    this.touchTaps.clear();
    this.touch.clear();
    this.stick.x = this.stick.y = 0;
  }
  read(player: number, versus: boolean): Controls {
    const c = neutral(),
      k = new Set([...this.keys, ...this.taps]),
      t = new Set([...this.touch, ...this.touchTaps]),
      b = this.binds[player],
      held = (code: string) => {
        for (const key of k) if (sameKey(key, code)) return true;
        return false;
      },
      on = (a: KeyAction) => held(b[a]) || (player === 0 && t.has(a));
    const stick = player === 0 ? this.stick : { x: 0, y: 0 },
      sx = Math.abs(stick.x) > 0.3 ? Math.sign(stick.x) : 0;
    c.move = +on("right") - +on("left") || sx;
    c.jump = on("jump") || stick.y < -0.55;
    c.crouch = on("crouch") || stick.y > 0.55;
    c.block = on("block");
    c.light = on("light");
    c.heavy = on("heavy");
    c.special = on("special");
    c.secondary = on("secondary");
    c.grab = on("grab");
    c.overclock = on("overclock");
    const pads = Array.from(navigator.getGamepads?.() || []).filter(
      Boolean,
    ) as Gamepad[];
    // One pad in versus belongs to P2, allowing keyboard + controller without setup.
    const pad = versus
      ? pads.length === 1
        ? player === 1
          ? pads[0]
          : undefined
        : pads[player]
      : pads[player];
    if (pad) {
      const b = (i: number) => !!pad.buttons[i]?.pressed;
      let axis = pad.axes[0] || 0;
      if (Math.abs(axis) < 0.2) axis = 0;
      c.move = c.move || axis || +b(15) - +b(14);
      c.crouch ||= b(13);
      c.jump ||= b(3) || b(12);
      c.light ||= b(0);
      c.heavy ||= b(1);
      c.special ||= b(2);
      c.block ||= b(4);
      c.grab ||= b(5);
      c.secondary ||= b(6);
      c.overclock ||= b(7);
      if (Object.values(c).some(Boolean)) this.lastActivity = performance.now();
    }
    // A tap is consumed by the player it belongs to; a tap bound to nobody by anyone.
    const bound = (p: number, key: string) =>
      KEY_ACTIONS.some((a) => sameKey(key, this.binds[p][a.id]));
    for (const key of this.taps)
      if (bound(player, key) || !bound(1 - player, key)) this.taps.delete(key);
    if (player === 0) this.touchTaps.clear();
    return c;
  }
  pollMenus() {
    const pads = Array.from(navigator.getGamepads?.() || []);
    pads.forEach((p, i) => {
      if (!p) return;
      const prev = this.padPrevious[i] || [];
      if (p.buttons[9]?.pressed && !prev[9]) {
        this.lastActivity = performance.now();
        this.start();
      }
      const dir =
        p.buttons[13]?.pressed ||
        p.buttons[15]?.pressed ||
        p.axes[0] > 0.6 ||
        p.axes[1] > 0.6
          ? 1
          : p.buttons[12]?.pressed ||
              p.buttons[14]?.pressed ||
              p.axes[0] < -0.6 ||
              p.axes[1] < -0.6
            ? -1
            : 0;
      if (dir && performance.now() - this.menuClock > 220) {
        this.menuClock = performance.now();
        this.menu(dir, false);
      }
      if (p.buttons[0]?.pressed && !prev[0]) this.menu(0, true);
      this.padPrevious[i] = p.buttons.map((b) => b.pressed);
    });
  }
}
