import { Page } from "@playwright/test";
import dotenv from 'dotenv';
dotenv.config();

export async function login(page:Page ) {
  
  
  try {
      await page.goto(`${process.env.BASE_URL}/login`);
    
      await page.waitForSelector('text=Just a moment', { state: 'detached', timeout: 10000 });
      // Replace with your actual selectors and credentials
      await page.fill('[name="email"]', process.env.USER_NAME || 'admin');
      await page.fill('[name="password"]', process.env.PASSWORD || 'password');
      await page.click('button[type="submit"]');
      console.log('Login Successfully.');
      await page.waitForURL('**/dashboard/**');
    } catch (error) {
      console.log(`Login form not visible : ${error}`);
    }
  }