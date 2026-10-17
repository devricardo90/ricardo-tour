import { CalendarCheck, Car, Check, ChevronDown, Clock, Languages, MapPin, Minus, Timer, UserCheck, Users, VolumeX, type LucideIcon } from "lucide-react";
import type { TourContentView } from "@/lib/catalog/tour-content";
import { ImageGallery } from "@/components/site/media/image-gallery";
import { resolveTourContentCopy } from "@/components/site/tour/content/tour-content-copy";

// RT-114 round 1 + Owner addendum (16/10): Design System dark surface of the Home "Experiences" section (charcoal page,
// raised cards, matte gold). No dominant beige. Contrast on charcoal: gold 8.5:1, on-dark-muted 11.5:1, on-dark 17:1.
export const sectionLabel = "text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--site-gold,#C8A86B)]";
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-focus,#E8C780)]";
const raisedCard = "rounded-xl border border-white/10 bg-[var(--site-charcoal-raised,#15191D)]";

export type ReviewStatus = "CONFIRMED" | "PROVISIONAL" | "PENDING" | "MOCK";

// Review-only chips (rebuild lab), readable on charcoal.
const STATUS_STYLE: Record<ReviewStatus, string> = {
  CONFIRMED: "border-[#6fbf7c] bg-[#132a18] text-[#a8e2b0]",
  PROVISIONAL: "border-[#e0a63c] bg-[#2e2108] text-[#f3cf86]",
  PENDING: "border-[#9da3a5] bg-[#22262b] text-[#d7dadb]",
  MOCK: "border-[#e8c780] bg-[#3a2f12] text-[#f3d58a]",
};

/** Review-only status chip (rebuild lab). The public page never renders it: it shows approved content only. */
export function StatusBadge({ status, locale }: { status: ReviewStatus; locale: string }) {
  const t = resolveTourContentCopy(locale);
  return (
    <span data-status={status} className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
      {t.status[status]}
    </span>
  );
}

export type EssentialItem = { key: string; icon: LucideIcon; label: string; value: string; status?: ReviewStatus };

/** RT-114: key facts as readable cards; optional review status per card. */
export function TourEssentials({ items, locale, title }: { items: EssentialItem[]; locale: string; title?: string }) {
  const t = resolveTourContentCopy(locale);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="tour-essentials-heading" data-testid="tour-practical">
      <h2 id="tour-essentials-heading" className={sectionLabel}>{title ?? t.essentials}</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map(({ key, icon: Icon, label, value, status }) => (
          <div key={key} className={`${raisedCard} p-4`}>
            <dt className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-[var(--site-on-dark-muted,#CAC7BF)]">
              <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--site-gold,#C8A86B)]" aria-hidden="true" />
              {label}
              {status ? <StatusBadge status={status} locale={locale} /> : null}
            </dt>
            <dd className="mt-1.5 text-[17px] font-semibold leading-snug text-[var(--site-on-dark,#F4F0E8)]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** RT-114: builds the essentials from approved/structured content (duration, meeting point, start time, languages). */
export function TourPracticalFacts({ content, locale }: { content: TourContentView; locale: string }) {
  const t = resolveTourContentCopy(locale);
  const languages = content.languages.map((code) => t.language[code] ?? code.toUpperCase());
  const candidates: Array<EssentialItem | null> = [
    content.durationLabel ? { key: "duration", icon: Clock, label: t.duration, value: content.durationLabel } : null,
    content.meetingPoint ? { key: "meeting", icon: MapPin, label: t.meetingPoint, value: content.meetingPoint } : null,
    content.startTimeNote ? { key: "time", icon: Timer, label: t.startTime, value: content.startTimeNote } : null,
    languages.length ? { key: "languages", icon: Languages, label: t.languages, value: languages.join(" · ") } : null,
  ];
  const items = candidates.filter((f): f is EssentialItem => f !== null);
  return <TourEssentials items={items} locale={locale} title={t.practical} />;
}

export const essentialIcons = { Clock, MapPin, Timer, Languages, Users, Car, CalendarCheck, UserCheck };

/** RT-114: benefits list (e.g. why a private experience). */
export function TourBenefits({ items, locale, status }: { items: string[]; locale: string; status?: ReviewStatus }) {
  const t = resolveTourContentCopy(locale);
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="tour-benefits-heading" data-testid="tour-benefits" className={`${raisedCard} border-[var(--site-gold,#C8A86B)]/30 p-6 md:p-7`}>
      <h2 id="tour-benefits-heading" className="site-display flex flex-wrap items-center gap-3 text-[28px] font-medium leading-[1.15] text-[var(--site-on-dark,#F4F0E8)] md:text-[32px]">
        {t.benefits}
        {status ? <StatusBadge status={status} locale={locale} /> : null}
      </h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[16px] leading-[1.5]">
            <Check className="mt-1 h-[18px] w-[18px] shrink-0 text-[var(--site-gold,#C8A86B)]" aria-hidden="true" />
            <span className="text-[var(--site-on-dark,#F4F0E8)]">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** RT-114: ordered itinerary as a vertical timeline. */
export function TourItinerary({ content, locale, status }: { content: TourContentView; locale: string; status?: ReviewStatus }) {
  const t = resolveTourContentCopy(locale);
  if (content.itinerary.length === 0) return null;
  return (
    <section aria-labelledby="tour-itinerary-heading" data-testid="tour-itinerary">
      <h2 id="tour-itinerary-heading" className="site-display flex flex-wrap items-center gap-3 text-[30px] font-medium leading-[1.1] text-[var(--site-on-dark,#F4F0E8)] md:text-[34px]">
        {t.itinerary}
        {status ? <StatusBadge status={status} locale={locale} /> : null}
      </h2>
      <ol className="mt-5">
        {content.itinerary.map((stop, i) => (
          <li key={stop.position} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--site-gold,#C8A86B)] bg-[var(--site-charcoal,#0B0E11)] text-[14px] font-semibold text-[var(--site-gold,#C8A86B)]" aria-hidden="true">
                {i + 1}
              </span>
              {i < content.itinerary.length - 1 ? <span aria-hidden="true" className="mt-1 w-px flex-1 bg-white/15" /> : null}
            </div>
            <div className="pt-1.5">
              <h3 className="text-[17px] font-semibold leading-snug text-[var(--site-on-dark,#F4F0E8)]">
                <span className="sr-only">{t.stop(i + 1)}: </span>
                {stop.title}
              </h3>
              {stop.durationMinutes ? <p className="mt-0.5 text-[14px] font-medium text-[var(--site-gold-bright,#E8C780)]">{t.minutes(stop.durationMinutes)}</p> : null}
              {stop.description ? <p className="mt-1.5 max-w-[60ch] text-[16px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{stop.description}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** RT-114: included / not included from structured content. */
export function TourIncludes({ content, locale, labels, status }: { content: TourContentView; locale: string; labels: { included: string; notIncluded: string }; status?: ReviewStatus }) {
  if (content.inclusions.length === 0 && content.exclusions.length === 0) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2" data-testid="tour-includes">
      {content.inclusions.length > 0 ? (
        <section aria-labelledby="tour-included-heading" className={`${raisedCard} p-5`}>
          <h2 id="tour-included-heading" className={`${sectionLabel} flex flex-wrap items-center gap-2`}>
            {labels.included}
            {status ? <StatusBadge status={status} locale={locale} /> : null}
          </h2>
          <ul className="mt-3 space-y-2.5 text-[16px] text-[var(--site-on-dark,#F4F0E8)]">
            {content.inclusions.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check className="mt-1 h-[18px] w-[18px] shrink-0 text-[var(--site-gold,#C8A86B)]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {content.exclusions.length > 0 ? (
        <section aria-labelledby="tour-excluded-heading" className={`${raisedCard} p-5`}>
          <h2 id="tour-excluded-heading" className="flex flex-wrap items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--site-on-dark-subtle,#9DA3A5)]">
            {labels.notIncluded}
            {status ? <StatusBadge status={status} locale={locale} /> : null}
          </h2>
          <ul className="mt-3 space-y-2.5 text-[16px] text-[var(--site-on-dark-muted,#CAC7BF)]">
            {content.exclusions.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Minus className="mt-1 h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** RT-114: requirements, accessibility and weather notes ("Condições práticas"). */
export function TourConditionsNotes({ content, locale, status }: { content: TourContentView; locale: string; status?: ReviewStatus }) {
  const t = resolveTourContentCopy(locale);
  const notes = [
    content.requirements ? { key: "requirements", label: t.requirements, value: content.requirements } : null,
    content.accessibility ? { key: "accessibility", label: t.accessibility, value: content.accessibility } : null,
    content.weatherPolicy ? { key: "weather", label: t.weather, value: content.weatherPolicy } : null,
    content.operationalConditions ? { key: "operational", label: t.operational, value: content.operationalConditions } : null,
  ].filter((n): n is NonNullable<typeof n> => n !== null);
  if (notes.length === 0) return null;
  return (
    <section aria-labelledby="tour-conditions-heading" data-testid="tour-notes">
      <h2 id="tour-conditions-heading" className="site-display flex flex-wrap items-center gap-3 text-[28px] font-medium leading-[1.15] text-[var(--site-on-dark,#F4F0E8)] md:text-[32px]">
        {t.conditions}
        {status ? <StatusBadge status={status} locale={locale} /> : null}
      </h2>
      <div className={`mt-4 grid gap-5 ${notes.length > 3 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {notes.map((note) => (
          <div key={note.key}>
            <h3 className={sectionLabel}>{note.label}</h3>
            <p className="mt-2 text-[16px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{note.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** RT-116: tour gallery wired to the shared ImageGallery with localized labels. */
export function TourGallery({ content, locale, priority = false }: { content: TourContentView; locale: string; priority?: boolean }) {
  const t = resolveTourContentCopy(locale);
  if (content.gallery.length === 0) return null;
  return (
    <ImageGallery
      images={content.gallery.map((img) => ({ src: img.src, alt: img.alt, objectPosition: img.objectPosition, credit: img.credit }))}
      labels={{ gallery: t.gallery, prev: t.galleryPrev, next: t.galleryNext, thumb: t.galleryThumb, position: t.galleryPosition }}
      priority={priority}
    />
  );
}

/** RT-115: full description of the experience (paragraphs from TripContent.description). */
export function TourAbout({ content, locale, status }: { content: TourContentView; locale: string; status?: ReviewStatus }) {
  const t = resolveTourContentCopy(locale);
  if (content.paragraphs.length === 0) return null;
  return (
    <section aria-labelledby="tour-about-heading" data-testid="tour-about">
      <h2 id="tour-about-heading" className="site-display flex flex-wrap items-center gap-3 text-[30px] font-medium leading-[1.1] text-[var(--site-on-dark,#F4F0E8)] md:text-[34px]">
        {t.about}
        {status ? <StatusBadge status={status} locale={locale} /> : null}
      </h2>
      <div className="mt-4 max-w-[68ch] space-y-4 text-[17px] leading-[1.65] text-[var(--site-on-dark-muted,#CAC7BF)]">
        {content.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </section>
  );
}

/** RT-115: optional services offered by third parties (never part of the price, never guaranteed). */
export function TourOptionalServices({ content, locale, status }: { content: TourContentView; locale: string; status?: ReviewStatus }) {
  const t = resolveTourContentCopy(locale);
  if (!content.optionalServicesNote) return null;
  return (
    <section aria-labelledby="tour-optional-heading" data-testid="tour-optional" className="rounded-xl border border-dashed border-white/15 p-5">
      <h2 id="tour-optional-heading" className="flex flex-wrap items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--site-on-dark-subtle,#9DA3A5)]">
        {t.optionalServices}
        {status ? <StatusBadge status={status} locale={locale} /> : null}
      </h2>
      <p className="mt-2 text-[16px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{content.optionalServicesNote}</p>
    </section>
  );
}

/** RT-115: FAQ as native disclosure widgets (keyboard and screen-reader friendly, no script). */
export function TourFaq({ content, locale, status }: { content: TourContentView; locale: string; status?: ReviewStatus }) {
  const t = resolveTourContentCopy(locale);
  if (content.faq.length === 0) return null;
  return (
    <section aria-labelledby="tour-faq-heading" data-testid="tour-faq">
      <h2 id="tour-faq-heading" className="site-display flex flex-wrap items-center gap-3 text-[30px] font-medium leading-[1.1] text-[var(--site-on-dark,#F4F0E8)] md:text-[34px]">
        {t.faq}
        {status ? <StatusBadge status={status} locale={locale} /> : null}
      </h2>
      <div className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10">
        {content.faq.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold text-[var(--site-on-dark,#F4F0E8)] ${focusRing}`}>
              {item.question}
              <ChevronDown className="h-5 w-5 shrink-0 text-[var(--site-gold,#C8A86B)] transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="mt-3 text-[16px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export type TourVideoData = { title: string; src: string; mobileSrc?: string; poster: string; durationSeconds: number; caption: string };

/**
 * RT-116: short clip of the tour, in its own block (Owner decision 17/10/2026: up to 18 s, no audio, with poster).
 * Plays only when the visitor asks (no autoplay, preload none: no video bytes on page load), native accessible controls,
 * playsInline on phones. Portrait clip: next to its caption on desktop; full width (max ~70% of the screen) on mobile.
 */
export function TourVideo({ video, locale, status }: { video: TourVideoData; locale: string; status?: ReviewStatus }) {
  const t = resolveTourContentCopy(locale);
  const seconds = String(Math.round(video.durationSeconds));
  return (
    <section aria-labelledby="tour-video-heading" data-testid="tour-video" className={`${raisedCard} grid gap-5 p-4 sm:grid-cols-[minmax(0,300px)_1fr] sm:items-center sm:p-5`}>
      <video
        controls
        muted
        playsInline
        preload="none"
        poster={video.poster}
        aria-describedby="tour-video-caption"
        className="mx-auto aspect-[9/16] max-h-[70vh] w-full rounded-lg bg-black object-cover sm:max-h-none"
        data-testid="tour-video-player"
      >
        {/* Small screens get the lighter rendition (≈1 Mbps) first; others fall through to the full clip. */}
        {video.mobileSrc ? <source src={video.mobileSrc} type="video/mp4" media="(max-width: 767px)" /> : null}
        <source src={video.src} type="video/mp4" />
        {t.videoFallback}
      </video>
      <div>
        <h2 id="tour-video-heading" className="site-display flex flex-wrap items-center gap-3 text-[28px] font-medium leading-[1.15] text-[var(--site-on-dark,#F4F0E8)] md:text-[32px]">
          {video.title}
          {status ? <StatusBadge status={status} locale={locale} /> : null}
        </h2>
        <p id="tour-video-caption" className="mt-3 text-[16px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{video.caption}</p>
        <p className="mt-3 inline-flex items-center gap-2 text-[14px] text-[var(--site-on-dark-subtle,#9DA3A5)]">
          <VolumeX className="h-4 w-4" aria-hidden="true" />
          {t.videoNote.replace("{s}", seconds)}
        </p>
      </div>
    </section>
  );
}

/** RT-114: primary commercial action. Links to the existing request flow (no automatic booking confirmation). */
export function TourCtaButton({ href, label, className = "", testId = "tour-cta" }: { href: string; label: string; className?: string; testId?: string }) {
  return (
    <a
      href={href}
      data-testid={testId}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[6px] border border-[var(--site-gold,#C8A86B)] bg-[var(--site-gold,#C8A86B)] px-6 text-[16px] font-semibold text-[var(--site-charcoal,#0B0E11)] transition-[background-color,transform] hover:-translate-y-px hover:bg-[var(--site-gold-bright,#E8C780)] active:translate-y-0 active:bg-[#A9864E] ${focusRing} ${className}`}
    >
      <CalendarCheck className="h-5 w-5" aria-hidden="true" />
      {label}
    </a>
  );
}

/** RT-114: mobile-only sticky bar (price status + CTA), clear of the phone's safe area. Hidden from lg upwards. */
export function TourMobileCtaBar({ href, label, priceLabel, priceValue }: { href: string; label: string; priceLabel: string; priceValue: string }) {
  return (
    <div
      data-testid="tour-mobile-cta"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--site-gold,#C8A86B)]/25 bg-[var(--site-charcoal,#0B0E11)]/95 px-4 pt-3 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
        <p className="min-w-0 text-[13px] leading-tight text-[var(--site-on-dark-muted,#CAC7BF)]">
          {priceLabel}
          <span className="block whitespace-nowrap text-[16px] font-semibold text-[var(--site-on-dark,#F4F0E8)]">{priceValue}</span>
        </p>
        <TourCtaButton href={href} label={label} className="shrink-0 gap-1.5 px-4 text-[15px]" testId="tour-cta-mobile" />
      </div>
    </div>
  );
}

/** RT-114: secondary action in the Design System outline style (Home "Ver detalhes" / "Planeje sua viagem"). */
export const secondaryButtonClass = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--site-gold,#C8A86B)]/50 px-4 text-[15px] font-medium text-[var(--site-gold-bright,#E8C780)] transition-colors hover:border-[var(--site-gold,#C8A86B)] hover:bg-[var(--site-gold,#C8A86B)]/10 ${focusRing}`;
