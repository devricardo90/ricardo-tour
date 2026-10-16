import { Clock, Languages, MapPin, Timer } from "lucide-react";
import type { TourContentView } from "@/lib/catalog/tour-content";
import { ImageGallery } from "@/components/site/media/image-gallery";
import { resolveTourContentCopy } from "@/components/site/tour/content/tour-content-copy";

const sectionLabel = "text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-deep)]";

/** RT-114: practical facts (duration, meeting point, start time, languages). Renders only fields that have content. */
export function TourPracticalFacts({ content, locale }: { content: TourContentView; locale: string }) {
  const t = resolveTourContentCopy(locale);
  const languages = content.languages.map((code) => t.language[code] ?? code.toUpperCase());
  const facts = [
    content.durationLabel ? { key: "duration", icon: Clock, label: t.duration, value: content.durationLabel } : null,
    content.meetingPoint ? { key: "meeting", icon: MapPin, label: t.meetingPoint, value: content.meetingPoint } : null,
    content.startTimeNote ? { key: "time", icon: Timer, label: t.startTime, value: content.startTimeNote } : null,
    languages.length ? { key: "languages", icon: Languages, label: t.languages, value: languages.join(" · ") } : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null);
  if (facts.length === 0) return null;
  return (
    <section aria-labelledby="tour-practical-heading" data-testid="tour-practical">
      <h2 id="tour-practical-heading" className={sectionLabel}>{t.practical}</h2>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">
        {facts.map(({ key, icon: Icon, label, value }) => (
          <div key={key} className="rounded-lg border border-[var(--site-rule-light)] bg-white/60 p-4">
            <dt className="flex items-center gap-2 text-[13px] text-[var(--site-ink-muted)]">
              <Icon className="h-4 w-4 shrink-0 text-[var(--site-gold-deep)]" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 text-[15px] font-medium leading-snug">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** RT-114: ordered itinerary as a vertical timeline. */
export function TourItinerary({ content, locale }: { content: TourContentView; locale: string }) {
  const t = resolveTourContentCopy(locale);
  if (content.itinerary.length === 0) return null;
  return (
    <section aria-labelledby="tour-itinerary-heading" data-testid="tour-itinerary">
      <h2 id="tour-itinerary-heading" className="site-display text-[30px] font-medium leading-[1.1] md:text-[34px]">{t.itinerary}</h2>
      <ol className="mt-5 space-y-0">
        {content.itinerary.map((stop, i) => (
          <li key={stop.position} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--site-gold-deep)] text-[13px] font-semibold text-[var(--site-gold-deep)]" aria-hidden="true">
                {i + 1}
              </span>
              {i < content.itinerary.length - 1 ? <span aria-hidden="true" className="mt-1 w-px flex-1 bg-[var(--site-rule-light)]" /> : null}
            </div>
            <div className="pt-1">
              <h3 className="text-[16px] font-semibold leading-snug">
                <span className="sr-only">{t.stop(i + 1)}: </span>
                {stop.title}
              </h3>
              {stop.durationMinutes ? <p className="mt-0.5 text-[13px] text-[var(--site-ink-muted)]">{t.minutes(stop.durationMinutes)}</p> : null}
              {stop.description ? <p className="mt-1.5 max-w-[60ch] text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{stop.description}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** RT-114: requirements, accessibility and weather notes. */
export function TourConditionsNotes({ content, locale }: { content: TourContentView; locale: string }) {
  const t = resolveTourContentCopy(locale);
  const notes = [
    content.requirements ? { key: "requirements", label: t.requirements, value: content.requirements } : null,
    content.accessibility ? { key: "accessibility", label: t.accessibility, value: content.accessibility } : null,
    content.weatherPolicy ? { key: "weather", label: t.weather, value: content.weatherPolicy } : null,
  ].filter((n): n is NonNullable<typeof n> => n !== null);
  if (notes.length === 0) return null;
  return (
    <div className="grid gap-8 sm:grid-cols-3" data-testid="tour-notes">
      {notes.map((note) => (
        <section key={note.key} aria-labelledby={`tour-${note.key}-heading`}>
          <h2 id={`tour-${note.key}-heading`} className={sectionLabel}>{note.label}</h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{note.value}</p>
        </section>
      ))}
    </div>
  );
}

/** RT-116: tour gallery wired to the shared ImageGallery with localized labels. */
export function TourGallery({ content, locale, priority = false }: { content: TourContentView; locale: string; priority?: boolean }) {
  const t = resolveTourContentCopy(locale);
  if (content.gallery.length === 0) return null;
  return (
    <ImageGallery
      images={content.gallery.map((img) => ({ src: img.src, alt: img.alt }))}
      labels={{ gallery: t.gallery, prev: t.galleryPrev, next: t.galleryNext, thumb: t.galleryThumb, position: t.galleryPosition }}
      priority={priority}
    />
  );
}
