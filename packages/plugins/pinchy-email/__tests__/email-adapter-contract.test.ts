import { describe, it, expectTypeOf } from "vitest";
import type {
  EmailAdapter,
  EmailSummary,
  EmailFull,
  ListOptions,
  SearchOptions,
  ComposeOptions,
  Folder,
} from "../email-adapter.js";

describe("EmailAdapter contract", () => {
  it("Folder is the five canonical values", () => {
    expectTypeOf<Folder>().toEqualTypeOf<
      "INBOX" | "SENT" | "DRAFTS" | "TRASH" | "SPAM"
    >();
  });

  it("SearchOptions has the V1 DSL fields plus the free-text `text` field", () => {
    expectTypeOf<SearchOptions>().toEqualTypeOf<{
      from?: string;
      to?: string;
      subject?: string;
      text?: string;
      unread?: boolean;
      sinceDays?: number;
      folder?: Folder;
      limit?: number;
    }>();
  });

  it("EmailAdapter has the five method signatures", () => {
    expectTypeOf<EmailAdapter["list"]>().toBeFunction();
    expectTypeOf<EmailAdapter["read"]>().toBeFunction();
    expectTypeOf<EmailAdapter["search"]>().toBeFunction();
    expectTypeOf<EmailAdapter["draft"]>().toBeFunction();
    expectTypeOf<EmailAdapter["send"]>().toBeFunction();
  });

  it("EmailFull carries attachment metadata", () => {
    expectTypeOf<EmailFull["attachments"]>().toEqualTypeOf<
      Array<{ id: string; filename: string; mimeType: string; size: number }>
    >();
  });

  it("EmailAdapter has a getAttachment method that downloads attachment bytes", () => {
    expectTypeOf<EmailAdapter["getAttachment"]>().toBeFunction();
    expectTypeOf<EmailAdapter["getAttachment"]>().parameters.toEqualTypeOf<
      [string, string]
    >();
    expectTypeOf<
      EmailAdapter["getAttachment"]
    >().returns.resolves.toEqualTypeOf<{
      filename: string;
      mimeType: string;
      data: Buffer;
    }>();
  });
});
