"use client";

/**
 * ReplyCard — Nested reply entry card.
 *
 * Streamlined:
 *  - Likes field defaults to 0
 *  - Language defaults to English
 *  - Removed date/time, code mixed, notes
 */

import { Control, UseFormRegister, FieldErrors, useWatch } from "react-hook-form";
import type { PostFormData } from "@/lib/types";
import { LANGUAGES } from "@/lib/schemas";

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
        <label className="form-label">Reply Text</label>
        <textarea
          {...register(
            `comments.${commentIndex}.replies.${replyIndex}.reply_text`
          )}
          className={`form-textarea ${replyErrors?.reply_text ? "error" : ""}`}
          placeholder="Enter reply text..."
          rows={2}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Language</label>
          <select
            {...register(
              `comments.${commentIndex}.replies.${replyIndex}.language`
            )}
            className="form-select"
            defaultValue="English"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
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
                setValueAs: (v) => (v === "" || isNaN(v) ? 0 : parseInt(v, 10)),
              }
            )}
            className="form-input"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
