// API client for the wall-posts endpoints (Cloudflare Pages Functions).
//
// Mirrors the verified contract in functions/api/wall-posts.ts:
//   GET    /api/wall-posts?slug=<handle> -> public list { posts: WallPostDTO[] }
//   GET    /api/wall-posts (no slug)     -> owner list of ALL statuses (auth)
//   POST   /api/wall-posts               -> create (auth) -> { id }
//   PUT    /api/wall-posts?id=<postId>   -> update (auth) -> { ok: true }
//   DELETE /api/wall-posts?id=<postId>   -> delete (auth) -> { ok: true }
//
// Writes rely on the Better Auth session cookie sent automatically by a
// same-origin `fetch` (matches how change-password.ts / requireUser work).
// Reuses the shared jsonRequest + ApiError from the trips client so there is a
// single error type across the dashboard's API calls.

import type { WallPost, WallPostStatus } from "../types/WallPost";
import { jsonRequest } from "./trips";

interface WallPostDTO {
  id: string;
  title: string | null;
  content: string | null;
  date?: string;
  postType?: string;
  status?: WallPostStatus;
  images?: string[];
}

function mapPost(raw: WallPostDTO): WallPost {
  return {
    id: raw.id,
    title: raw.title ?? "",
    content: raw.content ?? "",
    date: raw.date ?? "",
    status: raw.status ?? "draft",
    postType: raw.postType ?? "update",
    images: raw.images ?? [],
  };
}

export const wallPostsApi = {
  /** Public list of wall posts for a profile handle. No auth required. */
  async getWallPosts(slug: string): Promise<WallPost[]> {
    const data = await jsonRequest<{ posts: WallPostDTO[] }>(
      `/api/wall-posts?slug=${encodeURIComponent(slug)}`,
    );
    return (data.posts ?? []).map(mapPost);
  },

  /** Owner list of ALL posts (draft/published/archived) for the current user's
   *  dashboard post manager. Requires an auth session cookie. */
  async getOwnerPosts(): Promise<WallPost[]> {
    const data = await jsonRequest<{ posts: WallPostDTO[] }>("/api/wall-posts");
    return (data.posts ?? []).map(mapPost);
  },

  /** Create a wall post (auth). The caller passes the full post (including a
   *  local/temp id); we forward it so the server stores a stable uuid and
   *  returns it, letting the UI reconcile optimistic state. Returns the
   *  persisted post. */
  async createPost(
    post: WallPost,
    opts: { status?: WallPostStatus; images?: string[] } = {},
  ): Promise<WallPost> {
    const data = await jsonRequest<{ id: string }>("/api/wall-posts", {
      method: "POST",
      body: JSON.stringify({
        id: post.id,
        title: post.title,
        content: post.content,
        postType: post.postType ?? "update",
        status: opts.status,
        images: opts.images,
      }),
    });
    return { ...post, id: data.id, status: opts.status ?? "draft" };
  },

  /** Update a wall post (auth). */
  async updatePost(
    id: string,
    post: WallPost,
    opts: { images?: string[] } = {},
  ): Promise<void> {
    await jsonRequest<{ ok: true }>(
      `/api/wall-posts?id=${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          postType: post.postType ?? "update",
          images: opts.images,
        }),
      },
    );
  },

  /** Transition a post's lifecycle status (publish / unpublish / archive). */
  async transitionPost(id: string, status: WallPostStatus): Promise<void> {
    await jsonRequest<{ ok: true }>(
      `/api/wall-posts?id=${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
    );
  },

  /** Delete a wall post (auth). */
  async deletePost(id: string): Promise<void> {
    await jsonRequest<{ ok: true }>(
      `/api/wall-posts?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },
};
