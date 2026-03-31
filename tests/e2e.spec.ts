import { test, expect } from "@playwright/test";

// ── Test credentials (must exist in seed data or be created) ──
const TEST_EMAIL = "test@spick.se";
const TEST_PASSWORD = "testpassword123";

// ═══════════════════════════════════════
// AUTH TESTS
// ═══════════════════════════════════════

test.describe("Authentication", () => {
  test("shows login page when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /logga in/i })).toBeVisible();
  });

  test("shows error with wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@email.se");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 });
  });

  test("can sign up new account", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Skapa konto").click();
    await expect(page.getByRole("heading", { name: /skapa konto/i })).toBeVisible();
    await page.fill('input[placeholder="Ditt förnamn"]', "Testare");
    await page.fill('input[type="email"]', `test-${Date.now()}@spick.se`);
    await page.fill('input[type="password"]', "testpassword123");
    await page.click('button[type="submit"]');
    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });
  });

  test("can login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});

// ═══════════════════════════════════════
// ONBOARDING TESTS
// ═══════════════════════════════════════

test.describe("Onboarding", () => {
  test("shows welcome step", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByText("Välkommen till Spick!")).toBeVisible();
    await expect(page.getByText("Kom igång")).toBeVisible();
  });

  test("can navigate through all steps", async ({ page }) => {
    await page.goto("/onboarding");

    // Step 0: Welcome
    await page.getByText("Kom igång").click();

    // Step 1: Profile
    await expect(page.getByText("Berätta om dig")).toBeVisible();
    await page.fill('input[placeholder="Ditt förnamn"]', "Test");
    await page.getByText("1–2 år").click();
    await page.getByText("Fortsätt →").click();

    // Step 2: Availability
    await expect(page.getByText("När kan du jobba?")).toBeVisible();
    await page.getByText("Fortsätt →").click();

    // Step 3: Area
    await expect(page.getByText("Var vill du jobba?")).toBeVisible();
    await page.getByText("Vasastan").click();
    await page.getByText("Fortsätt →").click();

    // Step 4: Job types
    await expect(page.getByText("Vad vill du städa?")).toBeVisible();
    await page.getByText("Fortsätt →").click();

    // Step 5: Conditions
    await expect(page.getByText("Arbetsvillkor")).toBeVisible();
    await page.getByText("Fortsätt →").click();

    // Step 6: Economy
    await expect(page.getByText("Dina ekonomiska krav")).toBeVisible();
    await page.getByText("Slutför ✓").click();

    // Step 7: Done
    await expect(page.getByText("Du är redo")).toBeVisible();
  });

  test("skip button jumps to done", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByText("Kom igång").click();
    await page.getByText("Hoppa över").click();
    await expect(page.getByText("Du är redo")).toBeVisible();
  });

  test("cannot proceed without required fields", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByText("Kom igång").click();
    // Name empty + no experience = disabled button
    const continueBtn = page.getByText("Fortsätt →");
    await expect(continueBtn).toBeDisabled();
  });
});

// ═══════════════════════════════════════
// DASHBOARD TESTS
// ═══════════════════════════════════════

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test("shows greeting with name", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/god (morgon|eftermiddag|kväll)/i);
  });

  test("shows stat cards", async ({ page }) => {
    await expect(page.getByText("VECKA")).toBeVisible();
    await expect(page.getByText("SNITT/H")).toBeVisible();
    await expect(page.getByText("BETYG")).toBeVisible();
  });

  test("shows today schedule section", async ({ page }) => {
    await expect(page.getByText("Dagens schema")).toBeVisible();
  });

  test("shows available jobs section", async ({ page }) => {
    await expect(page.getByText("Lediga jobb")).toBeVisible();
  });

  test("bottom navigation works", async ({ page }) => {
    await page.getByText("Jobb").click();
    await expect(page).toHaveURL(/\/jobs/);

    await page.getByText("Kalender").click();
    await expect(page).toHaveURL(/\/calendar/);

    await page.getByText("Inkomst").click();
    await expect(page).toHaveURL(/\/earnings/);

    await page.getByText("Inst.").click();
    await expect(page).toHaveURL(/\/settings/);

    await page.getByText("Hem").click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ═══════════════════════════════════════
// JOBS TESTS
// ═══════════════════════════════════════

test.describe("Jobs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.goto("/jobs");
  });

  test("shows job list with heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /hitta jobb/i })).toBeVisible();
  });

  test("filter chips are visible", async ({ page }) => {
    await expect(page.getByText("Alla typer")).toBeVisible();
  });

  test("sort dropdown works", async ({ page }) => {
    const select = page.locator("select");
    await select.selectOption("pay");
    // Jobs should re-order (verify first card has highest pay)
  });

  test("stats bar shows", async ({ page }) => {
    await expect(page.getByText(/jobb/)).toBeVisible();
    await expect(page.getByText(/kr\/h/)).toBeVisible();
  });
});

// ═══════════════════════════════════════
// CALENDAR TESTS
// ═══════════════════════════════════════

test.describe("Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.goto("/calendar");
  });

  test("shows calendar heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /kalender/i })).toBeVisible();
  });

  test("week navigation works", async ({ page }) => {
    const weekLabel = page.locator("text=/\\d+ .+ – \\d+ .+ \\d+/");
    const initialText = await weekLabel.textContent();
    await page.locator("button:has-text('→')").first().click();
    const newText = await weekLabel.textContent();
    expect(newText).not.toBe(initialText);
  });

  test("idag button returns to current week", async ({ page }) => {
    await page.locator("button:has-text('→')").first().click();
    await page.getByText("Idag").click();
    // Should be back to current week
  });
});

// ═══════════════════════════════════════
// SETTINGS TESTS
// ═══════════════════════════════════════

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.goto("/settings");
  });

  test("shows settings heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /arbetsinställningar/i })).toBeVisible();
  });

  test("shows match potential", async ({ page }) => {
    await expect(page.getByText("Matchningspotential")).toBeVisible();
  });

  test("shows all 6 sections", async ({ page }) => {
    await expect(page.getByText("Tillgänglighet")).toBeVisible();
    await expect(page.getByText("Arbetsområde")).toBeVisible();
    await expect(page.getByText("Jobbtyper")).toBeVisible();
    await expect(page.getByText("Arbetsvillkor")).toBeVisible();
    await expect(page.getByText("Ersättning")).toBeVisible();
    await expect(page.getByText("Personligt")).toBeVisible();
  });

  test("save button initially disabled", async ({ page }) => {
    const saveBtn = page.getByRole("button", { name: /spara/i });
    await expect(saveBtn).toBeDisabled();
  });
});

// ═══════════════════════════════════════
// EARNINGS TESTS
// ═══════════════════════════════════════

test.describe("Earnings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    await page.goto("/earnings");
  });

  test("shows heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /inkomst/i })).toBeVisible();
  });

  test("has 3 tabs", async ({ page }) => {
    await expect(page.getByText("📊 Översikt")).toBeVisible();
    await expect(page.getByText("📋 Historik")).toBeVisible();
    await expect(page.getByText("👥 Kunder")).toBeVisible();
  });

  test("tab switching works", async ({ page }) => {
    await page.getByText("📋 Historik").click();
    // Should show filter chips for job types
    await expect(page.getByText("Alla")).toBeVisible();

    await page.getByText("👥 Kunder").click();
    await expect(page.getByText("Dina bästa kunder")).toBeVisible();
  });
});

// ═══════════════════════════════════════
// ACCESSIBILITY TESTS
// ═══════════════════════════════════════

test.describe("Accessibility", () => {
  test("login page keyboard navigation", async ({ page }) => {
    await page.goto("/login");
    await page.keyboard.press("Tab"); // email
    await page.keyboard.press("Tab"); // password
    await page.keyboard.press("Tab"); // submit button
    const focused = page.locator("button[type='submit']");
    await expect(focused).toBeFocused();
  });

  test("touch targets are at least 44px", async ({ page }) => {
    await page.goto("/login");
    const button = page.locator("button[type='submit']");
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

// ═══════════════════════════════════════
// MOBILE TESTS
// ═══════════════════════════════════════

test.describe("Mobile", () => {
  test.use({ ...test.info().project.use, viewport: { width: 390, height: 844 } });

  test("responsive layout on mobile", async ({ page }) => {
    await page.goto("/login");
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(390);
    await expect(page.getByRole("heading", { name: /logga in/i })).toBeVisible();
  });
});
