"use client";

/**
 * StatusBar — Displays save status, errors, and loading states.
 *
 * Designed with restrained dark styling (muted greens, reds, and blues).
 */

import type { SaveResult } from "@/lib/types";

interface StatusBarProps {
  status: "idle" | "saving" | "success" | "error";
  result?: SaveResult | null;
  error?: string | null;
}

export default function StatusBar({ status, result, error }: StatusBarProps) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <div className="alert alert-info">
        <span className="spinner" />
        <span>Saving changes to local Excel workbook...</span>
      </div>
    );
  }

  if (status === "success" && result) {
    return (
      <div className="alert alert-success">
        <div>
          <strong>Saved successfully:</strong> Post{" "}
          <span className="text-mono" style={{ textDecoration: "underline" }}>
            {result.postId}
          </span>{" "}
          with {result.commentsWritten} comment{result.commentsWritten !== 1 ? "s" : ""}{" "}
          and {result.repliesWritten} repl{result.repliesWritten !== 1 ? "ies" : "y"}{" "}
          persisted.
        </div>
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="alert alert-error">
        <div>
          <strong>Save operation failed:</strong> {error}
          <div style={{ fontSize: "0.75rem", marginTop: "0.2rem", color: "var(--text-secondary)" }}>
            Your entered form data remains completely intact in memory. Please check fields and retry.
          </div>
        </div>
      </div>
    );
  }

  return null;
}
