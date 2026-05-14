'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTranslations } from 'next-intl'

function StarRating() {
  return (
    <div className="star-rating mb-4" aria-label="5 estrelas">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  const t = useTranslations('HomePage.Testimonials');
  return (
    <section className="section-spacing">
      <div className="mx-auto max-w-6xl px-5 lg:px-6">
        <div className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c8a86b]">
            Depoimentos reais
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-[15px] leading-7 text-white/60">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <TestimonialCard
            author="Danyela Viana"
            role="Turista · Rio de Janeiro"
            initials="DV"
            avatarUrl="/images/testimonials/danyela-viana.webp"
            text="O passeio de helicóptero foi simplesmente surreal! A vista aérea do Cristo Redentor e da Baía de Guanabara é algo que nunca vou esquecer. Organização, segurança e profissionalismo impecáveis."
          />

          <TestimonialCard
            author="Carlos Moura"
            role="Turista · São Paulo"
            initials="CM"
            avatarUrl="/images/testimonials/carlos-moura.webp"
            text="Experiência incrível! Atendimento impecável e roteiro muito bem planejado. O guia foi extremamente profissional e atencioso, tornando o passeio leve, seguro e enriquecedor. Recomendo para quem quer conhecer o Rio com qualidade."
          />

          <TestimonialCard
            author="Beyjamin Bonfim"
            role="Turista · Minas Gerais"
            initials="BB"
            avatarUrl="/images/testimonials/beyjamin-bonfim.webp"
            text="Roteiro cultural riquíssimo e muito bem explicado. O guia demonstrou domínio total da história do Rio, tornando o passeio envolvente e educativo. Experiência de altíssimo nível."
          />
        </div>
      </div>
    </section>
  )
}

interface TestimonialCardProps {
  author: string
  role: string
  initials: string
  avatarUrl?: string
  text: string
}

function TestimonialCard({
  author,
  role,
  initials,
  avatarUrl,
  text,
}: TestimonialCardProps) {
  return (
    <Card className="relative h-full overflow-hidden rounded-[24px] border border-white/8 bg-[#0d2436] text-white shadow-[0_16px_48px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c8a86b]/20 hover:shadow-[0_24px_64px_rgba(0,0,0,0.26)]">
      <div className="absolute left-5 top-4 select-none font-serif text-8xl leading-none text-[#c8a86b]/10" aria-hidden="true">
        &ldquo;
      </div>

      <CardContent className="flex h-full flex-col justify-between p-7">
        <div className="space-y-4">
          <StarRating />

          <p className="text-[15px] leading-[1.75] text-white/75">
            {text}
          </p>
        </div>

        <div className="mt-8 flex items-center gap-3 border-t border-white/8 pt-5">
          <Avatar className="size-10 shrink-0">
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                alt={author}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <AvatarFallback className="bg-white/[0.06] text-sm font-semibold text-[#d8c18f]">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-white">{author}</p>
            <p className="mt-0.5 text-xs text-white/50">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
