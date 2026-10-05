import { PUBLIC_CONTACT } from "@/lib/public-contact";

// Ricardo Tour-controlled fallback when the provider widget cannot load. Never shows provider inventory or RT-38 mock data.
export function OnerWidgetFallback() {
  return (
    <div role="alert" className="rounded-xl border border-black/10 bg-[var(--site-cream-soft)] p-6 text-[var(--site-ink)]">
      <p className="text-[18px] font-medium">Não foi possível carregar o motor de busca agora.</p>
      <p className="mt-2 text-[15px]">Fale com a nossa equipe e nós buscamos para você:</p>
      <ul className="mt-4 space-y-2 text-[15px]">
        <li>
          WhatsApp:{" "}
          <a className="underline" href={PUBLIC_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer">
            {PUBLIC_CONTACT.whatsappDisplay}
          </a>
        </li>
        <li>
          E-mail:{" "}
          <a className="underline" href={PUBLIC_CONTACT.mailto}>
            {PUBLIC_CONTACT.email}
          </a>
        </li>
      </ul>
    </div>
  );
}
