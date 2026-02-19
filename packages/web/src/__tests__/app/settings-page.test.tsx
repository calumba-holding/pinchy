import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SettingsPage from "@/app/(app)/settings/page";

let capturedProps: {
  onSuccess?: () => void;
  submitLabel?: string;
  configuredProviders?: Record<string, { configured: boolean }>;
  defaultProvider?: string | null;
} = {};

vi.mock("@/components/provider-key-form", () => ({
  ProviderKeyForm: (props: {
    onSuccess: () => void;
    submitLabel?: string;
    configuredProviders?: Record<string, { configured: boolean }>;
    defaultProvider?: string | null;
  }) => {
    capturedProps = props;
    return (
      <button onClick={props.onSuccess} data-testid="mock-provider-form">
        {props.submitLabel || "Continue"}
      </button>
    );
  },
}));

describe("Settings Page", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, "fetch").mockImplementation(vi.fn());
    vi.clearAllMocks();
    capturedProps = {};
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("should render the page title", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        defaultProvider: null,
        providers: {
          anthropic: { configured: false },
          openai: { configured: false },
          google: { configured: false },
        },
      }),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  it("should render LLM Provider section", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        defaultProvider: null,
        providers: {
          anthropic: { configured: false },
          openai: { configured: false },
          google: { configured: false },
        },
      }),
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("LLM Provider")).toBeInTheDocument();
    });
  });

  it("should show loading state while fetching provider status", () => {
    vi.mocked(global.fetch).mockReturnValueOnce(new Promise(() => {}));

    render(<SettingsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should pass configuredProviders and defaultProvider to ProviderKeyForm after fetch", async () => {
    const providerData = {
      defaultProvider: "anthropic",
      providers: {
        anthropic: { configured: true },
        openai: { configured: false },
        google: { configured: false },
      },
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => providerData,
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("mock-provider-form")).toBeInTheDocument();
    });

    expect(capturedProps.configuredProviders).toEqual(providerData.providers);
    expect(capturedProps.defaultProvider).toBe("anthropic");
  });

  it("should re-fetch provider status after onSuccess", async () => {
    const providerData = {
      defaultProvider: "anthropic",
      providers: {
        anthropic: { configured: true },
        openai: { configured: false },
        google: { configured: false },
      },
    };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => providerData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => providerData,
      });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("mock-provider-form")).toBeInTheDocument();
    });

    capturedProps.onSuccess!();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
