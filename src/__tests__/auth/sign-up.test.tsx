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
  authClient: {
    emailOtp: {
      verifyEmail: vi.fn(),
      sendVerificationOtp: vi.fn(),
    },
  },
}));

// Mock @/trpc/react to avoid pulling in server-side env/db imports
const mockValidateCode = vi.fn();
const mockAcceptInvite = vi.fn();
let mockInviteData: { email: string; organization: { name: string } } | undefined =
  undefined;
vi.mock("@/trpc/react", () => ({
  api: {
    beta: {
      validateCode: {
        useMutation: () => ({ mutateAsync: mockValidateCode }),
      },
    },
    invitation: {
      getByToken: {
        useQuery: () => ({ data: mockInviteData, isLoading: false }),
      },
      accept: {
        useMutation: () => ({ mutateAsync: mockAcceptInvite }),
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
    mockAcceptInvite.mockReset();
    mockInviteData = undefined;
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

  it("shows OTP verification step on successful sign-up", async () => {
    const user = userEvent.setup();
    mockSignUpEmail.mockResolvedValue({ data: { user: { id: "1" } } });

    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.type(screen.getByLabelText(/beta access code/i), "test-code");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/we sent a 6-digit code/i)).toBeInTheDocument();
  });

  describe("invited-user flow (?invite=token)", () => {
    const TOKEN = "invite-token-456";
    const INVITE_EMAIL = "invitee@example.com";

    beforeEach(() => {
      const mockGet = vi.fn((key: string) => (key === "invite" ? TOKEN : null));
      (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue({ get: mockGet });
      mockInviteData = {
        email: INVITE_EMAIL,
        organization: { name: "Acme Construction" },
      };
    });

    it("prefills email from the invite and locks the field", () => {
      render(<SignUpPage />);

      const emailField = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailField.value).toBe(INVITE_EMAIL);
      expect(emailField).toHaveAttribute("readonly");
    });

    it("hides the beta access code field for invited users", () => {
      render(<SignUpPage />);

      expect(screen.queryByLabelText(/beta access code/i)).not.toBeInTheDocument();
    });

    it("shows the inviting organization's name in the subheading", () => {
      render(<SignUpPage />);

      expect(screen.getByText(/join acme construction/i)).toBeInTheDocument();
    });

    it("skips OTP, accepts the invite, and redirects to the org", async () => {
      const user = userEvent.setup();
      mockSignUpEmail.mockResolvedValue({ data: { user: { id: "1" } } });
      mockAcceptInvite.mockResolvedValue({
        orgSlug: "acme",
        projectSlug: "office-tower",
      });

      render(<SignUpPage />);

      await user.type(screen.getByLabelText(/full name/i), "Jane Invitee");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockAcceptInvite).toHaveBeenCalledWith({ token: TOKEN });
      });
      expect(mockValidateCode).not.toHaveBeenCalled();
      expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledWith("/acme/projects/office-tower/gantt");
    });

    it("redirects to org root when invite has no project", async () => {
      const user = userEvent.setup();
      mockSignUpEmail.mockResolvedValue({ data: { user: { id: "1" } } });
      mockAcceptInvite.mockResolvedValue({ orgSlug: "acme", projectSlug: null });

      render(<SignUpPage />);

      await user.type(screen.getByLabelText(/full name/i), "Jane Invitee");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/acme");
      });
    });

    it("redirects to the invite page if accept fails after signup", async () => {
      const user = userEvent.setup();
      mockSignUpEmail.mockResolvedValue({ data: { user: { id: "1" } } });
      mockAcceptInvite.mockRejectedValue(new Error("Invitation expired"));

      render(<SignUpPage />);

      await user.type(screen.getByLabelText(/full name/i), "Jane Invitee");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/invite/${TOKEN}`);
      });
    });

    it("does not call invitation.accept if signup fails", async () => {
      const user = userEvent.setup();
      mockSignUpEmail.mockResolvedValue({
        error: { message: "Email already exists" },
      });

      render(<SignUpPage />);

      await user.type(screen.getByLabelText(/full name/i), "Jane Invitee");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
      expect(mockAcceptInvite).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
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
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
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
