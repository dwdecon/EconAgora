import { proxyRdbRead } from "@/lib/rdb-proxy";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  return proxyRdbRead(request, (await context.params).path);
}

export { handle as GET, handle as HEAD, handle as POST, handle as PATCH, handle as DELETE, handle as PUT };
