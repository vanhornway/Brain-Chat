"use client";

import { useChat } from "ai/react";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import MessageBubble from "./MessageBubble";
import SettingsPanel from "./SettingsPanel";
import { loadSettings, ChatSettings } from "@/lib/providers";

interface PendingImage {
  url: string;
  name: string;
  contentType: string;
}

interface ChatSession {
  id: string;
  title: string;
  provider: string;
  model_id: string;
  created_at: string;
  updated_at: string;
}

interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: "call" | "partial-call" | "result";
  args?: Record<string, unknown>;
  result?: unknown;
}

// Shortcuts: pre-built prompts the user can fire with one tap
const SHORTCUTS = [
  {
    id: "capture-thought",
    label: "Capture a Thought",
    icon: "💭",
    prompt: "",
    isThought: true,
  },
  {
    id: "hike-image",
    label: "Hike Summary Image",
    icon: "🏔",
    prompt:
      "Pull today's hike data from Strava (personal_hikes), my CGM readings (blood_glucose) and Fitbit HR zones (health_metrics) for the hike window, then retrieve the hike-image prompt template from prompt_templates and fill in all the [[PLACEHOLDER]] variables with today's actual data. Output the fully filled prompt so I can paste it into Gemini to generate the image.",
  },
  {
    id: "daily-health",
    label: "Daily Health Summary",
    icon: "❤️",
    prompt:
      "Give me a summary of my health metrics for today: blood glucose trends, any workouts, weight if logged, and any notable readings. Keep it concise.",
  },
  {
    id: "finances",
    label: "Finance Snapshot",
    icon: "💰",
    prompt:
      "Show me my current financial snapshot: latest net worth, YTD income, and any rental income or expenses this month.",
  },
  {
    id: "scout-progress",
    label: "Scout Progress",
    icon: "⚜️",
    prompt:
      "What is Nyel's current scout rank and progress toward Eagle? What badges does he still need?",
  },
];

export default function ChatInterface() {
  const [settings, setSettings] = useState<ChatSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);

  // Chat history state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Image generation state
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // OpenRouter credit warning
  const [creditRemaining, setCreditRemaining] = useState<number | null>(null);

  // Current user email
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Keep a ref in sync with messages so onFinish can read the latest value
  const messagesRef = useRef<typeof messages>([]);

  useEffect(() => {
    setHasKey(settings.apiKey.trim().length > 0);
  }, [settings]);

  // Check OpenRouter credit balance whenever the API key changes
  useEffect(() => {
    if (settings.provider !== "openrouter" || !settings.apiKey.trim()) {
      setCreditRemaining(null);
      return;
    }
    fetch("/api/credit-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: settings.apiKey }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.limit_remaining === "number") setCreditRemaining(d.limit_remaining);
      })
      .catch(() => {});
  }, [settings.apiKey, settings.provider]);

  // Fetch current user info
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.email) setUserEmail(d.email);
      })
      .catch(() => {});
  }, []);

  const currentSessionIdRef = useRef<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages, setInput } =
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
      onFinish: async () => {
        // Auto-save after each completed AI response
        // We read from the ref so we always have the latest session ID
        try {
          const res = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: messagesRef.current,
              provider: settings.provider,
              modelId: settings.modelId,
              sessionId: currentSessionIdRef.current,
            }),
          });
          const data = await res.json();
          if (data.id && !currentSessionIdRef.current) {
            currentSessionIdRef.current = data.id;
            setCurrentSessionId(data.id);
          }
        } catch (err) {
          console.error("Auto-save failed:", err);
        }
      },
    });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage({ url: reader.result as string, name: file.name, contentType: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((input.trim() || pendingImage) && !isLoading && hasKey) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>, {
          experimental_attachments: pendingImage ? [pendingImage] : undefined,
        });
        setPendingImage(null);
        if (inputRef.current) inputRef.current.style.height = "auto";
      }
    }
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ((input.trim() || pendingImage) && !isLoading && hasKey) {
      handleSubmit(e, {
        experimental_attachments: pendingImage ? [pendingImage] : undefined,
      });
      setPendingImage(null);
      if (inputRef.current) inputRef.current.style.height = "auto";
    }
  }

  function handleShortcut(prompt: string, isThought?: boolean) {
    setShowShortcuts(false);
    if (isThought) {
      setInput("");
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.placeholder = "Type your thought and send...";
          inputRef.current.focus();
        }
      }, 50);
      return;
    }
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Load history list
  async function handleOpenHistory() {
    setIsLoadingHistory(true);
    setShowHistory(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  // Load a specific session
  async function handleLoadSession(id: string) {
    try {
      const res = await fetch(`/api/history/${id}`);
      const data = await res.json();
      if (data.messages) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMessages(data.messages as any);
        setCurrentSessionId(id);
        currentSessionIdRef.current = id;
        setGeneratedImages({});
        setShowHistory(false);
      }
    } catch (err) {
      console.error("Failed to load session", err);
    }
  }

  // Generate image from a message's content
  async function handleGenerateImage(messageId: string, content: string) {
    if (settings.provider !== "google") {
      setImageError("Image generation requires a Google API key (switch provider to Google in settings).");
      setTimeout(() => setImageError(null), 4000);
      return;
    }
    setGeneratingImageFor(messageId);
    setImageError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, apiKey: settings.apiKey }),
      });
      const data = await res.json();
      if (data.base64) {
        setGeneratedImages((prev) => ({ ...prev, [messageId]: data.base64 }));
      } else {
        setImageError(data.error ?? "Image generation failed.");
        setTimeout(() => setImageError(null), 5000);
      }
    } catch (err) {
      setImageError((err as Error).message);
      setTimeout(() => setImageError(null), 5000);
    } finally {
      setGeneratingImageFor(null);
    }
  }

  const handleSettingsSave = useCallback((newSettings: ChatSettings) => {
    setSettings(newSettings);
  }, []);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3c-1.5 0-2.9.5-4 1.3C6.8 5.4 6 7.1 6 9c0 1.1.3 2.1.8 3-.5.9-.8 1.9-.8 3 0 2.8 2.1 5.1 4.8 5.4.4.1.8.1 1.2.1s.8 0 1.2-.1C15.9 20.1 18 17.8 18 15c0-1.1-.3-2.1-.8-3 .5-.9.8-1.9.8-3 0-1.9-.8-3.6-2-4.7C14.9 3.5 13.5 3 12 3z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary leading-tight">
              Brain Chat {userEmail && `(${userEmail})`}
            </h1>
            <p className="text-xs text-text-muted leading-tight">
              {hasKey
                ? `${settings.provider === "anthropic" ? "Anthropic" : settings.provider === "google" ? "Gemini" : "OpenRouter"} · ${settings.modelId}`
                : "No API key — open settings"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Shortcuts button */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
            aria-label="Shortcuts"
            title="Shortcuts"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* History button */}
          <button
            onClick={handleOpenHistory}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
            aria-label="Chat history"
            title="Chat history"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.05 11a9 9 0 1 0 .5-4M3 4v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              !hasKey
                ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                : "bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
            }`}
            aria-label="Open settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          {/* Logout button */}
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2 text-text-secondary hover:bg-red-500/20 hover:text-red-400 transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto py-4"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.length === 0 && (
          <div className="px-3 mb-3">
            <div className="max-w-[92%] bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="text-sm leading-relaxed prose-dark">
                <p className="mb-2">
                  Hi! I&apos;m your personal AI assistant. I have access to your life database — ask me about:
                </p>
                <ul className="space-y-0.5 ml-4 list-disc">
                  <li><strong>Health</strong> — blood glucose, blood pressure, weight, workouts, medications, lab results</li>
                  <li><strong>Hiking</strong> — BAD Hikers group hikes and personal Strava activities</li>
                  <li><strong>Finance</strong> — income, net worth, donations, rental properties</li>
                  <li><strong>Family</strong> — kids&apos; school calendars, scout progress, college prep</li>
                  <li><strong>Notes</strong> — thoughts, goals, plans</li>
                </ul>
                <p className="mt-3 text-text-muted text-xs">
                  Tap ⚡ for quick shortcuts · 🕐 for chat history
                </p>
                {!hasKey && (
                  <p className="mt-2 text-amber-300 text-xs">
                    Tap the settings icon above to add your API key.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role as "user" | "assistant"}
            content={message.content}
            toolInvocations={message.toolInvocations as ToolInvocation[] | undefined}
            onGenerateImage={
              message.role === "assistant" && message.content
                ? () => handleGenerateImage(message.id, message.content)
                : undefined
            }
            isGeneratingImage={generatingImageFor === message.id}
            generatedImageBase64={generatedImages[message.id]}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-3 px-3">
            <div className="bg-surface-2 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="dot-pulse flex gap-1.5 items-center">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {creditRemaining !== null && creditRemaining < 5 && (
          <div className="mx-3 mb-3 bg-amber-950/40 border border-amber-700/40 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-amber-400 text-base leading-none mt-0.5">⚠️</span>
            <div>
              <p className="text-amber-300 text-xs font-medium">Low OpenRouter credit</p>
              <p className="text-amber-300/70 text-xs mt-0.5">
                ${creditRemaining.toFixed(2)} remaining.{" "}
                <a
                  href="https://openrouter.ai/credits"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-amber-200"
                >
                  Add credits →
                </a>
              </p>
            </div>
          </div>
        )}

        {(error || imageError) && (
          <div className="mx-3 mb-3 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm font-medium mb-0.5">
              {error?.message === "OUT_OF_CREDITS" ? "Out of credits" : "Error"}
            </p>
            <p className="text-red-300/80 text-xs">
              {error?.message === "OUT_OF_CREDITS" ? (
                <>
                  Your OpenRouter account has no remaining credits.{" "}
                  <a
                    href="https://openrouter.ai/credits"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-red-200"
                  >
                    Add credits at openrouter.ai →
                  </a>
                </>
              ) : (
                imageError || error?.message || "Something went wrong. Check your API key and try again."
              )}
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

        {pendingImage && (
          <div className="mb-2 flex items-center gap-2">
            <div className="relative">
              <Image
                src={pendingImage.url}
                alt="Attachment preview"
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-surface-3 border border-border rounded-full flex items-center justify-center text-text-muted hover:text-text-primary"
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-text-muted">Image attached — describe what to do with it or just send</p>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Camera button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!hasKey || isLoading}
            className="flex-none w-11 h-11 flex items-center justify-center rounded-2xl bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Attach image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { handleInputChange(e); autoResize(e.target); }}
              onKeyDown={handleKeyDown}
              placeholder={hasKey ? "Ask about your health, hiking, finances..." : "Configure API key in settings to chat"}
              disabled={!hasKey || isLoading}
              rows={1}
              className="w-full bg-surface-2 border border-border rounded-2xl px-4 py-3 pr-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-light transition-colors resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
              style={{ minHeight: "46px", maxHeight: "120px" }}
            />
          </div>

          <button
            type="submit"
            disabled={(!input.trim() && !pendingImage) || !hasKey || isLoading}
            className={`flex-none w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${
              (input.trim() || pendingImage) && hasKey && !isLoading
                ? "bg-accent text-white shadow-lg shadow-accent/30 active:scale-95"
                : "bg-surface-2 text-text-muted cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            {isLoading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="45 25" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </form>
      </div>

      {/* Shortcuts panel */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowShortcuts(false)}>
          <div
            className="w-full max-w-lg bg-surface border-t border-border rounded-t-3xl px-4 pt-4 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-surface-3 rounded-full mx-auto mb-4" />
            <h2 className="text-sm font-semibold text-text-primary mb-3 px-1">Quick Shortcuts</h2>
            <div className="space-y-2">
              {SHORTCUTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleShortcut(s.prompt, (s as { isThought?: boolean }).isThought)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-2 border border-border hover:bg-surface-3 hover:border-accent-light/30 transition-colors text-left"
                >
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm font-medium text-text-primary">{s.label}</span>
                  <svg className="ml-auto text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History panel */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowHistory(false)}>
          <div
            className="w-full max-w-sm bg-surface border-r border-border h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">Chat History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* New chat button */}
            <div className="px-4 py-3 border-b border-border">
              <button
                onClick={() => { setMessages([]); setCurrentSessionId(null); currentSessionIdRef.current = null; setGeneratedImages({}); setShowHistory(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent-light text-sm font-medium hover:bg-accent/20 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12 text-text-muted text-sm">
                  Loading...
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-text-muted text-sm">
                  No saved chats yet. Hit the save button after a conversation.
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleLoadSession(session.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors border-b border-border/50 ${
                      session.id === currentSessionId ? "bg-accent/10 border-l-2 border-l-accent" : ""
                    }`}
                  >
                    <p className="text-sm font-medium text-text-primary truncate">{session.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{formatDate(session.updated_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
