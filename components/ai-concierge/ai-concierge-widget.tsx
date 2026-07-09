"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  AIConciergeEnvelope,
  AIConciergeResponse,
} from "@/lib/ai-concierge/contract";
import type { SupportedLocale } from "@/i18n/routing";

type ChatMessage =
  | {
      id: string;
      role: "user";
      content: string;
    }
  | {
      id: string;
      role: "assistant";
      content: string;
      response: AIConciergeResponse;
    };

const COPY = {
  pt: {
    entry: "AI Concierge",
    open: "Abrir AI Concierge",
    close: "Fechar AI Concierge",
    title: "AI Concierge",
    subtitle: "Orientacao inicial para planejar seu passeio",
    placeholder: "Pergunte sobre passeios, roteiro ou duvidas de viagem...",
    send: "Enviar",
    loading: "Preparando resposta...",
    empty:
      "Envie uma pergunta para receber uma resposta simulada e segura desta primeira versao.",
    error:
      "Nao foi possivel responder agora. Tente novamente ou fale com a equipe Rick Travel.",
    handoff: "Confirmacoes finais seguem com atendimento humano.",
  },
  en: {
    entry: "AI Concierge",
    open: "Open AI Concierge",
    close: "Close AI Concierge",
    title: "AI Concierge",
    subtitle: "Initial guidance for planning your tour",
    placeholder: "Ask about tours, itineraries, or travel questions...",
    send: "Send",
    loading: "Preparing response...",
    empty:
      "Send a question to receive a safe mocked response from this first version.",
    error:
      "I cannot respond right now. Try again or contact the Rick Travel team.",
    handoff: "Final confirmations stay with human support.",
  },
  es: {
    entry: "AI Concierge",
    open: "Abrir AI Concierge",
    close: "Cerrar AI Concierge",
    title: "AI Concierge",
    subtitle: "Orientacion inicial para planear tu paseo",
    placeholder: "Pregunta sobre paseos, itinerarios o dudas de viaje...",
    send: "Enviar",
    loading: "Preparando respuesta...",
    empty:
      "Envia una pregunta para recibir una respuesta simulada y segura de esta primera version.",
    error:
      "No fue posible responder ahora. Intenta de nuevo o habla con el equipo Rick Travel.",
    handoff: "Las confirmaciones finales siguen con atencion humana.",
  },
  sv: {
    entry: "AI Concierge",
    open: "Open AI Concierge",
    close: "Close AI Concierge",
    title: "AI Concierge",
    subtitle: "Initial guidance for planning your tour",
    placeholder: "Ask about tours, itineraries, or travel questions...",
    send: "Send",
    loading: "Preparing response...",
    empty:
      "Send a question to receive a safe mocked response from this first version.",
    error:
      "I cannot respond right now. Try again or contact the Rick Travel team.",
    handoff: "Final confirmations stay with human support.",
  },
} as const;

function getCopy(locale: string) {
  if (locale === "pt" || locale === "en" || locale === "es" || locale === "sv") {
    return COPY[locale];
  }

  return COPY.en;
}

export function AIConciergeWidget() {
  const locale = useLocale();
  const copy = useMemo(() => getCopy(locale), [locale]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedInput,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-concierge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale: locale as SupportedLocale,
          message: trimmedInput,
          pageContext: {
            path: window.location.pathname,
            surface: window.location.pathname.includes("/contato")
              ? "contact"
              : "public_site",
          },
        }),
      });

      const payload = (await response.json()) as AIConciergeEnvelope;

      if (!response.ok || payload.status === "error") {
        throw new Error(payload.status === "error" ? payload.error.message : copy.error);
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: payload.data.id,
          role: "assistant",
          content: payload.data.answer,
          response: payload.data,
        },
      ]);
    } catch {
      setError(copy.error);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label={copy.title}
          className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-card text-card-foreground shadow-[0_24px_80px_rgba(16,32,51,0.22)] dark:border-white/10"
          data-testid="ai-concierge-panel"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-[#0b2233] px-4 py-4 text-white">
            <div className="flex min-w-0 gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/10">
                <Bot className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-5">{copy.title}</h2>
                <p className="mt-0.5 text-xs leading-5 text-white/72">
                  {copy.subtitle}
                </p>
              </div>
            </div>
            <button
              aria-label={copy.close}
              className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[22rem] min-h-[14rem] space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground">
                {copy.empty}
              </p>
            ) : null}

            {messages.map((message) => (
              <div
                className={cn(
                  "rounded-xl px-3 py-2 text-sm leading-6",
                  message.role === "user"
                    ? "ml-8 bg-primary text-primary-foreground"
                    : "mr-8 border border-border bg-background"
                )}
                data-testid={
                  message.role === "assistant"
                    ? "ai-concierge-assistant-message"
                    : "ai-concierge-user-message"
                }
                key={message.id}
              >
                <p>{message.content}</p>
                {message.role === "assistant" ? (
                  <p className="mt-2 border-t border-border/70 pt-2 text-xs text-muted-foreground">
                    {copy.handoff}
                  </p>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div
                className="mr-8 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                data-testid="ai-concierge-loading"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>{copy.loading}</span>
              </div>
            ) : null}

            {error ? (
              <p
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive"
                data-testid="ai-concierge-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <form
            className="border-t border-border/70 bg-muted/30 p-3"
            onSubmit={sendMessage}
          >
            <Textarea
              aria-label={copy.placeholder}
              className="max-h-28 min-h-20 resize-none bg-background"
              data-testid="ai-concierge-input"
              disabled={loading}
              maxLength={800}
              onChange={(event) => setInput(event.target.value)}
              placeholder={copy.placeholder}
              ref={inputRef}
              value={input}
            />
            <div className="mt-3 flex justify-end">
              <Button
                className="rounded-xl"
                data-testid="ai-concierge-send"
                disabled={!input.trim() || loading}
                type="submit"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                {copy.send}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        aria-label={copy.open}
        className="button-press inline-flex h-14 items-center gap-2 rounded-2xl border border-white/10 bg-[#123a28] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_42px_rgba(18,58,40,0.28)] transition hover:-translate-y-0.5 hover:bg-[#184731] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        data-testid="ai-concierge-entry"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        type="button"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        <span>{copy.entry}</span>
      </button>
    </div>
  );
}
