import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SignInPage from "@/app/(auth)/sign-in/page";
import { signIn } from "@/lib/auth-client";

// Mock auth client
vi.mock("@/lib/auth-client", () => ({
  signIn: {
    email: vi.fn(),
  },
}));

describe("SignInPage", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockSignInEmail = signIn.email as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
  });

  it("renders sign-in form with email, password fields, and submit button", () => {
    render(<SignInPage />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders "Welcome back" heading', () => {
    render(<SignInPage />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("calls signIn.email with email and password on submit", async () => {
    const user = userEvent.setup();
    mockSignInEmail.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions?.onSuccess?.();
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          password: "password123",
        })
      );
    });
  });

  it("redirects to /dashboard on successful sign-in", async () => {
    const user = userEvent.setup();
    mockSignInEmail.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions?.onSuccess?.();
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("redirects to callbackUrl when provided via search params", async () => {
    const user = userEvent.setup();
    const mockGet = vi.fn((key: string) => {
      if (key === "callbackUrl") return "/projects";
      return null;
    });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({ get: mockGet });

    mockSignInEmail.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions?.onSuccess?.();
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/projects");
    });
  });

  it("redirects to /invite/{token} when invite param is present", async () => {
    const user = userEvent.setup();
    const mockGet = vi.fn((key: string) => {
      if (key === "invite") return "test-token-123";
      return null;
    });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({ get: mockGet });

    mockSignInEmail.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions?.onSuccess?.();
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/invite/test-token-123");
    });
  });

  it("displays error message on sign-in failure", async () => {
    const user = userEvent.setup();
    mockSignInEmail.mockImplementation(async ({ fetchOptions }) => {
      fetchOptions?.onError?.({ error: { message: "Invalid credentials" } });
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('displays "An unexpected error occurred" when signIn.email throws', async () => {
    const user = userEvent.setup();
    mockSignInEmail.mockRejectedValue(new Error("Network error"));

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it("toggles password visibility when eye icon is clicked", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: "" });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows loading state while submitting", async () => {
    const user = userEvent.setup();
    let resolveSignIn: () => void;
    const signInPromise = new Promise<void>((resolve) => {
      resolveSignIn = resolve;
    });

    mockSignInEmail.mockImplementation(async ({ fetchOptions }) => {
      await signInPromise;
      fetchOptions?.onSuccess?.();
    });

    render(<SignInPage />);

    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Button should be disabled during loading
    const button = screen.getByRole("button", { name: /sign in/i });
    expect(button).toBeDisabled();

    resolveSignIn!();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });
});
