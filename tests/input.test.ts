import { afterEach, describe, it, expect, vi } from "vitest";
import { Input } from "../src/input";
afterEach(() => vi.unstubAllGlobals());
function setup() {
  const listeners = new Map<string, Function>();
  vi.stubGlobal("window", {
    addEventListener: (name: string, fn: Function) => listeners.set(name, fn),
  });
  vi.stubGlobal("document", { activeElement: null, body: {} });
  vi.stubGlobal("navigator", { getGamepads: () => [] });
  const input = new Input();
  const key = (type: string, code: string) =>
    listeners.get(type)!({
      code,
      repeat: false,
      target: { matches: () => false },
      preventDefault() {},
    });
  return { input, key };
}
describe("frame-independent input", () => {
  it("registers an attack tapped entirely between simulation frames, exactly once", () => {
    const { input, key } = setup();
    key("keydown", "KeyJ");
    key("keyup", "KeyJ");
    expect(input.read(0, false).light).toBe(true);
    expect(input.read(0, false).light).toBe(false);
  });
  it("reading P1 does not consume P2 taps", () => {
    const { input, key } = setup();
    key("keydown", "Digit2");
    key("keyup", "Digit2");
    expect(input.read(0, true).heavy).toBe(false);
    expect(input.read(1, true).heavy).toBe(true);
  });
  it("clears buffered attacks when returning from menus or losing focus", () => {
    const { input, key } = setup();
    key("keydown", "KeyL");
    input.clear();
    expect(input.read(0, false).special).toBe(false);
  });
});
describe("key bindings", () => {
  it("reads a rebound key and swaps a key already in use", async () => {
    const { bindKey, DEFAULT_KEYS, keyName } = await import("../src/keys");
    const { input, key } = setup();
    expect(bindKey(input.binds, 0, "light", "KeyF")).toBe(true);
    key("keydown", "KeyF");
    expect(input.read(0, false).light).toBe(true);
    key("keyup", "KeyF");
    // KeyD was MOVE RIGHT; giving it to jump hands jump's old key to move right.
    bindKey(input.binds, 0, "jump", "KeyD");
    expect(input.binds[0].right).toBe(DEFAULT_KEYS[0].jump);
    key("keydown", "KeyD");
    const c = input.read(0, false);
    expect(c.jump).toBe(true);
    expect(c.move).toBe(0);
    expect(bindKey(input.binds, 1, "grab", "Escape")).toBe(false);
    expect(keyName("KeyJ")).toBe("J");
    expect(keyName("Numpad1")).toBe("NUM 1");
    expect(keyName("ShiftRight")).toBe("R SHIFT");
  });
  it("accepts a numpad digit for a P2 digit binding", () => {
    const { input, key } = setup();
    key("keydown", "Numpad2");
    expect(input.read(1, true).heavy).toBe(true);
  });
});
