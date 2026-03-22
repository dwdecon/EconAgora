"use client";

import { useRef, useState, useTransition } from "react";
import { db, getSessionUser } from "@/lib/cloudbase";
import { createId } from "@/lib/rdb-utils";

type TargetType = "PROMPT" | "POST";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_agent_comment: boolean;
  user_id: string;
  author?: { id: string; name: string; avatar: string | null };
  replies?: Comment[];
}

export default function CommentSection({
  targetType,
  targetId,
  comments: initialComments,
  isLoggedIn,
}: {
  targetType: TargetType;
  targetId: string;
  comments: Comment[];
  isLoggedIn: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const replyFormRefs = useRef<Record<string, HTMLFormElement | null>>({});

  async function handleSubmit(formData: FormData, parentId?: string) {
    const content = String(formData.get("content") || "").trim();
    if (!content) return;

    const sessionUser = await getSessionUser();
    if (!sessionUser) return;

    const commentId = createId("comment");
    const now = new Date().toISOString();
    const insertPayload: Record<string, unknown> = {
      _id: commentId,
      author_id: sessionUser.id,
      target_type: targetType,
      target_id: targetId,
      content,
      is_agent_comment: false,
      created_at: now,
      updated_at: now,
    };
    if (parentId) {
      insertPayload.parent_id = parentId;
    }

    const { error } = await db.from("comment").insert(insertPayload);
    if (error) return;

    const { data: profile } = await db
      .from("user_profile")
      .select("*")
      .eq("cloudbase_uid", sessionUser.id)
      .single();

    const newComment: Comment = {
      id: commentId,
      content,
      created_at: now,
      is_agent_comment: false,
      user_id: sessionUser.id,
      author: profile
        ? {
            id: sessionUser.id,
            name: (profile as any).name,
            avatar: (profile as any).avatar,
          }
        : { id: sessionUser.id, name: "User", avatar: null },
      replies: [],
    };

    if (parentId) {
      setComments((previousComments) => {
        const addReply = (items: Comment[]): Comment[] =>
          items.map((item) => {
            if (item.id === parentId) {
              return {
                ...item,
                replies: [...(item.replies || []), newComment],
              };
            }
            if (item.replies && item.replies.length > 0) {
              return { ...item, replies: addReply(item.replies) };
            }
            return item;
          });

        return addReply(previousComments);
      });
      replyFormRefs.current[parentId]?.reset();
      setReplyingTo(null);
      return;
    }

    setComments((previousComments) => [newComment, ...previousComments]);
    formRef.current?.reset();
  }

  return (
    <div className="mt-12">
      <h3 className="mb-6 text-lg font-semibold">Comments ({comments.length})</h3>

      {isLoggedIn ? (
        <form
          ref={formRef}
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(() => handleSubmit(formData));
          }}
          className="mb-8"
        >
          <textarea
            name="content"
            required
            rows={3}
            placeholder="Write a comment..."
            className="w-full resize-none rounded-xl border border-dark-border bg-dark-card p-4 text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
          >
            Post comment
          </button>
        </form>
      ) : null}

      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-dark-border p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {comment.author?.name || "User"}
                </span>
                {comment.is_agent_comment ? (
                  <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                    via AI Agent
                  </span>
                ) : null}
                <span className="text-xs text-gray-text">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              {isLoggedIn ? (
                <button
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                  className="text-xs text-primary transition hover:text-primary-hover"
                >
                  {replyingTo === comment.id ? "Cancel" : "Reply"}
                </button>
              ) : null}
            </div>
            <p className="text-sm text-gray-text">{comment.content}</p>

            {replyingTo === comment.id ? (
              <form
                ref={(element) => {
                  replyFormRefs.current[comment.id] = element;
                }}
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  startTransition(() => handleSubmit(formData, comment.id));
                }}
                className="mt-3"
              >
                <textarea
                  name="content"
                  required
                  rows={2}
                  placeholder={`Reply to ${comment.author?.name || "User"}...`}
                  autoFocus
                  className="w-full resize-none rounded-lg border border-dark-border bg-dark-card p-3 text-sm text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
                >
                  Submit reply
                </button>
              </form>
            ) : null}

            {comment.replies && comment.replies.length > 0 ? (
              <div className="mt-3 ml-4 flex flex-col gap-3 border-l border-dark-border pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="rounded-lg border border-dark-border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {reply.author?.name || "User"}
                        </span>
                        {reply.is_agent_comment ? (
                          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                            via AI Agent
                          </span>
                        ) : null}
                        <span className="text-xs text-gray-text">
                          {new Date(reply.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {isLoggedIn ? (
                        <button
                          onClick={() =>
                            setReplyingTo(replyingTo === reply.id ? null : reply.id)
                          }
                          className="text-xs text-primary transition hover:text-primary-hover"
                        >
                          {replyingTo === reply.id ? "Cancel" : "Reply"}
                        </button>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-text">{reply.content}</p>

                    {replyingTo === reply.id ? (
                      <form
                        ref={(element) => {
                          replyFormRefs.current[reply.id] = element;
                        }}
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          startTransition(() => handleSubmit(formData, reply.id));
                        }}
                        className="mt-3"
                      >
                        <textarea
                          name="content"
                          required
                          rows={2}
                          placeholder={`Reply to ${reply.author?.name || "User"}...`}
                          autoFocus
                          className="w-full resize-none rounded-lg border border-dark-border bg-dark-card p-3 text-sm text-white placeholder:text-gray-text focus:border-primary focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
                        >
                          Submit reply
                        </button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
