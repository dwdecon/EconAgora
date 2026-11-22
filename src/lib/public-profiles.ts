import { db } from "@/lib/cloudbase";

export interface PublicProfile {
  id: string;
  name: string;
  avatar: string | null;
}

export async function fetchPublicProfiles(ids: readonly string[]): Promise<Record<string, PublicProfile>> {
  const profiles: Record<string, PublicProfile> = Object.create(null);
  const batches: string[][] = [];
  let batch: string[] = [];
  let encodedSize = 0;
  for (const id of new Set(ids)) {
    if (typeof id !== "string" || !id) throw new Error("Invalid profile identifier.");
    // JSON quotes/escapes overestimate PostgREST's plain identifier syntax.
    // Leave room for select, limit, separators and URLSearchParams encoding.
    const size = encodeURIComponent(JSON.stringify(id)).length + 3;
    if (size > 6000) throw new Error("Profile identifier exceeds the query limit.");
    if (batch.length >= 100 || encodedSize + size > 6000) {
      batches.push(batch);
      batch = [];
      encodedSize = 0;
    }
    batch.push(id);
    encodedSize += size;
  }
  if (batch.length) batches.push(batch);
  for (const ids of batches) {
    const { data, error } = await db.from<Array<{ cloudbase_uid: string; name: string; avatar: string | null }>>("user_profile")
      .select("cloudbase_uid,name,avatar").in("cloudbase_uid", ids).limit(100);
    if (error) throw new Error(error.message);
    for (const row of data) {
      profiles[row.cloudbase_uid] = { id: row.cloudbase_uid, name: row.name, avatar: row.avatar };
    }
  }
  return profiles;
}
