"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { invitation } from "@/config/invitation";
import Flourish from "./Flourish";
import FlowerSpray from "./FlowerSpray";

type Status = "idle" | "sending" | "saved" | "error";

/** RSVP form. Shows success only after the server confirms the reply was saved. */
export default function Rsvp() {
  const { enabled, endpoint, maxGuests } = invitation.features.rsvp;
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [attending, setAttending] = useState<"" | "yes" | "no">("");
  const [guests, setGuests] = useState(1);
  const [savedName, setSavedName] = useState("");
  const [showOnWall, setShowOnWall] = useState(true);
  if (!enabled || !endpoint) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!attending) {
      setStatus("error");
      setError("Please choose whether you will attend.");
      return;
    }
    const payload = {
      name: String(fd.get("name") ?? ""),
      attending,
      guests: attending === "yes" ? guests : 0,
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""),
      showOnWall,
    };
    setStatus("sending");
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "We could not save your reply. Please try again.");
      setSavedName(payload.name.trim().split(/\s+/)[0]);
      setStatus("saved");
      window.dispatchEvent(new Event("rsvp:saved"));
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "We could not save your reply. Please try again.");
    }
  }

  const label = "eyebrow block text-[0.68rem] text-rose-deep";
  const field =
    "mt-3 w-full border-0 border-b border-wine/30 bg-transparent px-1 py-2.5 text-xl text-wine placeholder:text-wine/35 focus:border-wine focus:outline-none focus:ring-0";

  return (
    <section
      id="rsvp"
      className="relative overflow-hidden bg-ivory px-5 py-24 sm:py-32"
      aria-labelledby="rsvp-title"
    >
      <div className="lace pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <FlowerSpray corner="tl" size="md" />
      <FlowerSpray corner="br" size="md" />
      <div className="relative mx-auto max-w-xl">
        <div className="text-center">
          <p className="eyebrow text-rose-deep">Répondez s&rsquo;il vous plaît</p>
          <h2 id="rsvp-title" className="mt-4 font-script text-6xl text-wine-soft sm:text-7xl">
            Kindly Reply
          </h2>
          <Flourish className="mx-auto mt-4 text-wine-soft" />
        </div>

        <div className="relative mt-12 border border-wine-soft/40 bg-blush/70 p-1.5 shadow-[0_30px_60px_-30px_rgba(90,64,20,0.4)] backdrop-blur-sm">
          <div className="border border-wine-soft/25 px-6 py-10 sm:px-12 sm:py-12">
            <AnimatePresence mode="wait">
              {status === "saved" ? (
                <motion.div
                  key="done"
                  role="status"
                  className="py-8 text-center"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.svg width="64" height="58" viewBox="0 0 24 22" fill="none" className="mx-auto" aria-hidden>
                    <motion.path
                      d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z"
                      stroke="#7D5F12"
                      strokeWidth="1.2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.4, ease: "easeInOut" }}
                    />
                  </motion.svg>
                  <p className="mt-6 font-script text-5xl text-wine-soft">Thank you{savedName ? `, ${savedName}` : ""}</p>
                  <p className="mt-4 text-xl italic text-wine/80">
                    {attending === "yes"
                      ? "Your reply has been received. We can’t wait to celebrate with you."
                      : "Your reply has been received. You will be missed."}
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={onSubmit}
                  noValidate={false}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-9"
                >
                  <label className={label}>
                    Your full name
                    <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} placeholder="Name" />
                  </label>

                  <fieldset>
                    <legend className={label}>Will you attend?</legend>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {(
                        [
                          ["yes", "Joyfully accepts"],
                          ["no", "Regretfully declines"],
                        ] as const
                      ).map(([v, text]) => (
                        <label
                          key={v}
                          className={`cursor-pointer border px-3 py-4 text-center text-lg transition duration-300 focus-within:ring-2 focus-within:ring-rose ${
                            attending === v
                              ? "border-wine bg-wine text-ivory shadow-lg"
                              : "border-wine/30 text-wine hover:border-wine"
                          }`}
                        >
                          <input
                            type="radio"
                            name="attending"
                            value={v}
                            checked={attending === v}
                            onChange={() => setAttending(v)}
                            className="sr-only"
                          />
                          {text}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <AnimatePresence initial={false}>
                    {attending === "yes" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <span id="guests-label" className={label}>
                          Number of guests, including you
                        </span>
                        <div className="mt-4 flex items-center justify-center gap-6" role="group" aria-labelledby="guests-label">
                          <button
                            type="button"
                            onClick={() => setGuests((g) => Math.max(1, g - 1))}
                            disabled={guests <= 1}
                            aria-label="Fewer guests"
                            className="grid h-11 w-11 place-items-center rounded-full border border-wine/40 text-2xl text-wine transition hover:bg-wine hover:text-ivory disabled:opacity-30"
                          >
                            &minus;
                          </button>
                          <output aria-live="polite" className="w-12 text-center font-serif text-5xl tabular-nums text-wine">
                            {guests}
                          </output>
                          <button
                            type="button"
                            onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
                            disabled={guests >= maxGuests}
                            aria-label="More guests"
                            className="grid h-11 w-11 place-items-center rounded-full border border-wine/40 text-2xl text-wine transition hover:bg-wine hover:text-ivory disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <label className={label}>
                    A note for the couple <span className="normal-case tracking-normal text-wine/60">(optional)</span>
                    <textarea name="message" rows={3} maxLength={500} className={`${field} resize-none`} placeholder="Your wishes" />
                  </label>
                  <label className="-mt-4 flex cursor-pointer items-start gap-3 text-base text-wine/80">
                    <input
                      type="checkbox"
                      checked={showOnWall}
                      onChange={(e) => setShowOnWall(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#7D5F12]"
                    />
                    <span>Share my note on the wishes wall, with my name, after the couple approves it.</span>
                  </label>

                  {/* honeypot for bots */}
                  <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Website
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>

                  <button type="submit" disabled={status === "sending"} className="btn-wine w-full disabled:opacity-60">
                    {status === "sending" ? "Sending your reply" : "Send Reply"}
                  </button>
                  <p role="alert" className="min-h-[1.5rem] text-center text-lg text-wine-soft">
                    {status === "error" && error}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
