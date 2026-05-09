"use client";

import { useRef, useState, useTransition, type ReactElement } from "react";
import { getSessionAccessToken } from "@/lib/cloudbase";

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
  locale = "zh",
}: {
  targetType: TargetType;
  targetId: string;
  comments: Comment[];
  isLoggedIn: boolean;
  locale?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const replyFormRefs = useRef<Record<string, HTMLFormElement | null>>({});

  async function handleSubmit(formData: FormData, parentId?: string) {
    setSubmitError("");
    const content = String(formData.get("content") || "").trim();
    if (!content) return;

    const accessToken = await getSessionAccessToken();
    if (!accessToken) {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/auth/login?callbackUrl=${callbackUrl}`);
      return;
    }

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetType,
        targetId,
        content,
        parentId,
      }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => null);
      console.error("Failed to create comment:", json);
      setSubmitError(json?.error || (locale === "en" ? "Failed to post comment." : "评论发送失败。"));
      return;
    }

    const payload = await response.json();
    const newComment = payload.comment as Comment;

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
              return {
                ...item,
                replies: addReply(item.replies),
              };
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

  function renderCommentItem(comment: Comment, depth = 0): ReactElement {
    const containerClassName =
      depth === 0
        ? "rounded-xl border border-[var(--color-border)] p-4"
        : "rounded-lg border border-[var(--color-border)] p-3";

    return (
      <div key={comment.id} className={containerClassName}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{comment.author?.name || "User"}</span>
            {comment.is_agent_comment ? (
              <span className="rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                {locale === "en" ? "via AI Agent" : "AI Agent"}
              </span>
            ) : null}
            <span className="text-xs text-[var(--color-text-secondary)]">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          {isLoggedIn ? (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
            >
              {replyingTo === comment.id
                ? locale === "en"
                  ? "Cancel"
                  : "取消"
                : locale === "en"
                  ? "Reply"
                  : "回复"}
            </button>
          ) : null}
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">{comment.content}</p>

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
              placeholder={`${locale === "en" ? "Reply to" : "回复"} ${comment.author?.name || "User"}...`}
              autoFocus
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
            />
            <button
              type="submit"
              disabled={isPending}
              className="mt-2 rounded-[6px] bg-[var(--color-text-primary)] px-3 py-1.5 text-[12px] font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
            >
              {locale === "en" ? "Submit reply" : "发送回复"}
            </button>
          </form>
        ) : null}

        {comment.replies && comment.replies.length > 0 ? (
          <div className="mt-3 ml-4 flex flex-col gap-3 border-l border-[var(--color-border)] pl-4">
            {comment.replies.map((reply) => renderCommentItem(reply, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h3 className="mb-6 text-lg font-semibold">
        {locale === "en" ? `Comments (${comments.length})` : `评论（${comments.length}）`}
      </h3>

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
          rows={5}
          placeholder={locale === "en" ? "Write a comment..." : "写下你的评论..."}
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-hover)] focus:shadow-[var(--shadow-focus)] focus:outline-none transition-shadow"
        />
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-[6px] bg-[var(--color-text-primary)] px-4 py-2 text-[14px] font-normal text-[var(--color-bg)] transition-opacity hover:opacity-80 disabled:opacity-50 shadow-[var(--shadow-inset-button)]"
        >
          {locale === "en" ? "Post comment" : "发布评论"}
        </button>
      </form>

      {submitError ? <p className="mb-4 text-sm text-red-500">{submitError}</p> : null}

      <div className="flex flex-col gap-4">
        {comments.map((comment) => renderCommentItem(comment))}
      </div>
    </div>
  );
}
