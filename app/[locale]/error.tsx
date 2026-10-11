"use client";

import { useParams } from "next/navigation";
import { ErrorFallback } from "@/components/observability/error-fallback";

export default function LocaleError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  return <ErrorFallback {...props} locale={params?.locale} />;
}
