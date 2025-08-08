import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_DIR = path.resolve('storage/users');

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Create today's storage directory if it doesn't exist
 */
function ensureTodayStorageDir(): string {
  const todayDate = getTodayDate();
  const todayDir = path.join(BASE_DIR, todayDate);

  if (!fs.existsSync(todayDir)) {
    fs.mkdirSync(todayDir, { recursive: true });
    console.log(`✅ Created directory: ${todayDir}`);
  }

  return todayDir;
}

/**
 * Delete all folders in storage/users except today's folder
 */
function deleteOldStorageFolders() {
  const todayDate = getTodayDate();

  if (!fs.existsSync(BASE_DIR)) return;

  const folders = fs.readdirSync(BASE_DIR, { withFileTypes: true });

  for (const folder of folders) {
    if (folder.isDirectory() && folder.name !== todayDate) {
      const oldPath = path.join(BASE_DIR, folder.name);
      fs.rmSync(oldPath, { recursive: true, force: true });
      console.log(`🗑️ Deleted old folder: ${oldPath}`);
    }
  }
}

/**
 * Login and save storage state if not already saved
 */
export async function loginAndSaveStorage(
  email: string,
  password: string,
  storageFileName: string = 'storageState.json'
): Promise<string> {
  const todayDir = ensureTodayStorageDir();
  deleteOldStorageFolders();

  const storageStatePath = path.join(todayDir, storageFileName);

  const browser = await chromium.launch();

  // Step 1: Try using existing storage state
  if (fs.existsSync(storageStatePath)) {
    const context = await browser.newContext({ storageState: storageStatePath });
    const page = await context.newPage();

    try {
      await page.goto(`${process.env.BASE_URL}/invoice`, { timeout: 30_000 });

      // You can also verify the session is valid with a specific selector:
      await page.waitForSelector('text=Invoices', { timeout: 10_000 });

      console.log(`✅ Using existing storage state: ${storageStatePath}`);
      await browser.close();
      return storageStatePath;
    } catch (error) {
      console.warn("⚠️ Existing storage failed to load. Deleting and retrying login...");
      fs.unlinkSync(storageStatePath);
    } finally {
      await browser.close();
    }
  }

  // Step 2: Fresh login and save storage state
  const freshBrowser = await chromium.launch();
  const freshContext = await freshBrowser.newContext();
  const freshPage = await freshContext.newPage();

  try {
    console.log('🔐 Logging in to create new storage state...');
    await freshPage.goto(`${process.env.BASE_URL}/login`);

    await freshPage.waitForSelector('text=Just a moment', {
      state: 'detached',
      timeout: 100000,
    });

    await freshPage.fill('[name="email"]', email);
    await freshPage.fill('[name="password"]', password);
    await freshPage.click('button[type="submit"]');

    await freshPage.waitForURL('**/dashboard/**', { timeout: 10_000 });

    console.log('✅ Login successful, saving storage...');
    await freshContext.storageState({ path: storageStatePath });

    if (!fs.existsSync(storageStatePath)) {
      throw new Error(`❌ Failed to create storage state file: ${storageStatePath}`);
    }

    console.log(`💾 Storage state saved to: ${storageStatePath}`);
    return storageStatePath;
  } catch (err) {
    console.error("❌ Error during login or saving storage state:", err);
    throw err;
  } finally {
    await freshBrowser.close();
  }
}
