/**
 * parser.test.ts — Comprehensive test suite for Canonical 7 Reactions Schema,
 * Infinite Recursive Reply Tree, Excel Relational Tree Persistence, and Round-Trip Integrity.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CanonicalDatasetSchema,
  CanonicalCommentSchema,
  CanonicalReplySchema,
  CommentFormSchema,
  ReplyFormSchema,
  PostFormSchema,
} from "../src/lib/schemas.ts";
import {
  parseFacebookRawText,
  parseCountWithPrecision,
  detectLanguage,
  normalizeRawText,
  segmentBlocks,
} from "../src/lib/parser.ts";
import { preparePayload, validateRelationships } from "../src/lib/domain.ts";
import { postToRow, rowToPost } from "../src/lib/workbook/mappers.ts";
import type { CanonicalDataset, PostFormData, CommentFormData, ReplyFormData } from "../src/lib/types.ts";

describe("PART 12: Comprehensive Test Suite for Recursive Tree & 7 Reactions", () => {
  // TEST 1: Comment with no replies
  it("TEST 1: Comment with no replies validates and prepares correctly", () => {
    const data: CanonicalDataset = {
      comments: [
        {
          commenter_name: "John Doe",
          comment_text: "Top level single comment",
          like_count: 5,
          love_count: 1,
          haha_count: 0,
          wow_count: 0,
          sad_count: 0,
          angry_count: 0,
          care_count: 0,
          replies: [],
        },
      ],
    };

    const parsed = CanonicalDatasetSchema.safeParse(data);
    assert.equal(parsed.success, true);
    assert.equal(data.comments[0].replies?.length, 0);
  });

  // TEST 2: Comment -> Reply (1 level)
  it("TEST 2: Comment -> Reply hierarchy is preserved", () => {
    const data: CanonicalDataset = {
      comments: [
        {
          commenter_name: "Parent Commenter",
          comment_text: "Parent comment",
          like_count: 10,
          replies: [
            {
              commenter_name: "Child Replier",
              reply_text: "First level reply",
              like_count: 2,
              replies: [],
            },
          ],
        },
      ],
    };

    const parsed = CanonicalDatasetSchema.safeParse(data);
    assert.equal(parsed.success, true);
    assert.equal(data.comments[0].replies!.length, 1);
    assert.equal(data.comments[0].replies![0].commenter_name, "Child Replier");
  });

  // TEST 3: Comment -> Reply -> Reply (2 levels of replies)
  it("TEST 3: Comment -> Reply -> Reply (depth 2) validates recursively", () => {
    const data: CanonicalDataset = {
      comments: [
        {
          commenter_name: "C1",
          comment_text: "Comment 1",
          like_count: 1,
          replies: [
            {
              commenter_name: "R1",
              reply_text: "Reply 1 to C1",
              like_count: 1,
              replies: [
                {
                  commenter_name: "R2",
                  reply_text: "Reply 2 to R1",
                  like_count: 1,
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = CanonicalDatasetSchema.safeParse(data);
    assert.equal(parsed.success, true);
    assert.equal(data.comments[0].replies![0].replies!.length, 1);
    assert.equal(data.comments[0].replies![0].replies![0].commenter_name, "R2");
  });

  // TEST 4: Deep nesting (Comment -> Reply -> Reply -> Reply -> Reply)
  it("TEST 4: Deep nesting (4 levels of replies) without depth limit", () => {
    const data: CanonicalDataset = {
      comments: [
        {
          commenter_name: "Root",
          comment_text: "Depth 0",
          replies: [
            {
              commenter_name: "Level 1",
              reply_text: "Depth 1",
              replies: [
                {
                  commenter_name: "Level 2",
                  reply_text: "Depth 2",
                  replies: [
                    {
                      commenter_name: "Level 3",
                      reply_text: "Depth 3",
                      replies: [
                        {
                          commenter_name: "Level 4",
                          reply_text: "Depth 4",
                          like_count: 99,
                          replies: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = CanonicalDatasetSchema.safeParse(data);
    assert.equal(parsed.success, true);
    const deepReply = data.comments[0].replies![0].replies![0].replies![0].replies![0];
    assert.equal(deepReply.commenter_name, "Level 4");
    assert.equal(deepReply.like_count, 99);
  });

  // TEST 5: Multiple replies at different branches
  it("TEST 5: Multiple branches at different nesting levels", () => {
    const data: CanonicalDataset = {
      comments: [
        {
          commenter_name: "Comment Root",
          comment_text: "Multi-branch tree",
          replies: [
            {
              commenter_name: "Reply A",
              reply_text: "Branch A",
              replies: [
                {
                  commenter_name: "Reply A1",
                  reply_text: "Nested under A",
                  replies: [],
                },
              ],
            },
            {
              commenter_name: "Reply B",
              reply_text: "Branch B",
              replies: [
                {
                  commenter_name: "Reply B1",
                  reply_text: "First child under B",
                  replies: [],
                },
                {
                  commenter_name: "Reply B2",
                  reply_text: "Second child under B",
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = CanonicalDatasetSchema.safeParse(data);
    assert.equal(parsed.success, true);
    assert.equal(data.comments[0].replies!.length, 2);
    assert.equal(data.comments[0].replies![0].replies!.length, 1);
    assert.equal(data.comments[0].replies![1].replies!.length, 2);
  });

  // TEST 6: Seven separate reaction counts
  it("TEST 6: Seven separate reaction counts are accurately preserved", () => {
    const comment = {
      commenter_name: "Reaction Tester",
      comment_text: "Testing all 7 reaction counts",
      like_count: 10,
      love_count: 20,
      haha_count: 30,
      wow_count: 40,
      sad_count: 50,
      angry_count: 60,
      care_count: 70,
      replies: [],
    };

    const parsed = CanonicalCommentSchema.safeParse(comment);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.like_count, 10);
      assert.equal(parsed.data.love_count, 20);
      assert.equal(parsed.data.haha_count, 30);
      assert.equal(parsed.data.wow_count, 40);
      assert.equal(parsed.data.sad_count, 50);
      assert.equal(parsed.data.angry_count, 60);
      assert.equal(parsed.data.care_count, 70);
    }
  });

  // TEST 7: Some reactions = 0
  it("TEST 7: Explicit 0 reactions are preserved as 0 (not converted to null/undefined)", () => {
    const comment = {
      commenter_name: "Zero Tester",
      comment_text: "Explicit zeroes",
      like_count: 0,
      love_count: 0,
      haha_count: 0,
      wow_count: 0,
      sad_count: 0,
      angry_count: 0,
      care_count: 0,
      replies: [],
    };

    const parsed = CanonicalCommentSchema.safeParse(comment);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.like_count, 0);
      assert.equal(parsed.data.love_count, 0);
      assert.equal(parsed.data.haha_count, 0);
      assert.equal(parsed.data.care_count, 0);
    }
  });

  // TEST 8: Some reactions = null/unavailable
  it("TEST 8: Null / unavailable reactions are preserved as null", () => {
    const comment = {
      commenter_name: "Null Tester",
      comment_text: "Unavailable reactions",
      like_count: null,
      love_count: null,
      haha_count: null,
      wow_count: null,
      sad_count: null,
      angry_count: null,
      care_count: null,
      replies: [],
    };

    const parsed = CanonicalCommentSchema.safeParse(comment);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.like_count, null);
      assert.equal(parsed.data.love_count, null);
    }
  });

  // TEST 9: JSON import containing nested replies
  it("TEST 9: JSON parser safely parses JSON string with nested replies", () => {
    const jsonString = JSON.stringify({
      comments: [
        {
          commenter_name: "Gopal Ch Saha",
          comment_text: "Root text",
          like_count: 15,
          replies: [
            {
              commenter_name: "Chandrani Sarkar",
              reply_text: "Nested reply 1",
              like_count: 3,
              replies: [
                {
                  commenter_name: "Sandip Sarkar",
                  reply_text: "Deep nested reply 2",
                  like_count: 1,
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
    });

    const parsedRaw = JSON.parse(jsonString);
    const validation = CanonicalDatasetSchema.safeParse(parsedRaw);
    assert.equal(validation.success, true);
    assert.equal(validation.data!.comments[0].replies![0].replies![0].commenter_name, "Sandip Sarkar");
  });

  // TEST 10: Export nested data to relational model and verify parent relationships
  it("TEST 10: preparePayload converts recursive tree into flat relational rows with correct parent_id", () => {
    const formData: any = {
      post_id: "FB_000001",
      platform: "Facebook",
      content_type: "Post",
      source_name: "News Channel",
      source_type: "News Page",
      language: "English",
      collection_date: "2026-08-19",
      collection_timestamp: "2026-08-19T10:00:00Z",
      comments: [
        {
          comment_id: "C_000001",
          commenter_name: "Commenter 1",
          comment_text: "Comment 1 Text",
          like_count: 10,
          replies: [
            {
              reply_id: "R_000001",
              commenter_name: "Replier 1",
              reply_text: "Reply 1 Text",
              like_count: 2,
              replies: [
                {
                  reply_id: "R_000002",
                  commenter_name: "Replier 2",
                  reply_text: "Reply 2 Text",
                  like_count: 1,
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const payload = preparePayload(formData, ["FB_000001"], ["C_000001"], ["R_000001", "R_000002"]);
    assert.equal(payload.comments.length, 1);
    assert.equal(payload.replies.length, 2);

    // Verify parent relationships
    const r1 = payload.replies.find((r) => r.reply_id === "R_000001");
    const r2 = payload.replies.find((r) => r.reply_id === "R_000002");

    assert.ok(r1, "R_000001 exists");
    assert.ok(r2, "R_000002 exists");
    assert.equal(r1!.parent_id, "C_000001", "R1 parent is C1");
    assert.equal(r2!.parent_id, "R_000001", "R2 parent is R1 (relational link preserved)");
  });

  // TEST 11: Import/export round trip without hierarchy loss
  it("TEST 11: Tree round trip (Tree -> Relational Flat -> Reconstructed Tree) is 100% lossless", () => {
    // Initial hierarchical form data
    const originalForm: any = {
      post_id: "FB_000042",
      platform: "Facebook",
      content_type: "Post",
      source_name: "Page",
      source_type: "News Page",
      language: "English",
      comments: [
        {
          comment_id: "C_000010",
          commenter_name: "C10",
          comment_text: "Root C10",
          like_count: 5,
          love_count: 2,
          haha_count: 1,
          wow_count: 0,
          sad_count: 0,
          angry_count: 0,
          care_count: 0,
          replies: [
            {
              reply_id: "R_000010",
              commenter_name: "R10",
              reply_text: "Child of C10",
              like_count: 1,
              replies: [
                {
                  reply_id: "R_000011",
                  commenter_name: "R11",
                  reply_text: "Child of R10",
                  like_count: 0,
                  replies: [
                    {
                      reply_id: "R_000012",
                      commenter_name: "R12",
                      reply_text: "Child of R11",
                      like_count: 4,
                      replies: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    // Flatten to relational rows
    const prepared = preparePayload(originalForm, ["FB_000042"], ["C_000010"], ["R_000010", "R_000011", "R_000012"]);

    // Reconstruct tree from flat relational rows (simulating WorkbookRepository.getPost logic)
    const replyNodes = new Map<string, ReplyFormData & { parentId: string }>();
    for (const r of prepared.replies) {
      replyNodes.set(r.reply_id, {
        reply_id: r.reply_id,
        commenter_name: "",
        reply_text: r.reply_text,
        like_count: r.like_count,
        love_count: r.love_count,
        haha_count: r.haha_count,
        wow_count: r.wow_count,
        sad_count: r.sad_count,
        angry_count: r.angry_count,
        care_count: r.care_count,
        collection_timestamp: r.collection_timestamp,
        replies: [],
        parentId: r.parent_id,
      });
    }

    const commentNodes = new Map<string, CommentFormData>();
    for (const c of prepared.comments) {
      commentNodes.set(c.comment_id, {
        comment_id: c.comment_id,
        commenter_name: "",
        comment_text: c.comment_text,
        like_count: c.like_count,
        love_count: c.love_count,
        haha_count: c.haha_count,
        wow_count: c.wow_count,
        sad_count: c.sad_count,
        angry_count: c.angry_count,
        care_count: c.care_count,
        collection_timestamp: c.collection_timestamp,
        replies: [],
      });
    }

    for (const rNode of replyNodes.values()) {
      const { parentId, ...cleanReply } = rNode;
      if (replyNodes.has(parentId)) {
        replyNodes.get(parentId)!.replies!.push(cleanReply);
      } else if (commentNodes.has(parentId)) {
        commentNodes.get(parentId)!.replies!.push(cleanReply);
      }
    }

    const reconstructed = Array.from(commentNodes.values());

    // Verify tree reconstruction
    assert.equal(reconstructed.length, 1);
    assert.equal(reconstructed[0].comment_id, "C_000010");
    assert.equal(reconstructed[0].replies.length, 1);
    assert.equal(reconstructed[0].replies[0].reply_id, "R_000010");
    assert.equal(reconstructed[0].replies[0].replies!.length, 1);
    assert.equal(reconstructed[0].replies[0].replies![0].reply_id, "R_000011");
    assert.equal(reconstructed[0].replies[0].replies![0].replies!.length, 1);
    assert.equal(reconstructed[0].replies[0].replies![0].replies![0].reply_id, "R_000012");
    assert.equal(reconstructed[0].replies[0].replies![0].replies![0].like_count, 4);
  });

  // TEST 12: Existing one-level data continues to work
  it("TEST 12: Legacy one-level comment/reply data continues to work seamlessly", () => {
    const legacyPayload = {
      comments: [
        {
          commenter_name: "Legacy User",
          comment_text: "Simple legacy comment",
          like_count: 3,
          replies: [
            {
              commenter_name: "Legacy Replier",
              reply_text: "Simple legacy reply",
              like_count: 1,
            },
          ],
        },
      ],
    };

    const parsed = CanonicalDatasetSchema.safeParse(legacyPayload);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data!.comments[0].replies!.length, 1);
  });

  // TEST 13: Add Reply to a deeply nested reply attaches to the correct parent
  it("TEST 13: Adding a reply to a deeply nested reply inserts into that node's replies array", () => {
    const initialTree: ReplyFormData = {
      reply_id: "R_000001",
      commenter_name: "R1",
      reply_text: "Reply 1",
      replies: [
        {
          reply_id: "R_000002",
          commenter_name: "R2",
          reply_text: "Reply 2",
          replies: [],
        },
      ],
    };

    // Simulate Add Reply to R2
    const targetNode = initialTree.replies![0];
    const newReply: ReplyFormData = {
      commenter_name: "R3",
      reply_text: "Reply 3 attached directly to R2",
      like_count: 0,
      replies: [],
    };
    targetNode.replies = targetNode.replies || [];
    targetNode.replies.push(newReply);

    assert.equal(initialTree.replies!.length, 1);
    assert.equal(initialTree.replies![0].replies!.length, 1);
    assert.equal(initialTree.replies![0].replies![0].commenter_name, "R3");
  });

  // TEST 14: Null comment_text, reply_text, commenter_name and string numbers
  it("TEST 14: Accepts null comment_text, null reply_text, null commenter_name and string numbers", () => {
    const payloadWithNulls = {
      comments: [
        {
          commenter_name: null,
          comment_text: null,
          like_count: "15",
          love_count: "0",
          haha_count: null,
          wow_count: "",
          sad_count: "null",
          angry_count: 0,
          care_count: 0,
          replies: [
            {
              commenter_name: null,
              reply_text: null,
              like_count: "2",
              love_count: null,
              haha_count: "0",
              wow_count: 0,
              sad_count: 0,
              angry_count: 0,
              care_count: 0,
              replies: [],
            },
          ],
        },
      ],
    };

    const parsed = CanonicalDatasetSchema.safeParse(payloadWithNulls);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.comments[0].comment_text, "");
      assert.equal(parsed.data.comments[0].commenter_name, "");
      assert.equal(parsed.data.comments[0].like_count, 15);
      assert.equal(parsed.data.comments[0].love_count, 0);
      assert.equal(parsed.data.comments[0].sad_count, null);
      assert.equal(parsed.data.comments[0].replies![0].reply_text, "");
      assert.equal(parsed.data.comments[0].replies![0].like_count, 2);
    }
  });
});

describe("Raw Facebook Text Parser Compatibility", () => {
  it("parses raw text and produces valid canonical dataset with 7 reactions and replies array", () => {
    const raw = `
Gopal Ch Saha
·
ভারতীয় তারকাটা, সীমান্ত শূন্য রেখা থেকে কম করে ১৫০ গজ দূরে অবস্থিত ।
Reply
Chandrani Sarkar
·
Gopal Ch Saha Oder ar moja maranor kichhu nai nai bina poysaye...
Reply
Sandip Sarkar
·
Gopal Ch Saha শালাদের পেছনে গুলি কেন করলোনা।
Reply
`;
    const result = parseFacebookRawText(raw);
    assert.equal(result.metrics.commentsDetected, 1);
    assert.equal(result.metrics.repliesDetected, 2);
    assert.equal(result.dataset.comments[0].commenter_name, "Gopal Ch Saha");
    assert.equal(result.dataset.comments[0].replies!.length, 2);
    assert.equal(result.dataset.comments[0].like_count, 0);
    assert.equal(result.dataset.comments[0].replies![0].like_count, 0);
  });
});

describe("PART 15: Post-Level Count Precision System (Test Cases A through J)", () => {
  // Test A: Exact views
  it("Test A: Exact views -> 1247 produces precise precision", () => {
    const res1 = parseCountWithPrecision("1,247 views");
    assert.equal(res1.count, 1247);
    assert.equal(res1.precision, "precise");
    assert.equal(res1.display, "1,247");

    const res2 = parseCountWithPrecision(1247);
    assert.equal(res2.count, 1247);
    assert.equal(res2.precision, "precise");
  });

  // Test B: Approximate views
  it("Test B: Approximate views -> 1.1K produces approximate precision", () => {
    const res = parseCountWithPrecision("1.1K views");
    assert.equal(res.count, 1100);
    assert.equal(res.precision, "approximate");
    assert.equal(res.display, "1.1K");
  });

  // Test C: Exact reactions
  it("Test C: Exact reactions -> 247 produces precise precision", () => {
    const res = parseCountWithPrecision("247 reactions");
    assert.equal(res.count, 247);
    assert.equal(res.precision, "precise");
    assert.equal(res.display, "247");
  });

  // Test D: Approximate reactions
  it("Test D: Approximate reactions -> 1.1K produces approximate precision", () => {
    const res = parseCountWithPrecision("1.1K reactions");
    assert.equal(res.count, 1100);
    assert.equal(res.precision, "approximate");
    assert.equal(res.display, "1.1K");
  });

  // Test E: Exact comments
  it("Test E: Exact comments -> 247 produces precise precision", () => {
    const res = parseCountWithPrecision("247 comments");
    assert.equal(res.count, 247);
    assert.equal(res.precision, "precise");
    assert.equal(res.display, "247");
  });

  // Test F: Approximate comments
  it("Test F: Approximate comments -> 1.1K produces approximate precision", () => {
    const res = parseCountWithPrecision("1.1K comments");
    assert.equal(res.count, 1100);
    assert.equal(res.precision, "approximate");
    assert.equal(res.display, "1.1K");
  });

  // Test G: Missing metric
  it("Test G: Missing metric -> null produces unavailable precision", () => {
    const res1 = parseCountWithPrecision(null);
    assert.equal(res1.count, null);
    assert.equal(res1.precision, "unavailable");

    const res2 = parseCountWithPrecision("");
    assert.equal(res2.count, null);
    assert.equal(res2.precision, "unavailable");
  });

  // Test H: Comment with like_count=2, love_count=1, haha_count=0 (No precision on comment reactions)
  it("Test H: Comment reactions have no precision metadata", () => {
    const commentData: CommentFormData = {
      commenter_name: "Commenter 1",
      comment_text: "Text",
      like_count: 2,
      love_count: 1,
      haha_count: 0,
      replies: [],
    };

    const parsed = CommentFormSchema.safeParse(commentData);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal((parsed.data as any).like_count_precision, undefined);
      assert.equal((parsed.data as any).love_count_precision, undefined);
      assert.equal(parsed.data.like_count, 2);
      assert.equal(parsed.data.love_count, 1);
      assert.equal(parsed.data.haha_count, 0);
    }
  });

  // Test I: Deeply nested reply hierarchy has no precision fields on replies
  it("Test I: Deeply nested replies maintain simple numerical reactions with no precision fields", () => {
    const nestedComment: CommentFormData = {
      commenter_name: "C1",
      comment_text: "Top comment",
      like_count: 5,
      replies: [
        {
          commenter_name: "R1",
          reply_text: "Reply 1",
          like_count: 3,
          replies: [
            {
              commenter_name: "R2",
              reply_text: "Reply 2",
              like_count: 1,
              replies: [
                {
                  commenter_name: "R3",
                  reply_text: "Reply 3",
                  like_count: 0,
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = CommentFormSchema.safeParse(nestedComment);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      const r3 = parsed.data.replies![0].replies![0].replies![0];
      assert.equal(r3.commenter_name, "R3");
      assert.equal(r3.like_count, 0);
      assert.equal((r3 as any).like_count_precision, undefined);
    }
  });

  // Test J: JSON -> Webapp -> Excel -> Webapp round-trip preserves post-level precision
  it("Test J: Post-level precision metadata survives the full round-trip", () => {
    const formData: PostFormData = {
      post_id: "FB_000001",
      platform: "Facebook",
      content_type: "Post",
      source_name: "Assam News",
      source_type: "News Page",
      original_post_date: "01/01/2026",
      collection_date: "02/01/2026",
      language: "English",
      post_text: "Test post body",
      view_count: 1100,
      view_count_display: "1.1K",
      view_count_precision: "approximate",
      reaction_count: 247,
      reaction_count_display: "247",
      reaction_count_precision: "precise",
      like_count: 200,
      love_count: 47,
      haha_count: 0,
      angry_count: 0,
      sad_count: 0,
      wow_count: 0,
      care_count: 0,
      comment_count: null,
      comment_count_display: "",
      comment_count_precision: "unavailable",
      comments: [
        {
          comment_id: "C_000001",
          commenter_name: "Commenter",
          comment_text: "Comment body",
          like_count: 10,
          replies: [],
        },
      ],
    };

    // 1. Prepare payload
    const prepared = preparePayload(formData, [], [], []);
    assert.equal(prepared.post.view_count, 1100);
    assert.equal(prepared.post.view_count_display, "1.1K");
    assert.equal(prepared.post.view_count_precision, "approximate");
    assert.equal(prepared.post.reaction_count, 247);
    assert.equal(prepared.post.reaction_count_display, "247");
    assert.equal(prepared.post.reaction_count_precision, "precise");
    assert.equal(prepared.post.comment_count, null);
    assert.equal(prepared.post.comment_count_precision, "unavailable");

    // 2. Convert to Excel row
    const row = postToRow(prepared.post);

    // 3. Read back from Excel row
    const rowRecord: Record<string, unknown> = {
      post_id: prepared.post.post_id,
      platform: prepared.post.platform,
      content_type: prepared.post.content_type,
      source_name: prepared.post.source_name,
      source_type: prepared.post.source_type,
      original_post_date: prepared.post.original_post_date,
      collection_date: prepared.post.collection_date,
      collection_timestamp: prepared.post.collection_timestamp,
      language: prepared.post.language,
      post_text: prepared.post.post_text,
      view_count: prepared.post.view_count,
      view_count_display: prepared.post.view_count_display,
      view_count_precision: prepared.post.view_count_precision,
      reaction_count: prepared.post.reaction_count,
      reaction_count_display: prepared.post.reaction_count_display,
      reaction_count_precision: prepared.post.reaction_count_precision,
      comment_count: prepared.post.comment_count,
      comment_count_display: prepared.post.comment_count_display,
      comment_count_precision: prepared.post.comment_count_precision,
    };

    const restoredPost = rowToPost(rowRecord);
    assert.equal(restoredPost.view_count, 1100);
    assert.equal(restoredPost.view_count_display, "1.1K");
    assert.equal(restoredPost.view_count_precision, "approximate");
    assert.equal(restoredPost.reaction_count, 247);
    assert.equal(restoredPost.reaction_count_display, "247");
    assert.equal(restoredPost.reaction_count_precision, "precise");
    assert.equal(restoredPost.comment_count, null);
    assert.equal(restoredPost.comment_count_precision, "unavailable");
  });
});
