import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it("renders email field and submit button", () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("calls fetch POST /api/forgot-password with email", async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/forgot-password",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );
    });
  });

  it('shows "Check your email" heading after successful submit', async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument();
  });

  it("displays submitted email in success message", async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ForgotPasswordPage />);

    const testEmail = "user@company.com";
    await user.type(screen.getByLabelText(/email address/i), testEmail);
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(testEmail)).toBeInTheDocument();
    });
  });

  it('shows "try another email address" button that resets the form', async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    const tryAgainButton = await screen.findByRole("button", { name: /try another email address/i });
    await user.click(tryAgainButton);

    // Form should be visible again
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /check your email/i })).not.toBeInTheDocument();
  });

  it("displays error on non-ok fetch response", async () => {
    const user = userEvent.setup();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "User not found" }),
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email address/i), "nonexistent@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/user not found/i)).toBeInTheDocument();
  });

  it('shows "Back to sign in" link', () => {
    render(<ForgotPasswordPage />);

    const backLink = screen.getByRole("link", { name: /back to sign in/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/sign-in");
  });
});
