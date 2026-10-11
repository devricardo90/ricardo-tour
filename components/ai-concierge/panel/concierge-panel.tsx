"use client";

import { Fragment, useEffect, useId, useReducer, useRef, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { CONCIERGE_PRIVACY } from "@/lib/ai-concierge/runtime/privacy";
import { buildHandoffPrefill, getHandoffChannels, type HandoffCode, type HandoffOffer } from "@/lib/ai-concierge/runtime/handoff";
import { RUNTIME_MAX_MESSAGE_LENGTH } from "@/lib/ai-concierge/runtime/input";
import { PLANNER_URL, TOURS_URL } from "@/lib/ai-concierge/runtime/messages";
import {
  STARTER_QUESTIONS,
  formatCountdown,
  historyFor,
  initialPanelState,
  panelReducer,
  type PanelMessage,
  type PanelState,
} from "@/lib/ai-concierge/ui/state";
import { resolveTourCards, type TourCardData } from "@/lib/ai-concierge/ui/tours";
import type { ConciergeTransport, PanelEvent } from "@/lib/ai-concierge/ui/types";
import { PANEL_COPY as copy } from "./copy";
import styles from "./concierge-panel.module.css";

/**
 * RT-71 / RT-74 Concierge side panel (isolated prototype; not mounted on any public route).
 * Desktop: expandable right-hand panel. Mobile: near-full-screen sheet. Session history lives only in memory (RT-70).
 * The panel never calls an API itself: it uses the injected transport and reports client events through `onEvent`.
 */
export type ConciergePanelProps = {
  transport: ConciergeTransport;
  onEvent?: (event: PanelEvent) => void;
  surface?: "public_site" | "tour_detail" | "contact";
  /** Test/lab seam to render a specific state. */
  initialState?: Partial<PanelState>;
};

const SAFE_HOSTS = new Set(["www.ricardotour.com"]);
const HANDOFF_CODES = new Set<HandoffCode>(["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "H11", "H12"]);

/** Linkifies only canonical Ricardo Tour URLs; everything else stays inert text. */
function renderText(text: string) {
  return text.split(/(https:\/\/[^\s)]+)/g).map((part, index) => {
    if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
    const tail = part.match(/[.,;:!?]+$/)?.[0] ?? "";
    const core = tail ? part.slice(0, -tail.length) : part;
    try {
      const url = new URL(core);
      if (url.protocol === "https:" && SAFE_HOSTS.has(url.hostname)) {
        const label = core === PLANNER_URL ? "Planeje sua viagem" : core === TOURS_URL ? "passeios publicados" : /^\/pt\/tours\/[\w-]+\/?$/.test(url.pathname) ? "ver o passeio" : url.hostname + url.pathname;
        return (
          <Fragment key={index}>
            <a href={url.href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
            {tail}
          </Fragment>
        );
      }
    } catch {
      /* not a URL: render as text */
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

/**
 * Daniela's portrait: a flat, editorial vector illustration (not a photo, not a cartoon): a woman with long blonde hair and green
 * eyes, fair warm skin, a dark tailored top with a gold edge, framed by the brand's gold hairline ring. It is an ILLUSTRATION of a
 * persona, never a depiction of a real team member, and wherever it is large it carries an explicit "IA" badge (the AI is always
 * named next to it: "Daniela · IA", "Assistente de IA"). Flat colours only, so it needs no image file or gradient ids.
 */
export const DANIELA_PORTRAIT = { hair: "#d6b05a", hairLight: "#f0dc9c", hairDark: "#b48c3e", eyes: "#3f9361", skin: "#f2d2b2" } as const;

function DanielaPortrait() {
  const c = DANIELA_PORTRAIT;
  // The viewBox is cropped to head and shoulders so the face (and the green eyes) stay legible at small sizes.
  return (
    <svg viewBox="8 5 48 48" width="100%" height="100%" aria-hidden="true" focusable="false" data-portrait="daniela" preserveAspectRatio="xMidYMid slice">
      <rect x="0" y="0" width="64" height="64" fill="#1b2025" />
      <circle cx="32" cy="26" r="22" fill="#242c32" />
      {/* long, softly waved hair behind the shoulders, in three tones */}
      <path d="M18.4 29.5C18.2 16.6 24.2 8.4 32.4 8.4s14.2 8.2 14 21.1c-.1 7 1.4 12.4 4.6 17.2 1.3 1.9 1 3.6-1.4 4.3-3 .9-6.4-.4-8.2-2.6L26 50.6c-2 2-5.6 2.9-8.4 1.4-1.9-1-1.6-2.9-.4-4.5 2.4-3.2 1.3-9.6 1.2-18z" fill={c.hair} />
      <path d="M21 34c.4 5-.4 9-2.4 12.4M44.2 33.4c-.1 5.2 1 9 3.4 12.2" fill="none" stroke={c.hairDark} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
      {/* shoulders: dark tailored top, soft V neckline with a gold edge */}
      <path d="M6 64c1.2-10.6 9.6-15.6 19-16.6l6.9 5.6 6.9-5.6c9.4 1 17.8 6 19 16.6z" fill="#2b333a" />
      <path d="M26.4 46.6 32 52.2l5.6-5.6" fill="none" stroke="#c8a86b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      {/* neck with a soft shadow under the chin */}
      <path d="M27.6 40.5h8.8v7.4L32 52l-4.4-4.1z" fill="#e6bd98" />
      <path d="M27.6 40.5h8.8v3.2c-2.9 1.9-5.9 1.9-8.8 0z" fill="#d4a37e" opacity="0.7" />
      {/* face: slim oval with a gentle jaw */}
      <path d="M22.6 27.6c0-7 4.1-11.6 9.4-11.6s9.4 4.6 9.4 11.6c0 6.6-3.2 13.8-9.4 13.8s-9.4-7.2-9.4-13.8z" fill={c.skin} />
      <ellipse cx="25.7" cy="34" rx="2.3" ry="1.5" fill="#e79c8c" opacity="0.22" />
      <ellipse cx="38.3" cy="34" rx="2.3" ry="1.5" fill="#e79c8c" opacity="0.22" />
      {/* side-swept fringe falling to the left */}
      <path d="M21.8 30c-1.1-9.8 4.4-16 10.7-16 6.6 0 10.2 4.6 9.8 12.4-.2 1.1-.6 1.8-1.2 1.1-1.5-4-5.6-7.6-10.4-7.6-4 0-7.2 3.3-8.6 8.8z" fill={c.hair} />
      <path d="M24.6 23.2c2.6-3.6 7.6-5 12.2-2.8" fill="none" stroke={c.hairLight} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      {/* refined brows */}
      <path d="M25.4 27.2c1.4-.9 3-1.1 4.4-.6M34.2 26.6c1.4-.5 3-.3 4.4.6" fill="none" stroke="#a9834a" strokeWidth="0.75" strokeLinecap="round" />
      {/* eyes: almond, green iris with a lighter ring, dark pupil, fine upper lash line */}
      <path d="M25.2 30.4c1.1-1.5 3.1-1.9 5-.5-1.1 1.4-3.3 1.9-5 .5z" fill="#fbf7f1" />
      <circle cx="27.8" cy="30.15" r="1.18" fill={c.eyes} />
      <circle cx="27.8" cy="30.15" r="0.5" fill="#102319" />
      <circle cx="27.4" cy="29.8" r="0.22" fill="#ffffff" />
      <path d="M33.8 29.9c1.9-1.4 3.9-1 5 .5-1.7 1.4-3.9 1-5-.5z" fill="#fbf7f1" />
      <circle cx="36.2" cy="30.15" r="1.18" fill={c.eyes} />
      <circle cx="36.2" cy="30.15" r="0.5" fill="#102319" />
      <circle cx="35.8" cy="29.8" r="0.22" fill="#ffffff" />
      <path d="M24.9 30c1.4-1.4 3.4-1.6 5.3-.2M33.8 29.8c1.9-1.4 3.9-1.2 5.3.2" fill="none" stroke="#5e4630" strokeWidth="0.6" strokeLinecap="round" />
      {/* nose (a soft shadow) and a gentle smile */}
      <path d="M32.1 32.4c-.5 1.6-.7 2.6.4 3" fill="none" stroke="#d0a182" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M29.1 37.6c1.1.6 2.1.8 2.9.5.8.3 1.8.1 2.9-.5-.9 1.7-1.8 2.3-2.9 2.3s-2-.6-2.9-2.3z" fill="#c9786f" />
      <circle cx="22.7" cy="33.6" r="0.75" fill="#e8c780" />
      <circle cx="41.3" cy="33.6" r="0.75" fill="#e8c780" />
    </svg>
  );
}

/** Avatar sizes: sm in the conversation (decorative: the visible "Daniela · IA" label names the speaker), md in the header, lg with an IA badge in the welcome. */
function ConciergeAvatar({ decorative = false, size = "sm" }: { decorative?: boolean; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? styles.avatarLg : size === "md" ? styles.avatarMd : styles.avatarSm;
  return (
    <span className={`${styles.avatarConcierge} ${sizeClass}`} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": copy.avatarConcierge })}>
      <DanielaPortrait />
      {size === "lg" ? (
        <span className={styles.avatarBadge} aria-hidden="true">
          {copy.aiBadge}
        </span>
      ) : null}
    </span>
  );
}

/** Visitor avatar: neutral, monochrome head-and-shoulders line glyph. Decorative: the visible "Você" label carries the meaning. */
function VisitorAvatar() {
  return (
    <span className={styles.avatarVisitor} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="18" height="18" fill="none">
        <circle cx="16" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.5 25.5c.7-4.6 4-7 8.5-7s7.8 2.4 8.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Recommendation card: approved catalog data only (closed allow-list); no price, duration or availability. */
function TourCard({ tour }: { tour: TourCardData }) {
  return (
    <li className={styles.tourCard}>
      <div className={styles.tourPhoto}>
        <Image src={tour.image} alt={tour.imageAlt} fill sizes="(max-width: 767px) 88px, 104px" className={styles.tourImage} />
      </div>
      <div className={styles.tourBody}>
        <h4 className={styles.tourTitle}>{tour.title}</h4>
        <p className={styles.tourSummary}>{tour.summary}</p>
        <a className={styles.tourCta} href={tour.path} target="_blank" rel="noopener noreferrer" aria-label={`${copy.tourCta}: ${tour.title}`}>
          {copy.tourCta}
          <span aria-hidden="true"> →</span>
        </a>
      </div>
    </li>
  );
}

/** The offer is rebuilt from its closed code: a tampered reply can never change a phone number, address or message. */
function HandoffCard({ offer, onClick }: { offer: HandoffOffer; onClick: (channel: "whatsapp" | "email", code: HandoffCode) => void }) {
  const code = HANDOFF_CODES.has(offer.code) ? offer.code : "H4";
  const prefill = buildHandoffPrefill(code);
  const [whatsapp, email] = getHandoffChannels(prefill);
  return (
    <div className={styles.handoff} data-handoff-code={code}>
      <h3 className={styles.handoffTitle}>{copy.handoffTitle}</h3>
      <p className={styles.handoffLabel}>{copy.handoffSuggested}</p>
      <p className={styles.handoffQuote}>“{prefill}”</p>
      <div className={styles.handoffActions}>
        <a className={styles.primaryLink} href={whatsapp.url} target="_blank" rel="noopener noreferrer" onClick={() => onClick("whatsapp", code)}>
          {copy.handoffWhatsApp} · {whatsapp.display}
        </a>
        <a className={styles.secondaryLink} href={email.url} onClick={() => onClick("email", code)}>
          {copy.handoffEmail}
        </a>
      </div>
      <p className={styles.handoffNote}>{copy.handoffNote}</p>
    </div>
  );
}

function Message({ message, onHandoff }: { message: PanelMessage; onHandoff: (channel: "whatsapp" | "email", code: HandoffCode) => void }) {
  if (message.role === "user") {
    return (
      <li className={styles.messageUser}>
        <VisitorAvatar />
        <div className={styles.userBubble}>
          <span className={styles.who}>{copy.you}</span>
          {message.text}
        </div>
      </li>
    );
  }
  // Hierarchy: informational answer (gold rule) < recommended experiences (cards) < human handoff (framed action card);
  // degraded / limit states are system notices (dashed amber frame, no Concierge avatar or name).
  const tours = resolveTourCards(message.tours);
  if (message.kind === "degraded") {
    return (
      <li className={styles.messageSystem} data-kind="degraded">
        <span className={styles.systemLabel}>{copy.systemLabel}</span>
        <p>{renderText(message.text)}</p>
        {message.handoff ? <HandoffCard offer={message.handoff} onClick={onHandoff} /> : null}
      </li>
    );
  }
  return (
    <li className={styles.messageAssistant} data-kind={message.kind}>
      <ConciergeAvatar decorative />
      <div className={styles.assistantBody}>
        <span className={styles.who}>{copy.concierge}</span>
        <p>{renderText(message.text)}</p>
        {tours.length > 0 ? (
          <section className={styles.tours} aria-labelledby={`${message.id}-tours`}>
            <h3 id={`${message.id}-tours`} className={styles.toursLabel}>
              {copy.recommendedLabel}
            </h3>
            <ul className={styles.tourList}>
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </ul>
            <p className={styles.toursNote}>{copy.recommendedNote}</p>
          </section>
        ) : null}
        {message.handoff ? <HandoffCard offer={message.handoff} onClick={onHandoff} /> : null}
      </div>
    </li>
  );
}

export function ConciergePanel({ transport, onEvent, surface = "public_site", initialState }: ConciergePanelProps) {
  const [state, dispatch] = useReducer(panelReducer, initialPanelState(initialState));
  const titleId = useId();
  const panelId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(state.open);
  const reported = useRef(false);
  const handledMessageId = useRef<string | null>(null);

  const { open, messages, draft, status, retryAfter } = state;
  const [team] = getHandoffChannels(buildHandoffPrefill("H1"));

  useEffect(() => {
    if (open) {
      textareaRef.current?.focus();
      if (!reported.current) {
        reported.current = true;
        onEvent?.({ name: "concierge_opened", surface });
      }
    } else if (wasOpen.current) {
      handleRef.current?.focus(); // return focus to the entry point
    }
    wasOpen.current = open;
  }, [open, onEvent, surface]);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
  useEffect(() => {
    // Follow the conversation only once it exists; the empty state always starts at the top.
    const body = bodyRef.current;
    if (!body || lastMessageId === null) return;
    // A new Concierge answer is read from its first line (cards can be taller than the viewport); the visitor's own message
    // follows the bottom of the conversation. Status changes alone (countdown end, retry) never move the scroll position.
    if (lastMessageId === handledMessageId.current) return;
    handledMessageId.current = lastMessageId;
    const last = body.querySelector("ol > li:last-child");
    if (last instanceof HTMLElement && last.hasAttribute("data-kind")) {
      body.scrollTop = Math.max(0, last.offsetTop - body.offsetTop - 12);
    } else {
      body.scrollTop = body.scrollHeight;
    }
  }, [lastMessageId]);

  useEffect(() => {
    // Grow the composer with its content (capped by CSS max-height); one line when empty.
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = "auto";
    // scrollHeight excludes the border: add it back (border-box) so 2-3 line drafts never show an inner scrollbar.
    field.style.height = `${field.scrollHeight + field.offsetHeight - field.clientHeight}px`;
  }, [draft, open]);

  useEffect(() => {
    if (status !== "rate_limited") return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1_000);
    return () => clearInterval(timer);
  }, [status]);

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || status !== "idle") return;
    const history = historyFor(messages);
    dispatch({ type: "send", text });
    try {
      dispatch({ type: "reply", reply: await transport.send({ message: text.slice(0, RUNTIME_MAX_MESSAGE_LENGTH), history }) });
    } catch {
      dispatch({ type: "failed" });
    }
  };

  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(draft);
  };

  const onTextareaKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(draft);
    }
  };

  const onPanelKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") dispatch({ type: "close" });
  };

  const onHandoff = (channel: "whatsapp" | "email", code: HandoffCode) => onEvent?.({ name: "handoff_clicked", channel, handoff_code: code });

  const composerDisabled = status !== "idle";
  const showCounter = draft.length > RUNTIME_MAX_MESSAGE_LENGTH * 0.75;

  return (
    <div className={styles.root} data-concierge-panel data-state={open ? "open" : "closed"}>
      {!open ? (
        <button ref={handleRef} type="button" className={styles.handle} aria-expanded={false} aria-controls={panelId} aria-label={copy.open} onClick={() => dispatch({ type: "open" })}>
          <span className={styles.handleOrnament} aria-hidden="true" />
          <span className={styles.handleLabel}>{copy.entryLabel}</span>
          <span className={styles.handleTag} aria-hidden="true">IA</span>
        </button>
      ) : null}

      <aside
        id={panelId}
        className={styles.panel}
        data-open={open}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
        onKeyDown={onPanelKey}
      >
        <header className={styles.header} data-compact={messages.length > 0}>
          <div className={styles.headerTop}>
            <div className={styles.headerIdentity}>
              <ConciergeAvatar size="md" />
              <div>
                <p className={styles.eyebrow}>{copy.eyebrow}</p>
                <h2 id={titleId} className={styles.title}>
                  {copy.title}
                </h2>
              </div>
            </div>
            <button type="button" className={styles.closeButton} aria-label={copy.close} onClick={() => dispatch({ type: "close" })}>
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.headerBottom}>
            <span className={styles.aiTag}>{copy.aiTag}</span>
            {/* Persistent human entry (RT-71 §5): static data, available even when every backend is down. */}
            <a className={styles.teamLink} href={team.url} target="_blank" rel="noopener noreferrer" aria-label={copy.teamEntryLabel} onClick={() => onHandoff("whatsapp", "H1")}>
              {copy.teamEntry}
            </a>
          </div>
        </header>

        {/* Before the first message the full AI disclosure is shown in the intro; afterwards this strip keeps it persistent. */}
        {messages.length > 0 ? <p className={styles.compactDisclosure}>{copy.compactDisclosure}</p> : null}

        <div ref={bodyRef} className={styles.body} data-testid="concierge-body">
          {messages.length === 0 ? (
            <section className={styles.intro} aria-labelledby={`${titleId}-intro`}>
              <h3 id={`${titleId}-intro`} className={styles.introTitle}>
                {copy.introTitle}
              </h3>
              <div className={styles.welcome}>
                <ConciergeAvatar size="lg" />
                <p className={styles.welcomeText}>{copy.welcome}</p>
              </div>
              <p className={styles.startersLabel}>{copy.starters}</p>
              <ul className={styles.starters}>
                {STARTER_QUESTIONS.map((question) => (
                  <li key={question}>
                    <button type="button" className={styles.starterButton} disabled={composerDisabled} onClick={() => void submit(question)}>
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
              <p className={styles.note} data-ai-disclosure>
                {CONCIERGE_PRIVACY.ai_disclosure}
              </p>
            </section>
          ) : (
            <ol className={styles.messages} role="log" aria-live="polite" aria-relevant="additions" aria-label={copy.messagesLabel}>
              {messages.map((message) => (
                <Message key={message.id} message={message} onHandoff={onHandoff} />
              ))}
            </ol>
          )}
          {status === "sending" ? (
            <div className={styles.thinking} role="status" aria-live="polite">
              <span className={styles.dots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {copy.thinking}
            </div>
          ) : null}
        </div>

        <div className={styles.composer}>
          {status === "rate_limited" ? (
            <p className={styles.notice} role="status">
              {copy.rateLimitedNotice} <strong>{formatCountdown(retryAfter)}</strong>.
            </p>
          ) : null}
          {status === "degraded" ? (
            <p className={styles.notice} role="status">
              {copy.degradedNotice}
              <button type="button" className={styles.retryButton} onClick={() => dispatch({ type: "retry" })}>
                {copy.retry}
              </button>
            </p>
          ) : null}
          <form className={styles.inputRow} onSubmit={onFormSubmit}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              aria-label={copy.composerLabel}
              placeholder={copy.composerPlaceholder}
              value={draft}
              maxLength={RUNTIME_MAX_MESSAGE_LENGTH}
              rows={1}
              disabled={composerDisabled}
              onChange={(event) => dispatch({ type: "draft", text: event.target.value })}
              onKeyDown={onTextareaKey}
            />
            <button type="submit" className={styles.sendButton} aria-label={copy.send} disabled={composerDisabled || !draft.trim()}>
              <span className={styles.sendText}>{copy.sendVisible}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12h15m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          {showCounter ? <p className={styles.counter}>{copy.counter(draft.length, RUNTIME_MAX_MESSAGE_LENGTH)}</p> : null}
          <details className={styles.privacy}>
            <summary>{copy.privacySummary}</summary>
            <p>{CONCIERGE_PRIVACY.privacy_notice}</p>
            {CONCIERGE_PRIVACY.legal_review === "PENDING" ? <span className={styles.pending}>{copy.privacyPending}</span> : null}
          </details>
        </div>
      </aside>
    </div>
  );
}
