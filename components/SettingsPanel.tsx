"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChatSettings,
  Provider,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,
  loadSettings,
  saveSettings,
  getProviderLabel,
} from "@/lib/providers";

interface SettingsPanelProps {
  onClose: () => void;
  onSave: (settings: ChatSettings) => void;
}

export default function SettingsPanel({ onClose, onSave }: SettingsPanelProps) {
  const [settings, setSettings] = useState<ChatSettings>(() => loadSettings());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleProviderChange(provider: Provider) {
    let modelId = settings.modelId;
    if (provider === "anthropic") modelId = ANTHROPIC_MODELS[0].id;
    else if (provider === "google") modelId = GOOGLE_MODELS[0].id;
    else modelId = "google/gemini-3-flash-preview";
    setSettings({ ...settings, provider, modelId });
  }

  function handleSave() {
    saveSettings(settings);
    onSave(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  }

  const hasKey = settings.apiKey.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-lg slide-up bg-surface border border-border rounded-t-2xl shadow-2xl pb-safe"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-surface-3 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
            aria-label="Close settings"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Warning if no key */}
          {!hasKey && (
            <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-700/40 rounded-xl px-4 py-3">
              <svg
                className="text-amber-400 mt-0.5 shrink-0"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M8 1L15 14H1L8 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 6v3M8 11v.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-amber-300 text-sm">
                No API key configured. Add your key below to start chatting.
              </p>
            </div>
          )}

          {/* Provider selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary uppercase tracking-wide text-xs">
              AI Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["anthropic", "google", "openrouter"] as Provider[]).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${
                      settings.provider === p
                        ? "bg-accent text-white shadow-lg shadow-accent/20"
                        : "bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary border border-border"
                    }`}
                  >
                    {p === "anthropic"
                      ? "Anthropic"
                      : p === "google"
                      ? "Gemini"
                      : "OpenRouter"}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Model selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide">
              Model
            </label>
            {settings.provider === "openrouter" ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={settings.modelId}
                  onChange={(e) =>
                    setSettings({ ...settings, modelId: e.target.value })
                  }
                  placeholder="e.g. google/gemini-3-flash-preview"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-light transition-colors"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "google/gemini-3-flash-preview",
                    "google/gemini-2.5-flash",
                    "google/gemini-2.5-pro",
                    "anthropic/claude-opus-4-6",
                    "anthropic/claude-sonnet-4-6",
                    "openai/gpt-4o",
                    "meta-llama/llama-4-maverick",
                  ].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSettings({ ...settings, modelId: m })}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                        settings.modelId === m
                          ? "bg-accent text-white"
                          : "bg-surface-3 text-text-muted hover:text-text-primary border border-border"
                      }`}
                    >
                      {m.split("/")[1]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <select
                value={settings.modelId}
                onChange={(e) =>
                  setSettings({ ...settings, modelId: e.target.value })
                }
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent-light transition-colors appearance-none cursor-pointer"
              >
                {(settings.provider === "anthropic"
                  ? ANTHROPIC_MODELS
                  : GOOGLE_MODELS
                ).map((m) => (
                  <option key={m.id} value={m.id} className="bg-surface-2">
                    {m.label}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-text-muted">
              {settings.provider === "openrouter"
                ? "Enter any OpenRouter model identifier"
                : `Using ${getProviderLabel(settings.provider)}`}
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wide">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings({ ...settings, apiKey: e.target.value })
                }
                placeholder={
                  settings.provider === "anthropic"
                    ? "sk-ant-..."
                    : settings.provider === "google"
                    ? "AIza..."
                    : "sk-or-..."
                }
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 pr-12 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-light transition-colors font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-1"
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Stored locally in your browser only — never sent to any server
              except the AI provider.
            </p>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all ${
              saved
                ? "bg-green-600 text-white"
                : "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20 active:scale-[0.98]"
            }`}
          >
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-4" />
      </div>
    </div>
  );
}
