/**
 * templates.ts — Sheet definitions, column headers, and CODEBOOK content.
 *
 * This file defines the exact structure of every worksheet in the
 * Excel workbook. The CODEBOOK sheet serves as the source of truth
 * for field definitions and controlled values.
 *
 * MUST NOT be modified without explicit instruction (AGENTS.md rule 4).
 */

// ────────────────────────────────────────────────────────────────────────────
// Sheet names — the canonical list of worksheets in the workbook
// ────────────────────────────────────────────────────────────────────────────

export const SHEET_NAMES = {
  POSTS: "POSTS",
  COMMENTS: "COMMENTS",
  REPLIES: "REPLIES",
  SOURCES: "SOURCES",
  CODEBOOK: "CODEBOOK",
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Column headers — ordered arrays for each data sheet
// ────────────────────────────────────────────────────────────────────────────

export const POST_COLUMNS = [
  "post_id",
  "platform",
  "content_type",
  "post_url",
  "source_name",
  "source_type",
  "original_post_date",
  "collection_date",
  "collection_timestamp",
  "language",
  "post_text",
  "view_count",
  "view_count_display",
  "view_count_precision",
  "reaction_count",
  "reaction_count_display",
  "reaction_count_precision",
  "like_count",
  "like_count_display",
  "like_count_precision",
  "love_count",
  "love_count_display",
  "love_count_precision",
  "haha_count",
  "haha_count_display",
  "haha_count_precision",
  "angry_count",
  "angry_count_display",
  "angry_count_precision",
  "sad_count",
  "sad_count_display",
  "sad_count_precision",
  "wow_count",
  "wow_count_display",
  "wow_count_precision",
  "care_count",
  "care_count_display",
  "care_count_precision",
  "share_count",
  "share_count_display",
  "share_count_precision",
  "comment_count",
  "comment_count_display",
  "comment_count_precision",
] as const;

export const COMMENT_COLUMNS = [
  "comment_id",
  "post_id",
  "commenter_name",
  "comment_text",
  "like_count",
  "love_count",
  "haha_count",
  "wow_count",
  "sad_count",
  "angry_count",
  "care_count",
  "reply_count",
  "collection_timestamp",
] as const;

export const REPLY_COLUMNS = [
  "reply_id",
  "parent_id",
  "post_id",
  "commenter_name",
  "reply_text",
  "like_count",
  "love_count",
  "haha_count",
  "wow_count",
  "sad_count",
  "angry_count",
  "care_count",
  "collection_timestamp",
] as const;

export const SOURCE_COLUMNS = [
  "source_id",
  "source_name",
  "source_type",
] as const;

// ────────────────────────────────────────────────────────────────────────────
// CODEBOOK content — field definitions and controlled values
// ────────────────────────────────────────────────────────────────────────────

export const CODEBOOK_HEADERS = [
  "field_name",
  "sheet",
  "data_type",
  "required",
  "controlled_values",
  "description",
] as const;

export const CODEBOOK_ROWS: string[][] = [
  // POSTS fields
  ["post_id", "POSTS", "string", "Yes", "FB_NNNNNN", "Unique post identifier, auto-generated"],
  ["platform", "POSTS", "string", "Yes", "Facebook", "Social media platform"],
  ["content_type", "POSTS", "string", "Yes", "Post; Reel; Video; Other", "Type of Facebook content"],
  ["post_url", "POSTS", "string", "No", "", "URL of the original post"],
  ["source_name", "POSTS", "string", "Yes", "", "Name of the Facebook page or profile"],
  ["source_type", "POSTS", "string", "Yes", "News Page; Public Figure; Political Page; Organization; Community Page; Other", "Category of the source"],
  ["original_post_date", "POSTS", "date", "No", "", "Date the post was originally published"],
  ["collection_date", "POSTS", "date", "Yes", "", "Date the data was collected"],
  ["collection_timestamp", "POSTS", "datetime", "Yes", "", "ISO 8601 timestamp of collection"],
  ["language", "POSTS", "string", "Yes", "Assamese; English; Bengali; Hindi; Bodo; Mixed; Other", "Primary language of the post"],
  ["post_text", "POSTS", "string", "No", "", "Full text of the post (stored as-is)"],
  ["view_count", "POSTS", "integer", "No", "", "Number of views"],
  ["view_count_display", "POSTS", "string", "No", "", "Original raw view count string as displayed on Facebook (e.g. 1.1K, 1,247)"],
  ["view_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of view count"],
  ["reaction_count", "POSTS", "integer", "No", "", "Total reaction count"],
  ["reaction_count_display", "POSTS", "string", "No", "", "Original raw reaction count string as displayed on Facebook"],
  ["reaction_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post total reaction count"],
  ["like_count", "POSTS", "integer", "No", "", "Number of likes"],
  ["like_count_display", "POSTS", "string", "No", "", "Original raw like count string as displayed on Facebook"],
  ["like_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post like count"],
  ["love_count", "POSTS", "integer", "No", "", "Number of love reactions"],
  ["love_count_display", "POSTS", "string", "No", "", "Original raw love count string as displayed on Facebook"],
  ["love_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post love reaction count"],
  ["haha_count", "POSTS", "integer", "No", "", "Number of haha reactions"],
  ["haha_count_display", "POSTS", "string", "No", "", "Original raw haha count string as displayed on Facebook"],
  ["haha_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post haha reaction count"],
  ["angry_count", "POSTS", "integer", "No", "", "Number of angry reactions"],
  ["angry_count_display", "POSTS", "string", "No", "", "Original raw angry count string as displayed on Facebook"],
  ["angry_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post angry reaction count"],
  ["sad_count", "POSTS", "integer", "No", "", "Number of sad reactions"],
  ["sad_count_display", "POSTS", "string", "No", "", "Original raw sad count string as displayed on Facebook"],
  ["sad_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post sad reaction count"],
  ["wow_count", "POSTS", "integer", "No", "", "Number of wow reactions"],
  ["wow_count_display", "POSTS", "string", "No", "", "Original raw wow count string as displayed on Facebook"],
  ["wow_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post wow reaction count"],
  ["care_count", "POSTS", "integer", "No", "", "Number of care reactions"],
  ["care_count_display", "POSTS", "string", "No", "", "Original raw care count string as displayed on Facebook"],
  ["care_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post care reaction count"],
  ["share_count", "POSTS", "integer", "No", "", "Number of shares"],
  ["share_count_display", "POSTS", "string", "No", "", "Original raw share count string as displayed on Facebook"],
  ["share_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post share count"],
  ["comment_count", "POSTS", "integer", "No", "", "Number of comments visible"],
  ["comment_count_display", "POSTS", "string", "No", "", "Original raw comment count string as displayed on Facebook"],
  ["comment_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post total comment count"],

  // COMMENTS fields
  ["comment_id", "COMMENTS", "string", "Yes", "C_NNNNNN", "Unique comment identifier, auto-generated"],
  ["post_id", "COMMENTS", "string", "Yes", "FB_NNNNNN", "Foreign key to POSTS.post_id"],
  ["commenter_name", "COMMENTS", "string", "No", "", "Name or display handle of the commenter"],
  ["comment_text", "COMMENTS", "string", "Yes", "", "Full text of the comment (stored as-is)"],
  ["like_count", "COMMENTS", "integer", "No", "", "Number of likes on the comment"],
  ["love_count", "COMMENTS", "integer", "No", "", "Number of love reactions on the comment"],
  ["haha_count", "COMMENTS", "integer", "No", "", "Number of haha reactions on the comment"],
  ["wow_count", "COMMENTS", "integer", "No", "", "Number of wow reactions on the comment"],
  ["sad_count", "COMMENTS", "integer", "No", "", "Number of sad reactions on the comment"],
  ["angry_count", "COMMENTS", "integer", "No", "", "Number of angry reactions on the comment"],
  ["care_count", "COMMENTS", "integer", "No", "", "Number of care reactions on the comment"],
  ["reply_count", "COMMENTS", "integer", "No", "", "Number of visible replies"],
  ["collection_timestamp", "COMMENTS", "datetime", "Yes", "", "ISO 8601 timestamp of collection"],

  // REPLIES fields
  ["reply_id", "REPLIES", "string", "Yes", "R_NNNNNN", "Unique reply identifier, auto-generated"],
  ["parent_id", "REPLIES", "string", "Yes", "C_NNNNNN; R_NNNNNN", "Foreign key to parent COMMENTS.comment_id or REPLIES.reply_id"],
  ["post_id", "REPLIES", "string", "Yes", "FB_NNNNNN", "Foreign key to POSTS.post_id"],
  ["commenter_name", "REPLIES", "string", "No", "", "Name or display handle of the replier"],
  ["reply_text", "REPLIES", "string", "Yes", "", "Full text of the reply (stored as-is)"],
  ["like_count", "REPLIES", "integer", "No", "", "Number of likes on the reply"],
  ["love_count", "REPLIES", "integer", "No", "", "Number of love reactions on the reply"],
  ["haha_count", "REPLIES", "integer", "No", "", "Number of haha reactions on the reply"],
  ["wow_count", "REPLIES", "integer", "No", "", "Number of wow reactions on the reply"],
  ["sad_count", "REPLIES", "integer", "No", "", "Number of sad reactions on the reply"],
  ["angry_count", "REPLIES", "integer", "No", "", "Number of angry reactions on the reply"],
  ["care_count", "REPLIES", "integer", "No", "", "Number of care reactions on the reply"],
  ["collection_timestamp", "REPLIES", "datetime", "Yes", "", "ISO 8601 timestamp of collection"],

  // SOURCES fields
  ["source_id", "SOURCES", "string", "Yes", "S_NNNNNN", "Unique source identifier, auto-generated"],
  ["source_name", "SOURCES", "string", "Yes", "", "Name of the source page/profile"],
  ["source_type", "SOURCES", "string", "Yes", "News Page; Public Figure; Political Page; Organization; Community Page; Other", "Category of the source"],
];
