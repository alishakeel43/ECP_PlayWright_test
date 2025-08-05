import { FullConfig, chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { login } from "./tests/helpers/loginHelper";

const storageDir = "storage";

async function globalSetup(config: FullConfig) {
  // Format today's date
  const today = new Date().toISOString().split("T")[0]; // e.g., '2025-07-31'
  const loginStateFile = `loginState-${today}.json`;
  const loginStatePath = path.join(storageDir, loginStateFile);

  //  Check if today's file already exists
  if (fs.existsSync(loginStatePath)) {
    console.log(`Using cached auth state for ${today}`);
    return;
  }

  // No valid file found — remove old login states
  const files = fs.readdirSync(storageDir);
  for (const file of files) {
    if (file.startsWith("loginState-") && file.endsWith(".json")) {
      fs.unlinkSync(path.join(storageDir, file));
      console.log(`Deleted outdated auth state: ${file}`);
    }
  }

  // Create new browser context and save today's login state
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.setDefaultTimeout(180000); // 3 min for login

  await login(page); // Your login function

  await context.storageState({ path: loginStatePath });
  console.log(` Saved new auth state: ${loginStateFile}`);

  await browser.close();
}

export default globalSetup;
