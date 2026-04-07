import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Bryntum Gantt chart.
 *
 * Bryntum renders its own DOM — standard getByRole selectors don't work
 * inside the grid. This POM encapsulates Bryntum-specific selectors.
 *
 * IMPORTANT: Never use `force: true` on Bryntum elements. Bryntum uses its own
 * internal event routing — forced events bypass it and Bryntum won't respond
 * (editors won't open, menus won't appear). Instead, wait for overlays to
 * fully detach from the DOM before interacting.
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

    // Wait for the loading/error overlay MuiBox elements to be completely
    // removed from the DOM (not just hidden — React unmounts them when
    // isLoading becomes false). These sit inside .bryntum-gantt-container
    // with position:absolute and block all pointer events.
    await this.page
      .locator(".bryntum-gantt-container > .MuiBox-root")
      .first()
      .waitFor({ state: "detached", timeout: 30_000 })
      .catch(() => {
        // No overlay was ever present (fast load) — that's fine
      });

    // Wait for the Bryntum grid body to have rendered at least the grid structure
    await this.page
      .locator(".b-grid-subgrid")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });

    // Let the scheduling engine settle after initial load
    await this.page.waitForTimeout(2_000);
  }

  /** Click the "Add Task" toolbar button and wait for the row to appear. */
  async addTask() {
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

  /**
   * Edit a task's name by clicking the cell and using F2 to start editing.
   * Avoids dblclick which is unreliable with Bryntum in headless CI.
   */
  async editTaskName(rowIndex: number, name: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const nameCell = row.locator(".b-tree-cell");
    await nameCell.waitFor({ state: "visible", timeout: 5_000 });

    // Single-click to select the cell, then F2 to start editing.
    // This is more reliable than dblclick in headless environments.
    await nameCell.click();
    await this.page.waitForTimeout(300);
    await this.page.keyboard.press("F2");

    // Wait for any Bryntum editor input to appear.
    // Bryntum's editor structure varies — use broad selector.
    const editor = this.page.locator(".b-editor input").first();
    await editor.waitFor({ state: "visible", timeout: 10_000 });
    await editor.fill(name);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(500);
  }

  /**
   * Edit a task's duration by clicking the cell and using F2 to start editing.
   */
  async editTaskDuration(rowIndex: number, duration: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const durationCell = row.locator("[data-column='duration']");
    await durationCell.waitFor({ state: "visible", timeout: 5_000 });

    await durationCell.click();
    await this.page.waitForTimeout(300);
    await this.page.keyboard.press("F2");

    const editor = this.page.locator(".b-editor input").first();
    await editor.waitFor({ state: "visible", timeout: 10_000 });
    // Triple-click to select all existing text, then type new value
    await editor.click({ clickCount: 3 });
    await this.page.keyboard.type(duration);
    await this.page.keyboard.press("Enter");
    await this.page.waitForTimeout(1_000);
  }

  /** Click the ⋮ actions menu on a task row and select a menu item. */
  async clickRowAction(rowIndex: number, actionText: string) {
    const row = this.getTaskRows().nth(rowIndex);
    const actionsBtn = row.locator(".gantt-row-actions-btn");
    await actionsBtn.waitFor({ state: "visible", timeout: 5_000 });
    await actionsBtn.click();
    // Wait for Bryntum Menu widget to appear — use broad selector
    const menuItem = this.page
      .locator(".b-menuitem")
      .filter({ hasText: new RegExp(actionText, "i") });
    await menuItem.waitFor({ state: "visible", timeout: 10_000 });
    await menuItem.click();
    await this.page.waitForTimeout(500);
  }

  /** Add a subtask via the ⋮ menu on a task row. */
  async addSubtaskViaMenu(rowIndex: number) {
    await this.clickRowAction(rowIndex, "Add Subtask");
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
    await Promise.race([
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/gantt/sync") && resp.status() === 200,
        { timeout: 15_000 }
      ),
      this.page.waitForTimeout(5_000),
    ]);
    await this.page.waitForTimeout(1_000);
  }
}
