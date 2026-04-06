import type { Locator, Page } from "@playwright/test";

export class DocumentExplorerPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly aiToggle: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/search documents|ask ai/i);
    this.aiToggle = page.getByRole("button", { name: /ai search/i });
    this.heading = page.getByText("Document Explorer");
  }

  async goto(orgSlug: string, projectSlug: string) {
    await this.page.goto(`/${orgSlug}/projects/${projectSlug}/document-explorer`);
  }

  async enableAi() {
    // Click the AI toggle button if not already enabled
    const placeholder = this.page.getByPlaceholder(/ask ai/i);
    if (!(await placeholder.isVisible())) {
      await this.aiToggle.click();
    }
  }

  async disableAi() {
    const placeholder = this.page.getByPlaceholder(/search documents/i);
    if (!(await placeholder.isVisible())) {
      await this.aiToggle.click();
    }
  }

  async searchAi(query: string) {
    await this.enableAi();
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }

  async searchFuzzy(query: string) {
    await this.disableAi();
    await this.searchInput.fill(query);
    // Fuzzy search is debounced, no Enter needed
  }
}
