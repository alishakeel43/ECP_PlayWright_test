import {
    addInvoiceDetails,
    completeOtherFields,
    createCustomer,
    handleCopaySection,
    invoiceDetails,
    updateInvoiceDetails,
    selectLensOptions,
  } from "../helpers/invoice/invoiceHelpers";
  
  import {
    draftInvoiceAndVerifyDetails,
    sendInvoiceEmailAndVerifyEmailDetails,
    paidInvoiceAndVerifyInoviceDetails,
    verifyInvoiceEmailFromSMTP,
  } from "../helpers/invoice/invoiceVerification";
  
  import { applyRandomOptionalAddons } from "../helpers/invoice/viewOtherLensOptionsSections";
  import { updateTestResult } from "../helpers/db";
  
  export async function runVisionTest(
    page: any,
    context: any,
    connection: any,
    userEmail: string,
    data: any
  ) {
    const startTime = new Date();
    const { visionPlan, lensType, collectionTitle } = data;
  
    let status = "completed";
    let failureMessage: string | null = null;
  
    try {
      updateInvoiceDetails();
  
      await page.goto("/");
      await page.locator("div", { hasText: /^Invoices$/ }).first().click();
      await createCustomer(page, invoiceDetails.customer);
  
      await page.waitForSelector("text=Just a Moment", { state: "detached", timeout: 100000 });
  
      await addInvoiceDetails(page);
      await page.locator(`input[value="${visionPlan}"]`).click();
  
      let lensCollectionExist = false;
      const maxRetries = 5;
      let attempt = 0;
  
      while (attempt < maxRetries) {
        await page.waitForSelector("text=Just a Moment", { state: "detached", timeout: 100000 });
        lensCollectionExist = await selectLensOptions(page, lensType, collectionTitle);
  
        const modal = page.getByText("You are diverting to Private Pay", { exact: false });
        if (await modal.isVisible().catch(() => false)) {
          await page.getByRole("button", { name: /ok/i }).click();
          await modal.waitFor({ state: "hidden" });
          attempt++;
        } else {
          break;
        }
      }
  
      if (!lensCollectionExist) {
        throw new Error(`Lens collection not found for ${visionPlan}`);
      }
  
      await completeOtherFields(page);
      await handleCopaySection(page);
      await page.getByText("View Other Lens Options").click();
      await applyRandomOptionalAddons(page);
  
      await draftInvoiceAndVerifyDetails(page);
      await sendInvoiceEmailAndVerifyEmailDetails(page);
  
      // const smtpPage = await context.newPage();
      // await verifyInvoiceEmailFromSMTP(smtpPage, context);
      // await smtpPage.close();
      
      await verifyInvoiceEmailFromSMTP(page, context);
  
      await paidInvoiceAndVerifyInoviceDetails(page);
    } catch (error: any) {
      status = "Failed";
      failureMessage = error?.message || "Unknown error";
      console.error(`❌ Test failed for ${visionPlan} — ${failureMessage}`);
    } finally {
      await updateTestResult(
        connection,
        userEmail,
        visionPlan,
        lensType,
        collectionTitle,
        status,
        failureMessage
      );
  
      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      console.log(`${status === "Complete" ? "✅" : "❌"} ${visionPlan} finished. Duration: ${duration}s`);
    }
  }
  