"use client";

/**
 * /collect — Post collection workspace.
 *
 * Provides a dedicated view for entering a new post, with unsaved change
 * warnings and redirection to the dashboard upon successful save.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostForm from "@/components/post/PostForm";
import type { SaveResult } from "@/lib/types";

export default function CollectPage() {
  const router = useRouter();
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
      <div className="flex-between mb-2">
        <div>
          <h2>Insert New Post</h2>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            Enter post metadata, comments, and replies in a single workspace. IDs are assigned automatically on save.
          </p>
        </div>
        <Link href="/" className="btn btn-outline">
          ← Back to Dashboard
        </Link>
      </div>

      {savedResult && (
        <div className="card mb-2" style={{ borderLeft: "4px solid var(--color-success)" }}>
          <div className="card-title text-success">Saved Successfully!</div>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
            Post <strong className="text-mono">{savedResult.postId}</strong> has been written to the workbook with {savedResult.commentsWritten} comment(s) and {savedResult.repliesWritten} reply/replies.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => {
                setSavedResult(null);
                window.location.reload();
              }}
              className="btn btn-primary"
            >
              + Collect Another Post
            </button>
            <Link href="/" className="btn btn-outline">
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
