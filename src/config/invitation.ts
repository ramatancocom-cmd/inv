/**
 * Single source of truth for the invitation.
 * Edit names, event details, colors and feature toggles here.
 */
export const invitation = {
  couple: {
    first: "Mohamed",
    second: "Rawan",
    monogram: "M & R",
  },

  event: {
    title: "Engagement Celebration",
    // 7:00 PM Cairo time on 7 Nov 2026. Egypt is UTC+2 on this date (DST ended 29 Oct 2026).
    startsAtISO: "2026-11-07T19:00:00+02:00",
    // Calendar-file local time, interpreted in `timeZone`.
    startsAtLocal: { year: 2026, month: 11, day: 7, hour: 19, minute: 0 },
    timeZone: "Africa/Cairo",
    dateLabel: "Saturday, November 7, 2026",
    weekday: "Saturday",
    dayMonth: "November 7",
    year: "2026",
    timeLabel: "7:00 PM",
    timeNote: "Cairo local time",
    setting: "Outdoor, open-air celebration",
  },

  venue: {
    name: "Louver Heights",
    area: "New Cairo, Egypt",
    mapsUrl: "https://maps.app.goo.gl/yasqKsfFid4TsntR8?g_st=ic",
  },

  copy: {
    intro: "Together with our families",
    invite: "Invite you to celebrate our engagement",
    closing: "Your presence will make our evening unforgettable.",
    celebrate: "Tonight, we celebrate.",
    celebrateSub: "Thank you for being part of our evening.",
  },

  photo: {
    src: "/couple.jpg",
    aspect: 940 / 812, // height / width of the cropped image
    alt: "Mohamed and Rawan as young children, smiling side by side on a wooden bench, she in a lace dress and he in a suit with a bow tie.",
    caption: "Together, forever.",
  },

  // Ivory & gold. Role names are kept from earlier themes so classes stay stable:
  //   wine     = deep espresso brown (main text, dark buttons)
  //   wineSoft = bronze (script headings)
  //   blush    = champagne cream (alternate section background)
  //   rose     = gold (lines, ornaments, metal in the 3D scene)
  //   roseDeep = antique gold for text on light backgrounds (AA contrast)
  palette: {
    wine: "#3A2A1A",
    wineSoft: "#6E521C",
    blush: "#F5EDE0",
    blushDeep: "#E8DCB8",
    rose: "#C9A227",
    roseDeep: "#7D5F12",
    ivory: "#FDFBF7",
    suit: "#1C1719", // groom tuxedo in the 3D scene
    gold: "#D4AF37",
    goldLight: "#F5E296",
    goldDark: "#997517",
  },

  features: {
    scene3D: true,
    skipButton: true,
    // RSVP posts to the built-in /api/rsvp route, which appends each reply to
    // data/rsvps.txt and emails a Gmail notification (see .env.example).
    // Success is shown only after the reply is written to the file.
    rsvp: { enabled: true, endpoint: "/api/rsvp", maxGuests: 6 },
    // Music never autoplays. Put an audio file you have rights to in /public
    // (e.g. /public/music.mp3) and set `src: "/music.mp3"`. Empty = no button.
    music: { src: "", title: "" },
    cursor: true, // refined custom cursor on desktop (mouse) only
  },
} as const;

export type Invitation = typeof invitation;
