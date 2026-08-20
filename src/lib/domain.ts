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
} from "./types.ts";
import { generateNextId, generateBatchIds, isValidId } from "./ids.ts";

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
  comments: Array<{ comment_id?: string; replies?: any[] }>
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

  function validateReplyTree(replies: any[] | undefined, cIdx: number, parentId: string) {
    if (!replies) return;
    replies.forEach((reply, rIdx) => {
      if (reply.reply_id && !isValidId("reply", reply.reply_id)) {
        errors.push({
          entity: "reply",
          index: rIdx,
          parentIndex: cIdx,
          message: `Reply ${rIdx + 1} under parent ${parentId} has an invalid reply_id format: "${reply.reply_id}"`,
        });
      }
      if (reply.replies) {
        validateReplyTree(reply.replies, cIdx, reply.reply_id || `Reply ${rIdx + 1}`);
      }
    });
  }

  comments.forEach((comment, cIdx) => {
    if (comment.comment_id && !isValidId("comment", comment.comment_id)) {
      errors.push({
        entity: "comment",
        index: cIdx,
        message: `Comment ${cIdx + 1} has an invalid comment_id format: "${comment.comment_id}"`,
      });
    }

    validateReplyTree(comment.replies, cIdx, comment.comment_id || `Comment ${cIdx + 1}`);
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

function countRepliesNeedingIds(replies?: ReplyFormData[]): number {
  if (!replies || replies.length === 0) return 0;
  let count = 0;
  for (const r of replies) {
    if (!r.reply_id || !isValidId("reply", r.reply_id)) {
      count++;
    }
    count += countRepliesNeedingIds(r.replies);
  }
  return count;
}

function countTotalDescendantReplies(replies?: ReplyFormData[]): number {
  if (!replies || replies.length === 0) return 0;
  let count = 0;
  for (const r of replies) {
    count += 1 + countTotalDescendantReplies(r.replies);
  }
  return count;
}

function processRecursiveReplies(
  replyForms: ReplyFormData[] | undefined,
  parentId: string,
  postId: string,
  timestamp: string,
  newReplyIds: string[],
  idState: { nextIdx: number },
  outReplies: Reply[]
) {
  if (!replyForms || replyForms.length === 0) return;

  for (const rForm of replyForms) {
    const replyId =
      rForm.reply_id && isValidId("reply", rForm.reply_id)
        ? rForm.reply_id
        : newReplyIds[idState.nextIdx++];

    outReplies.push({
      reply_id: replyId,
      parent_id: parentId,
      post_id: postId,
      reply_text: rForm.reply_text || "",
      reply_date: undefined,
      is_code_mixed: undefined,
      like_count: rForm.like_count ?? null,
      love_count: rForm.love_count ?? null,
      haha_count: rForm.haha_count ?? null,
      wow_count: rForm.wow_count ?? null,
      sad_count: rForm.sad_count ?? null,
      angry_count: rForm.angry_count ?? null,
      care_count: rForm.care_count ?? null,
      collection_timestamp: rForm.collection_timestamp || timestamp,
      notes: undefined,
    });

    // Recursively process any nested children
    processRecursiveReplies(
      rForm.replies,
      replyId,
      postId,
      timestamp,
      newReplyIds,
      idState,
      outReplies
    );
  }
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

  // ── Count total replies needing IDs recursively ─────────────────────
  const allRepliesNeedingIds = formData.comments.reduce((count, c) => {
    return count + countRepliesNeedingIds(c.replies);
  }, 0);
  const newReplyIds = generateBatchIds(
    "reply",
    existingReplyIds,
    allRepliesNeedingIds
  );
  const replyIdState = { nextIdx: 0 };

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
      is_code_mixed: undefined,
      like_count: commentForm.like_count ?? null,
      love_count: commentForm.love_count ?? null,
      haha_count: commentForm.haha_count ?? null,
      wow_count: commentForm.wow_count ?? null,
      sad_count: commentForm.sad_count ?? null,
      angry_count: commentForm.angry_count ?? null,
      care_count: commentForm.care_count ?? null,
      reply_count: countTotalDescendantReplies(commentForm.replies),
      collection_timestamp: commentForm.collection_timestamp || timestamp,
      notes: undefined,
    });

    // Recursively process all replies under this comment
    processRecursiveReplies(
      commentForm.replies,
      commentId,
      postId,
      timestamp,
      newReplyIds,
      replyIdState,
      replies
    );
  }

  return { post, comments, replies };
}
