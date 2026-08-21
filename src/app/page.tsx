"use client";

/**
 * Dashboard / Home Page (product_guide §4.1)
 *
 * Minimalist dark design with clean typography and understated cards.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DataSummary, PostSummaryRow } from "@/lib/types";

export default function HomePage() {
  const [summary, setSummary] = useState<DataSummary>({
    postCount: 0,
    commentCount: 0,
    replyCount: 0,
    lastSaved: null,
  });
  const [posts, setPosts] = useState<PostSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setError(null);
      try {
        const [sumRes, postsRes] = await Promise.all([
          fetch("/api/summary"),
          fetch("/api/posts"),
        ]);

        if (!sumRes.ok || !postsRes.ok) {
          throw new Error("Failed to load dataset records from the local workbook.");
        }

        const sumJson = await sumRes.json();
        const postsJson = await postsRes.json();

        if (isMounted) {
          setSummary(sumJson);
          setPosts(postsJson);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load dashboard data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatLastSaved = (ts: string | null) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return ts;
    }
  };

  return (
    <div>
      {/* Top Banner & Primary Action */}
      <div className="flex-between mb-2" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2>Research Collection Overview</h2>
          <p className="text-secondary" style={{ fontSize: "0.8125rem", marginTop: "0.2rem" }}>
            Local storage target: <span className="text-mono text-tertiary">data/facebook_dataset.xlsx</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <Link href="/collect" className="btn btn-primary btn-sm">
            + Insert New Post
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div>
            <strong>Failed to synchronize:</strong> {error}
          </div>
        </div>
      )}

      {/* Dataset Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="label">Total Posts / Reels</div>
          <div className="count">{summary.postCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Comments</div>
          <div className="count">{summary.commentCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">Total Replies</div>
          <div className="count">{summary.replyCount}</div>
        </div>
        <div className="summary-card">
          <div className="label">Last Persisted</div>
          <div className="count-sub text-mono">
            {formatLastSaved(summary.lastSaved)}
          </div>
        </div>
      </div>

      {/* Recent Records Table */}
      <div className="card" style={{ padding: "1rem 1.25rem" }}>
        <div className="card-header" style={{ marginBottom: "0.75rem" }}>
          <div className="card-title">
            Persisted Records ({posts.length})
          </div>
          {posts.length > 0 && (
            <span className="text-tertiary" style={{ fontSize: "0.75rem" }}>
              Click Edit to reopen and inspect
            </span>
          )}
        </div>

        {loading && posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-tertiary)" }}>
            <span className="spinner" style={{ marginRight: "0.5rem" }} /> Loading workbook data...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1rem" }}>
            <p className="text-tertiary mb-2" style={{ fontSize: "0.875rem" }}>
              No Facebook records currently collected in the dataset.
            </p>
            <Link href="/collect" className="btn btn-primary btn-sm">
              Insert First Post Record
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Post Identifier</th>
                  <th>Source / Page</th>
                  <th>Content Type</th>
                  <th>Original Date</th>
                  <th>Comments</th>
                  <th>Replies</th>
                  <th>Collection Date</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.post_id}>
                    <td>
                      <span className="text-mono" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {p.post_id}
                      </span>
                    </td>
                    <td>{p.source_name}</td>
                    <td>
                      <span className="text-secondary">{p.content_type}</span>
                    </td>
                    <td>
                      <span className="text-tertiary">{p.original_post_date || "—"}</span>
                    </td>
                    <td>{p.commentCount}</td>
                    <td>{p.replyCount}</td>
                    <td style={{ fontSize: "0.75rem" }} className="text-tertiary text-mono">
                      {formatLastSaved(p.collection_timestamp)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/edit/${p.post_id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
