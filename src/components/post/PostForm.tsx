"use client";

/**
 * PostForm — Main hierarchical post-entry and editing form.
 *
 * Organized in clean sections per product_guide §4.2:
 *  1. Identity & Post Details
 *  2. Source & Metadata
 *  3. Classification
 *  4. Content & Transcripts
 *  5. Visible Engagement Metrics
 *  6. Repeatable Comments & Replies
 *  7. Save & Pre-save summary
 */

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostFormSchema, CONTENT_TYPES, SOURCE_TYPES, LANGUAGES, YES_NO, CONTENT_STANCES } from "@/lib/schemas";
import type { PostFormData, SaveResult } from "@/lib/types";
import { todayDateStr } from "@/lib/domain";
import StatusBar from "@/components/common/StatusBar";
import CommentCard from "./CommentCard";

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
    source_name: "",
    source_type: "News Page",
    source_url: "",
    original_post_date: "",
    collection_date: todayDateStr(),
    language: "Assamese",
    is_code_mixed: "No",
    topic: "",
    subtopic: "",
    content_stance: undefined,
    post_text: "",
    transcript: "",
    media_description: "",
    view_count: null,
    reaction_count: null,
    like_count: null,
    love_count: null,
    haha_count: null,
    angry_count: null,
    sad_count: null,
    wow_count: null,
    care_count: null,
    share_count: null,
    comment_count: null,
    comments: [],
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<PostFormData>({
    resolver: zodResolver(PostFormSchema as any),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "comments",
  });

  const watchedComments = watch("comments") || [];
  const totalReplies = watchedComments.reduce(
    (sum, c) => sum + (c.replies?.length || 0),
    0
  );

  const handleAddComment = () => {
    append({
      comment_text: "",
      comment_date: "",
      language: undefined,
      is_code_mixed: undefined,
      like_count: null,
      reply_count: null,
      notes: "",
      replies: [],
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

      {/* 1. Identity & Post Details */}
      <section className="form-section">
        <div className="form-section-title">1. Identity & Post Details</div>
        <div className="form-row">
          {mode === "edit" && (
            <div className="form-group">
              <label className="form-label">Post ID</label>
              <input
                type="text"
                {...register("post_id")}
                readOnly
                className="form-input text-mono"
                style={{ backgroundColor: "var(--color-surface)" }}
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
              style={{ backgroundColor: "var(--color-surface)" }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Content Type <span className="required">*</span>
            </label>
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
        <div className="form-section-title">2. Source & Metadata</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Source Name / Page <span className="required">*</span>
            </label>
            <input
              type="text"
              {...register("source_name")}
              className={`form-input ${errors.source_name ? "error" : ""}`}
              placeholder="e.g. Pratidin Time, Assam Tribune"
            />
            {errors.source_name && (
              <div className="form-error">{errors.source_name.message}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Source Type <span className="required">*</span>
            </label>
            <select {...register("source_type")} className="form-select">
              {SOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Source URL</label>
            <input
              type="url"
              {...register("source_url")}
              className="form-input"
              placeholder="https://facebook.com/page..."
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Original Post Date</label>
            <input
              type="text"
              {...register("original_post_date")}
              className="form-input"
              placeholder="YYYY-MM-DD or visible date"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Collection Date <span className="required">*</span>
            </label>
            <input
              type="text"
              {...register("collection_date")}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Primary Language <span className="required">*</span>
            </label>
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

      {/* 3. Classification */}
      <section className="form-section">
        <div className="form-section-title">3. Research Classification</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Is Code-Mixed? <span className="required">*</span>
            </label>
            <select {...register("is_code_mixed")} className="form-select">
              {YES_NO.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Topic</label>
            <input
              type="text"
              {...register("topic")}
              className="form-input"
              placeholder="e.g. Politics, Environment, Culture"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subtopic</label>
            <input
              type="text"
              {...register("subtopic")}
              className="form-input"
              placeholder="e.g. Floods, Elections"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Content Stance</label>
            <select {...register("content_stance")} className="form-select">
              <option value="">-- None / Select Stance --</option>
              {CONTENT_STANCES.map((stance) => (
                <option key={stance} value={stance}>
                  {stance}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 4. Content */}
      <section className="form-section">
        <div className="form-section-title">4. Post Content</div>
        <div className="form-group">
          <label className="form-label">Post Text (Caption / Body)</label>
          <textarea
            {...register("post_text")}
            className="form-textarea"
            placeholder="Paste raw post text/caption as-is..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Transcript (for Reel / Video)</label>
          <textarea
            {...register("transcript")}
            className="form-textarea"
            placeholder="Video or Reel transcript if applicable..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Media Description</label>
          <input
            type="text"
            {...register("media_description")}
            className="form-input"
            placeholder="e.g. Infographic with map, Photo of assembly"
          />
        </div>
      </section>

      {/* 5. Engagement Metrics */}
      <section className="form-section">
        <div className="form-section-title">5. Visible Engagement Metrics</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">View Count</label>
            <input
              type="number"
              min={0}
              {...register("view_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Total Reactions</label>
            <input
              type="number"
              min={0}
              {...register("reaction_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Likes</label>
            <input
              type="number"
              min={0}
              {...register("like_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Love</label>
            <input
              type="number"
              min={0}
              {...register("love_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Haha</label>
            <input
              type="number"
              min={0}
              {...register("haha_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Angry</label>
            <input
              type="number"
              min={0}
              {...register("angry_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sad</label>
            <input
              type="number"
              min={0}
              {...register("sad_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Wow</label>
            <input
              type="number"
              min={0}
              {...register("wow_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Care</label>
            <input
              type="number"
              min={0}
              {...register("care_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Shares</label>
            <input
              type="number"
              min={0}
              {...register("share_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Visible Total Comments</label>
            <input
              type="number"
              min={0}
              {...register("comment_count", { setValueAs: (v) => v === "" || isNaN(v) ? null : parseInt(v, 10) })}
              className="form-input"
              placeholder="0"
            />
          </div>
        </div>
      </section>

      {/* 6. Comments & Nested Replies */}
      <section className="form-section">
        <div className="flex-between form-section-title">
          <span>6. Conversation Data ({fields.length} Comments, {totalReplies} Replies)</span>
          <button
            type="button"
            onClick={handleAddComment}
            className="btn btn-primary btn-sm"
          >
            + Add Comment
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="text-muted" style={{ padding: "1rem 0" }}>
            No comments added yet. Click &quot;+ Add Comment&quot; to capture comments.
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
      </section>

      {/* 7. Save & Pre-save summary */}
      <div className="save-summary flex-between">
        <div>
          <strong>Ready to save:</strong> 1 Post, {fields.length} Comment(s), {totalReplies} Reply/Replies.
        </div>
        <button
          type="submit"
          disabled={saveStatus === "saving"}
          className="btn btn-primary"
          style={{ padding: "0.65rem 1.5rem", fontSize: "1rem" }}
        >
          {saveStatus === "saving" ? "Saving..." : mode === "edit" ? "Update Post" : "Save Complete Post"}
        </button>
      </div>
    </form>
  );
}
