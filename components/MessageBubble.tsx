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
        {/* Icon */}
        {invocation.state !== "result" ? (
          <svg
            className="animate-spin"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="40 20"
            />
          </svg>
        ) : isError ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v5M12 15v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        <span>
          {toolLabel}: <span className="font-mono">{tableName}</span>
          {resultCount !== null && !isError && (
            <span className="text-violet-400/70"> · {resultCount} rows</span>
          )}
          {isError && <span className="text-red-400/70"> · error</span>}
        </span>

        {/* Expand chevron */}
        <svg
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 px-3`}>
      <div
        className={`max-w-[88%] ${isUser ? "max-w-[78%]" : "max-w-[92%]"}`}
      >
        {/* Tool pills — shown above assistant messages */}
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
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            ) : (
              <div className="text-sm leading-relaxed prose-dark">
                {isStreaming && !content ? (
                  <div className="dot-pulse flex gap-1 items-center py-1">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <ReactMarkdown
                    components={{
                      // Open links in new tab
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      // Prevent nesting issues
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
      </div>
    </div>
  );
}
