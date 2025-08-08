import mysql, { Connection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Define the interface for fetched data
export interface VisionData {
  visionPlan: string;
  lensType: string;
  collectionTitle: string;
  userId: number;
}

// DB config (you can move this to env vars)
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

console.log(dbConfig);

const tableName =
  process.env.DB_TEST_RESULT_TABLE_NAME || "playwright_test_results";

// 1 Create DB Connection
export async function createConnection(): Promise<Connection> {
  const connection = await mysql.createConnection(dbConfig);
  console.log("Database connected");
  return connection;
}

export async function ensureTestResultTableExists(connection: Connection) {
  const [tables] = await connection.query<mysql.RowDataPacket[]>(
    `SHOW TABLES LIKE ${mysql.escape(tableName)}`
  );

  if (tables.length > 0) {
    console.log(`✅ Table '${tableName}' already exists.`);
    return;
  }

  const createTableSQL = `
  CREATE TABLE \`${tableName}\` (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
    \`test_name\` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    \`run_by_user_id\` bigint unsigned DEFAULT NULL,
    \`vision_plan_title\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    \`lens_type_title\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    \`collection_title\` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    \`status\` enum('inprogress','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'inprogress',
    \`failure_message\` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    \`start_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    \`end_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`unique_test_run\` (\`test_name\`(100),\`run_by_user_id\`,\`vision_plan_title\`(100),\`lens_type_title\`(100),\`collection_title\`(100)),
    KEY \`run_by_user_id\` (\`run_by_user_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

  await connection.execute(createTableSQL);
  console.log(`✅ Table '${tableName}' created successfully.`);

  await connection.end();
}

// 2 Fetch Records Function

export async function fetchTestData(
  connection: Connection,
  userEmail?: string,
  visionPlan?: string
): Promise<VisionData[]> {

  await ensureTestResultTableExists(connection);
  
  let baseQuery = `
      SELECT 
        vp.title AS visionPlan, 
        lt.title AS lensType, 
        c.title AS collectionTitle, 
        u.id AS userId 
      FROM collections_permissions cp 
      JOIN users u ON u.id = cp.user_id 
      JOIN collections c ON c.id = cp.collection_id AND c.deleted_at IS NULL 
      JOIN brands b ON b.id = cp.brand_id 
      JOIN lense_types lt ON lt.id = b.lens_type_id 
      JOIN vision_plans vp ON vp.id = lt.vision_plan_id 
      WHERE cp.status = 'active'
        AND cp.deleted_at IS NULL 
        AND NOT EXISTS (
          SELECT 1 
          FROM ${tableName} er 
          WHERE er.run_by_user_id = u.id 
            AND er.vision_plan_title COLLATE utf8mb4_unicode_ci = vp.title COLLATE utf8mb4_unicode_ci
            AND er.lens_type_title COLLATE utf8mb4_unicode_ci = lt.title COLLATE utf8mb4_unicode_ci
            AND er.collection_title COLLATE utf8mb4_unicode_ci = c.title COLLATE utf8mb4_unicode_ci
        )
    `;

  const params: any[] = [];

  if (userEmail !== undefined) {
    baseQuery += " AND u.email = ?";
    params.push(userEmail);
  }

  if (visionPlan !== undefined) {
    baseQuery += " AND vp.title = ?";
    params.push(visionPlan);
  }

  baseQuery += " ORDER BY vp.title ASC, lt.title ASC, c.title ASC";

  baseQuery += " limit 2";

  const [rows] = await connection.execute(baseQuery, params);
  console.log(rows);
  return rows as VisionData[];
}

export async function updateTestResult(
  connection: Connection,
  userEmail: string,
  visionPlan: string,
  lensType: string,
  collectionTitle: string,
  status: string = 'complete',
  error?: Error
): Promise<void> {
  // Step 1: Get the user ID from email
  const [rows]: any = await connection.execute(
    `SELECT id FROM users WHERE email = ? LIMIT 1`,
    [userEmail]
  );

  if (!rows.length) {
    console.warn(`User with email ${userEmail} not found. Skipping insert.`);
    return;
  }

  const userId = rows[0].id;
  const testCaseName = "PlayWright Dyanmic Test Case";
  // Step 2: Insert test result
  const failureMessage = error?.message?.trim() ? error.message.trim() : null;


  const query = `
    INSERT INTO ${tableName} 
    (test_name, run_by_user_id, vision_plan_title, lens_type_title, collection_title, status, failure_message, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
  const values = [
    testCaseName,
    userId,
    visionPlan,
    lensType,
    collectionTitle,
    status, 
    failureMessage,
  ];

  await connection.execute(query, values);

  console.log(
    `Test result inserted for: ${visionPlan} > ${lensType} > ${collectionTitle} > ${status} (User: ${userEmail})`
  );
}

// 4 Close Connection Function
export async function closeConnection(connection: Connection): Promise<void> {
  await connection.end();
  console.log("Database connection closed");
}
