import __import0 from "fs";
import __import1 from "path";
import * as __import2 from "googleapis";
import * as __import3 from "uuid";
import { fileURLToPath } from "node:url";
/*
  youtube_upload.js
  - Node.js helper to upload a quoted WhatsApp video (m.quoted.download()) to YouTube
  - Requires: googleapis v>=39, node >=14
  - Usage: see bottom of file for example

  What this file provides:
    - getOAuth2Client(): loads credentials.json + token.json (standard Google OAuth2 files)
    - uploadQuotedVideo(m, options): downloads the quoted media using m.quoted.download(), writes a temp file and uploads to YouTube using resumable media upload

  Notes:
    - Put your Google API OAuth client credentials in ./credentials.json (from Google Cloud Console)
    - After first run you must obtain tokens (the code includes a helper to generate the consent URL if token.json is missing)
    - token.json stores refresh/access tokens
    - For scheduling: pass publishAt as an ISO 8601 string in the future (e.g. new Date('2025-10-05T12:00:00Z').toISOString())
    - privacy can be 'public' | 'unlisted' | 'private'
*/

const fs = __import0;
const path = __import1;
const { google } = __import2;
const { v4: uuidv4 } = __import3;

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const CRED_PATH = path.resolve(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.resolve(process.cwd(), 'token.json');

/**
 * Get OAuth2 client. If token.json doesn't exist, it prints a URL - visit it and paste code to get token
 */
async function getOAuth2Client() {
  if (!fs.existsSync(CRED_PATH)) throw new Error('Missing credentials.json in project root. Create OAuth client credentials in Google Cloud Console.');

  const content = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = content.installed || content.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // If token exists, use it
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Otherwise, generate a URL and ask user to exchange code -> token
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\nNo token.json found. Visit this URL to authorize the application:');
  console.log(authUrl);
  console.log('\nAfter approving, you will get a code. Run `node youtube_upload.js --get-token YOUR_CODE` to save token.json');
  return oAuth2Client;
}

/**
 * Exchange code for token and save it (helper)
 */
async function getAndSaveToken(code) {
  const content = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = content.installed || content.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('Token stored to', TOKEN_PATH);
}

/**
 * uploadQuotedVideo
 * - m: message object (expects m.quoted.download() to be an async fn returning a Buffer or stream)
 * - options: { title, description, privacy = 'public', publishAt = null }
 *    publishAt: ISO string in UTC (e.g. '2025-10-05T12:00:00Z') - if set, video will be scheduled
 */
async function uploadQuotedVideo(m, options = {}) {
  if (!m?.quoted?.download) throw new Error('Message object must have m.quoted.download() method');
  const { title = 'Untitled', description = '', privacy = 'public', publishAt = null } = options;

  // Get auth
  const auth = await getOAuth2Client();
  const oauth2Client = auth.credentials ? auth : auth; // alias

  // Ensure we have a valid token (if token missing getOAuth2Client printed a URL and returned client without token)
  if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
    throw new Error('No token available. Create token.json first by running the auth flow (see README in this file).');
  }

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  // Download quoted media
  const bufferOrStream = await m.quoted.download();

  // Save to temporary file
  const tempDir = path.resolve(process.cwd(), 'tmp_uploads');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const fileId = uuidv4();
  const ext = detectExtensionFromMime(m.quoted.mimetype) || '.mp4';
  const tempPath = path.join(tempDir, `${fileId}${ext}`);

  // If buffer
  if (Buffer.isBuffer(bufferOrStream)) {
    await fs.promises.writeFile(tempPath, bufferOrStream);
  } else if (typeof bufferOrStream.pipe === 'function') {
    // it's a stream
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(tempPath);
      bufferOrStream.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
    });
  } else {
    throw new Error('m.quoted.download() must return a Buffer or Stream');
  }

  // Prepare request body
  const resource = {
    snippet: {
      title: title,
      description: description,
    },
    status: {
      privacyStatus: mapPrivacy(privacy),
    },
  };

  if (publishAt) {
    // publishAt must be RFC3339 / ISO string and in the future
    resource.status.publishAt = new Date(publishAt).toISOString();
    // YouTube scheduling works when privacyStatus is 'private' and publishAt is specified
    if (resource.status.privacyStatus !== 'private') {
      // override to private to schedule
      resource.status.privacyStatus = 'private';
    }
  }

  // Use resumable upload to support big files
  const fileSize = fs.statSync(tempPath).size;

  try {
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: resource,
      media: {
        body: fs.createReadStream(tempPath),
      },
      // Use onUploadProgress only available in browser / axios adapter context; node client handles resumable automatically
    });

    // Clean up temp file
    try { fs.unlinkSync(tempPath); } catch (e) { /* ignore */ }

    return res.data; // contains id, snippet, status
  } catch (e) {
    // cleanup
    try { fs.unlinkSync(tempPath); } catch (err) { }
    throw e;
  }
}

function mapPrivacy(privacy) {
  const p = String(privacy || '').toLowerCase();
  if (p === 'public') return 'public';
  if (p === 'unlisted') return 'unlisted';
  if (p === 'private') return 'private';
  // fallback
  return 'public';
}

function detectExtensionFromMime(mime) {
  if (!mime) return null;
  if (mime.includes('mp4')) return '.mp4';
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('3gpp') || mime.includes('3gp')) return '.3gp';
  if (mime.includes('mov')) return '.mov';
  return null;
}

// --- Example usage (uncomment to run directly) ---
// node youtube_upload.js --get-token CODE
// node youtube_upload.js --example

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // quick CLI helpers
  const argv = process.argv.slice(2);
  if (argv[0] === '--get-token' && argv[1]) {
    getAndSaveToken(argv[1]).catch(console.error);
  }

  if (argv[0] === '--example') {
    console.log('Example run not provided here because this file expects a WhatsApp `m` object from your bot.');
    console.log('Use the exported uploadQuotedVideo() in your message handler:');
    console.log(`\nimport { uploadQuotedVideo } from './youtube.js';\n// inside your handler async function onMessage(m) { if (m.quoted) await uploadQuotedVideo(m, { title: 'My Title', description: 'desc', privacy: 'private', publishAt: '2025-10-05T12:00:00Z' }); }`);
  }
}

export { getOAuth2Client, uploadQuotedVideo };
export default { getOAuth2Client, uploadQuotedVideo };
