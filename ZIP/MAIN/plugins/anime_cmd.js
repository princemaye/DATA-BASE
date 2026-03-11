// ============================= ANIME PLUGIN =============================
const { cmd } = require("../command");
const config = require("../config");
const {fetchJson} = require("../lib/functions");

const PRINCE_API_KEY = "prince";
const PRINCE_API_BASE = "https://api.princetechn.com/api/anime";

// ============================= L A N G U A G E =============================
var allLangs = require("../lib/language.json");
var LANG = config.LANG === 'EN' ? 'EN' 
         : config.LANG === 'FR' ? 'FR' 
         : 'EN';

var lang = allLangs[LANG];
var { errorMg } = lang;

// ============================= HELPER FUNCTION =============================
async function fetchAnimeImage(type) {
    try {
        const url = `${PRINCE_API_BASE}/${type}?apikey=${PRINCE_API_KEY}`;
        const res = await fetchJson(url);
        if (res?.success && res?.result) {
            return { success: true, url: res.result };
        }
        return { success: false, url: null };
    } catch (e) {
        console.error(`Anime API Error (${type}):`, e.message);
        return { success: false, url: null };
    }
}

// ============================= WAIFU =============================
cmd({
    pattern: "waifu",
    react: "💕",
    alias: ["waifupic", "animegirl"],
    desc: "Get a random waifu image",
    category: "anime",
    use: "waifu",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const result = await fetchAnimeImage("waifu");
        
        if (result.success && result.url) {
            await conn.sendMessage(from, {
                image: { url: result.url },
                caption: `💕 *Random Waifu*\n\n${config.FOOTER}`
            }, { quoted: mek });
        } else {
            await reply("❌ Failed to fetch waifu image. Try again!");
        }
    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});

// ============================= MAID =============================
cmd({
    pattern: "maid",
    react: "🎀",
    alias: ["animemaid", "maidpic"],
    desc: "Get a random anime maid image",
    category: "anime",
    use: "maid",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const result = await fetchAnimeImage("maid");
        
        if (result.success && result.url) {
            await conn.sendMessage(from, {
                image: { url: result.url },
                caption: `🎀 *Anime Maid*\n\n${config.FOOTER}`
            }, { quoted: mek });
        } else {
            await reply("❌ Failed to fetch maid image. Try again!");
        }
    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});

// ============================= ERO (NSFW) =============================
cmd({
    pattern: "ero",
    react: "🔞",
    alias: ["eropics", "nsfw"],
    desc: "Get a random ero anime image (NSFW)",
    category: "anime",
    use: "ero",
    filename: __filename
},
async (conn, mek, m, { from, reply, isGroup }) => {
    try {
        if (isGroup) {
            return await reply("⚠️ This command is only available in private chats!");
        }
        
        const result = await fetchAnimeImage("ero");
        
        if (result.success && result.url) {
            await conn.sendMessage(from, {
                image: { url: result.url },
                caption: `🔞 *Ero Anime*\n\n${config.FOOTER}`
            }, { quoted: mek });
        } else {
            await reply("❌ Failed to fetch image. Try again!");
        }
    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});

// ============================= LOLI =============================
cmd({
    pattern: "loli",
    react: "🍭",
    alias: ["lolipic", "animeloli"],
    desc: "Get a random loli anime image",
    category: "anime",
    use: "loli",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const result = await fetchAnimeImage("loli");
        
        if (result.success && result.url) {
            await conn.sendMessage(from, {
                image: { url: result.url },
                caption: `🍭 *Anime Loli*\n\n${config.FOOTER}`
            }, { quoted: mek });
        } else {
            await reply("❌ Failed to fetch image. Try again!");
        }
    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});

// ============================= MILF (NSFW) =============================
cmd({
    pattern: "milf",
    react: "🔞",
    alias: ["animemilf"],
    desc: "Get a random milf anime image (NSFW)",
    category: "anime",
    use: "milf",
    filename: __filename
},
async (conn, mek, m, { from, reply, isGroup }) => {
    try {
        if (isGroup) {
            return await reply("⚠️ This command is only available in private chats!");
        }
        
        const result = await fetchAnimeImage("milf");
        
        if (result.success && result.url) {
            await conn.sendMessage(from, {
                image: { url: result.url },
                caption: `🔞 *Anime Milf*\n\n${config.FOOTER}`
            }, { quoted: mek });
        } else {
            await reply("❌ Failed to fetch image. Try again!");
        }
    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});

// ============================= ASS (NSFW) =============================
cmd({
    pattern: "ass",
    react: "🔞",
    alias: ["animeass", "booty"],
    desc: "Get a random anime ass image (NSFW)",
    category: "anime",
    use: "ass",
    filename: __filename
},
async (conn, mek, m, { from, reply, isGroup }) => {
    try {
        if (isGroup) {
            return await reply("⚠️ This command is only available in private chats!");
        }
        
        const result = await fetchAnimeImage("ass");
        
        if (result.success && result.url) {
            await conn.sendMessage(from, {
                image: { url: result.url },
                caption: `🔞 *Anime Image*\n\n${config.FOOTER}`
            }, { quoted: mek });
        } else {
            await reply("❌ Failed to fetch image. Try again!");
        }
    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});

// ============================= ANIME MENU =============================
cmd({
    pattern: "animemenu",
    react: "🎌",
    alias: ["animelist", "animehelp"],
    desc: "Show all anime commands",
    category: "anime",
    use: "animemenu",
    filename: __filename
},
async (conn, mek, m, { from, reply, prefix }) => {
    try {
        const menuText = `
╭───❖ 🎌 *ANIME MENU* 🎌 ❖───╮
│
│ 💕 ${prefix}waifu - Random waifu
│ 🎀 ${prefix}maid - Anime maid
│ 🍭 ${prefix}loli - Anime loli
│
│ ─── *NSFW (DM Only)* ───
│ 🔞 ${prefix}ero - Ero anime
│ 🔞 ${prefix}milf - Anime milf
│ 🔞 ${prefix}ass - Anime ass
│
╰─────────────────────────╯

⚠️ *Note:* NSFW commands only work in private chats!

${config.FOOTER}`;

        await reply(menuText, '🎌');
    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});
