"use client";

/**
 * ReplyCard — Card for entering a single reply nested under a comment.
 *
 * Fields (product_guide §4.5):
 *  - reply_id (read-only generated or empty on create)
 *  - reply_text (required)
 *  - reply_date (optional)
 *  - language (optional dropdown)
 *  - is_code_mixed (optional dropdown)
 *  - like_count (optional integer)
 *  - notes (optional)
 *  - Remove Reply button with confirmation
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
        `Are you sure you want to remove Reply ${replyIndex + 1}?`
      )
    ) {
      onRemove();
    }
  };

  return (
    <div className="reply-card">
      <div className="card-header">
        <div className="card-title">
          ↳ Reply #{replyIndex + 1}
          {replyId && (
            <span className="text-muted text-mono" style={{ marginLeft: "0.5rem" }}>
              ({replyId})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="btn btn-danger btn-sm"
        >
          Remove Reply
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
          placeholder="Paste or type raw reply text here (stored unchanged)..."
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
            placeholder="e.g. 2026-08-17 or 2h ago"
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
            <option value="">-- Select Language --</option>
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
          <label className="form-label">Like Count</label>
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
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <div className="form-group mb-1">
        <label className="form-label">Notes</label>
        <input
          type="text"
          {...register(
            `comments.${commentIndex}.replies.${replyIndex}.notes`
          )}
          className="form-input"
          placeholder="Optional researcher notes..."
        />
      </div>
    </div>
  );
}
