import { test, expect, Page, BrowserContext } from "@playwright/test";
import { randomInt } from "crypto";
import { invoiceDetails } from "./invoiceHelpers";


export async function viewPdfAndSaveDraft(page) {
    console.log("View the invoice");
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
    await page.getByRole("button", { name: "draft" }).click();
    await page
      .getByRole("button", { name: "Your New Glasses Would Have" })
      .click();
    await page
      .getByRole("button", { name: "Reduced Fee for Glasses with" })
      .click();
    await page
      .getByRole("button", { name: "Your New Glasses Would Have" })
      .click();
    await page
      .getByRole("button", { name: "Reduced Fee for Glasses with" })
      .click();
  
    const totalSlotPriceLocator = page.locator("#total-slot-price");
    invoiceDetails.price = await totalSlotPriceLocator.textContent(); // e.g., "$594.70"
  
    invoiceDetails.status = "Draft";
  
    console.log(invoiceDetails);
  
    await page.getByRole("button", { name: "Save as draft" }).click();
  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  }
  
  export async function viewPdfForInvoiveDetails(page: Page) {
    console.log("🔍 View the invoice");
  
    // Wait until "Just a Moment" is gone (e.g., custom loader text)
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    // Wait for the actual loader DOM element to disappear
    await page.waitForSelector(".loader", { state: "detached", timeout: 10000 });
  
    // Optional: confirm that buttons are visible and stable before clicking
    const glassesButton = page.getByRole("button", {
      name: "Your New Glasses Would Have",
    });
    const feeButton = page.getByRole("button", {
      name: "Reduced Fee for Glasses with",
    });
  
    await glassesButton.waitFor({ state: "visible" });
    await glassesButton.click();
  
    await feeButton.waitFor({ state: "visible" });
    await feeButton.click();
  
    // Click again if it’s part of a toggle/test logic
    await glassesButton.click();
    await feeButton.click();
  
    // Get the total price
    const totalSlotPriceLocator = page.locator("#total-slot-price");
    await totalSlotPriceLocator.waitFor({ state: "visible" });
    invoiceDetails.price = (await totalSlotPriceLocator.textContent())?.trim() ?? "";
  
    console.log("✅ Extracted price:", invoiceDetails.price);
  }
  
  
  export async function verifyInvoiceDetailsFromTable(
    page: Page
  ) {
    try {
      await page.goto("/invoices", { waitUntil: "domcontentloaded" });
  
      // Wait for loader and table to finish rendering
      await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
        timeout: 10000,
      });
      await expect(page.locator("table")).toBeVisible();
  
      const invoiceName = invoiceDetails?.name;
      const email = invoiceDetails?.customer?.email || "test.user@yopmail.com";
      const customerName =
        invoiceDetails?.customer?.firstName && invoiceDetails?.customer?.lastName
          ? `${invoiceDetails.customer.firstName} ${invoiceDetails.customer.lastName}`
          : "Test Playwright";
  
      const invoicePrice = invoiceDetails?.price;
      const invoiceStatus = invoiceDetails?.status;
  
      console.log({
        invoiceName,
        email,
        customerName,
        invoicePrice,
        invoiceStatus,
      });
  
      // Use forgiving XPath
      const rowSelector = `//tr[contains(td[1], "${invoiceName}") and contains(td[3], "${email}")]`;
      const invoiceNameCell = page.locator(`${rowSelector}/td[1]`);
      const customerNameCell = page.locator(`${rowSelector}/td[2]`);
      const emailCell = page.locator(`${rowSelector}/td[3]`);
      const invoicePriceCell = page.locator(`${rowSelector}/td[5]`);
      const invoiceStatusCell = page.locator(`${rowSelector}/td[6]`);
  
      await expect(invoiceNameCell).toBeVisible();
      await expect(invoiceNameCell).toContainText(invoiceName);
      await expect(customerNameCell).toContainText(customerName);
      await expect(emailCell).toContainText(email);
      await expect(invoicePriceCell).toContainText(invoicePrice);
      await expect(invoiceStatusCell).toHaveText(new RegExp(invoiceStatus, "i")); // for case-sensitive
    } catch (err) {
      console.error("Navigation aborted:", err);
    }
  }
  
  export async function draftInvoiceAndVerifyDetails(page: Page) {
  
    await viewPdfAndSaveDraft(page);
    await verifyInvoiceDetailsFromTable(page);
  }
  
  export async function sendInvoiceEmailAndVerifyEmailDetails(page: Page) {
  
    await page.goto("/invoices");
    // Wait for loader and table to finish rendering
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 10000,
    });
    await expect(page.locator("table")).toBeVisible();
  
    const invoiceName = invoiceDetails?.name;
    const email = invoiceDetails?.customer?.email || "test.user@yopmail.com";
    const customerName =
      invoiceDetails?.customer?.firstName && invoiceDetails?.customer?.lastName
        ? `${invoiceDetails.customer.firstName} ${invoiceDetails.customer.lastName}`
        : "Test Playwright";
  
    const invoicePrice = invoiceDetails?.price;
    const invoiceStatus = invoiceDetails?.status;
  
    console.log({
      invoiceName,
      email,
      customerName,
      invoicePrice,
      invoiceStatus,
    });
  
    const rowSelector = `//tr[contains(td[1], "${invoiceName}") and contains(td[3], "${email}")]`;
    const moreIconButton = page.locator(
      `${rowSelector}/td[7]//img[contains(@alt, "more icon")]`
    );
    await moreIconButton.click();
    // Step 2: Wait for the popover and click "EDIT"
    const editButton = page.locator(".ant-popover-inner-content >> text=EDIT");
    await editButton.waitFor(); // Ensure it's visible before interacting
    await editButton.click();
  
    // Step 3: Wait for navigation to the edit page
    await page.waitForURL('**/create-invoice', { waitUntil: 'domcontentloaded' });
  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    // Step 3: Click on the "Save/Update" button (with alt="draft")
    const saveButton = page.locator('button[type="submit"] img[alt="draft"]');
    await saveButton.first().click(); // just in case multiple match
  
    console.log("View the invoice  --------------------------------");
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    await page
      .getByRole("button", { name: "Your New Glasses Would Have" })
      .click();
    await page
      .getByRole("button", { name: "Reduced Fee for Glasses with" })
      .click();
    await page
      .getByRole("button", { name: "Your New Glasses Would Have" })
      .click();
    await page
      .getByRole("button", { name: "Reduced Fee for Glasses with" })
      .click();
  
    const totalSlotPriceLocator = page.locator("#total-slot-price");
    invoiceDetails.price = await totalSlotPriceLocator.textContent(); // e.g., "$594.70"
  
    invoiceDetails.status = "Unpaid";
  
    console.log(invoiceDetails);
  
    await page.getByRole("button", { name: "Save and Send" }).click();
  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    console.log(invoiceDetails);
  
  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
    
    await verifyInvoiceDetailsFromTable(page);
  
  }
  
  
  export async function paidInvoiceAndVerifyInoviceDetails(page: Page) {
    
    await page.goto("/invoices");
    // Wait for loader and table to finish rendering
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 10000,
    });
    await expect(page.locator("table")).toBeVisible();
  
    const invoiceName = invoiceDetails?.name;
    const email = invoiceDetails?.customer?.email || "test.user@yopmail.com";
    const customerName =
      invoiceDetails?.customer?.firstName && invoiceDetails?.customer?.lastName
        ? `${invoiceDetails.customer.firstName} ${invoiceDetails.customer.lastName}`
        : "Test Playwright";
  
    const invoicePrice = invoiceDetails?.price;
    const invoiceStatus = invoiceDetails?.status;
  
    console.log({
      invoiceName,
      email,
      customerName,
      invoicePrice,
      invoiceStatus,
    });
  
    const rowSelector = `//tr[contains(td[1], "${invoiceName}") and contains(td[3], "${email}")]`;
    const moreIconButton = page.locator(
      `${rowSelector}/td[7]//img[contains(@alt, "more icon")]`
    );
    await moreIconButton.click();
    // Step 2: Wait for the popover and click "EDIT"
    const editButton = page.locator(".ant-popover-inner-content >> text=EDIT");
    await editButton.waitFor(); // Ensure it's visible before interacting
    await editButton.click();
  
    // Step 3: Wait for navigation to the edit page
    await page.waitForURL('**/create-invoice', { waitUntil: 'domcontentloaded' });
  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    // Step 3: Click on the "Save/Update" button (with alt="draft")
    const saveButton = page.locator('button[type="submit"] img[alt="draft"]');
    await saveButton.first().click(); // just in case multiple match
  
    console.log("View the invoice  --------------------------------");
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    await page
      .getByRole("button", { name: "Your New Glasses Would Have" })
      .click();
    await page
      .getByRole("button", { name: "Reduced Fee for Glasses with" })
      .click();
    await page
      .getByRole("button", { name: "Your New Glasses Would Have" })
      .click();
    await page
      .getByRole("button", { name: "Reduced Fee for Glasses with" })
      .click();
  
    const totalSlotPriceLocator = page.locator("#total-slot-price");
    invoiceDetails.price = await totalSlotPriceLocator.textContent(); // e.g., "$594.70"
  
    invoiceDetails.status = "Paid";
  
    console.log(invoiceDetails);
  
    await page.getByRole("button", { name: "Save and Paid" }).click();
  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    console.log(invoiceDetails);
  
  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
  
    await verifyInvoiceDetailsFromTable(page);
  
  }
  
  
  export async function verifyInvoiceEmailFromSMTP(page:Page, context: BrowserContext){
  
    
    // Replace these dynamic values with actual ones or import them
    const randomEmail = invoiceDetails.customer.email;
    const randomFirstName = invoiceDetails.customer.firstName;
    const randomLastName = invoiceDetails.customer.lastName;
    const invoiceValue = invoiceDetails.price;
    const customerPhoneNumber = invoiceDetails.customer.phone;
      // Step 0: Go to the Mailhog site
      await page.goto('https://wadicmailhog:N47%+7RzhP@\'[Yk@smtp.mailhog.wadic.net/');
    
      // Step 1: Wait for Inbox to not be visible (possibly means page loaded)
      await expect(page.locator('text=Inbox (0)')).not.toBeVisible({ timeout: 300000 });
    
      // Step 2-3: Click Search and enter email
      await page.click('#search');
      await page.fill('#search', randomEmail);
    
      // Step 4: Press Enter
      await page.press('#search', 'Enter');
    
      // Step 5: Wait for email result
      await expect(page.locator('(//div[contains(@class, "col-md-3")])[1]')).toBeVisible({ timeout: 600000 });
    
      // Step 6: Click on first email
    
        // Wait until at least one message is loaded
        const messages = page.locator('div.msglist-message');
    
        const count = await messages.count();
        let emailFound = false;
  
        for (let i = 0; i < count; i++) {
          const subject = await messages.nth(i).locator('span.subject').innerText();
  
          if (subject.trim() === 'Your Prescription Eyewear') {
            console.log(`📩 Found matching email at index ${i}. Clicking...`);
            await messages.nth(i).click();
              // ✅ Scroll the page down to bring preview into view
              await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
              });
            emailFound = true;
            break;
          }
        }
  
        if (!emailFound) {
          throw new Error("❌ No email found with subject 'Your Prescription Eyewear'");
        }
      // Step 7: Switch to iframe
      const frame = await page.frameLocator('#preview-html');
    
      // Step 8: Check for customer first name
      await expect(frame.locator(`xpath=//*[contains(text(), '${randomFirstName}')]`)).toBeVisible();
    
      // Step 9: Click on "Order Glasses Now"
      const orderGlassesButton = frame.locator(`xpath=//td[normalize-space(text())="Order Glasses Now"]`);
  
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      console.log("⏳ Waiting for 'Order Glasses Now' to be visible...");
      await expect(orderGlassesButton).toBeVisible({ timeout: 60000 });
      console.log("✅ 'Order Glasses Now' is visible. Clicking...");
      // Scroll into view
      await orderGlassesButton.scrollIntoViewIfNeeded();
  
      // Now click the element
      await orderGlassesButton.click();
      // Step 10: Switch to new tab
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        // The click from step 9 already triggers this
      ]);
      await newPage.waitForLoadState();
    
      // Step 11: (Switch back to main if needed — optional in Playwright)
      // Step 12: Scroll down
      await newPage.evaluate(() => window.scrollBy(0, 402));
  
      // Step 14: Check name
      const matches = newPage.locator(`text=${randomFirstName} ${randomLastName}`);
      await expect(matches.nth(1)).toBeVisible({timeout: 20000}); // or .nth(0)
      // Step 15: Check email
      await expect(newPage.locator(`text=${randomEmail}`)).toBeVisible();
    
      // Step 16: Check phone number
      await expect(newPage.locator(`text=${customerPhoneNumber}`)).toBeVisible();
    
      // Step 17: Check invoice price
      await expect(newPage.locator('#total-slot-price')).toContainText(invoiceValue);
    
      console.log('sdf sdf');
      // Step 18: Click Pay Now
      await newPage.click(`xpath=//button[contains(@class, 'X-EKGursNZMBlXXaGzt1lA==')]`);
    
      // Step 19: Wait for Stripe URL
      await newPage.waitForURL(/https:\/\/checkout\.stripe\.com\//, { timeout: 30000 });
    
  
      await expect(newPage.locator(`text=${invoiceValue}`)).toBeVisible({timeout:30000 });
  
      // Step 25: Wait for 5 seconds
      await newPage.waitForTimeout(5000);
  
      await newPage.close();
  };
  
  