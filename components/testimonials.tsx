'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

export default function TravelerSupportSection() {
  const t = useTranslations('HomePage.TravelerSupport')
  const items = ['orientation', 'languages', 'handoff'] as const

  return (
    <section className="section-spacing-sm">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="mx-auto mb-9 max-w-2xl space-y-3 text-center md:mb-10">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c8a86b]">
            {t('eyebrow')}
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-[15px] leading-7 text-white/60">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SupportCard
              key={item}
              title={t(`items.${item}.title`)}
              text={t(`items.${item}.text`)}
              footer={t('cardFooter')}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface SupportCardProps {
  title: string
  text: string
  footer: string
}

function SupportCard({ title, text, footer }: SupportCardProps) {
  return (
    <Card className="relative h-full overflow-hidden rounded-[22px] border border-white/8 bg-[#0d2436] text-white shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c8a86b]/20 hover:shadow-[0_20px_54px_rgba(0,0,0,0.25)]">
      <div className="absolute right-5 top-5 h-9 w-9 rounded-full border border-[#c8a86b]/20 bg-[#c8a86b]/10" aria-hidden="true" />

      <CardContent className="relative flex h-full flex-col justify-between p-5 md:p-6">
        <div className="space-y-3">
          <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-white md:text-lg">
            {title}
          </h3>

          <p className="text-[15px] leading-7 text-white/68">
            {text}
          </p>
        </div>

        <div className="mt-6 border-t border-white/8 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d8c18f]">
          {footer}
        </div>
      </CardContent>
    </Card>
  )
}
