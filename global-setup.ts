import { FullConfig ,chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { login } from './tests/helpers/loginHelper';

async function globalSetup(config: FullConfig) {
  const loginStatePath = 'storage/loginState.json';

  if (fs.existsSync(loginStatePath)) {
    console.log('✅ Using cached auth state.');
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();


  page.setDefaultTimeout(180000); // 3 minutes timeout for slow login flows

  await login(page);

  // ✅ Save auth state and wsEndpoint for reuse
  await context.storageState({ path: loginStatePath });

  console.log('✅ Login complete  state saved.');
}

export default globalSetup;
