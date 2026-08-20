"use client";

/**
 * ReplyCard — Recursive nested reply entry card.
 *
 * Supports arbitrary depth:
 *  - Like, Love, Haha, Wow, Sad, Angry, Care reaction fields
 *  - Derived Total Reactions display
 *  - Recursively renders nested replies
 *  - "+ Add Reply" button adds a child reply to this specific node
 */

import React, { useState } from "react";
import { Control, UseFormRegister, FieldErrors, useFieldArray, useWatch } from "react-hook-form";
import type { PostFormData } from "@/lib/types";

interface ReplyCardProps {
  path: string; // e.g. "comments.0.replies.1"
  depth?: number;
  register: UseFormRegister<PostFormData>;
  control: Control<PostFormData>;
  errors: FieldErrors<PostFormData>;
  onRemove: () => void;
}

export default function ReplyCard({
  path,
  depth = 1,
  register,
  control,
  errors,
  onRemove,
}: ReplyCardProps) {
  const replyId = useWatch({
    control,
    name: `${path}.reply_id` as any,
  });

  const like = useWatch({ control, name: `${path}.like_count` as any });
  const love = useWatch({ control, name: `${path}.love_count` as any });
  const haha = useWatch({ control, name: `${path}.haha_count` as any });
  const wow = useWatch({ control, name: `${path}.wow_count` as any });
  const sad = useWatch({ control, name: `${path}.sad_count` as any });
  const angry = useWatch({ control, name: `${path}.angry_count` as any });
  const care = useWatch({ control, name: `${path}.care_count` as any });

  const [showReactions, setShowReactions] = useState(false);

  const totalReactions = [like, love, haha, wow, sad, angry, care].reduce<number>(
    (sum, val) => sum + (typeof val === "number" ? val : 0),
    0
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: `${path}.replies` as any,
  });

  const handleRemove = () => {
    if (window.confirm("Are you sure you want to remove this reply and all its nested replies?")) {
      onRemove();
    }
  };

  const handleAddChildReply = () => {
    append({
      commenter_name: "",
      reply_text: "",
      like_count: 0,
      love_count: 0,
      haha_count: 0,
      wow_count: 0,
      sad_count: 0,
      angry_count: 0,
      care_count: 0,
      replies: [],
    });
  };

  return (
    <div
      className="reply-card"
      style={{
        marginLeft: depth > 1 ? `${Math.min(depth * 0.75, 3)}rem` : "0.5rem",
        borderLeft: "2px solid var(--accent-subtle, rgba(49, 90, 125, 0.4))",
        marginTop: "0.5rem",
        marginBottom: "0.5rem",
        padding: "0.75rem",
        background: "var(--bg-surface, #1e1e1e)",
        borderRadius: "var(--radius-md, 6px)",
      }}
    >
      <div className="reply-card-header flex-between mb-1" style={{ alignItems: "center" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)" }}>
          ↳ Reply {replyId ? <span className="text-mono text-tertiary">({replyId})</span> : ""}
          <span
            className="badge ml-1"
            style={{
              fontSize: "0.7rem",
              padding: "0.1rem 0.4rem",
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              marginLeft: "0.5rem",
            }}
          >
            Total Reactions: {totalReactions}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="btn btn-danger btn-sm"
          style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}
        >
          Remove
        </button>
      </div>

      <div className="form-group mb-1">
        <label className="form-label" style={{ fontSize: "0.75rem" }}>Reply Commenter&apos;s Name</label>
        <input
          type="text"
          {...register(`${path}.commenter_name` as any)}
          className="form-input"
          placeholder="e.g. Chandrani Sarkar"
          style={{ fontSize: "0.8125rem", padding: "0.35rem 0.6rem" }}
        />
      </div>

      <div className="form-group mb-1">
        <label className="form-label" style={{ fontSize: "0.75rem" }}>Reply Text</label>
        <textarea
          {...register(`${path}.reply_text` as any)}
          className="form-textarea"
          placeholder="Enter reply text..."
          rows={2}
          style={{ fontSize: "0.8125rem" }}
        />
      </div>

      {/* 7 Reaction Counts Accordion/Grid */}
      <div className="mb-1">
        <button
          type="button"
          onClick={() => setShowReactions(!showReactions)}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", marginBottom: "0.4rem" }}
        >
          {showReactions ? "▼ Hide Individual Reactions" : "▶ Edit 7 Reactions (Like, Love, Haha, Wow, Sad, Angry, Care)"}
        </button>

        {showReactions && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(85px, 1fr))",
              gap: "0.4rem",
              padding: "0.5rem",
              background: "var(--bg-surface-elevated)",
              borderRadius: "4px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>👍 Like</label>
              <input
                type="number"
                min={0}
                {...register(`${path}.like_count` as any, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="0"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>❤️ Love</label>
              <input
                type="number"
                min={0}
                {...register(`${path}.love_count` as any, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="0"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>😂 Haha</label>
              <input
                type="number"
                min={0}
                {...register(`${path}.haha_count` as any, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="0"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>😮 Wow</label>
              <input
                type="number"
                min={0}
                {...register(`${path}.wow_count` as any, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="0"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>😢 Sad</label>
              <input
                type="number"
                min={0}
                {...register(`${path}.sad_count` as any, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="0"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>😡 Angry</label>
              <input
                type="number"
                min={0}
                {...register(`${path}.angry_count` as any, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="0"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>🥰 Care</label>
              <input
                type="number"
                min={0}
                {...register(`${path}.care_count` as any, {
                  setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                })}
                className="form-input"
                placeholder="0"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Recursive Children Replies */}
      {fields.length > 0 && (
        <div style={{ marginTop: "0.5rem", borderTop: "1px dashed var(--border-subtle)", paddingTop: "0.4rem" }}>
          {fields.map((childField, childIdx) => (
            <ReplyCard
              key={childField.id}
              path={`${path}.replies.${childIdx}`}
              depth={depth + 1}
              register={register}
              control={control}
              errors={errors}
              onRemove={() => remove(childIdx)}
            />
          ))}
        </div>
      )}

      {/* Add nested reply to this node */}
      <div style={{ marginTop: "0.4rem" }}>
        <button
          type="button"
          onClick={handleAddChildReply}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
        >
          + Add Reply to this Reply
        </button>
      </div>
    </div>
  );
}
