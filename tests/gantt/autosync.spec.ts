// Gantt autoSync contract test.
//
// Pins the Bryntum sync protocol that broke in commit 4ef914f's wake:
// every added task with a $PhantomId must come back in tasks.rows with a
// real id. Without this round-trip Bryntum's afterSyncAttempt crashes
// ("Cannot set properties of undefined") and the task silently fails to
// persist (or gets resent and duplicated on the next sync cycle).
//
// We assert on the HTTP response rather than DOM state because:
//   1. Bryntum renders into a virtualized grid with a trial watermark —
//      visual assertions race the render and flake.
//   2. The actual bug is a protocol-shape bug; testing the protocol is
//      more direct than testing the visual effect.

import { test, expect, signInTestUser } from "../fixtures";

interface SyncResponseRow {
  $PhantomId?: string;
  id?: string;
}

interface SyncResponseBody {
  success: boolean;
  tasks?: { rows?: SyncResponseRow[] };
  message?: string;
}

test.describe("Gantt autoSync", () => {
  test("clicking Add Task triggers a sync that returns a $PhantomId → real id mapping", async ({
    page,
    userWithProject,
  }) => {
    // The Gantt route lazy-loads a large Bryntum bundle. In CI the app is served
    // by `next dev`, which compiles the route on first request; on a cold runner
    // that compile can exceed the default 15s action / 30s test timeouts, leaving
    // the toolbar in the DOM but not yet painted or interactive (the source of
    // this test's historical flakiness). Give the cold compile room.
    test.setTimeout(90_000);

    const { user, organization, project } = userWithProject;

    await signInTestUser(page, user.email, user.password);

    // Navigate to the Gantt page and wait for the initial load HTTP roundtrip.
    // Note: a 200 here only means the data arrived — it does NOT mean Bryntum
    // has finished compiling/painting, so we gate the first click below on the
    // toolbar actually being visible.
    const loadResponsePromise = page.waitForResponse(
      (r) => r.url().includes("/api/gantt/load") && r.status() === 200,
    );
    await page.goto(`/${organization.slug}/projects/${project.slug}/gantt`);
    await loadResponsePromise;

    // Unlock editing — Add Task is hidden while the chart is locked.
    // The toolbar shows "Edit chart" when locked, "Lock chart" when unlocked
    // (see GanttToolbar.tsx:527). Wait for the button to actually render before
    // clicking — the HTTP load above can resolve before the toolbar has painted.
    const editChartButton = page.getByRole("button", { name: "Edit chart" });
    await expect(editChartButton).toBeVisible({ timeout: 60_000 });
    await editChartButton.click();

    // Set up the sync response interception BEFORE the click so we don't race
    // Bryntum's 500ms autoSync debounce.
    const syncResponsePromise = page.waitForResponse(
      (r) => r.url().includes("/api/gantt/sync") && r.status() === 200,
      { timeout: 10_000 },
    );

    await page.getByRole("button", { name: "Add task" }).click();

    const syncResponse = await syncResponsePromise;
    const body = (await syncResponse.json()) as SyncResponseBody;

    // Server-level success
    expect(body.success, body.message ?? "expected success:true").toBe(true);

    // The contract that broke: every added task must be echoed in tasks.rows
    // with both $PhantomId and a real (non-phantom) id.
    expect(body.tasks?.rows ?? []).not.toHaveLength(0);
    const rows = body.tasks!.rows!;

    for (const row of rows) {
      expect(row.$PhantomId, "row missing $PhantomId — Bryntum can't materialize this on the client").toBeTruthy();
      expect(row.id, "row missing real id — server didn't persist or didn't return it").toBeTruthy();
      expect(
        row.id,
        "real id equals phantom id — phantom→real swap didn't happen on the server",
      ).not.toBe(row.$PhantomId);
    }
  });
});
