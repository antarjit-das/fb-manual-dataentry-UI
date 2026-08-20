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
  COLLECTION_LOG: "COLLECTION_LOG",
  ANNOTATIONS: "ANNOTATIONS",
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
  "source_url",
  "original_post_date",
  "collection_date",
  "collection_timestamp",
  "language",
  "is_code_mixed",
  "topic",
  "subtopic",
  "content_stance",
  "post_text",
  "transcript",
  "media_description",
  "view_count",
  "view_count_display",
  "view_count_precision",
  "reaction_count",
  "reaction_count_display",
  "reaction_count_precision",
  "like_count",
  "love_count",
  "haha_count",
  "angry_count",
  "sad_count",
  "wow_count",
  "care_count",
  "share_count",
  "comment_count",
  "comment_count_display",
  "comment_count_precision",
] as const;

export const COMMENT_COLUMNS = [
  "comment_id",
  "post_id",
  "comment_text",
  "comment_date",
  "is_code_mixed",
  "like_count",
  "love_count",
  "haha_count",
  "wow_count",
  "sad_count",
  "angry_count",
  "care_count",
  "reply_count",
  "collection_timestamp",
  "notes",
] as const;

export const REPLY_COLUMNS = [
  "reply_id",
  "parent_id",
  "post_id",
  "reply_text",
  "reply_date",
  "is_code_mixed",
  "like_count",
  "love_count",
  "haha_count",
  "wow_count",
  "sad_count",
  "angry_count",
  "care_count",
  "collection_timestamp",
  "notes",
] as const;

export const SOURCE_COLUMNS = [
  "source_id",
  "source_name",
  "source_type",
  "source_url",
] as const;

export const ANNOTATION_COLUMNS = [
  "annotation_id",
  "comment_id",
  "sentiment",
  "emotion",
  "confidence",
  "annotator_notes",
] as const;

export const COLLECTION_LOG_COLUMNS = [
  "collection_id",
  "session_start",
  "session_end",
  "posts_collected",
  "notes",
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
  ["source_url", "POSTS", "string", "No", "", "URL of the source page/profile"],
  ["original_post_date", "POSTS", "date", "No", "", "Date the post was originally published"],
  ["collection_date", "POSTS", "date", "Yes", "", "Date the data was collected"],
  ["collection_timestamp", "POSTS", "datetime", "Yes", "", "ISO 8601 timestamp of collection"],
  ["language", "POSTS", "string", "Yes", "Assamese; English; Bengali; Hindi; Bodo; Mixed; Other", "Primary language of the post"],
  ["is_code_mixed", "POSTS", "string", "Yes", "Yes; No", "Whether the post contains code-mixing"],
  ["topic", "POSTS", "string", "No", "", "Research topic category"],
  ["subtopic", "POSTS", "string", "No", "", "Research subtopic"],
  ["content_stance", "POSTS", "string", "No", "Supportive; Opposed; Neutral/Informational; Mixed; Unclear", "Stance of the content"],
  ["post_text", "POSTS", "string", "No", "", "Full text of the post (stored as-is)"],
  ["transcript", "POSTS", "string", "No", "", "Transcript of video/reel content"],
  ["media_description", "POSTS", "string", "No", "", "Description of media attachments"],
  ["view_count", "POSTS", "integer", "No", "", "Number of views"],
  ["view_count_display", "POSTS", "string", "No", "", "Original raw view count string as displayed on Facebook (e.g. 1.1K, 1,247)"],
  ["view_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of view count"],
  ["reaction_count", "POSTS", "integer", "No", "", "Total reaction count"],
  ["reaction_count_display", "POSTS", "string", "No", "", "Original raw reaction count string as displayed on Facebook"],
  ["reaction_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post total reaction count"],
  ["like_count", "POSTS", "integer", "No", "", "Number of likes"],
  ["love_count", "POSTS", "integer", "No", "", "Number of love reactions"],
  ["haha_count", "POSTS", "integer", "No", "", "Number of haha reactions"],
  ["angry_count", "POSTS", "integer", "No", "", "Number of angry reactions"],
  ["sad_count", "POSTS", "integer", "No", "", "Number of sad reactions"],
  ["wow_count", "POSTS", "integer", "No", "", "Number of wow reactions"],
  ["care_count", "POSTS", "integer", "No", "", "Number of care reactions"],
  ["share_count", "POSTS", "integer", "No", "", "Number of shares"],
  ["comment_count", "POSTS", "integer", "No", "", "Number of comments visible"],
  ["comment_count_display", "POSTS", "string", "No", "", "Original raw comment count string as displayed on Facebook"],
  ["comment_count_precision", "POSTS", "string", "No", "precise; approximate; unavailable", "Precision status of post total comment count"],

  // COMMENTS fields
  ["comment_id", "COMMENTS", "string", "Yes", "C_NNNNNN", "Unique comment identifier, auto-generated"],
  ["post_id", "COMMENTS", "string", "Yes", "FB_NNNNNN", "Foreign key to POSTS.post_id"],
  ["comment_text", "COMMENTS", "string", "Yes", "", "Full text of the comment (stored as-is)"],
  ["comment_date", "COMMENTS", "date", "No", "", "Date/time of the comment"],
  ["is_code_mixed", "COMMENTS", "string", "No", "Yes; No", "Whether comment contains code-mixing"],
  ["like_count", "COMMENTS", "integer", "No", "", "Number of likes on the comment"],
  ["love_count", "COMMENTS", "integer", "No", "", "Number of love reactions on the comment"],
  ["haha_count", "COMMENTS", "integer", "No", "", "Number of haha reactions on the comment"],
  ["wow_count", "COMMENTS", "integer", "No", "", "Number of wow reactions on the comment"],
  ["sad_count", "COMMENTS", "integer", "No", "", "Number of sad reactions on the comment"],
  ["angry_count", "COMMENTS", "integer", "No", "", "Number of angry reactions on the comment"],
  ["care_count", "COMMENTS", "integer", "No", "", "Number of care reactions on the comment"],
  ["reply_count", "COMMENTS", "integer", "No", "", "Number of visible replies"],
  ["collection_timestamp", "COMMENTS", "datetime", "Yes", "", "ISO 8601 timestamp of collection"],
  ["notes", "COMMENTS", "string", "No", "", "Researcher notes"],

  // REPLIES fields
  ["reply_id", "REPLIES", "string", "Yes", "R_NNNNNN", "Unique reply identifier, auto-generated"],
  ["parent_id", "REPLIES", "string", "Yes", "C_NNNNNN; R_NNNNNN", "Foreign key to parent COMMENTS.comment_id or REPLIES.reply_id"],
  ["post_id", "REPLIES", "string", "Yes", "FB_NNNNNN", "Foreign key to POSTS.post_id"],
  ["reply_text", "REPLIES", "string", "Yes", "", "Full text of the reply (stored as-is)"],
  ["reply_date", "REPLIES", "date", "No", "", "Date/time of the reply"],
  ["is_code_mixed", "REPLIES", "string", "No", "Yes; No", "Whether reply contains code-mixing"],
  ["like_count", "REPLIES", "integer", "No", "", "Number of likes on the reply"],
  ["love_count", "REPLIES", "integer", "No", "", "Number of love reactions on the reply"],
  ["haha_count", "REPLIES", "integer", "No", "", "Number of haha reactions on the reply"],
  ["wow_count", "REPLIES", "integer", "No", "", "Number of wow reactions on the reply"],
  ["sad_count", "REPLIES", "integer", "No", "", "Number of sad reactions on the reply"],
  ["angry_count", "REPLIES", "integer", "No", "", "Number of angry reactions on the reply"],
  ["care_count", "REPLIES", "integer", "No", "", "Number of care reactions on the reply"],
  ["collection_timestamp", "REPLIES", "datetime", "Yes", "", "ISO 8601 timestamp of collection"],
  ["notes", "REPLIES", "string", "No", "", "Researcher notes"],

  // SOURCES fields
  ["source_id", "SOURCES", "string", "Yes", "S_NNNNNN", "Unique source identifier, auto-generated"],
  ["source_name", "SOURCES", "string", "Yes", "", "Name of the source page/profile"],
  ["source_type", "SOURCES", "string", "Yes", "News Page; Public Figure; Political Page; Organization; Community Page; Other", "Category of the source"],
  ["source_url", "SOURCES", "string", "No", "", "URL of the source page/profile"],

  // ANNOTATIONS fields
  ["annotation_id", "ANNOTATIONS", "string", "Yes", "A_NNNNNN", "Unique annotation identifier"],
  ["comment_id", "ANNOTATIONS", "string", "Yes", "C_NNNNNN", "Foreign key to COMMENTS.comment_id"],
  ["sentiment", "ANNOTATIONS", "string", "No", "Positive; Negative; Neutral; Mixed; Unclear", "Sentiment label"],
  ["emotion", "ANNOTATIONS", "string", "No", "Anger; Sadness; Fear; Joy; Disgust; Surprise; Neutral; Other", "Emotion label"],
  ["confidence", "ANNOTATIONS", "integer", "No", "1; 2; 3; 4; 5", "Confidence level of annotation"],
  ["annotator_notes", "ANNOTATIONS", "string", "No", "", "Free-text notes from annotator"],

  // COLLECTION_LOG fields
  ["collection_id", "COLLECTION_LOG", "string", "Yes", "", "Unique session identifier"],
  ["session_start", "COLLECTION_LOG", "datetime", "Yes", "", "Session start timestamp"],
  ["session_end", "COLLECTION_LOG", "datetime", "No", "", "Session end timestamp"],
  ["posts_collected", "COLLECTION_LOG", "integer", "No", "", "Number of posts collected in session"],
  ["notes", "COLLECTION_LOG", "string", "No", "", "Session notes"],
];
