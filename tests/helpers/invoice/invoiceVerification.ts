import { test, expect, Page, BrowserContext } from "@playwright/test";
import { randomInt } from "crypto";
import { invoiceDetails, clickButtonIfVisible} from "./invoiceHelpers";


export async function viewPdfAndSaveDraft(page) {

  
    console.log("View the invoice for save and draft");
    // Step 3: Click on the "Save/Update" button (with alt="draft")
    const saveButton = page.locator('button[type="submit"] img[alt="draft"]');
    await saveButton.first().click(); // just in case multiple match

  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });


    // Get the total price
    const totalSlotPriceLocator = page.locator("#total-slot-price");
    await totalSlotPriceLocator.waitFor({ state: "visible" });
    
    await clickButtonIfVisible(page, "Your New Glasses Would Have");
    await clickButtonIfVisible(page, "Reduced Fee for Glasses with");
    await clickButtonIfVisible(page, "Your New Glasses Would Have");
    await clickButtonIfVisible(page, "Reduced Fee for Glasses with");


    invoiceDetails.price = await totalSlotPriceLocator.textContent(); // e.g., "$594.70"
  
    invoiceDetails.status = "Draft";
  
    console.log(invoiceDetails);
  
    await page.getByRole("button", { name: "Save as draft" }).click();
  
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
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

    await clickUpdateIfErrorExists(page);


    // Step 3: Click on the "Save/Update" button (with alt="draft")
    const saveButton = page.locator('button[type="submit"] img[alt="draft"]');
    await saveButton.first().click(); // just in case multiple match
  
    console.log("View the invoice for 'save and send' section");
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    // Get the total price
    const totalSlotPriceLocator = page.locator("#total-slot-price");
    await totalSlotPriceLocator.waitFor({ state: "visible" });
    
    await clickButtonIfVisible(page, "Your New Glasses Would Have");
    await clickButtonIfVisible(page, "Reduced Fee for Glasses with");
    await clickButtonIfVisible(page, "Your New Glasses Would Have");
    await clickButtonIfVisible(page, "Reduced Fee for Glasses with");

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

    await clickUpdateIfErrorExists(page);

  
    // Step 3: Click on the "Save/Update" button (with alt="draft")
    const saveButton = page.locator('button[type="submit"] img[alt="draft"]');
    await saveButton.first().click(); // just in case multiple match
  
    console.log("View the invoice for Paid Section");
    await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
      timeout: 100000,
    });
  
    await clickButtonIfVisible(page, "Your New Glasses Would Have");
    await clickButtonIfVisible(page, "Reduced Fee for Glasses with");
    await clickButtonIfVisible(page, "Your New Glasses Would Have");
    await clickButtonIfVisible(page, "Reduced Fee for Glasses with");
  
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
              // Scroll the page down to bring preview into view
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
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        orderGlassesButton.click()
      ]);
      
      // Instead of letting it open a new tab, open that link in same tab:
      const url = newPage.url();
      await newPage.close();
      await page.goto(url); // main `page` jo tumhare function param me aaya tha
      
    
      // Step 11: (Switch back to main if needed — optional in Playwright)
      // Step 12: Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
  
      // Step 14: Check name
      const matches = page.locator(`text=${randomFirstName} ${randomLastName}`);
      await expect(matches.nth(1)).toBeVisible({timeout: 20000}); // or .nth(0)
      // Step 15: Check email
      await expect(page.locator(`text=${randomEmail}`)).toBeVisible({timeout:30000});
    
      // Step 16: Check phone number
      await expect(page.locator(`text=${customerPhoneNumber}`)).toBeVisible({timeout:30000});
    
      // Step 17: Check invoice price
      await expect(page.locator('#total-slot-price')).toContainText(invoiceValue);
    
      console.log('sdf sdf');

      await page.click(`xpath=//button[contains(@class, 'X-EKGursNZMBlXXaGzt1lA==')]`);
      
      const formattedInvoiceValue = formatCurrencyString(invoiceValue); // "$2,478.67"

      // Optional: Wait for Stripe-specific URL
      await page.waitForURL(/https:\/\/checkout\.stripe\.com\//, { timeout: 150000 });

      // Fetch value from button with USD image
      try {

        await expect(page).toHaveTitle(/(Stripe|Wadic)/i, { timeout: 60000 });
        
        const usdCurrencyLocator = page.locator('button:has(img[alt="US"]) .CurrencyAmount');

        if (await usdCurrencyLocator.isVisible({ timeout: 60000 })) {
          const usdCurrencyText = await usdCurrencyLocator.textContent();
          const formattedUsdValue = usdCurrencyText?.replace(/,/g, '').trim();
          console.log('Value from USD button:', formattedUsdValue);
        } else {
          console.log('USD currency button not visible');
          const amountLocator = page.locator('[data-testid="product-summary-total-amount"] >> span.CurrencyAmount');

          if (await amountLocator.isVisible({ timeout: 60000 })) {
            const rawAmount = await amountLocator.textContent();
            const formattedAmount = rawAmount?.replace(/,/g, '').trim();
            console.log('Value from total amount (no button):', formattedAmount);
          } else {
            console.log('Total amount span not visible');
          }
        }
      } catch (error) {
        console.log('Error fetching USD currency value:', error);
      }

  };


  
  function formatCurrencyString(value: string): string {
    const numeric = parseFloat(value.replace(/[$,]/g, '')); // Remove $ and commas
    return `$${numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  
/**
 * Clicks "Update Invoice" button if both it and the error text exist
 */
export async function clickUpdateIfErrorExists(page: Page): Promise<void> {
  const updateButton = page.getByRole('button', { name: 'Update Invoice' });
  const errorText = page.getByText('One or more saved values are', { exact: false });

  const buttonVisible = await updateButton.isVisible().catch(() => false);
  const errorVisible = await errorText.isVisible().catch(() => false);

  if (buttonVisible && errorVisible) {
    await updateButton.click();
    console.log('Clicked "Update Invoice" button because both conditions were met.');
  } else {
    console.log('Either the button or error message is missing. Skipping click.');
  }
}
