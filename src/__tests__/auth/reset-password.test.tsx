import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ResetPasswordPage from "@/app/reset-password/page";

describe("ResetPasswordPage", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    globalThis.fetch = vi.fn();

    // Reset window.location.search
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "" },
      writable: true,
    });
  });

  it('shows "Invalid Reset Link" when no token in URL', () => {
    render(<ResetPasswordPage />);

    expect(screen.getByRole("heading", { name: /invalid reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/this password reset link is invalid or has expired/i)).toBeInTheDocument();
  });

  it("renders password and confirm password fields when token is present", () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?token=valid-token" },
      writable: true,
    });

    render(<ResetPasswordPage />);

    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
  });

  it("shows error when passwords don't match", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?token=valid-token" },
      writable: true,
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm new password/i), "different456");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows error when password is less than 8 characters", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?token=valid-token" },
      writable: true,
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "short");
    await user.type(screen.getByLabelText(/confirm new password/i), "short");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    // Use getAllByText since the error appears in both the error message and the form description
    const errorElements = await screen.findAllByText(/password must be at least 8 characters/i);
    expect(errorElements[0]).toBeInTheDocument();
  });

  it("calls fetch POST /api/reset-password with token and password", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?token=test-token-123" },
      writable: true,
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/reset-password",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "test-token-123", password: "newpassword123" }),
        })
      );
    });
  });

  it('shows "Password reset!" heading on success', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?token=valid-token" },
      writable: true,
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByRole("heading", { name: /password reset!/i })).toBeInTheDocument();
  });

  it('navigates to /sign-in via "Continue to sign in" button', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?token=valid-token" },
      writable: true,
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    const continueButton = await screen.findByRole("button", { name: /continue to sign in/i });
    await user.click(continueButton);

    expect(mockPush).toHaveBeenCalledWith("/sign-in");
  });

  it("displays API error message on failure", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?token=invalid-token" },
      writable: true,
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Token expired or invalid" }),
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpassword123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/token expired or invalid/i)).toBeInTheDocument();
  });

  it("toggles both password fields independently", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "location", {
      value: { ...window.location, search: "?token=valid-token" },
      writable: true,
    });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    // Both should start as password type
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Get all toggle buttons (there should be 2)
    const toggleButtons = screen.getAllByRole("button", { name: "" });
    expect(toggleButtons).toHaveLength(2);

    // Toggle first password field
    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // Toggle second password field
    await user.click(toggleButtons[1]);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    // Toggle first back
    await user.click(toggleButtons[0]);
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmPasswordInput).toHaveAttribute("type", "text");
  });
});
