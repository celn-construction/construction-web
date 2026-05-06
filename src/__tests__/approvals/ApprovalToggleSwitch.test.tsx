import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ApprovalToggleSwitch from "@/components/bryntum/components/task-popover/ApprovalToggleSwitch";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn(),
  isPending: false,
}));

vi.mock("@/trpc/react", () => ({
  api: {
    approval: {
      setStatus: {
        useMutation: () => ({
          mutate: mocks.mutate,
          isPending: mocks.isPending,
        }),
      },
      listAll: { invalidate: mocks.invalidate },
      summary: { invalidate: mocks.invalidate },
    },
    document: {
      search: { invalidate: mocks.invalidate },
      aiSearch: { invalidate: mocks.invalidate },
      listByFolder: { invalidate: mocks.invalidate },
      listByTask: { invalidate: mocks.invalidate },
    },
    useUtils: () => ({
      approval: {
        listAll: { invalidate: mocks.invalidate },
        summary: { invalidate: mocks.invalidate },
      },
      document: {
        search: { invalidate: mocks.invalidate },
        aiSearch: { invalidate: mocks.invalidate },
        listByFolder: { invalidate: mocks.invalidate },
        listByTask: { invalidate: mocks.invalidate },
      },
    }),
  },
}));

const baseProps = {
  documentId: "doc-1",
  documentName: "submittal-spec.pdf",
  organizationId: "org-1",
};

describe("ApprovalToggleSwitch (admin)", () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.invalidate.mockReset();
    mocks.isPending = false;
  });

  it("renders an interactive switch when the user can approve", () => {
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="unapproved"
        memberRole="admin"
      />,
    );

    const sw = screen.getByRole("switch");
    expect(sw).toBeInTheDocument();
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("opens the confirm popover when an unapproved switch is clicked, and does not fire the mutation yet", async () => {
    const user = userEvent.setup();
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="unapproved"
        memberRole="admin"
      />,
    );

    await user.click(screen.getByRole("switch"));

    // No mutation yet — waiting on confirmation
    expect(mocks.mutate).not.toHaveBeenCalled();
    // Confirm popover appears
    expect(screen.getByText("Approve this submittal?")).toBeInTheDocument();
    expect(screen.getByText("submittal-spec.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("fires setStatus with approved=true after the user confirms", async () => {
    const user = userEvent.setup();
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="unapproved"
        memberRole="admin"
      />,
    );

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.mutate).toHaveBeenCalledWith({
      documentId: "doc-1",
      organizationId: "org-1",
      approved: true,
    });
  });

  it("does not fire setStatus when the user cancels the confirm", async () => {
    const user = userEvent.setup();
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="unapproved"
        memberRole="admin"
      />,
    );

    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it("flips an approved doc to unapproved with one click — no confirm", async () => {
    const user = userEvent.setup();
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="approved"
        memberRole="admin"
      />,
    );

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("switch"));

    // No confirm popover for un-approve — straight to mutation
    expect(screen.queryByText("Approve this submittal?")).not.toBeInTheDocument();
    expect(mocks.mutate).toHaveBeenCalledWith({
      documentId: "doc-1",
      organizationId: "org-1",
      approved: false,
    });
  });

  it("does not fire the mutation while a request is pending", async () => {
    mocks.isPending = true;
    const user = userEvent.setup();
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="approved"
        memberRole="admin"
      />,
    );

    await user.click(screen.getByRole("switch"));
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});

describe("ApprovalToggleSwitch (employee)", () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.isPending = false;
  });

  it("renders a read-only badge instead of a switch", () => {
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="unapproved"
        memberRole="member"
      />,
    );

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it('shows "Approved" when approved', () => {
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="approved"
        approvedBy={{ id: "u-1", name: "Mark Diaz" }}
        memberRole="viewer"
      />,
    );

    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("does not fire the mutation when an employee clicks the badge", async () => {
    const user = userEvent.setup();
    render(
      <ApprovalToggleSwitch
        {...baseProps}
        approvalStatus="unapproved"
        memberRole="member"
      />,
    );

    await user.click(screen.getByText("Pending"));
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
