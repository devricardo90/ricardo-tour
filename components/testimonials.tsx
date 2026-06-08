'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

export default function TravelerSupportSection() {
  const t = useTranslations('HomePage.TravelerSupport')
  const items = ['orientation', 'languages', 'handoff'] as const

  return (
    <section className="section-spacing">
      <div className="mx-auto max-w-6xl px-5 lg:px-6">
        <div className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c8a86b]">
            {t('eyebrow')}
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-[15px] leading-7 text-white/60">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <Card className="relative h-full overflow-hidden rounded-[24px] border border-white/8 bg-[#0d2436] text-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c8a86b]/20 hover:shadow-[0_24px_64px_rgba(0,0,0,0.26)]">
      <div className="absolute right-5 top-5 h-10 w-10 rounded-full border border-[#c8a86b]/20 bg-[#c8a86b]/10" aria-hidden="true" />

      <CardContent className="relative flex h-full flex-col justify-between p-7">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-white">
            {title}
          </h3>

          <p className="text-[15px] leading-[1.75] text-white/70">
            {text}
          </p>
        </div>

        <div className="mt-8 border-t border-white/8 pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#d8c18f]">
          {footer}
        </div>
      </CardContent>
    </Card>
  )
}
