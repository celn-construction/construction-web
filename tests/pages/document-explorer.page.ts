import type { Locator, Page } from "@playwright/test";

export class DocumentExplorerPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly aiSegment: Locator;
  readonly searchSegment: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/search documents|ask anything/i);
    this.aiSegment = page.getByRole("button", { name: "AI", exact: true });
    this.searchSegment = page.getByRole("button", { name: "Search", exact: true });
    this.heading = page.getByText("Document Explorer");
  }

  async goto(orgSlug: string, projectSlug: string) {
    await this.page.goto(`/${orgSlug}/projects/${projectSlug}/document-explorer`);
  }

  async enableAi() {
    const placeholder = this.page.getByPlaceholder(/ask anything/i);
    if (!(await placeholder.isVisible())) {
      await this.aiSegment.click();
    }
  }

  async disableAi() {
    const placeholder = this.page.getByPlaceholder(/search documents/i);
    if (!(await placeholder.isVisible())) {
      await this.searchSegment.click();
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
