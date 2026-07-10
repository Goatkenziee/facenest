/**
 * FaceNest — /api/detect
 * ----------------------------------------------------------------------------
 * POST endpoint: receives a base64 JPEG image, simulates face detection.
 *
 * WHY SIMULATED: face-api.js requires ~40MB of model weights (tiny_face_detector,
 * face_landmark_68, face_recognition) that must be served as static assets.
 * In a real deployment, you'd:
 *   1. npm install @vladmandic/face-api
 *   2. Download model files to public/models/
 *   3. Load models once at startup (they're ~40MB total)
 *   4. Run faceapi.detectAllFaces(input).withFaceLandmarks().withFaceDescriptors()
 *
 * This endpoint returns realistic mock data so the UI works end-to-end.
 * Replace the mock with real face-api.js inference when models are deployed.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  findBestMatch,
  DEFAULT_GALLERY,
  FaceDetectionResult,
} from "@/lib/face-engine";

export const runtime = "nodejs";
export const maxDuration = 30;

interface DetectRequest {
  image: string; // base64 data URL
}

export async function POST(req: NextRequest) {
  const start = performance.now();

  try {
    const body: DetectRequest = await req.json();

    if (!body.image || typeof body.image !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'image' field (base64 data URL required)" },
        { status: 400 }
      );
    }

    // Validate it looks like a JPEG data URL
    if (!body.image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Image must be a base64 data URL (data:image/...)" },
        { status: 400 }
      );
    }

    // --- REAL FACE DETECTION WOULD GO HERE ---
    // const img = await canvas.loadImage(body.image);
    // const detections = await faceapi
    //   .detectAllFaces(img)
    //   .withFaceLandmarks()
    //   .withFaceDescriptors();
    //
    // const faces: FaceDetectionResult[] = detections.map((d) => ({
    //   x: d.detection.box.x,
    //   y: d.detection.box.y,
    //   width: d.detection.box.width,
    //   height: d.detection.box.height,
    //   confidence: d.detection.score,
    //   descriptor: Array.from(d.descriptor),
    // }));
    //
    // const match = faces.length > 0 && faces[0].descriptor
    //   ? findBestMatch(faces[0].descriptor, DEFAULT_GALLERY)
    //   : null;
    // --- END REAL DETECTION ---

    // Mock: simulate detecting 1-2 faces with realistic bounding boxes
    const faces: FaceDetectionResult[] = [
      {
        x: 80 + Math.random() * 40,
        y: 60 + Math.random() * 30,
        width: 140 + Math.random() * 30,
        height: 180 + Math.random() * 30,
        confidence: 0.85 + Math.random() * 0.14,
        descriptor: new Array(128)
          .fill(0)
          .map(() => Math.random() * 0.6 + 0.2),
      },
    ];

    // 30% chance of a second face
    if (Math.random() > 0.7) {
      faces.push({
        x: 260 + Math.random() * 40,
        y: 80 + Math.random() * 30,
        width: 120 + Math.random() * 30,
        height: 160 + Math.random() * 30,
        confidence: 0.7 + Math.random() * 0.2,
        descriptor: new Array(128)
          .fill(0)
          .map(() => Math.random() * 0.6 + 0.2),
      });
    }

    // Match first face against gallery
    const match =
      faces.length > 0 && faces[0].descriptor
        ? findBestMatch(faces[0].descriptor, DEFAULT_GALLERY)
        : null;

    const inferenceMs = Math.round(performance.now() - start);

    // Simulate processing delay (150-400ms)
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));

    return NextResponse.json({ faces, match, inferenceMs });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown face detection error";
    console.error("[FaceNest detect] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
