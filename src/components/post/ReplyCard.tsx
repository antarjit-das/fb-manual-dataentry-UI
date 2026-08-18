"use client";

/**
 * ReplyCard — Nested reply entry card.
 *
 * Clean, minimalistic dark appearance with subtle left border indicator.
 */

import { Control, UseFormRegister, FieldErrors, useWatch } from "react-hook-form";
import type { PostFormData } from "@/lib/types";
import { LANGUAGES, YES_NO } from "@/lib/schemas";

interface ReplyCardProps {
  commentIndex: number;
  replyIndex: number;
  register: UseFormRegister<PostFormData>;
  control: Control<PostFormData>;
  errors: FieldErrors<PostFormData>;
  onRemove: () => void;
}

export default function ReplyCard({
  commentIndex,
  replyIndex,
  register,
  control,
  errors,
  onRemove,
}: ReplyCardProps) {
  const replyId = useWatch({
    control,
    name: `comments.${commentIndex}.replies.${replyIndex}.reply_id`,
  });

  const replyErrors =
    errors.comments?.[commentIndex]?.replies?.[replyIndex];

  const handleRemove = () => {
    if (
      window.confirm(
        `Are you sure you want to remove Reply #${replyIndex + 1}?`
      )
    ) {
      onRemove();
    }
  };

  return (
    <div className="reply-card">
      <div className="reply-card-header">
        <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)" }}>
          ↳ Reply #{replyIndex + 1}
          {replyId && (
            <span className="text-mono text-tertiary" style={{ marginLeft: "0.4rem" }}>
              ({replyId})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="btn btn-danger btn-sm"
        >
          Remove
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">
          Reply Text <span className="required">*</span>
        </label>
        <textarea
          {...register(
            `comments.${commentIndex}.replies.${replyIndex}.reply_text`
          )}
          className={`form-textarea ${replyErrors?.reply_text ? "error" : ""}`}
          placeholder="Enter raw reply text..."
          rows={2}
        />
        {replyErrors?.reply_text && (
          <div className="form-error">{replyErrors.reply_text.message}</div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Reply Date / Time</label>
          <input
            type="text"
            {...register(
              `comments.${commentIndex}.replies.${replyIndex}.reply_date`
            )}
            className="form-input"
            placeholder="e.g. 2026-08-17"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Language</label>
          <select
            {...register(
              `comments.${commentIndex}.replies.${replyIndex}.language`
            )}
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
            {...register(
              `comments.${commentIndex}.replies.${replyIndex}.is_code_mixed`
            )}
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
            {...register(
              `comments.${commentIndex}.replies.${replyIndex}.like_count`,
              {
                setValueAs: (v) => (v === "" || isNaN(v) ? null : parseInt(v, 10)),
              }
            )}
            className="form-input"
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: "0.25rem" }}>
        <label className="form-label">Notes</label>
        <input
          type="text"
          {...register(
            `comments.${commentIndex}.replies.${replyIndex}.notes`
          )}
          className="form-input"
          placeholder="Optional notes..."
        />
      </div>
    </div>
  );
}
