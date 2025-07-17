import { Page } from "@playwright/test";
import dotenv from 'dotenv';
dotenv.config();

export async function login(page:Page ) {
  await page.goto(`${process.env.BASE_URL}/login`);
    
    try {
      // Replace with your actual selectors and credentials
      await page.fill('[name="email"]', process.env.USER_NAME || 'admin');
      await page.fill('[name="password"]', process.env.PASSWORD || 'password');
      await page.click('button[type="submit"]');
      console.log('Login Successfully.');
      await page.waitForURL('**/dashboard/**');
    } catch {
      console.log('Login form not visible — assuming already logged in.');
    }
  }