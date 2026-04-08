import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@mui/material/styles";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AccountTabContent from "@/components/layout/AccountTabContent";
import { lightTheme } from "@/theme/theme";

const mockUseQuery = vi.fn();

// Mock tRPC
vi.mock("@/trpc/react", () => ({
  api: {
    organization: {
      list: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}));

// Mock formatting util
vi.mock("@/lib/utils/formatting", () => ({
  formatRole: (role: string) => role.charAt(0).toUpperCase() + role.slice(1),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);
}

describe("AccountTabContent", () => {
  const mockPush = vi.fn();
  const mockOnCloseModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      refresh: vi.fn(),
    });
    mockUseQuery.mockReturnValue({
      data: [
        { id: "org-1", name: "Acme Construction", slug: "acme", role: "owner" },
        { id: "org-2", name: "Beta Builders", slug: "beta", role: "member" },
      ],
      isLoading: false,
    });
  });

  it("renders 'Your Teams' heading", () => {
    renderWithTheme(<AccountTabContent onCloseModal={mockOnCloseModal} />);

    expect(screen.getByText("Your Teams")).toBeInTheDocument();
    expect(screen.getByText("Teams you belong to across all organizations.")).toBeInTheDocument();
  });

  it("renders all organizations with names and roles", () => {
    renderWithTheme(<AccountTabContent onCloseModal={mockOnCloseModal} />);

    expect(screen.getByText("Acme Construction")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Beta Builders")).toBeInTheDocument();
    expect(screen.getByText("Member")).toBeInTheDocument();
  });

  it("renders Create New Team button", () => {
    renderWithTheme(<AccountTabContent onCloseModal={mockOnCloseModal} />);

    expect(screen.getByText("Create New Team")).toBeInTheDocument();
    expect(screen.getByText("Set up a new construction company")).toBeInTheDocument();
  });

  it("navigates to /onboarding?new=true and closes modal on Create New Team click", async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountTabContent onCloseModal={mockOnCloseModal} />);

    await user.click(screen.getByText("Create New Team"));

    expect(mockOnCloseModal).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/onboarding?new=true");
  });

  it("shows loading spinner when data is loading", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: true,
    });

    renderWithTheme(<AccountTabContent onCloseModal={mockOnCloseModal} />);

    expect(screen.queryByText("Your Teams")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
