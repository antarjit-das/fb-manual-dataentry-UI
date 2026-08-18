"use client";

/**
 * StatusBar — Displays save status, errors, and loading states.
 *
 * Renders as an alert bar at the top of the form. Shows:
 *  - Success message with post ID and counts after save
 *  - Error message if save fails (form data is preserved)
 *  - Loading spinner during save
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
        <span className="spinner" /> Saving to workbook...
      </div>
    );
  }

  if (status === "success" && result) {
    return (
      <div className="alert alert-success">
        <strong>Saved successfully!</strong> Post{" "}
        <span className="text-mono">{result.postId}</span> with{" "}
        {result.commentsWritten} comment{result.commentsWritten !== 1 ? "s" : ""}{" "}
        and {result.repliesWritten} repl{result.repliesWritten !== 1 ? "ies" : "y"}{" "}
        written.
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="alert alert-error">
        <strong>Save failed.</strong> {error}
        <br />
        <small>Your form data has been preserved. Please try again.</small>
      </div>
    );
  }

  return null;
}
