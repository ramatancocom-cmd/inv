import Gate from "@/components/Gate";
import SceneHost from "@/components/scene/SceneHost";
import Countdown from "@/components/Countdown";
import CalendarButton from "@/components/CalendarButton";
import Monogram from "@/components/Monogram";
import Reveal from "@/components/Reveal";
import Rsvp from "@/components/Rsvp";
import PhotoStory from "@/components/PhotoStory";
import Flourish from "@/components/Flourish";
import WishesWall from "@/components/WishesWall";
import FlowerSpray from "@/components/FlowerSpray";
import { invitation } from "@/config/invitation";

const { couple, event, venue, copy } = invitation;

function Ornament({ light = false }: { light?: boolean }) {
  return (
    <div className="my-8 flex justify-center">
      <Flourish className={light ? "text-wine-soft" : "text-rose"} />
    </div>
  );
}

export default function Page() {
  return (
    <Gate>
      <main>
        {/* HERO */}
        <section
          id="top"
          className="relative overflow-hidden bg-wine text-ivory"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 55% at 70% 55%, rgba(212,175,55,0.22), transparent 70%), radial-gradient(ellipse 80% 60% at 20% 0%, rgba(122,20,36,0.9), transparent 70%)",
          }}
        >
          <div className="lace pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <FlowerSpray corner="tl" size="md" />
          <FlowerSpray corner="br" size="sm" />
          <div className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-0 px-6 pb-8 pt-28 sm:pt-20 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:px-12 lg:py-10">
            <div className="min-w-0 text-center lg:text-left">
              <p className="eyebrow text-rose">{copy.intro}</p>
              <h1 className="mt-6 whitespace-nowrap font-script text-[clamp(3.4rem,13vw,6rem)] leading-[1.02] lg:text-[clamp(4rem,6.6vw,7.2rem)] text-ivory">
                <span className="foil block">
                  {couple.first} &amp;
                </span>
                <span className="foil block">{couple.second}</span>
              </h1>
              <p className="mt-6 text-xl italic text-ivory/90 sm:text-2xl">{copy.invite}</p>
              <div className="rose-rule my-8 mx-auto w-40 lg:mx-0" aria-hidden />
              <p className="text-2xl font-medium tracking-wide">{event.dateLabel}</p>
              <p className="mt-1 text-lg text-ivory/85">
                {event.timeLabel} &middot; {venue.name}, {venue.area}
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <a href="#details" className="btn-rose">
                  View Celebration Details
                </a>
                {invitation.features.rsvp.enabled && (
                  <a href="#rsvp" className="btn-ghost">
                    Kindly Reply
                  </a>
                )}
              </div>
            </div>

            <div className="relative h-[68svh] min-h-[420px] w-full lg:h-[88svh]">
              <SceneHost />
            </div>
          </div>
        </section>

        <PhotoStory />

        {/* COUNTDOWN */}
        <section className="bg-wine px-6 py-24 text-ivory" aria-labelledby="countdown-title">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <p id="countdown-title" className="eyebrow text-rose">
                Until we celebrate
              </p>
              <div className="mt-10">
                <Countdown />
              </div>
              <p className="mt-10 text-base italic text-ivory/70">
                Counting to {event.timeLabel}, {event.dayMonth}, {event.year} &mdash; {event.timeNote}
              </p>
            </Reveal>
          </div>
        </section>

        {/* DETAILS */}
        <section id="details" className="lace bg-blush px-6 py-28" aria-labelledby="details-title">
          <div className="mx-auto max-w-5xl text-center">
            <Reveal>
              <p className="eyebrow text-rose-deep">The Celebration</p>
              <h2 id="details-title" className="mt-4 font-script text-5xl text-wine sm:text-6xl">
                Details of the Evening
              </h2>
              <Ornament light />
            </Reveal>

            <dl className="mt-6 grid gap-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-rose/60">
              {[
                { t: "Date", v: event.weekday, s: `${event.dayMonth}, ${event.year}` },
                { t: "Time", v: event.timeLabel, s: event.timeNote },
                { t: "Venue", v: venue.name, s: venue.area },
              ].map((d, i) => (
                <Reveal key={d.t} delay={i * 0.12} className="px-6">
                  <dt className="eyebrow text-rose-deep">{d.t}</dt>
                  <dd className="mt-4 text-3xl font-medium text-wine sm:text-4xl">{d.v}</dd>
                  <dd className="mt-1 text-xl italic text-wine/80">{d.s}</dd>
                </Reveal>
              ))}
            </dl>

            <Reveal delay={0.2}>
              <p className="mx-auto mt-14 max-w-xl text-xl italic text-wine/85">
                {event.setting}. We look forward to celebrating with you under the open sky.
              </p>
            </Reveal>
          </div>
        </section>

        {/* LOCATION */}
        <section id="location" className="bg-ivory px-6 py-28" aria-labelledby="location-title">
          <Reveal className="mx-auto max-w-4xl">
            <div className="relative border border-rose/70 p-2">
              <div
                className="relative overflow-hidden bg-wine px-8 py-16 text-center text-ivory sm:px-16 sm:py-20"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(212,175,55,0.25), transparent 70%)",
                }}
              >
                <div className="lace pointer-events-none absolute inset-0 opacity-70" aria-hidden />
                <div className="relative">
                  <p className="eyebrow text-rose">The Venue</p>
                  <h2 id="location-title" className="mt-5 text-5xl font-medium sm:text-6xl">
                    {venue.name}
                  </h2>
                  <p className="mt-3 text-2xl italic text-ivory/90">{venue.area}</p>
                  <div className="rose-rule mx-auto my-8 w-32" aria-hidden />
                  <p className="mx-auto max-w-md text-lg text-ivory/85">
                    An {event.setting.toLowerCase()} beneath the evening sky.
                  </p>
                  <a
                    href={venue.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-rose mt-10"
                  >
                    Get Directions
                    <span className="sr-only"> (opens Google Maps in a new tab)</span>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* CALENDAR */}
        <section className="bg-blush px-6 py-24 text-center" aria-labelledby="calendar-title">
          <Reveal className="mx-auto max-w-2xl">
            <p className="eyebrow text-rose-deep">Save the Date</p>
            <h2 id="calendar-title" className="mt-4 text-4xl font-medium sm:text-5xl">
              {event.dateLabel}
            </h2>
            <p className="mt-3 text-xl italic text-wine/80">
              {event.timeLabel}, {event.timeNote}
            </p>
            <div className="mt-10">
              <CalendarButton />
            </div>
          </Reveal>
        </section>

        <Rsvp />
        <WishesWall />

        {/* CLOSING */}
        <section
          className="relative overflow-hidden bg-wine px-6 py-28 text-center text-ivory"
          aria-labelledby="closing-title"
        >
          <div className="lace pointer-events-none absolute inset-0 opacity-60" aria-hidden />
          <FlowerSpray corner="tr" size="md" />
          <FlowerSpray corner="bl" size="md" />
          <Reveal className="relative mx-auto max-w-3xl">
            <h2 id="closing-title" className="text-3xl font-medium italic leading-snug sm:text-5xl">
              {copy.closing}
            </h2>
            <Ornament />
            <p className="font-script text-6xl sm:text-7xl">
              <span className="foil">
                {couple.first} &amp; {couple.second}
              </span>
            </p>
            <div className="mt-10 flex justify-center">
              <Monogram />
            </div>
          </Reveal>
        </section>
      </main>
    </Gate>
  );
}
