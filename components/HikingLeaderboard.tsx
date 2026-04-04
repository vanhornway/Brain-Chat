"use client";

import React, { useEffect, useState } from "react";

interface HikerStats {
  name: string;
  hikes: number;
  miles: number;
  elevation: number;
  streak: number;
  avg_distance: number;
  avg_duration: number;
  avg_elevation: number;
}

interface TrailStats {
  trail_name: string;
  count: number;
  avg_hikers: number;
  avg_distance: number;
  avg_duration: number;
}

type SortBy = "hikes" | "miles" | "elevation" | "streak";

export default function HikingLeaderboard() {
  const [hikerLeaderboard, setHikerLeaderboard] = useState<HikerStats[]>([]);
  const [trailAnalytics, setTrailAnalytics] = useState<TrailStats[]>([]);
  const [hikerSort, setHikerSort] = useState<SortBy>("hikes");
  const [trailSort, setTrailSort] = useState<"count" | "avg_distance">("count");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/hiking/analytics");
      if (res.ok) {
        const data = await res.json();
        setHikerLeaderboard(data.hiker_leaderboard || []);
        setTrailAnalytics(data.trail_analytics || []);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  const sortedHikers = [...hikerLeaderboard].sort((a, b) => {
    if (hikerSort === "hikes") return b.hikes - a.hikes;
    if (hikerSort === "miles") return b.miles - a.miles;
    if (hikerSort === "elevation") return b.elevation - a.elevation;
    if (hikerSort === "streak") return b.streak - a.streak;
    return 0;
  });

  const sortedTrails = [...trailAnalytics].sort((a, b) => {
    if (trailSort === "count") return b.count - a.count;
    return b.avg_distance - a.avg_distance;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hiker Leaderboard */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-green-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">🥾 Hiker Leaderboard</h2>
        </div>

        <div className="px-8 py-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setHikerSort("hikes")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              hikerSort === "hikes"
                ? "bg-green-700 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Most Hikes
          </button>
          <button
            onClick={() => setHikerSort("miles")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              hikerSort === "miles"
                ? "bg-green-700 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Most Miles
          </button>
          <button
            onClick={() => setHikerSort("elevation")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              hikerSort === "elevation"
                ? "bg-green-700 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Most Elevation
          </button>
          <button
            onClick={() => setHikerSort("streak")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              hikerSort === "streak"
                ? "bg-green-700 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Streak
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-t border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Rank</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Hikes</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Miles</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Elevation (ft)</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Avg Distance</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Avg Duration</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedHikers.map((hiker, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-bold text-green-700">#{idx + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{hiker.name}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{hiker.hikes}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{hiker.miles.toFixed(1)}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{hiker.elevation.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{hiker.avg_distance.toFixed(1)} mi</td>
                  <td className="px-6 py-4 text-center text-gray-700">{hiker.avg_duration} min</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold">
                      {hiker.streak}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hikerLeaderboard.length === 0 && (
          <div className="px-8 py-12 text-center text-gray-600">
            No attendance records yet. Start by uploading a hike!
          </div>
        )}
      </div>

      {/* Trail Analytics */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">🗻 Trail Analytics</h2>
        </div>

        <div className="px-8 py-4 flex gap-2">
          <button
            onClick={() => setTrailSort("count")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              trailSort === "count"
                ? "bg-blue-700 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Most Hiked
          </button>
          <button
            onClick={() => setTrailSort("avg_distance")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              trailSort === "avg_distance"
                ? "bg-blue-700 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Longest Trails
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-t border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Trail</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Times Hiked</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Avg Hikers</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Distance</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTrails.map((trail, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{trail.trail_name}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{trail.count}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{trail.avg_hikers.toFixed(1)}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{trail.avg_distance.toFixed(1)} mi</td>
                  <td className="px-6 py-4 text-center text-gray-700">{trail.avg_duration} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {trailAnalytics.length === 0 && (
          <div className="px-8 py-12 text-center text-gray-600">
            No trail data yet. Create trails and record hikes to see analytics.
          </div>
        )}
      </div>
    </div>
  );
}
