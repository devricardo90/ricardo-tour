import { TourRequestForm } from "@/components/site/tour/tour-request-form";
import { legalPagesAvailable } from "@/lib/legal/publication";

// Conversion block of the public tour detail (RT-55, the integration slot RT-54 reserved): WhatsApp or a short guest
// request form. No account, no payment, no availability confirmation. The id and data attribute remain the anchors
// used by the page ("Falar com a equipe" shortcut) and by the validators.
// Owner 31/10/2026: the request form collects personal data, so it renders only while the Privacy Policy is available
// (central legal rule); until then the slot keeps its heading and offers WhatsApp and e-mail only.
export function TourConversionSlot({ tripId, title, locale }: { tripId: string; title: string; locale: string }) {
  return (
    <section id="tour-contact" data-conversion-slot="rt-55" className="rounded-xl border border-[var(--site-rule-light)] bg-white p-6">
      <TourRequestForm tripId={tripId} title={title} locale={locale} formAvailable={legalPagesAvailable()} />
    </section>
  );
}
