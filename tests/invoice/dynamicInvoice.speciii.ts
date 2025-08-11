import { test, expect } from "@playwright/test";
import {
  addInvoiceDetails,
  completeOtherFields,
  createCustomer,
  handleCopaySection,
  checkRandomOption,
  invoiceDetails,
  updateInvoiceDetails,
  selectLensOptions,
} from "../helpers/invoice/invoiceHelpers";

import { mockGetCollections } from "../helpers/apiMocker";

import {
  draftInvoiceAndVerifyDetails,
  sendInvoiceEmailAndVerifyEmailDetails,
  paidInvoiceAndVerifyInoviceDetails,
  verifyInvoiceEmailFromSMTP,
} from "../helpers/invoice/invoiceVerification";
import { applyRandomOptionalAddons } from "../helpers/invoice/viewOtherLensOptionsSections";
import {
  createConnection,
  fetchTestData,
  updateTestResult,
  closeConnection,
  VisionData,
} from "../helpers/db";
import { loginAndSaveStorage } from "../helpers/userLogin";
import type { Connection } from "mysql2/promise";

// Global variables
let connection: Connection;
let storageStatePath: string;
let testData: VisionData[] = [];
let userEmail: string;
let password: string;
let lensCollectionExist : boolean;
// Configure timeout for all tests in this describe block
test.describe.configure({ timeout: 0 }); // 10 minutes


test.describe("Dynamic Vision Plan Tests", () => {

  test.beforeAll(async () => {

    test.setTimeout(100_000); // Set timeout to 100 seconds for this hook
    userEmail = "iwhipple-discard@gmail.com";
    password = "Eyecare2024!";
    connection = await createConnection();
    storageStatePath = await loginAndSaveStorage(userEmail, password);
  });
  
  test(`Test: Start`, async ({ browser }) => {
    testData = await fetchTestData(connection, userEmail);
    if (testData.length === 0) {
      console.warn("No test data found in DB.");
    }

    for (const data of testData) {

      const startTime: Date = new Date();
      console.log("Start Time:", startTime.toISOString());

      
      const { visionPlan, lensType, collectionTitle, userId } = data;

      updateInvoiceDetails();
      const context = await browser.newContext({
        storageState: storageStatePath,
      });
      const page = await context.newPage();

      console.log("Running test with data:", data);

      await test.step("Step 1: Navigate to Invoices page", async () => {
        await page.goto("/");
        await page
          .locator("div", { hasText: /^Invoices$/ })
          .first()
          .click();
        console.log("Landed on Invoices page.");
      });

      await test.step("Step 2: Create customer", async () => {
        await createCustomer(page, invoiceDetails.customer);
        console.log("Customer created.");
      });

      await test.step("Step 3: Enable collections mock & fill invoice", async () => {
        // await mockGetCollections(page);
        // Wait until "Just a Moment" is gone (e.g., custom loader text)
        await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
          timeout: 100000,
        });

        await addInvoiceDetails(page);
        console.log("Invoice details added.");
      });

      let lensCollectionExist = false;

      await test.step("Step 4: Select lens type with modal handling", async () => {
        await page.locator(`input[value="${visionPlan}"]`).click();

        const maxRetries = 5;
        let attempt = 0;

        while (attempt < maxRetries) {

          // Wait until "Just a Moment" is gone (e.g., custom loader text)
          await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
            timeout: 100000,
          });

          lensCollectionExist = await selectLensOptions(page,lensType,collectionTitle);
          // await checkRandomOption(page, 'input[name="lensType"]');
          // await checkRandomOption(page, 'input[name="lensTypeValue"]');

          const privatePayModal = page.getByText(
            "You are diverting to Private Pay",
            {
              exact: false,
            }
          );

          const isModalVisible = await privatePayModal
            .isVisible()
            .catch(() => false);

          if (isModalVisible) {
            console.log("Private Pay modal appeared, clicking OK...");
            await page.getByRole("button", { name: /ok/i }).click();
            await expect(page.locator("text=Just a Moment")).toHaveCount(0, {
              timeout: 100000,
            });
            await expect(privatePayModal).toBeHidden();

            attempt++;
          } else {
            console.log("No modal. Proceeding.");
            break;
          }
        }

        if (attempt === maxRetries) {
          throw new Error(
            "Private Pay modal kept appearing after max retries."
          );
        }
      });

      if(!lensCollectionExist){
        console.log("Selected collection is not exist");
        page.close();
        continue;
      }

      await test.step("Step 5: Complete other required fields", async () => {
        await completeOtherFields(page);
        console.log("Completed remaining fields.");
      });

      await test.step("Step 6: Handle copay section", async () => {
        await handleCopaySection(page);
        console.log("Copay section handled.");
      });

      await test.step("Step 7: Apply optional lens treatments", async () => {
        await page.getByText("View Other Lens Options").click();
        await applyRandomOptionalAddons(page);
        console.log("Optional lens options applied.");
      });

      await test.step("Step 8: Save draft & verify details", async () => {
        await draftInvoiceAndVerifyDetails(page);
        console.log("Draft saved and verified.");
      });

      await test.step("Step 9: Send invoice email & verify SMTP", async () => {
        await sendInvoiceEmailAndVerifyEmailDetails(page);
        const smtpPage = await context.newPage();
        await verifyInvoiceEmailFromSMTP(smtpPage, context);
        await smtpPage.close();
        console.log("Email verified via SMTP.");
      });

      await test.step("Step 10: Mark invoice as paid", async () => {
        await paidInvoiceAndVerifyInoviceDetails(page);
        console.log("Invoice marked as paid.");
      });

      await updateTestResult(
        connection,
        userEmail,
        visionPlan,
        lensType,
        collectionTitle
      );
      console.log(
        `Test result updated in DB. ---${visionPlan}, ${lensType}, ${collectionTitle}`
      );

      await context.close();

      const endTime: Date = new Date();
      console.log("End Time:", endTime.toISOString());
    
      const duration: number = (endTime.getTime() - startTime.getTime()) / 1000;
      console.log("Total Duration:", duration, "seconds");
    }
  });

  test.afterAll(async () => {
    await closeConnection(connection);
  });
});
