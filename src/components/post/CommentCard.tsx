"use client";

/**
 * CommentCard — Card for capturing top-level comment and its nested replies.
 */

import { Control, UseFormRegister, FieldErrors, useFieldArray, useWatch } from "react-hook-form";
import type { PostFormData } from "@/lib/types";
import { LANGUAGES, YES_NO } from "@/lib/schemas";
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
      reply_text: "",
      reply_date: "",
      language: undefined,
      is_code_mixed: undefined,
      like_count: null,
      notes: "",
    });
  };

  return (
    <div className="comment-card">
      <div className="comment-card-header">
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Comment #{commentIndex + 1}
          {commentId && (
            <span className="text-mono text-tertiary" style={{ marginLeft: "0.5rem" }}>
              ({commentId})
            </span>
          )}
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
        <label className="form-label">
          Comment Text <span className="required">*</span>
        </label>
        <textarea
          {...register(`comments.${commentIndex}.comment_text`)}
          className={`form-textarea ${commentErrors?.comment_text ? "error" : ""}`}
          placeholder="Paste or enter raw comment text..."
          rows={3}
        />
        {commentErrors?.comment_text && (
          <div className="form-error">{commentErrors.comment_text.message}</div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Comment Date / Time</label>
          <input
            type="text"
            {...register(`comments.${commentIndex}.comment_date`)}
            className="form-input"
            placeholder="e.g. 2026-08-17"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Language</label>
          <select
            {...register(`comments.${commentIndex}.language`)}
            className="form-select"
          >
            <option value="">-- Language --</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Code Mixed?</label>
          <select
            {...register(`comments.${commentIndex}.is_code_mixed`)}
            className="form-select"
          >
            <option value="">-- Select --</option>
            {YES_NO.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Likes</label>
          <input
            type="number"
            min={0}
            {...register(`comments.${commentIndex}.like_count`, {
              setValueAs: (v) => (v === "" || isNaN(v) ? null : parseInt(v, 10)),
            })}
            className="form-input"
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Visible Reply Count</label>
          <input
            type="number"
            min={0}
            {...register(`comments.${commentIndex}.reply_count`, {
              setValueAs: (v) => (v === "" || isNaN(v) ? null : parseInt(v, 10)),
            })}
            className="form-input"
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Notes</label>
        <input
          type="text"
          {...register(`comments.${commentIndex}.notes`)}
          className="form-input"
          placeholder="Optional notes..."
        />
      </div>

      {/* Nested Replies Section */}
      <div className="mt-2" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.85rem" }}>
        <div className="flex-between mb-1">
          <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-tertiary)" }}>
            Nested Replies ({fields.length})
          </span>
          <button
            type="button"
            onClick={handleAddReply}
            className="btn btn-secondary btn-sm"
          >
            + Add Reply
          </button>
        </div>

        {fields.map((field, rIdx) => (
          <ReplyCard
            key={field.id}
            commentIndex={commentIndex}
            replyIndex={rIdx}
            register={register}
            control={control}
            errors={errors}
            onRemove={() => remove(rIdx)}
          />
        ))}
      </div>
    </div>
  );
}
