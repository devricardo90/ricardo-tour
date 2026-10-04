import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BUSINESS_REPLY_TO, TRANSACTIONAL_FROM, resolveReplyTo, toSingleLine } from "@/lib/email-identity";

const send = vi.fn();
vi.mock("@/lib/resend", () => ({ resend: { emails: { send: (...args: unknown[]) => send(...args) } } }));

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" || entry.name.startsWith(".") ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("transactional e-mail identity (RT-62)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    send.mockReset();
  });

  it("uses the verified transactional sender and the business inbox", () => {
    expect(TRANSACTIONAL_FROM).toBe("Ricardo Tour <notificacoes@ricardotour.com>");
    expect(BUSINESS_REPLY_TO).toBe("contato@ricardotour.com");
  });

  it("no active source sends from the retired ricktravel.com.br domain", () => {
    for (const dir of ["lib", "app", "components"]) {
      for (const file of sourceFiles(dir)) {
        expect(fs.readFileSync(file, "utf8"), file).not.toMatch(/@ricktravel\.com\.br/);
      }
    }
  });

  it("only email-identity.ts defines the transactional sender string", () => {
    for (const file of [...sourceFiles("lib"), ...sourceFiles("app")]) {
      if (file.replace(/\\/g, "/").endsWith("lib/email-identity.ts")) continue;
      expect(fs.readFileSync(file, "utf8"), file).not.toMatch(/notificacoes@ricardotour\.com/);
    }
  });

  it("accepts a plain visitor address as Reply-To and falls back to the business inbox otherwise", () => {
    expect(resolveReplyTo("ana@example.com")).toBe("ana@example.com");
    expect(resolveReplyTo("  ana@example.com ")).toBe("ana@example.com");
    for (const bad of [undefined, null, "", "not-an-email", "Ana <ana@example.com>", "a@b.co, evil@x.co", "a@b.co\r\nBcc: evil@x.co", "a@b.co;evil@x.co", '"x"@y.co', "a@b"]) {
      expect(resolveReplyTo(bad as string | null | undefined), String(bad)).toBe(BUSINESS_REPLY_TO);
    }
  });

  it("keeps visitor text on a single line", () => {
    expect(toSingleLine("Nova mensagem: Ana\r\nBcc: evil@x.co")).toBe("Nova mensagem: Ana Bcc: evil@x.co");
  });

  it("contact notifications use the fixed sender, the contact inbox and a safe Reply-To", async () => {
    vi.stubEnv("CONTACT_EMAIL_MODE", "send");
    send.mockResolvedValue({ data: { id: "m1" }, error: null });
    const { sendContactNotification } = await import("@/lib/services/tour-request-notification");

    const visitor = await sendContactNotification({ submissionId: "s1", subject: "Assunto\r\nBcc: evil@x.co", message: "msg", replyTo: "ana@example.com" });
    expect(visitor).toBe("sent");
    expect(send).toHaveBeenLastCalledWith(
      expect.objectContaining({ from: TRANSACTIONAL_FROM, to: ["contato@ricardotour.com"], replyTo: "ana@example.com", subject: "Assunto Bcc: evil@x.co" })
    );

    await sendContactNotification({ submissionId: "s2", subject: "x", message: "msg", replyTo: "Evil <evil@x.co>" });
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ from: TRANSACTIONAL_FROM, replyTo: BUSINESS_REPLY_TO }));

    await sendContactNotification({ submissionId: "s3", subject: "x", message: "msg" });
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ from: TRANSACTIONAL_FROM, replyTo: BUSINESS_REPLY_TO }));
  });
});
