import { test, expect, Page, BrowserContext } from "@playwright/test";
import { randomInt } from "crypto";
import { mockGetCollections } from "../apiMocker";

export let invoiceDetails = {
  name : Math.random().toString(36).substring(2, 8) ,
  price : '',
  status : '',
  customer : generateUserDetails(true)
};

// export let invoiceDetails = {
//   name: "wyd9ml",
//   price: "$315.74",
//   status: "Draft",
//   customer: {
//     email: "test.user@yopmail.com",
//     firstName: "Test",
//     lastName: "Playwright",
//     phone : '(030) 123-4567'
//   },
// };

// Utility to get a random number in range
export function getRandomInt(min = 10, max = 50) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Simple random string generator
function getRandomName(prefix = "user") {
  return `${prefix}_${Math.random().toString(36).substring(2, 8)}`;
}

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random date of birth between 1970-01-01 and 2005-12-31
function getRandomDOB() {
  const start = new Date(1990, 0, 1).getTime();
  const end = new Date(2005, 11, 31).getTime();
  const randomDate = new Date(getRandomInt(start, end));
  return randomDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD
}

// Random Pakistani-style phone number
function getRandomPhone() {
  const prefix = ["030", "031", "032", "033", "034"][getRandomInt(0, 4)];
  const suffix = getRandomInt(10000000, 99999999);
  return `(${prefix}) ${suffix.toString().slice(0, 3)}-${suffix
    .toString()
    .slice(3)}`;
}

export async function createCustomer(page: Page, customerDetails: Object) {
  const { firstName, lastName, dob, email, phone } = customerDetails;
  await page.getByRole("textbox", { name: "Enter first name" }).fill(firstName);
  await page.getByRole("textbox", { name: "Enter last name" }).fill(lastName);
  await page.getByPlaceholder("Enter date of birth").fill(dob);
  await page.getByRole("textbox", { name: "Enter email address" }).fill(email);
  await page.getByRole("textbox", { name: "Enter Phone" }).fill(phone);

  await page.getByRole("button", { name: "New Glasses Order" }).click();
  await expect(page.getByText("Create Invoice")).toBeVisible();
}

export async function addInvoiceDetails(page: Page) {
  
  await page
    .getByRole("combobox", { name: "Select Invoice Name" })
    .fill(invoiceDetails.name);
  await page.getByRole("combobox", { name: "Select Staff Name" }).click();
  const options = page.locator(
    ".rc-virtual-list-holder-inner .ant-select-item"
  );
  // Get total number of options
  const count = await options.count();
  // Choose a random index
  const randomIndex = Math.floor(Math.random() * count);
  // Click the randomly selected option
  await options.nth(randomIndex).click();
}

export async function completeOtherFields(page: Page) {
  // Reuse your dynamic utilities here

  await page.locator('input[name="isFrameBenifit"]').first().check(); // YES
  await page.locator('input[name="isLensBenifit"]').first().check(); // YES

  // Davis Spectacle Lens Copay Price

  await fillIfExists(page, "#materialCopay", getRandomInt(10, 50));
  await fillIfExists(page, "#frameRetailFee", getRandomInt(10, 50));

  await checkRandomOption(page, 'input[name="frameOrderType"]');

  const isRetailFeeVisible = await page
    .getByText("Retail fee of frame")
    .isVisible()
    .catch(() => false);

  if (isRetailFeeVisible) {
    // Example: fill value near the text isRetailFeeVisible
    await page.locator("#frameRetailFee").fill(getRandomInt(10, 50).toString());
  }

  const isFrameContribution = await page
    .getByText("Frame Contribution")
    .isVisible()
    .catch(() => false);

  if (isFrameContribution) {
    // Example: fill value near the text frameContribution
    await page
      .locator("#frameContribution")
      .fill(getRandomInt(10, 50).toString());
  }

  await page.locator("svg").nth(1).click();
  await fillIfExists(page, "#drillMountValue", getRandomInt(10, 50));
  await page.locator("svg").nth(2).click();

  await checkRandomOption(page, 'input[name="oversizedLensType"]');

  await fillIfExists(page, "#oversizedLensPrice", getRandomInt(10, 50));

  await checkRandomOption(page, '#lensMaterial input[type="radio"]');

  await fillIfExists(page, "#lensMaterialValue", getRandomInt(10, 50));

  const lensMaterialSection = page
    .locator("text=Lens Material Copay")
    .locator("..")
    .locator("..");

  // Find the "% of U&C" or SVG icon inside that section
  const ucOption = lensMaterialSection.getByText("% of U&C", { exact: false });

  // Click if exists
  if ((await ucOption.count()) > 0) {
    if (Math.random() < 0.5) {
      await ucOption.first().click();
    }
  }

  await checkRandomOption(page, 'input[name="isPhotochromics"]');
  await checkRandomOption(page, 'input[name="photochromicsType"]');
  await fillIfExists(page, "#photochromicValue", getRandomInt(10, 50));

  // Locate the section based on the label "Photochromic Copay"
  const photochromicSection = page
    .locator("text=Photochromic Copay")
    .locator("..")
    .locator("..");

  // Find and click the SVG near "80% of U&C" in that section
  const photochromicSectionUcSvg = photochromicSection.locator("svg");

  if ((await photochromicSectionUcSvg.count()) > 0) {
    if (Math.random() < 0.5) {
      await photochromicSectionUcSvg.first().click();
    }
  }

  await checkRandomOption(page, 'input[name="isAntireflective"]');
  await checkRandomOption(page, '#antireflectiveType input[type="radio"]');
  await fillIfExists(page, "#antireflectiveValue", getRandomInt(10, 50));

  // Locate the "Anti-Reflective Copay" section
  const antiReflectiveSection = page
    .locator("text=Anti-Reflective Copay")
    .locator("..")
    .locator("..");

  // Click the SVG checkbox next to "80% of U&C"
  const antireflectiveucSvg = antiReflectiveSection.locator("svg");
  if ((await antireflectiveucSvg.count()) > 0) {
    if (Math.random() < 0.5) {
      await antireflectiveucSvg.first().click();
    }
  }

  await page
    .locator("div")
    .filter({ hasText: /^Select Options$/ })
    .getByRole("img")
    .click();

  await sunGlassesAndTint(page);
  // await clickRandomElementsAndFillIfInputVisible(
  //   page,
  //   "div.I3oZ\\+coF\\+hCFDDUUpJhGQQ\\=\\= > svg",
  //   3
  // );

  console.log("Start blue light section");

  // Step 1: Click the Blue Light Filter card using text + surrounding div
  await page.getByText("Blue Light Filter", { exact: true }).first().click();

  // Locate and click the radio input with value "Blue Light Filter"
  await page
    .locator('input[type="radio"][value="Blue Light Filter"]')
    .click({ force: true });

  // Optionally: Fill the copay field if it's visible
  await fillIfExists(page, "#bluelightfilterPrice", getRandomInt(10, 50));

  console.log("End blue light section");
  // await checkRandomOption(page, 'input[name="isLoweredCopay"]');

  // const isLoweredCopayChecked = await page
  //   .locator('input[name="isLoweredCopay"]')
  //   .nth(1)
  //   .isChecked()
  //   .catch(() => false);

  // console.log("value of isLoweredCopayChecked:", isLoweredCopayChecked);

  // if (!isLoweredCopayChecked) {
  //   await handleMultipleLowerCopays(page);
  // }
}

export async function fillInputsNearDollarSigns(page, min = 1, max = 50) {
  const dollarDivs = page.locator("div", { hasText: /^\s*\$\s*$/ }); // Matches exact "$"
  const count = await dollarDivs.count();

  for (let i = 0; i < count; i++) {
    const dollarDiv = dollarDivs.nth(i);

    // Get parent element of the dollar sign
    const parent = dollarDiv.locator("..");
    const inputInParent = parent.locator("input");

    if (await inputInParent.count()) {
      await inputInParent.first().fill(getRandomInt(min, max));
    } else {
      // Try fallback: find input right after the $ in DOM
      const nextInput = dollarDiv.locator("xpath=following::input[1]");
      if (await nextInput.count()) {
        await nextInput.first().fill(getRandomInt(min, max));
      }
    }
  }
}

export async function checkRandomOption(
  page,
  selector,
  specificIndex?: number
) {
  console.log("[DEBUG] Selector received:", selector);

  const options = page.locator(selector);
  const count = await options.count();

  console.log("[DEBUG] Total checkable options found:", count);

  if (count === 0) {
    console.warn(`[WARN] No elements found for selector: ${selector}`);
    return;
  }

  // Use specificIndex if provided and valid
  if (typeof specificIndex === 'number' && specificIndex >= 0 && specificIndex < count) {
    const element = options.nth(specificIndex);
    const isDisabled = await element.isDisabled();

    if (!isDisabled) {
      await element.check();
      console.log(`[DEBUG] Checked specific option at index ${specificIndex}`);
      return;
    } else {
      console.warn(`[WARN] Option at index ${specificIndex} is disabled. Falling back to random.`);
    }
  }

  // Attempt to find a random enabled option
  const maxAttempts = count;
  let randomIndex = -1;

  for (let i = 0; i < maxAttempts; i++) {
    const index = Math.floor(Math.random() * count);
    const element = options.nth(index);
    const isDisabled = await element.isDisabled();

    if (!isDisabled) {
      randomIndex = index;
      await element.check();
      console.log(`Checked random option at index ${randomIndex}`);
      return;
    } else {
      console.log(`Skipped disabled option at index ${index}`);
    }
  }

  throw new Error("No enabled option was found to check.");
}


export async function clickRandomElementsAndFillIfInputVisible(
  page,
  selector,
  maxClicks
) {
  const elements = page.locator(selector);
  const count = await elements.count();

  if (count === 0)
    throw new Error(`No elements found for selector: ${selector}`);

  const totalClicks = maxClicks && maxClicks <= count ? maxClicks : count;

  // Generate unique random indexes
  const indexes: number[] = [];
  while (indexes.length < totalClicks) {
    const random = Math.floor(Math.random() * count);
    if (!indexes.includes(random)) indexes.push(random);
  }

  for (const index of indexes) {
    const element = elements.nth(index);
    await element.click();

    // Wait briefly for potential input to appear
    await page.waitForTimeout(300);

    // Try to find nearby input (e.g., in same parent or next sibling)
    const input = element
      .locator("xpath=ancestor::div[1]//input | following-sibling::div//input")
      .first();
    if (await input.isVisible().catch(() => false)) {
      const randomValue = `$${getRandomInt(10, 50)}`; // e.g. $37
      await input.fill(randomValue);
    }
  }
}

export function generateUserDetails(isLocal: boolean) {
  const firstNames = ["Ali", "Umar", "Ahmed", "Zeeshan", "Tariq"];
  const lastNames = ["Khan", "Raza", "Qureshi", "Butt", "Malik"];

  isLocal = false;
  if (isLocal) {
    return {
      firstName: "Test",
      lastName: "Playwright",
      dob: "2000-01-01",
      email: "test.user@yopmail.com",
      phone: "(030) 123-4567",
    };
  } else {
    const firstName = getRandomFromArray(firstNames);
    const lastName = getRandomFromArray(lastNames);
    return {
      firstName,
      lastName,
      dob: getRandomDOB(),
      email: `${firstName}.${lastName}${Date.now()}@yopmail.com`,
      phone: getRandomPhone(),
    };
  }
}

export async function fillIfExists(page, fieldSelector, value) {
  try {
    const locator = page.locator(fieldSelector);
    const isFieldPresent = await locator.count();

    if (isFieldPresent > 0) {
      await locator.fill(value.toString());
    }
  } catch (error) {
    console.error(`Error filling field ${fieldSelector}:`, error);
  }
}

export async function enterRetailPriceIfVisible(page, min = 10, max = 50) {
  const input = page.getByPlaceholder("Enter Retail Price");
  const okButton = page.getByRole("button", { name: "OK" });

  const isInputVisible = await input.isVisible().catch(() => false);
  const isOkVisible = await okButton.isVisible().catch(() => false);

  // ✅ Proceed only if BOTH are visible
  if (isInputVisible && isOkVisible) {
    await input.click();

    const randomPrice = Math.floor(Math.random() * (max - min + 1)) + min;
    await input.fill(randomPrice.toString());

    await okButton.click();
    console.log(`✅ Retail price entered: $${randomPrice}`);
  } else {
    console.log(
      "ℹ️ Retail price modal skipped — input or OK button not visible."
    );
  }
}

export async function handleCopaySection(page) {
  // Step 1: Select "Yes" for isLoweredCopay if available
  const loweredCopayYes = page.locator(
    'input[name="isLoweredCopay"][value="Yes"]'
  );
  if (await loweredCopayYes.isVisible().catch(() => false)) {
    if (!(await loweredCopayYes.isChecked())) {
      await loweredCopayYes.check();
      console.log("✅ Selected: Lowered Copay = Yes");
    }
  }

  // Step 2: Wait and find copay options
  await page.waitForTimeout(500);
  const copayOptionBoxes = page.locator(
    'div[class*="_8dTrcZBGSy46stXhGLoGhA"] div[tabindex="0"][style*="cursor: pointer"]'
  );

  const count = await copayOptionBoxes.count();
  if (count > 0) {
    const randomIndex = Math.floor(Math.random() * count);
    await copayOptionBoxes.nth(randomIndex).click();
    console.log("✅ Clicked a random copay option");
  } else {
    // If no options, try to select "No" for isLoweredCopay
    const loweredCopayNo = page.locator(
      'input[name="isLoweredCopay"][value="No"]'
    );
    if (
      (await loweredCopayNo.isVisible().catch(() => false)) &&
      !(await loweredCopayNo.isChecked())
    ) {
      await loweredCopayNo.check();
      console.log(
        "⚠️ Switched to Lowered Copay = No due to no options available"
      );
    }
  }

  // Step 3: Randomly select from isCopay...Amount radio groups
  const radioInputs = await page
    .locator('input[name^="isCopay"][name$="Amount"]')
    .all();
  const grouped = {};

  for (const radio of radioInputs) {
    const name = await radio.getAttribute("name");
    if (!name) continue;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(radio);
  }

  for (const group of Object.values(grouped)) {
    const randomRadio = group[Math.floor(Math.random() * group.length)];
    if (!(await randomRadio.isChecked())) {
      await randomRadio.check();
    }
  }

  // Step 4: After delay, fill copay inputs (copay...Amount) with random values
  await page.waitForTimeout(2000);
  const copayInputs = await page
    .locator('input[id^="copay"][id$="Amount"]')
    .all();

  for (const input of copayInputs) {
    const randomValue = (Math.floor(Math.random() * 100) + 1).toString();
    await input.fill(randomValue);
  }

  console.log("✅ All copay radios and inputs handled");
}

export async function sunGlassesAndTint(page: Page) {
  // 1. Locate the main container by class (escaped)
  const container = page.locator("div._7LmH3HxOFN8a3vDMSU9D1Q\\=\\=");

  // 2. Locate only clickable options (not disabled ones)
  const optionLocator = container.locator(
    'div[tabindex="0"][style*="cursor: pointer"]'
  );
  const optionCount = await optionLocator.count();

  // 3. Shuffle and click up to 3 visible options
  const indexes = Array.from({ length: optionCount }, (_, i) => i).sort(
    () => Math.random() - 0.5
  );
  let clicked = 0;

  for (let i = 0; i < indexes.length && clicked < 3; i++) {
    const option = optionLocator.nth(indexes[i]);
    if (await option.isVisible()) {
      await option.click();
      clicked++;
    }
  }

  // 4. Fill only visible input[type="text"] fields in the same container
  const inputLocator = container.locator('input[type="text"]');
  const inputCount = await inputLocator.count();

  for (let i = 0; i < inputCount; i++) {
    const input = inputLocator.nth(i);
    if (await input.isVisible()) {
      const value = (Math.floor(Math.random() * 20) + 1).toString();
      await input.fill(value);
    }
  }
}

// export async function additionalLensTreatments(page: Page) {
//   // 1. Click on "Additional Lens Treatments"
//   console.log("start --- Additional Lens Treatments");
//   await page.getByText("Additional Lens Treatments", { exact: true }).click();

//   // Wait for conditional elements to appear
//   await page.waitForTimeout(1000); // Can be replaced with smarter wait logic if needed

//   // 2. Check and click "Slab Off"
//   const slabOff = page.getByText("Slab Off", { exact: true });

//   if (await slabOff.isVisible()) {
//     await slabOff.click();
//     // 3. Enter value in "Slab Off Copay" input
//     await enterRetailPriceIfVisible(page);
//     await fillIfExists(page, "input#slabOffPrice", getRandomInt(10, 50));
//   }

//   // 4. Check and click "Polish"
//   const polish = page.getByText("Polish", { exact: true });
//   if (await polish.isVisible()) {
//     await polish.click();

//     // 5. Select Polish Type — either "Edge Polish" or "Roll & Polish"

//     await polishOptionSection(page);
//     // Step 1: Define all possible polish options

//     await fillIfExists(page, "input#polishPrice", getRandomInt(10, 50)); // You can use random or parameterized value
//   }
// }

// async function polishOptionSection(page) {
//   const polishOptions = ["Edge Polish", "Roll & Polish"];
//   let visiblePolish = [];

//   // Step 2: Loop to collect all visible polish options
//   for (const option of polishOptions) {
//     const polishLocator = page.getByText(option, { exact: true });
//     if (await polishLocator.isVisible()) {
//       visiblePolish.push(polishLocator);
//     }
//   }

//   // Step 3: Handle logic based on presence of visible options
//   if (visiblePolish.length > 0) {
//     // Randomly select one visible polish option
//     const randomIndex = Math.floor(Math.random() * visiblePolish.length);
//     const selectedPolish = visiblePolish[randomIndex];

//     await enterRetailPriceIfVisible(page); // Your custom logic
//     await selectedPolish.click();
//   } else {
//     // Step 4: Uncheck the polish section (if it's a checkbox or toggle)
//     const polishToggle = page.getByText("Polish", { exact: true });
//     if (await polishToggle.isVisible()) {
//       await polishToggle.click();
//     }
//   }
// }

// export async function scratchResistantCoatings(page: Page) {
//   // 1. Check and click "Scratch Resistant Coatings"
//   const scratchResistantOption = page.getByText("Scratch Resistant Coatings", {
//     exact: true,
//   });
//   if (await scratchResistantOption.isVisible()) {
//     await scratchResistantOption.click();

//     // Get all scratchedType radio buttons and select random option
//     await checkRandomOption(page, 'input[name="scratchedType"]');
//     // 2. Enter value in "Scratch Resistant Copay" input
//     await fillIfExists(page, "input#scratchedPrice", getRandomInt(10, 50)); // You can use random or parameterized value
//   }
// }

// export async function edgeCoating(page: Page) {
//   // 1. Check and click "Edge Coating"
//   const edgeCoating = page.getByText("Edge Coating", {
//     exact: true,
//   });
//   if (await edgeCoating.isVisible()) {
//     await edgeCoating.click();
//     await enterRetailPriceIfVisible(page);
//   }
// }

// export async function uvProtection(page: Page) {
//   // 1. Check and click "UV Protection"
//   const uvProtection = page.getByText("UV Protection", {
//     exact: true,
//   });
//   if (await uvProtection.isVisible()) {
//     await uvProtection.click();
//     await enterRetailPriceIfVisible(page);
//   }
// }

// export async function glassesProtectionPlan(page) {
//   // Step 1: Check the checkbox only if not already checked
//   const label = await page.getByText("Glasses Protection Plan", {
//     exact: true,
//   });

//   if (!(await label.isVisible().catch(() => false))) {
//     console.log("❌ Label not found: Glasses Protection Plan");
//     return;
//   }

//   const parentDiv = await label.locator("..").first();
//   const tickImg = parentDiv.locator('img[src*="tick-green.svg"]');
//   const isAlreadyChecked = await tickImg.isVisible().catch(() => false);

//   if (!isAlreadyChecked) {
//     const svg = parentDiv.locator("svg").first();
//     const checkbox = svg.locator("..").first();
//     await checkbox.click();
//     console.log("✅ Checked: Glasses Protection Plan");
//   } else {
//     console.log("ℹ️ Already checked: Glasses Protection Plan");
//   }

//   // Step 2: Try to select a random option from the select dropdown
//   const select = await page.$('select[name="protectionPlanType"]');

//   if (select) {
//     const options = await select.$$('option:not([value=""])');
//     if (options.length > 0) {
//       const values = await Promise.all(
//         options.map((opt) => opt.getAttribute("value"))
//       );
//       const randomValue = values[Math.floor(Math.random() * values.length)];
//       await select.selectOption(randomValue);
//       console.log(`✅ Selected random protection plan: ${randomValue}`);
//       return;
//     }
//   }

//   // If no valid options exist, uncheck the checkbox if it's selected
//   const stillChecked = await tickImg.isVisible().catch(() => false);
//   if (stillChecked) {
//     const svg = parentDiv.locator("svg").first();
//     const checkbox = svg.locator("..").first();
//     await checkbox.click();
//     console.log("✅ Unchecked: Glasses Protection Plan (no options)");
//   } else {
//     console.log("ℹ️ Already unchecked: Glasses Protection Plan (no options)");
//   }
// }

// export async function shipping(page) {
//   const label = await page.getByText("Shipping", { exact: true });

//   if (!(await label.isVisible().catch(() => false))) {
//     console.log("❌ Label not found: Shipping");
//     return;
//   }

//   const parentDiv = await label.locator("..").first();
//   const tickImg = parentDiv.locator('img[src*="tick-green.svg"]');
//   const isChecked = await tickImg.isVisible().catch(() => false);

//   // Step 1: Check the Shipping box if not already checked
//   if (!isChecked) {
//     const svg = parentDiv.locator("svg").first();
//     const checkbox = svg.locator("..").first();
//     await checkbox.click();
//     console.log("✅ Checked: Shipping");
//   } else {
//     console.log("ℹ️ Already checked: Shipping");
//   }

//   // Step 2: Try to select a random option from the dropdown
//   const select = await page.$('select[name="shippingType"]');

//   if (select) {
//     const options = await select.$$('option:not([value=""])');
//     if (options.length > 0) {
//       const values = await Promise.all(
//         options.map((opt) => opt.getAttribute("value"))
//       );
//       const randomValue = values[Math.floor(Math.random() * values.length)];
//       await select.selectOption(randomValue);
//       console.log(`✅ Selected random shipping option: ${randomValue}`);
//       return;
//     }
//   }

//   // If dropdown is missing or has no options — uncheck if currently selected
//   const stillChecked = await tickImg.isVisible().catch(() => false);
//   if (stillChecked) {
//     const svg = parentDiv.locator("svg").first();
//     const checkbox = svg.locator("..").first();
//     await checkbox.click();
//     console.log("✅ Unchecked: Shipping (no options)");
//   } else {
//     console.log("ℹ️ Shipping already unchecked (no options)");
//   }
// }

// export async function miscellaneousFee(page) {
//   const label = await page.getByText("Miscellaneous Fee", { exact: true });

//   if (!(await label.isVisible().catch(() => false))) {
//     console.log("❌ Label not found: Miscellaneous Fee");
//     return;
//   }

//   const parentDiv = await label.locator("..").first();
//   const tickImg = parentDiv.locator('img[src*="tick-green.svg"]');
//   const isChecked = await tickImg.isVisible().catch(() => false);

//   // Step 1: Check the Miscellaneous Fee box if not already checked
//   if (!isChecked) {
//     const svg = parentDiv.locator("svg").first();
//     const checkbox = svg.locator("..").first();
//     await checkbox.click();
//     console.log("✅ Checked: Miscellaneous Fee");
//   } else {
//     console.log("ℹ️ Already checked: Miscellaneous Fee");
//   }

//   // Step 2: Try to select a random option from the dropdown
//   const select = await page.$('select[name="miscType"]');

//   if (select) {
//     const options = await select.$$('option:not([value=""])');
//     if (options.length > 0) {
//       const values = await Promise.all(
//         options.map((opt) => opt.getAttribute("value"))
//       );
//       const randomValue = values[Math.floor(Math.random() * values.length)];
//       await select.selectOption(randomValue);
//       console.log(
//         `✅ Selected random Miscellaneous Fee option: ${randomValue}`
//       );
//       return;
//     }
//   }

//   // If dropdown is missing or has no options — uncheck if currently selected
//   const stillChecked = await tickImg.isVisible().catch(() => false);
//   if (stillChecked) {
//     const svg = parentDiv.locator("svg").first();
//     const checkbox = svg.locator("..").first();
//     await checkbox.click();
//     console.log("✅ Unchecked: Miscellaneous Fee (no options)");
//   } else {
//     console.log("ℹ️ Miscellaneous Fee already unchecked (no options)");
//   }
// }

// export async function discount(page) {
//   const label = await page.getByText("Discount", { exact: true });

//   if (!(await label.isVisible().catch(() => false))) {
//     console.log("❌ Label not found: Discount");
//     return;
//   }

//   const parentDiv = await label.locator("..").first();
//   const tickImg = parentDiv.locator('img[src*="tick-green.svg"]');
//   const isChecked = await tickImg.isVisible().catch(() => false);

//   // Step 1: Check the Discount box if not already checked
//   if (!isChecked) {
//     const svg = parentDiv.locator("svg").first();
//     const checkbox = svg.locator("..").first();
//     await checkbox.click();
//     console.log("✅ Checked: Discount");
//   } else {
//     console.log("ℹ️ Already checked: Discount");
//   }

//   // Step 2: Try to select a random option from the dropdown
//   const select = await page.$('select[name="discountTypeDropdown"]');

//   if (select) {
//     const options = await select.$$('option:not([value=""])');
//     if (options.length > 0) {
//       const values = await Promise.all(
//         options.map((opt) => opt.getAttribute("value"))
//       );
//       const randomValue = values[Math.floor(Math.random() * values.length)];
//       await select.selectOption(randomValue);
//       console.log(`✅ Selected random Discount option: ${randomValue}`);

//       await fillDiscountFieldsIfVisible(page);
//       return;
//     }
//   }

//   // If dropdown is missing or has no options — uncheck if currently selected
//   const stillChecked = await tickImg.isVisible().catch(() => false);
//   if (stillChecked) {
//     const svg = parentDiv.locator("svg").first();
//     const checkbox = svg.locator("..").first();
//     await checkbox.click();
//     console.log("✅ Unchecked: Discount (no options)");
//   } else {
//     console.log("ℹ️ Discount already unchecked (no options)");
//   }
// }

// function getRandomDiscountData() {
//   const names = [
//     "Summer Special",
//     "Winter Sale",
//     "Black Friday",
//     "Holiday Discount",
//     "Flash Deal",
//     "VIP Offer",
//     "Clearance Sale",
//     "New Customer",
//     "Birthday Bonus",
//     "Weekend Offer",
//     "Limited Time",
//     "Back to School",
//     "End of Season",
//     "Buy More Save More",
//     "First Order",
//     "Referral Bonus",
//   ];

//   const randomName = names[Math.floor(Math.random() * names.length)];
//   const randomPrice = (Math.random() * 50).toFixed(2); // Between 0.00 and 50.00
//   const type = Math.random() < 0.5 ? "percentage" : "amount"; // Randomly choose %

//   return {
//     name: randomName,
//     price: randomPrice,
//     type: type,
//   };
// }

// async function fillDiscountFieldsIfVisible(page) {
//   const discountNameInput = page.locator('input[name="discountType"]');
//   const discountValueInput = page.locator('input[name="discountValue"]');
//   const discountTypeSelect = page.locator('select[name="discountAmountType"]');

//   const isNameVisible = await discountNameInput.isVisible().catch(() => false);
//   const isValueVisible = await discountValueInput
//     .isVisible()
//     .catch(() => false);
//   const isTypeVisible = await discountTypeSelect.isVisible().catch(() => false);

//   if (isNameVisible && isValueVisible && isTypeVisible) {
//     const discount = getRandomDiscountData();

//     await discountNameInput.fill(discount.name);
//     await discountValueInput.fill(discount.price);
//     await discountTypeSelect.selectOption(discount.type);

//     console.log(
//       `✅ Discount: ${discount.name}, ${discount.price} (${discount.type})`
//     );
//   } else {
//     console.log("ℹ️ Discount fields not fully visible — skipping.");
//   }
// }
