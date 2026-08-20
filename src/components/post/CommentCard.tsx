"use client";

/**
 * CommentCard — Card for capturing top-level comment and its recursive reply tree.
 *
 * Supports:
 *  - Like, Love, Haha, Wow, Sad, Angry, Care reaction fields
 *  - Derived Total Reactions display
 *  - Arbitrary-depth nested replies via recursive ReplyCard
 *  - "+ Add Reply" button
 */

import React, { useState } from "react";
import { Control, UseFormRegister, FieldErrors, useFieldArray, useWatch } from "react-hook-form";
import type { PostFormData } from "@/lib/types";
import ReplyCard from "./ReplyCard";

interface CommentCardProps {
  commentIndex: number;
  register: UseFormRegister<PostFormData>;
  control: Control<PostFormData>;
  errors: FieldErrors<PostFormData>;
  onRemove: () => void;
}

export default function CommentCard({
  commentIndex,
  register,
  control,
  errors,
  onRemove,
}: CommentCardProps) {
  const commentId = useWatch({
    control,
    name: `comments.${commentIndex}.comment_id`,
  });

  const like = useWatch({ control, name: `comments.${commentIndex}.like_count` });
  const love = useWatch({ control, name: `comments.${commentIndex}.love_count` });
  const haha = useWatch({ control, name: `comments.${commentIndex}.haha_count` });
  const wow = useWatch({ control, name: `comments.${commentIndex}.wow_count` });
  const sad = useWatch({ control, name: `comments.${commentIndex}.sad_count` });
  const angry = useWatch({ control, name: `comments.${commentIndex}.angry_count` });
  const care = useWatch({ control, name: `comments.${commentIndex}.care_count` });

  const [showReactions, setShowReactions] = useState(false);

  const reactionList = [like, love, haha, wow, sad, angry, care];
  const hasAnyReaction = reactionList.some((val) => typeof val === "number");
  const totalReactions = reactionList.reduce<number>(
    (sum, val) => sum + (typeof val === "number" ? val : 0),
    0
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: `comments.${commentIndex}.replies`,
  });

  const commentErrors = errors.comments?.[commentIndex];

  const handleRemoveComment = () => {
    if (
      window.confirm(
        `Are you sure you want to remove Comment #${commentIndex + 1} and all its replies?`
      )
    ) {
      onRemove();
    }
  };

  const handleAddReply = () => {
    append({
      commenter_name: "",
      reply_text: "",
      like_count: null,
      love_count: null,
      haha_count: null,
      wow_count: null,
      sad_count: null,
      angry_count: null,
      care_count: null,
      replies: [],
    });
  };

  return (
    <div className="comment-card">
      <div className="comment-card-header flex-between">
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Comment #{commentIndex + 1}
          {commentId && (
            <span className="text-mono text-tertiary" style={{ marginLeft: "0.5rem" }}>
              ({commentId})
            </span>
          )}
          <span
            className="badge"
            style={{
              fontSize: "0.75rem",
              padding: "0.15rem 0.5rem",
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              marginLeft: "0.75rem",
            }}
          >
            Total Reactions: {hasAnyReaction ? totalReactions : "—"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRemoveComment}
          className="btn btn-danger btn-sm"
        >
          Remove Comment
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Commenter&apos;s Name</label>
        <input
          type="text"
          {...register(`comments.${commentIndex}.commenter_name`)}
          className="form-input"
          placeholder="e.g. Gopal Ch Saha"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Comment Text</label>
        <textarea
          {...register(`comments.${commentIndex}.comment_text`)}
          className={`form-textarea ${commentErrors?.comment_text ? "error" : ""}`}
          placeholder="Paste or enter raw comment text..."
          rows={3}
        />
      </div>

      {/* 7 Reaction Counts Section */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => setShowReactions(!showReactions)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", marginBottom: "0.5rem" }}
        >
          {showReactions ? "▼ Hide Individual Reactions" : "▶ Edit 7 Reactions (Like, Love, Haha, Wow, Sad, Angry, Care)"}
        </button>

        {showReactions && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))",
              gap: "0.5rem",
              padding: "0.6rem",
              background: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-md, 6px)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>👍 Like</label>
              <input
                type="number"
                min={0}
                {...register(`comments.${commentIndex}.like_count`, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="—"
                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>❤️ Love</label>
              <input
                type="number"
                min={0}
                {...register(`comments.${commentIndex}.love_count`, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="—"
                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>😂 Haha</label>
              <input
                type="number"
                min={0}
                {...register(`comments.${commentIndex}.haha_count`, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="—"
                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>😮 Wow</label>
              <input
                type="number"
                min={0}
                {...register(`comments.${commentIndex}.wow_count`, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="—"
                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>😢 Sad</label>
              <input
                type="number"
                min={0}
                {...register(`comments.${commentIndex}.sad_count`, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="—"
                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>😡 Angry</label>
              <input
                type="number"
                min={0}
                {...register(`comments.${commentIndex}.angry_count`, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="—"
                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>🥰 Care</label>
              <input
                type="number"
                min={0}
                {...register(`comments.${commentIndex}.care_count`, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="—"
                style={{ fontSize: "0.8125rem", padding: "0.3rem 0.5rem" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recursive Replies Section */}
      <div className="mt-2" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.85rem" }}>
        <div className="mb-1">
          <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-tertiary)" }}>
            Replies ({fields.length})
          </span>
        </div>

        {fields.map((field, rIdx) => (
          <ReplyCard
            key={field.id}
            path={`comments.${commentIndex}.replies.${rIdx}`}
            depth={1}
            register={register}
            control={control}
            errors={errors}
            onRemove={() => remove(rIdx)}
          />
        ))}

        {/* Add Reply button at bottom of comment */}
        <div style={{ marginTop: "0.5rem" }}>
          <button
            type="button"
            onClick={handleAddReply}
            className="btn btn-secondary btn-sm"
          >
            + Add Reply to this Comment
          </button>
        </div>
      </div>
    </div>
  );
}
