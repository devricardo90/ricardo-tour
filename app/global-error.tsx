"use client";

import { ErrorFallback } from "@/components/observability/error-fallback";

// Last resort: replaces the root layout, so it owns <html>/<body>.
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt">
      <body>
        <ErrorFallback {...props} />
      </body>
    </html>
  );
}
