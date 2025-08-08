
import { test, expect, Page, BrowserContext } from "@playwright/test";
import { randomInt } from "crypto";
import { invoiceDetails,enterRetailPriceIfVisible , fillIfExists ,getRandomInt ,checkRandomOption } from "./invoiceHelpers";


export async function additionalLensTreatments(page: Page) {
  console.log("start --- Additional Lens Treatments");

  // Check if "Additional Lens Treatments" section exists and is visible
  const isSectionVisible = await page
    .getByText("Additional Lens Treatments", { exact: true })
    .isVisible()
    .catch(() => false);

  if (!isSectionVisible) {
    console.log("Additional Lens Treatments section not found, skipping...");
    return;
  }

  // 1. Click on "Additional Lens Treatments"
  await page.getByText("Additional Lens Treatments", { exact: true }).click();

  // Wait for conditional elements to appear
  await page.waitForTimeout(1000); // You can replace with a smarter wait if needed

  // 2. Check and click "Slab Off"
  const slabOff = page.getByText("Slab Off", { exact: true });
  if (await slabOff.isVisible().catch(() => false)) {
    await slabOff.click();
    await enterRetailPriceIfVisible(page);
    await fillIfExists(page, "input#slabOffPrice", getRandomInt(10, 50));
  }

  // 4. Check and click "Polish"
  const polish = page.getByText("Polish", { exact: true });
  if (await polish.isVisible().catch(() => false)) {
    await polish.click();
    await polishOptionSection(page);
    await fillIfExists(page, "input#polishPrice", getRandomInt(10, 50));
  }
}

  
  async function polishOptionSection(page) {
    const polishOptions = ["Edge Polish", "Roll & Polish"];
    let visiblePolish = [];
  
    // Step 2: Loop to collect all visible polish options
    for (const option of polishOptions) {
      const polishLocator = page.getByText(option, { exact: true });
      if (await polishLocator.isVisible()) {
        visiblePolish.push(polishLocator);
      }
    }
  
    // Step 3: Handle logic based on presence of visible options
    if (visiblePolish.length > 0) {
      // Randomly select one visible polish option
      const randomIndex = Math.floor(Math.random() * visiblePolish.length);
      const selectedPolish = visiblePolish[randomIndex];
  
      await enterRetailPriceIfVisible(page); // Your custom logic
      await selectedPolish.click();
    } else {
      // Step 4: Uncheck the polish section (if it's a checkbox or toggle)
      const polishToggle = page.getByText("Polish", { exact: true });
      if (await polishToggle.isVisible()) {
        await polishToggle.click();
      }
    }
  }
  
  export async function scratchResistantCoatings(page: Page) {
    // 1. Check and click "Scratch Resistant Coatings"
    const scratchResistantOption = page.getByText("Scratch Resistant Coatings", {
      exact: true,
    });
    if (await scratchResistantOption.isVisible()) {
      await scratchResistantOption.click();
  
      // Get all scratchedType radio buttons and select random option
      await checkRandomOption(page, 'input[name="scratchedType"]');
      // 2. Enter value in "Scratch Resistant Copay" input
      await fillIfExists(page, "input#scratchedPrice", getRandomInt(10, 50)); // You can use random or parameterized value
    }
  }
  
  export async function edgeCoating(page: Page) {
    // 1. Check and click "Edge Coating"
    const edgeCoating = page.getByText("Edge Coating", {
      exact: true,
    });
    if (await edgeCoating.isVisible()) {
      await edgeCoating.click();

      await fillIfExists(page, "input#edgeCoatingType", getRandomInt(10, 50));
      
      await enterRetailPriceIfVisible(page);
    }
  }
  
  export async function uvProtection(page: Page) {
    // 1. Check and click "UV Protection"
    const uvProtection = page.getByText("UV Protection", {
      exact: true,
    });
    if (await uvProtection.isVisible()) {
      await uvProtection.click();
      await enterRetailPriceIfVisible(page);
    }
  }
  
  export async function glassesProtectionPlan(page) {
    // Step 1: Check the checkbox only if not already checked
    const label = await page.getByText("Glasses Protection Plan", {
      exact: true,
    });
  
    if (!(await label.isVisible().catch(() => false))) {
      console.log("❌ Label not found: Glasses Protection Plan");
      return;
    }
  
    const parentDiv = await label.locator("..").first();
    const tickImg = parentDiv.locator('img[src*="tick-green.svg"]');
    const isAlreadyChecked = await tickImg.isVisible().catch(() => false);
  
    if (!isAlreadyChecked) {
      const svg = parentDiv.locator("svg").first();
      const checkbox = svg.locator("..").first();
      await checkbox.click();
      console.log("✅ Checked: Glasses Protection Plan");
    } else {
      console.log("ℹ️ Already checked: Glasses Protection Plan");
    }
  
    // Step 2: Try to select a random option from the select dropdown
    const select = await page.$('select[name="protectionPlanType"]');
  
    if (select) {
      const options = await select.$$('option:not([value=""])');
      if (options.length > 0) {
        const values = await Promise.all(
          options.map((opt) => opt.getAttribute("value"))
        );
        const randomValue = values[Math.floor(Math.random() * values.length)];
        await select.selectOption(randomValue);
        console.log(`✅ Selected random protection plan: ${randomValue}`);
        return;
      }
    }
  
    // If no valid options exist, uncheck the checkbox if it's selected
    const stillChecked = await tickImg.isVisible().catch(() => false);
    if (stillChecked) {
      const svg = parentDiv.locator("svg").first();
      const checkbox = svg.locator("..").first();
      await checkbox.click();
      console.log("✅ Unchecked: Glasses Protection Plan (no options)");
    } else {
      console.log("ℹ️ Already unchecked: Glasses Protection Plan (no options)");
    }
  }
  
  export async function shipping(page) {
    const label = await page.getByText("Shipping", { exact: true });
  
    if (!(await label.isVisible().catch(() => false))) {
      console.log("❌ Label not found: Shipping");
      return;
    }
  
    const parentDiv = await label.locator("..").first();
    const tickImg = parentDiv.locator('img[src*="tick-green.svg"]');
    const isChecked = await tickImg.isVisible().catch(() => false);
  
    // Step 1: Check the Shipping box if not already checked
    if (!isChecked) {
      const svg = parentDiv.locator("svg").first();
      const checkbox = svg.locator("..").first();
      await checkbox.click();
      console.log("✅ Checked: Shipping");
    } else {
      console.log("ℹ️ Already checked: Shipping");
    }
  
    // Step 2: Try to select a random option from the dropdown
    const select = await page.$('select[name="shippingType"]');
  
    if (select) {
      const options = await select.$$('option:not([value=""])');
      if (options.length > 0) {
        const values = await Promise.all(
          options.map((opt) => opt.getAttribute("value"))
        );
        const randomValue = values[Math.floor(Math.random() * values.length)];
        await select.selectOption(randomValue);
        console.log(`✅ Selected random shipping option: ${randomValue}`);
        return;
      }
    }
  
    // If dropdown is missing or has no options — uncheck if currently selected
    const stillChecked = await tickImg.isVisible().catch(() => false);
    if (stillChecked) {
      const svg = parentDiv.locator("svg").first();
      const checkbox = svg.locator("..").first();
      await checkbox.click();
      console.log("✅ Unchecked: Shipping (no options)");
    } else {
      console.log("ℹ️ Shipping already unchecked (no options)");
    }
  }
  
  export async function miscellaneousFee(page) {
    const label = await page.getByText("Miscellaneous Fee", { exact: true });
  
    if (!(await label.isVisible().catch(() => false))) {
      console.log("❌ Label not found: Miscellaneous Fee");
      return;
    }
  
    const parentDiv = await label.locator("..").first();
    const tickImg = parentDiv.locator('img[src*="tick-green.svg"]');
    const isChecked = await tickImg.isVisible().catch(() => false);
  
    // Step 1: Check the Miscellaneous Fee box if not already checked
    if (!isChecked) {
      const svg = parentDiv.locator("svg").first();
      const checkbox = svg.locator("..").first();
      await checkbox.click();
      console.log("✅ Checked: Miscellaneous Fee");
    } else {
      console.log("ℹ️ Already checked: Miscellaneous Fee");
    }
  
    // Step 2: Try to select a random option from the dropdown
    const select = await page.$('select[name="miscType"]');
  
    if (select) {
      const options = await select.$$('option:not([value=""])');
      if (options.length > 0) {
        const values = await Promise.all(
          options.map((opt) => opt.getAttribute("value"))
        );
        const randomValue = values[Math.floor(Math.random() * values.length)];
        await select.selectOption(randomValue);
        console.log(
          `✅ Selected random Miscellaneous Fee option: ${randomValue}`
        );
        return;
      }
    }
  
    // If dropdown is missing or has no options — uncheck if currently selected
    const stillChecked = await tickImg.isVisible().catch(() => false);
    if (stillChecked) {
      const svg = parentDiv.locator("svg").first();
      const checkbox = svg.locator("..").first();
      await checkbox.click();
      console.log("✅ Unchecked: Miscellaneous Fee (no options)");
    } else {
      console.log("ℹ️ Miscellaneous Fee already unchecked (no options)");
    }
  }
  
  export async function discount(page) {
    const label = await page.getByText("Discount", { exact: true });
  
    if (!(await label.isVisible().catch(() => false))) {
      console.log("❌ Label not found: Discount");
      return;
    }
  
    const parentDiv = await label.locator("..").first();
    const tickImg = parentDiv.locator('img[src*="tick-green.svg"]');
    const isChecked = await tickImg.isVisible().catch(() => false);
  
    // Step 1: Check the Discount box if not already checked
    if (!isChecked) {
      const svg = parentDiv.locator("svg").first();
      const checkbox = svg.locator("..").first();
      await checkbox.click();
      console.log("✅ Checked: Discount");
    } else {
      console.log("ℹ️ Already checked: Discount");
    }
  
    // Step 2: Try to select a random option from the dropdown
    const select = await page.$('select[name="discountTypeDropdown"]');
  
    if (select) {
      const options = await select.$$('option:not([value=""])');
      if (options.length > 0) {
        const values = await Promise.all(
          options.map((opt) => opt.getAttribute("value"))
        );
        const randomValue = values[Math.floor(Math.random() * values.length)];
        await select.selectOption(randomValue);
        console.log(`✅ Selected random Discount option: ${randomValue}`);
  
        await fillDiscountFieldsIfVisible(page);
        return;
      }
    }
  
    // If dropdown is missing or has no options — uncheck if currently selected
    const stillChecked = await tickImg.isVisible().catch(() => false);
    if (stillChecked) {
      const svg = parentDiv.locator("svg").first();
      const checkbox = svg.locator("..").first();
      await checkbox.click();
      console.log("✅ Unchecked: Discount (no options)");
    } else {
      console.log("ℹ️ Discount already unchecked (no options)");
    }
  }
  
  function getRandomDiscountData() {
    const names = [
      "Summer Special",
      "Winter Sale",
      "Black Friday",
      "Holiday Discount",
      "Flash Deal",
      "VIP Offer",
      "Clearance Sale",
      "New Customer",
      "Birthday Bonus",
      "Weekend Offer",
      "Limited Time",
      "Back to School",
      "End of Season",
      "Buy More Save More",
      "First Order",
      "Referral Bonus",
    ];
  
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomPrice = (Math.random() * 50).toFixed(2); // Between 0.00 and 50.00
    const type = Math.random() < 0.5 ? "percentage" : "amount"; // Randomly choose %
  
    return {
      name: randomName,
      price: randomPrice,
      type: type,
    };
  }
  
  export async function fillDiscountFieldsIfVisible(page) {
    const discountNameInput = page.locator('input[name="discountType"]');
    const discountValueInput = page.locator('input[name="discountValue"]');
    const discountTypeSelect = page.locator('select[name="discountAmountType"]');
  
    const isNameVisible = await discountNameInput.isVisible().catch(() => false);
    const isValueVisible = await discountValueInput
      .isVisible()
      .catch(() => false);
    const isTypeVisible = await discountTypeSelect.isVisible().catch(() => false);
  
    if (isNameVisible && isValueVisible && isTypeVisible) {
      const discount = getRandomDiscountData();
  
      await discountNameInput.fill(discount.name);
      await discountValueInput.fill(discount.price);
      await discountTypeSelect.selectOption(discount.type);
  
      console.log(
        `✅ Discount: ${discount.name}, ${discount.price} (${discount.type})`
      );
    } else {
      console.log("ℹ️ Discount fields not fully visible — skipping.");
    }
  }


  export async function applyRandomOptionalAddons(page) {
    const allOptions = [
      () => additionalLensTreatments(page),
      () => scratchResistantCoatings(page),
      () => edgeCoating(page),
      () => uvProtection(page),
      () => glassesProtectionPlan(page),
      () => shipping(page),
      () => miscellaneousFee(page),
      async () => {
        await discount(page);
        const data = await getRandomDiscountData();
        await fillDiscountFieldsIfVisible(page, data);
      }
    ];
  
    // Randomly shuffle and pick 3–5 options
    const howMany = Math.floor(Math.random() * 3) + 3; // will choose 3, 4, or 5
    const selectedOptions = allOptions.sort(() => 0.5 - Math.random()).slice(0, howMany);
  
    for (const option of selectedOptions) {
      await option();
      await enterRetailPriceIfVisible(page);
    }
  
    console.log(`✅ ${selectedOptions.length} optional add-ons applied randomly.`);
  }