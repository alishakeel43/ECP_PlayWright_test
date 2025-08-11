import { test, expect } from "@playwright/test";
import {
  addInvoiceDetails,
  completeOtherFields,
  createCustomer,
  handleCopaySection,
  checkRandomOption,
  invoiceDetails,
} from "../helpers/invoice/invoiceHelpers";
import { mockGetCollections } from "../helpers/apiMocker";


import { viewPdfAndSaveDraft,
    draftInvoiceAndVerifyDetails,
    sendInvoiceEmailAndVerifyEmailDetails,
    paidInvoiceAndVerifyInoviceDetails,
    verifyInvoiceEmailFromSMTP } from "../helpers/invoice/invoiceVerification";

import { applyRandomOptionalAddons } from "../helpers/invoice/viewOtherLensOptionsSections";

test.describe("Invoice create", () => {
    test("test invoice creation", async ({ page, context }) => {
      test.setTimeout(300_000); // Set timeout to 300 seconds (5 minutes)

      console.log("Invoice Details:", invoiceDetails);
      console.log("Starting the invoice creation test");
  
      await test.step('Step 1: Go to Invoices page', async () => {
        console.log("➡️ Navigating to Invoices page...");
        await page.goto("/");
        await page.locator("div").filter({ hasText: /^Invoices$/ }).first().click();
        console.log("Landed on Invoices page.");
      });
  
      await test.step('Step 2: Create customer', async () => {
        console.log("Creating customer...");
        const customerDetails = invoiceDetails.customer;
        await createCustomer(page, customerDetails);
        console.log("Customer created.");
      });
  
      await test.step('Step 3: Enable collections mock and fill invoice details', async () => {
        console.log("Enabling mock for collections API...");
        await mockGetCollections(page);
        console.log("Adding invoice details...");
        await addInvoiceDetails(page);
        console.log("Invoice details added.");
      });
  
      await test.step('Step 4: Select lens type options with modal handling', async () => {
        let maxRetries = 5;
        let attempt = 0;
  
        while (attempt < maxRetries) {
          console.log(`Attempt ${attempt + 1}: Selecting lens options...`);
  
          await page.locator('input[value="Davis Vision"]').click();
          await checkRandomOption(page, 'input[name="lensType"]');
          await checkRandomOption(page, 'input[name="lensTypeValue"]');
  
          const privatePayModal = page.getByText('You are diverting to Private Pay', { exact: false });
          const isModalVisible = await privatePayModal.isVisible().catch(() => false);
  
          if (isModalVisible) {
            console.log("'Private Pay' modal appeared — clicking OK...");
            const okButton = page.getByRole('button', { name: /ok/i });
            await okButton.click();
  
            console.log("Waiting for modal and loader to disappear...");
            await expect(page.locator("text=Just a Moment")).toHaveCount(0, { timeout: 100000 });
            await expect(privatePayModal).toBeHidden();
            attempt++;
          } else {
            console.log("Modal not shown — selection successful.");
            break;
          }
        }
  
        if (attempt === maxRetries) {
          throw new Error("Private Pay modal kept appearing after max retries.");
        }
      });
  
      await test.step('Step 5: Complete other required invoice fields', async () => {
        console.log("Completing other required invoice fields...");
        await completeOtherFields(page);
        console.log("Other invoice fields completed.");
      });
  
      await test.step('Step 6: Handle copay section (radio/buttons)', async () => {
        console.log("Handling copay section...");
        await handleCopaySection(page);
        console.log("Copay handled.");
      });
  
      await test.step('Step 7: (Optional) View other lens options and apply treatments', async () => {
        console.log("Viewing other lens options...");
        await page.getByText('View Other Lens Options').click();

        await applyRandomOptionalAddons(page);

        console.log("End Viewing other lens options...");
      });
  
      await test.step('Step 8: Save draft and verify invoice details', async () => {
        console.log("Saving draft and verifying invoice details...");
        await draftInvoiceAndVerifyDetails(page);
        console.log("Draft saved and invoice details verified.");
      });
  
      await test.step('Step 9: Send invoice email and verify via SMTP in new tab', async () => {
        console.log("Sending invoice email...");
        await sendInvoiceEmailAndVerifyEmailDetails(page);
  
        console.log("Opening new tab to verify SMTP email...");
        const smtpPage = await context.newPage();
        await verifyInvoiceEmailFromSMTP(smtpPage, context);
        console.log("Email verified via SMTP.");
  
        await smtpPage.close();
        console.log("Closed SMTP tab.");
      });
  
      await test.step('Step 10: Mark invoice as paid and verify final status', async () => {
        console.log("Marking invoice as paid...");
        await paidInvoiceAndVerifyInoviceDetails(page);
        console.log("Invoice marked as paid and verified.");
      });
  
      console.log("Invoice creation test completed successfully.");
    });
  });
  