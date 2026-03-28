"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import SettingsPanel from "./SettingsPanel";
import { loadSettings, ChatSettings } from "@/lib/providers";

const WELCOME_MESSAGE = `Hi! I'm your personal AI assistant. I have access to your life database — ask me about:

- **Health** — blood glucose, blood pressure, weight, workouts, medications, lab results
- **Hiking** — BAD Hikers group hikes and personal Strava activities
- **Finance** — income, net worth, donations
- **Family** — kids' school calendars, scout progress, college prep
- **Notes** — thoughts, goals, plans

What would you like to know?`;

interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: "call" | "partial-call" | "result";
  args?: Record<string, unknown>;
  result?: unknown;
}

export default function ChatInterface() {
  const [settings, setSettings] = useState<ChatSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasKey(settings.apiKey.trim().length > 0);
  }, [settings]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      body: {
        provider: settings.provider,
        apiKey: settings.apiKey,
        modelId: settings.modelId,
      },
      onError: (err) => {
        console.error("Chat error:", err);
      },
    });

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    const maxH = 120;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && hasKey) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
        // Reset height
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
        }
      }
    }
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (input.trim() && !isLoading && hasKey) {
      handleSubmit(e);
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  }

  const handleSettingsSave = useCallback((newSettings: ChatSettings) => {
    setSettings(newSettings);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                fill="white"
              />
              <path
                d="M9 8h2v8H9V8zm4 0h2v8h-2V8z"
                fill="white"
                opacity="0"
              />
              {/* Brain icon paths */}
              <path
                d="M12 3c-1.5 0-2.9.5-4 1.3C6.8 5.4 6 7.1 6 9c0 1.1.3 2.1.8 3-.5.9-.8 1.9-.8 3 0 2.8 2.1 5.1 4.8 5.4.4.1.8.1 1.2.1s.8 0 1.2-.1C15.9 20.1 18 17.8 18 15c0-1.1-.3-2.1-.8-3 .5-.9.8-1.9.8-3 0-1.9-.8-3.6-2-4.7C14.9 3.5 13.5 3 12 3z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary leading-tight">
              Brain Chat
            </h1>
            <p className="text-xs text-text-muted leading-tight">
              {hasKey
                ? `${settings.provider === "anthropic" ? "Anthropic" : settings.provider === "google" ? "Gemini" : "OpenRouter"} · ${settings.modelId}`
                : "No API key — open settings"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
            !hasKey
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              : "bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
          }`}
          aria-label="Open settings"
        >
          {!hasKey ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          )}
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto py-4"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="px-3 mb-3">
            <div className="max-w-[92%] bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="text-sm leading-relaxed prose-dark">
                <p className="mb-2">
                  Hi! I&apos;m your personal AI assistant. I have access to your
                  life database — ask me about:
                </p>
                <ul className="space-y-0.5 ml-4 list-disc">
                  <li>
                    <strong>Health</strong> — blood glucose, blood pressure,
                    weight, workouts, medications, lab results
                  </li>
                  <li>
                    <strong>Hiking</strong> — BAD Hikers group hikes and
                    personal Strava activities
                  </li>
                  <li>
                    <strong>Finance</strong> — income, net worth, donations
                  </li>
                  <li>
                    <strong>Family</strong> — kids&apos; school calendars,
                    scout progress, college prep
                  </li>
                  <li>
                    <strong>Notes</strong> — thoughts, goals, plans
                  </li>
                </ul>
                {!hasKey && (
                  <p className="mt-3 text-amber-300 text-xs">
                    Tap the settings icon above to add your API key.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role as "user" | "assistant"}
            content={message.content}
            toolInvocations={
              message.toolInvocations as ToolInvocation[] | undefined
            }
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-3 px-3">
            <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="dot-pulse flex gap-1.5 items-center">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mx-3 mb-3 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm font-medium mb-0.5">
              Error
            </p>
            <p className="text-red-300/80 text-xs">
              {error.message || "Something went wrong. Check your API key and try again."}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-none border-t border-border bg-surface/90 backdrop-blur-md px-3 py-3 pb-safe">
        {!hasKey && (
          <div className="mb-2 text-center">
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Add your API key to start chatting →
            </button>
          </div>
        )}
        <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                handleInputChange(e);
                autoResize(e.target);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                hasKey
                  ? "Ask about your health, hiking, finances..."
                  : "Configure API key in settings to chat"
              }
              disabled={!hasKey || isLoading}
              rows={1}
              className="w-full bg-surface-2 border border-border rounded-2xl px-4 py-3 pr-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-light transition-colors resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
              style={{ minHeight: "46px", maxHeight: "120px" }}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || !hasKey || isLoading}
            className={`flex-none w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
              input.trim() && hasKey && !isLoading
                ? "bg-accent text-white shadow-lg shadow-accent/30 active:scale-95"
                : "bg-surface-2 text-text-muted cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            {isLoading ? (
              <svg
                className="animate-spin"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="45 25"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </form>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
        />
      )}
    </div>
  );
}
