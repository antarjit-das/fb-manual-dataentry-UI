"use client";

/**
 * AutofillSection — Component for importing Canonical JSON or parsing Raw Facebook text
 * and populating the editable form state without performing database/workbook persistence.
 */

import { useState, useRef, ChangeEvent } from "react";
import { CanonicalDatasetSchema, isoToLanguage } from "@/lib/schemas";
import { parseFacebookRawText } from "@/lib/parser";
import type {
  CanonicalDataset,
  CanonicalReply,
  CommentFormData,
  ReplyFormData,
  ParseResult,
} from "@/lib/types";

interface AutofillSectionProps {
  onAutofill: (comments: CommentFormData[]) => void;
}

export default function AutofillSection({ onAutofill }: AutofillSectionProps) {
  const [activeTab, setActiveTab] = useState<"json" | "raw">("json");
  const [isOpen, setIsOpen] = useState(true);

  // JSON Import state
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw Parser state
  const [rawText, setRawText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // JSON -> Form Mapping
  // ──────────────────────────────────────────────────────────────────────────
  const mapCanonicalReply = (r: CanonicalReply): ReplyFormData => ({
    commenter_name: r.commenter_name ?? "",
    reply_text: r.reply_text ?? "",
    like_count: r.like_count === undefined ? null : r.like_count,
    love_count: r.love_count === undefined ? null : r.love_count,
    haha_count: r.haha_count === undefined ? null : r.haha_count,
    wow_count: r.wow_count === undefined ? null : r.wow_count,
    sad_count: r.sad_count === undefined ? null : r.sad_count,
    angry_count: r.angry_count === undefined ? null : r.angry_count,
    care_count: r.care_count === undefined ? null : r.care_count,
    replies: (r.replies || []).map(mapCanonicalReply),
  });

  const mapCanonicalToForm = (dataset: CanonicalDataset): CommentFormData[] => {
    return dataset.comments.map((c) => ({
      commenter_name: c.commenter_name ?? "",
      comment_text: c.comment_text ?? "",
      like_count: c.like_count === undefined ? null : c.like_count,
      love_count: c.love_count === undefined ? null : c.love_count,
      haha_count: c.haha_count === undefined ? null : c.haha_count,
      wow_count: c.wow_count === undefined ? null : c.wow_count,
      sad_count: c.sad_count === undefined ? null : c.sad_count,
      angry_count: c.angry_count === undefined ? null : c.angry_count,
      care_count: c.care_count === undefined ? null : c.care_count,
      replies: (c.replies || []).map(mapCanonicalReply),
    }));
  };

  function countTotalRepliesRecursive(replies?: CanonicalReply[]): number {
    if (!replies) return 0;
    return replies.reduce((sum, r) => sum + 1 + countTotalRepliesRecursive(r.replies), 0);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // JSON Import Handler
  // ──────────────────────────────────────────────────────────────────────────
  const handleApplyJson = (textToProcess?: string) => {
    setJsonError(null);
    setJsonSuccess(null);

    const input = (textToProcess !== undefined ? textToProcess : jsonText).trim();
    if (!input) {
      setJsonError("Please paste a JSON payload or upload a JSON file.");
      return;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(input);
    } catch (e: any) {
      setJsonError(`Invalid JSON syntax: ${e.message}`);
      return;
    }

    const validation = CanonicalDatasetSchema.safeParse(parsedJson);
    if (!validation.success) {
      const issueDetails = validation.error.issues
        .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
        .slice(0, 5)
        .join("; ");
      setJsonError(`Validation failed against Canonical JSON schema (${issueDetails})`);
      return;
    }

    const validData = validation.data;
    const formComments = mapCanonicalToForm(validData);
    const replyCount = validData.comments.reduce(
      (sum, c) => sum + countTotalRepliesRecursive(c.replies),
      0
    );

    onAutofill(formComments);
    setJsonSuccess(
      `Successfully loaded ${validData.comments.length} comment(s) and ${replyCount} reply/replies into form fields.`
    );
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setJsonText(content);
      handleApplyJson(content);
    };
    reader.readAsText(file);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Raw Parser Handler
  // ──────────────────────────────────────────────────────────────────────────
  const handleParseRaw = () => {
    setRawError(null);
    if (!rawText.trim()) {
      setRawError("Please paste raw Facebook clipboard text to parse.");
      return;
    }

    try {
      const result = parseFacebookRawText(rawText);
      setParseResult(result);
    } catch (e: any) {
      setRawError(`Parsing error: ${e.message}`);
    }
  };

  const handleApplyParsedToForm = () => {
    if (!parseResult) return;
    const formComments = mapCanonicalToForm(parseResult.dataset);
    onAutofill(formComments);
    setJsonSuccess(
      `Loaded parsed dataset (${parseResult.metrics.commentsDetected} comments, ${parseResult.metrics.repliesDetected} replies) into form fields.`
    );
  };

  const handleDownloadJson = (data: CanonicalDataset) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facebook_dataset_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="form-section mb-3"
      style={{
        border: "1px solid var(--border-accent, #3b82f6)",
        background: "var(--bg-surface-elevated, #181c24)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* Header Bar with Collapse Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.25rem",
          background: "rgba(59, 130, 246, 0.08)",
          borderBottom: isOpen ? "1px solid var(--border-subtle, #2d3748)" : "none",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
            }}
          />
          <strong style={{ fontSize: "0.9375rem", color: "var(--text-primary)" }}>
            Autofill Pipeline &middot; Canonical JSON / Raw Text Import
          </strong>
          <span
            className="text-tertiary"
            style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}
          >
            (Populates editable form state without submitting)
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem" }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? "Hide Autofill" : "Show Autofill"}
        </button>
      </div>

      {isOpen && (
        <div style={{ padding: "1rem 1.25rem" }}>
          {/* Tab Navigation */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1rem",
              borderBottom: "1px solid var(--border-subtle, #2d3748)",
              paddingBottom: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={`btn btn-sm ${
                activeTab === "json" ? "btn-primary" : "btn-secondary"
              }`}
            >
              📥 Supply / Paste Canonical JSON
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`btn btn-sm ${
                activeTab === "raw" ? "btn-primary" : "btn-secondary"
              }`}
            >
              📋 Paste Raw Facebook Text
            </button>
          </div>

          {/* Success Banner */}
          {jsonSuccess && (
            <div
              className="alert alert-success mb-2"
              style={{
                fontSize: "0.8125rem",
                padding: "0.6rem 0.85rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{jsonSuccess}</span>
              <button
                type="button"
                onClick={() => setJsonSuccess(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: SUPPLY / PASTE CANONICAL JSON */}
          {activeTab === "json" && (
            <div>
              <p
                className="text-secondary"
                style={{ fontSize: "0.8125rem", marginBottom: "0.75rem" }}
              >
                Paste your external canonical JSON or upload a <code>.json</code>{" "}
                file. The application will validate the structure and populate the
                editable comment &amp; reply fields below.
              </p>

              {jsonError && (
                <div
                  className="alert alert-error mb-2"
                  style={{ fontSize: "0.8125rem", padding: "0.6rem 0.85rem" }}
                >
                  <strong>Validation Error:</strong> {jsonError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <textarea
                  className="form-textarea text-mono"
                  rows={6}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`{\n  "comments": [\n    {\n      "commenter_name": "Gopal Ch Saha",\n      "comment_text": "...",\n      "like_count": 0,\n      "love_count": 0,\n      "haha_count": 0,\n      "wow_count": 0,\n      "sad_count": 0,\n      "angry_count": 0,\n      "care_count": 0,\n      "replies": [\n        {\n          "commenter_name": "Chandrani Sarkar",\n          "reply_text": "Gopal Ch Saha ...",\n          "like_count": 0,\n          "love_count": 0,\n          "haha_count": 0,\n          "wow_count": 0,\n          "sad_count": 0,\n          "angry_count": 0,\n          "care_count": 0,\n          "replies": []\n        }\n      ]\n    }\n  ]\n}`}
                  style={{ fontSize: "0.8125rem" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleApplyJson()}
                  className="btn btn-primary btn-sm"
                >
                  Apply JSON to Form Fields
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                >
                  📁 Upload .json File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />

                {jsonText && (
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText("");
                      setJsonError(null);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PASTE RAW FACEBOOK TEXT */}
          {activeTab === "raw" && (
            <div>
              <p
                className="text-secondary"
                style={{ fontSize: "0.8125rem", marginBottom: "0.75rem" }}
              >
                Paste raw copied text from Facebook comments. The parser will
                extract commenter names, reconstruct replies, filter UI buttons,
                and discard media-only comments.
              </p>

              {rawError && (
                <div
                  className="alert alert-error mb-2"
                  style={{ fontSize: "0.8125rem", padding: "0.6rem 0.85rem" }}
                >
                  <strong>Parser Error:</strong> {rawError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Gopal Ch Saha&#10;·&#10;ভারতীয় তারকাটা...&#10;Reply&#10;Chandrani Sarkar&#10;·&#10;Gopal Ch Saha Oder ar moja...&#10;Reply"
                  style={{ fontSize: "0.8125rem" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleParseRaw}
                  className="btn btn-primary btn-sm"
                >
                  ⚡ Parse Raw Text
                </button>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText("");
                      setParseResult(null);
                      setRawError(null);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Parser Result & Metrics Display */}
              {parseResult && (
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.2)",
                    borderRadius: "6px",
                    padding: "0.85rem",
                    border: "1px solid var(--border-subtle, #2d3748)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "1.5rem",
                      flexWrap: "wrap",
                      marginBottom: "0.85rem",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <div>
                      <strong>Comments detected:</strong>{" "}
                      <span className="text-mono" style={{ color: "#38bdf8" }}>
                        {parseResult.metrics.commentsDetected}
                      </span>
                    </div>
                    <div>
                      <strong>Replies detected:</strong>{" "}
                      <span className="text-mono" style={{ color: "#a78bfa" }}>
                        {parseResult.metrics.repliesDetected}
                      </span>
                    </div>
                    <div>
                      <strong>Media-only discarded:</strong>{" "}
                      <span className="text-mono" style={{ color: "#fb923c" }}>
                        {parseResult.metrics.mediaOnlyDiscarded}
                      </span>
                    </div>
                    <div>
                      <strong>Ambiguous records:</strong>{" "}
                      <span className="text-mono" style={{ color: "#f87171" }}>
                        {parseResult.metrics.ambiguousRecords}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleApplyParsedToForm}
                      className="btn btn-primary btn-sm"
                    >
                      ✓ Load into Form (Autofill)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadJson(parseResult.dataset)}
                      className="btn btn-secondary btn-sm"
                    >
                      💾 Download Canonical JSON
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
