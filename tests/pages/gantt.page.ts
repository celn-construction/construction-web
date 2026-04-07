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

  constructor(page: Page) {
    this.page = page;
    this.ganttContainer = page.locator(".b-gantt");
    this.addTaskButton = page.getByRole("button", { name: /Add Task/i });
  }

  async goto(orgSlug: string, projectSlug: string) {
    await this.page.goto(`/${orgSlug}/projects/${projectSlug}/gantt`);
    await this.waitForLoad();
  }

  /** Wait for Gantt to fully render — grid visible, no overlays blocking interaction. */
  async waitForLoad() {
    // Wait for Bryntum grid to appear
    await this.ganttContainer.waitFor({ state: "visible", timeout: 30_000 });
    // Wait for ALL MUI overlay boxes inside the gantt container to disappear.
    // These are the loading spinner and error overlays that sit on top with position:absolute.
    await this.page
      .locator(".bryntum-gantt-container > div.MuiBox-root")
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {
        // No overlay present — that's fine
      });
    // Wait for the Bryntum grid body to have rendered rows
    await this.page
      .locator(".b-grid-subgrid .b-grid-row")
      .first()
      .waitFor({ state: "attached", timeout: 10_000 })
      .catch(() => {
        // Empty project — no rows expected
      });
    // Let the scheduling engine settle
    await this.page.waitForTimeout(1_000);
  }

  /** Click the "Add Task" toolbar button and wait for the row to appear. */
  async addTask() {
    const countBefore = await this.getTaskCount();
    await this.addTaskButton.click();
    // Wait for a new task row to actually appear in the DOM
    await this.page
      .locator(".b-grid-row .b-tree-cell")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    // Extra time for the scheduling engine to calculate dates
    await this.page.waitForTimeout(1_000);
  }

  /** Get all visible task rows (excludes the Bryntum virtual root row). */
  getTaskRows(): Locator {
    // Bryntum uses data-id on rows. The internal root has a special _generated id.
    // Task rows have .b-tree-cell (name column rendered by TreeColumn).
    return this.page.locator(".b-grid-row:has(.b-tree-cell)");
  }

  /** Get the text content of a task's name cell by row index. */
  async getTaskName(rowIndex: number): Promise<string> {
    const row = this.getTaskRows().nth(rowIndex);
    const nameCell = row.locator(".b-tree-cell .gantt-name-text");
    await nameCell.waitFor({ state: "visible", timeout: 5_000 });
    return (await nameCell.textContent()) ?? "";
  }

  /** Get the text content of a task's duration cell by row index. */
  async getTaskDuration(rowIndex: number): Promise<string> {
    const row = this.getTaskRows().nth(rowIndex);
    const durationCell = row.locator("[data-column='duration']");
    await durationCell.waitFor({ state: "visible", timeout: 5_000 });
    return ((await durationCell.textContent()) ?? "").trim();
  }

  /** Double-click a task's name cell to start inline editing, type, and confirm. */
  async editTaskName(rowIndex: number, name: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const nameCell = row.locator(".b-tree-cell");
    // Use force:true to bypass any overlay that might still be fading out
    await nameCell.dblclick({ force: true });
    // Bryntum's inline editor: it creates a floating editor widget.
    // The input could be .b-textfield input, .b-editor input, or similar.
    const editor = this.page.locator(".b-editor .b-textfield input").first();
    await editor.waitFor({ state: "visible", timeout: 10_000 });
    await editor.fill(name);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(500);
  }

  /** Double-click a task's duration cell to edit it, type, and confirm. */
  async editTaskDuration(rowIndex: number, duration: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const durationCell = row.locator("[data-column='duration']");
    await durationCell.dblclick({ force: true });
    // Bryntum duration editor uses a DurationField widget
    const editor = this.page.locator(".b-editor .b-durationfield input").first();
    await editor.waitFor({ state: "visible", timeout: 10_000 });
    // Select all existing text and replace
    await editor.click({ clickCount: 3 });
    await editor.fill(duration);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(1_000);
  }

  /** Click the ⋮ actions menu on a task row and select a menu item. */
  async clickRowAction(rowIndex: number, actionText: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const actionsBtn = row.locator(".gantt-row-actions-btn");
    await actionsBtn.waitFor({ state: "visible", timeout: 5_000 });
    await actionsBtn.click({ force: true });
    // Wait for Bryntum Menu widget to appear
    const menuItem = this.page
      .locator(".b-menu .b-menuitem")
      .filter({ hasText: new RegExp(actionText, "i") });
    await menuItem.waitFor({ state: "visible", timeout: 10_000 });
    await menuItem.click();
    await this.page.waitForTimeout(500);
  }

  /** Add a subtask via the ⋮ menu on a task row. */
  async addSubtaskViaMenu(rowIndex: number) {
    await this.clickRowAction(rowIndex, "Add Subtask");
    // Wait for the new subtask row to appear
    await this.page.waitForTimeout(1_000);
  }

  /** Delete a task via the ⋮ menu. */
  async deleteTaskViaMenu(rowIndex: number) {
    await this.clickRowAction(rowIndex, "Delete");
    await this.page.waitForTimeout(1_000);
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
        (resp) =>
          resp.url().includes("/api/gantt/sync") && resp.status() === 200,
        { timeout: 15_000 }
      ),
      this.page.waitForTimeout(5_000),
    ]);
    // Extra buffer for the response to be applied
    await this.page.waitForTimeout(1_000);
  }
}
