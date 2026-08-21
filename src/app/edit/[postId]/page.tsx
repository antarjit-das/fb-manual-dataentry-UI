"use client";

/**
 * /edit/[postId] — Edit/Reopen existing post record.
 *
 * Designed with a clean, dark-mode research workspace feel.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import PostForm from "@/components/post/PostForm";
import type { PostFormData, SaveResult } from "@/lib/types";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postData, setPostData] = useState<PostFormData | null>(null);
  const [savedResult, setSavedResult] = useState<SaveResult | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || `Failed to load post ${postId}`);
        }
        const data = await res.json();
        setPostData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleSuccess = (result: SaveResult) => {
    setSavedResult(result);
  };

  return (
    <div>
      <div className="flex-between mb-2" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2>
            Edit Record: <span className="text-mono" style={{ color: "var(--accent-text)" }}>{postId}</span>
          </h2>
          <p className="text-secondary" style={{ fontSize: "0.8125rem", marginTop: "0.2rem" }}>
            Reopen collected records, modify metadata, or append additional comments and replies.
          </p>
        </div>
        <Link href="/" className="btn btn-secondary btn-sm">
          ← Dashboard
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "var(--text-tertiary)" }}>
          <span className="spinner" style={{ marginRight: "0.5rem" }} /> Loading record <span className="text-mono">{postId}</span> from workbook...
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <div>
            <strong>Error loading record:</strong> {error}
            <div style={{ marginTop: "0.5rem" }}>
              <Link href="/" className="btn btn-secondary btn-sm">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {savedResult && (
        <div className="card mb-2" style={{ borderLeft: "3px solid var(--success-border)", backgroundColor: "var(--bg-surface-elevated)" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--success-text)" }}>
            Post Updated Successfully
          </div>
          <p style={{ marginTop: "0.4rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Record <strong className="text-mono text-primary">{savedResult.postId}</strong> has been updated in the dataset with {savedResult.commentsWritten} comment(s) and {savedResult.repliesWritten} reply/replies.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <Link href="/" className="btn btn-primary btn-sm">
              Return to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setSavedResult(null);
                window.location.reload();
              }}
              className="btn btn-secondary btn-sm"
            >
              Continue Editing
            </button>
          </div>
        </div>
      )}

      {!loading && !error && postData && !savedResult && (
        <PostForm
          mode="edit"
          initialData={postData}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
