'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Building2, Clock, Compass, Globe, Instagram, Mail, MessageCircle, Phone } from 'lucide-react'

export function SecuritySection() {
    const t = useTranslations('AboutPage.security')

    return (
        <section className="section-spacing-sm">
            <div className="mx-auto max-w-7xl px-5 lg:px-12">
                <div className="mx-auto mb-12 max-w-3xl text-center">
                    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d8c18f]">
                        {t('eyebrow')}
                    </div>
                    <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                        {t('title')}
                    </h2>
                    <p className="mt-4 text-[15px] leading-7 text-white/62">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <InfoPanel
                        icon={<Compass className="h-9 w-9 text-[#d8c18f]" />}
                        title={t('supportInfo.title')}
                        text={t('supportInfo.description')}
                    />
                    <InfoPanel
                        icon={<MessageCircle className="h-9 w-9 text-[#d8c18f]" />}
                        title={t('handoffInfo.title')}
                        text={t('handoffInfo.description')}
                    />
                </div>

                <div className="mt-6 rounded-[30px] border border-white/8 bg-[#0d2436] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.18)] md:p-8">
                    <h3 className="text-center text-lg font-semibold tracking-[-0.03em] text-white">
                        {t('operational.title')}
                    </h3>

                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        <SmallPanel
                            icon={<Compass className="h-6 w-6 text-[#d8c18f]" />}
                            title={t('operational.orientation.title')}
                            text={t('operational.orientation.description')}
                        />
                        <SmallPanel
                            icon={<MessageCircle className="h-6 w-6 text-[#d8c18f]" />}
                            title={t('operational.handoff.title')}
                            text={t('operational.handoff.description')}
                        />
                        <SmallPanel
                            icon={<Clock className="h-6 w-6 text-[#d8c18f]" />}
                            title={t('operational.support.title')}
                            text={t('operational.support.description')}
                        />
                    </div>
                </div>

                <div className="mt-6 rounded-[30px] border border-white/8 bg-[#0d2436] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.18)] md:p-8">
                    <h3 className="mb-2 text-center text-lg font-semibold tracking-[-0.03em] text-white">
                        {t('identity.businessName')}
                    </h3>
                    <p className="mb-8 text-center text-xs text-white/48">{t('identity.serviceFocus')}</p>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <IdentityItem icon={<Building2 className="h-4 w-4 shrink-0 text-[#d8c18f]" />} label={t('identity.serviceLabel')} value={t('identity.serviceValue')} />
                        <IdentityItem icon={<Instagram className="h-4 w-4 shrink-0 text-[#d8c18f]" />} label={t('identity.instagramLabel')} value="@ricktravelbrasil" />
                        <IdentityItem icon={<Phone className="h-4 w-4 shrink-0 text-[#d8c18f]" />} label={t('identity.whatsappLabel')} value="+55 21 96681-9928" />
                        <IdentityItem icon={<Mail className="h-4 w-4 shrink-0 text-[#d8c18f]" />} label={t('identity.emailLabel')} value="contact@travelrick.com" />
                        <IdentityItem icon={<Globe className="h-4 w-4 shrink-0 text-[#d8c18f]" />} label={t('identity.languagesLabel')} value={t('identity.languagesValue')} />
                        <IdentityItem icon={<Clock className="h-4 w-4 shrink-0 text-[#d8c18f]" />} label={t('identity.nextStepLabel')} value={t('identity.nextStepValue')} />
                    </div>
                </div>
            </div>
        </section>
    )
}

function InfoPanel({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
    return (
        <div className="rounded-[28px] border border-white/8 bg-[#0d2436] p-7 text-center shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
            <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.05]">
                    {icon}
                </div>
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-[-0.03em] text-white">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-white/64">{text}</p>
        </div>
    )
}

function SmallPanel({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
    return (
        <div className="rounded-[22px] border border-white/8 bg-[#091d2c] px-5 py-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                {icon}
            </div>
            <h4 className="mt-4 text-sm font-semibold text-white">{title}</h4>
            <p className="mt-2 text-xs leading-6 text-white/58">{text}</p>
        </div>
    )
}

function IdentityItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            {icon}
            <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">{label}</p>
                <p className="text-sm text-white/80">{value}</p>
            </div>
        </div>
    )
}
