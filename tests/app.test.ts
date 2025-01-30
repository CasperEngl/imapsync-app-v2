import { expect, test, type Page } from "@playwright/test";
import { STORAGE_KEY } from "../src/renderer/store.js";

interface AddTransferParams {
  sourceHost: string;
  sourceUser: string;
  sourcePass: string;
  destHost: string;
  destUser: string;
  destPass: string;
}

async function addTransfer(page: Page, params: AddTransferParams) {
  // Fill source details
  await page.getByRole("combobox").first().click();
  await page
    .getByPlaceholder("Search hosts...")
    .first()
    .fill(params.sourceHost);
  await page.getByPlaceholder("Username").first().fill(params.sourceUser);
  await page.getByPlaceholder("Password").first().fill(params.sourcePass);

  // Fill destination details
  await page.getByRole("combobox").nth(1).click();
  await page.getByPlaceholder("Search hosts...").nth(1).fill(params.destHost);
  await page.getByPlaceholder("Username").nth(1).fill(params.destUser);
  await page.getByPlaceholder("Password").nth(1).fill(params.destPass);

  // Add transfer
  await page.getByRole("button", { name: "Add Transfer" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");

  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        transfers: [],
        settings: {
          showTransferIds: true,
          replaceAllOnImport: true,
        },
      })
    );
  }, STORAGE_KEY);
});

test("should display the main app title", async ({ page }) => {
  await expect(
    page.getByRole("heading", {
      name: "imapsync App",
    })
  ).toBeVisible();
});

test("should add a new transfer", async ({ page }) => {
  await addTransfer(page, {
    sourceHost: "source.example.com",
    sourceUser: "sourceuser",
    sourcePass: "sourcepass",
    destHost: "dest.example.com",
    destUser: "destuser",
    destPass: "destpass",
  });

  // Verify transfer was added
  await expect(page.getByRole("combobox", { name: "Source Host" })).toHaveText(
    "source.example.com"
  );
  await expect(
    page.getByRole("textbox", { name: "Source Username" })
  ).toHaveValue("sourceuser");
  await expect(
    page.getByRole("textbox", { name: "Source Password" })
  ).toHaveValue("sourcepass");
  await expect(
    page.getByRole("combobox", { name: "Destination Host" })
  ).toHaveText("dest.example.com");
});

test("should handle transfer lifecycle with IPC events", async ({ page }) => {
  await addTransfer(page, {
    sourceHost: "source.example.com",
    sourceUser: "sourceuser",
    sourcePass: "sourcepass",
    destHost: "dest.example.com",
    destUser: "destuser",
    destPass: "destpass",
  });

  // Start the transfer using the UI button
  await page.getByRole("button", { name: "Start" }).first().click();

  // Wait for the syncing status to appear
  await expect(page.getByText("Starting transfer...")).toBeVisible();

  await expect(page.getByText("Syncing messages...")).toBeVisible();
  await expect(page.getByText("50%")).toBeVisible();

  await expect(page.getByText("completed")).toBeVisible();
});

test("should handle transfer errors through IPC", async ({ page }) => {
  await addTransfer(page, {
    sourceHost: "source.example.com",
    sourceUser: "sourceuser",
    sourcePass: "sourcepass",
    destHost: "dest.example.com",
    destUser: "destuser",
    destPass: "destpass",
  });

  // Start the transfer using the UI button
  await page.getByRole("button", { name: "Start" }).first().click();

  // Verify error state
  await expect(page.getByText("Connection failed")).toBeVisible();
  await expect(page.getByText("error")).toBeVisible();
});

test("should handle bulk actions with IPC events", async ({ page }) => {
  // Add multiple transfers
  for (let i = 0; i < 2; i++) {
    await addTransfer(page, {
      sourceHost: `source${i}.example.com`,
      sourceUser: `sourceuser${i}`,
      sourcePass: "sourcepass",
      destHost: `dest${i}.example.com`,
      destUser: `destuser${i}`,
      destPass: "destpass",
    });
  }

  // Start all transfers using the UI button
  await page.getByRole("button", { name: "Start All" }).click();

  // Verify each transfer shows progress
  for (let i = 0; i < 2; i++) {
    await expect(page.getByText("Starting transfer...")).toBeVisible();
  }

  // Verify progress is shown for all transfers
  await expect(page.getByText("Syncing messages...")).toBeVisible();
  await expect(page.getByText("50%")).toBeVisible();
});
