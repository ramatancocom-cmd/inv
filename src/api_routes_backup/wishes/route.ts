import { approvedWishes } from "@/lib/wishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: only wishes the couple has approved. */
export async function GET() {
  try {
    return Response.json({ wishes: await approvedWishes() });
  } catch {
    return Response.json({ wishes: [] }, { status: 500 });
  }
}
