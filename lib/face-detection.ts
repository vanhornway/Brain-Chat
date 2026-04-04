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

  console.log(`[FaceDetection] Processing image: ${imageFile.name}`);

  // Ensure face-api is loaded
  if (!modelsLoaded) {
    console.log("[FaceDetection] Loading models...");
    await loadFaceModels();
    console.log("[FaceDetection] Models loaded successfully");
  }

  // Get face-api from window
  const faceapi = (window as any).faceapi;
  if (!faceapi) {
    throw new Error("face-api.js not loaded");
  }

  // Check if models are loaded
  if (!faceapi.nets.tinyFaceDetector.isLoaded()) {
    throw new Error("Face detection models not loaded");
  }

  // Convert file to blob URL
  const imageUrl = URL.createObjectURL(imageFile);

  try {
    // Load image element
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageUrl;
    });

    console.log(`[FaceDetection] Image loaded: ${img.width}x${img.height}`);

    // Detect faces with descriptors (embeddings) using tinyFaceDetector
    console.log("[FaceDetection] Running face detection...");
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(`[FaceDetection] Found ${detections.length} faces`);

    if (!detections || detections.length === 0) {
      console.log("[FaceDetection] No faces detected in image");
      return [];
    }

    // Convert to our format
    const results = detections.map((detection: any) => ({
      embedding: Array.from(detection.descriptor), // Convert Float32Array to number[]
      confidence: detection.detection.score,
      detection: {
        x: Math.round(detection.detection.box.x),
        y: Math.round(detection.detection.box.y),
        width: Math.round(detection.detection.box.width),
        height: Math.round(detection.detection.box.height),
      },
    }));

    console.log(`[FaceDetection] Processed ${results.length} detections`);
    return results;
  } catch (err) {
    console.error("[FaceDetection] Error processing image:", err);
    throw err;
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
  console.log(`[FaceDetection] Processing ${imageFiles.length} images`);
  const results = [];

  for (const file of imageFiles) {
    try {
      console.log(`[FaceDetection] Processing ${file.name}...`);
      const faces = await detectFacesInImage(file);
      results.push({ imageFile: file, faces });
      console.log(`[FaceDetection] ${file.name}: Found ${faces.length} faces`);
    } catch (err) {
      console.error(`[FaceDetection] Failed to process ${file.name}:`, err);
      throw err; // Don't silently fail - bubble up the error
    }
  }

  console.log(`[FaceDetection] Total results: ${results.length} images processed`);
  return results;
}
