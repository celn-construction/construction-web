import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material";

// Mock dependencies
vi.mock("react-dropzone", () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  })),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} disabled={disabled as boolean} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

vi.mock("@/components/ui/UploadOverlay", () => ({
  default: () => null,
}));

vi.mock("@/components/ui/FileDropzone", () => ({
  default: () => <div data-testid="file-dropzone">Dropzone</div>,
}));

const mockShowSnackbar = vi.fn();
vi.mock("@/hooks/useSnackbar", () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

vi.mock("@/lib/utils/formatting", () => ({
  formatFileSize: (bytes: number) => `${bytes} B`,
}));

import UploadDialog from "@/components/documents/UploadDialog";

const theme = createTheme();

function renderDialog(props: Partial<React.ComponentProps<typeof UploadDialog>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <UploadDialog
        open={true}
        onOpenChange={vi.fn()}
        projectId="proj-1"
        taskId="task-1"
        folderId="photos"
        folderName="Photos"
        onUploadComplete={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );
}

describe("UploadDialog - Describe with AI button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it("does not show 'Describe with AI' button when no file is selected", () => {
    renderDialog();
    expect(screen.queryByText(/describe with ai/i)).not.toBeInTheDocument();
  });

  it("shows 'Describe with AI' button when a file is selected", async () => {
    // We need to simulate a file being selected via the dropzone
    // Since dropzone is mocked, we'll trigger onDrop directly
    const { useDropzone } = await import("react-dropzone");
    const mockUseDropzone = useDropzone as ReturnType<typeof vi.fn>;

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config: { onDrop: (files: File[]) => void }) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    renderDialog();

    // Simulate file drop
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    capturedOnDrop?.([file]);

    await waitFor(() => {
      expect(screen.getByText(/describe with ai/i)).toBeInTheDocument();
    });
  });

  it("calls /api/describe and populates notes on success", async () => {
    const { useDropzone } = await import("react-dropzone");
    const mockUseDropzone = useDropzone as ReturnType<typeof vi.fn>;

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config: { onDrop: (files: File[]) => void }) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ description: "Drywall installation in a residential building." }),
    });

    renderDialog();

    const file = new File(["test"], "drywall.jpg", { type: "image/jpeg" });
    capturedOnDrop?.([file]);

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/describe with ai/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/describe with ai/i));

    await waitFor(() => {
      const notesTextarea = screen.getByPlaceholderText(/add notes/i);
      expect(notesTextarea).toHaveValue("Drywall installation in a residential building.");
    });
  });

  it("shows error snackbar when /api/describe returns an error", async () => {
    const { useDropzone } = await import("react-dropzone");
    const mockUseDropzone = useDropzone as ReturnType<typeof vi.fn>;

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config: { onDrop: (files: File[]) => void }) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "AI description is not configured" }),
    });

    renderDialog();

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    capturedOnDrop?.([file]);

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/describe with ai/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/describe with ai/i));

    await waitFor(() => {
      expect(mockShowSnackbar).toHaveBeenCalledWith("AI description is not configured", "error");
    });
  });

  it("shows 'Generating...' while the request is in progress", async () => {
    const { useDropzone } = await import("react-dropzone");
    const mockUseDropzone = useDropzone as ReturnType<typeof vi.fn>;

    let capturedOnDrop: ((files: File[]) => void) | undefined;
    mockUseDropzone.mockImplementation((config: { onDrop: (files: File[]) => void }) => {
      capturedOnDrop = config.onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    // Never resolve — stays in loading state
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    renderDialog();

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    capturedOnDrop?.([file]);

    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText(/describe with ai/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/describe with ai/i));

    await waitFor(() => {
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });
  });
});
