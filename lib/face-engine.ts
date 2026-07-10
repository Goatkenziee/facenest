/**
 * FaceNest — Face Engine
 * ----------------------------------------------------------------------------
 * Type definitions for face detection and matching results.
 * The actual detection runs server-side via the /api/detect endpoint using
 * face-api.js (TensorFlow.js backed) for on-server inference.
 *
 * In production, the model files would be loaded from public/models/.
 * For this v1, we use a lightweight approach: the server endpoint receives
 * a base64 image, runs detection via face-api.js, and returns results.
 */

export interface FaceDetectionResult {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number | null;
  /** 128-dim descriptor for matching; null if detection-only mode */
  descriptor?: number[] | null;
}

export interface FaceMatchResult {
  label: string;
  confidence: number;
}

export interface DetectResponse {
  faces: FaceDetectionResult[];
  match: FaceMatchResult | null;
  /** Time taken in ms */
  inferenceMs: number;
}

/**
 * Compute cosine similarity between two 128-d face descriptors.
 * Range: -1 (opposite) to 1 (identical). Threshold typically 0.6.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Simple in-memory face gallery. In production, persist to a database.
 * Each entry: label (person name) + 128-dim descriptor.
 */
export interface GalleryEntry {
  id: string;
  label: string;
  descriptor: number[];
  /** thumbnail URL */
  thumbnail?: string;
}

/** Default gallery — seeded with a few synthetic descriptors for demo */
export const DEFAULT_GALLERY: GalleryEntry[] = [
  {
    id: "demo-1",
    label: "Alex",
    descriptor: new Array(128).fill(0).map((_, i) => Math.sin(i * 0.5) * 0.3 + 0.5),
    thumbnail: undefined,
  },
  {
    id: "demo-2",
    label: "Jordan",
    descriptor: new Array(128).fill(0).map((_, i) => Math.cos(i * 0.3) * 0.3 + 0.5),
    thumbnail: undefined,
  },
  {
    id: "demo-3",
    label: "Sam",
    descriptor: new Array(128).fill(0).map((_, i) => Math.sin(i * 0.7 + 1) * 0.3 + 0.5),
    thumbnail: undefined,
  },
];

/**
 * Find the best match for a descriptor against the gallery.
 * Returns null if no match exceeds the threshold.
 */
export function findBestMatch(
  descriptor: number[],
  gallery: GalleryEntry[],
  threshold = 0.55
): FaceMatchResult | null {
  let best: FaceMatchResult | null = null;
  for (const entry of gallery) {
    const sim = cosineSimilarity(descriptor, entry.descriptor);
    if (sim > threshold && (!best || sim > best.confidence)) {
      best = { label: entry.label, confidence: sim };
    }
  }
  return best;
}
