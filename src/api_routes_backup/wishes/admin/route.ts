import { allWishes, checkPassword, setWishStatus, type WishStatus } from "@/lib/wishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: WishStatus[] = ["pending", "approved", "hidden"];

/** Private: list every wish, or change one's status. Requires ADMIN_PASSWORD. */
export async function POST(req: Request) {
  let body: { password?: unknown; id?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!checkPassword(body.password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ ok: false, error: "Wrong password." }, { status: 401 });
  }
  if (typeof body.id === "string" && STATUSES.includes(body.status as WishStatus)) {
    const w = await setWishStatus(body.id, body.status as WishStatus);
    if (!w) return Response.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  const wishes = (await allWishes()).slice().reverse();
  return Response.json({ ok: true, wishes });
}
