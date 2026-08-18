"use client";

/**
 * /edit/[postId] — Edit/Reopen existing post record.
 *
 * Fetches the post with all its comments and replies from the Excel workbook,
 * fills PostForm with initialData, and submits via PUT to update in-place.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostForm from "@/components/post/PostForm";
import type { PostFormData, SaveResult } from "@/lib/types";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const router = useRouter();
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
      <div className="flex-between mb-2">
        <div>
          <h2>
            Edit Post: <span className="text-mono">{postId}</span>
          </h2>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            Reopen collected records, modify metadata, or add additional comments/replies safely.
          </p>
        </div>
        <Link href="/" className="btn btn-outline">
          ← Back to Dashboard
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <span className="spinner" /> Loading record <span className="text-mono">{postId}</span>...
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
          <div style={{ marginTop: "0.5rem" }}>
            <Link href="/" className="btn btn-outline btn-sm">
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}

      {savedResult && (
        <div className="card mb-2" style={{ borderLeft: "4px solid var(--color-success)" }}>
          <div className="card-title text-success">Updated Successfully!</div>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
            Post <strong className="text-mono">{savedResult.postId}</strong> was updated in the workbook with {savedResult.commentsWritten} comment(s) and {savedResult.repliesWritten} reply/replies.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <Link href="/" className="btn btn-primary">
              Return to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setSavedResult(null);
                window.location.reload();
              }}
              className="btn btn-outline"
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
