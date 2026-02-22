import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@assistant-ui/react", () => ({
  ThreadPrimitive: {
    Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Viewport: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Messages: () => null,
    ViewportFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    ScrollToBottom: ({ children }: any) => <div>{children}</div>,
    Suggestions: () => null,
  },
  AuiIf: ({ children }: any) => <>{children}</>,
  ComposerPrimitive: {
    Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AttachmentDropzone: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Input: (props: any) => <input {...props} />,
    Send: ({ children }: any) => <div>{children}</div>,
    Cancel: ({ children }: any) => <div>{children}</div>,
  },
  SuggestionPrimitive: {
    Trigger: ({ children }: any) => <div>{children}</div>,
    Title: () => null,
    Description: () => null,
  },
  ActionBarPrimitive: {
    Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Copy: ({ children }: any) => <div>{children}</div>,
    ExportMarkdown: ({ children }: any) => <div>{children}</div>,
  },
  ActionBarMorePrimitive: {
    Root: ({ children }: any) => <div>{children}</div>,
    Trigger: ({ children }: any) => <div>{children}</div>,
    Content: ({ children }: any) => <div>{children}</div>,
    Item: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  ErrorPrimitive: {
    Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Message: (props: any) => <div {...props} />,
  },
  MessagePrimitive: {
    Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Parts: () => null,
    Error: ({ children }: any) => <div>{children}</div>,
  },
  useMessage: () => ({}),
}));

vi.mock("@/components/assistant-ui/attachment", () => ({
  ComposerAddAttachment: () => null,
  ComposerAttachments: () => null,
  UserMessageAttachments: () => null,
}));

vi.mock("@/components/assistant-ui/chat-image", () => ({
  ChatImage: () => null,
}));

vi.mock("@/components/assistant-ui/markdown-text", () => ({
  MarkdownText: () => null,
}));

vi.mock("@/components/assistant-ui/tool-fallback", () => ({
  ToolFallback: () => null,
}));

vi.mock("@/components/assistant-ui/tooltip-icon-button", () => ({
  TooltipIconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

import { Thread } from "@/components/assistant-ui/thread";

describe("ThreadWelcome privacy notice", () => {
  it("shows shared agent notice when isPersonal is false", () => {
    render(<Thread isPersonal={false} />);
    expect(screen.getByText(/conversations help build team knowledge/i)).toBeInTheDocument();
  });

  it("shows private agent notice when isPersonal is true", () => {
    render(<Thread isPersonal={true} />);
    expect(screen.getByText(/conversations are private/i)).toBeInTheDocument();
  });

  it("defaults to shared notice when isPersonal is not provided", () => {
    render(<Thread />);
    expect(screen.getByText(/conversations help build team knowledge/i)).toBeInTheDocument();
  });
});
