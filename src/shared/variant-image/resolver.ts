import { ImageSignature, OptionSnapshot } from "./types";

export function buildImageMap(
  rows: {
    product_id: number;
    image_key: string;
    dimension_key: string;
    value_key: string;
  }[]
) {
  const map = new Map<number, ImageSignature[]>();

  for (const r of rows) {
    if (!map.has(r.product_id)) {
      map.set(r.product_id, []);
    }

    const list = map.get(r.product_id)!;

    let img = list.find((i) => i.imageKey === r.image_key);

    if (!img) {
      img = {
        imageKey: r.image_key,
        signatures: {}
      };
      list.push(img);
    }

    img.signatures[r.dimension_key] = r.value_key;
  }

  return map;
}

// NORMALIZE SNAPSHOT
export function normalizeSnapshot(snapshot: OptionSnapshot[]) {
  if (!Array.isArray(snapshot)) return {};

  return Object.fromEntries(snapshot.map((opt) => [String(opt.dimension).toLowerCase(), String(opt.value).toLowerCase()]));
}

// FIND BEST IMAGE (CORE)
export function findBestImage(images: ImageSignature[], snapshot: OptionSnapshot[] | null): string | null {
  if (!images || images.length === 0) return null;

  const normalized = normalizeSnapshot(snapshot ?? []);

  let bestMatch: { score: number; imageKey: string } | null = null;

  for (const img of images) {
    let match = true;
    let score = 0;

    for (const [key, value] of Object.entries(img.signatures)) {
      if (normalized[key] !== value) {
        match = false;
        break;
      }
      score++;
    }

    if (match) {
      // pilih yang paling spesifik (signature paling banyak match)
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          score,
          imageKey: img.imageKey
        };
      }
    }
  }

  return bestMatch?.imageKey ?? null;
}
