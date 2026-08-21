"use client";

/**
 * /collect — Post collection workspace.
 *
 * Designed with a clean, dark-mode research workspace feel.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import PostForm from "@/components/post/PostForm";
import type { SaveResult } from "@/lib/types";

export default function CollectPage() {
  const [savedResult, setSavedResult] = useState<SaveResult | null>(null);

  // Warn before closing tab / navigating away if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!savedResult) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [savedResult]);

  const handleSuccess = (result: SaveResult) => {
    setSavedResult(result);
  };

  return (
    <div>
      <div className="flex-between mb-2" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2>Insert New Post</h2>
          <p className="text-secondary" style={{ fontSize: "0.8125rem", marginTop: "0.2rem" }}>
            Capture post metadata, comments, and nested replies. IDs are generated and validated automatically on submission.
          </p>
        </div>
        <Link href="/" className="btn btn-secondary btn-sm">
          ← Dashboard
        </Link>
      </div>

      {savedResult && (
        <div className="card mb-2" style={{ borderLeft: "3px solid var(--success-border)", backgroundColor: "var(--bg-surface-elevated)" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--success-text)" }}>
            Post Persisted Successfully
          </div>
          <p style={{ marginTop: "0.4rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Record <strong className="text-mono text-primary">{savedResult.postId}</strong> was recorded into <span className="text-mono">facebook_dataset.xlsx</span> with {savedResult.commentsWritten} comment(s) and {savedResult.repliesWritten} reply/replies.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => {
                setSavedResult(null);
                window.location.reload();
              }}
              className="btn btn-primary btn-sm"
            >
              + Collect Another Post
            </button>
            <Link href="/" className="btn btn-secondary btn-sm">
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}

      {!savedResult && (
        <PostForm mode="create" onSuccess={handleSuccess} />
      )}
    </div>
  );
}
