/**
 * domain.ts — Pure business logic: relationship validation, field sanitization,
 * and payload normalization.
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

export function parseEngagementCount(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      return 0;
    }
    return value;
  }

  const trimmed = value.trim();
  if (trimmed === "") return 0;

  if (!/^\d+$/.test(trimmed)) {
    return 0;
  }

  const num = parseInt(trimmed, 10);
  if (isNaN(num) || num < 0) {
    return 0;
  }

  return num;
}

// ────────────────────────────────────────────────────────────────────────────
// Timestamp & Date helpers (DD/MM/YYYY support)
// ────────────────────────────────────────────────────────────────────────────

export function nowTimestamp(): string {
  return new Date().toISOString();
}

/** Returns today's date in DD/MM/YYYY format based on local time. */
export function todayDateStr(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Relationship validation
// ────────────────────────────────────────────────────────────────────────────

export interface RelationshipError {
  entity: "comment" | "reply";
  index: number;
  parentIndex?: number;
  message: string;
}

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
    if (comment.comment_id && !isValidId("comment", comment.comment_id)) {
      errors.push({
        entity: "comment",
        index: cIdx,
        message: `Comment ${cIdx + 1} has an invalid comment_id format: "${comment.comment_id}"`,
      });
    }

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
    content_type: formData.content_type || "Post",
    post_url: formData.post_url,
    source_name: formData.source_name || "Unknown Source",
    source_type: formData.source_type || "News Page",
    source_url: undefined,
    original_post_date: formData.original_post_date,
    collection_date: formData.collection_date || collectionDate,
    collection_timestamp: formData.collection_timestamp || timestamp,
    language: formData.language || "English",
    is_code_mixed: undefined,
    topic: undefined,
    subtopic: undefined,
    content_stance: undefined,
    post_text: formData.post_text,
    transcript: undefined,
    media_description: undefined,
    view_count: formData.view_count ?? 0,
    reaction_count: formData.reaction_count ?? 0,
    like_count: formData.like_count ?? 0,
    love_count: formData.love_count ?? 0,
    haha_count: formData.haha_count ?? 0,
    angry_count: formData.angry_count ?? 0,
    sad_count: formData.sad_count ?? 0,
    wow_count: formData.wow_count ?? 0,
    care_count: formData.care_count ?? 0,
    share_count: 0,
    comment_count: formData.comment_count ?? 0,
  };

  // ── Comment IDs ──────────────────────────────────────────────────────
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
      comment_text: commentForm.comment_text || "",
      comment_date: undefined,
      language: commentForm.language || "English",
      is_code_mixed: undefined,
      like_count: commentForm.like_count ?? 0,
      reply_count: 0,
      collection_timestamp: commentForm.collection_timestamp || timestamp,
      notes: undefined,
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
        reply_text: replyForm.reply_text || "",
        reply_date: undefined,
        language: replyForm.language || "English",
        is_code_mixed: undefined,
        like_count: replyForm.like_count ?? 0,
        collection_timestamp: replyForm.collection_timestamp || timestamp,
        notes: undefined,
      });
    }
  }

  return { post, comments, replies };
}
