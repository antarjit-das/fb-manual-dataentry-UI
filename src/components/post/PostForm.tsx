"use client";

/**
 * PostForm — Main hierarchical post-entry and editing form.
 *
 * Streamlined:
 *  - "+ Add Comment" moved to the bottom of Conversation Data
 *  - Removed shares count from Engagement Metrics
 *  - All fields are non-strict with sensible neutral defaults
 */

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostFormSchema, CONTENT_TYPES, SOURCE_TYPES, LANGUAGES } from "@/lib/schemas";
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
    source_name: "Unknown Source",
    source_type: "News Page",
    original_post_date: "",
    collection_date: todayDateStr(),
    language: "Assamese",
    post_text: "",
    view_count: null,
    reaction_count: null,
    like_count: null,
    love_count: null,
    haha_count: null,
    angry_count: null,
    sad_count: null,
    wow_count: null,
    care_count: null,
    comment_count: null,
    comments: [],
  };

  const {
    register,
    control,
    handleSubmit,
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

  const watchedComments = watch("comments") || [];
  const totalReplies = watchedComments.reduce(
    (sum, c) => sum + (c.replies?.length || 0),
    0
  );

  const handleAddComment = () => {
    append({
      comment_text: "",
      language: undefined,
      like_count: null,
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
              placeholder="YYYY-MM-DD or relative string"
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

      {/* 4. Engagement Metrics */}
      <section className="form-section">
        <div className="form-section-title">
          <span>4. Engagement Counts</span>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Views</label>
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
            <label className="form-label">Total Visible Comments</label>
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
