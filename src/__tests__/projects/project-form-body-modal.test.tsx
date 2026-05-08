import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ProjectFormBody from "@/components/projects/ProjectFormBody";

// Mock env
vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: undefined,
  },
}));

// Track mutation callbacks
let onMutationSuccess: ((data: any) => void) | undefined;
let onMutationError: ((error: any) => void) | undefined;
const mockMutate = vi.fn();

vi.mock("@/trpc/react", () => ({
  api: {
    project: {
      create: {
        useMutation: vi.fn((opts: any) => {
          onMutationSuccess = opts?.onSuccess;
          onMutationError = opts?.onError;
          return { mutate: mockMutate, isPending: false };
        }),
      },
    },
    weather: {
      getByLocation: {
        useQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
      },
    },
    useUtils: vi.fn(() => ({
      project: {
        list: { invalidate: vi.fn() },
        getActive: { invalidate: vi.fn() },
      },
    })),
  },
}));

vi.mock("@/hooks/useSnackbar", () => ({
  useSnackbar: () => ({ showSnackbar: vi.fn() }),
}));

vi.mock("@/components/providers/LoadingProvider", () => ({
  useLoading: () => ({ showLoading: vi.fn(), hideLoading: vi.fn() }),
}));

vi.mock("@/lib/constants/projectIconComponents", () => ({
  PROJECT_ICON_OPTIONS: [{ id: "building", label: "Building", Icon: () => <span>icon</span> }],
  getProjectIcon: () => () => <span>icon</span>,
}));

vi.mock("@/components/ui/ProjectAvatar", () => ({
  default: () => <span data-testid="project-avatar" />,
}));

vi.mock("use-places-autocomplete", () => ({
  default: () => ({
    ready: false,
    suggestions: { data: [] },
    setValue: vi.fn(),
    clearSuggestions: vi.fn(),
  }),
  getGeocode: vi.fn(),
}));

describe("ProjectFormBody — modal vs standalone behavior", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      refresh: vi.fn(),
    });
  });

  it("calls onSuccess with the created project and does NOT navigate in modal mode", async () => {
    const onSuccess = vi.fn();
    render(
      <ProjectFormBody
        orgSlug="test-org"
        organizationId="org-123"
        title="New Project"
        subtitle="Test"
        onCancel={vi.fn()}
        onSuccess={onSuccess}
      />
    );

    const mockProject = { id: "proj-123", name: "My Project", slug: "my-project" };
    onMutationSuccess?.(mockProject);

    expect(onSuccess).toHaveBeenCalledWith({
      id: "proj-123",
      slug: "my-project",
      name: "My Project",
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("navigates to project URL when in standalone mode (no onSuccess)", () => {
    render(
      <ProjectFormBody
        orgSlug="test-org"
        organizationId="org-123"
        title="New Project"
        subtitle="Test"
      />
    );

    const mockProject = { id: "proj-123", name: "My Project", slug: "my-project" };
    onMutationSuccess?.(mockProject);

    expect(mockPush).toHaveBeenCalledWith("/test-org/projects/my-project/gantt");
  });

  it("uses router.replace when replaceOnNavigate is true in standalone mode", () => {
    render(
      <ProjectFormBody
        orgSlug="test-org"
        organizationId="org-123"
        title="New Project"
        subtitle="Test"
        replaceOnNavigate
      />
    );

    const mockProject = { id: "proj-123", name: "My Project", slug: "my-project" };
    onMutationSuccess?.(mockProject);

    expect(mockReplace).toHaveBeenCalledWith("/test-org/projects/my-project/gantt");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders the form with project name and location fields", () => {
    render(
      <ProjectFormBody
        orgSlug="test-org"
        organizationId="org-123"
        title="New Project"
        subtitle="Set up a new construction project"
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByText("Set up a new construction project")).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^location$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create project/i })).toBeInTheDocument();
  });

  it("shows cancel button only when onCancel is provided", () => {
    const { rerender } = render(
      <ProjectFormBody
        orgSlug="test-org"
        organizationId="org-123"
        title="New Project"
        subtitle="Test"
        onCancel={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

    rerender(
      <ProjectFormBody
        orgSlug="test-org"
        organizationId="org-123"
        title="New Project"
        subtitle="Test"
      />
    );

    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
  });
});
