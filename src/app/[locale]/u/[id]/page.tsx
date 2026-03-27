"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/cloudbase";
import { normalizeTags } from "@/lib/rdb-utils";
import PromptCard from "@/components/prompts/PromptCard";
import PostCard from "@/components/community/PostCard";

interface Prompt {
  _id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[] | string | null;
  like_count: number;
  download_count: number;
  author_id: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  tags: string[] | string | null;
  is_agent_post: boolean;
  like_count: number;
  created_at: string;
  author_id: string;
}

interface UserProfile {
  _id: string;
  name: string;
  avatar: string | null;
  affiliation: string | null;
  bio: string | null;
  cloudbase_uid: string;
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const [userRes, promptsRes, postsRes] = await Promise.all([
          db.from("user_profile").select("*").eq("cloudbase_uid", id).single(),
          db
            .from("prompt")
            .select("*")
            .eq("author_id", id)
            .order("created_at", { ascending: false })
            .limit(6),
          db
            .from("post")
            .select("*")
            .eq("author_id", id)
            .order("created_at", { ascending: false }),
        ]);

        if (cancelled) return;
        if (userRes.error || !userRes.data) {
          setError(userRes.error?.message || "User not found.");
          return;
        }

        setUser(userRes.data as UserProfile);
        setPrompts((promptsRes.data as Prompt[]) || []);
        setPosts((postsRes.data as Post[]) || []);
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error ? fetchError.message : "Failed to load user.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <PageShell
        width="4xl"
        className="flex min-h-[40vh] items-center justify-center"
      >
        <div className="text-[var(--color-text-secondary)]">Loading...</div>
      </PageShell>
    );
  }

  if (error || !user) {
    return (
      <PageShell
        width="4xl"
        className="flex min-h-[40vh] items-center justify-center"
      >
        <div className="text-[var(--color-text-secondary)]">{error || "User not found."}</div>
      </PageShell>
    );
  }

  const promptCards = prompts.map((prompt) => ({
    id: prompt._id,
    title: prompt.title,
    description: prompt.description,
    category: prompt.category,
    tags: normalizeTags(prompt.tags),
    likeCount: prompt.like_count ?? 0,
    downloadCount: prompt.download_count ?? 0,
    author: { id: user.cloudbase_uid, name: user.name, avatar: user.avatar },
  }));

  const postCards = posts.map((post) => ({
    id: post._id,
    title: post.title,
    content: post.content,
    tags: normalizeTags(post.tags),
    isAgentPost: post.is_agent_post ?? false,
    likeCount: post.like_count ?? 0,
    createdAt: new Date(post.created_at),
    author: { id: post.author_id, name: user.name, avatar: user.avatar },
    _count: { comments: 0 },
  }));

  return (
    <PageShell width="4xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] text-2xl font-bold text-primary">
          {user.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          {user.affiliation ? (
            <p className="text-sm text-[var(--color-text-secondary)]">{user.affiliation}</p>
          ) : null}
          {user.bio ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{user.bio}</p> : null}
        </div>
      </div>

      {promptCards.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Prompts</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {promptCards.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </section>
      ) : null}

      {postCards.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Community Posts</h2>
          <div className="flex flex-col gap-3">
            {postCards.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
