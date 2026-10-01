import * as __import0 from "googleapis";
import __import1 from "path";
import * as __import2 from "stream";
import __import3 from "axios";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const __dirname = __pathDirname(__fileURLToPath(import.meta.url));
const { google } = __import0;
const path = __import1;
const { Readable } = __import2;
const axios = __import3;

const KEYFILEPATH = path.join(__dirname, "service-account.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: "v3", auth });

/**
 * Upload a buffer to Google Drive and make it public
 * @param {Buffer} buffer 
 * @param {string} filename 
 * @param {string} mimeType 
 * @returns {Promise<{webViewLink:string, webContentLink:string}>}
 */

async function uploadGdrive(url, fileName, mime) {
  try {
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
    });

    const driveService = google.drive({
      version: "v3",
      auth: await auth.getClient(),
    });

    const fileMetadata = { name: fileName };
    const media = {
      mimeType: mime || response.headers["content-type"],
      body: response.data,
    };

    const driveResponse = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    const fileId = driveResponse.data.id;

    await driveService.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    return {
      id: fileId,
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: `https://drive.google.com/uc?export=download&id=${fileId}`,
    };

  } catch (error) {
    console.error("❌ Error uploading file:", error.response?.data || error.message);
    throw error;
  }
}

async function uploadGdriveV2(buffer, filename, mimeType = "application/octet-stream") {
  try {
    const fileMetadata = { name: filename };
    const media = {
      mimeType,
      body: bufferToStream(buffer), // wrap buffer into readable stream
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name",
    });

    if (!file || !file.data || !file.data.id) throw new Error("Upload failed: No file ID returned");
    const fileId = file.data.id;

    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const result = await drive.files.get({
      fileId,
      fields: "webViewLink, webContentLink",
    });

    if (!result || !result.data) throw new Error("Failed to get file links");

    return result.data;

  } catch (err) {
    console.error("GDrive Upload Error:", err);
    return null;
  }
}

// Buffer → Stream converter
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * List all files in Drive root
 */
async function listAllFiles() {
  try {
    const res = await drive.files.list({
      pageSize: 1000,
      fields: "nextPageToken, files(id, name, mimeType, webViewLink, webContentLink)",
    });
    return res.data.files;
  } catch (err) {
    console.error("List Error:", err);
  }
}

/**
 * Delete a specific file by ID
 * @param {string} fileId 
 */
async function deleteFile(fileId) {
  try {
    await drive.files.delete({ fileId });
    console.log(`Deleted file: ${fileId}`);
  } catch (err) {
    console.error("Delete Error:", err);
  }
}

/**
 * Delete all files in Drive root
 */
async function deleteAllFiles() {
  try {
    const files = await listAllFiles();
    for (const file of files) {
      await drive.files.delete({ fileId: file.id });
      console.log(`Deleted: ${file.name}`);
    }
    console.log("All files deleted!");
  } catch (err) {
    console.error("Delete All Error:", err);
  }
}

export default {
  uploadGdrive,
  uploadGdriveV2,
  listAllFiles,
  deleteFile,
  deleteAllFiles,
};
