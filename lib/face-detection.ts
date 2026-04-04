/**
 * Client-side face detection using face-api.js
 * Extracts facial embeddings and detects faces in images
 */

let modelsLoaded = false;

/**
 * Load face-api.js models (must be called once before detection)
 */
export async function loadFaceModels() {
  if (modelsLoaded) return;

  try {
    // Load the face-api.js library
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    script.async = true;

    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Wait for face-api to be available on window
    const faceapi = (window as any).faceapi;
    if (!faceapi) {
      throw new Error("face-api.js library loaded but not available");
    }

    // Load the ML models from CDN
    const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/";

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceDescriptorNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
  } catch (err) {
    console.error("Failed to load face-api models:", err);
    throw new Error(`Face detection models failed to load: ${(err as Error).message}`);
  }
}

/**
 * Detect faces in an image file and extract embeddings
 * Returns array of detected faces with 128D embeddings
 */
export async function detectFacesInImage(imageFile: File): Promise<
  Array<{
    embedding: number[];
    confidence: number;
    detection: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>
> {
  if (typeof window === "undefined") {
    throw new Error("Face detection only works in browser");
  }

  // Ensure face-api is loaded
  if (!modelsLoaded) {
    await loadFaceModels();
  }

  // Get face-api from window
  const faceapi = (window as any).faceapi;
  if (!faceapi) {
    throw new Error("face-api.js not loaded");
  }

  // Convert file to blob URL
  const imageUrl = URL.createObjectURL(imageFile);

  try {
    // Load image element
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Detect faces with descriptors (embeddings) using tinyFaceDetector
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections || detections.length === 0) {
      return [];
    }

    // Convert to our format
    return detections.map((detection: any) => ({
      embedding: Array.from(detection.descriptor), // Convert Float32Array to number[]
      confidence: detection.detection.score,
      detection: {
        x: Math.round(detection.detection.box.x),
        y: Math.round(detection.detection.box.y),
        width: Math.round(detection.detection.box.width),
        height: Math.round(detection.detection.box.height),
      },
    }));
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Process multiple images and detect all faces
 */
export async function detectFacesInImages(imageFiles: File[]): Promise<
  Array<{
    imageFile: File;
    faces: Array<{
      embedding: number[];
      confidence: number;
      detection: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
  }>
> {
  const results = [];

  for (const file of imageFiles) {
    try {
      const faces = await detectFacesInImage(file);
      results.push({ imageFile: file, faces });
    } catch (err) {
      console.error(`Failed to process ${file.name}:`, err);
      // Continue with next file
    }
  }

  return results;
}
