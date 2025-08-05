// helper/apiMocker.ts
import fs from 'fs';
import path from 'path';
import { Page, Request } from '@playwright/test';                                                   

const API_URL = 'https://pmo.ecptech.wadic.net/api/get-collections';
const CACHE_FILE = path.resolve(__dirname, '../../storage/getCollectionsCache.json');

export async function mockGetCollections(page: Page) {
  console.log('➡️ Setting up request interception for:', API_URL);

  await page.route(API_URL, async (route, request) => {
    console.log(`🔍 Intercepted request to: ${request.url()}`);

    if (fs.existsSync(CACHE_FILE)) {
      console.log('💾 Cache file found. Serving cached data from:', CACHE_FILE);

      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      console.log('📦 Cached data size:', data.length, 'bytes');

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: data,
      });
    } else {
      console.log('❌ Cache file not found. Fetching live response...');

      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url() === API_URL && res.status() === 200),
        route.continue(),
      ]);

      const body = await response.text();
      console.log('✅ Live response fetched. Caching response...');


      // 🛠 Ensure directory exists
      const dir = path.dirname(CACHE_FILE);
      if (!fs.existsSync(dir)) {
        console.log('📁 Directory not found. Creating:', dir);
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(CACHE_FILE, body);
      console.log('📝 Response written to cache:', CACHE_FILE);
    }
  });

  console.log('✅ Route handler for collections API is active.');
}
