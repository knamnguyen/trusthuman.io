import React from "react";

/**
 * ErrorDisplay Component
 *
 * PRESENTATIONAL COMPONENT - Pure UI rendering only
 * - Receives error data and clear handler via props from parent (Popup.tsx)
 * - No state management, no business logic, no side effects
 * - Parent component (Popup.tsx) handles all error state management and clearing
 * - This component only renders the red debug info section when errors exist
 */

interface ErrorDisplayProps {
  lastError: { message: React.ReactNode; [key: string]: any } | null;
  onClearError: () => void;
}

export default function ErrorDisplay({
  lastError,
  onClearError,
}: ErrorDisplayProps) {
  if (!lastError) return null;

  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-red-800">🐛 Debug Info</span>
        <button
          onClick={onClearError}
          className="text-xs text-red-600 hover:text-red-800"
        >
          ✕ Clear
        </button>
      </div>
      <div className="space-y-1 text-xs text-red-700">
        <div>
          <strong>Message:</strong> {lastError.message}
        </div>
        {lastError.status && (
          <div>
            <strong>Status:</strong> {lastError.status} - {lastError.statusText}
          </div>
        )}
        {lastError.apiKey && (
          <div>
            <strong>API Key:</strong> {lastError.apiKey}
          </div>
        )}
        {lastError.styleGuide && (
          <div>
            <strong>Style Guide:</strong> {lastError.styleGuide}
          </div>
        )}
        {lastError.postContentLength !== undefined && (
          <div>
            <strong>Post Length:</strong> {lastError.postContentLength} chars
          </div>
        )}
        {lastError.body && (
          <div className="mt-2">
            <strong>Response:</strong>
            <pre className="mt-1 max-h-20 overflow-x-auto rounded bg-red-100 p-2 text-xs">
              {typeof lastError.body === "string"
                ? lastError.body
                : JSON.stringify(lastError.body, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
