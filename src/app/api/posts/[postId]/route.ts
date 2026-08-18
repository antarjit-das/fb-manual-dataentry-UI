/**
 * /api/posts/[postId] — Load and update a single post.
 *
 * GET: Load a post with all its comments and replies (for edit/reopen).
 * PUT: Update an existing post.
 */

import { NextRequest } from "next/server";
import { PostFormSchema } from "@/lib/schemas";
import { getPost, updatePost } from "@/lib/workbook/WorkbookRepository";

export const dynamic = "force-dynamic";

/**
 * GET /api/posts/[postId]
 * Returns the full hierarchical PostFormData for a single post.
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/posts/[postId]">
) {
  try {
    const { postId } = await ctx.params;
    const post = await getPost(postId);

    if (!post) {
      return Response.json(
        { error: `Post ${postId} not found` },
        { status: 404 }
      );
    }

    return Response.json(post);
  } catch (error) {
    console.error("[GET /api/posts/[postId]] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load post" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/posts/[postId]
 * Accepts a PostFormData payload, validates it, updates the workbook,
 * and returns the SaveResult.
 */
export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/posts/[postId]">
) {
  try {
    const { postId } = await ctx.params;
    const body = await request.json();

    // Ensure the postId in the URL matches the payload
    const payload = { ...body, post_id: postId };

    // Validate with Zod
    const parsed = PostFormSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const result = await updatePost(parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error("[PUT /api/posts/[postId]] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update post" },
      { status: 500 }
    );
  }
}
