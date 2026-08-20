/**
 * schemas.ts — Canonical Zod schemas for every entity in the Facebook Data Collector.
 *
 * This file is the SINGLE SOURCE OF TRUTH for field definitions, controlled values,
 * and validation rules. All other layers (persistence, API, UI) import from here.
 *
 * Rules:
 *  - Lenient form validation: empty metrics default to 0, language defaults to English.
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
  "English",
  "Assamese",
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

export const PRECISION_TYPES = [
  "precise",
  "approximate",
  "unavailable",
] as const;

export type CountPrecision = (typeof PRECISION_TYPES)[number];

// ────────────────────────────────────────────────────────────────────────────
// Shared field schemas
// ────────────────────────────────────────────────────────────────────────────

/** Non-negative integer or null. Preprocesses strings, commas, empty values, 'null', etc. */
const engagementCount = z.preprocess((val) => {
  if (val === undefined || val === null || val === "" || val === "null" || val === "NA" || val === "N/A") {
    return null;
  }
  if (typeof val === "string") {
    const cleaned = val.replace(/,/g, "").trim();
    if (cleaned === "" || cleaned.toLowerCase() === "null" || cleaned.toUpperCase() === "NA") return null;
    const num = Number(cleaned);
    return isNaN(num) ? val : Math.round(num);
  }
  if (typeof val === "number") {
    return isNaN(val) ? null : Math.round(val);
  }
  return val;
}, z.union([z.number().int().min(0), z.null()]).optional());

/** Optional string — stored exactly as entered, never trimmed. */
const optionalText = z.string().nullable().optional();

/** Optional date string (DD/MM/YYYY or blank). */
const optionalDateStr = z.string().nullable().optional();

// ────────────────────────────────────────────────────────────────────────────
// POST schema
// One row in the POSTS sheet.
// ────────────────────────────────────────────────────────────────────────────

export const PostSchema = z.object({
  // Identity
  post_id: z.string().regex(/^FB_\d{6}$/, "Must match FB_000000 format"),
  platform: z.string().default("Facebook"),
  content_type: z.enum(CONTENT_TYPES).default("Post"),
  post_url: optionalText,

  // Source & dates
  source_name: z.string().default("Unknown Source"),
  source_type: z.enum(SOURCE_TYPES).default("News Page"),
  source_url: optionalText,
  original_post_date: optionalDateStr,
  collection_date: z.string().default(""),
  collection_timestamp: z.string().default(""),
  language: z.enum(LANGUAGES).default("English"),

  // Classification (optional in stored sheet model)
  is_code_mixed: z.enum(YES_NO).optional(),
  topic: optionalText,
  subtopic: optionalText,
  content_stance: z.enum(CONTENT_STANCES).optional(),

  // Content
  post_text: optionalText,
  transcript: optionalText,
  media_description: optionalText,

  // Engagement metrics & Post-Level Precision
  view_count: engagementCount,
  view_count_display: optionalText,
  view_count_precision: z.enum(PRECISION_TYPES).default("unavailable"),
  reaction_count: engagementCount,
  reaction_count_display: optionalText,
  reaction_count_precision: z.enum(PRECISION_TYPES).default("unavailable"),
  like_count: engagementCount,
  love_count: engagementCount,
  haha_count: engagementCount,
  angry_count: engagementCount,
  sad_count: engagementCount,
  wow_count: engagementCount,
  care_count: engagementCount,
  share_count: engagementCount,
  comment_count: engagementCount,
  comment_count_display: optionalText,
  comment_count_precision: z.enum(PRECISION_TYPES).default("unavailable"),
});

// ────────────────────────────────────────────────────────────────────────────
// COMMENT schema
// One row in the COMMENTS sheet. FK → POSTS.post_id
// ────────────────────────────────────────────────────────────────────────────

export const CommentSchema = z.object({
  comment_id: z.string().regex(/^C_\d{6}$/, "Must match C_000000 format"),
  post_id: z.string().regex(/^FB_\d{6}$/, "Must reference a valid post_id"),
  commenter_name: optionalText,
  comment_text: z.string().default(""),
  comment_date: optionalDateStr,
  is_code_mixed: z.enum(YES_NO).optional(),
  like_count: engagementCount,
  love_count: engagementCount,
  haha_count: engagementCount,
  wow_count: engagementCount,
  sad_count: engagementCount,
  angry_count: engagementCount,
  care_count: engagementCount,
  reply_count: engagementCount,
  collection_timestamp: z.string().min(1, "Collection timestamp is required"),
  notes: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// REPLY schema
// One row in the REPLIES sheet. FK parent_id → COMMENTS.comment_id or REPLIES.reply_id
// ────────────────────────────────────────────────────────────────────────────

export const ReplySchema = z.object({
  reply_id: z.string().regex(/^R_\d{6}$/, "Must match R_000000 format"),
  parent_id: z
    .string()
    .regex(/^(C|R)_\d{6}$/, "Must reference a valid parent comment or reply ID"),
  post_id: z.string().regex(/^FB_\d{6}$/, "Must reference a valid post_id"),
  commenter_name: optionalText,
  reply_text: z.string().default(""),
  reply_date: optionalDateStr,
  is_code_mixed: z.enum(YES_NO).optional(),
  like_count: engagementCount,
  love_count: engagementCount,
  haha_count: engagementCount,
  wow_count: engagementCount,
  sad_count: engagementCount,
  angry_count: engagementCount,
  care_count: engagementCount,
  collection_timestamp: z.string().min(1, "Collection timestamp is required"),
  notes: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// SOURCE schema
// ────────────────────────────────────────────────────────────────────────────

export const SourceSchema = z.object({
  source_id: z.string().regex(/^S_\d{6}$/, "Must match S_000000 format"),
  source_name: z.string().default("Unknown Source"),
  source_type: z.enum(SOURCE_TYPES).default("News Page"),
  source_url: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// ANNOTATION schema
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
// ────────────────────────────────────────────────────────────────────────────

export const CollectionLogSchema = z.object({
  collection_id: z.string().min(1),
  session_start: z.string().min(1),
  session_end: optionalText,
  posts_collected: z.number().int().min(0).optional(),
  notes: optionalText,
});

// ────────────────────────────────────────────────────────────────────────────
// Language mapping helpers (ISO code <-> UI Controlled Name)
// ────────────────────────────────────────────────────────────────────────────

export const ISO_TO_LANGUAGE_MAP: Record<string, (typeof LANGUAGES)[number]> = {
  en: "English",
  eng: "English",
  bn: "Bengali",
  ben: "Bengali",
  as: "Assamese",
  asm: "Assamese",
  hi: "Hindi",
  hin: "Hindi",
  brx: "Bodo",
  ne: "Other",
  nep: "Other",
  mixed: "Mixed",
  other: "Other",
};

export const LANGUAGE_TO_ISO_MAP: Record<(typeof LANGUAGES)[number], string> = {
  English: "en",
  Bengali: "bn",
  Assamese: "as",
  Hindi: "hi",
  Bodo: "brx",
  Mixed: "mixed",
  Other: "other",
};

/** Convert ISO language code to UI language name. */
export function isoToLanguage(iso?: string | null): (typeof LANGUAGES)[number] {
  if (!iso) return "English";
  const normalized = iso.trim().toLowerCase();
  if (normalized in ISO_TO_LANGUAGE_MAP) {
    return ISO_TO_LANGUAGE_MAP[normalized];
  }
  // Check if it already matches one of the LANGUAGES names directly
  const directMatch = LANGUAGES.find(
    (l) => l.toLowerCase() === normalized
  );
  if (directMatch) return directMatch;
  return "Other";
}

/** Convert UI language name to ISO code. */
export function languageToIso(lang?: string | null): string {
  if (!lang) return "en";
  const directMatch = LANGUAGES.find(
    (l) => l.toLowerCase() === lang.trim().toLowerCase()
  );
  if (directMatch && directMatch in LANGUAGE_TO_ISO_MAP) {
    return LANGUAGE_TO_ISO_MAP[directMatch];
  }
  return lang.toLowerCase();
}

// ────────────────────────────────────────────────────────────────────────────
// CANONICAL JSON SCHEMAS (Authoritative contract for Autofill / External JSON)
// ────────────────────────────────────────────────────────────────────────────

export type CanonicalReply = {
  commenter_name?: string | null;
  reply_text?: string | null;
  like_count?: number | null;
  love_count?: number | null;
  haha_count?: number | null;
  wow_count?: number | null;
  sad_count?: number | null;
  angry_count?: number | null;
  care_count?: number | null;
  replies?: CanonicalReply[];
};

export const CanonicalReplySchema: z.ZodType<CanonicalReply> = z.lazy(() =>
  z.object({
    commenter_name: z.union([z.string(), z.null()]).optional().transform((v) => v ?? ""),
    reply_text: z.union([z.string(), z.null()]).optional().transform((v) => v ?? ""),
    like_count: engagementCount,
    love_count: engagementCount,
    haha_count: engagementCount,
    wow_count: engagementCount,
    sad_count: engagementCount,
    angry_count: engagementCount,
    care_count: engagementCount,
    replies: z.array(CanonicalReplySchema).default([]),
  })
);

export const CanonicalCommentSchema = z.object({
  commenter_name: z.union([z.string(), z.null()]).optional().transform((v) => v ?? ""),
  comment_text: z.union([z.string(), z.null()]).optional().transform((v) => v ?? ""),
  like_count: engagementCount,
  love_count: engagementCount,
  haha_count: engagementCount,
  wow_count: engagementCount,
  sad_count: engagementCount,
  angry_count: engagementCount,
  care_count: engagementCount,
  replies: z.array(CanonicalReplySchema).default([]),
});

export const CanonicalDatasetSchema = z.object({
  comments: z.array(CanonicalCommentSchema),
});

// ────────────────────────────────────────────────────────────────────────────
// FORM PAYLOAD — Recursive schemas with 7 reactions
// ────────────────────────────────────────────────────────────────────────────

export type ReplyFormData = {
  reply_id?: string;
  commenter_name?: string | null;
  reply_text?: string | null;
  like_count?: number | null;
  love_count?: number | null;
  haha_count?: number | null;
  wow_count?: number | null;
  sad_count?: number | null;
  angry_count?: number | null;
  care_count?: number | null;
  collection_timestamp?: string | null;
  replies?: ReplyFormData[];
};

export const ReplyFormSchema: z.ZodType<ReplyFormData> = z.lazy(() =>
  z.object({
    reply_id: z.string().optional(),
    commenter_name: z.union([z.string(), z.null()]).optional().default(""),
    reply_text: z.union([z.string(), z.null()]).optional().default(""),
    like_count: engagementCount,
    love_count: engagementCount,
    haha_count: engagementCount,
    wow_count: engagementCount,
    sad_count: engagementCount,
    angry_count: engagementCount,
    care_count: engagementCount,
    collection_timestamp: optionalText,
    replies: z.array(ReplyFormSchema).default([]),
  })
);

export const CommentFormSchema = z.object({
  comment_id: z.string().optional(),
  commenter_name: z.union([z.string(), z.null()]).optional().default(""),
  comment_text: z.union([z.string(), z.null()]).optional().default(""),
  like_count: engagementCount,
  love_count: engagementCount,
  haha_count: engagementCount,
  wow_count: engagementCount,
  sad_count: engagementCount,
  angry_count: engagementCount,
  care_count: engagementCount,
  collection_timestamp: optionalText,
  replies: z.array(ReplyFormSchema).default([]),
});

export const PostFormSchema = z.object({
  post_id: z.string().optional(),

  // 1. Identity
  platform: z.string().default("Facebook"),
  content_type: z.enum(CONTENT_TYPES).default("Post"),
  post_url: optionalText,

  // 2. Source & dates
  source_name: z.string().optional().default("Unknown Source"),
  source_type: z.enum(SOURCE_TYPES).default("News Page"),
  original_post_date: optionalDateStr,
  collection_date: z.string().optional(),
  collection_timestamp: optionalText,
  language: z.enum(LANGUAGES).default("English"),

  // 3. Content
  post_text: optionalText,

  // 4. Engagement metrics
  view_count: engagementCount,
  view_count_display: optionalText,
  view_count_precision: z.enum(PRECISION_TYPES).default("unavailable"),
  reaction_count: engagementCount,
  reaction_count_display: optionalText,
  reaction_count_precision: z.enum(PRECISION_TYPES).default("unavailable"),
  like_count: engagementCount.default(0),
  love_count: engagementCount.default(0),
  haha_count: engagementCount.default(0),
  angry_count: engagementCount.default(0),
  sad_count: engagementCount.default(0),
  wow_count: engagementCount.default(0),
  care_count: engagementCount.default(0),
  comment_count: engagementCount,
  comment_count_display: optionalText,
  comment_count_precision: z.enum(PRECISION_TYPES).default("unavailable"),

  // 5. Nested comments & replies
  comments: z.array(CommentFormSchema).default([]),
});
