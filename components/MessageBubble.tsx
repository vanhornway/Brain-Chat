"use client";

import ReactMarkdown from "react-markdown";
import { useState } from "react";

interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: "call" | "partial-call" | "result";
  args?: Record<string, unknown>;
  result?: unknown;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
  isStreaming?: boolean;
  onGenerateImage?: () => void;
  isGeneratingImage?: boolean;
  generatedImageBase64?: string;
}

function ToolPill({
  invocation,
}: {
  invocation: ToolInvocation;
}) {
  const [expanded, setExpanded] = useState(false);

  const tableName =
    (invocation.args?.table as string) ||
    (invocation.args?.query as string) ||
    "table";

  const resultCount =
    invocation.state === "result" &&
    invocation.result &&
    typeof invocation.result === "object" &&
    "count" in (invocation.result as object)
      ? (invocation.result as { count: number }).count
      : null;

  const isError: boolean =
    invocation.state === "result" &&
    invocation.result != null &&
    typeof invocation.result === "object" &&
    "success" in (invocation.result as object) &&
    !(invocation.result as { success: boolean }).success;

  const toolLabel =
    invocation.toolName === "query_table"
      ? "Queried"
      : invocation.toolName === "search_table"
      ? "Searched"
      : invocation.toolName === "insert_row"
      ? "Inserted"
      : "Aggregated";

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
          isError
            ? "bg-red-950/50 text-red-400 border border-red-800/40 hover:bg-red-950/70"
            : invocation.state === "result"
            ? "bg-violet-950/50 text-violet-300 border border-violet-800/30 hover:bg-violet-950/70"
            : "bg-surface-3 text-text-muted border border-border animate-pulse"
        }`}
      >
        {invocation.state !== "result" ? (
          <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 20" />
          </svg>
        ) : isError ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v5M12 15v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        <span>
          {toolLabel}: <span className="font-mono">{tableName}</span>
          {resultCount !== null && !isError && (
            <span className="text-violet-400/70"> · {resultCount} rows</span>
          )}
          {isError && <span className="text-red-400/70"> · error</span>}
        </span>

        <svg
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          width="10" height="10" viewBox="0 0 24 24" fill="none"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-1.5 ml-1 bg-surface border border-border rounded-xl p-3 text-xs font-mono text-text-muted overflow-x-auto">
          <div className="mb-1.5 text-text-secondary font-sans font-medium text-xs uppercase tracking-wide">
            {invocation.state === "result" ? "Result" : "Calling..."}
          </div>
          {invocation.state === "result" ? (
            <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
              {JSON.stringify(invocation.result, null, 2)}
            </pre>
          ) : (
            <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed">
              {JSON.stringify(invocation.args, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({
  role,
  content,
  toolInvocations,
  isStreaming,
  onGenerateImage,
  isGeneratingImage,
  generatedImageBase64,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 px-3`}>
      <div className={`${isUser ? "max-w-[78%]" : "max-w-[92%]"} w-full`}>
        {/* Tool pills */}
        {!isUser && toolInvocations && toolInvocations.length > 0 && (
          <div className="mb-2 ml-1">
            {toolInvocations.map((inv) => (
              <ToolPill key={inv.toolCallId} invocation={inv} />
            ))}
          </div>
        )}

        {/* Message bubble */}
        {(content || isStreaming) && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-accent text-white rounded-br-sm"
                : "bg-surface-2 border border-border text-text-primary rounded-bl-sm"
            }`}
          >
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            ) : (
              <div className="text-sm leading-relaxed prose-dark">
                {isStreaming && !content ? (
                  <div className="dot-pulse flex gap-1 items-center py-1">
                    <span /><span /><span />
                  </div>
                ) : (
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                      ),
                      p: ({ children }) => <p>{children}</p>,
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generate Image button — only on non-empty assistant messages */}
        {!isUser && content && !isStreaming && onGenerateImage && (
          <div className="mt-1.5 ml-1">
            <button
              onClick={onGenerateImage}
              disabled={isGeneratingImage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 border border-border text-text-muted hover:text-amber-300 hover:border-amber-600/40 hover:bg-amber-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingImage ? (
                <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="45 25" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {isGeneratingImage ? "Generating image..." : "Generate Image"}
            </button>
          </div>
        )}

        {/* Generated image display */}
        {generatedImageBase64 && (
          <div className="mt-2 ml-1">
            <img
              src={`data:image/png;base64,${generatedImageBase64}`}
              alt="AI generated image"
              className="rounded-2xl max-w-full border border-border shadow-lg"
              style={{ maxHeight: "70vh" }}
            />
            <a
              href={`data:image/png;base64,${generatedImageBase64}`}
              download="brain-image.png"
              className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 border border-border text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
