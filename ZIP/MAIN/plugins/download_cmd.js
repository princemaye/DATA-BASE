// ============================= R E Q U E S T =============================
const config = require('../config');
const { cmd } = require('../command');
const {getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, checkDailymotionLink, checkGDriveLink, getThumbnailFromUrl, resizeThumbnail, formatMessage, getContextInfo} = require('../lib/functions')

const fg = require('api-dylux');
const DY_SCRAP = require('@dark-yasiya/scrap');
const dy_scrap = new DY_SCRAP();
const { tiktok, ytmp3_v2, fbdownload, ytmp4_v2, mediaFire, apkSearch, apkDownload, twitter, xvideosSearch, allInOneInfo, allInOneDownload } = require("../lib/scraper");
const { storenumrepdata } = require('../lib/numreply-db')
const deneth = require('denethdev-ytmp3');
const { igdl } = require('ruhend-scraper')
const { File } = require('megajs');
const axios = require('axios'); 
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const gis = require('async-g-i-s');
const mime = require('mime-types');
let dbData = require("../lib/config");

const PIXABAY_API_KEY = '41400543-cbba021cd3b6a727f4d9f07ea';
const PIXABAY_API_URL = 'https://pixabay.com/api/';
const UNSPLASH_ACCESS_KEY = "BYgvJYrD82nWIhbsB_VnhbxDydTuZRG3fiNYdkzq6oU";
const UNSPLASH_API_URL = "https://api.unsplash.com/photos/random";
const genuxApikey = "GENUX-CWWT9CW";
const fgapikey = "fg_O92PDkFv";
const PEXELS_KEYS = [
    "FvX2AuANrkfYcN45n0FOChXVyuK3zRL51gM5SZuAERoRxB1CDLCJLy4l",
    "62IJ8dWHipKEAg8Zs5CjACVYiyrJdGL2wQl88UV4uQPn3bYE6ySG4jcU",
    "jIHcJCGoMjXSrGNO3RJz3aLWBGClmLzZEbtawDe6XO8rfCshsG8LTSKl"
  ];
const PEXELS_API_KEY = PEXELS_KEYS[Math.floor(Math.random() * PEXELS_KEYS.length)];
const folderMap = {
  boot: "17Qe6Hf0SkE1MwpereiineV52rl1c20XF",
  love: "1LW0vT9DQBlpFHxrIbjeK1p3mDcUqtKu4",
  sigma: "1xne5ulmAEYWS1G36yujaFXpCsINLI0AT",
  joke: "1otowJR67KFK7ljmK2UO99syoKAIRnlba"
};

const API_KEY = "AIzaSyDWPxRtg3qpGZrnzyImlTqA_LsZOuuGXv4";
const apilink = "https://darkyasiya-new-movie-api.vercel.app/";
const apikey = '';
const API_SITE = "https://ymd-apis.vercel.app";

const botName = config.BOT_NAME && config.BOT_NAME !== "default" ? config.BOT_NAME : null;

// ============================= F U N C T I O N S =============================
function replaceYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function formatNumber(num) {
    return String(num).padStart(2, '0');
} 

function capitalizeFirst(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// ============================= L A N G U A G E =============================
var allLangs = require("../lib/language.json");
var LANG = config.LANG === 'EN' ? 'EN' 
         : config.LANG === 'FR' ? 'FR' 
         : 'EN';

var lang = allLangs[LANG];
var { needUrl, errorMg, numreplyMg, tiktokMg, tiktokFailMg, ytMg, fbMg, fbFailMg, twMg, twFailMg, mfireMg, igMg, githubMg, gdMg, apkMg, megaMg, mediaMg, notFoundMg, invalidReply, imgUsage, imgNotFound, imgFetchError, wallUsage, wallNotFound, wallFetchError, wallInvalidType, validUrlMg, downMg, downUrlNotfound, buttonTitle, pageUrlError, fetchPageError, fetchPageSourceError, fetchRomanticVideoError, fetchRomanticImagesError, fetchMediaError, fetchMediaApiError, noMediaFoundError, needText, disXvdl } = lang;


//============================ TIK TOK ============================

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    react: "📹",
    desc: "Download TikTok videos",
    category: "download",
    use: "tiktok < TikTok URL >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {

        const url = q.split(" ")[0];
        const cmdRun = q.split(" ")[1] || "false";

        if ((!q || !isUrl(url)) && cmdRun !== "true") {
            return await reply(tiktokMg, "❓");
        }


        const response = await tiktok(q);
        if(!response?.status) return await reply(tiktokFailMg, "❌");
        const { id, region, title, cover, duration, play, sd, hd, music, play_count, digg_count, comment_count, share_count, download_count, collect_count } = response?.result;
        var type = isUrl(url) ? "URL" : "ID";
        const views = play_count
        const likes = digg_count
        
       let info = (config.TIKTOK_DETAILS_CARD && config.TIKTOK_DETAILS_CARD !== 'default')
              ? formatMessage(config.TIKTOK_DETAILS_CARD, { title, duration, views, likes }) :`\`${botName || "PRINCE-MDX"} TIKTOK\`\n\n` +
`┏━━━━━━━━━━━━━━━━┓
➠ Title: ${title}
➠ Duration: ${duration}
➠ Views: ${views}
➠ Likes: ${likes}
┗━━━━━━━━━━━━━━━━┛
`
           
           
        info += `\n${numreplyMg}\n\n` +
`➠ *[1] Video Type*
1.1  Watermark Video
1.2  Without Watermark Video
➠ *[2] Document Type*
2.1  Watermark Video
2.2  Without Watermark Video
➠ *[3] Music*
3.1  Audio
3.2  Document
3.3  Voice
 `;
           
        const numrep = [];
        numrep.push(`1.1 ${prefix}tt_dl ${sd} SD VIDEO=${title}`);
        numrep.push(`1.2 ${prefix}tt_dl ${hd} HD VIDEO=${title}`);
        numrep.push(`2.1 ${prefix}tt_dl ${sd} SD DOC=${title}`);
        numrep.push(`2.2 ${prefix}tt_dl ${hd} HD DOC=${title}`);
        numrep.push(`3.1 ${prefix}tt_dl ${music} MUSIC AUDIO=${title}`);
        numrep.push(`3.2 ${prefix}tt_dl ${music} MUSIC DOC=${title}`);
        numrep.push(`3.3 ${prefix}tt_dl ${music} MUSIC VOICE=${title}`);

        
        const sentMsg = await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), image: { url: config.LOGO }, caption: info,
                              contextInfo: {
                                      externalAdReply: {
                                          title: ` ${botName || "PRINCE-𝖬𝖣X"} 𝖳𝖨𝖪𝖳𝖮𝖪 `,
                                          body: config.BODY || "",
                                          thumbnailUrl: config.CONTEXT_LOGO || config.LOGO,
                                          mediaType: 1,
                                          sourceUrl: q
                                      }}}, { quoted: mek });
        
        const messageKey = sentMsg.key;
        await conn.sendMessage(from, { react: { text: '🎥', key: messageKey } });
        const jsonmsg = {
                          key : messageKey,
                          numrep,
                          method : 'decimal'
                          }
                        await storenumrepdata(jsonmsg);
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});


cmd({
    pattern: "tt_dl",    
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        
        if (!q || !q.includes("https")) {
            return await reply(notFoundMg, "📛");
        }

        const url = q.split(" ")[0];
        const quality = q.split(" ")[1];
        const type = q.split(" ")[2].split("=")[0].toLowerCase() || 'video';
        const title = q.split("=")[1] || '';

        if(quality === "MUSIC"){
                
                if(type === "audio"){
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), audio: { url }, mimetype: "audio/mpeg" }, { quoted: mek });
        await m.react("✅");
                        
                } else if(type === "doc"){
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url }, fileName: `${title}.mp3`, mimetype: "audio/mpeg", caption: `${title}\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
                        
                } else if(type === "voice"){
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), audio: { url }, mimetype: "audio/mpeg", ptt: true }, { quoted: mek });
        await m.react("✅");
                        
            }  
                
        } else if(type === "video"){
        const msg = await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: `📥 Downloading ${quality} Video...` }, { quoted: mek });
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), video: { url }, fileName: `${title}.mp4`, caption: `🎥 *Here is your TikTok Video!*\n\n_${title}_\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: mediaMg , edit : msg.key })
            
        } else if(type === "doc"){
        const msg = await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: `📥 Downloading ${quality} Video...` }, { quoted: mek });
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url }, fileName: `${title}.mp4`, mimetype: "video/mp4", caption: `🎥 *Here is your TikTok Video!*\n\n_${title}_\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: mediaMg , edit : msg.key })
            
        }
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

//============================ SONG & VIDEO ============================

cmd({
    pattern: "play",
    alias: ["ytmp3", "ytmp3dl", "mp3", "song"],
    react: "🎵",
    desc: "Download Ytmp3",
    category: "download",
    use: "song < Text or YT URL >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {
        
        if (!q) return await reply(ytMg, "❓");

        let id = q.startsWith("https://") ? replaceYouTubeID(q) : null;

        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return await reply(notFoundMg, "📛");
            id = searchResults.results[0].videoId;
        }

        const data = await dy_scrap.ytsearch(`https://youtube.com/watch?v=${id}`);
        if (!data?.results?.length) return await reply(notFoundMg, "📛");

        const { url, title, image, timestamp, ago, views, author } = data.results[0];

        let info = 
`\`${botName || "PRINCE MDX"} SONG \`\n\n` +
`┏━━━━━━━━━━━━━━━━━┓
➠ Title: ${title || "Unknown"}
➠ Duration: ${timestamp || "Unknown"}
➠ Views: ${views || "Unknown"}
➠ Release Ago: ${ago || "Unknown"}
➠ Author: ${author?.name || "Unknown"}
➠ Url: ${url || "Unknown"}
┗━━━━━━━━━━━━━━━━━┛
`;
            
            info += `\n${numreplyMg}\n` +
`1.1  Audio Type
1.2  Document Type
1.3  Voice Type

> ${config.FOOTER}`;

            const numrep = [];
            numrep.push(`1.1 ${prefix}ytmp3_dl ${url} AUDIO ${title}`);
            numrep.push(`1.2 ${prefix}ytmp3_dl ${url} DOC ${title}`);
            numrep.push(`1.3 ${prefix}ytmp3_dl ${url} VOICE ${title}`);
    
            const ctxInfo = getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null);
            ctxInfo.externalAdReply = {
                title: `🎶 ${botName || "PRINCE-MDX"} 𝖲𝖮𝖭𝖦  🎶`,
                body: config.BODY || "",
                thumbnailUrl: config.CONTEXT_LOGO || config.LOGO,
                mediaType: 1,
                sourceUrl: url
            };
            const sentMsg = await conn.sendMessage(from, { 
                image: { url: image }, 
                caption: info,
                contextInfo: ctxInfo
            }, { quoted: mek });
        
            const messageKey = sentMsg.key;
            await conn.sendMessage(from, { react: { text: '🎶', key: messageKey } });
            const jsonmsg = {
                key : messageKey,
                numrep,
                method : 'decimal'
            }
            await storenumrepdata(jsonmsg) 

    } catch (error) {
        console.error(error);
        await reply(errorMg, "❌");
    }
});                                                      
cmd({
    pattern: "ytmp3_dl",    
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        
        if (!q || !q.includes("https")) {
            return await reply(notFoundMg, "📛");
        }

        const parts = q.split(" ");
        const url = parts[0];
        const type = parts[1]?.trim().toLowerCase() || 'audio';
        const title = parts.slice(2).join(" ") || 'Unknown Title';
        
        const apiUrl = `https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${encodeURIComponent(url)}`;
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        const downloadUrl = result?.result?.download_url;
            
        if(!downloadUrl){
            reply(downUrlNotfound, "⁉️");
            return;
        }
            
        await m.react("⬆️");
        
        const sanitizedTitle = (result?.result?.title || title).replace(/[<>:"/\\|?*]/g, '').substring(0, 100);
            
        if(type === "audio"){
            await conn.sendMessage(from, { 
                audio: { url: downloadUrl }, 
                mimetype: "audio/mpeg",
                fileName: `${sanitizedTitle}.mp3`
            }, { quoted: mek });
            await m.react("✅");
            
        } else if(type === "doc"){
            await conn.sendMessage(from, { 
                document: { url: downloadUrl }, 
                fileName: `${sanitizedTitle}.mp3`, 
                mimetype: "audio/mpeg", 
                caption: `${sanitizedTitle}\n\n> ${config.FOOTER}` 
            }, { quoted: mek });
            await m.react("✅");
            
        } else if(type === "voice"){
            await conn.sendMessage(from, { 
                audio: { url: downloadUrl }, 
                mimetype: "audio/mpeg", 
                ptt: true,
                fileName: `${sanitizedTitle}.mp3`
            }, { quoted: mek });
            await m.react("✅");
        }
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});


cmd({
    pattern: "video",
    alias: ["ytmp4", "ytmp4dl", "mp4"],
    react: "🎥",
    desc: "Download Ytmp4",
    category: "download",
    use: "video < Text or YT URL >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {
        
        if (!q) return await reply(ytMg, "❓");

        let id = q.startsWith("https://") ? replaceYouTubeID(q) : null;

        if (!id) {
            const searchResults = await dy_scrap.ytsearch(q);
            if (!searchResults?.results?.length) return await reply(notFoundMg, "📛");
            id = searchResults.results[0].videoId;
        }

        const data = await dy_scrap.ytsearch(`https://youtube.com/watch?v=${id}`);
        if (!data?.results?.length) return await reply(notFoundMg, "📛");

        const { url, title, image, timestamp, ago, views, author } = data.results[0];

        let info = 
`\`${botName || "PRINCE-MDX"} YTMP4\`\n\n` +
`┏━━━━━━━━━━━━━━━━━┓
➠ Title: ${title || "Unknown"}
➠ Duration: ${timestamp || "Unknown"}
➠ Views: ${views || "Unknown"}
➠ Release Ago: ${ago || "Unknown"}
➠ Author: ${author?.name || "Unknown"}
➠ Url: ${url || "Unknown"}
┗━━━━━━━━━━━━━━━━━┛
`;
            
            info += `\n${numreplyMg}\n\n` +
` ➠ *[1] Video Type*
1.1  144p Quality
1.2  360p Quality
1.3  480p Quality
1.4  720p Quality
1.5  1080p Quality
➠ *[2] Document Type*
2.1  144p Quality
2.2  360p Quality
2.3  480p Quality
2.4  720p Quality
2.5  1080p Quality

> ${config.FOOTER}`;

        const numrep = [];
        numrep.push(`1.1 ${prefix}ytmp4_dl ${url} 144 VIDEO`);
        numrep.push(`1.2 ${prefix}ytmp4_dl ${url} 360 VIDEO`);
        numrep.push(`1.3 ${prefix}ytmp4_dl ${url} 480 VIDEO`);
        numrep.push(`1.4 ${prefix}ytmp4_dl ${url} 720 VIDEO`);
        numrep.push(`1.5 ${prefix}ytmp4_dl ${url} 1080 VIDEO`);
        numrep.push(`2.1 ${prefix}ytmp4_dl ${url} 144 DOC`);
        numrep.push(`2.2 ${prefix}ytmp4_dl ${url} 360 DOC`);
        numrep.push(`2.3 ${prefix}ytmp4_dl ${url} 480 DOC`);
        numrep.push(`2.4 ${prefix}ytmp4_dl ${url} 720 DOC`);
        numrep.push(`2.5 ${prefix}ytmp4_dl ${url} 1080 DOC`);

        const ctxInfo = getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null);
        ctxInfo.externalAdReply = {
            title: `🎬 ${botName || "PRINCE-𝖬𝖣X"} 𝖸𝖳𝖬𝖯4 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣𝖤𝖱 🎬`,
            body: config.BODY || "",
            thumbnailUrl: config.CONTEXT_LOGO || config.LOGO,
            mediaType: 1,
            sourceUrl: url
        };
        const sentMsg = await conn.sendMessage(from, { image: { url: image }, caption: info,
                              contextInfo: ctxInfo }, { quoted: mek });

        
        const messageKey = sentMsg.key;
        await conn.sendMessage(from, { react: { text: '🎬', key: messageKey } });
        const jsonmsg = {
                          key : messageKey,
                          numrep,
                          method : 'decimal'
                          }
                        await storenumrepdata(jsonmsg)

        
    } catch (error) {
        console.error(error);
        await reply(errorMg, "❌");
    }
});


cmd({
    pattern: "ytmp4_dl",    
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        
        if (!q || !q.includes("https")) {
            return await reply(notFoundMg, "📛");
        }

        const url = q.split(" ")[0];
        const quality = q.split(" ")[1];
        const type = q.split(" ")[2].trim().toLowerCase() || 'doc';
        
        const result = await ytmp4_v2(url, quality);
        const downloadUrl = result?.download?.url;
            
            if(!downloadUrl){
                    reply(downUrlNotfound, "⁉️");
                    return
            }
            
        await m.react("⬆️");
            
        if(type === "video"){
        
        await conn.sendMessage(from, { video: { url: downloadUrl }, caption: `${result?.result?.title || 'N/A'}\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
            
        } else if(type === "doc"){
        
        await conn.sendMessage(from, { document: { url: downloadUrl }, fileName: `${result?.result?.title || 'N/A'}.mp4`, mimetype: "video/mp4", caption: `${result?.result?.title || 'N/A'}\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
            
        }
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

//============================ FACEBOOK ============================

cmd({
    pattern: "fb",
    alias: ["fbdl", "facebook"],
    react: "🏓",
    desc: "Download Fb videos",
    category: "download",
    use: "fb < Fb URL >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {

        if (!q || !isUrl(q)) {
            return await reply(fbMg, "❓");
        }

        // ✅ PUBLIC API (replaces fbdownload)
        const response = await fetchJson(
            `https://apis.prexzyvilla.site/download/facebook?url=${q}`
        );

        if (!response?.data?.sd && !response?.data?.hd) {
            return await reply(fbFailMg, "❌");
        }

        const { title, thumbnail, sd, hd } = response.data;
        const image = thumbnail;

        let info =
            `\` ${botName || "PRINCE-𝖬𝖣X"} 𝖥𝖡 DOWNLO..\`\n\n` +
            `┏━━━━━━━━━━━━━━━━━┓\n` +
            `┣ 🎵 *Title:* ${title}\n` +
            `┗━━━━━━━━━━━━━━━━━┛\n`;

        // ================= NUM-REPLY MODE =================
        info +=
            `\n${numreplyMg}\n\n` +
            `➠ *[1] Video Type*\n` +
            `1.1  SD Video\n` +
            `1.2  HD Video\n` +
            `➠ *[2] Document Type*\n` +
            `2.1  SD Video\n` +
            `2.2  HD Video\n\n` +
            `ok`;

        const numrep = [
            `1.1 ${prefix}fb_dl ${sd} SD VIDEO=${title}`,
            `1.2 ${prefix}fb_dl ${hd} HD VIDEO=${title}`,
            `2.1 ${prefix}fb_dl ${sd} SD DOC=${title}`,
            `2.2 ${prefix}fb_dl ${hd} HD DOC=${title}`
        ];

        const sentMsg = await conn.sendMessage(from, {
            image: { url: image },
            caption: info,
            contextInfo: {
                externalAdReply: {
                    title: `${botName || "PRINCE-𝖬𝖣X"} 𝖥𝖡 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣𝖤𝖱`,
                    body: config.BODY || "",
                    thumbnailUrl: config.CONTEXT_LOGO || config.LOGO,
                    mediaType: 1,
                    sourceUrl: q
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '🎥', key: sentMsg.key } });

        await storenumrepdata({
            key: sentMsg.key,
            numrep,
            method: "decimal"
        });

    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});


cmd({
    pattern: "fb_dl",    
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        
        if (!q || !q.includes("https")) {
            return await reply(notFoundMg, "📛");
        }

        const url = q.split(" ")[0];
        const quality = q.split(" ")[1];
        const type = q.split(" ")[2].split("=")[0].toLowerCase() || 'video';
        const title = q.split("=")[1] || '';

        if(type === "video"){
        const msg = await conn.sendMessage(from, { text: `📥 Downloading ${quality} Video...` }, { quoted: mek });
        await conn.sendMessage(from, { video: { url }, fileName: `${title}.mp4`, caption: `🎥 *Here is your FB Video!*\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
        await conn.sendMessage(from, { text : mediaMg , edit : msg.key })
            
        } else {
        const msg = await conn.sendMessage(from, { text: `📥 Downloading ${quality} Video...` }, { quoted: mek });
        await conn.sendMessage(from, { document: { url }, fileName: `${title}.mp4`, mimetype: "video/mp4", caption: `🎥 *Here is your FB Video!*\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
        await conn.sendMessage(from, { text : mediaMg , edit : msg.key })
            
        }
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

//============================ APK ============================
cmd({
    pattern: "apk",
    alias: ["app", "apps", "application"],
    react: "📦",
    desc: "Download Apps",
    category: "download",
    use: "apk < App name >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {
        
        if (!q) {
            return await reply(apkMg, "❓");
        }

        const response = await apkSearch(q);
        if(!response || response.length === 0) return await reply(notFoundMg, "📛");
        const numrep = [];
        let info = `\`${botName || "PRINCE-𝖬𝖣X"} 𝖠𝖯𝖪 \`\n\n`;
        info += `📦 *Results for:* _${q}_\n\n`;

        const maxResults = Math.min(response.length, 15);
        for (let i = 0; i < maxResults; i++) {
            info += `*${formatNumber(i + 1)}.* ${response[i].name}\n`;
            numrep.push(`${prefix}apk_dl ${response[i].id}`);
        }

        info += `\n> ${config.FOOTER}`;

        const sentMsg = await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), image: { url: config.LOGO }, caption: info },
            { quoted: mek },
        );

        await storenumrepdata({
            key: sentMsg.key,
            numrep,
            method: "nondecimal",
        });
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "apk_dl",    
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        
        if (!q) {
            return await reply(notFoundMg, "📛");
        }
        
        const apkdl = await apkDownload(q);
        await conn.sendMessage(from, { react: { text: '⬆', key: mek.key } })
        if (!apkdl) return reply(notFoundMg)
        
        let msg = 
`APK NAME: ${apkdl.name}
➠ Package: ${apkdl.package}
➠ Size: ${apkdl.size}
➠ Last Update: ${apkdl.lastUpdate}

${config.FOOTER}`;
        
        await conn.sendMessage(from, { image: { url: apkdl.image || config.LOGO }, caption: `${msg}` }, { quoted: mek })
        const dom = await conn.sendMessage(from, { document: { url: apkdl.dl_link }, mimetype: "application/vnd.android.package-archive", fileName: apkdl.name + '.apk', caption: `${apkdl.name}\n\n${config.FOOTER}` }, { quoted: mek })
        await conn.sendMessage(from, { react: { text: '📦', key: dom.key } })
        await conn.sendMessage(from, { react: { text: `✅`, key: mek.key } })
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

//============================ PORNHUB (XNXX) ============================
cmd({
    pattern: "pornhub",
    alias: ["ph", "phdl", "porndl", "xnxx"],
    react: "🔞",
    desc: "Search & Download Pornhub/XNXX Video",
    category: "download",
    use: "pornhub <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix, isDev }) => {
    try {
        if(config?.XVIDEO_DL !== 'true' && !isDev){
            return await reply(disXvdl, "");
        }

        if (!q) {
            return await reply(`🔞 *Pornhub/XNXX Downloader*\n\nSearch or send a URL.\n\n*Usage:*\n${prefix}pornhub <search query>\n${prefix}pornhub <url>`, "❓");
        }

        if (q.startsWith("http")) {
            await reply("⏳ *Fetching video info...*");
            const res = await fetchJson(`https://api.princetechn.com/api/download/xnxxdl?apikey=prince&url=${encodeURIComponent(q)}`);

            if (!res?.success || !res?.result) {
                return await reply("❌ Failed to fetch video. Check the URL and try again.");
            }

            const { title, image, info, duration, files } = res.result;
            if (!files?.low && !files?.high) return await reply("❌ No download URLs found.");

            let infoText = `\`${botName || "PRINCE-MDX"} 𝖯𝖮𝖱𝖭𝖧𝖴𝖡\`\n\n` +
`┏━━━━━━━━━━━━━━━━━┓\n` +
`➠ Title: ${title || "Unknown"}\n` +
`➠ Duration: ${duration || "N/A"}s\n` +
`➠ Info: ${info || "N/A"}\n` +
`┗━━━━━━━━━━━━━━━━━┛\n\n` +
`${numreplyMg}\n`;

            const numrep = [];
            let optNum = 1;
            if (files.low) {
                infoText += `1.${optNum}  📥 Low Quality (240p)\n`;
                numrep.push(`1.${optNum} ${prefix}ph_dl ${title || "pornhub_video"}🎈${files.low}🎈${image || config.LOGO}`);
                optNum++;
            }
            if (files.high) {
                infoText += `1.${optNum}  📥 High Quality (360p)\n`;
                numrep.push(`1.${optNum} ${prefix}ph_dl ${title || "pornhub_video"}🎈${files.high}🎈${image || config.LOGO}`);
                optNum++;
            }
            infoText += `\n> ${config.FOOTER}`;

            const ctxInfo = getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null);
            const sentMsg = await conn.sendMessage(from, {
                image: { url: image || config.LOGO },
                caption: infoText,
                contextInfo: ctxInfo
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '🔞', key: sentMsg.key } });
            await storenumrepdata({ key: sentMsg.key, numrep, method: 'decimal' });

        } else {
            await reply("🔍 *Searching...*");
            const searchUrl = `https://xnxx.health/?k=${encodeURIComponent(q)}&p=${Math.floor(Math.random() * 3) + 1}`;
            const result = await axios.get(searchUrl, { timeout: 15000 });
            const $ = cheerio.load(result.data);
            const results = [];

            $("div.thumb-block").each(function (i) {
                if (i >= 10) return false;
                const el = $(this);
                const linkEl = el.find("div.thumb-under p a");
                const t = linkEl.attr("title") || linkEl.text().trim();
                const href = linkEl.attr("href");
                const thumb = el.find("div.thumb-inside img").attr("src");
                const dur = el.find("p.metadata").text().trim().match(/(\d+min)/)?.[1] || "";
                if (t && href) {
                    results.push({ title: t, url: "https://xnxx.health" + href, duration: dur, thumb });
                }
            });

            if (!results.length) return await reply(notFoundMg, "📛");

            let info = `\`${botName || "PRINCE-MDX"} 𝖯𝖮𝖱𝖭𝖧𝖴𝖡 𝖲𝖤𝖠𝖱𝖢𝖧\`\n\n`;
            info += `🔍 Results for: *${q}*\n\n`;
            const numrep = [];
            results.forEach((r, i) => {
                info += `*${i + 1}.* ${r.title}\n⏱ ${r.duration || "N/A"}\n\n`;
                numrep.push(`${prefix}ph_search ${r.url}`);
            });
            info += `${numreplyMg}\n\n> ${config.FOOTER}`;

            const ctxInfo = getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null);
            const sentMsg = await conn.sendMessage(from, {
                image: { url: results[0].thumb || config.LOGO },
                caption: info,
                contextInfo: ctxInfo
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '🔞', key: sentMsg.key } });
            await storenumrepdata({ key: sentMsg.key, numrep, method: 'nondecimal' });
        }

    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "ph_search",
    react: "🔞",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix, isDev }) => {
    try {
        if(config?.XVIDEO_DL !== 'true' && !isDev){
            return await reply(disXvdl, "");
        }
        if (!q) return await reply(notFoundMg);

        await reply("⏳ *Fetching video info...*");
        const res = await fetchJson(`https://api.princetechn.com/api/download/xnxxdl?apikey=prince&url=${encodeURIComponent(q)}`);

        if (!res?.success || !res?.result) {
            return await reply("❌ Failed to fetch video.");
        }

        const { title, image, info, duration, files } = res.result;
        if (!files?.low && !files?.high) return await reply("❌ No download URLs found.");

        let infoText = `\`${botName || "PRINCE-MDX"} 𝖯𝖮𝖱𝖭𝖧𝖴𝖡\`\n\n` +
`┏━━━━━━━━━━━━━━━━━┓\n` +
`➠ Title: ${title || "Unknown"}\n` +
`➠ Duration: ${duration || "N/A"}s\n` +
`➠ Info: ${info || "N/A"}\n` +
`┗━━━━━━━━━━━━━━━━━┛\n\n` +
`${numreplyMg}\n`;

        const numrep = [];
        let optNum = 1;
        if (files.low) {
            infoText += `1.${optNum}  📥 Low Quality (240p)\n`;
            numrep.push(`1.${optNum} ${prefix}ph_dl ${title || "pornhub_video"}🎈${files.low}🎈${image || config.LOGO}`);
            optNum++;
        }
        if (files.high) {
            infoText += `1.${optNum}  📥 High Quality (360p)\n`;
            numrep.push(`1.${optNum} ${prefix}ph_dl ${title || "pornhub_video"}🎈${files.high}🎈${image || config.LOGO}`);
            optNum++;
        }
        infoText += `\n> ${config.FOOTER}`;

        const ctxInfo = getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null);
        const sentMsg = await conn.sendMessage(from, {
            image: { url: image || config.LOGO },
            caption: infoText,
            contextInfo: ctxInfo
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '🔞', key: sentMsg.key } });
        await storenumrepdata({ key: sentMsg.key, numrep, method: 'decimal' });

    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "ph_dl",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply, isDev }) => {
    try {
        if(config?.XVIDEO_DL !== 'true' && !isDev){
            return await reply(disXvdl, "");
        }

        if (!q) return await reply(notFoundMg);

        const parts = q.split('🎈');
        const title = parts[0] || 'pornhub_video';
        const downloadUrl = parts[1] || '';
        const image = parts[2] || config.LOGO;

        if (!downloadUrl) return await reply("❌ No download URL found.");

        const rawBuffer = await getThumbnailFromUrl(image);
        const thumbnailBuffer = await resizeThumbnail(rawBuffer);
        await m.react('⬆️');

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            jpegThumbnail: thumbnailBuffer,
            mimetype: "video/mp4",
            fileName: title + '.mp4',
            caption: `🔞 ${title}\n\n${config.FOOTER}`
        }, { quoted: mek });

        await m.react('✔️');

    } catch (e) {
        console.error(e);
        await reply(errorMg, "❌");
    }
});

//============================ XVIDEO ============================
cmd({
    pattern: "xvideo",
    alias: ["xv", "xvdl", "xvideodl"],
    react: "🔞",
    desc: "Search & Download Xvideo",
    category: "download",
    use: "xvideo <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix, isDev }) => {
    try {
        if(config?.XVIDEO_DL !== 'true' && !isDev){
            return await reply(disXvdl, "");
        }

        if (!q) {
            return await reply(`🔞 *Xvideo Downloader*\n\nSearch or send a URL.\n\n*Usage:*\n${prefix}xvideo <search query>\n${prefix}xvideo <url>`, "❓");
        }

        if (q.startsWith("http")) {
            await reply("⏳ *Fetching video info...*");
            const res = await fetchJson(`https://api.princetechn.com/api/download/xvideosdl?apikey=prince&url=${encodeURIComponent(q)}`);

            if (!res?.success || !res?.result) {
                return await reply("❌ Failed to fetch video. Check the URL and try again.");
            }

            const { title, thumbnail, download_url, views, votes, likes, dislikes, size } = res.result;
            if (!download_url) return await reply("❌ No download URL found.");

            let infoText = `\`${botName || "PRINCE-MDX"} 𝖷𝖵𝖨𝖣𝖤𝖮\`\n\n` +
`┏━━━━━━━━━━━━━━━━━┓\n` +
`➠ Title: ${title || "Unknown"}\n` +
`➠ Views: ${views || "N/A"}\n` +
`➠ Votes: ${votes || "N/A"}\n` +
`➠ Likes: ${likes || "N/A"} | Dislikes: ${dislikes || "N/A"}\n` +
`➠ Size: ${size || "N/A"}\n` +
`┗━━━━━━━━━━━━━━━━━┛\n\n` +
`${numreplyMg}\n` +
`1.1  📥 Download Video\n` +
`\n> ${config.FOOTER}`;

            const numrep = [];
            numrep.push(`1.1 ${prefix}xvid_dl ${title || "xvideo"}🎈${download_url}🎈${thumbnail || config.LOGO}`);

            const ctxInfo = getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null);
            const sentMsg = await conn.sendMessage(from, {
                image: { url: thumbnail || config.LOGO },
                caption: infoText,
                contextInfo: ctxInfo
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '🔞', key: sentMsg.key } });
            await storenumrepdata({ key: sentMsg.key, numrep, method: 'decimal' });

        } else {
            await reply("🔍 *Searching...*");
            const results = await xvideosSearch(q);

            if (!results?.length) return await reply(notFoundMg, "📛");

            const limited = results.slice(0, 10);
            let info = `\`${botName || "PRINCE-MDX"} 𝖷𝖵𝖨𝖣𝖤𝖮 𝖲𝖤𝖠𝖱𝖢𝖧\`\n\n`;
            info += `🔍 Results for: *${q}*\n\n`;
            const numrep = [];
            limited.forEach((r, i) => {
                info += `*${i + 1}.* ${r.title}\n⏱ ${r.duration || "N/A"} ${r.quality ? `| ${r.quality}` : ""}\n\n`;
                numrep.push(`${prefix}xvid_search ${r.url}`);
            });
            info += `${numreplyMg}\n\n> ${config.FOOTER}`;

            const ctxInfo = getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null);
            const sentMsg = await conn.sendMessage(from, {
                image: { url: limited[0].thumb || config.LOGO },
                caption: info,
                contextInfo: ctxInfo
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '🔞', key: sentMsg.key } });
            await storenumrepdata({ key: sentMsg.key, numrep, method: 'nondecimal' });
        }

    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "xvid_search",
    react: "🔞",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix, isDev }) => {
    try {
        if(config?.XVIDEO_DL !== 'true' && !isDev){
            return await reply(disXvdl, "");
        }
        if (!q) return await reply(notFoundMg);

        await reply("⏳ *Fetching video info...*");
        const res = await fetchJson(`https://api.princetechn.com/api/download/xvideosdl?apikey=prince&url=${encodeURIComponent(q)}`);

        if (!res?.success || !res?.result) {
            return await reply("❌ Failed to fetch video.");
        }

        const { title, thumbnail, download_url, views, votes, likes, dislikes, size } = res.result;
        if (!download_url) return await reply("❌ No download URL found.");

        let infoText = `\`${botName || "PRINCE-MDX"} 𝖷𝖵𝖨𝖣𝖤𝖮\`\n\n` +
`┏━━━━━━━━━━━━━━━━━┓\n` +
`➠ Title: ${title || "Unknown"}\n` +
`➠ Views: ${views || "N/A"}\n` +
`➠ Votes: ${votes || "N/A"}\n` +
`➠ Likes: ${likes || "N/A"} | Dislikes: ${dislikes || "N/A"}\n` +
`➠ Size: ${size || "N/A"}\n` +
`┗━━━━━━━━━━━━━━━━━┛\n\n` +
`${numreplyMg}\n` +
`1.1  📥 Download Video\n` +
`\n> ${config.FOOTER}`;

        const numrep = [];
        numrep.push(`1.1 ${prefix}xvid_dl ${title || "xvideo"}🎈${download_url}🎈${thumbnail || config.LOGO}`);

        const ctxInfo = getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null);
        const sentMsg = await conn.sendMessage(from, {
            image: { url: thumbnail || config.LOGO },
            caption: infoText,
            contextInfo: ctxInfo
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '🔞', key: sentMsg.key } });
        await storenumrepdata({ key: sentMsg.key, numrep, method: 'decimal' });

    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "xvid_dl",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply, isDev }) => {
    try {
        if(config?.XVIDEO_DL !== 'true' && !isDev){
            return await reply(disXvdl, "");
        }

        if (!q) return await reply(notFoundMg);

        const parts = q.split('🎈');
        const title = parts[0] || 'xvideo';
        const downloadUrl = parts[1] || '';
        const image = parts[2] || config.LOGO;

        if (!downloadUrl) return await reply("❌ No download URL found.");

        const rawBuffer = await getThumbnailFromUrl(image);
        const thumbnailBuffer = await resizeThumbnail(rawBuffer);
        await m.react('⬆️');

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            jpegThumbnail: thumbnailBuffer,
            mimetype: "video/mp4",
            fileName: title + '.mp4',
            caption: `🔞 ${title}\n\n${config.FOOTER}`
        }, { quoted: mek });

        await m.react('✔️');

    } catch (e) {
        console.error(e);
        await reply(errorMg, "❌");
    }
});

//============================ ALL IN ONE ============================
cmd({
    pattern: "allinone",
    alias: ["all", "aio", "alldown"],
    react: "🛰️",
    desc: "Download",
    category: "download",
    use: "allinone <url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {
        if (!q || !isUrl(q)) {
            return await reply(needUrl, "🌐");
        }

        const response = await allInOneInfo(q);
        const data = response?.data?.info;
        const formats = response?.data?.formats;

        if (!data || formats.length === 0) return await reply(notFoundMg, "🚫");

        const numrep = [];

        let info = ` *${botName || "PRINCE-MDX"} 𝖠𝖫𝖫 𝖨𝖭 𝖮𝖭𝖤 𝖣𝖮𝖶𝖭𝖫𝖮𝖠𝖣𝖤𝖱*\n\n📹 *Title:* ${data.title || "Unknown"}\n *Available Formats:*\n\n`;

        for (let v = 0; v < formats.length; v++) {
            info += `🎞️ *${formatNumber(v + 1)}.* ${formats[v].label} - \`${formats[v].ext}\`\n`;
            numrep.push(`${prefix}all_dl ${q}🚀${formats[v].format_id}🚀${formats[v].ext}🚀${data.title}🚀${formats[v].lable}🚀${data.thumbnails?.[0]?.url || config.LOGO}`);
        }

        info += `\n\n${config.FOOTER}`;

        const sentMsg = await conn.sendMessage(from, {
            contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: info,
            contextInfo: {
                externalAdReply: {
                    title: "📥 Download via PRINCE-MDX",
                    body: config.BODY || "",
                    thumbnailUrl: config.CONTEXT_LOGO || config.LOGO,
                    mediaType: 1,
                    sourceUrl: q
                }
            }
        }, { quoted: mek });

        const messageKey = sentMsg.key;
        await conn.sendMessage(from, { react: { text: '🚀', key: messageKey } });

        await storenumrepdata({
            key: messageKey,
            numrep,
            method: 'nondecimal'
        });

    } catch (e) {
        console.error(e);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "all_dl",    
    react: "🧲",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply(notFoundMg);

        const [url = '', format_id = '', ext = '', title = '', format = '', image = config.LOGO] = q.split('🚀');

        const dlData = await allInOneDownload(url, format_id);
        const downloadUrl = dlData?.data?.downloadUrl;

        if (!downloadUrl) {
            return await reply(downUrlNotfound, "🛑");
        }

        const mimetype = mime.lookup(ext) || 'application/octet-stream';

        const rawBuffer = await getThumbnailFromUrl(image);
        const thumbnailBuffer = await resizeThumbnail(rawBuffer);
        const caption = `🎬 *${title}*\n\n🧩 *Format:* ${format || format_id} (${ext})\n\n${config.FOOTER}`;

        await m.react('📤');

        await conn.sendMessage(from, {
            contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url: downloadUrl },
            jpegThumbnail: thumbnailBuffer,
            mimetype: mimetype,
            fileName: `${title}.${ext}`,
            caption
        }, { quoted: mek });

        await m.react('✅');

    } catch (e) {
        console.error(e);
        await reply(errorMg, "❌");
    }
});

//============================ SONG ============================
cmd({
    pattern: "cartoon",
    alias: ["gini", "carton", "ginisisilacartoon"],
    react: "⚡",
    desc: "Download Cartoon",
    category: "download",
    use: "ginisisila < Cartoon name >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {
        
        if (!q) {
            return await reply(giniMg, "❓");
        }

        const response = await fetchJson(`${apilink}api/other/ginisisila/search?q=${q}&apikey=${apikey}`);
        const data = response?.data?.data
        if(data?.length === 0) return await reply(notFoundMg, "📛");
        const numrep = [];
      
       let info = `\`⚡ ${botName || "PRINCE-MDX"} 𝖦𝖨𝖭𝖨𝖲𝖨𝖲𝖨𝖫𝖠\`\n`
       
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "gini_det",    
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply(notFoundMg);

        const dailymotion = new Dailymotion();

        const response = await fetchJson(`${apilink}api/other/ginisisila/download?url=${q}&apikey=${apikey}`);
        const data = response?.data;
        if (!data || !data.downloadUrl) return await reply(notFoundMg, "📛");

        let videoUrl = data.downloadUrl;
        const isDailymotion = await checkDailymotionLink(videoUrl);
        const isGDrive = await checkGDriveLink(videoUrl);

        if ((isDailymotion?.valid === false) && (isGDrive?.valid === false)) {
             await reply("❌ *Invalid video link.*");
             await m.react('❌');
             return
        }

        await m.react('⬆️');
        if(isDailymotion?.valid){
                videoUrl = await dailymotion.download(videoUrl);
        } else if(isGDrive?.valid){
                let res = await fg.GDriveDl(videoUrl);
                videoUrl = res.downloadUrl
        }


        const dom = await conn.sendMessage(from, {
            contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url: videoUrl },
            mimetype: "video/mp4",
            fileName: data.title + '.mp4',
            caption: `${data.title}\n\n${config.FOOTER}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: dom.key } });

    } catch (e) {
        console.error(e);
        await reply(errorMg, "❌");
    }
});


//============================ TWITTER ============================
cmd({
    pattern: "twitter",
    alias: ["twdl", "tw"],
    react: "🐋",
    desc: "Download Twitter videos and audio",
    category: "download",
    use: "twitter < Twitter URL >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {
        
        if (!q || !isUrl(q)) {
            return await reply(twMg, "❓");
        }

        const response = await twitter(q);
        if(!response?.video_hd && !response?.video_sd) return await reply(twFailMg, "❌");
        const { video_sd, video_hd, thumb, audio, desc } = response;
        
       let info = `\`${botName || "PRINCE-MDX"} 𝖳𝖶𝖨𝖳𝖳𝖤𝖱\`\n\n` +
           `┏━━━━━━━━━━━━━━━━━━━┓\n` +
           `┣  *Desc:* ${desc}\n` +
           `┗━━━━━━━━━━━━━━━━━━━┛\n` 
           
        

    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "tw_dl",    
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        
        if (!q || !q.includes("https")) {
            return await reply(notFoundMg, "📛");
        }

        const url = q.split(" ")[0];
        const quality = q.split(" ")[1];
        const type = q.split(" ")[2].split("=")[0].toLowerCase() || 'video';
        const title = q.split("=")[1] || '';

        if(quality === "MUSIC"){
                
                if(type === "audio"){
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), audio: { url }, mimetype: "audio/mpeg" }, { quoted: mek });
        await m.react("✅");
                        
                } else if(type === "doc"){
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url }, fileName: `${title}.mp3`, mimetype: "audio/mpeg", caption: `${title}\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
                        
                } else if(type === "voice"){
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), audio: { url }, mimetype: "audio/ogg; codecs=opus", ptt: true }, { quoted: mek });
        await m.react("✅");
                        
            }  
        } else if(type === "video"){
        const msg = await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: `📥 Downloading ${quality} Video...` }, { quoted: mek });
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), video: { url }, fileName: `${title}.mp4`, caption: `🎥 *Here is your FB Video!*\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: mediaMg , edit : msg.key })
            
        } else if(type === "doc"){
        const msg = await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: `📥 Downloading ${quality} Video...` }, { quoted: mek });
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url }, fileName: `${title}.mp4`, mimetype: "video/mp4", caption: `🎥 *Here is your FB Video!*\n\n> ${config.FOOTER}` }, { quoted: mek });
        await m.react("✅");
        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: mediaMg , edit : msg.key })
            
        }
        
    } catch (e) {
        console.log(e);
        await reply(errorMg, "❌");
    }
});

//============================ OTHER ============================
cmd({
    pattern: "mediafire",
    alias: ["mfire", "mf", "mfdl"],
    react: "🐋",
    desc: "Download Meidafile Files",
    category: "download",
    use: "mediafire < Mediafire url >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {

        if (!q || !q.includes("www.mediafire.com")) {
            return await reply(mfireMg, "❓");
        }

        const response = await mediaFire(q);
        
        if (!response?.url) {
            return await reply(notFoundMg);
        }

        const mime = (await axios.get(response.url)).headers['content-type'] || "application/zip"
        await conn.sendMessage(from, {
            contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url: response.url },
            mimetype: mime,
            fileName: response.filename,
            caption: `\`💾 FileName\`: ${response.title || "N/A"}\n\`💽 Size:\` ${response.size || "N/A"}\n\`📅 UploadDate:\` ${response.date || "N/A"}\n\n> ${config.FOOTER}`
        }, { quoted: mek });

        await m.react("✔");

    } catch (error) {
        console.error(error);
        await reply(errorMg, "❌");
    }
});


cmd({
    pattern: "ss",
    alias: ["screenshot", "ssdl", "screen"],
    react: "📸",
    desc: "Download website screen",
    category: "download",
    use: "ss < url >",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {

        if (!q || !q.includes("http")) {
            return await reply(validUrlMg, "❓");
        }

        const url = `https://image.thum.io/get/fullpage/${q}`

        await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), image: { url: url }, caption: config.FOOTER, }, { quoted: mek });

        await m.react("✔");

    } catch (error) {
        console.log(error);
        await reply(errorMg, "❌");
    }
});


cmd({
    pattern: "instagram",
    alias: ["igdl", "ig", "insta"],
    react: "🎀",
    desc: "Download Instagram video",
    category: "download",
    use: "instagram <Instagram URL>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q || !q.startsWith("http") || !q.includes("instagram.com")) {
            return await reply("❌ Please provide a valid Instagram video URL.");
        }

        const apiUrl = `https://Keithsite.top/download/instadl?url=${encodeURIComponent(q)}`;
        const response = await fetch(apiUrl, { method: "GET" });
        const data = await response.json();

        const videoUrl = data.result;
        if (!videoUrl) {
            return await reply("❌ No video found for this Instagram link.");
        }

        await conn.sendMessage(from, {
                contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: `🎥 Here is your Instagram Video!\n\n> ${config.FOOTER || ""}`
            },
            { quoted: mek }
        );

        await m.react("✔");

    } catch (error) {
        console.log("Instagram download error:", error);
        await reply("❌ Failed to download Instagram video. Please try again later.");
    }
});


cmd({
    pattern: "megadl",
    alias: ["mega", "megadownload"],
    desc: "Download files from mega.nz",
    category: "download",
    react: "🍟",
    use: "megadl <mega.nz link>",
    filename: __filename
}, async (conn, mek, m, { q, reply,from }) => {
    try {
            
        if (!q || !q.includes("mega.nz")) return await reply(megaMg);
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const file = File.fromURL(q, { maxWorkers: 16 }); // 8 parallel chunks
        const fileName = (await file.loadAttributes()).name;
        const mimeType = mime.lookup(fileName) || 'application/octet-stream';

        const chunks = [];
        const stream = file.download();

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', async () => {
            const buffer = Buffer.concat(chunks);

            await conn.sendMessage(from, {
                contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: buffer,
                fileName,
                caption: config.FOOTER,
                mimetype: mimeType
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        });

        stream.on('error', async (err) => {
            console.error(err);
            await reply(errorMgMega);
        });

    } catch (e) {
        console.error(e);
        await reply(errorMgMega);
    }
});


cmd({
    pattern: 'img',
    alias: ["img", "imgDl"],
    react: '🖼️',
    desc: 'Search and send images based on a keyword',
    category: 'download',
    use: "img <name>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, q }) => {
    try {
        
        if (!q) {
            return await reply(imgUsage);
        }

        const response = await gis(q);
        if(response.length < 1){
            return await reply(imgNotFound)
        }

        let sentCount = 0;
        for (const image of response.slice(0, 8)) {
            try {
                // Download image with proper headers to avoid 403 errors
                const imgResponse = await axios.get(image.url, {
                    responseType: 'arraybuffer',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                        'Referer': 'https://www.google.com/'
                    }
                });
                
                await conn.sendMessage(from, {
                    contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), image: Buffer.from(imgResponse.data),
                    caption: `🔍 *Search:* ${q}\n\n${config.FOOTER}`
                }, { quoted: mek });
                
                sentCount++;
                if (sentCount >= 5) break; // Send max 5 images
            } catch (imgErr) {
                // Skip this image and try the next one
                continue;
            }
        }
        
        if (sentCount === 0) {
            return await reply(imgNotFound);
        }

    } catch (error) {
        console.error('Error fetching images:', error);
        await reply(imgFetchError);
    }
});


cmd({
    pattern: 'pixabay',
    alias: ["pixaimg", "pixadl"],
    react: '🖼️',
    desc: 'Search and send images based on a keyword',
    category: 'download',
    use: "pixabay < query >",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, q }) => {
    try {
        if (args.length === 0) {
            return reply(imgUsage);
        }

        const keyword = q // args.join(' ');

        const response = await axios.get(PIXABAY_API_URL, {
            params: {
                key: PIXABAY_API_KEY,
                q: keyword,
                image_type: 'photo',
                per_page: 10 
            }
        });

        let images = response.data.hits;

        if (images.length === 0) {
            return reply(imgNotFound);
        }

        images = images.sort(() => Math.random() - 0.5);
        const selectedImages = images.slice(0, 6);

        for (const image of selectedImages) {
            const imageUrl = image.webformatURL;
        
            await conn.sendMessage(from, {
                contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), image: { url: imageUrl },
                caption: `🔍 *Search:* ${keyword}\n\n> ${config.FOOTER}`
            });
        }

        reply(`✅ Sent ${selectedImages.length} images related to "${keyword}".`);

    } catch (error) {
        console.error('Error fetching images:', error);
        reply(imgFetchError);
    }
});

cmd({
    pattern: "wallpaper",
    alias: ["wall", "hdwall"],
    react: "🖼️",
    desc: "Download 3 HD wallpapers from Unsplash",
    category: "download",
    use: ".wallpaper <mobile/desktop> <search term>",
    filename: __filename
}, 
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (args.length < 2) {
            return reply(wallUsage);
        }

        let type = args[0].toLowerCase();
        let keyword = args.slice(1).join(" ");
        let orientation = "landscape";

        if (type === "mobile") {
            orientation = "portrait";
        } else if (type === "desktop") {
            orientation = "landscape";
        } else {
            return reply(wallInvalidType);
        }

        const response = await axios.get(UNSPLASH_API_URL, {
            params: {
                query: keyword,
                client_id: UNSPLASH_ACCESS_KEY,
                orientation: orientation,
                count: 3
            }
        });

        if (!response.data.length) {
            return reply(wallNotFound);
        }


        for (let img of response.data) {
            const imageUrl = img.urls.full;
            const downloadLink = img.links.download;
            const photographer = img.user.name;
            const photographerProfile = img.user.links.html;

            await conn.sendMessage(from, {
                contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), image: { url: imageUrl },
                caption: `
➠ Wallpaper for: ${keyword}
➠ Type: ${type}
➠ Photographer: [${photographer}](${photographerProfile})
➠ Download HD: [Link](${downloadLink})

${config.FOOTER}`
            });
        }

        reply(`✅ Sent 3 wallpapers related to "${keyword}".`);

    } catch (error) {
        console.error("❌ Error fetching wallpapers:", error);
        return reply(wallFetchError);
    }
});


cmd({
    pattern: "gdrive",
    alias: ["googledrive", "gd"],
    react: '📑',
    desc: "Download Google Drive files.",
    category: "download",
    use: 'gdrive < Googledrive link >',
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return await reply(gdMsg);

        let res = await fg.GDriveDl(q);
        
        if (!res || !res.downloadUrl) {
            return await reply(notFoundMg);
        }

        await reply(`*📃 File Name:* ${res.fileName}
*💈 File Size:* ${res.fileSize}
*🕹️ File Type:* ${res.mimetype}`);        

        await conn.sendMessage(from, { 
            contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url: res.downloadUrl }, 
            fileName: res.fileName, 
            mimetype: res.mimetype 
        }, { quoted: mek });

        await m.react("✔");

    } catch (e) {
        console.error(e);
         await reply(errorMg, "❌");
    }
});




cmd({
    pattern: "pagesource",
    react: "🔒",
    alias: ["ps", "source"],
    desc: "Get webpage HTML or metadata as JSON/text",
    category: "download",
    use: ".pagesource <url> [--info | --json | --json --tmsg]",
    filename: __filename,
}, async (conn, mek, m, { args, reply }) => {
    if (!args[0]) return reply(pageUrlError);

    let url = args[0];
    const showInfo = args.includes("--info");
    const saveJson = args.includes("--json");
    const asTextMessage = args.includes("--tmsg");

    if (!url.startsWith("http")) url = "https://" + url;

    try {
        const res = await axios.get(url, { responseType: 'arraybuffer' }); // Get response as arraybuffer
        const html = iconv.decode(res.data, 'utf-8'); // Decode with UTF-8 encoding
        const $ = cheerio.load(html);

        const siteName = new URL(url).hostname.replace("www.", "").split(".")[0];
        const title = $("title").text().trim() || "No title";
        const description = $('meta[name="description"]').attr("content") || "No description";

        const metas = [];
        $("meta").each((i, el) => {
            const name = $(el).attr("name") || $(el).attr("property");
            const content = $(el).attr("content");
            if (name && content) metas.push({ name, content });
        });

        const links = [];
        $("link").each((i, el) => {
            const rel = $(el).attr("rel");
            const href = $(el).attr("href");
            if (rel && href) links.push({ rel, href });
        });

        const scripts = [];
        $("script").each((i, el) => {
            const src = $(el).attr("src");
            if (src) scripts.push(src);
        });

        const images = [];
        $("img").each((i, el) => {
            const src = $(el).attr("src");
            if (src) images.push(src);
        });

        const canonical = $('link[rel="canonical"]').attr("href") || "";

        const jsonData = {
            url,
            title,
            description,
            canonical,
            fetched_at: new Date().toISOString(),
            meta: metas,
            links,
            scripts,
            images
        };

        if (saveJson && asTextMessage) {
            let message = `🌐 *Title:* ${title}\n📝 *Description:* ${description}\n🔗 *URL:* ${url}\n📅 *Fetched:* ${jsonData.fetched_at}\n\n📄 *Meta Tags (${metas.length}):\n` ;
            message += metas.map(m => `• ${m.name}: ${m.content}`).join("\n");
            message += `\n\n🔗 *Links:* ${links.length}\n📜 *Scripts:* ${scripts.length}\n🖼 *Images:* ${images.length}`;
            return await reply(message);
        }

        if (saveJson) {
            const fileName = `${siteName}_pagesource.json`;
            const filePath = path.join(__dirname, fileName);
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));

            await conn.sendMessage(m.chat, {
                contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: fs.readFileSync(filePath),
                mimetype: 'application/json',
                fileName: fileName,
            }, { quoted: m });

            fs.unlinkSync(filePath);
            return;
        }


        const txtFileName = `${siteName}_pagesource.txt`;
        const txtPath = path.join(__dirname, txtFileName);
        fs.writeFileSync(txtPath, html);

        await conn.sendMessage(m.chat, {
            contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: fs.readFileSync(txtPath),
            mimetype: 'text/plain',
            fileName: txtFileName,
        }, { quoted: m });

        if (showInfo) {
            let info = `🌐 *Title:* ${title}\n📝 *Description:* ${description}\n\n📄 *Meta Tags:*\n` ;
            info += metas.slice(0, 15).map(tag => `• ${tag.name}: ${tag.content}`).join("\n");
            await reply(info);
        }

        fs.unlinkSync(txtPath);

    } catch (err) {
        console.error(fetchPageError, err);
        return reply(fetchPageSourceError);
    }
});


cmd({
  pattern: "downurl",
  alias: ["download", "dl", "direct"],
  desc: "Download file from direct download URL",
  category: "download",
  react: "⬆️",
  use: ".downurl <direct_url>",
  filename: __filename,
},
async (conn, mek, m, { q, reply, from, prefix }) => {
  try {
    if (!q || !q.startsWith("http")) {
      return reply(`❌ Please provide a valid direct download link!\n\nExample: ${prefix}downurl https://example.com/file.mp4`);
    }

    // Support multiple URLs separated by ","
    let urls = q.includes(",") ? q.split(",").map(u => u.trim()).filter(Boolean) : [q];

    for (let url of urls) {
      const smsg = await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: "📥 *Downloading File...*" }, { quoted: mek });

      let filename = "file";
      let contentType = "application/octet-stream";

      try {
        const headRes = await axios.head(url);
        const disposition = headRes.headers["content-disposition"];

        if (disposition && /filename="?(.+?)"?($|;)/i.test(disposition)) {
          filename = decodeURIComponent(disposition.match(/filename="?(.+?)"?($|;)/i)[1]);
        } else {
          filename = decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");
        }

        filename = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

        if (filename.endsWith(".mkv")) contentType = "video/mkv";
        else if (filename.endsWith(".mp4")) contentType = "video/mp4";
        else if (headRes.headers["content-type"]) contentType = headRes.headers["content-type"];
      } catch {
        // fallback only using url
        filename = decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");
      }

      await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), text: `⬆️ *Uploading file...*\n\n> ${filename}`, edit: smsg.key });

      try {
        // Direct streaming
        await conn.sendMessage(from, {
          contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url },
          fileName: filename,
          mimetype: contentType,
          caption: `${filename}\n\n${config.CAPTION || config.FOOTER}`
        }, { quoted: mek });
      } catch (e) {
        // Buffer fallback
        const buffer = (await axios.get(url, { responseType: "arraybuffer" })).data;
        await conn.sendMessage(from, {
          contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: buffer,
          fileName: filename,
          mimetype: contentType,
          caption: `${filename}\n\n${config.CAPTION || config.FOOTER}`
        }, { quoted: mek });
      }

      await conn.sendMessage(from, { delete: smsg.key });
    }

  } catch (err) {
    console.error(err);
    await reply(errorMg);
  }
});

  
  cmd({
      pattern: "sexyvid",
      desc: "Send a random romantic HD video from Pexels",
      category: "download",
      react: "💖",
      use: ".romancevid",
      filename: __filename
    }, async (conn, mek, m, { reply }) => {
      try {
          const searchTerms = [
              "sexy romantic",
              "sexy romance",
              "sexy intimate love",
              "sexy hot sensual",
              "sexuality",
              "sexy kiss",
              "sexy couple"
            ];
        const query = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
        const response = await axios.get("https://api.pexels.com/videos/search", {
          headers: {
            Authorization: PEXELS_API_KEY
          },
          params: {
            query,
            per_page: 5
          }
        });
    
        const videos = response.data.videos.filter(video => video.video_files.some(file => file.quality === "hd"));
        if (videos.length === 0) return await reply("😢 No HD romantic videos found.");
    
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        const hdFile = randomVideo.video_files.find(file => file.quality === "hd");
        if (!hdFile) return await reply("⚠️ HD video file not found.");
    
        const sent = await conn.sendMessage(m.chat, {
          contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), video: { url: hdFile.link },
          caption: `💖 *Romantic Video*
    \n\n${config.FOOTER}`
        }, { quoted: mek });
    
        await conn.sendMessage(m.chat, { react: { text: "💖", key: sent.key } });
      } catch (error) {
        console.error("Romance Plugin Error:", error);
        await reply(fetchRomanticVideoError);
      }
    });

    
    cmd({
      pattern: "sexyimg",
      desc: "Send 3 random romantic images from Pexels (mobile size)",
      category: "download",
      react: "💖",
      use: ".romanceimg",
      filename: __filename
    }, async (conn, mek, m, { reply }) => {
      try {
        const searchTerms = [
          "sexy",
          "sexy body",
          "sexuality",
          "sexuality",
          "romantic",
          "sexuality kiss",
          "sexy body"
        ];
        const query = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
        const response = await axios.get("https://api.pexels.com/v1/search", {
          headers: {
            Authorization: PEXELS_API_KEY
          },
          params: {
            query,
            per_page: 10,
            orientation: "portrait"
          }
        });
    
        const images = response.data.photos;
        if (images.length === 0) return await reply(fetchRomanticImagesError);
    
        const randomImages = images.sort(() => 0.5 - Math.random()).slice(0, 3);
    
        for (const [index, image] of randomImages.entries()) {
          const imageUrl = image.src.original;
    
          const sent = await conn.sendMessage(m.chat, {
            contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), image: { url: imageUrl },
            caption: `💖 *Romantic Image ${index + 1}/3*\n\n${config.FOOTER}`
          }, { quoted: mek });
    
          await conn.sendMessage(m.chat, { react: { text: "💖", key: sent.key } });
        }
      } catch (error) {
        console.error("Romance Image Plugin Error:", error);
        await reply("❌ Failed to fetch romantic images.");
      }
    });
    


//============================ PAST PAPER ============================

cmd({
    pattern: "pastpaper",
    alias: ["paper", "pp", "pastp"],
    react: "📃",
    desc: "Download Pastpaper",
    category: "download",
    use: "pastpaper",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {


        let info = `\`📃 ${botName || "PRINCE-MDX"} 𝖯𝖠𝖲𝖳 𝖯𝖠𝖯𝖤𝖱📃\`\n\n`
            

    } catch (error) {
        console.error(error);
        await reply(errorMg, "❌");
    }
});


cmd({
    pattern: "pp_dl",
    react: "📃",
        dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix }) => {
    try {

                if(!q) return
                
                const pp_urls = [
                        "https://paperhub.lk/olevel/",
                        "https://paperhub.lk/al-papers/streams/",
                        "https://paperhub.lk/grade-10-north-western-province/",
                        "https://paperhub.lk/grade-11-north-western-province/"
                ]

                var url = q;
                
                if(q === "O/L") { url = pp_urls[0] }
                else if(q === "A/L") { url = pp_urls[1] }
                else if(q === "G10") { url = pp_urls[2] }
                else if(q === "G11") { url = pp_urls[3] } 

                const data = await fetchJson(`${API_SITE}/api/search/pastpaper?url=${url}`);

                if(data.data.length > 0){

        let info = `\`📃 ${botName || "PRINCE-MDX"} 𝖯𝖠𝖲𝖳 𝖯𝖠𝖯𝖤𝖱📃\`\n\n`;
                let info2 = "";
                let numrep = [];

        for (let item = 0; item < data.data.length; item++) {
                            info2 += `${formatNumber(item + 1)} || ${data.data[item].title}\n`
                numrep.push(`${prefix}pp_dl ${data.data[item].url}`);
                }            

                
            info += `\n${numreplyMg}\n` +
            info2 +
            `\n> ${config.FOOTER}`;
    
        const sentMsg = await conn.sendMessage(from, { contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), image: { url: config.LOGO }, text: info,
                              contextInfo: {
                                      externalAdReply: {
                                          title: `📃 ${botName || "PRINCE-MDX"} 𝖯𝖠𝖲𝖳 𝖯𝖠𝖯𝖤𝖱 📃`,
                                          body: config.BODY || "",
                                          thumbnailUrl: config.CONTEXT_LOGO || config.LOGO,
                                          mediaType: 1,
                                          sourceUrl: dbData?.OFFICIAL_SITE || ""
                                      }}}, { quoted: mek });
        
        const messageKey = sentMsg.key;
        await conn.sendMessage(from, { react: { text: '📃', key: messageKey } });
        const jsonmsg = {
                          key : messageKey,
                          numrep,
                          method : 'nondecimal'
                          }
                        await storenumrepdata(jsonmsg)
                }
                
    } catch (error) {
        console.error(error);
        await reply(errorMg, "❌");
    }
});

cmd({
    pattern: "pp_dl2",
    react: "⬇",
        dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {

        if (!q) {
            return await reply(notFoundMg, "📛");
        }

                var url = q.split("🎈")[0];
                var title = q.split("🎈")[1];
                var downUrl = null
                var filename = title

                if(url.includes("drive.google.com")) {
                        let res = await fg.GDriveDl(url);
                        downUrl = res.downloadUrl
                        filename = res.fileName
                        
                } else if(url.startsWith("https://paperhub.lk/wp-content/")){
                const headRes = await axios.head(url);
        const disposition = headRes.headers["content-disposition"];

        if (disposition && /filename="?(.+?)"?($|;)/i.test(disposition)) {
          filename = decodeURIComponent(disposition.match(/filename="?(.+?)"?($|;)/i)[1]);
        } else {
          filename = decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");
        }
                        downUrl = url
                        
                } else return await reply(notFoundMg, "📛");
                
        const mime = "application/pgf";
        await conn.sendMessage(from, {
            contextInfo: getContextInfo(config.BOT_NAME !== 'default' ? config.BOT_NAME : null), document: { url: downUrl },
            mimetype: mime,
            fileName: `${filename}.pdf`,
            caption: `${filename}\n\n> ${config.FOOTER}`
        }, { quoted: mek });

        await m.react("✔");

    } catch (error) {
        console.error(error);
        await reply(errorMg, "❌");
    }
});
