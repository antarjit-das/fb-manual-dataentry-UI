/**
 * mappers.ts — Bidirectional conversion between domain objects and Excel rows.
 *
 * "Domain → Row" is used when writing to the workbook.
 * "Row → Domain" is used when reading back for edit/reopen.
 *
 * Rules (AGENTS.md):
 *  - Preserve original text unchanged.
 *  - Do not silently add or remove fields.
 */

import type { Post, Comment, Reply, Source } from "../types";
import {
  POST_COLUMNS,
  COMMENT_COLUMNS,
  REPLY_COLUMNS,
  SOURCE_COLUMNS,
} from "./templates";

// ────────────────────────────────────────────────────────────────────────────
// Generic helpers
// ────────────────────────────────────────────────────────────────────────────

/** Convert a cell value to string, handling null/undefined. */
function cellToString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  return String(value);
}

/** Convert a cell value to number | null, handling blank cells. */
function cellToNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

// ────────────────────────────────────────────────────────────────────────────
// POST mappers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Convert a Post domain object into an ordered array of cell values
 * matching POST_COLUMNS.
 */
export function postToRow(post: Post): unknown[] {
  return POST_COLUMNS.map((col) => {
    const value = post[col as keyof Post];
    // Engagement counts: write null as empty cell
    if (value === null || value === undefined) return "";
    return value;
  });
}

/**
 * Convert an Excel row (as key-value record) back into a Post domain object.
 */
export function rowToPost(row: Record<string, unknown>): Post {
  return {
    post_id: String(row.post_id ?? ""),
    platform: String(row.platform ?? "Facebook"),
    content_type: String(row.content_type ?? "Post") as Post["content_type"],
    post_url: cellToString(row.post_url),
    source_name: String(row.source_name ?? ""),
    source_type: String(row.source_type ?? "Other") as Post["source_type"],
    source_url: cellToString(row.source_url),
    original_post_date: cellToString(row.original_post_date),
    collection_date: String(row.collection_date ?? ""),
    collection_timestamp: String(row.collection_timestamp ?? ""),
    language: String(row.language ?? "Other") as Post["language"],
    is_code_mixed: String(row.is_code_mixed ?? "No") as Post["is_code_mixed"],
    topic: cellToString(row.topic),
    subtopic: cellToString(row.subtopic),
    content_stance: cellToString(row.content_stance) as Post["content_stance"],
    post_text: cellToString(row.post_text),
    transcript: cellToString(row.transcript),
    media_description: cellToString(row.media_description),
    view_count: cellToNumber(row.view_count),
    reaction_count: cellToNumber(row.reaction_count),
    like_count: cellToNumber(row.like_count),
    love_count: cellToNumber(row.love_count),
    haha_count: cellToNumber(row.haha_count),
    angry_count: cellToNumber(row.angry_count),
    sad_count: cellToNumber(row.sad_count),
    wow_count: cellToNumber(row.wow_count),
    care_count: cellToNumber(row.care_count),
    share_count: cellToNumber(row.share_count),
    comment_count: cellToNumber(row.comment_count),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// COMMENT mappers
// ────────────────────────────────────────────────────────────────────────────

export function commentToRow(comment: Comment): unknown[] {
  return COMMENT_COLUMNS.map((col) => {
    const value = comment[col as keyof Comment];
    if (value === null || value === undefined) return "";
    return value;
  });
}

export function rowToComment(row: Record<string, unknown>): Comment {
  return {
    comment_id: String(row.comment_id ?? ""),
    post_id: String(row.post_id ?? ""),
    comment_text: String(row.comment_text ?? ""),
    comment_date: cellToString(row.comment_date),
    language: cellToString(row.language) as Comment["language"],
    is_code_mixed: cellToString(row.is_code_mixed) as Comment["is_code_mixed"],
    like_count: cellToNumber(row.like_count),
    reply_count: cellToNumber(row.reply_count),
    collection_timestamp: String(row.collection_timestamp ?? ""),
    notes: cellToString(row.notes),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// REPLY mappers
// ────────────────────────────────────────────────────────────────────────────

export function replyToRow(reply: Reply): unknown[] {
  return REPLY_COLUMNS.map((col) => {
    const value = reply[col as keyof Reply];
    if (value === null || value === undefined) return "";
    return value;
  });
}

export function rowToReply(row: Record<string, unknown>): Reply {
  return {
    reply_id: String(row.reply_id ?? ""),
    comment_id: String(row.comment_id ?? ""),
    post_id: String(row.post_id ?? ""),
    reply_text: String(row.reply_text ?? ""),
    reply_date: cellToString(row.reply_date),
    language: cellToString(row.language) as Reply["language"],
    is_code_mixed: cellToString(row.is_code_mixed) as Reply["is_code_mixed"],
    like_count: cellToNumber(row.like_count),
    collection_timestamp: String(row.collection_timestamp ?? ""),
    notes: cellToString(row.notes),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// SOURCE mappers
// ────────────────────────────────────────────────────────────────────────────

export function sourceToRow(source: Source): unknown[] {
  return SOURCE_COLUMNS.map((col) => {
    const value = source[col as keyof Source];
    if (value === null || value === undefined) return "";
    return value;
  });
}

export function rowToSource(row: Record<string, unknown>): Source {
  return {
    source_id: String(row.source_id ?? ""),
    source_name: String(row.source_name ?? ""),
    source_type: String(row.source_type ?? "Other") as Source["source_type"],
    source_url: cellToString(row.source_url),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Row reading helper — convert an ExcelJS row into a keyed record
// ────────────────────────────────────────────────────────────────────────────

/**
 * Given column headers and a row's cell values, produce a key-value object.
 * ExcelJS rows are 1-indexed and the first element is often undefined.
 */
export function rowToRecord(
  headers: readonly string[],
  values: unknown[]
): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  headers.forEach((header, i) => {
    // ExcelJS cell values array may be offset by 1 depending on how we read
    record[header] = values[i];
  });
  return record;
}
