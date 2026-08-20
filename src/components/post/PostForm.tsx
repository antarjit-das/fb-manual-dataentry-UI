"use client";

/**
 * PostForm — Main hierarchical post-entry and editing form.
 *
 * Streamlined:
 *  - Primary language defaults to English
 *  - All engagement and reaction count fields default to 0
 *  - Published date formatted as DD/MM/YYYY
 *  - Collection date dynamically reflects the current date in DD/MM/YYYY
 *  - "+ Add Comment" at bottom of Conversation Data
 */

import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostFormSchema, CONTENT_TYPES, SOURCE_TYPES, LANGUAGES } from "@/lib/schemas";
import type { PostFormData, SaveResult, CommentFormData } from "@/lib/types";
import { todayDateStr } from "@/lib/domain";
import { parseCountWithPrecision } from "@/lib/parser";
import StatusBar from "@/components/common/StatusBar";
import CommentCard from "./CommentCard";
import AutofillSection from "./AutofillSection";

interface PostFormProps {
  initialData?: PostFormData;
  mode?: "create" | "edit";
  onSuccess?: (result: SaveResult) => void;
}

export default function PostForm({
  initialData,
  mode = "create",
  onSuccess,
}: PostFormProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: PostFormData = initialData || {
    platform: "Facebook",
    content_type: "Post",
    post_url: "",
    source_name: "Unknown Source",
    source_type: "News Page",
    original_post_date: "",
    collection_date: todayDateStr(),
    language: "English",
    post_text: "",
    view_count: null,
    view_count_display: "",
    view_count_precision: "unavailable",
    reaction_count: null,
    reaction_count_display: "",
    reaction_count_precision: "unavailable",
    like_count: 0,
    love_count: 0,
    haha_count: 0,
    angry_count: 0,
    sad_count: 0,
    wow_count: 0,
    care_count: 0,
    comment_count: null,
    comment_count_display: "",
    comment_count_precision: "unavailable",
    comments: [],
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(PostFormSchema as any),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "comments",
  });

  function countAllReplies(replies?: any[]): number {
    if (!replies) return 0;
    return replies.reduce((sum: number, r: any) => sum + 1 + countAllReplies(r.replies), 0);
  }

  const watchedComments = watch("comments") || [];
  const totalReplies = watchedComments.reduce(
    (sum: number, c: any) => sum + countAllReplies(c.replies),
    0
  );

  const watchedViewPrecision = useWatch({ control, name: "view_count_precision" });
  const watchedReactionPrecision = useWatch({ control, name: "reaction_count_precision" });
  const watchedCommentPrecision = useWatch({ control, name: "comment_count_precision" });

  const handleDisplayChange = (
    field: "view_count" | "reaction_count" | "comment_count",
    val: string
  ) => {
    setValue(`${field}_display` as any, val);
    const parsed = parseCountWithPrecision(val);
    setValue(field as any, parsed.count, { shouldDirty: true, shouldValidate: true });
    setValue(`${field}_precision` as any, parsed.precision, { shouldDirty: true, shouldValidate: true });
  };

  const handleAddComment = () => {
    append({
      commenter_name: "",
      comment_text: "",
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

  const handleAutofillComments = (importedComments: CommentFormData[]) => {
    setValue("comments", importedComments, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (data: PostFormData) => {
    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      const url = mode === "edit" && data.post_id
        ? `/api/posts/${data.post_id}`
        : "/api/posts";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || json.details?.[0]?.message || "Failed to save record");
      }

      setSaveStatus("success");
      setSaveResult(json);
      if (onSuccess) {
        onSuccess(json);
      }
    } catch (err: any) {
      setSaveStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StatusBar status={saveStatus} result={saveResult} error={errorMessage} />

      {/* Autofill Pipeline (Canonical JSON supply & Raw Parser) */}
      <AutofillSection onAutofill={handleAutofillComments} />

      {/* 1. Identity & Post Details */}
      <section className="form-section">
        <div className="form-section-title">
          <span>1. Post Identification</span>
        </div>
        <div className="form-row">
          {mode === "edit" && (
            <div className="form-group">
              <label className="form-label">Post Identifier</label>
              <input
                type="text"
                {...register("post_id")}
                readOnly
                className="form-input text-mono"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Platform</label>
            <input
              type="text"
              {...register("platform")}
              readOnly
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content Type</label>
            <select {...register("content_type")} className="form-select">
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Post URL</label>
            <input
              type="url"
              {...register("post_url")}
              className="form-input"
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>
      </section>

      {/* 2. Source & Metadata */}
      <section className="form-section">
        <div className="form-section-title">
          <span>2. Source & Origin</span>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Source Name / Page</label>
            <input
              type="text"
              {...register("source_name")}
              className="form-input"
              placeholder="e.g. Pratidin Time, Assam Tribune"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Source Type</label>
            <select {...register("source_type")} className="form-select">
              {SOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Original Published Date</label>
            <input
              type="text"
              {...register("original_post_date")}
              className="form-input"
              placeholder="DD/MM/YYYY"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Collection Date</label>
            <input
              type="text"
              {...register("collection_date")}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Primary Language</label>
            <select {...register("language")} className="form-select">
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 3. Content */}
      <section className="form-section">
        <div className="form-section-title">
          <span>3. Post Content</span>
        </div>
        <div className="form-group" style={{ marginBottom: "0.25rem" }}>
          <label className="form-label">Post Caption / Body Text</label>
          <textarea
            {...register("post_text")}
            className="form-textarea"
            placeholder="Paste raw post text or caption..."
            rows={5}
          />
        </div>
      </section>

      {/* 4. Engagement Metrics & Post-Level Precision */}
      <section className="form-section">
        <div className="form-section-title">
          <span>4. Post Engagement Metrics & Precision</span>
        </div>

        {/* Post-Level Aggregates with Precision Tracking */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            Post-Level Aggregates (Views, Total Reactions, Total Comments)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
            {/* Views */}
            <div style={{ padding: "0.6rem", background: "var(--bg-surface-elevated)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
              <div className="flex-between mb-1" style={{ alignItems: "center" }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: "0.8rem", fontWeight: 600 }}>Post Views</label>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: watchedViewPrecision === "approximate" ? "rgba(234, 179, 8, 0.15)" : watchedViewPrecision === "precise" ? "rgba(34, 197, 94, 0.15)" : "var(--bg-surface)",
                    color: watchedViewPrecision === "approximate" ? "#eab308" : watchedViewPrecision === "precise" ? "#22c55e" : "var(--text-tertiary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {watchedViewPrecision === "approximate" ? "Approximate (~)" : watchedViewPrecision === "precise" ? "Precise (=)" : "Unavailable"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Raw Display</label>
                  <input
                    type="text"
                    {...register("view_count_display")}
                    onChange={(e) => handleDisplayChange("view_count", e.target.value)}
                    className="form-input"
                    placeholder="e.g. 1.1K, 1,247"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Precision</label>
                  <select
                    {...register("view_count_precision")}
                    className="form-select"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                  >
                    <option value="precise">Precise</option>
                    <option value="approximate">Approximate</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "0.35rem" }}>
                <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Normalized Number</label>
                <input
                  type="number"
                  min={0}
                  {...register("view_count", {
                    setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                  })}
                  className="form-input"
                  placeholder="—"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                />
              </div>
            </div>

            {/* Total Reactions */}
            <div style={{ padding: "0.6rem", background: "var(--bg-surface-elevated)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
              <div className="flex-between mb-1" style={{ alignItems: "center" }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: "0.8rem", fontWeight: 600 }}>Post Total Reactions</label>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: watchedReactionPrecision === "approximate" ? "rgba(234, 179, 8, 0.15)" : watchedReactionPrecision === "precise" ? "rgba(34, 197, 94, 0.15)" : "var(--bg-surface)",
                    color: watchedReactionPrecision === "approximate" ? "#eab308" : watchedReactionPrecision === "precise" ? "#22c55e" : "var(--text-tertiary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {watchedReactionPrecision === "approximate" ? "Approximate (~)" : watchedReactionPrecision === "precise" ? "Precise (=)" : "Unavailable"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Raw Display</label>
                  <input
                    type="text"
                    {...register("reaction_count_display")}
                    onChange={(e) => handleDisplayChange("reaction_count", e.target.value)}
                    className="form-input"
                    placeholder="e.g. 1.2K, 247"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Precision</label>
                  <select
                    {...register("reaction_count_precision")}
                    className="form-select"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                  >
                    <option value="precise">Precise</option>
                    <option value="approximate">Approximate</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "0.35rem" }}>
                <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Normalized Number</label>
                <input
                  type="number"
                  min={0}
                  {...register("reaction_count", {
                    setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                  })}
                  className="form-input"
                  placeholder="—"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                />
              </div>
            </div>

            {/* Total Comments */}
            <div style={{ padding: "0.6rem", background: "var(--bg-surface-elevated)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
              <div className="flex-between mb-1" style={{ alignItems: "center" }}>
                <label className="form-label" style={{ marginBottom: 0, fontSize: "0.8rem", fontWeight: 600 }}>Post Total Comments</label>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    background: watchedCommentPrecision === "approximate" ? "rgba(234, 179, 8, 0.15)" : watchedCommentPrecision === "precise" ? "rgba(34, 197, 94, 0.15)" : "var(--bg-surface)",
                    color: watchedCommentPrecision === "approximate" ? "#eab308" : watchedCommentPrecision === "precise" ? "#22c55e" : "var(--text-tertiary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {watchedCommentPrecision === "approximate" ? "Approximate (~)" : watchedCommentPrecision === "precise" ? "Precise (=)" : "Unavailable"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Raw Display</label>
                  <input
                    type="text"
                    {...register("comment_count_display")}
                    onChange={(e) => handleDisplayChange("comment_count", e.target.value)}
                    className="form-input"
                    placeholder="e.g. 1.1K, 500"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Precision</label>
                  <select
                    {...register("comment_count_precision")}
                    className="form-select"
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                  >
                    <option value="precise">Precise</option>
                    <option value="approximate">Approximate</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "0.35rem" }}>
                <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Normalized Number</label>
                <input
                  type="number"
                  min={0}
                  {...register("comment_count", {
                    setValueAs: (v) => (v === "" || v === null || isNaN(v) ? null : parseInt(v, 10)),
                  })}
                  className="form-input"
                  placeholder="—"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.4rem" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Post-Level Individual Reactions Breakdown (Simple Numbers) */}
        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
          Post-Level Reaction Breakdown (Optional)
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Likes</label>
            <input
              type="number"
              min={0}
              {...register("like_count", { setValueAs: (v) => (v === "" || isNaN(v) ? 0 : parseInt(v, 10)) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Love</label>
            <input
              type="number"
              min={0}
              {...register("love_count", { setValueAs: (v) => (v === "" || isNaN(v) ? 0 : parseInt(v, 10)) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Haha</label>
            <input
              type="number"
              min={0}
              {...register("haha_count", { setValueAs: (v) => (v === "" || isNaN(v) ? 0 : parseInt(v, 10)) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Angry</label>
            <input
              type="number"
              min={0}
              {...register("angry_count", { setValueAs: (v) => (v === "" || isNaN(v) ? 0 : parseInt(v, 10)) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sad</label>
            <input
              type="number"
              min={0}
              {...register("sad_count", { setValueAs: (v) => (v === "" || isNaN(v) ? 0 : parseInt(v, 10)) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Wow</label>
            <input
              type="number"
              min={0}
              {...register("wow_count", { setValueAs: (v) => (v === "" || isNaN(v) ? 0 : parseInt(v, 10)) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Care</label>
            <input
              type="number"
              min={0}
              {...register("care_count", { setValueAs: (v) => (v === "" || isNaN(v) ? 0 : parseInt(v, 10)) })}
              className="form-input"
              placeholder="0"
            />
          </div>
        </div>
      </section>

      {/* 5. Comments & Nested Replies */}
      <section className="form-section">
        <div className="form-section-title">
          <span>5. Conversation Data ({fields.length} Comments, {totalReplies} Replies)</span>
        </div>

        {fields.length === 0 ? (
          <div className="text-tertiary" style={{ padding: "0.75rem 0", fontSize: "0.8125rem" }}>
            No comments added yet. Click &quot;+ Add Comment&quot; below to add one.
          </div>
        ) : (
          fields.map((field, cIdx) => (
            <CommentCard
              key={field.id}
              commentIndex={cIdx}
              register={register}
              control={control}
              errors={errors}
              onRemove={() => remove(cIdx)}
            />
          ))
        )}

        {/* Add Comment button at the bottom of the section */}
        <div style={{ marginTop: "1rem", paddingTop: "0.5rem" }}>
          <button
            type="button"
            onClick={handleAddComment}
            className="btn btn-secondary btn-sm"
          >
            + Add Comment
          </button>
        </div>
      </section>

      {/* 6. Save Summary bar */}
      <div className="save-summary-bar">
        <div className="save-summary-meta">
          <strong>Payload Summary:</strong> 1 Post &middot; {fields.length} Comment(s) &middot; {totalReplies} Reply/Replies
        </div>
        <button
          type="submit"
          disabled={saveStatus === "saving"}
          className="btn btn-primary"
          style={{ padding: "0.55rem 1.4rem", fontSize: "0.875rem" }}
        >
          {saveStatus === "saving" ? (
            <>
              <span className="spinner" /> Saving...
            </>
          ) : mode === "edit" ? (
            "Update Post Record"
          ) : (
            "Save Post to Dataset"
          )}
        </button>
      </div>
    </form>
  );
}
