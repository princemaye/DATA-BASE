const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidNormalizedUser,
    fetchLatestBaileysVersion,
    getContentType,
    Browsers,
    getAggregateVotesInPollMessage,
    makeCacheableSignalKeyStore,
    receivedPendingNotifications,
    generateWAMessageFromContent,
    generateForwardMessageContent,
    getDevice,
    prepareWAMessageMedia,
    proto,
    downloadContentFromMessage,
    jidDecode,
    makeInMemoryStore
    } = require('prince-baileys');


const fs = require('fs');
const P = require('pino');
const config = require('./config');

const qrcode = require('qrcode-terminal');
const NodeCache = require('node-cache');
const util = require('util');
const axios = require('axios');
const { File } = require('megajs');
const path = require('path');
const chalk = require("chalk");
const os = require('os');
const { MongoClient } = require('mongodb');
const { Pool } = require('pg');
const { execSync, exec } = require("child_process");
const zlib = require('zlib');
const msgRetryCounterCache = new NodeCache();
const groupCache = new NodeCache({
  stdTTL: 60 * 5,
  checkperiod: 60
});

const l = console.log;
const { cmd, commands } = require('./command');

const SESSION_NAME = config.SESSION_NAME || 'ymd_session'
const sessionFolder = path.join(__dirname, SESSION_NAME);
const sessionFile = path.join(sessionFolder, 'creds.json');
const readySession = path.join(__dirname, "session.json");

function base64Decode(encoded) {
  try {
    const buffer = Buffer.from(encoded, 'base64');
    return buffer.toString('utf-8');
  } catch (error) {
    return '❌ Error decoding Base64: ' + error.message;
  }
}

function getCredFiles(folder) {
  return fs.readdirSync(folder)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(folder, file));
}
const WarningDB = require('./lib/warning_db');
var session = false
//===================SESSION============================
if (!fs.existsSync(sessionFile)) {
    if (config.SESSION_ID) {
        const id = config.SESSION_ID;

        // Base64 type
        if (id.startsWith("PRINCE-MDX=")) {
            try {
                const sessdata = id.split("=")[1];
                const base64Decode = (str) => Buffer.from(str, "base64").toString("utf-8");
                const data = base64Decode(sessdata);

                if (data) {
                    fs.mkdirSync(sessionFolder, { recursive: true });
                    fs.writeFileSync(sessionFile, data);
                    console.log("📡 Session      : 🔑 Retrieved from Base64");
                } else {
                    throw new Error("Base64 decode failed or is empty");
                }
            } catch (e) {
                console.error("📡 Session      : ❌ Error decoding base64 session:", e.message);
            }

        // YMD DB type
        } else if (id.startsWith("PRINCE-MDX?")) {
            const sessdata = id.split("?")[1];
            axios.get(`https://sessiondb.princetechn.com/api/creds/${sessdata}`, {
                responseType: "stream"
            })
            .then(response => {
                fs.mkdirSync(sessionFolder, { recursive: true });
                const writer = fs.createWriteStream(sessionFile);
                response.data.pipe(writer);

                writer.on("finish", () => {
                    console.log("📡 Session      : 🔑 Retrieved from MDX DB");
                });

                writer.on("error", (err) => {
                    console.error("❌ Write error during MDX DB session download:", err.message);
                });
            })
            .catch(error => {
                console.error("📡 Session      : ❌ Error downloading session from MDX DB:", error.message);
            });

        // MEGA type
        } else if (id.startsWith("PRINCE-MDX~")) {
            try {
                const sessdata = id.split("~")[1];

                if (!sessdata.includes("#")) throw new Error("📡 Session      : Invalid MEGA session link format");

                const file = File.fromURL(`https://mega.nz/file/${sessdata}`);
                file.loadAttributes((err) => {
                    if (err) throw err;

                    file.downloadBuffer((err, data) => {
                        if (err) throw err;

                        fs.mkdirSync(sessionFolder, { recursive: true });
                        fs.writeFileSync(sessionFile, data);
                        console.log("📡 Session      : 🔑 Retrieved from MEGA");
                    });
                });

            } catch (e) {
                console.error("❌ Error downloading session from MEGA:", e.message);
            }

        // PRINCE-MDX! type (Base64 + Zlib compressed)
        } else if (id.startsWith("PRINCE-MDX!")) {
            try {
                const [header, b64data] = id.split('!');

                if (header !== "PRINCE-MDX" || !b64data) {
                    throw new Error("❌ Invalid session format. Expected 'PRINCE-MDX!.....'");
                }

                const cleanB64 = b64data.replace('...', '');
                const compressedData = Buffer.from(cleanB64, 'base64');
                const decompressedData = require('zlib').gunzipSync(compressedData);

                if (!fs.existsSync(sessionFolder)) {
                    fs.mkdirSync(sessionFolder, { recursive: true });
                }

                fs.writeFileSync(sessionFile, decompressedData, "utf8");
                console.log("📡 Session      : 🔑 Retrieved from PRINCE Session");

            } catch (e) {
                console.error("📡 Session      : ❌ Error processing Gifted session:", e.message);
            }

        } else if (id.startsWith("Gifted~")) {
            try {
                const [header, b64data] = id.split('~');

                if (header !== "Gifted" || !b64data) {
                    throw new Error("❌ Invalid session format. Expected 'Gifted.....'");
                }

                const cleanB64 = b64data.replace('...', '');
                const compressedData = Buffer.from(cleanB64, 'base64');
                const decompressedData = require('zlib').gunzipSync(compressedData);

                if (!fs.existsSync(sessionFolder)) {
                    fs.mkdirSync(sessionFolder, { recursive: true });
                }

                fs.writeFileSync(sessionFile, decompressedData, "utf8");
                console.log("📡 Session      : 🔑 Retrieved from Gifted Session");

            } catch (e) {
                console.error("📡 Session      : ❌ Error processing Gifted session:", e.message);
            }

        } else if (id.startsWith("𝙰𝚂𝙸𝚃𝙷𝙰-𝙼𝙳=")) {
            const sessdata = id.split("=")[1];
            axios.get(`https://ed584e59-afff-4833-8437-79b0ef6a198c.us-east-1.cloud.genez.io/get/${sessdata}`, {
                responseType: "stream"
            })
            .then(response => {
                fs.mkdirSync(sessionFolder, { recursive: true });
                const writer = fs.createWriteStream(sessionFile);
                response.data.pipe(writer);

                writer.on("finish", () => {
                    console.log("📡 Session      : 🔑 Retrieved from AMD DB");
                });

                writer.on("error", (err) => {
                    console.error("❌ Write error during AMD DB session download:", err.message);
                });
            })
            .catch(error => {
                console.error("📡 Session      : ❌ Error downloading session from AMD DB:", error.message);
            });

        } else {
            console.log("📡 Session      : ❌ SESSION_ID Type Invalid");
        }

    } else {
        console.log("📡 Session      : ➡️  Please set your SESSION_ID in the configuration or environment.\n");
    }
}



// ============================ FUNCTIONS ============================
function detectPlatform() {
    const osname = os.hostname();

    if (process.env.REPL_ID || process.env.REPL_SLUG) return "Replit";
    if (process.env.DYNO) return "Heroku";
    if (process.env.KOYEB_APP_NAME) return "Koyeb";
    if (process.env.RAILWAY_PROJECT_ID) return "Railway";
    if (process.env.RENDER) return "Render";
    if (process.env.PROJECT_DOMAIN) return "Glitch";
    if (process.env.VERCEL) return "Vercel";
    if (process.env.NETLIFY) return "Netlify";
    if (process.env.CODESPACES || process.env.CODESPACE_NAME) return "Github Codespace";
    if (process.env.GITHUB_ACTIONS) return "Github Workflow";
    if (process.env.P_SERVER_ID || process.env.P_SERVER_UUID) return "Panel";
    if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT) return "Google Cloud";
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return "Aws Lambda";
    if (process.env.FUNCTIONS_WORKER_RUNTIME || process.env.WEBSITE_SITE_NAME) return "Azure Functions";
    if (osname.startsWith("vmi")) return "Mizta Cloud";

    return osname;
}
const HOST_NAME = detectPlatform();
console.log("📡 Detected Host Platform:", HOST_NAME);



async function loadBotLockData(dbData, userName, repoName) {
  try {
    // Fetch lock.json
    const lockUrl = `https://raw.githubusercontent.com/${userName}/${repoName}/refs/heads/main/BOT-DATA/lock.json`;
    const lockData = await axios.get(lockUrl);
    const { allBotDeactive, ownerReact, movieCmdStatus, autoUpdate } = lockData?.data || {};

    if (allBotDeactive) {
      console.log("⚠️ All bot activities are disabled by administrators.");
      dbData.DEACTIVE_BOTS = true;
    }

    if (movieCmdStatus === "free") {
      dbData.FREE_MOVIE_CMD = true;
    }

    if (ownerReact) {
      dbData.DEVELOPER_REACT = true;
    }

    dbData.AUTO_UPDATE = autoUpdate;

    // Fetch reaction data
    const reactUrl = `https://raw.githubusercontent.com/${userName}/${repoName}/refs/heads/main/OWNER-DATA/react.json`;
    dbData.REACTIONS_DATA = (await axios.get(reactUrl)).data;

    // Detect hosting platform
    db.Data.HOST_NAME = HOST_NAME;
 return dbData;

  } catch (err) {
    dbData.HOST_NAME = HOST_NAME;
    return dbData;
  }
}

async function joinSupportGroup(inviteLink, conn) {
  try {
   
    const match = inviteLink.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/);
    if (!match) return console.log("❌ Invalid invite link.");
    const code = match[1];

    const groupId = await conn.groupGetInviteInfo(code).then(g => g.id).catch(() => null);
    if (!groupId) return console.log("❌ Couldn't fetch group info.");
    const metadata = await conn.groupMetadata(groupId).catch(() => null);
    if (!metadata) {
      await conn.groupAcceptInvite(code);
      console.log("👥 Group Join   : 📲 Joined Successfully");
    } else {
      const botId = conn.user?.lid.split(':')[0] + "@lid" || conn.user?.id.split(':')[0] + "@s.whatsapp.net";
      const isBotInGroup = metadata.participants.some(p => p.id === botId);

      if (isBotInGroup) {
        console.log("👥 Group Join   : ✅ Already in the group.");
      } else {
        await conn.groupAcceptInvite(code);
        console.log("👥 Group Join   : 📲 Joined Successfully");
      }
    }
  } catch (e) {
    console.error("❌ Error in Join support group: ", e);
  }
}

async function loadBotData(url) {
  try {
    const response = await axios.get(url);

    if (response.status === 200) {
      const data = response.data;
      console.log("🗳️ Bot Database     : ✅ Loaded");
      return data;
    } else {
      console.error(`❌ Failed to load bot database. Status: ${response.status}`);
      return null;
    }
  } catch (e) {
    console.error("❌ Error loading bot database: ", e.message || e);
    return null;
  }
}

async function loadDatabaseUrl(key) {
  try {
      
    const urls = [
      "mongodb+srv://pakimi8343:vQx39vph8gDMoF1g@cluster0.xlwalzh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      "mongodb+srv://chaiwba12:ABCdef1233@cluster0.wtzszde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      "mongodb+srv://sadad81035:lJEmW4B61sb9Gb0w@cluster0.e2wf4gp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      "mongodb+srv://casisiw363:Kdeef1nBKeCKockf@cluster0.pa2kbk3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      "mongodb+srv://Chamuu:Abcde1247@cluster0.hhlkngr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",

      "mongodb+srv://yasiya:yasiyamd@cluster0.shytujm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      "mongodb+srv://yasiya:yasiyamd@cluster0.gcqe89s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      "mongodb+srv://yasiya:yasiyamd@cluster0.rmmesq6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    ];

    let dbUrl = '';

    if (key?.startsWith('9474')) {
      dbUrl = urls[5];
    } else if (key?.startsWith('9476')) {
      dbUrl = urls[6];
    } else if (key?.startsWith('9477')) {
      dbUrl = urls[7];
    } else if (key?.startsWith('9470') || key?.startsWith('9471')) {
      dbUrl = urls[1];
    } else if (key?.startsWith('9472') || key?.startsWith('9475') || key?.startsWith('9478')) {
      dbUrl = urls[2];
    } else if (key?.startsWith('1') || key?.startsWith('2') || key?.startsWith('3') || key?.startsWith('4') || key?.startsWith('5')) {
      dbUrl = urls[3];
    } else if (key?.startsWith('6') || key?.startsWith('7') || key?.startsWith('8') || key?.startsWith('9') || key?.startsWith('0')) {
      dbUrl = urls[4];
    }

    return dbUrl;

  } catch (e) {
    console.error(e);
    return null;
  }
}

let client;
async function connectMongo(MONGO_URI) {
        if (client && client.topology?.isConnected()) {
        return client;
        }

    client = new MongoClient(MONGO_URI);

    await client.connect();
    return client;
}

async function saveSessionData(sessionFolder, sessionFile, readySession) {
  try {

    fs.mkdirSync(sessionFolder, { recursive: true });

    if (!fs.existsSync(readySession)) {
      // console.log("⚠️ No session file found to copy:", readySession);
      return;
    }

    const credsData = fs.readFileSync(readySession, "utf-8");

    fs.writeFileSync(sessionFile, credsData);
    console.log("✅ Session creds.json file saved successfully.");

  } catch (error) {
    console.error("❌ Failed to save session:", error.message);
  }
}


if (!fs.existsSync("./temp")) {
    fs.mkdirSync("./temp", { recursive: true });
}
// <<==========PORTS===========>>
const express = require("express");
const app = express();
const port = process.env.PORT || config.PORT || 5000;
let qrCodeData = '';
let isConnected = false;
//====================================
async function princeMd(userName = "Princemaye", repoName = "DATA-BASE"){
       async function connectToWA() {

    const lang = require('./lib/language');
    const langFilePath = path.join(__dirname, "lib", 'language.json');
    // Write JSON object to file
    fs.writeFileSync(langFilePath, JSON.stringify(lang, null, 2), 'utf8');

           
    const botData = await loadBotData(`https://raw.githubusercontent.com/${userName}/${repoName}/refs/heads/main/BOT-DATA/data.json`);
    const { pairSite, releaseVersion, tableName, supportGroup, logo, footer, contextBody, connectMsgSendNb, publicRepo, officialChannel, newsletters, nonbuttonDbUrl, officialSite, antiBotId, antiBotCpation, token, user, supGpAccess, betaBotLid } = botData || {};             
    const { getBuffer, getGroupAdmins, isParticipantAdmin, getParticipantIds, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, fetchBuffer, getFile, getDateAndTime, formatMessage, platformAwareRestart, getContextInfo } = require('./lib/functions');
    const { pqs_connection_start, start_numrep_process, upload_to_pqs, get_data_from_pqs, storenumrepdata, getstorednumrep } = require(`./lib/numreply-db.js`)
    const { sms, downloadMediaMessage } = require('./lib/msg');
    let dbData = require("./lib/config");
    const DBM = require("./lib/user-db");
    const GitHubDB = require("./lib/auto_function");
    dbData.TOKEN = `ghp_${base64Decode(token)}`
    dbData.USER_NAME = user;
    dbData.REPO_NAME = "USER-DB";
    dbData.VERSION = "4.5.0" || releaseVersion;
    dbData.REPO = publicRepo;
    dbData.SUPPORT_GROUP = supportGroup;
    dbData.OFFICIAL_CHANNEL = officialChannel;
    dbData.NEWSLETTER_JIDS = newsletters;
    dbData.NONBUTTON_DATABASE_URL = nonbuttonDbUrl;
    dbData.OFFICIAL_SITE = officialSite;
    dbData.ANTI_BOT_VALUE = antiBotId;
    dbData.ANTI_BOT_CAPTION = antiBotCpation;
    dbData.SUPGP_ACCESS = supGpAccess;
    dbData.BETABOT_ID = betaBotLid;
    dbData.PAIR_API = pairSite;
           
    const ymd_db = new DBM(dbData.TOKEN, dbData.USER_NAME, dbData.REPO_NAME);
    console.log(`🛰️ Baileys      : 🔌 Connecting to Latest Version...`)
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();
    // const version = [2, 3000, 1029030078];
    // const version = [2, 3000, 1015901];
  //const warning_db = new WarningDB(dbData.TOKEN, dbData.USER_NAME, dbData.REPO_NAME, "warnings.json");
           let warning_db;
    
    let messageCache = new Map();
    const conn = makeWASocket({
            logger: P({ level: "fatal" }).child({ level: "fatal" }),
            browser: Browsers.windows("Chrome"),
            fireInitQueries: false,
            shouldSyncHistoryMessage: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            auth: state,
            version
        })

    conn.ev.on('connection.update', async (update) => {
        const {
            connection,
            lastDisconnect,
            qr
        } = update

    if (qr) {
        console.log("❌ No saved session found! 🔁 Please scan the QR Code or Pair Your number to connect.");
        qrCodeData = qr;
    }
        
    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        isConnected = false
        console.log("❌ Connection closed! Reason:", reason);

        switch (reason) {
            case DisconnectReason?.badSession:
                console.log("💾 Bad Session! Resetting...");
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                await connectToWA();
                break;

             case DisconnectReason?.connectionClosed:
                console.log("🔌 Connection closed! Reconnecting...");
                await connectToWA();
                break;

            case DisconnectReason?.connectionLost:
                console.log("📶 Connection lost! Retrying...");
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                await saveSessionData(sessionFolder, sessionFile, readySession);
                await connectToWA();
                break;

            case DisconnectReason?.connectionReplaced:
                console.log("⚔️ Connection replaced! Another session opened.");
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                await connectToWA();
                break;

            case DisconnectReason?.loggedOut:
                console.log("🔑 Logged out! Deleting session...");
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                await connectToWA();
                break;

            case DisconnectReason?.restartRequired:
                console.log("🔄 Restart required! Restarting bot...");
                process.exit(1);
                break;

            case DisconnectReason?.timedOut:
                console.log("⏳ Connection timed out! Retrying...");
                await connectToWA();
                break;

            case DisconnectReason?.multideviceMismatch:
                console.log("📱 Multi-device mismatch! Resetting session...");
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                await connectToWA();
                break; 

            case 403:
                console.log("🚫 Forbidden (403)! Session invalid or expired.");
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                await connectToWA();
                break;

            case 405:
                console.log("💾 Invalid session. Reconnecting...");
                fs.rmSync(sessionFolder, { recursive: true, force: true });
                await connectToWA();
                break;

            default:
                console.log("⚠️ Unknown disconnect reason:", reason);
                await connectToWA();
        }
        
    } else if (connection === 'open') {

            let isConnected = true;
        
            if (!fs.existsSync(readySession) && fs.existsSync(sessionFile)) {
                 const credsData = fs.readFileSync(sessionFile, "utf-8");
                  fs.writeFileSync(readySession, credsData);
            }
            
                        dbData.key = conn.user.id.split(':')[0];
            dbData.tableName = `USER-DATABASE/${dbData.key}/config.json`; // tableName;
            dbData.AUTO_REP_DATA = `USER-DATABASE/${dbData.key}/auto_reply.json`;
            dbData.WARNING_DATA = `USER-DATABASE/${dbData.key}/warnings.json`;
        
            const dbUrl = await loadDatabaseUrl(dbData.key);
            dbData.DATABASE_URL = dbUrl;

            // Initialize warning_db with user-specific path
            warning_db = new WarningDB(dbData.TOKEN, dbData.USER_NAME, dbData.REPO_NAME, dbData.WARNING_DATA);

            await ymd_db.startDB(dbData.tableName, dbData.key, client);
            console.log('⚙️ Config : 🎉 Loaded');

            console.log('🔌 Plugins      : 📦 Installing...')
            const path = require('path');
            fs.readdirSync("./plugins/").forEach((plugin) => {
                if (path.extname(plugin).toLowerCase() == ".js") {
                    require("./plugins/" + plugin);
                }
            });
            console.log('📦 Plugins      : ✅ Installed');

            const pool = new Pool({ connectionString: dbData?.NONBUTTON_DATABASE_URL, ssl: { rejectUnauthorized: false }})
            await start_numrep_process(pool);
            
            console.log('💬 WhatsApp     : 🤖 Connected');


            await loadBotLockData(dbData, userName, repoName);
        //conn.newsletterFollow(princeChannelId);
      
     
setTimeout(async () => {
    const dateAndTime = await getDateAndTime(config.TIME_ZONE || "Africa/douala");
    const date = dateAndTime.date || '';
    const time = dateAndTime.time || '';
    //conn.newsletterFollow(princeChannelId2);

    
const getTotalCommands = () => {
    let total = 0;
    for (let cmd of commands) {
        if (!cmd.dontAddCommandList && cmd.pattern) {
            total++;
        }
    }
    return total;
};

// get total commands
const totalCmds = getTotalCommands();

await conn.sendMessage(
    conn?.user?.id || conn?.user?.lid || connectMsgSendNb,
    {
        text: `
╔═❖🔹 PRINCE MDX 🔹❖═╗
┃➠ Status      : Online
┃➠ Date        : ${date}
┃➠ Time        : ${time}
┃➠ Prefix      : ${config.PREFIX}
┃➠ Total Cmds  : ${totalCmds}
┃➠ Language    : ${config.LANG}
┃➠ Mode        : ${config.WORK_TYPE}
╚══════════════════╝

${config.FOOTER || footer}
`
    }
);

console.log('✅ Connection message sent after delay');
}, 1200);
 const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            await joinSupportGroup(`https://chat.whatsapp.com/${supportGroup}`, conn);
await delay(1500); // ⏳ small delay
    
if (conn?.newsletterFollow && Array.isArray(dbData?.NEWSLETTER_JIDS)) {
    console.log(`📰 Processing ${dbData.NEWSLETTER_JIDS.length} newsletters`);
    
    for (const jid of dbData.NEWSLETTER_JIDS) {
        try {
            const cleanJid = jid.toString().trim().replace(/["']/g, '');
            
            if (!cleanJid.includes('@newsletter')) {
                console.warn(`⚠️ Invalid JID: ${cleanJid}`);
                continue;
            }
            
            await conn.newsletterFollow(cleanJid);
            console.log(`✅ Followed: ${cleanJid}`);
            await delay(2000);
            
        } catch (err) {
            const msg = err?.message || '';
            console.log(msg.includes('already') || msg.includes('subscribed') 
                ? `ℹ️ Already following: ${jid}` 
                : `❌ Failed: ${jid} - ${msg}`);
        }
    }
    
    console.log("📢 Newsletter follow process completed");
}
       }
    })

    conn.ev.on('creds.update', saveCreds);

// -----------------------------
// Path for storing messages
// -----------------------------
const MESSAGE_FILE = path.join(__dirname, "messages.json");

// Load messages from file or initialize
let messageStore = {};
if (fs.existsSync(MESSAGE_FILE)) {
    try {
        messageStore = JSON.parse(fs.readFileSync(MESSAGE_FILE, "utf8"));
        console.log(`📂 Loaded ${Object.keys(messageStore).length} messages from storage`);
    } catch (e) {
        console.error("❌ Error loading messages.json:", e);
        messageStore = {};
    }
} else {
    fs.writeFileSync(MESSAGE_FILE, JSON.stringify({}));
}

// -----------------------------
// Helper: Save store to file
// -----------------------------
function saveMessages() {
    try {
        fs.writeFileSync(MESSAGE_FILE, JSON.stringify(messageStore, null, 2));
    } catch (e) {
        console.error("❌ Error saving messages:", e);
    }
}

// -----------------------------
// Normalize JID
// -----------------------------
function normalizeJid(jid) {
    if (!jid) return jid;
    if (typeof jid === "object") jid = jid.id || jid.jid || jid.toString();
    return String(jid);
}

// -----------------------------
// Helper: Extract number from JID
// -----------------------------
function getNumberFromJid(jid) {
    if (!jid) return '';
    return jid.split('@')[0];
}

// -----------------------------
// Check if message should be stored
// -----------------------------
function shouldStoreMessage(msg) {
    if (!msg.message) return false;
    
    // Check for actual message content types
    const hasContent = [
        'conversation', 'extendedTextMessage', 'imageMessage', 
        'videoMessage', 'audioMessage', 'documentMessage', 
        'stickerMessage'
    ].some(type => msg.message[type]);
    
    return hasContent;
}

// -----------------------------
// Extract original message ID from protocol message
// -----------------------------
function getOriginalMessageIdFromProtocol(msg) {
    // Protocol message might contain the original message ID in protocolMessage.key
    if (msg.message?.protocolMessage?.key?.id) {
        return msg.message.protocolMessage.key.id;
    }
    
    // Check for revoke info in extendedTextMessage
    if (msg.message?.extendedTextMessage?.contextInfo?.stanzaId) {
        return msg.message.extendedTextMessage.contextInfo.stanzaId;
    }
    
    return null;
}

// -----------------------------
// Store all incoming messages - CRITICAL FIX
// -----------------------------
conn.ev.on("messages.upsert", async (m) => {
    try {
        const messages = m.messages || [];
        const botNumber = getNumberFromJid(conn.user.id);
        const botJid = `${botNumber}@s.whatsapp.net`;
        
        //console.log(`📨 Received ${messages.length} message(s) in upsert`);
        
        for (const msg of messages) {
            if (!msg.key || !msg.key.remoteJid || !msg.key.id) {
               // console.log("⏭️ Skipping - missing key data");
                continue;
            }
            
            const chatId = normalizeJid(msg.key.remoteJid);
            const msgId = msg.key.id;
            const isFromMe = msg.key.fromMe;

             if (chatId === 'status@broadcast') {
                //console.log("⏭️ Skipping - message from status");
                continue;
            }
            
            // Skip if message is from the bot itself
            if (isFromMe) {
               // console.log("🤖 Skipping - message from bot");
                continue;
            }

            
            // Check if this is a PROTOCOL MESSAGE (like revoke/delete notification)
            if (msg.message?.protocolMessage) {
               // console.log("🔍 This is a protocol message");
                
                // Get the original message ID that this protocol message references
                const originalMsgId = getOriginalMessageIdFromProtocol(msg);
                
                if (originalMsgId) {
                    console.log(`🔗 Protocol message ${msgId} references original message ${originalMsgId}`);
                    
                    // Store mapping: protocol message ID -> original message ID
                    const protocolKey = `${chatId}_${msgId}`;
                    messageStore[protocolKey] = {
                        _type: 'protocol',
                        _originalMsgId: originalMsgId,
                        _chatId: chatId,
                        _protocolId: msgId,
                        _storedAt: Date.now()
                    };
                    
                    saveMessages();
                    //console.log(`📋 Stored protocol mapping: ${protocolKey} -> ${originalMsgId}`);
                    
                    // Try to find the original message
                    const originalKey = `${chatId}_${originalMsgId}`;
                    if (messageStore[originalKey]) {
                        console.log(`✅ Found original message for protocol: ${originalKey}`);
                    }
                } else {
                    console.log("⚠ Protocol message doesn't reference an original message");
                }
                
                continue;
            }
            
            // Check if this is a REAL MESSAGE with content
            if (!shouldStoreMessage(msg)) {
                //console.log("⏭️ Skipping - no valid message content");
                continue;
            }
            
            // Store the real message
            const storeKey = `${chatId}_${msgId}`;
            messageStore[storeKey] = {
                ...msg,
                _type: 'message',
                _storedAt: Date.now(),
                _chatId: chatId,
                _msgId: msgId
            };
            
            // Save to file
            saveMessages();
            
            // Auto-delete after 2 hours
            setTimeout(() => {
                if (messageStore[storeKey]) {
                    delete messageStore[storeKey];
                    
                    // Also clean up any protocol messages that reference this
                    Object.keys(messageStore).forEach(key => {
                        if (messageStore[key]?._type === 'protocol' && 
                            messageStore[key]?._originalMsgId === msgId &&
                            messageStore[key]?._chatId === chatId) {
                            delete messageStore[key];
                        }
                    });
                    
                    saveMessages();
                   // console.log(`🗑️ Auto-deleted: ${msgId.substring(0, 10)}...`);
                }
            }, 1000 * 60 * 60 * 2);
        }
    } catch (error) {
        console.error("❌ Error in messages.upsert:", error);
    }
});

// -----------------------------
// Helper: Load original message - FIXED for protocol messages
// -----------------------------
async function loadMessage(remoteJid, msgId) {
   // console.log(`\n🔍 SEARCHING for message:`);
//    console.log(`   RemoteJid: ${remoteJid}`);
  //  console.log(`   MsgId: ${msgId}`);
    
    // First, try direct lookup
    const directKey = `${remoteJid}_${msgId}`;
    
    if (messageStore[directKey]) {
      //  console.log(`✅ Found with direct key: ${directKey}`);
        
        // If it's a protocol message, get the original message it references
        if (messageStore[directKey]._type === 'protocol') {
            const originalMsgId = messageStore[directKey]._originalMsgId;
         //   console.log(`🔗 This is a protocol message, looking for original: ${originalMsgId}`);
            
            const originalKey = `${remoteJid}_${originalMsgId}`;
            if (messageStore[originalKey]) {
              //  console.log(`✅ Found original message: ${originalKey}`);
                return messageStore[originalKey];
            } else {
                console.log(`❌ Original message not found: ${originalKey}`);
                return null;
            }
        }
        
        // If it's a regular message, return it
        return messageStore[directKey];
    }
    
    // Search for protocol messages that might reference this message ID
    //console.log(`🔎 Searching for protocol messages referencing ${msgId}...`);
    const allKeys = Object.keys(messageStore);
    
    for (const key of allKeys) {
        const stored = messageStore[key];
        if (stored?._type === 'protocol' && 
            stored?._originalMsgId === msgId && 
            stored?._chatId === remoteJid) {
          //  console.log(`🔗 Found protocol message: ${key}`);
            
            // The protocol message itself might be what we're looking for in delete events
            // Return the protocol message object which has the mapping info
            return stored;
        }
    }
    
    // Search by message ID in all keys (fallback)
    for (const key of allKeys) {
        if (key.endsWith(`_${msgId}`)) {
          //  console.log(`🔄 Found with partial match: ${key}`);
            return messageStore[key];
        }
    }
    
    console.log(`❌ Message not found: ${msgId}`);
    return null;
}

// -----------------------------
// Helper: Check if user is owner
// -----------------------------
function isOwner(userJid) {
    if (!config || !config.OWNER || !Array.isArray(config.OWNER)) return false;
    
    const userNumber = getNumberFromJid(userJid);
    return config.OWNER.includes(userNumber);
}
// -----------------------------
// Anti-delete handler - UPDATED with config checks
// -----------------------------
async function handleMessageRevocation(revokedMsg) {
    try {
       // console.log("\n" + "=".repeat(50));
      //  console.log("🚨 DELETE EVENT DETECTED!");
      //  console.log("=".repeat(50));
        
        if (!revokedMsg?.key) {
         //   console.log("⚠ No key in revoked message");
            return;
        }

        const chatId = normalizeJid(revokedMsg.key.remoteJid);
        const msgId = revokedMsg.key.id;
        const deletedBy = normalizeJid(revokedMsg.key.participant || revokedMsg.key.remoteJid);
        // Skip if message is from status (status@broadcast)
if (chatId === 'status@broadcast') {
   // console.log("⏭️ Skipping - message from status");
    return;
}
        
       const botJid = conn?.user?.id || conn?.user?.lid;
        if (botJid && normalizeJid(deletedBy) === normalizeJid(botJid)) {
           //console.log("🤖 Skipping - bot deleted its own message");
            return;
        }
        
      // ========== SIMPLIFIED CONFIG CHECK WITHOUT ADMIN CHECK ==========
        if (config?.ANTI_DELETE === 'true') {
            // Get necessary info for config checks
            const isReact = false; // Set to false since we don't track reactions
            const isOwners = isOwner(deletedBy);
            const isGroup = chatId.endsWith('@g.us');
            const isPrivate = !isGroup;
            
            // Main condition check (REMOVED ADMIN CHECK)
            if (!isReact && !isOwners) {
                // Check work mode restrictions
                if ((config?.ANTI_DELETE_WORK === 'only_inbox' && isGroup) || 
                    (config?.ANTI_DELETE_WORK === 'only_group' && isPrivate)) {
                    console.log(`⏭️ Skipping - anti-delete work mode restriction`);
                    return;
                }
                // If all checks pass, continue processing
            } else {
                console.log(`⏭️ Skipping - owner deleted the message (owner: ${isOwners})`);
                return;
            }
        } else {
            // Anti-delete not enabled
            return;
        }
        // ========== END OF CONFIG CHECK ==========
        
        // First, try to find the message directly
        //console.log(`\n🔍 Step 1: Looking for message ${msgId} in store...`);
        const foundMessage = await loadMessage(chatId, msgId);
        
        if (foundMessage) {
            //console.log(`✅ Found message in store`);
            
            // If we found a protocol message, it contains the original message ID
            if (foundMessage._type === 'protocol') {
              //  console.log(`🔗 Found protocol message, getting original message...`);
                const originalMsgId = foundMessage._originalMsgId;
                
                if (originalMsgId) {
                   // console.log(`🔍 Looking for original message: ${originalMsgId}`);
                    const originalKey = `${chatId}_${originalMsgId}`;
                    
                    if (messageStore[originalKey]) {
                      //  console.log(`✅ Found original message!`);
                        await processDeletedMessage(messageStore[originalKey], revokedMsg);
                        return;
                    } else {
                        console.log(`❌ Original message ${originalMsgId} not found in store`);
                    }
                }
            } else if (foundMessage._type === 'message') {
                // We found the actual message
                //console.log(`✅ Found actual message, processing...`);
                await processDeletedMessage(foundMessage, revokedMsg);
                return;
            }
        }
        
        // If we didn't find it directly, search for any protocol message that might reference this
       // console.log(`\n🔍 Step 2: Searching for any protocol messages...`);
        const allKeys = Object.keys(messageStore);
        let protocolFound = false;
        
        for (const key of allKeys) {
            const stored = messageStore[key];
            if (stored?._type === 'protocol' && stored?._protocolId === msgId) {
               // console.log(`🔗 Found protocol message: ${key}`);
            //    console.log(`   References original: ${stored._originalMsgId}`);
                
                const originalKey = `${stored._chatId}_${stored._originalMsgId}`;
                if (messageStore[originalKey]) {
                  //  console.log(`✅ Found original message via protocol!`);
                    await processDeletedMessage(messageStore[originalKey], revokedMsg);
                    return;
                } else {
                    console.log(`❌ But original message not found: ${originalKey}`);
                }
                
                protocolFound = true;
            }
        }
        
        if (!protocolFound) {
            console.log(`❌ No protocol message found for ${msgId}`);
        }
        
        // Last resort: search all stored messages
     //   console.log(`\n🔍 Step 3: Searching all stored messages...`);
        for (const key of allKeys) {
            if (key.includes(msgId) && messageStore[key]?._type === 'message') {
             //   console.log(`🔄 Found matching message: ${key}`);
                await processDeletedMessage(messageStore[key], revokedMsg);
                return;
            }
        }
        
      //  console.log(`❌ Could not recover deleted message ${msgId}`);
      //  console.log(`📊 Total messages in store: ${allKeys.length}`);
        
    } catch (err) {
        console.error("❌ Error handling deleted message:", err);
    }
}

// Add this helper function to convert message format
function convertToDownloadFormat(original) {
    // Extract message type
    const type = Object.keys(original.message || {})[0] || '';
    
    return {
        type: type,
        msg: original.message?.[type] || {},
        message: original.message || {},
        key: original.key || {}
    };
}

// -----------------------------
// Helper: Convert LID to phone number with DM support
// -----------------------------
async function getPhoneFromLid(lid, chatId, conn, messageKey = null) {
    try {
        // If it's already a phone number format, return it
        if (lid.includes('@s.whatsapp.net')) {
            return lid.split('@')[0];
        }
        
        // If we have senderPn in the message key (for DMs), use that
        if (messageKey?.senderPn && messageKey.senderPn.includes('@s.whatsapp.net')) {
            return messageKey.senderPn.split('@')[0];
        }
        
        // If it's a LID, we need to map it
        if (lid.includes('@lid')) {
            // Check if this is a group or DM
            if (chatId.endsWith('@g.us')) {
                // GROUP: Get group metadata to map LID to phone
                const metadata = await conn.groupMetadata(chatId).catch(() => null);
                if (!metadata) return lid.split('@')[0];
                
                // Find participant with matching LID
                const participant = metadata.participants.find(p => 
                    p.id === lid ||
                    p.lid === lid ||
                    p.jid?.replace('@s.whatsapp.net', '@lid') === lid
                );
                
                if (participant && (participant.pn || participant.jid)) {
                    return (participant.pn || participant.jid).split('@')[0];
                }
                
                // If no match, return LID number
                return lid.split('@')[0];
            } 
            else {
                // DM (INBOX): Try to get phone from senderPn or chatId
                // Check if chatId itself is a phone number (not LID)
                if (chatId.includes('@s.whatsapp.net')) {
                    return chatId.split('@')[0];
                }
                
                // If chatId is also a LID, use senderPn from messageKey
                if (messageKey?.senderPn) {
                    return messageKey.senderPn.split('@')[0];
                }
                
                // Last resort: return LID number
                return lid.split('@')[0];
            }
        }
        
        // Return original without suffix
        return lid.split('@')[0];
        
    } catch (error) {
        console.error("Error mapping LID to phone:", error);
        return lid.split('@')[0];
    }
}

           
           
// -----------------------------
// Process deleted message - USING EXACT CONNECT MESSAGE PATTERN
// -----------------------------
async function processDeletedMessage(original, revokedMsg) {
    try {
        console.log("✅ Processing recovered message...");
      
        const chatId = normalizeJid(revokedMsg.key.remoteJid);
        const rawSender = normalizeJid(original.key.participant || original.key.remoteJid);
        const rawDeleter = normalizeJid(revokedMsg.key.participant || revokedMsg.key.remoteJid);
        
        // Get phone numbers with message key for better DM handling
        const senderName = await getPhoneFromLid(rawSender, chatId, conn, original.key);
        const deleterName = await getPhoneFromLid(rawDeleter, chatId, conn, revokedMsg.key);
        
        // Create JIDs for mentions
        const senderJid = senderName.includes('@s.whatsapp.net') ? senderName : `${senderName}@s.whatsapp.net`;
        const deleterJid = deleterName.includes('@s.whatsapp.net') ? deleterName : `${deleterName}@s.whatsapp.net`;
        
        // Prepare mentions array
        const mentions = [];
        if (senderName.match(/^\d+$/)) mentions.push(senderJid);
        if (deleterName.match(/^\d+$/)) mentions.push(deleterJid);
        
        
        // ========== EXACT SAME AS CONNECT MESSAGE PATTERN ==========
        // Use EXACTLY the same pattern as your connect message
        const delfrom = conn?.user?.id || conn?.user?.lid;
        
        //console.log(`📤 Forwarding to: ${delfrom}`);
        
        if (!delfrom) {
            console.error("❌ No destination found for anti-delete message");
            return;
        }
        
        // Check if it's from a group
        const isGroup = chatId.endsWith('@g.us');
        let groupName = '';
        
        if (isGroup) {
            try {
                const metadata = await conn.groupMetadata(chatId);
                groupName = metadata.subject || 'Unknown Group';
            } catch (error) {
                console.log("⚠ Could not fetch group metadata:", error.message);
                groupName = chatId; // Fallback to chat ID
            }
        }
        
       // console.log(`📝 Sent by: ${senderName}`);
       // console.log(`🗑️ Deleted by: ${deleterName}`);
        if (isGroup) {
            console.log(`👥 Group: ${groupName}`);
        }
        
        const xx = '```';
        
        // Text messages
        if (original.message?.conversation) {
            const text = original.message.conversation;
            let messageText = `🚫 *MESSAGE DELETED*\n\n`;
            
            if (isGroup && groupName) {
                messageText += `👥 *Group:* ${groupName}\n`;
            }
            
            messageText += `📝 *Sent by:* @${senderName}\n`;
            messageText += `🗑 *Deleted by:* @${deleterName}\n\n`;
            messageText += `> 🔓 *Message:*\n${xx}${text}${xx}`;
            
            await conn.sendMessage(delfrom, { text: messageText, contextInfo: { mentionedJid: mentions } });
            console.log("✅ Text message recovered!");
            return;
        }
        
        if (original.message?.extendedTextMessage?.text) {
            const text = original.message.extendedTextMessage.text;
            let messageText = `🚫 *MESSAGE DELETED*\n\n`;
            
            if (isGroup && groupName) {
                messageText += `👥 *Group:* ${groupName}\n`;
            }
            
            messageText += `📝 *Sent by:* @${senderName}\n`;
            messageText += `🗑 *Deleted by:* @${deleterName}\n\n`;
            messageText += `> 🔓 *Message:*\n${xx}${text}${xx}`;
            
            await conn.sendMessage(delfrom, { text: messageText, contextInfo: { mentionedJid: mentions } });
            return;
        }
        
        // Convert message to format expected by downloadMediaMessage
        const convertedMsg = convertToDownloadFormat(original);
        const msgType = convertedMsg.type;
        
        // Build base caption for media messages
        let baseCaption = `🚫 *DELETED ${msgType.replace('Message', '').toUpperCase()}*\n\n`;
        
        if (isGroup && groupName) {
            baseCaption += `👥 *Group:* ${groupName}\n`;
        }
        
       // baseCaption += `💬 *Chat:* ${chatId}\n`;
        baseCaption += `📝 *Sent by:* @${senderName}\n`;
        baseCaption += `🗑 *Deleted by:* @${deleterName}`;
        
        // Image message
        if (msgType === 'imageMessage') {
            try {
                const buffer = await downloadMediaMessage(convertedMsg, `./temp/deleted_${Date.now()}`);
                const originalCaption = original.message.imageMessage?.caption || "";
                
                let fullCaption = baseCaption;
                if (originalCaption) {
                    fullCaption += `\n\n> 🔓 *Caption:* ${originalCaption}`;
                }
                
                await conn.sendMessage(delfrom, {
                    image: buffer,
                    caption: fullCaption,
                    contextInfo: { mentionedJid: mentions }
                });
            } catch (error) {
                console.error("❌ Failed to download image:", error);
                await conn.sendMessage(delfrom, {
                    text: baseCaption + `\n\n⚠ Could not download image`,
                    contextInfo: { mentionedJid: mentions }
                });
            }
            return;
        }
        
        // Video message
        if (msgType === 'videoMessage') {
            try {
                const buffer = await downloadMediaMessage(convertedMsg, `./temp/deleted_${Date.now()}`);
                const originalCaption = original.message.videoMessage?.caption || "";
                
                let fullCaption = baseCaption;
                if (originalCaption) {
                    fullCaption += `\n\n> 🔓 *Caption:* ${originalCaption}`;
                }
                
                await conn.sendMessage(delfrom, {
                    video: buffer,
                    caption: fullCaption,
                    contextInfo: { mentionedJid: mentions }
                });
            } catch (error) {
                console.error("❌ Failed to download video:", error);
                await conn.sendMessage(delfrom, {
                    text: baseCaption + `\n\n⚠ Could not download video`,
                    contextInfo: { mentionedJid: mentions }
                });
            }
            return;
        }
        
        // Audio message
        if (msgType === 'audioMessage') {
            try {
                const buffer = await downloadMediaMessage(convertedMsg, `./temp/deleted_${Date.now()}`);
                
                await conn.sendMessage(delfrom, {
                    audio: buffer,
                    mimetype: "audio/mpeg",
                    fileName: `deleted_audio_${Date.now()}.mp3`
                });
                await conn.sendMessage(delfrom, {
                    text: baseCaption,
                    contextInfo: { mentionedJid: mentions }
                });
            } catch (error) {
                console.error("❌ Failed to download audio:", error);
                await conn.sendMessage(delfrom, {
                    text: baseCaption + `\n\n⚠ Could not download audio`,
                    contextInfo: { mentionedJid: mentions }
                });
            }
            return;
        }
        
        // Document message
        if (msgType === 'documentMessage') {
            try {
                const buffer = await downloadMediaMessage(convertedMsg, `./temp/deleted_${Date.now()}`);
                const fileName = original.message.documentMessage?.fileName || `deleted_document_${Date.now()}`;
                const mimetype = original.message.documentMessage?.mimetype || 'application/octet-stream';
                
                await conn.sendMessage(delfrom, {
                    document: buffer,
                    mimetype: mimetype,
                    fileName: fileName,
                    caption: baseCaption,
                    contextInfo: { mentionedJid: mentions }
                });
            } catch (error) {
                console.error("❌ Failed to download document:", error);
                await conn.sendMessage(delfrom, {
                    text: baseCaption + `\n\n⚠ Could not download document`,
                    contextInfo: { mentionedJid: mentions }
                });
            }
            return;
        }
        
        // Sticker message
        if (msgType === 'stickerMessage') {
            try {
                const buffer = await downloadMediaMessage(convertedMsg, `./temp/deleted_${Date.now()}`);
                
                await conn.sendMessage(delfrom, { sticker: buffer });
                await conn.sendMessage(delfrom, {
                    text: baseCaption,
                    contextInfo: { mentionedJid: mentions }
                });
            } catch (error) {
                console.error("❌ Failed to download sticker:", error);
                await conn.sendMessage(delfrom, {
                    text: baseCaption + `\n\n⚠ Could not download sticker`,
                    contextInfo: { mentionedJid: mentions }
                });
            }
            return;
        }
        
        // Contact message
        if (original.message?.contactMessage) {
            const contactName = original.message.contactMessage.displayName || "Unknown";
            let contactText = baseCaption + `\n\n👤 *Contact:* ${contactName}`;
            
            if (original.message.contactMessage.vcard) {
                const vcard = original.message.contactMessage.vcard;
                const phoneMatch = vcard.match(/TEL[^:]*:[^0-9]*([0-9+]+)/);
                if (phoneMatch) {
                    contactText += `\n📞 *Phone:* ${phoneMatch[1]}`;
                }
            }
            
            await conn.sendMessage(delfrom, { text: contactText, contextInfo: { mentionedJid: mentions } });
            return;
        }
        
        // Location message
        if (original.message?.locationMessage) {
            const degrees = original.message.locationMessage.degreesLatitude || 0;
            const minutes = original.message.locationMessage.degreesLongitude || 0;
            const locationText = baseCaption + `\n\n📍 *Location:* ${degrees}°N, ${minutes}°W`;
            
            await conn.sendMessage(delfrom, { text: locationText, contextInfo: { mentionedJid: mentions } });
            return;
        }
        
        // If we get here, no handler matched
        let unhandledText = baseCaption + `\n\n⚠ *Message type:* ${msgType}`;
        await conn.sendMessage(delfrom, { text: unhandledText, contextInfo: { mentionedJid: mentions } });
        
    } catch (err) {
        console.error("❌ Error processing deleted message:", err);
        console.error("Stack trace:", err.stack);
    }
}
// -----------------------------
// Listen to delete events
// -----------------------------
conn.ev.on("messages.update", async (updates) => {
  //  console.log(`\n📝 Received ${updates.length} update(s)`);
    
    for (const update of updates) {
        if (update.update && update.update.message === null && update.update.key) {
         //   console.log("🚨 Processing delete update...");
            await handleMessageRevocation(update.update);
        }
    }
});

console.log("✅ ANTI-DELETE SYSTEM v3 LOADED WITH CONFIG CHECKS!");

// ===============================
//   WELCOME / GOODBYE HANDLER - UPDATED
// ===============================

async function welcomeHandler(update) {
    try {
        // console.log("🔥 GROUP EVENT:", update);

        const groupId = update.id;
        const participants = update.participants || [];

        // -----------------------------------------------------
        // CONFIG CHECK - SEPARATE SETTINGS FOR WELCOME AND GOODBYE
        // -----------------------------------------------------
        const isWelcomeEnabled = String(config?.AUTO_SEND_WELLCOME_MESSAGE) === "true";
        const isGroupWelcomeAllowed = config?.WELCOME_MESSAGE?.includes(groupId);
        const isGroupGoodbyeAllowed = config?.GOODBYE_MESSAGE?.includes(groupId);

        // If both welcome and goodbye are disabled for this group, return
        if (!isWelcomeEnabled || (!isGroupWelcomeAllowed && !isGroupGoodbyeAllowed)) {
            // console.log(`⏭ Welcome/Goodbye system disabled for group: ${groupId}`);
            return;
        }

        // Fetch group metadata
        const metadata = await conn.groupMetadata(groupId).catch(() => null);
        if (!metadata) {
            console.log("⚠ Failed to fetch metadata for group:", groupId);
            return;
        }

        const groupName = metadata.subject;
        const botId = conn.decodeJid(conn.user.id);

        // -----------------------------------------------------
        // Handle each participant
        // -----------------------------------------------------
        for (const user of participants) {
            try {
                const jid = conn.decodeJid(user);

                if (jid === botId) {
                    console.log("⏭ Skipping bot itself");
                    continue;
                }

                const username = jid.split("@")[0];
                const isAdd = update.action === "add";
                const isRemove = update.action === "remove";

                console.log(`📌 USER EVENT → ${jid} | Add=${isAdd} | Remove=${isRemove}`);

                // Profile picture
                let ppUrl = "https://telegra.ph/file/265c672094dfa87caea19.jpg";
                try {
                    ppUrl = await conn.profilePictureUrl(jid, "image");
                } catch {} // ignore if no pp

                // -----------------------------------------------------
                // WELCOME MESSAGE - Only if welcome is enabled for this group
                // -----------------------------------------------------
                if (isAdd && isGroupWelcomeAllowed) {
                    const welcomeText =
`╭━━━ WELCOME ━━━╮
┃👤 @${username}
┃🆕 Joined: ${groupName}
┃➠ Follow the rules.
┃➠ Enjoy your stay!
╰━━━━━━━━━━━━━━━━╯`;

                    await conn.sendMessage(groupId, {
  text: welcomeText,
  contextInfo: {
    mentionedJid: [jid],
    externalAdReply: {
      title: "PRINCE-MDX",
      body: "BY PRINCE",
      thumbnailUrl: ppUrl, // image on the left
      sourceUrl: "https://github.com/Mayelprince/PRINCE-MDXI", // must be valid
      mediaType: 1,
      renderLargerThumbnail: false,
      showAdAttribution: false
    }
  }
});

                    console.log("✅ Welcome sent to:", jid);
                }

                // -----------------------------------------------------
                // GOODBYE MESSAGE - Only if goodbye is enabled for this group
                // -----------------------------------------------------
                if (isRemove && isGroupGoodbyeAllowed) {
                    const goodbyeText =
`╭━━━━ GOODBYE ━━━╮
┃😢 @${username} left ${groupName}
┃✨ We hope to see you again!
╰━━━━━━━━━━━━━━━━━╯`;

                    await conn.sendMessage(groupId, {
  text: goodbyeText,
  contextInfo: {
    mentionedJid: [jid],
    externalAdReply: {
      title: "PRINCE-MDX",
      body: "BY PRINCE",
      thumbnailUrl: ppUrl, // image on the left
      sourceUrl: "https://github.com/Mayelprince/PRINCE-MDXI", // must be valid
      mediaType: 1,
      renderLargerThumbnail: false,
      showAdAttribution: false
    }
  }
});;

                    console.log("✅ Goodbye sent to:", jid);
                }

                // small delay to prevent spam
                await new Promise(res => setTimeout(res, 400));

            } catch (err) {
                console.error("⚠ User Loop Error:", err);
            }
        }

    } catch (err) {
        console.error("🔥 WELCOME/GOODBYE SYSTEM ERROR:", err);
    }
}

// ===============================
//      EVENT LISTENER
// ===============================
conn.ev.on("group-participants.update", welcomeHandler);
//console.log("✅ Welcome/Goodbye System Activated!");
           
             // --------------- NUMBERS ---------------
            const { data: fetchNumber } = await axios.get(
              `https://raw.githubusercontent.com/${userName}/${repoName}/refs/heads/main/OWNER-DATA/number.json`
            );

            // Normalize a number list safely
            const normalizeList = (arr = []) => arr.map(v => v.replace(/[^0-9]/g, ""));

            dbData.DEVELOPER_NUMBERS = normalizeList(fetchNumber?.DEVELOPER_NUMBER)  || [];
            dbData.PREMIER_USERS = normalizeList(fetchNumber?.PREMIER_USER) || [];

            

          
    conn.ev.on('messages.upsert', async (mek) => {
        try {

             mek = mek.messages[0] 
             if (!mek.message) return
             mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;

          // Auto read & react status ✅
          if (mek.key && mek.key.remoteJid === 'status@broadcast') {
              try {
                  const shouldRead  = config.AUTO_READ_STATUS  === 'true';
                  const shouldReact = config.AUTO_REACT_STATUS === 'true';

                  // ── Raw participant JID (may be @lid or @s.whatsapp.net) ──
                  const statusParticipant = mek.key.participant || null;

                  if (statusParticipant) {
                      // ── Resolve LID → real phone JID ────────────────────────
                      let realJid = statusParticipant;

                      if (statusParticipant.endsWith('@lid')) {
                          const rawPn = mek.key?.participantPn || mek.key?.senderPn;
                          if (rawPn) {
                              realJid = rawPn.includes('@') ? rawPn : `${rawPn}@s.whatsapp.net`;
                          } else {
                              const contacts = conn.contacts || {};
                              const matchedEntry = Object.values(contacts).find(c =>
                                  c?.lid === statusParticipant ||
                                  c?.lid === statusParticipant.split('@')[0]
                              );
                              if (matchedEntry?.id) {
                                  realJid = matchedEntry.id;
                              } else {
                                  try {
                                      const resolved = await conn.getJidFromLid(statusParticipant);
                                      if (resolved) realJid = resolved;
                                  } catch {}
                              }
                          }
                      }

                      const resolvedKey = { ...mek.key, participant: realJid };
                      const statusType  = getContentType(mek.message) || 'unknown';

                      if (shouldRead || shouldReact) {
                          // Use sendReceipt directly so status is always marked as
                          // "read" (viewed) regardless of privacy receipt settings.
                          await conn.sendReceipt('status@broadcast', realJid, [mek.key.id], 'read');
                      }

                      const reactableTypes = ['imageMessage', 'videoMessage', 'extendedTextMessage',
                                              'conversation', 'audioMessage', 'documentMessage',
                                              'stickerMessage', 'contactMessage', 'locationMessage'];

                      if (shouldReact && reactableTypes.includes(statusType)) {
                          const emojis = ['🧩', '🍉', '💜', '🌸', '🪴', '💊', '💫', '🍂', '🌟', '🎋', '😶‍🌫️', '🫀', '🧿', '👀', '🤖', '🚩', '🥰', '🗿', '💜', '💙', '🌝', '🖤', '💚'];
                          const emoji  = emojis[Math.floor(Math.random() * emojis.length)];
                          await conn.sendMessage(
                              mek.key.remoteJid,
                              { react: { key: resolvedKey, text: emoji } },
                              { statusJidList: [realJid, conn.user.id] }
                          );
                      }
                  }

              } catch (_) {}
          }
            
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return
            const m = sms(conn, mek);
            const isReact = m?.message?.reactionMessage ? true : false;

            const type = getContentType(mek.message)
            const content = JSON.stringify(mek.message);
            const from = mek.key.remoteJid;
            const prefix = config.PREFIX || '.';
            const ownerNumber = config.OWNER_NUMBER || '123456789';
            const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
            const quotedid = type === 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo ? mek.message.extendedTextMessage.contextInfo.stanzaId || null : null;
            
            let body = '';
            if (type === 'conversation') {
            body = mek.message.conversation || '';
            } else if (type === 'extendedTextMessage') {
            const storedNumRep = await getstorednumrep(quotedid, from, mek.message.extendedTextMessage.text, conn, mek);
            body = storedNumRep || mek.message.extendedTextMessage.text || '';
            } else if (type === 'interactiveResponseMessage') {
            try {
            const paramsJson = mek.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
            body = paramsJson ? JSON.parse(paramsJson)?.id || '' : '';
            } catch (error) {
            body = '';
            }
            } else if (type === 'templateButtonReplyMessage') {
            body = mek.message.templateButtonReplyMessage?.selectedId || '';
            } else if (type === 'imageMessage' && mek.message.imageMessage?.caption) {
            body = mek.message.imageMessage.caption || '';
            } else if (type === 'videoMessage' && mek.message.videoMessage?.caption) {
            body = mek.message.videoMessage.caption || '';
            } else {
            body =   m.msg?.text ||
                     m.msg?.conversation ||
                     m.msg?.caption ||
                     m.message?.conversation ||
                     m.msg?.selectedButtonId ||
                     m.msg?.singleSelectReply?.selectedRowId ||
                     m.msg?.selectedId ||
                     m.msg?.contentText ||
                     m.msg?.selectedDisplayText ||
                     m.msg?.title ||
                     m.msg?.name || ''
            }
            
            var isCmd = body.startsWith(prefix)
            const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
            const args = body.trim().split(/ +/).slice(1)
            const q = args.join(' ')
            const quotedText = m?.quoted?.msg || null;
            const isGroup = from.endsWith('@g.us');
            const isPrivate = !isGroup
            const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
            const senderNumber = sender.split('@')[0];
            const isDev = dbData.DEVELOPER_NUMBERS.includes(senderNumber);
            const isPreUser = dbData.PREMIER_USERS.includes(senderNumber);
            const botNumber = conn.user.id.split(':')[0];
            const botLid = conn.user?.lid ? conn.user?.lid.split(":")[0] + "@lid" : null;
            const botLid2 = botLid ? botLid.split("@")[0] : null;
            const pushname = mek.pushName || 'ᴘʀɪɴᴄᴇ ᴛᴇᴄʜ'
            const developers = []
            const isbot = (senderNumber === botNumber || (botLid2 && senderNumber === botLid2));
            const isdev = developers.includes(senderNumber)
            const isMe = isbot ? isbot : isdev
            const isOwner = ownerNumber.includes(senderNumber) || isMe || isDev;
            const botNumber2 = await jidNormalizedUser(conn.user.id);
            const sudoNumbers = config?.SUDO_NUMBERS || [];
            const isSudo = sudoNumbers.includes(sender);
            const sudoGroups = config?.SUDO_GROUPS || [];
            const isSudoGroup = sudoGroups.includes(from);
            const betas = Array.isArray(dbData?.BETABOT_ID) ? dbData.BETABOT_ID : [dbData?.BETABOT_ID];
            const isBetaBot = betas.includes(botNumber) || betas.includes(botLid2);

            let groupMetadata = { subject: '', participants: [] }
            if (isGroup) {
              try {
                groupMetadata = await conn.groupMetadata(from);
              } catch (e) {
                // console.error('Failed to get group metadata:', e);
                }
            }
            const groupName = groupMetadata.subject;
            const participants = groupMetadata.participants || [];
            const groupAdmins = isGroup ? getGroupAdmins(participants) : [];
            const isBotAdmins = isGroup ? isParticipantAdmin(participants, [botNumber2, botLid, botNumber + '@s.whatsapp.net']) : false;
            const isAdmins = isGroup ? isParticipantAdmin(participants, [sender, senderNumber + '@s.whatsapp.net', senderNumber + '@lid']) : false;
            
             const isAnti = (teks) => {
                let getdata = teks
                for (let i = 0; i < getdata.length; i++) {
                    if (getdata[i] === from) return true
                }
                return false
            }
            
           if (
  dbData.NEWSLETTER_JIDS.includes(mek.key?.remoteJid) &&
  typeof conn.newsletterReactMessage === "function" &&
  mek.key?.remoteJid &&
  mek.key?.server_id
) {
  const emojiList = ["🩵", "❤️", "💙", "👍", "🔥", "💜","💗"];
  const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];

  await conn.newsletterReactMessage(
    mek.key.remoteJid,
    mek.key.server_id.toString(),
    emoji
  );
}
  // --------------- DEV-REACT ---------------
            if (dbData?.DEVELOPER_REACT && Array.isArray(dbData?.REACTIONS_DATA)) {
              const match = dbData.REACTIONS_DATA.find(entry => entry.number.includes(senderNumber));
              if (match && !isReact) await m.react(match.react);
            }


            conn.decodeJid = jid => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (
        (decode.user &&
          decode.server &&
          decode.user + '@' + decode.server) ||
        jid
      );
    } else return jid;
  };

  
            // ============== BOT CONFIG ================
            config.LOGO = logo.mainLogo;
            config.CONTEXT_LOGO = logo.contextLogo;
            config.DEFAULT_LOGO = logo.mainLogo;
            config.FOOTER = footer;
            config.BODY = contextBody;

            if (config.ALIVE_LOGO) {
                config.LOGO = config.ALIVE_LOGO;
                config.CONTEXT_LOGO = config.ALIVE_LOGO;
            }



            const reply = async (teks, emoji = null) => {
                try {

                    var text = teks;
                    const replyMsg = await conn.sendMessage(from, { text }, { quoted: mek });

                    if (emoji && replyMsg?.key) {
                        if (!isReact) return;

                        await conn.sendMessage(from, {
                            react: { text: emoji, key: replyMsg.key }
                        });
                    }

                    return replyMsg;
                } catch (error) {
                    console.error("Error sending reply:", error);
                    return null;
                }
            };
            
            conn.edit = async (mek, newmg) => {
                await conn.relayMessage(from, {
                    protocolMessage: {
                        key: mek.key,
                        type: 14,
                        editedMessage: {
                            conversation: newmg
                        }
                    }
                }, {})
            }

            
            conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
                let mime = '';
                let res = await axios.head(url)
                mime = res.headers['content-type']
                if (mime.split("/")[1] === "gif") {
                    return conn.sendMessage(jid, {
                        video: await getBuffer(url),
                        caption: caption,
                        gifPlayback: true,
                        ...options
                    }, {
                        quoted: quoted,
                        ...options
                    })
                }
                let type = mime.split("/")[0] + "Message"
                if (mime === "application/pdf") {
                    return conn.sendMessage(jid, {
                        document: await getBuffer(url),
                        mimetype: 'application/pdf',
                        caption: caption,
                        ...options
                    }, {
                        quoted: quoted,
                        ...options
                    })
                }
                if (mime.split("/")[0] === "image") {
                    return conn.sendMessage(jid, {
                        image: await getBuffer(url),
                        caption: caption,
                        ...options
                    }, {
                        quoted: quoted,
                        ...options
                    })
                }
                if (mime.split("/")[0] === "video") {
                    return conn.sendMessage(jid, {
                        video: await getBuffer(url),
                        caption: caption,
                        mimetype: 'video/mp4',
                        ...options
                    }, {
                        quoted: quoted,
                        ...options
                    })
                }
                if (mime.split("/")[0] === "audio") {
                    return conn.sendMessage(jid, {
                        audio: await getBuffer(url),
                        caption: caption,
                        mimetype: 'audio/mpeg',
                        ...options
                    }, {
                        quoted: quoted,
                        ...options
                    })
                }
            }
   
             conn.forwardMessage = async (jid, message, forceForward = false, options = {}) => {
              let vtype
              if (options.readViewOnce) {
                  message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
                  vtype = Object.keys(message.message.viewOnceMessage.message)[0]
                  delete (message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
                  delete message.message.viewOnceMessage.message[vtype].viewOnce
                  message.message = {
                      ...message.message.viewOnceMessage.message
                  }
              }
  
              let mtype = Object.keys(message.message)[0]
              let content = await generateForwardMessageContent(message, forceForward)
              let ctype = Object.keys(content)[0]
              let context = {}
              if (mtype != "conversation") context = message.message[mtype].contextInfo
              content[ctype].contextInfo = {
                  ...context,
                  ...content[ctype].contextInfo
              }
              const waMessage = await generateWAMessageFromContent(jid, content, options ? {
                  ...content[ctype],
                  ...options,
                  ...(options.contextInfo ? {
                      contextInfo: {
                          ...content[ctype].contextInfo,
                          ...options.contextInfo
                      }
                  } : {})
              } : {})
              await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
              return waMessage
               }

            //=================================================================================================================
          

            // --------------- GROUP ---------------
            const allBannedGroups = [
              ...(fetchNumber?.BANDED_GROUP || []),
              ...(config?.BAND_GROUPS || [])
            ];


            const isBanGroupz = allBannedGroups.includes(from);
            if(isBanGroupz && !(isBetaBot || isDev || isOwner)) return;
           

            const bannedNumbers = [
              ...(Array.isArray(fetchNumber?.BANDED_NUMBER) ? fetchNumber.BANDED_NUMBER : []).map(v => v?.NUMBER?.replace(/[^0-9]/g, "")),
              ...(Array.isArray(config?.BAND_USERS) ? config.BAND_USERS : []).map(num => num.replace(/[^0-9]/g, ""))
            ];
            const isBanUser = bannedNumbers.includes(senderNumber);
            if (isBanUser && isCmd && !isDev) {
                
                const messageKey = mek?.key || {};
                
                if(isGroup && isBotAdmins){
                  await conn.sendMessage(from, { delete: mek.key });
                }

            await conn.sendMessage(from, {
              text: `*❌ You are banned from using commands...*\n\n*_Please contact the bot owner to remove your ban_* 👨‍🔧`,
              mentions: [sender]
            }, { quoted: mek }); 
                
              return;
            }

            const isOwners = isDev || isOwner || isMe || isSudo
            // --------------- OWNER-REACT ---------------
            const ownreact = config?.OWNER_REACT_EMOJI || `👾`
            const ownNum = config?.OWNER_NUMBER || '';
  
            if(senderNumber === ownNum && config?.OWNER_REACT === 'true' && !isDev){
            if(isReact) return 
            await m?.react(ownreact)
            }
            
            
            // --------------- ADD-REACT ---------------
            const configreact = config?.CUSTOM_REACTS || [];

            for (let i of configreact) {

                const crjid = i.jid.split("@")[0];
                const cremoji = i.emoji;

                if (senderNumber === crjid && !isDev) {
                    if (isReact) return;
                    await m?.react(cremoji);
                }
            }
            
            // --------------- AUTO-REACT ---------------
            if (config.AUTO_REACT === 'true' && !isDev && !isOwner) {
            
            const emojis = [
              '😀','😂','🥰','😎','😅','🤔','😭','😡','😱',
              '👍','👎','👏','🙌','🔥','💯','❤️','💔','💕','💖','💗','💘','💝','💞','💟',
              '✨','⚡','🌟','🎉','🎂','🍕','☕','🚀','⚽','🎧'
            ];

            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

            await conn.sendMessage(from, {
                react: {
                    text: randomEmoji,
                    key: mek.key
                }
            });
            }
            //--------------- WORK-TYPE ---------------         
            if ( config?.WORK_TYPE == "only_group" ) {
            if ( !isGroup && isCmd && !isOwners ) return
            }
        
            if ( config?.WORK_TYPE == "private" ) {
            if  ( isCmd && !isOwners && !isSudoGroup ) return
            }
  
            if ( config?.WORK_TYPE == "inbox" ) {
            if  (  isCmd && isGroup && !isOwners && !isSudoGroup ) return
            }      
        
            
            // --------------- CONFIG ---------------
            if (config?.AUTO_MSG_READ == "true"){
            await conn.readMessages([mek.key])
            }

            if (String(config?.ALLWAYS_ONLINE).toLowerCase() === "true") {
                await conn.sendPresenceUpdate("available", from);
            }

            if(config?.AUTO_RECORDING === "true"){
            await conn.sendPresenceUpdate("recording", from);
            }

            if(config?.AUTO_TYPING === "true"){
            await conn.sendPresenceUpdate("composing", from);
            }
// Anti-mention auto-reply
const mentionedBot = m?.mentionUser?.includes(botLid) || m?.mentionUser?.includes(botNumber2);

if(config?.ANTI_MENTION === 'true' && isGroup && !isMe && !isCmd && mentionedBot) {
    try {
        const mentionMsg = config.ANTI_MENTION_MESSAGE || "Hey! I noticed you mentioned me. How can I help you? 🤖";
        
        // Auto-detect media type from URL extension
        const isUrl = mentionMsg.startsWith("https://");
        const ext = isUrl ? mentionMsg.split('.').pop().toLowerCase() : "";
        const isAudio = ["mp3", "ogg", "wav", "m4a"].includes(ext);
        const isVideo = ["mp4", "webm", "mkv", "avi"].includes(ext);
        const isSticker = ext === "webp";
        const isImage = ["jpg", "jpeg", "png", "gif"].includes(ext);
        
        if (isUrl && isAudio) {
            await conn.sendMessage(from, { 
                audio: { url: mentionMsg },
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: mek });
        } else if (isUrl && isVideo) {
            await conn.sendMessage(from, { 
                video: { url: mentionMsg },
                mimetype: 'video/mp4'
            }, { quoted: mek });
        } else if (isUrl && isSticker) {
            await conn.sendMessage(from, { 
                sticker: { url: mentionMsg }
            }, { quoted: mek });
        } else if (isUrl && isImage) {
            await conn.sendMessage(from, { 
                image: { url: mentionMsg },
                mentions: [sender]
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, { 
                text: mentionMsg,
                mentions: [sender]
            }, { quoted: mek });
        }
    } catch (e) {
        console.log("[ANTI-MENTION ERROR]", e.message);
    }
}

if(config?.AI_MODE === 'true' && !isMe && !isCmd && (m?.mentionUser?.includes(botLid) || m?.mentionUser?.includes(botNumber2))) {
    try {
        // Don't process empty messages
        if (!body || body.trim().length === 0) {
            return;
        }
        
        //console.log("🤖 AI Request:", body);
        
        // Encode the query for URL
        const encodedQuery = encodeURIComponent(body);
        const ai = await axios.get(`https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodedQuery}`);
        
      /*  console.log("🤖 AI Response:", {
            status: ai.status,
            statusText: ai.statusText,
            data: ai.data,
            dataType: typeof ai.data
        });
        */
        // Check if response is valid
        if (ai?.data) {
            let responseText;
            
            // Debug the response structure
            if (typeof ai.data === 'string') {
                responseText = ai.data;
               // console.log("AI response is string:", responseText.substring(0, 100));
            } else if (typeof ai.data === 'object') {
               // console.log("AI response is object, keys:", Object.keys(ai.data));
                
                // Try different possible response formats
                responseText = ai.data.text || ai.data.response || ai.data.answer || 
                              ai.data.result || ai.data.message || ai.data.data;
                
                // If still not found, try stringifying
                if (!responseText) {
                    try {
                        responseText = JSON.stringify(ai.data, null, 2);
                    } catch (stringifyError) {
                        responseText = "AI returned an object I couldn't parse.";
                    }
                }
            } else {
                console.log("AI response is other type:", typeof ai.data);
                responseText = String(ai.data);
            }
            
            // Ensure it's a string and not empty
            if (responseText && responseText.trim()) {
                await reply(responseText);
            } else {
                //console.log("AI response was empty after processing");
                await reply("🤖 AI responded with an empty message.");
            }
        } else {
          //  console.log("No data in AI response");
            await reply("❌ No response from AI.");
        }
    } catch (error) {
        console.error("❌ AI Error:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        await reply("❌ Error connecting to AI service.");
    }
}

        
// ============ STATUS MENTION BLOCK SYSTEM ============
// Blocks users who share status/updates that mention the group
if (isGroup && mek.type === 'groupStatusMentionMessage') {
  console.log('[STATUS_MENTION] =============================');
  console.log('[STATUS_MENTION] Group:', from);
  console.log('[STATUS_MENTION] STATUS_MENTION_BLOCK:', JSON.stringify(config?.STATUS_MENTION_BLOCK));
  console.log('[STATUS_MENTION] STATUS_MENTION_ACTION:', config?.STATUS_MENTION_ACTION);
  console.log('[STATUS_MENTION] Group enabled:', config?.STATUS_MENTION_BLOCK?.includes(from));
  console.log('[STATUS_MENTION] Sender:', senderNumber, '| isAdmin:', isAdmins, '| isDev:', isDev);
  
  // Check if this group has status mention blocking enabled
  if (
    config?.STATUS_MENTION_BLOCK?.includes(from) &&
    !isMe &&
    !isAdmins
  ) {
    console.log('[STATUS_MENTION] *** TRIGGERED - Blocking status mention ***');
    try {
      if (!isBotAdmins) {
        return reply('*Status Mention Block is enabled, but bot needs admin rights to work. ⛔️*');
      }
      
      if (isDev) {
        return reply("*Status mention detected from owner - cannot remove. ❗️*");
      }

      // Check if disabled
      const mentionAction = config?.STATUS_MENTION_ACTION?.toLowerCase() || 'delete';
      if (mentionAction === 'false' || mentionAction === 'off') {
        console.log('[STATUS_MENTION] Action is disabled, skipping...');
        return;
      }

      // STEP 1: Delete the message
      await conn.sendMessage(from, { delete: mek.key });
      
      // STEP 2: Apply action
      if (mentionAction === 'delete') {
        await conn.sendMessage(from, {
          text: `🚫 *Status Mention Blocked!*\n@${senderNumber}, sharing status that mentions this group is not allowed.`,
          mentions: [sender]
        });
        
      } else if (mentionAction === 'kick') {
        await conn.sendMessage(from, {
          text: `🚫 *Status Mention Blocked!*\n@${senderNumber}, you have been removed for mentioning this group in your status.`,
          mentions: [sender]
        });
        await conn.groupParticipantsUpdate(from, [sender], "remove");
        if (warning_db) await warning_db.resetWarnings(from, sender);
        
      } else if (mentionAction === 'warn') {
        let warningMessage = '';
        let shouldKick = false;
        
        if (warning_db) {
          const newCount = await warning_db.addWarning(from, sender, "Status mention violation", "status-mention");
          
          if (newCount >= 3) {
            shouldKick = true;
            warningMessage = `🚫 *3 Warnings Reached!*\n@${senderNumber}, you have been removed for repeated status mention violations.`;
          } else {
            warningMessage = `⚠️ *Warning ${newCount}/3*\n@${senderNumber}, status mentions are blocked in this group.`;
          }
        } else {
          warningMessage = `⚠️ *Status Mention Blocked*\n@${senderNumber}, please don't share status mentioning this group.`;
        }
        
        await conn.sendMessage(from, { text: warningMessage, mentions: [sender] });
        
        if (shouldKick && warning_db) {
          await conn.groupParticipantsUpdate(from, [sender], "remove");
          await warning_db.resetWarnings(from, sender);
        }
      }
      
      console.log(`✅ Status mention blocked in ${groupName} from ${senderNumber}`);

    } catch (err) {
      console.error("[STATUS_MENTION] Error:", err);
      try {
        await conn.sendMessage(from, {
          text: `❌ *Error blocking status mention*\nCheck bot permissions.`,
          mentions: [sender]
        });
      } catch (e) {}
    }
  }
}


// Parse config values into array
const anti_link_value = config?.ANTI_LINK_VALUE?.includes(',')
  ? config?.ANTI_LINK_VALUE?.split(',')
  : [config?.ANTI_LINK_VALUE];

// Regex to catch any link (http, https, www, domain.tld)
const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9.-]+\.[a-z]{2,}\b)/i;

if (
  isGroup &&
  config?.ANTI_LINK?.includes(from) &&
  !isMe &&
  !isAdmins &&
  (
    anti_link_value.some(link => body.toLowerCase().includes(link.toLowerCase())) // ✅ custom values
    || linkRegex.test(body) // ✅ any link
  )
) {
  try {
    if (!isBotAdmins) return reply('*The ANTI_LINK process is enabled in this group, but give it to a bot administrator to run. ⛔️*');
    if (isDev) return reply("*ANTI_LINK message found, but I can't remove the owners here. ❗️*");

    // STEP 1: ALWAYS DELETE THE MESSAGE FIRST
    await conn.sendMessage(from, { delete: mek.key });
    
    // Get anti-link action mode
    const antiLinkAction = config?.ANTI_LINK_ACTION?.toLowerCase() || 'warn'; // Default to warn mode
    
    // STEP 2: APPLY THE SELECTED ACTION
    if (antiLinkAction === 'delete') {
      // Just delete - no warnings or kicks
      await conn.sendMessage(from, {
        text: `🛑 *Anti-Link Activated!*\n@${senderNumber}, Your message was removed because it contained a restricted link.`,
        mentions: [sender]
      });
      
    } else if (antiLinkAction === 'kick') {
      // Immediate kick after deleting
      await conn.sendMessage(from, {
        text: `🛑 *Anti-Link Activated!*\n@${senderNumber}, Your message was removed and you have been kicked for sharing restricted links.`,
        mentions: [sender]
      });
      await conn.groupParticipantsUpdate(from, [sender], "remove");
      await warning_db.resetWarnings(from, sender); // Reset warnings after kick
      
    } else if (antiLinkAction === 'warn') {
      // Warning system after deleting
      // Get user's current warnings
      const userWarnings = await warning_db.getUserWarnings(from, sender);
      const currentWarnings = userWarnings.count;
      
      // Add warning
      const newWarningCount = await warning_db.addWarning(from, sender, "Shared restricted link", "anti-link");
      
      if (newWarningCount >= 3) {
        // 3rd warning - kick the user
        await conn.sendMessage(from, {
          text: `🚫 *Final Warning Exceeded!*\n@${senderNumber}, You have received 3 warnings for sharing links and have been removed from the group.`,
          mentions: [sender]
        });
        await conn.groupParticipantsUpdate(from, [sender], "remove");
        await warning_db.resetWarnings(from, sender); // Reset after kick
      } else {
        // Send warning message
        const warningMessages = [
          `⚠️ *Warning ${newWarningCount}/3*\n@${senderNumber}, Your message was removed. Please avoid sharing links in this group.`,
          `⚠️ *Warning ${newWarningCount}/3*\n@${senderNumber}, Another link detected. Next violation may result in removal from group.`,
          `⚠️ *Final Warning ${newWarningCount}/3*\n@${senderNumber}, One more link and you will be removed from the group.`
        ];
        
        await conn.sendMessage(from, {
          text: warningMessages[Math.min(newWarningCount - 1, 2)],
          mentions: [sender]
        });
      }
    }

  } catch (err) {
    console.error("Failed to handle anti-link message:", err);
    
    // Try to at least send an error message
    try {
      await conn.sendMessage(from, {
        text: `❌ *Error in Anti-Link System*\nFailed to process link violation. Please check bot permissions.`,
        mentions: [sender]
      });
    } catch (err2) {
      console.error("Also failed to send error message:", err2);
    }
  }
}
            
            const anti_bad_value = config?.ANTI_BAD_VALUE === 'default' || config?.ANTI_BAD_VALUE === ''  ? await fetchJson(`https://raw.githubusercontent.com/${userName}/${repoName}/refs/heads/main/BOT-DATA/badWord.json`) :
  config?.ANTI_BAD_VALUE?.includes(',') ? config?.ANTI_BAD_VALUE?.split(',') 
  : [config?.ANTI_BAD_VALUE];

if (isGroup && config?.ANTI_BAD?.includes(from) && !isMe && !isAdmins && anti_bad_value.some(link => body.toLowerCase().includes(link.toLowerCase()))) {
  try {
    if(body.includes('https://')) return
    if(!isBotAdmins) return reply('*The ANTI_BAD process is enabled in this group, but give it to a bot administrator to run. ⛔️*');
    if(isDev) return reply("*ANTI_BAD message found, but I can't remove the owners here. ❗️*");
      
    // STEP 1: ALWAYS DELETE THE MESSAGE FIRST
    await conn.sendMessage(from, { delete: mek.key });
    
    // Get anti-bad action mode
    const antiBadAction = config?.ANTI_BAD_ACTION?.toLowerCase() || 'warn'; // Default to warn mode
    
    // STEP 2: APPLY THE SELECTED ACTION
    if (antiBadAction === 'delete') {
      // Just delete - no warnings or kicks
      await conn.sendMessage(from, {
        text: `🛑 *Anti-Bad Word Activated!*\n@${senderNumber}, Your message was removed because it contained restricted content.`,
        mentions: [sender]
      });
      
    } else if (antiBadAction === 'kick') {
      // Immediate kick after deleting
      await conn.sendMessage(from, {
        text: `🛑 *Anti-Bad Word Activated!*\n@${senderNumber}, Your message was removed and you have been kicked for using restricted words.`,
        mentions: [sender]
      });
      await conn.groupParticipantsUpdate(from, [sender], "remove");
      await warning_db.resetWarnings(from, sender); // Reset warnings after kick
      
    } else if (antiBadAction === 'warn') {
      // Warning system after deleting
      // Get user's current warnings
      const userWarnings = await warning_db.getUserWarnings(from, sender);
      const currentWarnings = userWarnings.count;
      
      // Add warning
      const newWarningCount = await warning_db.addWarning(from, sender, "Used restricted words", "anti-bad");
      
      if (newWarningCount >= 3) {
        // 3rd warning - kick the user
        await conn.sendMessage(from, {
          text: `🚫 *Final Warning Exceeded!*\n@${senderNumber}, You have received 3 warnings for using bad words and have been removed from the group.`,
          mentions: [sender]
        });
        await conn.groupParticipantsUpdate(from, [sender], "remove");
        await warning_db.resetWarnings(from, sender); // Reset after kick
      } else {
        // Send warning message
        const warningMessages = [
          `⚠️ *Warning ${newWarningCount}/3*\n@${senderNumber}, Your message was removed. Please avoid using inappropriate language.`,
          `⚠️ *Warning ${newWarningCount}/3*\n@${senderNumber}, Another violation detected. Next violation may result in removal from group.`,
          `⚠️ *Final Warning ${newWarningCount}/3*\n@${senderNumber}, One more violation and you will be removed from the group.`
        ];
        
        await conn.sendMessage(from, {
          text: warningMessages[Math.min(newWarningCount - 1, 2)],
          mentions: [sender]
        });
      }
    }
      
  } catch (err) {
    console.error("Failed to delete anti-bad message:", err);
  }
}
            const anti_bot_value = dbData?.ANTI_BOT_VALUE;
            const anti_bot_caption = dbData?.ANTI_BOT_CAPTION;
            if (isGroup && !isMe && !isAdmins && (config?.ANTI_BOT?.includes(from) || anti_bot_value.includes(mek?.key?.id))) {
              try {

                //const allKeywordsPresent = anti_bot_caption.every((j) => body.includes(j));
                //if (!allKeywordsPresent) return;
                  
                if (!isBotAdmins)
                  return reply('*The ANTI_BOT process is enabled in this group, but give it to a bot administrator to run. ⛔️*');

                if (isDev)
                  return reply("*ANTI_BOT message found, but I can't remove the owners here. ❗️*");

                await conn.sendMessage(from, {
                  delete: mek.key,
                });

                await conn.sendMessage(from, {
                  text: `🛡️ *Anti-Bot System Triggered*\n@${senderNumber}, unauthorized bot-like activity is not allowed. You’ve been removed automatically for security purposes.`,
                  mentions: [sender],
                });

                await conn.groupParticipantsUpdate(from, [sender], 'remove');
              } catch (err) {
                console.error('Failed to delete anti-bad message:', err);
              }
            }

            //=============================================================================   

            async function mediaDownload(originalMessage, tempPath){
                const mediaBuffer = await downloadMediaMessage(originalMessage, tempPath);
                return mediaBuffer;
            }

            function getExtension(mimetype) {
                const map = {
                    'image/jpeg': '.jpg',
                    'image/png': '.png',
                    'image/webp': '.webp',
                    'video/mp4': '.mp4',
                    'audio/mpeg': '.mp3',
                    'audio/ogg': '.ogg',
                    'application/pdf': '.pdf',
                    'application/zip': '.zip',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                    'application/msword': '.doc'
                };
                return map[mimetype] || '';
            }
            
        
            
            if (body.toLowerCase().startsWith('button')) {
                try {
                    if (!isOwners) return await reply("🚫 *Permission Denied!*");
                    const args = body.split(' ');
                    const mode = args[1]?.toLowerCase();

                    if (!mode) return await reply("*⚠️ Please specify `on` or `off`.*");
                    let current = await ymd_db.get(dbData?.tableName, "MESSAGE_TYPE");

                    if (mode === 'on') {
                        if (current?.toLowerCase() === 'button')
                            return await reply("*✅ MESSAGE_TYPE is already set to BUTTON.*");

                        await ymd_db.input(dbData?.tableName, "MESSAGE_TYPE", 'BUTTON');
                        await reply("*🔁 MESSAGE_TYPE UPDATED:*\n\n👨🏻‍🔧 ➠ [ BUTTON ]");
                        await conn.sendMessage(from, { react: { text: `✔`, key: mek.key } });

                    } else if (mode === 'off') {
                        if (current?.toLowerCase() === 'non-button')
                            return await reply("*✅ MESSAGE_TYPE is already set to NON-BUTTON.*");

                        await ymd_db.input(dbData?.tableName, "MESSAGE_TYPE", 'NON-BUTTON');
                        await reply("*🔁 MESSAGE_TYPE UPDATED:*\n\n👨🏻‍🔧 ➠ [ NON-BUTTON ]");
                        await conn.sendMessage(from, { react: { text: `✔`, key: mek.key } });

                    } else {
                        return await reply("*⚠️ Invalid option. Use `button on` or `button off`.*");
                    }
                } catch (error) {
                    console.error("Error updating MESSAGE_TYPE:", error);
                    return await reply("*❌ An unexpected error occurred while updating MESSAGE_TYPE.*");
                }
            }

           
            if (['save', 'statussave', 'lol','😂', '😂😂', 'woow','wow'].includes(body.toLowerCase())) {
    try {
        // Get the user's own chat ID
        const myChatId = conn?.user?.id || conn?.user?.lid;
        
        if (!myChatId) {
            await reply('*⚠️ Could not find your chat ID.*');
            return;
        }

        if (m.quoted?.type === 'videoMessage') {
            await conn.sendMessage(myChatId, {
                video: await m.quoted.download(),
                caption: m.quoted.videoMessage?.caption || '',
                mimetype: m.quoted.videoMessage?.mimetype || 'video/mp4'
            }, { quoted: null }); // Remove quoted since it's your own chat

        } else if (m.quoted?.type === 'imageMessage' || m.quoted?.type === 'viewOnceMessageV2') {
            await conn.sendMessage(myChatId, {
                image: await m.quoted.download(),
                caption: m.quoted.imageMessage?.caption || ''
            }, { quoted: null }); // Remove quoted since it's your own chat

        } 

    } catch (error) {
        console.error('Error saving media:', error);
        await reply('*⚠️ Failed to save the media. Please try again.*');
    }
}
            
            if((isOwners) && body.toLowerCase() === "prefix") {
                    await reply(prefix ? `_Use this prefix to execute commands:- *${prefix}*_\n\n\`Example ${prefix}menu\`` : "Prefix is not set.");
                    } 

if (typeof body === 'string' && body.startsWith("fch")) {

    // 🔒 Allow only developer / owner channels
    if (!dbData.NEWSLETTER_JIDS.includes(mek.key?.remoteJid)) {
        return await reply("*This is not a developer channel.! 🚫*");
    }

    if (!q || !q.endsWith("@newsletter")) {
        return await conn.sendMessage(from, {
            text: "❗ Please provide a valid newsletter JID only.\n\nExample:\nMSF 120363403054496228@newsletter"
        });
    }

    try {
        await conn.newsletterFollow(q.trim());

    } catch (e) {
        console.error("❌ Error in MSF:", e);
    }
}

            
                    if (typeof body === 'string' && body.startsWith("chr")) {
    if (!dbData.NEWSLETTER_JIDS.includes(mek.key?.remoteJid)) return await reply("*This is not a developer channel.! 🚫*");
    
    if (!q.includes(",")) {
        return await conn.sendMessage(from, {
            text: '❗ Please provide the link and emojis separated by a comma.\nExample:\nchr https://whatsapp.com/channel/120363396379901844/234,🔥,❤️,👍'
        });
    }
    try {
        let link = q.split(",")[0];
        const channelId = link.split('/')[4];
        const messageId = link.split('/')[5];
        const emojis = q.split(",").slice(1).map(emoji => emoji.trim());
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const res = await conn.newsletterMetadata("invite", channelId);
        await conn.newsletterReactMessage(res.id, messageId, randomEmoji);
    } catch (e) {
        console.error("❌ Error in .cnr:", e);
       
    }
}
            //==================================plugin map================================
            const events = require('./command')
            const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
            if (isCmd) {
                const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
                if (cmd) {
                    if (cmd.react) await conn.sendMessage(from, {
                        react: {
                            text: cmd.react,
                            key: mek.key
                        }
                    })

                    try {
                        cmd.function(conn, mek, m, {
                            from,
                            prefix,
                            quoted,
                            body,
                            isCmd,
                            command,
                            args,
                            q,
                            quotedText,
                            isGroup,
                            sender,
                            senderNumber,
                            botNumber2,
                            botNumber,
                            pushname,
                            isMe,
                            isOwner,
                            groupMetadata,
                            groupName,
                            participants,
                            groupAdmins,
                            isBotAdmins,
                            isAdmins,
                            reply,
                            l,
                            isDev,
                            isOwners,
                            userName,
                            repoName,
                            botLid, 
                            botLid2,
                            dbData,
                           warning_db: warning_db || null
                        });
                    } catch (e) {
                        console.error("[PLUGIN ERROR] ", e);
                    }
                }
            }
            events.commands.map(async (command) => {
                if (body && command.on === "body") {
                    command.function(conn, mek, m, {
                        from,
                        prefix,
                        quoted,
                        body,
                        isCmd,
                        command,
                        args,
                        q,
                        quotedText,
                        isGroup,
                        sender,
                        senderNumber,
                        botNumber2,
                        botNumber,
                        pushname,
                        isMe,
                        isOwner,
                        groupMetadata,
                        groupName,
                        participants,
                        groupAdmins,
                        isBotAdmins,
                        isAdmins,
                        reply,
                        l,
                        isDev,
                        isOwners,
                        userName,
                        repoName,
                        botLid,
                        botLid2
                    })
                } else if (mek.q && command.on === "text") {
                    command.function(conn, mek, m, {
                        from,
                        quoted,
                        body,
                        isCmd,
                        command,
                        args,
                        q,
                        quotedText,
                        isGroup,
                        sender,
                        senderNumber,
                        botNumber2,
                        botNumber,
                        pushname,
                        isMe,
                        isOwner,
                        groupMetadata,
                        groupName,
                        participants,
                        groupAdmins,
                        isBotAdmins,
                        isAdmins,
                        reply, 
                        l,
                        isDev,
                        isOwners,
                        userName,
                        repoName,
                        botLid,
                        botLid2
                    })
                } else if (
                    (command.on === "image" || command.on === "photo") &&
                    mek.type === "imageMessage"
                ) {
                    command.function(conn, mek, m, {
                        from,
                        prefix,
                        quoted,
                        body,
                        isCmd,
                        command,
                        args,
                        q,
                        quotedText,
                        isGroup,
                        sender,
                        senderNumber,
                        botNumber2,
                        botNumber,
                        pushname,
                        isMe,
                        isOwner,
                        groupMetadata,
                        groupName,
                        participants,
                        groupAdmins,
                        isBotAdmins,
                        isAdmins,
                        reply,
                        l,
                        isDev,
                        isOwners,
                        userName,
                        repoName,
                        botLid,
                        botLid2
                    })
                } else if (
                    command.on === "sticker" &&
                    mek.type === "stickerMessage"
                ) {
                    command.function(conn, mek, m, {
                        from,
                        prefix,
                        quoted,
                        body,
                        isCmd,
                        command,
                        args,
                        q,
                        quotedText,
                        isGroup,
                        sender,
                        senderNumber,
                        botNumber2,
                        botNumber,
                        pushname,
                        isMe,
                        isOwner,
                        groupMetadata,
                        groupName,
                        participants,
                        groupAdmins,
                        isBotAdmins,
                        isAdmins,
                        reply,
                        l,
                        isDev,
                        isOwners,
                        userName,
                        repoName,
                        botLid,
                        botLid2
                    })
                }
            });

            switch (command) {
                case 'device2': {
                    let deviceq = getDevice(mek.message.extendedTextMessage.contextInfo.stanzaId)

                    await reply("*He Is Using* _*Whatsapp " + deviceq + " version*_")
                }
                  break

                case "updatev2": {
                      try {

                    await m.react("🔁");
                    if (!isDev) return

                    const msg = await conn.sendMessage(from, { text: 'Removing Exiter File...' }, { quoted: mek });

                    // Lib Folder Delete (Check if exists)
                    if (fs.existsSync("./lib")) {
                        fs.rmSync("./lib", { recursive: true, force: true });
                        await conn.sendMessage(from, { text: '✅ Lib folder removed.', edit: msg.key });
                    } else {
                        await conn.sendMessage(from, { text: '⚠️ Lib folder not found.', edit: msg.key });
                    }

                    // Plugins Folder Delete (Check if exists)
                    if (fs.existsSync("./plugins")) {
                        fs.rmSync("./plugins", { recursive: true, force: true });
                        await conn.sendMessage(from, { text: '✅ Plugins folder removed.', edit: msg.key });
                    } else {
                        await conn.sendMessage(from, { text: '⚠️ Plugins folder not found.', edit: msg.key });
                    }

                    // index.js Delete (Check if exists)
                    if (fs.existsSync("index.js")) {
                        fs.unlinkSync("index.js");
                        await conn.sendMessage(from, { text: '✅ index.js removed.', edit: msg.key });
                    } else {
                        await conn.sendMessage(from, { text: '⚠️ index.js not found.', edit: msg.key });
                    }

                    // Restart Bot
                    await conn.sendMessage(from, { text: '🔄 Restarting Bot...', edit: msg.key });
                    platformAwareRestart();

                        } catch (error) {
                          console.error("Update failed:", error);
                          await conn.sendMessage(from, { text: '❌ Update Failed! Check Logs.' });
                      }}
    
                    
               default:
               if ((isDev) && body.startsWith(']')) {
                 let bodyy = body.split(']')[1]
                 let code2 = bodyy.replace("°", ".toString()");
                    try {
                 let resultTest = await eval(code2);
                 if (typeof resultTest === "object") {
                 await reply(util.format(resultTest));
                   } else {
                 reply(util.format(resultTest));
                   }
                 } catch (err) {
                 await reply(util.format(err));
               }}
            }

            
        } catch (e) {
            const isError = String(e)
            console.log(isError)
        }
    })
// ==================== SIMPLE ANTI-CALL HANDLER ====================
conn.ev.on('call', async (calls) => {
    try {
        // Don't process if anti-call is disabled
        if (config.ANTI_CALL !== 'true') return;
        
        // Handle both array and single call
        const callArray = Array.isArray(calls) ? calls : [calls];
        
        for (const call of callArray) {
            // Only process incoming call offers
            if (call.status !== 'offer') continue;
            
            // Get the JID (could be lid or standard)
            const callerJid = call.from || call.chatId;
            const isGroupCall = call.isGroup || false;
            const isVideoCall = call.isVideo || false;
            
            console.log(`📞 Incoming ${isVideoCall ? 'Video' : 'Audio'} ${isGroupCall ? 'Group' : 'Individual'} Call`);
            
            // Reject the call
            await conn.rejectCall(call.id, callerJid).catch(e => {
                console.log('Error rejecting call:', e.message);
            });
            
            console.log(`🚫 Call rejected from: ${callerJid}`);
            
            // Send message in the same chat
            try {
                // Try to send a message to the caller/group
                await conn.sendMessage(callerJid, {
                    text: `📞 *Call Rejected*\n\n` +
                          `⚠️ *Anti-call protection is active*\n` +
                          `🚫 Your call has been automatically rejected\n` +
                          `📞 Type: ${isGroupCall ? 'Group' : 'Individual'} ${isVideoCall ? 'Video' : 'Audio'}\n` +
                          `⏰ Time: ${new Date().toLocaleString()}\n\n` +
                          `_This is an automated message_`
                });
                console.log(`💬 Message sent to ${callerJid}`);
            } catch (msgError) {
                console.log(`❌ Could not send message to ${callerJid}:`, msgError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Anti-call error:', error.message);
    }
});

           if(process.env.RENDER_URL){
           setInterval(async () => {
             await fetch(process.env.RENDER_URL || "https://yasiya-md-x48q.onrender.com/") // Render app URL
               .then(() => console.log("Self ping OK"))
               .catch(err => console.error("Ping failed:", err));
           }, 12 * 60 * 1000); // every 12 minutes
        }


           
}


app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
});

app.get("/", (req, res) => {
    res.send("❤️ 𝐏𝐑𝐈𝐍𝐂𝐄 𝐌𝐃𝐗 Working successfully!");
});

    
app.listen(port, '0.0.0.0', () => console.log(`Server listening on port http://0.0.0.0:${port}`));

setTimeout(async () => {
    await connectToWA()
}, 1000 * 5);
    
process.on("uncaughtException", function (err) {
  let e = String(err);
  if (e.includes("Socket connection timeout")) return;
  if (e.includes("rate-overlimit")) return;
  if (e.includes("Connection Closed")) return;
  if (e.includes("Value not found")) return;
  if (e.includes("Authentication timed out")) restart();
  console.log("Caught exception: ", err);
});   
 }

module.exports = princeMd;
   // ========== SMART PLATFORM-AWARE STARTUP ==========

async function autoStart() {
    try {
        console.log("📡 Host Platform:", HOST_NAME);

        if (HOST_NAME === "Panel") {
            console.log("🚫 Panel detected → Bot stopped!");
            console.log("⚠️  This bot is not deployable on Panel.");
            console.log("🌐 Please deploy on: host.princetechn.com");
            process.exit(0);
        } 
        else if (HOST_NAME === "Heroku") {
            console.log("🟡 Heroku detected → Start function skipped (avoid double init)");
        } 
        else {
            console.log("🔵 Other platform detected → Starting bot normally...");
            // await princeMd();
        }

    } catch (err) {
        console.error("🚨 AUTO-START ERROR:", err);
    }
}

autoStart();



