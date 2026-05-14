"use client";

import { useTranslations } from "next-intl";
import { Mail, MessageCircleMore, ShieldCheck } from "lucide-react";
import Image from "next/image";

import { RickTravelLogo } from "@/components/rick-travel-logo";
import { Link } from "@/i18n/routing";
import { buildWhatsAppQuoteUrl } from "@/lib/whatsapp";

export default function FooterSection() {
    const t = useTranslations("Footer");
    const whatsappUrl = buildWhatsAppQuoteUrl({ locale: "pt", source: "home" });

    const columns = [
        {
            title: "Empresa",
            links: [
                { label: t("links.home"), href: "/" },
                { label: t("links.about"), href: "/quem-somos" },
            ],
        },
        {
            title: "Servicos",
            links: [{ label: "Tours", href: "/tours" }],
        },
        {
            title: "Suporte",
            links: [
                { label: t("links.help"), href: "/contato" },
            ],
        },
    ];

    return (
        <footer className="border-t border-white/8 bg-[#071826] py-14 md:py-18">
            <div className="mx-auto max-w-6xl px-5 lg:px-6">
                <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" aria-label="Rick Travel - Pagina inicial" className="block w-fit">
                            <RickTravelLogo variant="full" size="md" />
                        </Link>
                        <p className="mt-4 max-w-[260px] text-sm leading-7 text-white/62">
                            Experiencias no Rio de Janeiro com operacao mais clara, segura e personalizada.
                        </p>
                    </div>

                    {columns.map((column) => (
                        <div key={column.title}>
                            <h3 className="mb-4 text-sm font-semibold text-white">{column.title}</h3>
                            <ul className="space-y-3">
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-white/58 transition-colors duration-150 hover:text-white"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-10 grid gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-5 md:grid-cols-3">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 rounded-[18px] border border-white/8 bg-[#091d2c] p-4 text-sm text-white/72 transition-colors hover:text-white"
                    >
                        <MessageCircleMore className="mt-0.5 h-5 w-5 shrink-0 text-[#d8c18f]" />
                        <span>
                            <strong className="block text-white">WhatsApp oficial</strong>
                            Atendimento direto para orcamentos, agenda e duvidas antes da pre-reserva.
                        </span>
                    </a>
                    <Link
                        href="/contato"
                        className="flex items-start gap-3 rounded-[18px] border border-white/8 bg-[#091d2c] p-4 text-sm text-white/72 transition-colors hover:text-white"
                    >
                        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#d8c18f]" />
                        <span>
                            <strong className="block text-white">Formulario seguro</strong>
                            Envie seu e-mail e telefone para a equipe retornar com roteiro e disponibilidade.
                        </span>
                    </Link>
                    <div className="flex items-start gap-3 rounded-[18px] border border-white/8 bg-[#091d2c] p-4 text-sm text-white/72">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#d8c18f]" />
                        <span>
                            <strong className="block text-white">Pre-reserva manual</strong>
                            Nenhum pagamento online e iniciado nesta versao; a equipe confirma os proximos passos.
                        </span>
                    </div>
                </div>

                <div className="my-10 border-t border-white/8" />

                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                    <div className="flex items-center gap-5">
                        <Image
                            src="/cadastro/cadastur.png"
                            alt="Cadastur - Ministério do Turismo"
                            width={72}
                            height={40}
                            className="object-contain opacity-70"
                        />
                        <Image
                            src="/logos/logo-turismo.webp"
                            alt="Ministério do Turismo"
                            width={72}
                            height={40}
                            className="object-contain opacity-70"
                        />
                    </div>
                    <span className="text-center text-sm text-white/50">
                        &copy; {new Date().getFullYear()} <strong className="text-white">Rick Travel</strong>. {t("copyright")}
                    </span>
                </div>
            </div>
        </footer>
    );
}
