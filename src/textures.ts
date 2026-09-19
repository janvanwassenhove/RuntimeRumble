// Generated textures (docs/ASSET-SOURCES.md): every image under assets/textures is picked
// up by name, so a material asks for 'carpet-hall' and gets the map if the file exists
// and a flat colour if it does not. Nothing here blocks the first frame.
import * as T from 'three';

const urls = import.meta.glob('./assets/textures/*.{jpg,png,webp}', {eager: true, query: '?url', import: 'default'}) as Record<string, string>;
const byName = new Map(Object.entries(urls).map(([path, url]) => [path.replace(/^.*\/|\.\w+$/g, ''), url]));
const loader = new T.TextureLoader();
const cache = new Map<string, T.Texture>();
let anisotropy = 8;

export const setAnisotropy = (n: number) => { anisotropy = n; cache.forEach(t => { t.anisotropy = n; t.needsUpdate = true; }); };
export const hasTex = (name: string) => byName.has(name);
/** The image's URL, for the DOM: the briefing shows the posters it is talking about. */
export const texUrl = (name: string) => byName.get(name);

/** A colour map, tiled `rx` by `ry`. Clones share the image, so every repeat is cheap. */
export function tex(name: string, rx = 1, ry = rx, srgb = true): T.Texture | null {
  const url = byName.get(name);
  if (!url) return null;
  let base = cache.get(name);
  if (!base) { base = loader.load(url); cache.set(name, base); }
  const t = base.clone();
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = anisotropy;
  t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace;
  return t;
}

/** The raw image, for compositing onto a canvas (decals over weathered paint). */
export function image(name: string): Promise<HTMLImageElement | null> {
  const url = byName.get(name);
  if (!url) return Promise.resolve(null);
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = url; });
}

type Surface = {color?: T.ColorRepresentation; rough?: number; metal?: number; repeat?: [number, number] | number; bump?: number; tint?: T.ColorRepresentation; env?: number};

/** Textured PBR surface. The albedo doubles as a bump map: pile, grain and scratches catch the light. */
export function surface(name: string, o: Surface = {}) {
  const [rx, ry] = Array.isArray(o.repeat) ? o.repeat : [o.repeat ?? 1, o.repeat ?? 1];
  const map = tex(name, rx, ry);
  const m = new T.MeshStandardMaterial({color: map ? (o.tint ?? 0xffffff) : (o.color ?? 0x808080), roughness: o.rough ?? .8, metalness: o.metal ?? 0, map});
  if (map && o.bump) { m.bumpMap = tex(name, rx, ry, false); m.bumpScale = o.bump; }
  if (o.env !== undefined) m.envMapIntensity = o.env;
  return m;
}
