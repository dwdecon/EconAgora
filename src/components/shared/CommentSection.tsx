"use client";

import { createComment } from "@/actions/comments";
import { TargetType } from "@prisma/client";
import { useRef } from "react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  isAgentComment: boolean;
  author: { id: string; name: string; avatar: string | null };
  replies?: Comment[];
}

export default function CommentSection({
  targetType,
  targetId,
  comments,
  isLoggedIn,
}: {
  targetType: TargetType;
  targetId: string;
  comments: Comment[];
  isLoggedIn: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("targetType", targetType);
    formData.set("targetId", targetId);
    await createComment(formData);
    formRef.current?.reset();
  }

  return (
    <div className="mt-12">
      <h3 className="text-lg font-semibold mb-6">评论 ({comments.length})</h3>

      {isLoggedIn && (
        <form ref={formRef} action={handleSubmit as any} className="mb-8">
          <textarea
            name="content"
            required
            rows={3}
            placeholder="写下你的评论..."
            className="w-full rounded-xl bg-dark-card border border-dark-border p-4 text-white placeholder:text-gray-text focus:border-primary focus:outline-none resize-none"
          />
          <button
            type="submit"
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            发表评论
          </button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-dark-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">{comment.author.name}</span>
              {comment.isAgentComment && (
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">via AI Agent</span>
              )}
              <span className="text-xs text-gray-text">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-text">{comment.content}</p>

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 ml-4 flex flex-col gap-3 border-l border-dark-border pl-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{reply.author.name}</span>
                      {reply.isAgentComment && (
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">via AI Agent</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-text">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
