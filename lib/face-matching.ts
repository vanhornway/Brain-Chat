/**
 * Face matching utilities for cosine similarity and embedding comparison
 * Used for client-side matching of detected faces to stored hiker signatures
 */

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 = identical, 0 = orthogonal, -1 = opposite
 */
export function cosine_similarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0; // Handle zero vectors
  }

  return dotProduct / (normA * normB);
}

/**
 * Find best matching hiker for a detected face embedding
 * Returns the hiker with highest confidence if above threshold
 */
export interface FaceSignature {
  hiker_id: string;
  hiker_name: string;
  embedding: number[];
}

export interface FaceMatch {
  hiker_id: string;
  hiker_name: string;
  confidence: number;
}

export function match_embedding(
  detectedEmbedding: number[],
  storedSignatures: FaceSignature[],
  threshold: number = 0.6
): FaceMatch | null {
  if (storedSignatures.length === 0) {
    return null;
  }

  const matches = storedSignatures.map((sig) => ({
    hiker_id: sig.hiker_id,
    hiker_name: sig.hiker_name,
    confidence: cosine_similarity(detectedEmbedding, sig.embedding),
  }));

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  const best = matches[0];
  return best && best.confidence > threshold ? best : null;
}

/**
 * Get all matches for a detected embedding, sorted by confidence
 * Useful for showing alternatives if top match is uncertain
 */
export function get_all_matches(
  detectedEmbedding: number[],
  storedSignatures: FaceSignature[],
  minConfidence: number = 0.5
): FaceMatch[] {
  const matches = storedSignatures
    .map((sig) => ({
      hiker_id: sig.hiker_id,
      hiker_name: sig.hiker_name,
      confidence: cosine_similarity(detectedEmbedding, sig.embedding),
    }))
    .filter((m) => m.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Convert a Vector type from Supabase to number array
 * Supabase returns vectors as strings like "[0.1, 0.2, 0.3]"
 */
export function parse_embedding(embedding: string | number[] | null): number[] | null {
  if (!embedding) return null;

  if (Array.isArray(embedding)) {
    return embedding;
  }

  if (typeof embedding === "string") {
    try {
      const parsed = JSON.parse(embedding);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}
