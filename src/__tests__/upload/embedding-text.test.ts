// @vitest-environment node
import { describe, it, expect } from "vitest";

/**
 * These tests verify the embedding text construction logic used in the upload route.
 * The logic is inlined in src/app/api/upload/route.ts — we replicate it here
 * to test the text composition and extension extraction independently.
 */

function cleanFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[\s_\-]+/g, " ");
}

function extractExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.slice(lastDot + 1).toUpperCase() : "";
}

function buildEmbeddingText(
  filename: string,
  description: string,
  tags: string[]
): string {
  const cleanName = cleanFilename(filename);
  const ext = extractExtension(filename);
  const parts = [
    cleanName,
    description,
    `Tags: ${tags.join(", ")}`,
    `File type: ${ext}`,
  ];
  return parts.join(". ");
}

describe("extractExtension", () => {
  it("extracts extension from a simple filename", () => {
    expect(extractExtension("report.pdf")).toBe("PDF");
  });

  it("extracts extension from a multi-dot filename", () => {
    expect(extractExtension("report.v2.final.pdf")).toBe("PDF");
  });

  it("handles image extensions", () => {
    expect(extractExtension("photo.jpg")).toBe("JPG");
    expect(extractExtension("image.png")).toBe("PNG");
    expect(extractExtension("scan.webp")).toBe("WEBP");
  });

  it("returns empty string for extensionless files", () => {
    expect(extractExtension("Dockerfile")).toBe("");
  });

  it("returns empty string for dot-prefixed hidden files", () => {
    expect(extractExtension(".gitignore")).toBe("");
  });

  it("returns empty string for trailing dot", () => {
    expect(extractExtension("file.")).toBe("");
  });
});

describe("cleanFilename", () => {
  it("removes file extension", () => {
    expect(cleanFilename("report.pdf")).toBe("report");
  });

  it("normalizes underscores to spaces", () => {
    expect(cleanFilename("foundation_inspection.pdf")).toBe(
      "foundation inspection"
    );
  });

  it("normalizes hyphens to spaces", () => {
    expect(cleanFilename("site-photos.jpg")).toBe("site photos");
  });

  it("normalizes multiple separators", () => {
    expect(cleanFilename("RFI__2024--003.pdf")).toBe("RFI 2024 003");
  });
});

describe("buildEmbeddingText", () => {
  it("includes all components in the embedding text", () => {
    const result = buildEmbeddingText(
      "foundation-report.pdf",
      "Structural assessment of concrete footings",
      ["foundation", "concrete"]
    );
    expect(result).toBe(
      "foundation report. Structural assessment of concrete footings. Tags: foundation, concrete. File type: PDF"
    );
  });

  it("includes file type for images", () => {
    const result = buildEmbeddingText(
      "site_photo.jpg",
      "Drywall installation in progress",
      ["drywall", "interior"]
    );
    expect(result).toContain("File type: JPG");
  });

  it("handles extensionless files with empty file type", () => {
    const result = buildEmbeddingText(
      "Dockerfile",
      "Build configuration",
      ["config"]
    );
    expect(result).toContain("File type: ");
    expect(result).not.toContain("File type: DOCKERFILE");
  });

  it("handles empty tags", () => {
    const result = buildEmbeddingText("report.pdf", "A description", []);
    expect(result).toContain("Tags: ");
  });
});
