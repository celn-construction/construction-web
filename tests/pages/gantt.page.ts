import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Bryntum Gantt chart.
 *
 * Bryntum renders its own DOM — standard getByRole selectors don't work
 * inside the grid. This POM encapsulates Bryntum-specific selectors.
 */
export class GanttPage {
  readonly page: Page;
  readonly ganttContainer: Locator;
  readonly addTaskButton: Locator;
  readonly loadingOverlay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ganttContainer = page.locator(".b-gantt");
    this.addTaskButton = page.getByRole("button", { name: /Add Task/i });
    this.loadingOverlay = page.locator(
      ".bryntum-gantt-container > div:has(> [class*='MuiCircularProgress'])"
    );
  }

  async goto(orgSlug: string, projectSlug: string) {
    await this.page.goto(`/${orgSlug}/projects/${projectSlug}/gantt`);
    await this.waitForLoad();
  }

  /** Wait for Gantt to fully render (loading overlay gone + grid visible). */
  async waitForLoad() {
    // Wait for Bryntum grid to appear
    await this.ganttContainer.waitFor({ state: "visible", timeout: 30_000 });
    // Wait for loading overlay to disappear
    await this.loadingOverlay.waitFor({ state: "hidden", timeout: 30_000 });
    // Let the scheduling engine settle
    await this.page.waitForTimeout(500);
  }

  /** Click the "Add Task" toolbar button. */
  async addTask() {
    await this.addTaskButton.click();
    await this.page.waitForTimeout(500);
  }

  /** Get all visible task rows (excludes the Bryntum root/project row). */
  getTaskRows(): Locator {
    return this.page.locator(
      ".b-grid-row:not(.b-grid-group-row):not([data-id='_bryntum_internal_root'])"
    );
  }

  /** Get the text content of a task's name cell by row index. */
  async getTaskName(rowIndex: number): Promise<string> {
    const row = this.getTaskRows().nth(rowIndex);
    const nameCell = row.locator(".b-tree-cell .gantt-name-text");
    return (await nameCell.textContent()) ?? "";
  }

  /** Get the text content of a task's duration cell by row index. */
  async getTaskDuration(rowIndex: number): Promise<string> {
    const row = this.getTaskRows().nth(rowIndex);
    const durationCell = row.locator(".b-duration-cell");
    return ((await durationCell.textContent()) ?? "").trim();
  }

  /** Double-click a task's name cell to start inline editing, type, and confirm. */
  async editTaskName(rowIndex: number, name: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const nameCell = row.locator(".b-tree-cell");
    await nameCell.dblclick();
    // Wait for Bryntum's inline editor
    const editor = this.page.locator("input.b-textfield-input").first();
    await editor.waitFor({ state: "visible", timeout: 5_000 });
    await editor.fill(name);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(300);
  }

  /** Double-click a task's duration cell to edit it, type, and confirm. */
  async editTaskDuration(rowIndex: number, duration: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const durationCell = row.locator(".b-duration-cell");
    await durationCell.dblclick();
    const editor = this.page.locator(".b-durationfield input").first();
    await editor.waitFor({ state: "visible", timeout: 5_000 });
    await editor.fill(duration);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(500);
  }

  /** Click the ⋮ actions menu on a task row and select a menu item. */
  async clickRowAction(rowIndex: number, actionText: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const actionsBtn = row.locator(".gantt-row-actions-btn");
    await actionsBtn.click();
    // Wait for Bryntum menu to appear
    const menuItem = this.page
      .locator(".b-menuitem")
      .filter({ hasText: new RegExp(actionText, "i") });
    await menuItem.waitFor({ state: "visible", timeout: 5_000 });
    await menuItem.click();
    await this.page.waitForTimeout(300);
  }

  /** Add a subtask via the ⋮ menu on a task row. */
  async addSubtaskViaMenu(rowIndex: number) {
    await this.clickRowAction(rowIndex, "Add Subtask");
    await this.page.waitForTimeout(500);
  }

  /** Delete a task via the ⋮ menu. */
  async deleteTaskViaMenu(rowIndex: number) {
    await this.clickRowAction(rowIndex, "Delete");
    await this.page.waitForTimeout(500);
  }

  /** Get the number of visible task rows. */
  async getTaskCount(): Promise<number> {
    return this.getTaskRows().count();
  }

  /** Wait for Bryntum auto-sync to complete (watches network). */
  async waitForSync() {
    // Wait for the sync POST to complete
    await Promise.race([
      this.page.waitForResponse(
        (resp) => resp.url().includes("/api/gantt/sync") && resp.status() === 200,
        { timeout: 10_000 }
      ),
      this.page.waitForTimeout(3_000),
    ]);
    // Extra buffer for the response to be applied
    await this.page.waitForTimeout(500);
  }
}
