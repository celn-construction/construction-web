import { describe, it, expect } from "vitest";
import {
  isApprovableFolder,
  expandFolderIds,
  APPROVABLE_FOLDER_ID_LIST,
} from "@/lib/folders";

describe("isApprovableFolder", () => {
  it("returns true for the submittals top-level folder", () => {
    expect(isApprovableFolder("submittals")).toBe(true);
  });

  it("returns true for submittals subfolders", () => {
    expect(isApprovableFolder("submittals-product")).toBe(true);
    expect(isApprovableFolder("submittals-shop")).toBe(true);
    expect(isApprovableFolder("submittals-certs")).toBe(true);
  });

  it("returns true for the inspections top-level folder", () => {
    expect(isApprovableFolder("inspections")).toBe(true);
  });

  it("returns true for inspections subfolders", () => {
    expect(isApprovableFolder("inspections-structural")).toBe(true);
    expect(isApprovableFolder("inspections-mep")).toBe(true);
    expect(isApprovableFolder("inspections-safety")).toBe(true);
  });

  it("returns false for non-approvable folders", () => {
    expect(isApprovableFolder("rfi")).toBe(false);
    expect(isApprovableFolder("change-orders")).toBe(false);
    expect(isApprovableFolder("photos")).toBe(false);
  });

  it("returns false for unknown folder ids", () => {
    expect(isApprovableFolder("not-a-folder")).toBe(false);
    expect(isApprovableFolder("")).toBe(false);
  });
});

describe("APPROVABLE_FOLDER_ID_LIST", () => {
  it("contains submittals + inspections + their children", () => {
    expect(new Set(APPROVABLE_FOLDER_ID_LIST)).toEqual(
      new Set([
        ...expandFolderIds("submittals"),
        ...expandFolderIds("inspections"),
      ]),
    );
  });

  it("does not include rfi/change-orders/photos", () => {
    expect(APPROVABLE_FOLDER_ID_LIST).not.toContain("rfi");
    expect(APPROVABLE_FOLDER_ID_LIST).not.toContain("change-orders");
    expect(APPROVABLE_FOLDER_ID_LIST).not.toContain("photos");
  });
});
