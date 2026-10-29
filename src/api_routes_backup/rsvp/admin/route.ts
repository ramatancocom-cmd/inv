import { allRsvps, deleteRsvp, getRsvpsTxtContent } from "@/lib/rsvps";
import { checkPassword } from "@/lib/wishes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: {
    password?: unknown;
    action?: "list" | "delete" | "download_txt";
    id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
  }

  if (!checkPassword(body.password)) {
    await new Promise((r) => setTimeout(r, 600)); // anti brute-force delay
    return Response.json({ ok: false, error: "Wrong password." }, { status: 401 });
  }

  if (body.action === "delete" && typeof body.id === "string") {
    const deleted = await deleteRsvp(body.id);
    if (!deleted) {
      return Response.json({ ok: false, error: "RSVP entry not found." }, { status: 404 });
    }
  }

  const rsvps = (await allRsvps()).slice().reverse();
  const rawTxt = await getRsvpsTxtContent();

  const totalResponses = rsvps.length;
  const attendingList = rsvps.filter((r) => r.attending === "yes");
  const declinedList = rsvps.filter((r) => r.attending === "no");
  const totalAttending = attendingList.length;
  const totalDeclined = declinedList.length;
  const totalGuests = attendingList.reduce((sum, r) => sum + (r.guests || 1), 0);

  return Response.json({
    ok: true,
    rsvps,
    rawTxt,
    summary: {
      totalResponses,
      totalAttending,
      totalDeclined,
      totalGuests,
      attendanceRate: totalResponses > 0 ? Math.round((totalAttending / totalResponses) * 100) : 0,
    },
  });
}
