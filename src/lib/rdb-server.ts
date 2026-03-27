import { RdbQueryBuilder } from "@/lib/rdb";

function getServerRdbConfig() {
  const envId = process.env.NEXT_PUBLIC_CLOUDBASE_ENV_ID ?? "";
  const accessKey = process.env.CLOUDBASE_ACCESS_KEY ?? "";

  if (!envId) {
    throw new Error("NEXT_PUBLIC_CLOUDBASE_ENV_ID is not configured.");
  }

  if (!accessKey) {
    throw new Error("CLOUDBASE_ACCESS_KEY is not configured.");
  }

  return {
    accessKey,
    baseUrl: `https://${envId}.api.tcloudbasegateway.com/v1/rdb/rest`,
  };
}

export const serverDb = {
  from<TData = any>(table: string) {
    const { accessKey, baseUrl } = getServerRdbConfig();
    return new RdbQueryBuilder<TData>(table, baseUrl, accessKey);
  },
};
