import { ArrowUp } from "lucide-react";

export type AIConciergeShellCopy = {
  status: string;
  examplesLabel: string;
  examples: readonly string[];
  inputLabel: string;
  placeholder: string;
  send: string;
};

// Visual shell only: no transport, no requests. The future real backend (AI + RAG) plugs in by
// replacing this static composer with a client component that owns input state and a transport adapter.
export function AIConciergeShell({ copy, statusId }: { copy: AIConciergeShellCopy; statusId: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#15191D] shadow-[0_18px_44px_rgba(0,0,0,0.3)]" data-concierge-shell>
      <div className="flex items-center justify-between gap-4 border-b border-white/8 px-4 py-3 md:px-5">
        <p className="text-[15px] font-semibold text-[#F4F0E8]">AI Concierge</p>
        <p
          id={statusId}
          className="inline-flex items-center gap-2 rounded-full border border-[#C8A86B]/40 px-3 py-1 text-xs font-medium tracking-[0.04em] text-[#E8C780]"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#C8A86B]" />
          {copy.status}
        </p>
      </div>

      <div className="px-4 pb-4 pt-4 md:px-5">
        <p id={`${statusId}-examples`} className="text-xs font-medium uppercase tracking-[0.14em] text-[#9DA3A5]">
          {copy.examplesLabel}
        </p>
        <ul aria-labelledby={`${statusId}-examples`} className="mt-2.5 flex flex-wrap gap-2">
          {copy.examples.map((example) => (
            <li
              key={example}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[13px] leading-[1.4] text-[#CAC7BF]"
            >
              {example}
            </li>
          ))}
        </ul>

        <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0E11] py-2 pl-4 pr-2">
          <input
            type="text"
            disabled
            aria-label={copy.inputLabel}
            aria-describedby={statusId}
            placeholder={copy.placeholder}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#F4F0E8] placeholder:text-[#9DA3A5] disabled:cursor-not-allowed"
          />
          <button
            type="button"
            disabled
            aria-label={copy.send}
            aria-describedby={statusId}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#343B42] bg-[#252B30] text-[#9DA3A5] disabled:cursor-not-allowed"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
