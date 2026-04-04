"use client";

import React, { useState, useRef } from "react";
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
  hiker_id?: string;
  hiker_name?: string;
  confidence: number;
  embedding: number[];
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
    if (!uploadedFiles.length) {
      alert("Select at least 1 photo");
      return;
    }

    setLoading(true);
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
      setSessionId(data.hike_session.id);
      setStep("processing");

      // TODO: Load face-api.js and process images
      // For now, simulate detection
      setTimeout(() => {
        setStep("review");
      }, 2000);
    } catch (err) {
      alert(`Upload failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const attendanceRecords = detectedFaces
        .filter((face) => face.hiker_id) // Only confirmed faces
        .map((face) => ({
          hiker_id: face.hiker_id,
          confidence: face.confidence,
          confirmation_status: "manually_confirmed",
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
          <p className="text-gray-600">Upload photos, detect hikers, track attendance</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mb-8 text-sm font-semibold">
          <div className={`flex items-center ${step === "upload" ? "text-green-700" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full ${step === "upload" ? "bg-green-700" : "bg-gray-300"} text-white flex items-center justify-center mr-2`}>1</div>
            Upload
          </div>
          <div className={`flex items-center ${step === "processing" ? "text-green-700" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full ${step === "processing" ? "bg-green-700" : "bg-gray-300"} text-white flex items-center justify-center mr-2`}>2</div>
            Processing
          </div>
          <div className={`flex items-center ${step === "review" ? "text-green-700" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full ${step === "review" ? "bg-green-700" : "bg-gray-300"} text-white flex items-center justify-center mr-2`}>3</div>
            Review
          </div>
          <div className={`flex items-center ${step === "complete" ? "text-green-700" : "text-gray-400"}`}>
            <div className={`w-8 h-8 rounded-full ${step === "complete" ? "bg-green-700" : "bg-gray-300"} text-white flex items-center justify-center mr-2`}>4</div>
            Complete
          </div>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Hike Photos</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Hike Date</label>
              <input
                type="date"
                value={hikeDate}
                onChange={(e) => setHikeDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Trail (Optional)</label>
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
              <label className="block text-sm font-semibold mb-2 text-gray-700">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Weather, trail conditions, etc."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Photos (Max 5)</label>
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
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Detecting Faces...</h2>
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-gray-600">Loading face detection model. This may take a moment...</p>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Review Detections</h2>
            <p className="text-gray-600 mb-6">No faces detected in photos. In a real implementation, detected faces would appear here for confirmation/correction.</p>

            <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-400">
              <h3 className="font-bold text-blue-900 mb-2">ℹ️ Demo Mode</h3>
              <p className="text-blue-800">Face detection requires face-api.js integration and will be implemented with actual image processing.</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
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
            <h2 className="text-3xl font-bold text-green-700 mb-4">✓ Attendance Saved</h2>
            <p className="text-gray-600 mb-8">
              Hike on {new Date(hikeDate).toLocaleDateString()} has been recorded.
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
