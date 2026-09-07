import { describe, expect, it, vi } from "vitest";

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    const error = new Error("NEXT_NOT_FOUND") as Error & { digest: string };
    error.digest = "NEXT_NOT_FOUND";
    throw error;
  })
);

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

import RebuildLabLayout, { metadata as layoutMetadata } from "@/app/[locale]/rebuild-lab/layout";
import RebuildLabPage, { metadata as pageMetadata } from "@/app/[locale]/rebuild-lab/page";
import { isRebuildLabEnabled } from "@/lib/rebuild-lab/config";

const FORBIDDEN_COMPONENTS = [
  "HeroHeader",
  "AIConciergeWidget",
  "FooterSection",
  "HeroSection",
  "ReservationsSection",
];

function collectText(node: unknown): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join(" ");
  }

  if (typeof node === "object" && "props" in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    return collectText(props?.children);
  }

  return "";
}

function collectComponentNames(node: unknown, names: string[] = []): string[] {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") {
    return names;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => collectComponentNames(child, names));
    return names;
  }

  if (typeof node === "object" && "type" in node) {
    const type = (node as { type?: unknown }).type;

    if (typeof type === "function") {
      names.push((type as { name?: string }).name ?? "");
    }

    const props = (node as { props?: { children?: unknown } }).props;
    collectComponentNames(props?.children, names);
  }

  return names;
}

describe("rebuild lab availability flag", () => {
  it("is enabled by default in local development", () => {
    expect(isRebuildLabEnabled({})).toBe(true);
    expect(isRebuildLabEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("is disabled by default in production", () => {
    expect(isRebuildLabEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isRebuildLabEnabled({ VERCEL_ENV: "production" })).toBe(false);
  });

  // Vercel sets NODE_ENV=production on every deployment, preview included; it only
  // sets development for `vercel dev`. A { VERCEL_ENV: "preview" } shape with no
  // NODE_ENV cannot occur on Vercel, so the preview cases below carry both values.
  it("is disabled by default on a real vercel preview deployment", () => {
    expect(isRebuildLabEnabled({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe(false);
  });

  it("enables a real vercel preview deployment only when the flag is set explicitly", () => {
    expect(
      isRebuildLabEnabled({
        VERCEL_ENV: "preview",
        NODE_ENV: "production",
        REBUILD_LAB_ENABLED: "true",
      })
    ).toBe(true);
  });

  it("lets an explicit flag win in both directions", () => {
    expect(isRebuildLabEnabled({ REBUILD_LAB_ENABLED: "true", VERCEL_ENV: "production" })).toBe(true);
    expect(isRebuildLabEnabled({ REBUILD_LAB_ENABLED: "1", NODE_ENV: "production" })).toBe(true);
    expect(isRebuildLabEnabled({ REBUILD_LAB_ENABLED: "off", NODE_ENV: "development" })).toBe(false);
    expect(isRebuildLabEnabled({ REBUILD_LAB_ENABLED: "false" })).toBe(false);
  });

  it("falls back to the environment default for unrecognised values", () => {
    expect(isRebuildLabEnabled({ REBUILD_LAB_ENABLED: "maybe", NODE_ENV: "production" })).toBe(false);
    expect(isRebuildLabEnabled({ REBUILD_LAB_ENABLED: "maybe", NODE_ENV: "development" })).toBe(true);
  });
});

describe("rebuild lab route gate", () => {
  it("renders the lab shell when the lab is enabled", () => {
    vi.stubEnv("REBUILD_LAB_ENABLED", "true");

    try {
      const result = RebuildLabLayout({ children: <div>Lab content</div> });

      expect(notFoundMock).not.toHaveBeenCalled();
      expect(collectText(result)).toContain("Rebuild Lab");
      expect(collectText(result)).toContain("Lab content");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("returns not found when the lab is disabled", () => {
    vi.stubEnv("REBUILD_LAB_ENABLED", "false");

    try {
      expect(() => RebuildLabLayout({ children: <div>Lab content</div> })).toThrowError(
        /NEXT_NOT_FOUND/
      );
      expect(notFoundMock).toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("rebuild lab isolation from the production home", () => {
  it("keeps the lab out of search indexes without touching robots or sitemap", () => {
    expect(layoutMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(pageMetadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("mounts no production home or public layout component", () => {
    vi.stubEnv("REBUILD_LAB_ENABLED", "true");

    try {
      const tree = RebuildLabLayout({ children: RebuildLabPage() });
      const rendered = collectComponentNames(tree);

      FORBIDDEN_COMPONENTS.forEach((component) => {
        expect(rendered).not.toContain(component);
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
