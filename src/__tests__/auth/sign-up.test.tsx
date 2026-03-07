import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SignUpPage from "@/app/(auth)/sign-up/page";
import { signUp } from "@/lib/auth-client";

// Mock auth client
vi.mock("@/lib/auth-client", () => ({
  signUp: {
    email: vi.fn(),
  },
}));

// Mock @/trpc/react to avoid pulling in server-side env/db imports
const mockValidateCode = vi.fn();
vi.mock("@/trpc/react", () => ({
  api: {
    beta: {
      validateCode: {
        useMutation: () => ({ mutateAsync: mockValidateCode }),
      },
    },
  },
}));

describe("SignUpPage", () => {
  const mockPush = vi.fn();
  const mockSignUpEmail = signUp.email as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateCode.mockResolvedValue({ valid: true });
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
  });

  it("renders form with name, email, password fields and submit button", () => {
    render(<SignUpPage />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/beta access code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("calls signUp.email with name, email, and password on submit", async () => {
    const user = userEvent.setup();
    mockSignUpEmail.mockResolvedValue({ data: { user: { id: "1" } } });

    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.type(screen.getByLabelText(/beta access code/i), "test-code");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
    });
  });

  it("redirects to /onboarding on successful sign-up", async () => {
    const user = userEvent.setup();
    mockSignUpEmail.mockResolvedValue({ data: { user: { id: "1" } } });

    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.type(screen.getByLabelText(/beta access code/i), "test-code");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("redirects to /invite/{token} when invite param is present", async () => {
    const user = userEvent.setup();
    const mockGet = vi.fn((key: string) => {
      if (key === "invite") return "invite-token-456";
      return null;
    });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({ get: mockGet });

    mockSignUpEmail.mockResolvedValue({ data: { user: { id: "1" } } });

    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.type(screen.getByLabelText(/beta access code/i), "test-code");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/invite/invite-token-456");
    });
  });

  it("displays error from result.error.message", async () => {
    const user = userEvent.setup();
    mockSignUpEmail.mockResolvedValue({
      error: { message: "Email already exists" },
    });

    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "existing@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.type(screen.getByLabelText(/beta access code/i), "test-code");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('displays "An unexpected error occurred" when signUp.email throws', async () => {
    const user = userEvent.setup();
    mockSignUpEmail.mockRejectedValue(new Error("Network error"));

    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.type(screen.getByLabelText(/beta access code/i), "test-code");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it("displays error message when beta code is invalid", async () => {
    const user = userEvent.setup();
    const { TRPCClientError } = await import("@trpc/client");
    mockValidateCode.mockRejectedValue(
      new TRPCClientError("Invalid beta access code")
    );

    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.type(screen.getByLabelText(/beta access code/i), "wrong-code");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid beta access code/i)).toBeInTheDocument();
    });
    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it('shows "Creating account..." during loading', async () => {
    const user = userEvent.setup();
    let resolveSignUp: (value: any) => void;
    const signUpPromise = new Promise((resolve) => {
      resolveSignUp = resolve;
    });

    mockSignUpEmail.mockReturnValue(signUpPromise);

    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.type(screen.getByLabelText(/beta access code/i), "test-code");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/creating account\.\.\./i)).toBeInTheDocument();

    resolveSignUp!({ data: { user: { id: "1" } } });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("toggles password visibility when eye icon is clicked", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    // Find the toggle button (it has no accessible name)
    const toggleButton = screen.getByRole("button", { name: "" });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
