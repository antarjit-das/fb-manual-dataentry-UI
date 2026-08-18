/**
 * domain.ts — Pure business logic: relationship validation, field sanitization,
 * and payload normalization.
 *
 * This module sits between the UI form data and the persistence layer.
 * It MUST NOT render UI or access files directly (AGENTS.md rule).
 *
 * Key responsibilities:
 *  1. Validate parent-child relationships (comment→post, reply→comment+post)
 *  2. Parse and sanitize numeric engagement fields
 *  3. Generate collection timestamps
 *  4. Prepare a form payload for persistence (assign IDs, set timestamps)
 */

import type {
  PostFormData,
  CommentFormData,
  ReplyFormData,
  Post,
  Comment,
  Reply,
} from "./types";
import { generateNextId, generateBatchIds, isValidId } from "./ids";

// ────────────────────────────────────────────────────────────────────────────
// Numeric field sanitization
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parse a user-entered engagement value into a non-negative integer or null.
 *
 * Accepts:
 *  - numbers (returned as-is if integer and >= 0)
 *  - numeric strings like "123" or "0"
 *  - empty string, null, undefined → null
 *
 * Rejects:
 *  - free-form text like "1.2K", "many", "~500"
 *  - negative numbers
 *  - decimals like 1.5
 *
 * Per product_guide §12: "Numeric engagement fields must accept blank/null
 * or non-negative integers; reject free-form words such as '1.2K'."
 */
export function parseEngagementCount(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(
        `Invalid engagement count: ${value}. Must be a non-negative integer.`
      );
    }
    return value;
  }

  // String input
  const trimmed = value.trim();
  if (trimmed === "") return null;

  // Reject anything that isn't purely digits (with optional leading whitespace)
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `Invalid engagement count: "${value}". Must be a non-negative integer, not free-form text.`
    );
  }

  const num = parseInt(trimmed, 10);
  if (isNaN(num) || num < 0) {
    throw new Error(
      `Invalid engagement count: "${value}". Must be a non-negative integer.`
    );
  }

  return num;
}

// ────────────────────────────────────────────────────────────────────────────
// Timestamp helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generate an ISO 8601 collection timestamp for the current moment.
 */
export function nowTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate today's date in YYYY-MM-DD format.
 */
export function todayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ────────────────────────────────────────────────────────────────────────────
// Relationship validation
// ────────────────────────────────────────────────────────────────────────────

export interface RelationshipError {
  entity: "comment" | "reply";
  index: number;
  parentIndex?: number; // for replies: the index of the parent comment
  message: string;
}

/**
 * Validate that all parent-child relationships in a post payload are correct.
 *
 * Rules (from product_guide §12):
 *  - A comment cannot exist without a parent post_id.
 *  - A reply cannot exist without a parent comment_id and matching post_id.
 *
 * This function checks structural consistency of the nested payload,
 * not ID format (that's handled by Zod schemas).
 */
export function validateRelationships(
  postId: string,
  comments: Array<{ comment_id?: string; replies: Array<{ reply_id?: string }> }>
): RelationshipError[] {
  const errors: RelationshipError[] = [];

  if (!postId) {
    errors.push({
      entity: "comment",
      index: -1,
      message: "Post ID is required for relationship validation.",
    });
    return errors;
  }

  comments.forEach((comment, cIdx) => {
    // Each comment must have at least comment_text (validated by Zod),
    // but structurally it must belong to this post.
    // If comment_id is provided, it must be valid format.
    if (comment.comment_id && !isValidId("comment", comment.comment_id)) {
      errors.push({
        entity: "comment",
        index: cIdx,
        message: `Comment ${cIdx + 1} has an invalid comment_id format: "${comment.comment_id}"`,
      });
    }

    // Validate each reply under this comment
    comment.replies.forEach((reply, rIdx) => {
      if (reply.reply_id && !isValidId("reply", reply.reply_id)) {
        errors.push({
          entity: "reply",
          index: rIdx,
          parentIndex: cIdx,
          message: `Reply ${rIdx + 1} under Comment ${cIdx + 1} has an invalid reply_id format: "${reply.reply_id}"`,
        });
      }
    });
  });

  return errors;
}

// ────────────────────────────────────────────────────────────────────────────
// Payload preparation — convert form data into persistence-ready rows
// ────────────────────────────────────────────────────────────────────────────

export interface PreparedPayload {
  post: Post;
  comments: Comment[];
  replies: Reply[];
}

/**
 * Prepare a form payload for persistence.
 *
 * This function:
 *  1. Assigns a post_id if missing (new post) or keeps existing (edit).
 *  2. Assigns comment_ids and reply_ids for new entries.
 *  3. Sets collection_timestamp on all entities that lack one.
 *  4. Wires parent-child foreign keys (post_id on comments, comment_id + post_id on replies).
 *  5. Returns flat arrays ready for workbook row insertion.
 *
 * @param formData      - The nested form payload from the UI.
 * @param existingPostIds    - All post IDs currently in the workbook.
 * @param existingCommentIds - All comment IDs currently in the workbook.
 * @param existingReplyIds   - All reply IDs currently in the workbook.
 */
export function preparePayload(
  formData: PostFormData,
  existingPostIds: string[],
  existingCommentIds: string[],
  existingReplyIds: string[]
): PreparedPayload {
  const timestamp = nowTimestamp();
  const collectionDate = todayDateStr();

  // ── Post ID ──────────────────────────────────────────────────────────
  const postId =
    formData.post_id && isValidId("post", formData.post_id)
      ? formData.post_id
      : generateNextId("post", existingPostIds);

  // ── Post row ─────────────────────────────────────────────────────────
  const post: Post = {
    post_id: postId,
    platform: formData.platform || "Facebook",
    content_type: formData.content_type,
    post_url: formData.post_url,
    source_name: formData.source_name,
    source_type: formData.source_type,
    source_url: formData.source_url,
    original_post_date: formData.original_post_date,
    collection_date: formData.collection_date || collectionDate,
    collection_timestamp: formData.collection_timestamp || timestamp,
    language: formData.language,
    is_code_mixed: formData.is_code_mixed,
    topic: formData.topic,
    subtopic: formData.subtopic,
    content_stance: formData.content_stance,
    post_text: formData.post_text,
    transcript: formData.transcript,
    media_description: formData.media_description,
    view_count: formData.view_count ?? null,
    reaction_count: formData.reaction_count ?? null,
    like_count: formData.like_count ?? null,
    love_count: formData.love_count ?? null,
    haha_count: formData.haha_count ?? null,
    angry_count: formData.angry_count ?? null,
    sad_count: formData.sad_count ?? null,
    wow_count: formData.wow_count ?? null,
    care_count: formData.care_count ?? null,
    share_count: formData.share_count ?? null,
    comment_count: formData.comment_count ?? null,
  };

  // ── Comment IDs ──────────────────────────────────────────────────────
  // Count how many comments need new IDs
  const commentsNeedingIds = formData.comments.filter(
    (c) => !c.comment_id || !isValidId("comment", c.comment_id)
  ).length;
  const newCommentIds = generateBatchIds(
    "comment",
    existingCommentIds,
    commentsNeedingIds
  );
  let newCommentIdx = 0;

  // ── Count total replies needing IDs ──────────────────────────────────
  const allRepliesNeedingIds = formData.comments.reduce((count, c) => {
    return (
      count +
      c.replies.filter(
        (r) => !r.reply_id || !isValidId("reply", r.reply_id)
      ).length
    );
  }, 0);
  const newReplyIds = generateBatchIds(
    "reply",
    existingReplyIds,
    allRepliesNeedingIds
  );
  let newReplyIdx = 0;

  // ── Build flat comment and reply arrays ──────────────────────────────
  const comments: Comment[] = [];
  const replies: Reply[] = [];

  for (const commentForm of formData.comments) {
    const commentId =
      commentForm.comment_id && isValidId("comment", commentForm.comment_id)
        ? commentForm.comment_id
        : newCommentIds[newCommentIdx++];

    comments.push({
      comment_id: commentId,
      post_id: postId,
      comment_text: commentForm.comment_text,
      comment_date: commentForm.comment_date,
      language: commentForm.language,
      is_code_mixed: commentForm.is_code_mixed,
      like_count: commentForm.like_count ?? null,
      reply_count: commentForm.reply_count ?? null,
      collection_timestamp: commentForm.collection_timestamp || timestamp,
      notes: commentForm.notes,
    });

    for (const replyForm of commentForm.replies) {
      const replyId =
        replyForm.reply_id && isValidId("reply", replyForm.reply_id)
          ? replyForm.reply_id
          : newReplyIds[newReplyIdx++];

      replies.push({
        reply_id: replyId,
        comment_id: commentId,
        post_id: postId,
        reply_text: replyForm.reply_text,
        reply_date: replyForm.reply_date,
        language: replyForm.language,
        is_code_mixed: replyForm.is_code_mixed,
        like_count: replyForm.like_count ?? null,
        collection_timestamp: replyForm.collection_timestamp || timestamp,
        notes: replyForm.notes,
      });
    }
  }

  return { post, comments, replies };
}
