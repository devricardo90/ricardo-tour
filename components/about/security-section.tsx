'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ShieldCheck, Car, Clock, CheckCircle2, Phone, Mail, Globe, Building2, Instagram } from 'lucide-react'

export function SecuritySection() {
    const t = useTranslations('AboutPage.security')

    return (
        <section className="section-spacing-sm">
            <div className="mx-auto max-w-7xl px-5 lg:px-12">
                <div className="mx-auto mb-12 max-w-3xl text-center">
                    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d8c18f]">
                        Segurança e certificação
                    </div>
                    <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                        {t('title')}
                    </h2>
                    <p className="mt-4 text-[15px] leading-7 text-white/62">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/8 bg-[#0d2436] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                        <div className="flex justify-center">
                            <div className="relative flex h-28 w-28 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.05]">
                                <Image
                                    src="/images/seals/cadastur-official.png"
                                    alt="Selo Cadastur"
                                    width={90}
                                    height={90}
                                    className="object-contain opacity-90"
                                />
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm font-medium text-white/76">
                                {t('certification.registered')}
                            </p>

                            <div className="mt-5 space-y-3 text-xs text-white/58">
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d8c18f]" />
                                    <span>{t('certification.activeStatus')}</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d8c18f]" />
                                    <span>{t('certification.federalCompliance')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-white/8 bg-[#0d2436] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
                        <div className="flex justify-center">
                            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white/10">
                                <Image
                                    src="/images/about/guide-ricardo.jpg"
                                    alt={t('guide.imageAlt')}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{t('guide.name')}</h3>
                            <p className="mt-2 text-sm font-medium text-[#d8c18f]">{t('guide.title')}</p>
                            <p className="mt-1 text-xs text-white/48">{t('guide.subtitle')}</p>

                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-[30px] border border-white/8 bg-[#0d2436] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.18)] md:p-8">
                    <h3 className="text-center text-lg font-semibold tracking-[-0.03em] text-white">
                        {t('operational.title')}
                    </h3>

                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        <div className="rounded-[22px] border border-white/8 bg-[#091d2c] px-5 py-5 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                                <Car className="h-6 w-6 text-[#d8c18f]" />
                            </div>
                            <h4 className="mt-4 text-sm font-semibold text-white">
                                {t('operational.vehicles.title')}
                            </h4>
                            <p className="mt-2 text-xs leading-6 text-white/58">
                                {t('operational.vehicles.description')}
                            </p>
                        </div>

                        <div className="rounded-[22px] border border-white/8 bg-[#091d2c] px-5 py-5 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                                <ShieldCheck className="h-6 w-6 text-[#d8c18f]" />
                            </div>
                            <h4 className="mt-4 text-sm font-semibold text-white">
                                {t('operational.insurance.title')}
                            </h4>
                            <p className="mt-2 text-xs leading-6 text-white/58">
                                {t('operational.insurance.description')}
                            </p>
                        </div>

                        <div className="rounded-[22px] border border-white/8 bg-[#091d2c] px-5 py-5 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                                <Clock className="h-6 w-6 text-[#d8c18f]" />
                            </div>
                            <h4 className="mt-4 text-sm font-semibold text-white">
                                {t('operational.support.title')}
                            </h4>
                            <p className="mt-2 text-xs leading-6 text-white/58">
                                {t('operational.support.description')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-[30px] border border-white/8 bg-[#0d2436] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.18)] md:p-8">
                    <h3 className="mb-2 text-center text-lg font-semibold tracking-[-0.03em] text-white">
                        {t('identity.businessName')}
                    </h3>
                    <p className="mb-8 text-center text-xs text-white/48">{t('identity.serviceFocus')}</p>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 shrink-0 text-[#d8c18f]" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">{t('identity.companyDocumentLabel')}</p>
                                <p className="text-sm text-white/80">49.142.341/0001-90</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Instagram className="h-4 w-4 shrink-0 text-[#d8c18f]" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">{t('identity.instagramLabel')}</p>
                                <p className="text-sm text-white/80">@ricktravelbrasil</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 shrink-0 text-[#d8c18f]" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">{t('identity.whatsappLabel')}</p>
                                <p className="text-sm text-white/80">+55 21 97116-8114</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 shrink-0 text-[#d8c18f]" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">{t('identity.emailLabel')}</p>
                                <p className="text-sm text-white/80">contact@travelrick.com</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4 shrink-0 text-[#d8c18f]" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">{t('identity.languagesLabel')}</p>
                                <p className="text-sm text-white/80">{t('identity.languagesValue')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 shrink-0 text-[#d8c18f]" />
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">{t('identity.serviceHoursLabel')}</p>
                                <p className="text-sm text-white/80">{t('identity.serviceHoursValue')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
