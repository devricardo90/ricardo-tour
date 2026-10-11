"use client";

import { Fragment, useEffect, useId, useReducer, useRef, type FormEvent, type KeyboardEvent } from "react";
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
        <span className={styles.who}>{copy.you}</span>
        {message.text}
      </li>
    );
  }
  return (
    <li className={styles.messageAssistant} data-kind={message.kind}>
      <span className={styles.who}>{copy.concierge}</span>
      <p>{renderText(message.text)}</p>
      {message.handoff ? <HandoffCard offer={message.handoff} onClick={onHandoff} /> : null}
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

  useEffect(() => {
    // Follow the conversation only once it exists; the empty state always starts at the top.
    const body = bodyRef.current;
    if (body && messages.length > 0) body.scrollTop = body.scrollHeight;
  }, [messages.length, status]);

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
          <span className={styles.handleLabel}>{copy.title}</span>
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
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <p className={styles.eyebrow}>{copy.eyebrow}</p>
              <h2 id={titleId} className={styles.title}>
                {copy.title}
              </h2>
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
              <p className={styles.introBody}>{copy.introBody}</p>
              <p className={styles.note} data-ai-disclosure>
                {CONCIERGE_PRIVACY.ai_disclosure}
              </p>
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
              rows={2}
              disabled={composerDisabled}
              onChange={(event) => dispatch({ type: "draft", text: event.target.value })}
              onKeyDown={onTextareaKey}
            />
            <button type="submit" className={styles.sendButton} aria-label={copy.send} disabled={composerDisabled || !draft.trim()}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
