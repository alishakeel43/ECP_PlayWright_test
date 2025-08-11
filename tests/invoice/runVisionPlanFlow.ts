import { test } from "@playwright/test";
import {
  createConnection,
  fetchTestData,
  closeConnection,
  VisionData,
  updateTestResult,
} from "../helpers/db";
import { loginAndSaveStorage } from "../helpers/userLogin";
import { runVisionTest } from "./runSingleVisionTest";
import path from "path";
import fs from "fs";

export function defineVisionPlanTest(visionPlan: string) {
  let connection;
  let storageStatePath: string;
  let userEmail = "iwhipple-discard@gmail.com";
  let password = "Eyecare2024!";
  let testData: VisionData[] = [];

  test.describe(`${visionPlan} Vision Plan Test`, () => {
    test.setTimeout(0); // unlimited timeout

    test.beforeAll(async () => {
      connection = await createConnection();
      storageStatePath = await loginAndSaveStorage(userEmail, password);
      testData = await fetchTestData(connection, userEmail, visionPlan);

      // Ensure videos directory exists
      const videosDir = path.join(__dirname, "../videos");
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }
    });

    test(`Run ${visionPlan} Vision Plan Flow`, async ({ browser }) => {
      if (!testData.length) {
        console.warn(`⚠️ No test data found for ${visionPlan}.`);
        return;
      }

      for (const data of testData) {
        // Unique subfolder for each iteration video
        const videoDir = path.join(
          __dirname,
          "../videos",
          data.collectionTitle.replace(/[^\w\s-]/g, "_")
        );

        const context = await browser.newContext({
          storageState: storageStatePath,
          recordVideo: {
            dir: videoDir,
            size: { width: 1280, height: 720 },
          },
        });

        const page = await context.newPage();

        try {
          // Reconnect if connection is closed
          if (!connection || connection.connection?._closing) {
            console.warn("🔄 Reopening closed DB connection...");
            connection = await createConnection();
          }

          await runVisionTest(page, context, connection, userEmail, data);
        } catch (error) {
          console.error(
            `❌ Error in ${visionPlan} Vision test for ${data.collectionTitle}:`,
            error.message
          );

          const failureMessage = error?.message || "Unknown error";
          await updateTestResult(
            connection,
            userEmail,
            data.visionPlan,
            data.lensType,
            data.collectionTitle,
            "Failed",
            failureMessage
          );
        } finally {
          const videoPath = await page.video()?.path();
          console.log(`🎥 Video saved at: ${videoPath}`);

          await page.close();
          await context.close();
          await closeConnection(connection);
        }
      }
    });
  });
}
