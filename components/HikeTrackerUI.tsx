"use client";

import React, { useState, useRef } from "react";
import { detectFacesInImages } from "@/lib/face-detection";
import { match_embedding, get_all_matches, FaceSignature } from "@/lib/face-matching";
import HikingLeaderboard from "./HikingLeaderboard";

interface Hiker {
  id: string;
  name: string;
  face_trained: boolean;
}

interface Trail {
  id: string;
  trail_name: string;
  distance_miles: number;
  elevation_gain_ft: number;
  avg_duration_minutes: number;
}

interface DetectedFace {
  detectionId: string;
  embedding: number[];
  confidence: number;
  matchedHikerId?: string;
  matchedHikerName?: string;
  matchConfidence?: number;
  alternatives?: Array<{ hiker_id: string; hiker_name: string; confidence: number }>;
  status: "auto_detected" | "manually_confirmed" | "false_positive" | "manually_added";
  newHikerName?: string;
}

type Step = "upload" | "processing" | "review" | "complete" | "leaderboard";

export default function HikeTrackerUI() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [hikeDate, setHikeDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [trailId, setTrailId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [hikers, setHikers] = useState<Hiker[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [hikerId, setHikerId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load hikers and trails on mount
  React.useEffect(() => {
    fetchHikersAndTrails();
  }, []);

  async function fetchHikersAndTrails() {
    try {
      const [hikersRes, trailsRes] = await Promise.all([
        fetch("/api/hiking/hikers"),
        fetch("/api/hiking/trails"),
      ]);

      if (hikersRes.ok) {
        const data = await hikersRes.json();
        setHikers(data.hikers || []);
      }

      if (trailsRes.ok) {
        const data = await trailsRes.json();
        setTrails(data.trails || []);
      }
    } catch (err) {
      console.error("Failed to fetch hikers/trails:", err);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      alert("Maximum 5 photos per upload");
      return;
    }
    setUploadedFiles(files);
  }

  async function handleUpload() {
    console.log("[HikeTrackerUI] handleUpload called with", uploadedFiles.length, "files");

    if (!uploadedFiles.length) {
      alert("Select at least 1 photo");
      return;
    }

    setLoading(true);
    console.log("[HikeTrackerUI] Uploading hike session...");
    try {
      const res = await fetch("/api/hiking/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hike_date: hikeDate,
          trail_id: trailId || null,
          notes,
          photo_count: uploadedFiles.length,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create hike session");
      }

      const data = await res.json();
      console.log("[HikeTrackerUI] Session created:", data.hike_session.id);
      setSessionId(data.hike_session.id);
      setStep("processing");
      console.log("[HikeTrackerUI] Step set to processing, calling processImages");
      await processImages();
    } catch (err) {
      console.error("[HikeTrackerUI] Upload error:", err);
      alert(`Upload failed: ${(err as Error).message}`);
      setLoading(false);
    }
  }

  async function processImages() {
    console.log("[HikeTrackerUI] Starting processImages");
    try {
      setProcessingMessage("Preparing review...");

      // For now, skip face detection and go straight to manual assignment
      // Users will manually select which hikers attended the hike
      const detected: DetectedFace[] = [];

      // Create one "fake" detection per uploaded file so user can assign each
      for (let i = 0; i < uploadedFiles.length; i++) {
        detected.push({
          detectionId: `photo-${i}`,
          embedding: new Array(128).fill(0), // Placeholder embedding
          confidence: 0,
          status: "manually_added",
        });
      }

      setDetectedFaces(detected);
      setStep("review");
      setProcessingMessage("");
    } catch (err) {
      const errorMsg = (err as Error).message || "Unknown error";
      console.error("[HikeTrackerUI] processImages Error:", err);
      alert(`Processing failed: ${errorMsg}`);
      setStep("upload");
    } finally {
      setLoading(false);
    }
  }

  function toggleFaceStatus(detectionId: string, status: DetectedFace["status"]) {
    setDetectedFaces((prev) =>
      prev.map((face) =>
        face.detectionId === detectionId ? { ...face, status } : face
      )
    );
  }

  function assignFaceToHiker(detectionId: string, hikerId: string) {
    const hiker = hikers.find((h) => h.id === hikerId);
    setDetectedFaces((prev) =>
      prev.map((face) =>
        face.detectionId === detectionId
          ? {
              ...face,
              matchedHikerId: hikerId,
              matchedHikerName: hiker?.name,
              status: "manually_confirmed",
            }
          : face
      )
    );
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const attendanceRecords = detectedFaces
        .filter((face) => face.status !== "false_positive" && face.matchedHikerId)
        .map((face) => ({
          hiker_id: face.matchedHikerId,
          confidence: face.matchConfidence || face.confidence,
          confirmation_status: face.status,
          embedding: face.status === "manually_added" ? face.embedding : undefined,
          hiker_name:
            face.status === "manually_added" ? face.newHikerName : undefined,
        }));

      const res = await fetch("/api/hiking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hike_session_id: sessionId,
          attendance_records: attendanceRecords,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save attendance");
      }

      setStep("complete");
    } catch (err) {
      alert(`Confirmation failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">
            BAD Hiking Group Tracker
          </h1>
          <p className="text-gray-600">
            Upload photos, detect hikers, track attendance
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mb-8 text-sm font-semibold">
          <div
            className={`flex items-center ${
              step === "upload" ? "text-green-700" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full ${
                step === "upload" ? "bg-green-700" : "bg-gray-300"
              } text-white flex items-center justify-center mr-2`}
            >
              1
            </div>
            Upload
          </div>
          <div
            className={`flex items-center ${
              step === "processing" ? "text-green-700" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full ${
                step === "processing" ? "bg-green-700" : "bg-gray-300"
              } text-white flex items-center justify-center mr-2`}
            >
              2
            </div>
            Processing
          </div>
          <div
            className={`flex items-center ${
              step === "review" ? "text-green-700" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full ${
                step === "review" ? "bg-green-700" : "bg-gray-300"
              } text-white flex items-center justify-center mr-2`}
            >
              3
            </div>
            Review
          </div>
          <div
            className={`flex items-center ${
              step === "complete" ? "text-green-700" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full ${
                step === "complete" ? "bg-green-700" : "bg-gray-300"
              } text-white flex items-center justify-center mr-2`}
            >
              4
            </div>
            Complete
          </div>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Upload Hike Photos
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Hike Date
              </label>
              <input
                type="date"
                value={hikeDate}
                onChange={(e) => setHikeDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Trail (Optional)
              </label>
              <select
                value={trailId}
                onChange={(e) => setTrailId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a trail...</option>
                {trails.map((trail) => (
                  <option key={trail.id} value={trail.id}>
                    {trail.trail_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Weather, trail conditions, etc."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Photos (Max 5)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-green-400 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition"
              >
                {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} file(s) selected`
                  : "Click to select photos"}
              </button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mb-6 text-sm text-gray-600">
                <p className="font-semibold mb-2">Selected files:</p>
                <ul className="list-disc pl-6">
                  {uploadedFiles.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading || uploadedFiles.length === 0}
              className="w-full px-6 py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 disabled:bg-gray-400 transition"
            >
              {loading ? "Uploading..." : "Next: Process Photos"}
            </button>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Detecting Faces...
            </h2>
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-gray-600">{processingMessage}</p>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Review Detections
            </h2>

            <p className="mb-6 text-gray-700">
              Select which hikers attended this {trails.find(t => t.id === trailId)?.trail_name || "hike"}:
            </p>

            {detectedFaces.length === 0 ? (
              <div className="p-6 bg-blue-50 border-l-4 border-blue-400 mb-8">
                <p className="text-blue-900">
                  No photos to assign. Upload photos first.
                </p>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {detectedFaces.map((face) => (
                  <div
                    key={face.detectionId}
                    className="p-6 border-l-4 border-green-500 bg-gray-50 rounded"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-800">Detection #{face.detectionId}</p>
                        <p className="text-sm text-gray-600">
                          Model confidence: {(face.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <select
                        value={face.status}
                        onChange={(e) =>
                          toggleFaceStatus(
                            face.detectionId,
                            e.target.value as DetectedFace["status"]
                          )
                        }
                        className="px-3 py-2 bg-white border border-gray-300 rounded text-sm font-semibold"
                      >
                        <option value="auto_detected">Auto-Detected</option>
                        <option value="manually_confirmed">Confirmed</option>
                        <option value="false_positive">False Positive</option>
                        <option value="manually_added">New Hiker</option>
                      </select>
                    </div>

                    {face.status !== "false_positive" && (
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Assign to Hiker
                        </label>
                        <select
                          value={face.matchedHikerId || ""}
                          onChange={(e) =>
                            assignFaceToHiker(face.detectionId, e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select a hiker...</option>
                          {hikers.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                        </select>

                        {face.matchConfidence && (
                          <p className="text-sm text-green-700 mt-2">
                            ✓ Match confidence: {(face.matchConfidence * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep("upload");
                  setDetectedFaces([]);
                }}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || detectedFaces.every((f) => f.status === "false_positive")}
                className="flex-1 px-6 py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 disabled:bg-gray-400 transition"
              >
                {loading ? "Saving..." : "Complete"}
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              ✓ Attendance Saved
            </h2>
            <p className="text-gray-600 mb-8">
              Hike on {new Date(hikeDate).toLocaleDateString()} has been recorded with{" "}
              {detectedFaces.filter((f) => f.status !== "false_positive").length} hikers.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep("leaderboard");
                }}
                className="flex-1 px-6 py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition"
              >
                View Leaderboard
              </button>
              <button
                onClick={() => {
                  setStep("upload");
                  setUploadedFiles([]);
                  setDetectedFaces([]);
                }}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition"
              >
                Record Another Hike
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {step === "leaderboard" && (
          <>
            <button
              onClick={() => setStep("upload")}
              className="mb-6 px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition"
            >
              ← Back
            </button>
            <HikingLeaderboard />
          </>
        )}
      </div>
    </div>
  );
}
