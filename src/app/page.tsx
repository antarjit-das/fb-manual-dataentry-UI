"use client";

/**
 * Dashboard / Home Page (product_guide §4.1)
 *
 * Features:
 *  - Primary CTA: "+ Insert New Post"
 *  - Dataset summary cards: Posts, Comments, Replies, Last Saved
 *  - Recent records table: Post ID, Source, Content Type, Original Date, Comments, Replies, Saved At, Actions
 *  - Refresh button
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

  const fetchData = async () => {
    setLoading(true);
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

      setSummary(sumJson);
      setPosts(postsJson);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatLastSaved = (ts: string | null) => {
    if (!ts) return "No records yet";
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
      <div className="flex-between mb-2">
        <div>
          <h2>Research Collection Dashboard</h2>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            Local-first Excel workbook persistence: <span className="text-mono">data/facebook_dataset.xlsx</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="btn btn-outline"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <Link href="/collect" className="btn btn-primary">
            + Insert New Post
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Dataset Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="count">{summary.postCount}</div>
          <div className="label">Total Posts / Reels</div>
        </div>
        <div className="summary-card">
          <div className="count">{summary.commentCount}</div>
          <div className="label">Total Comments</div>
        </div>
        <div className="summary-card">
          <div className="count">{summary.replyCount}</div>
          <div className="label">Total Replies</div>
        </div>
        <div className="summary-card">
          <div className="count" style={{ fontSize: "1.15rem", paddingTop: "0.6rem" }}>
            {formatLastSaved(summary.lastSaved)}
          </div>
          <div className="label">Last Saved Timestamp</div>
        </div>
      </div>

      {/* Recent Records Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Collected Records ({posts.length})</div>
          {posts.length > 0 && (
            <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
              Click &quot;Edit&quot; to inspect or update any post
            </span>
          )}
        </div>

        {loading && posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <span className="spinner" /> Loading dataset from Excel workbook...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p className="text-muted mb-2">
              No posts collected yet in the dataset workbook.
            </p>
            <Link href="/collect" className="btn btn-primary">
              Start Collecting Your First Post
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Post ID</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Original Date</th>
                  <th>Comments</th>
                  <th>Replies</th>
                  <th>Collected At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.post_id}>
                    <td>
                      <span className="text-mono" style={{ fontWeight: 600 }}>
                        {p.post_id}
                      </span>
                    </td>
                    <td>{p.source_name}</td>
                    <td>
                      <span className="text-muted">{p.content_type}</span>
                    </td>
                    <td>{p.original_post_date || "—"}</td>
                    <td>{p.commentCount}</td>
                    <td>{p.replyCount}</td>
                    <td style={{ fontSize: "0.8125rem" }} className="text-muted">
                      {formatLastSaved(p.collection_timestamp)}
                    </td>
                    <td>
                      <Link
                        href={`/edit/${p.post_id}`}
                        className="btn btn-outline btn-sm"
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
