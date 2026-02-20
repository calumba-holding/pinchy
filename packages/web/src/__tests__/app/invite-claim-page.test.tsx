import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import InviteClaimPage from "@/app/invite/[token]/page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useParams: () => ({
    token: "test-token-123",
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

global.fetch = vi.fn();

describe("Invite Claim Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render 'You've been invited to Pinchy' heading", () => {
    render(<InviteClaimPage />);
    expect(screen.getByText("You've been invited to Pinchy")).toBeInTheDocument();
  });

  it("should render Name and Password input fields", () => {
    render(<InviteClaimPage />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("should render a 'Create account' submit button", () => {
    render(<InviteClaimPage />);
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("should show error when API returns error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid or expired invite link" }),
    });

    render(<InviteClaimPage />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired invite link")).toBeInTheDocument();
    });
  });

  it("should submit to /api/invite/claim with token, name, and password", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<InviteClaimPage />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/invite/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "test-token-123",
          name: "Test User",
          password: "password123",
        }),
      });
    });
  });

  it("should redirect to /login on success via 'Continue to sign in' button", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<InviteClaimPage />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continue to sign in/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /continue to sign in/i }));
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
