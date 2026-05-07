import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import AddProjectMembersStep from "@/components/projects/AddProjectMembersStep";

const mocks = vi.hoisted(() => ({
  bulkAdd: vi.fn(),
  bulkAddPending: false,
  invalidate: vi.fn(),
  members: [] as Array<{
    id: string;
    role: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }>,
  membersLoading: false,
}));

vi.mock("@/trpc/react", () => ({
  api: {
    member: {
      list: {
        useQuery: () => ({
          data: mocks.members,
          isLoading: mocks.membersLoading,
        }),
      },
    },
    projectMember: {
      bulkAdd: {
        useMutation: (opts?: {
          onSuccess?: (data: { added: number }) => void;
          onError?: (error: { message?: string }) => void;
        }) => ({
          mutate: (input: unknown) => {
            mocks.bulkAdd(input);
            opts?.onSuccess?.({ added: 1 });
          },
          isPending: mocks.bulkAddPending,
        }),
      },
    },
    useUtils: () => ({
      projectMember: {
        list: { invalidate: mocks.invalidate },
      },
    }),
  },
}));

vi.mock("@/hooks/useSnackbar", () => ({
  useSnackbar: () => ({ showSnackbar: vi.fn() }),
}));

const baseProps = {
  projectId: "proj-123",
  projectName: "Westside Tower",
  organizationId: "org-456",
  currentUserId: "user-self",
  onComplete: vi.fn(),
  onSkip: vi.fn(),
};

const otherUser = (id: string, name: string, email: string) => ({
  id: `m-${id}`,
  role: "member",
  user: { id, name, email, image: null },
});

describe("AddProjectMembersStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.bulkAdd.mockReset();
    mocks.invalidate.mockReset();
    mocks.bulkAddPending = false;
    mocks.membersLoading = false;
    mocks.members = [
      otherUser("user-self", "Me Self", "me@buildco.com"),
      otherUser("user-jordan", "Jordan Marquez", "jordan@buildco.com"),
      otherUser("user-samira", "Samira Patel", "samira@buildco.com"),
    ];
  });

  it("renders org members and excludes the current user", () => {
    render(<AddProjectMembersStep {...baseProps} />);

    expect(screen.getByText("Jordan Marquez")).toBeInTheDocument();
    expect(screen.getByText("Samira Patel")).toBeInTheDocument();
    expect(screen.queryByText("Me Self")).not.toBeInTheDocument();
  });

  it("shows the project name in the subtitle", () => {
    render(<AddProjectMembersStep {...baseProps} />);
    expect(screen.getByText("Westside Tower")).toBeInTheDocument();
  });

  it("filters the list when typing in search", async () => {
    const user = userEvent.setup();
    render(<AddProjectMembersStep {...baseProps} />);

    const search = screen.getByPlaceholderText(/search teammates/i);
    await user.type(search, "samira");

    expect(screen.getByText("Samira Patel")).toBeInTheDocument();
    expect(screen.queryByText("Jordan Marquez")).not.toBeInTheDocument();
  });

  it("shows an empty state when search has no matches", async () => {
    const user = userEvent.setup();
    render(<AddProjectMembersStep {...baseProps} />);

    await user.type(screen.getByPlaceholderText(/search teammates/i), "zzz");
    expect(screen.getByText(/no teammates match/i)).toBeInTheDocument();
  });

  it("disables Add to project until at least one teammate is selected", async () => {
    const user = userEvent.setup();
    render(<AddProjectMembersStep {...baseProps} />);

    const addButton = screen.getByRole("button", { name: /add to project/i });
    expect(addButton).toBeDisabled();

    await user.click(screen.getByText("Jordan Marquez"));
    expect(addButton).not.toBeDisabled();
  });

  it("calls bulkAdd with selected members defaulting to 'member' role", async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<AddProjectMembersStep {...baseProps} onComplete={onComplete} />);

    await user.click(screen.getByText("Jordan Marquez"));
    await user.click(screen.getByRole("button", { name: /add to project/i }));

    expect(mocks.bulkAdd).toHaveBeenCalledWith({
      projectId: "proj-123",
      members: [{ userId: "user-jordan", role: "member" }],
    });
    expect(onComplete).toHaveBeenCalled();
  });

  it("calls onSkip without firing bulkAdd when Skip is clicked", async () => {
    const onSkip = vi.fn();
    const user = userEvent.setup();
    render(<AddProjectMembersStep {...baseProps} onSkip={onSkip} />);

    await user.click(screen.getByText("Jordan Marquez"));
    await user.click(screen.getByRole("button", { name: /^skip$/i }));

    expect(onSkip).toHaveBeenCalled();
    expect(mocks.bulkAdd).not.toHaveBeenCalled();
  });

  it("shows empty state when there are no other org members", () => {
    mocks.members = [otherUser("user-self", "Me Self", "me@buildco.com")];
    render(<AddProjectMembersStep {...baseProps} />);

    expect(
      screen.getByText(/no other teammates in your organization/i)
    ).toBeInTheDocument();
  });
});
