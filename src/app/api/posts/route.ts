/**
 * /api/posts — Create and list posts.
 *
 * POST: Create a new post with comments and replies.
 * GET:  List all posts as summary rows for the home page table.
 */

import { NextRequest } from "next/server";
import { PostFormSchema } from "@/lib/schemas";
import { savePost, listPosts } from "@/lib/workbook/WorkbookRepository";

export const dynamic = "force-dynamic";

/**
 * GET /api/posts
 * Returns an array of PostSummaryRow for the recent records table.
 */
export async function GET() {
  try {
    const posts = await listPosts();
    return Response.json(posts);
  } catch (error) {
    console.error("[GET /api/posts] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to list posts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts
 * Accepts a PostFormData payload, validates it, saves to the workbook,
 * and returns the SaveResult.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod — server-side validation even if UI already constrains
    const parsed = PostFormSchema.safeParse(body);
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

    const result = await savePost(parsed.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/posts] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save post" },
      { status: 500 }
    );
  }
}
