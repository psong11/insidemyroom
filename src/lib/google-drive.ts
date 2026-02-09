import { google } from "googleapis";

/**
 * Normalize the private key: handle escaped newlines and ensure PEM headers.
 */
function normalizePrivateKey(raw: string | undefined): string {
  if (!raw) return "";

  // Replace literal \n sequences with actual newlines
  let key = raw.replace(/\\n/g, "\n");

  // If the key doesn't have PEM headers, wrap it
  if (!key.includes("-----BEGIN")) {
    key = `-----BEGIN PRIVATE KEY-----\n${key.trim()}\n-----END PRIVATE KEY-----\n`;
  }

  return key;
}

/**
 * Create an authenticated Google Drive client using service account credentials.
 */
function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (!email || !privateKey) {
    throw new Error(
      "Google credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local"
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * List all CSV files in the Pi_Weather_Station folder,
 * sorted by creation time (newest first).
 */
export async function listCSVFiles() {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID environment variable is not set");
  }

  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='text/csv' and trashed=false`,
    fields: "files(id, name, createdTime, modifiedTime, size)",
    orderBy: "createdTime desc",
    pageSize: 100,
  });

  return response.data.files || [];
}

/**
 * Download the contents of a single file by ID.
 */
export async function downloadFile(fileId: string): Promise<string> {
  const drive = getDriveClient();

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );

  return response.data as string;
}

/**
 * Fetch all CSV content from the Pi_Weather_Station folder.
 * Returns an array of raw CSV strings.
 */
export async function fetchAllCSVData(): Promise<string[]> {
  const files = await listCSVFiles();

  if (files.length === 0) {
    console.log("No CSV files found in the Google Drive folder.");
    return [];
  }

  console.log(`Found ${files.length} CSV files. Downloading...`);

  const contents = await Promise.all(
    files.map(async (file) => {
      try {
        return await downloadFile(file.id!);
      } catch (error) {
        console.error(`Failed to download ${file.name}:`, error);
        return "";
      }
    })
  );

  return contents.filter((c) => c.length > 0);
}
