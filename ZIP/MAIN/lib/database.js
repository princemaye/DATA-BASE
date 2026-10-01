import * as __import0 from "mongodb";
import __import1 from "../config.js";
const { MongoClient, ObjectId } = __import0;
const config = __import1;
const dbName = "config_db";
let db;

let inputConfig = {
  ANTI_LINK: [],
  ANTI_BOT: [],
  ANTI_BAD: [],
  ANTI_LINK_VALUE: "chat.whatsapp.com,whatsapp.com/channel",
  ANTI_CALL: "false",
  ANTI_LINK_ACTION: "delete",
  ANTI_BAD_ACTION: "delete",
  ANTI_CALL_ACTION: "delete",
  ANTI_DELETE: "false",
  PREFIX: ".",
  AUTO_REACT: "false",
  AUTO_BLOACK: "false",
  AUTO_READ_MESSAGE: "false",
  AUTO_READ_STATUS: "false",
  AUTO_REACT_STATUS: "false",
  AUTO_SEND_WELLCOME_MESSAGE: "false",
  WELLCOME_MESSAGE: [],
  AUTO_VOICE: "false",
  AUTO_STICKER: "false",
  AUTO_REPLY: "false",
  AUTO_RECORDING: "false",
  AUTO_TYPING: "false",
  ALLWAYS_ONLINE: "true",
  WORK_TYPE: "public",
  LANG: "EN",
  AI_MODE: "false",
  OWNER_NUMBER: "237682698517",
  OWNER_NAME: "ᴘʀɪɴᴄᴇ ᴛᴇᴄʜ",
  OWNER_REACT_EMOJI: "🤵",
  OWNER_REACT: "false",
  SUDO_NUMBERS: [],
  SUDO_GROUPS: [],
  BAND_GROUPS: [],
  BAND_USERS: [],
  POWER: "on",
  ALIVE_MESSAGE: "default",
  ALIVE_LOGO: '',
  CAPTION: "",
  FILE_NAME: "",
  SEEDR_EMAIL: "",
  SEEDR_PASSWORD: "",
  MESSAGE_TYPE: "non-button",
  TIME_ZONE: "Africa/Douala",
  XVIDEO_DL: "false",
  MOVIE_DL: "false",
  MOVIE_DETAILS_CARD: "default",
  EPISODE_DETAILS_CARD: "default",
  ANTI_DELETE_WORK: 'only_inbox',
  ANTI_DELETE_SEND: "",
  ANTI_MENTION: "false",
  ANTI_MENTION_MESSAGE: "Hey! I noticed you mentioned me. How can I help you? 🤖",
  ANTI_MENTION_TYPE: "text",
  AUTO_NEWS_MESSAGE: "default",
  AUTO_NEWS: {
    HIRUNEWS_SEND_JIDS: [],
    SIRASANEWS_SEND_JIDS: [],
    DERANANEWS_SEND_JIDS: []
  }
};

export default class DBM {
  constructor() {}

  async connect(client) {
    if (!db) {
      try{
      db = client.db(dbName);
      console.log("💽 User Database      : ✅ Connected");
    }catch(e){
      console.error("💽 User Database      : ", e.message);
      }
    }
  }

  async createCollection(tableName) {
    //await this.connect();
    const collections = await db.listCollections().toArray();
    if (!collections.find(c => c.name === tableName)) {
      await db.createCollection(tableName);
      console.log(`💽 User Database      : 📂 "${tableName}" created`);
    }
  }

  async insert(tableName, key, value) {
    //await this.connect();
    await this.createCollection(tableName);
    const collection = db.collection(tableName);
    await collection.updateOne(
      { key },
      { $set: { key, value, updated_at: new Date() } },
      { upsert: true }
    );
  }

  async get(tableName, key, setting = null) {
    //await this.connect();
    const collection = db.collection(tableName);
    const doc = await collection.findOne({ key });
    if (!doc) return null;

    const value = doc.value;
    if (typeof value === "object" && setting) return value[setting] || null;
    return value;
  }

  async removeKey(tableName, key) {
    //await this.connect();
    const collection = db.collection(tableName);
    await collection.deleteOne({ key });
    console.log(`✅ Removed key "${key}" from "${tableName}".`);
  }

  async envSetup(tableName, key, value, isJson = false) {
    //await this.connect();
    await this.createCollection(tableName);
    const collection = db.collection(tableName);

    const exists = await collection.findOne({ key });
    if (!exists) {
      const valueToInsert = isJson ? value : String(value);
      await collection.insertOne({
        key,
        value: valueToInsert,
        created_at: new Date(),
      });
      console.log(`💽 User Database      : ✅ Environment config "${key}" created.`);
    }
  }

  async readEnv(tableName) {
    //await this.connect();
    const collection = db.collection(tableName);
    const all = await collection.find().toArray();
    if (!all.length) return null;

    const configObj = {};
    all.forEach(doc => {
      configObj[doc.key] = doc.value;
    });
    return configObj;
  }

async input(tableName, key, setting, data, append = false) {
  //await this.connect();
  let doc = await this.get(tableName, key);
  if (!doc) doc = {};

  const configKeys = Object.keys(inputConfig);
  if (!configKeys.includes(setting)) {
    throw new Error(`⚠️ Invalid setting key: ${setting}`);
  }

  if (append && Array.isArray(doc[setting])) {
    if (!doc[setting].includes(data)) {
      doc[setting].push(data);
    }
  } else {
    doc[setting] = data;
  }

  config[setting] = doc[setting];
  await this.insert(tableName, key, doc);
  console.log(`✅ Updated "${setting}" with value:`, doc[setting]);
  return doc;
}

  async updb(tableName, key) {
    console.log(`[DB DEBUG] updb called with tableName=${tableName}, key=${key}`);
    let get = await this.get(tableName, key) || {};
    console.log(`[DB DEBUG] got data from DB:`, JSON.stringify(get).slice(0, 200));

    config.ANTI_LINK = get.ANTI_LINK || [];
    config.ANTI_BOT = get.ANTI_BOT || [];
    config.ANTI_BAD = get.ANTI_BAD || [];
    config.ANTI_CALL = get.ANTI_CALL || "false";
    config.ANTI_LINK_VALUE = get.ANTI_LINK_VALUE || "chat.whatsapp.com,whatsapp.com/channel";
    config.ANTI_LINK_ACTION = get.ANTI_LINK_ACTION || "delete";
    config.ANTI_BAD_ACTION = get.ANTI_BAD_ACTION || "delete";
    config.ANTI_CALL_ACTION = get.ANTI_CALL_ACTION || "block";
    config.ANTI_DELETE = get.ANTI_DELETE || "false";
    config.PREFIX = get.PREFIX || ".";
    config.AUTO_REACT = get.AUTO_REACT || "false";
    config.AUTO_BLOACK = get.AUTO_BLOACK || "false";
    config.AUTO_READ_MESSAGE = get.AUTO_READ_MESSAGE || "false";
    config.AUTO_READ_STATUS = get.AUTO_READ_STATUS || "false";
    config.AUTO_REACT_STATUS = get.AUTO_REACT_STATUS || "false";
    config.AUTO_SEND_WELLCOME_MESSAGE = get.AUTO_SEND_WELLCOME_MESSAGE || "false";
    config.WELLCOME_MESSAGE = get.WELLCOME_MESSAGE || [];
    config.AUTO_VOICE = get.AUTO_VOICE || "false";
    config.AUTO_STICKER = get.AUTO_STICKER || "false";
    config.AUTO_REPLY = get.AUTO_REPLY || "false";
    config.AUTO_RECORDING = get.AUTO_RECORDING || "false";
    config.AUTO_TYPING = get.AUTO_TYPING || "false";
    config.ALLWAYS_ONLINE = get.ALLWAYS_ONLINE || "true";
    config.WORK_TYPE = get.WORK_TYPE || "public";
    config.LANG = get.LANG || "EN";
    config.AI_MODE = get.AI_MODE || "false";
    config.OWNER_NUMBER = get.OWNER_NUMBER || "237682698514";
    config.OWNER_NAME = get.OWNER_NAME || "ᴘʀɪɴᴄᴇ ᴛᴇᴄʜ";
    config.OWNER_REACT_EMOJI = get.OWNER_REACT_EMOJI || "🤵";
    config.OWNER_REACT = get.OWNER_REACT || "false";
    config.SUDO_NUMBERS = get.SUDO_NUMBERS || [];
    config.SUDO_GROUPS = get.SUDO_GROUPS || [];
    config.BAND_GROUPS = get.BAND_GROUPS || [];
    config.BAND_USERS = get.BAND_USERS || [];
    config.POWER = get.POWER || "on";
    config.ALIVE_MESSAGE = get.ALIVE_MESSAGE || "default";
    config.ALIVE_LOGO = get.ALIVE_LOGO || "";
    config.CAPTION = get.CAPTION || config.FOOTER || "";
    config.FILE_NAME = get.FILE_NAME || '';
    config.SEEDR_EMAIL = get.SEEDR_EMAIL || '';
    config.SEEDR_PASSWORD = get.SEEDR_PASSWORD || '';
    config.MESSAGE_TYPE = get.MESSAGE_TYPE || "non-button";
    config.TIME_ZONE = get.TIME_ZONE || "Asia/Colombo";
    config.XVIDEO_DL = get.XVIDEO_DL || "false";
    config.MOVIE_DL = get.MOVIE_DL || "false";
    config.MOVIE_DETAILS_CARD = get.MOVIE_DETAILS_CARD || 'default';
    config.EPISODE_DETAILS_CARD = get.EPISODE_DETAILS_CARD || 'default';
    config.ANTI_DELETE_WORK = get.ANTI_DELETE_WORK || "only_inbox";
    config.ANTI_DELETE_SEND = get.ANTI_DELETE_SEND || "";
    config.AUTO_NEWS_MESSAGE = get.AUTO_NEWS_MESSAGE || "default";
    config.AUTO_NEWS = get.AUTO_NEWS || { HIRUNEWS_SEND_JIDS: [], SIRASANEWS_SEND_JIDS: [], DERANANEWS_SEND_JIDS: [] }
    config.ANTI_MENTION = get.ANTI_MENTION || "false";
    config.ANTI_MENTION_MESSAGE = get.ANTI_MENTION_MESSAGE || "";
    config.ANTI_GROUP_MENTION = get.ANTI_GROUP_MENTION || [];
    config.ANTI_GROUP_MENTION_ACTION = get.ANTI_GROUP_MENTION_ACTION || "delete";

    console.log(`[DB DEBUG] ANTI_MENTION from DB: ${get.ANTI_MENTION}, set to config: ${config.ANTI_MENTION}`);
    console.log(`[DB DEBUG] ANTI_MENTION_MESSAGE from DB: ${get.ANTI_MENTION_MESSAGE}`);
    console.log("⚙️ Config       : 🎉 Loaded");
  }

  async startDB(tableName, key, client) {
    await this.connect(client);
    await this.envSetup(tableName, key, inputConfig, true);
    await this.updb(tableName, key);
  }
};
