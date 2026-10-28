import { checkToken, setWishStatus } from "@/lib/wishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const page = (title: string, body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#F5EDE0;font-family:Georgia,serif;color:#3A2A1A;text-align:center;padding:24px">
<div style="max-width:440px;background:#FDFBF7;border:1px solid #C9A227;padding:40px 28px"><h1 style="font-weight:500;margin:0 0 12px">${title}</h1><p style="font-size:18px;line-height:1.5;margin:0">${body}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** One-click approve / hide from the Gmail notification. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const action = url.searchParams.get("action");
  const token = url.searchParams.get("token") ?? "";
  if ((action !== "approve" && action !== "hide") || !checkToken(id, action, token)) {
    return page("Link not valid", "This approval link is invalid or has expired.", 403);
  }
  const w = await setWishStatus(id, action === "approve" ? "approved" : "hidden");
  if (!w) return page("Not found", "This wish no longer exists.", 404);
  return action === "approve"
    ? page("Wish approved", `The wish from <b>${esc(w.name)}</b> now appears on the wishes wall.`)
    : page("Wish hidden", `The wish from <b>${esc(w.name)}</b> will not be shown.`);
}
