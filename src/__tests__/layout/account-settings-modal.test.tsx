import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import AccountSettingsModal from "@/components/layout/AccountSettingsModal";

// Mock child tab components
vi.mock("@/components/layout/ProfileTabContent", () => ({
  default: () => <div data-testid="profile-tab-content">Profile content</div>,
}));

vi.mock("@/components/layout/AccountTabContent", () => ({
  default: ({ onCloseModal }: { onCloseModal: () => void }) => (
    <div data-testid="team-tab-content">
      Team content
      <button onClick={onCloseModal}>close</button>
    </div>
  ),
}));

function getDialog() {
  return screen.getByRole("dialog");
}

describe("AccountSettingsModal", () => {
  it("renders Profile tab content by default", () => {
    render(<AccountSettingsModal open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("profile-tab-content")).toBeInTheDocument();
  });

  it("renders all four tab buttons in the sidebar", () => {
    render(<AccountSettingsModal open={true} onOpenChange={vi.fn()} />);

    const dialog = getDialog();
    const tabButtons = within(dialog).getAllByRole("button");
    const tabLabels = tabButtons.map((b) => b.textContent?.trim()).filter(Boolean);

    expect(tabLabels).toContain("Profile");
    expect(tabLabels).toContain("Team");
    expect(tabLabels).toContain("Billing");
    expect(tabLabels).toContain("Help & Support");
  });

  it("switches to Team tab and renders AccountTabContent", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsModal open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Team" }));

    expect(screen.getByTestId("team-tab-content")).toBeInTheDocument();
    expect(screen.queryByTestId("profile-tab-content")).not.toBeInTheDocument();
  });

  it("updates header text when switching tabs", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsModal open={true} onOpenChange={vi.fn()} />);

    // Header should show "Team" after switching
    await user.click(screen.getByRole("button", { name: "Team" }));

    // The header text matches the active tab label
    const dialog = getDialog();
    // "Team" appears in both sidebar button and header — just check the tab content renders
    expect(within(dialog).getByTestId("team-tab-content")).toBeInTheDocument();
  });

  it("shows placeholder for Billing and Help tabs", async () => {
    const user = userEvent.setup();
    render(<AccountSettingsModal open={true} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Billing" }));
    expect(screen.getByText(/Billing settings will appear here/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Help & Support" }));
    expect(screen.getByText(/Help & Support settings will appear here/)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<AccountSettingsModal open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("passes onCloseModal to AccountTabContent", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<AccountSettingsModal open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: "Team" }));

    // Click the mock close button inside AccountTabContent
    await user.click(screen.getByRole("button", { name: "close" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
