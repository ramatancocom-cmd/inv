import nodemailer from "nodemailer";
import { invitation } from "@/config/invitation";
import { addWish, wishToken, type Wish } from "@/lib/wishes";
import { addRsvp } from "@/lib/rsvps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_GUESTS = invitation.features.rsvp.maxGuests;

// Simple in-memory rate limit: 5 submissions per IP per 10 minutes.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, max) : "";

async function notify(
  entry: { name: string; attending: string; guests: number; message: string; at: string },
  wish: Wish | null,
  origin: string,
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;
  const transport = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  const { couple } = invitation;
  const link = (action: "approve" | "hide") =>
    `${origin}/api/wishes/moderate?${new URLSearchParams({ id: wish!.id, action, token: wishToken(wish!.id, action) })}`;
  const moderation =
    wish && process.env.ADMIN_PASSWORD
      ? ["", "This guest would like the note shown on the wishes wall.", `Approve: ${link("approve")}`, `Hide: ${link("hide")}`]
      : [];
  await transport.sendMail({
    from: `"${couple.first} & ${couple.second} RSVP" <${user}>`,
    to: process.env.RSVP_NOTIFY_TO || user,
    subject: `RSVP: ${entry.name} ${entry.attending === "yes" ? `accepts (${entry.guests})` : "declines"}`,
    text: [
      `Name: ${entry.name}`,
      `Attending: ${entry.attending === "yes" ? "Joyfully accepts" : "Regretfully declines"}`,
      `Guests: ${entry.guests}`,
      `Message: ${entry.message || "-"}`,
      `Received: ${entry.at}`,
      ...moderation,
    ].join("\n"),
  });
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return Response.json({ ok: false, error: "Too many replies. Please try later." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real guests never fill this hidden field.
  if (clean(body.website, 100)) return Response.json({ ok: false, error: "Rejected." }, { status: 400 });

  const name = clean(body.name, 80);
  const attending = body.attending === "yes" || body.attending === "no" ? body.attending : "";
  const message = clean(body.message, 500);
  const guestsRaw = Number(body.guests);
  const guests = attending === "no" ? 0 : Math.round(guestsRaw);

  if (name.length < 2) return Response.json({ ok: false, error: "Please enter your name." }, { status: 400 });
  if (!attending) return Response.json({ ok: false, error: "Please choose whether you will attend." }, { status: 400 });
  if (attending === "yes" && !(guests >= 1 && guests <= MAX_GUESTS))
    return Response.json({ ok: false, error: `Number of guests must be 1 to ${MAX_GUESTS}.` }, { status: 400 });

  const at = new Date().toLocaleString("en-GB", { timeZone: invitation.event.timeZone }) + " (Cairo)";

  try {
    await addRsvp({ name, attending, guests, message, at, ip });
  } catch (e) {
    console.error("RSVP save failed", e);
    return Response.json({ ok: false, error: "We could not save your reply. Please try again." }, { status: 500 });
  }

  // Guests who opt in have their note queued for the wishes wall; it stays hidden until approved.
  let wish: Wish | null = null;
  if (message && body.showOnWall === true) {
    try {
      wish = await addWish(name, message, at);
    } catch (e) {
      console.error("Wish save failed", e);
    }
  }

  // The reply is saved; email is a best-effort notification on top.
  let emailed = false;
  try {
    const origin = process.env.SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
    emailed = await notify({ name, attending, guests, message, at }, wish, origin);
  } catch (e) {
    console.error("RSVP email failed", e);
  }

  return Response.json({ ok: true, emailed });
}
