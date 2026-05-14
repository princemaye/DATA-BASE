const { Octokit } = require("@octokit/rest");
const config = require("../config");
let inputConfig = {
  ANTI_LINK: [],
  ANTI_BOT: [],
  ANTI_BAD: [],
  ANTI_LINK_VALUE: "http,https,www.,.com,.net,.org,.io,.co",
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
  AUTO_SEND_WELLCOME_MESSAGE: "true",
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
  OWNER_NUMBER: "",
  OWNER_NAME: "PRINCE",
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
  TIME_ZONE: "Africa/douala",
  XVIDEO_DL: "false",
  MOVIE_DL: "false",
  MOVIE_DETAILS_CARD: "default",
  EPISODE_DETAILS_CARD: "default",
  ANTI_DELETE_WORK: 'only_inbox',
  ANTI_DELETE_SEND: "",
  AUTO_NEWS_MESSAGE: "default",
  AUTO_NEWS: {
    HIRUNEWS_SEND_JIDS: [],
    SIRASANEWS_SEND_JIDS: [],
    DERANANEWS_SEND_JIDS: []
  },
  AUTOSEND_TVSERIES_JID: "",
  CINESUBZ_API_KEY: null,
  BOT_NAME: "default",
  MENU_MESSAGE: "default",
  TIKTOK_DETAILS_MESSAGE: "default",
  FB_DETAILS_MESSAGE: "default",
  SONG_DETAILS_MESSAGE: "default",
  VIDEO_DETAILS_MESSAGE: "default",
  TWITTER_DETAILS_MESSAGE: "default",
  ANTI_MENTION: "false",
  ANTI_MENTION_MESSAGE: "",
  ANTI_GROUP_MENTION: [],
  ANTI_GROUP_MENTION_ACTION: "delete",
  STATUS_MENTION_ACTION: "delete",
  STATUS_MENTION_BLOCK: [],
  GOODBYE_MESSAGE: []
};

class GitHubUserData {
    constructor(authToken, owner, repo) {
        this.octokit = new Octokit(
          { 
            auth: authToken,
            log: {
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {},
              }
          }
        );
        this.owner = owner;
        this.repo = repo;
    }

    setRepo(owner, repo) {
        this.owner = owner;
        this.repo = repo;
    }

    async getFile(path) {
        try {
            const data = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path,
            });

            if (data && data.data && data.data.content) {
                const content = Buffer.from(data.data.content, "base64").toString("utf8");
                return content;
            }
            return null;
        } catch (err) {
            console.error("⚙️ Config : ❌ ", err.message);
            return null;
        }
    }

   async saveFile(path, message = "Save file", user, content = inputConfig) {
      try {

          const data = await this.octokit.repos.getContent({
              owner: this.owner,
              repo: this.repo,
              path,
          }).catch(() => null); 

          if (data && data.data && data.data.sha) {
              console.log(`💽 User Database      : ✅ Connected`);
              return null;
          }

          const response = await this.octokit.repos.createOrUpdateFileContents({
              owner: this.owner,
              repo: this.repo,
              path,
              message,
              content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
          });

          console.log(`💽 User Database      : 📂 "${user}" created`);
          return response.data;

      } catch (err) {
           console.error("💽 User Database      : ❌ ", err.message);
      }
  }


    async updateFile(path, content, message = "Update file", sha) {
        try {
            const response = await this.octokit.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path,
                message,
                content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
                sha,
            });
            return response.data;
        } catch (err) {
            // console.error("Error updating file:", err.message);
        }
    }

    async resetFile(path, message = "Reset file") {
        try {
            const data = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path,
            });

            if (data && data.data && data.data.sha) {
                const response = await this.octokit.repos.deleteFile({
                    owner: this.owner,
                    repo: this.repo,
                    path,
                    message,
                    sha: data.data.sha,
                });
                return response.data;
            } else {
                console.log("File not found to reset.");
            }
        } catch (err) {
            // console.error("Error resetting file:", err.message);
        }
    }

    async input(path, key, value, message = "Update config") {
        try {
            let contentStr = await this.getFile(path) || "{}";
            let content = JSON.parse(contentStr);

            content[key] = value;

            const data = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path,
            });

            const sha = data.data.sha;

            const response = await this.octokit.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path,
                message,
                content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
                sha,
            });

            config[key] = value
            console.log(`✅ ${key} updated to "${value}"`);
            return response.data;
        } catch (err) {
            // console.error("Error updating config key:", err.message);
        }
    }

    async get(path, key) {
      try {
          const { data } = await this.octokit.repos.getContent({
              owner: this.owner,
              repo: this.repo,
              path
          });

          const content = Buffer.from(data.content, 'base64').toString('utf8');
          const json = JSON.parse(content);

          return key ? (json[key] ?? null) : json;
      } catch (err) {
          if (err.status === 404) {
              return null; // File not found
          }
          throw err;
      }
  }

    async updb(path) {
        let getStr = await this.getFile(path) || "{}";
        let get = JSON.parse(getStr);

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
    config.OWNER_NUMBER = get.OWNER_NUMBER || "";
    config.OWNER_NAME = get.OWNER_NAME || "PRINCE";
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
    config.TIME_ZONE = get.TIME_ZONE || "Africa/douala";
    config.XVIDEO_DL = get.XVIDEO_DL || "false";
    config.MOVIE_DL = get.MOVIE_DL || "false";
    config.MOVIE_DETAILS_CARD = get.MOVIE_DETAILS_CARD || 'default';
    config.EPISODE_DETAILS_CARD = get.EPISODE_DETAILS_CARD || 'default';
    config.ANTI_DELETE_WORK = get.ANTI_DELETE_WORK || "only_inbox";
    config.ANTI_DELETE_SEND = get.ANTI_DELETE_SEND || "";
    config.AUTO_NEWS_MESSAGE = get.AUTO_NEWS_MESSAGE || "default";
    config.AUTO_NEWS = get.AUTO_NEWS || { HIRUNEWS_SEND_JIDS: [], SIRASANEWS_SEND_JIDS: [], DERANANEWS_SEND_JIDS: [] }
    config.AUTOSEND_TVSERIES_JID = get.AUTOSEND_TVSERIES_JID || "";
    config.CINESUBZ_API_KEY = get.CINESUBZ_API_KEY || null;
    config.BOT_NAME = get.BOT_NAME || "default";
    config.MENU_MESSAGE = get.MENU_MESSAGE || "default";
    config.TIKTOK_DETAILS_MESSAGE = get.TIKTOK_DETAILS_MESSAGE || "default",
    config.FB_DETAILS_MESSAGE = get.FB_DETAILS_MESSAGE || "default",
    config.SONG_DETAILS_MESSAGE = get.SONG_DETAILS_MESSAGE || "default",
config.VIDEO_DETAILS_MESSAGE = get.VIDEO_DETAILS_MESSAGE || "default",
config.TWITTER_DETAILS_MESSAGE = get.TWITTER_DETAILS_MESSAGE || "default";
    config.ANTI_MENTION = get.ANTI_MENTION || "false";
    config.ANTI_MENTION_MESSAGE = get.ANTI_MENTION_MESSAGE || "";
    config.ANTI_GROUP_MENTION = get.ANTI_GROUP_MENTION || [];
    config.ANTI_GROUP_MENTION_ACTION = get.ANTI_GROUP_MENTION_ACTION || "delete";
    config.STATUS_MENTION_ACTION = get.STATUS_MENTION_ACTION || "delete";
    config.STATUS_MENTION_BLOCK = get.STATUS_MENTION_BLOCK || [];
    config.GOODBYE_MESSAGE = get.GOODBYE_MESSAGE || [];
    config.WELCOME_MESSAGE = get.WELCOME_MESSAGE || [];

    // Restore any per-group custom welcome/goodbye messages saved by setwelcomemsg/setgoodbyemsg
    for (const [k, v] of Object.entries(get)) {
        if (k.startsWith('CUSTOM_WELCOME_') || k.startsWith('CUSTOM_GOODBYE_')) {
            config[k] = v;
        }
    }

        console.log("⚙️ Config : 🎉 Loaded");
    }
  
    async startDB(path, message, user) {
    await this.saveFile(path, message, user);
    await this.updb(path);
  }
  
}

module.exports = GitHubUserData;
