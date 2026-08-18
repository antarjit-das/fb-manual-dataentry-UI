/**
 * schemas.ts — Canonical Zod schemas for every entity in the Facebook Data Collector.
 *
 * This file is the SINGLE SOURCE OF TRUTH for field definitions, controlled values,
 * and validation rules. All other layers (persistence, API, UI) import from here.
 *
 * Rules (from AGENTS.md):
 *  - Controlled values must match the CODEBOOK / product_guide exactly.
 *  - Original text is stored unchanged — no trimming or transforming.
 */

import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// Controlled-Value Enums
// ────────────────────────────────────────────────────────────────────────────

export const CONTENT_TYPES = ["Post", "Reel", "Video", "Other"] as const;

export const SOURCE_TYPES = [
  "News Page",
  "Public Figure",
  "Political Page",
  "Organization",
  "Community Page",
  "Other",
] as const;

export const LANGUAGES = [
  "Assamese",
  "English",
  "Bengali",
  "Hindi",
  "Bodo",
  "Mixed",
  "Other",
] as const;

export const YES_NO = ["Yes", "No"] as const;

export const CONTENT_STANCES = [
  "Supportive",
  "Opposed",
  "Neutral/Informational",
  "Mixed",
  "Unclear",
] as const;

// Future annotation enums (MVP creates the structure, not the workflow)
export const SENTIMENTS = [
  "Positive",
  "Negative",
  "Neutral",
  "Mixed",
  "Unclear",
] as const;

export const EMOTIONS = [
  "Anger",
  "Sadness",
  "Fear",
  "Joy",
  "Disgust",
  "Surprise",
  "Neutral",
  "Other",
] as const;

export const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;

// ────────────────────────────────────────────────────────────────────────────
// Shared field schemas
// ────────────────────────────────────────────────────────────────────────────

/** Non-negative integer or null. Rejects decimals and free-form text like "1.2K". */
const engagementCount = z
  .union([z.number().int().min(0), z.null()])
  .optional();

/** Optional string — stored exactly as entered, never trimmed. */
const optionalText = z.string().optional();

/** Optional date string (ISO 8601 or blank). */
const optionalDateStr = z.string().optional();

// ────────────────────────────────────────────────────────────────────────────
// POST schema
// One row in the POSTS sheet.
// ────────────────────────────────────────────────────────────────────────────

export const PostSchema = z.object({
  // Identity
  post_id: z.string().regex(/^FB_\d{6}$/, "Must match FB_000000 format"),
  platform: z.string().default("Facebook"),
  content_type: z.enum(CONTENT_TYPES),
  post_url: optionalText,

  // Source & dates
  source_name: z.string().min(1, "Source name is required"),
  source_type: z.enum(SOURCE_TYPES),
  source_url: optionalText,
  original_post_date: optionalDateStr,
  collection_date: z.string().min(1, "Collection date is required"),
  collection_timestamp: z.string().min(1, "Collection timestamp is required"),
  language: z.enum(LANGUAGES),

  // Classification (optional in stored sheet model)
  is_code_mixed: z.enum(YES_NO).optional(),
  topic: optionalText,
  subtopic: optionalText,
  content_stance: z.enum(CONTENT_STANCES).optional(),

  // Content — stored as-is, never cleaned
  post_text: optionalText,
  transcript: optionalText,
  media_description: optionalText,

  // Engagement metrics — all optional non-negative integers
  view_count: engagementCount,
  reaction_count: engagementCount,
  like_count: engagementCount,
  love_count: engagementCount,
  haha_count: engagementCount,
  angry_count: engagementCount,
  sad_count: engagementCount,
  wow_count: engagementCount,
  care_count: engagementCount,
  share_count: engagementCount,

  // Research notes
  comment_count: engagementCount,
});

// ────────────────────────────────────────────────────────────────────────────
// COMMENT schema
// One row in the COMMENTS sheet. FK → POSTS.post_id
// ────────────────────────────────────────────────────────────────────────────

export const CommentSchema = z.object({
  comment_id: z.string().regex(/^C_\d{6}$/, "Must match C_000000 format"),
  post_id: z.string().regex(/^FB_\d{6}$/, "Must reference a valid post_id"),
  comment_text: z.string().min(1, "Comment text is required"),
  comment_date: optionalDateStr,
  language: z.enum(LANGUAGES).optional(),
  is_code_mixed: z.enum(YES_NO).optional(),
  like_count: engagementCount,
  reply_count: engagementCount,
  collection_timestamp: z.string().min(1, "Collection timestamp is required"),
  notes: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// REPLY schema
// One row in the REPLIES sheet. FK → COMMENTS.comment_id, POSTS.post_id
// ────────────────────────────────────────────────────────────────────────────

export const ReplySchema = z.object({
  reply_id: z.string().regex(/^R_\d{6}$/, "Must match R_000000 format"),
  comment_id: z
    .string()
    .regex(/^C_\d{6}$/, "Must reference a valid comment_id"),
  post_id: z.string().regex(/^FB_\d{6}$/, "Must reference a valid post_id"),
  reply_text: z.string().min(1, "Reply text is required"),
  reply_date: optionalDateStr,
  language: z.enum(LANGUAGES).optional(),
  is_code_mixed: z.enum(YES_NO).optional(),
  like_count: engagementCount,
  collection_timestamp: z.string().min(1, "Collection timestamp is required"),
  notes: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// SOURCE schema
// One row in the SOURCES sheet. Deduplication by source_name / source_url.
// ────────────────────────────────────────────────────────────────────────────

export const SourceSchema = z.object({
  source_id: z.string().regex(/^S_\d{6}$/, "Must match S_000000 format"),
  source_name: z.string().min(1, "Source name is required"),
  source_type: z.enum(SOURCE_TYPES),
  source_url: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// ANNOTATION schema (MVP: structure only, no workflow)
// One row in the ANNOTATIONS sheet. FK → COMMENTS.comment_id
// ────────────────────────────────────────────────────────────────────────────

export const AnnotationSchema = z.object({
  annotation_id: z.string().regex(/^A_\d{6}$/, "Must match A_000000 format"),
  comment_id: z
    .string()
    .regex(/^C_\d{6}$/, "Must reference a valid comment_id"),
  sentiment: z.enum(SENTIMENTS).optional(),
  emotion: z.enum(EMOTIONS).optional(),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  annotator_notes: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// COLLECTION_LOG schema
// One row per session in the COLLECTION_LOG sheet.
// ────────────────────────────────────────────────────────────────────────────

export const CollectionLogSchema = z.object({
  collection_id: z.string().min(1),
  session_start: z.string().min(1),
  session_end: optionalText,
  posts_collected: z.number().int().min(0).optional(),
  notes: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// FORM PAYLOAD — the nested shape sent from the UI to the API on Save
// Updated per user preferences:
//  - Removed: source_url, research classification (is_code_mixed, topic, subtopic, content_stance), transcript, media_description
//  - Comments: removed is_code_mixed, reply_count
//  - Replies: removed is_code_mixed, notes
// ────────────────────────────────────────────────────────────────────────────

export const ReplyFormSchema = z.object({
  reply_id: z.string().optional(), // generated server-side if blank
  reply_text: z.string().min(1, "Reply text is required"),
  reply_date: optionalDateStr,
  language: z.enum(LANGUAGES).optional(),
  like_count: engagementCount,
  collection_timestamp: optionalText,
});

export const CommentFormSchema = z.object({
  comment_id: z.string().optional(), // generated server-side if blank
  comment_text: z.string().min(1, "Comment text is required"),
  comment_date: optionalDateStr,
  language: z.enum(LANGUAGES).optional(),
  like_count: engagementCount,
  collection_timestamp: optionalText,
  notes: optionalText,
  replies: z.array(ReplyFormSchema).default([]),
});

export const PostFormSchema = z.object({
  // post_id is optional on create (server generates), required on edit
  post_id: z.string().optional(),

  // 1. Identity
  platform: z.string().default("Facebook"),
  content_type: z.enum(CONTENT_TYPES),
  post_url: optionalText,

  // 2. Source & dates
  source_name: z.string().min(1, "Source name is required"),
  source_type: z.enum(SOURCE_TYPES),
  original_post_date: optionalDateStr,
  collection_date: z.string().min(1, "Collection date is required"),
  collection_timestamp: optionalText,
  language: z.enum(LANGUAGES),

  // 3. Content
  post_text: optionalText,

  // 4. Engagement metrics
  view_count: engagementCount,
  reaction_count: engagementCount,
  like_count: engagementCount,
  love_count: engagementCount,
  haha_count: engagementCount,
  angry_count: engagementCount,
  sad_count: engagementCount,
  wow_count: engagementCount,
  care_count: engagementCount,
  share_count: engagementCount,
  comment_count: engagementCount,

  // 5. Nested comments & replies
  comments: z.array(CommentFormSchema).default([]),
});
