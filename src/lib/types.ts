/**
 * types.ts — TypeScript types inferred from Zod schemas.
 *
 * Never define types manually here. Always derive them from schemas.ts
 * so there is a single source of truth for the data shape.
 */

import { z } from "zod";
import {
  PostSchema,
  CommentSchema,
  ReplySchema,
  SourceSchema,
  PostFormSchema,
  CommentFormSchema,
  CanonicalCommentSchema,
  CanonicalDatasetSchema,
  type CanonicalReply,
  type ReplyFormData,
  type CountPrecision,
  PRECISION_TYPES,
} from "./schemas.ts";

export type { CountPrecision };
export { PRECISION_TYPES };

// ────────────────────────────────────────────────────────────────────────────
// Canonical JSON schema types (Contract for external JSON & Parser output)
// ────────────────────────────────────────────────────────────────────────────

export type { CanonicalReply };
export type CanonicalComment = z.infer<typeof CanonicalCommentSchema>;
export type CanonicalDataset = z.infer<typeof CanonicalDatasetSchema>;

export interface ParseMetrics {
  commentsDetected: number;
  repliesDetected: number;
  mediaOnlyDiscarded: number;
  ambiguousRecords: number;
}

export interface ParseResult {
  dataset: CanonicalDataset;
  metrics: ParseMetrics;
  warnings?: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Flat sheet-row types (one type = one row in the corresponding Excel sheet)
// ────────────────────────────────────────────────────────────────────────────

/** One row in the POSTS sheet. */
export type Post = z.infer<typeof PostSchema>;

/** One row in the COMMENTS sheet. */
export type Comment = z.infer<typeof CommentSchema>;

/** One row in the REPLIES sheet. */
export type Reply = z.infer<typeof ReplySchema>;

/** One row in the SOURCES sheet. */
export type Source = z.infer<typeof SourceSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Form payload types (hierarchical — what the UI sends to the API)
// ────────────────────────────────────────────────────────────────────────────

/** A single reply as entered in the form (recursive tree). */
export type { ReplyFormData };

/** A single comment with nested replies as entered in the form. */
export type CommentFormData = z.infer<typeof CommentFormSchema>;

/** The full form payload: one post with N comments, each with recursive M replies. */
export type PostFormData = z.infer<typeof PostFormSchema>;

// ────────────────────────────────────────────────────────────────────────────
// API response types
// ────────────────────────────────────────────────────────────────────────────

/** Returned by the summary endpoint for the dashboard. */
export interface DataSummary {
  postCount: number;
  commentCount: number;
  replyCount: number;
  lastSaved: string | null; // ISO timestamp or null if no data yet
}

/** Returned on a successful save. */
export interface SaveResult {
  postId: string;
  commentsWritten: number;
  repliesWritten: number;
  timestamp: string;
}

/** A row in the recent-records table on the home page. */
export interface PostSummaryRow {
  post_id: string;
  source_name: string;
  content_type: string;
  original_post_date: string | null | undefined;
  commentCount: number;
  replyCount: number;
  collection_timestamp: string;
}
