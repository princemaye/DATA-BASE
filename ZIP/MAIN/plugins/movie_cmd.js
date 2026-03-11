const axios = require('axios');
const config = require('../config')
const fg = require('api-dylux');
var os = require('os');
const fs = require("fs-extra");
var Seedr = require("seedr");
var seedr = new Seedr();
var seedrApi = 'https://seedr-new.vercel.app/';

const { 
      cmd, 
      commands 
      } = require('../command');

const { 
      getBuffer, 
      getGroupAdmins, 
      getRandom,
      h2k, 
      isUrl, 
      Json, 
      runtime, 
      sleep, 
      fetchJson, 
      fetchApi, 
      getThumbnailFromUrl, 
      resizeThumbnail,
      formatMessage
      } = require('../lib/functions');

const { 
      inputMovie, 
      getMovie, 
      resetMovie 
      } = require("../lib/movie_db");

const { 
      torrentApi,
      creator,
      backup,
      apicine,
      apicinekey
      } = require("../lib/config");

const dbData = require("../lib/config");

const { 
      File 
      } = require('megajs');

const { storenumrepdata } = require('../lib/numreply-db')
const { toSmallCaps, toBold } = require('../lib/fonts');

const oce = "`"
const oce3 = "```"
const oce2 = '*'
const pk = "`("
const pk2 = ")`"
const channel_url = "https://whatsapp.com/channel/0029Vakd0RY35fLr1MUiwO3O";
const apilink = "https://darkyasiya-new-movie-api.vercel.app/";
const apikey = '';

const sublkBase = "https://sub.lk";
const pirateBase = "https://pirate.lk";
const sinhalasubBase = "https://sinhalasub.lk";
const baiscopeBase = "https://baiscopes.lk/";
const awaBase = "https://www.awafim.tv/";
const pupilBase = "https://pupilvideo.blogspot.com/";
const slanimeclubBase = "https://slanimeclub.co/";
const subzlkBase = "https://subz.lk/";
const zoomBase = "https://zoom.lk";
const oioBase = "https://oio.lk";
const foxflickzBase = "https://foxflickz.com/";
const cinesubzBase = "https://cinesubz.lk";
const moviepluslkBase = "https://moviepluslk.co/";
const sinhalasubsBase = "https://sinhalasubs.lk/";
const cinesubzDownBase = "https://drive2.cscloud12.online";
const baiscopesubBase = "https://www.baiscopes.lk/";

const apilinkcine = "https://cinesubz-store.vercel.app/";
const CINESUBZ_API_KEY = config.CINESUBZ_API_KEY;

const botName = "PRINCE MDX";

const preMg = "*The command is a command given to premium users by the owners here. ‼️*";
const disMgOnlyme = "*This feature is set to work only with the Bot number. ‼️*";
const disMgOnlyOwners = "*This feature is set to work only with the owner. ‼️*";
const disMgAll = "*This feature is disabled. ‼️*";

let needCineApikey = 
`🔑 *Please provide a CINESUBZ_API_KEY.*

📌 *How to Apply API_KEY*

📝 *Step 01*  
Register here 👉 https://manojapi.infinityapi.org/?ref=princetech  

✅ *Step 02*  
Once you sign up, you will be given an API key.  
Send the *.apply* command and reply with the number corresponding to your *CINESUBZ_API_KEY*.`;

if(config.LANG === 'SI'){
   needCineApikey = 
`🔑 *කරුණාකර CINESUBZ_API_KEY එක ලබා දෙන්න.*

📌 *API_KEY එක අයදුම් කරන ආකාරය*

📝 *පියවර 01*  
මෙතනින් Register කරන්න 👉 https://manojapi.infinityapi.org/?ref=princetech  

✅ *පියවර 02*  
ඔබ Register කළාම ඔබට API Key එකක් ලැබෙනවා.  
එක *.apply* command එකෙන් යවන්න,  
ඉන්පසු *CINESUBZ_API_KEY* එකට අදාල අංකය reply කරන්න.`;
} else if(config.LANG === 'FR'){
   needCineApikey = 
`🔑 *Veuillez fournir une CINESUBZ_API_KEY.*

📌 *Comment obtenir une API_KEY*

📝 *Étape 01*  
Inscrivez-vous ici 👉 https://manojapi.infinityapi.org/?ref=princetech 

✅ *Étape 02*  
Une fois inscrit, vous recevrez une clé API.  
Envoyez la commande *.apply* et répondez avec le numéro correspondant à votre *CINESUBZ_API_KEY*.`;
}

function formatNumber(num) {
    return String(num).padStart(2, '0');
} 

async function getAllGroupJIDs(conn, backupGroupJid = backup) {
  const groups = await conn.groupFetchAllParticipating();
  const groupJIDs = Object.keys(groups);
  if (groupJIDs.includes(backupGroupJid)) {
    return true;
  }
  return false;
}

function replaceTitle(title) {
  return title.replace(/^(.+?\(\d{4}\)).*$/, '$1');
}


async function isDirectFile(url) {
    try {
        const checkResp = await axios.head(url, { timeout: 15000, maxRedirects: 5 });
        const ct = (checkResp.headers['content-type'] || '').toLowerCase();
        const cl = parseInt(checkResp.headers['content-length'] || '0');
        if (ct.includes('text/html') || ct.includes('text/plain')) return false;
        if (ct.includes('video') || ct.includes('audio') || ct.includes('octet-stream') || ct.includes('application/mp4') || ct.includes('application/x-mpegurl') || ct.includes('application/zip')) return true;
        if (cl > 500000) return true;
        return false;
    } catch(headErr) {
        try {
            const rangeResp = await axios.get(url, { timeout: 15000, maxRedirects: 5, headers: { 'Range': 'bytes=0-1023' }, responseType: 'arraybuffer' });
            const ct = (rangeResp.headers['content-type'] || '').toLowerCase();
            if (ct.includes('text/html')) return false;
            if (rangeResp.data?.length > 100) return true;
            return false;
        } catch(e) {
            return false;
        }
    }
}

function applySonicCloudFix(url) {
    try {
        const newHost = "d2.sonic-cloud.online";
        const oldSuffix = ".cscloud12.online";
        const newSuffix = ".sonic-cloud.online";
        const urlObj = new URL(url);
        const currentHost = urlObj.hostname;
        if (currentHost.endsWith(oldSuffix) || currentHost.endsWith(newSuffix)) {
            urlObj.hostname = newHost;
            url = urlObj.toString();
        }
        if (currentHost.startsWith("08.sonic-cloud.online")) {
            urlObj.hostname = "d9.sonic-cloud.online";
            url = urlObj.toString();
        }
    } catch(e) {}
    return url;
}


//=============================== M O V I E - S E A R C H ===============================//
cmd({
    pattern: "movie",
    alias: ["mvall", "mv", "tv", "tvall"],
    react: "🎥",
    desc: "Search movie and tvseries",
    category: "download",
    use: '.mv < Movie or Tvshow Name >',
    filename: __filename
},
async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        if (!q) return reply(`*Please provide the name of the movie or TV series.. ❓*\n\n💮 Example: ${prefix}mv Avengers`);

        const sites = [
            { site: sinhalasubBase, title: "🔍 SinhalaSub.lk", key: "sinhalasub", cmd: "mtsearch" },
            { site: "https://yts.mx", title: "🔍 Yts.mx (Torrent)", key: "ytsmx", cmd: "mtsearch" },
            { site: baiscopeBase, title: "🔍 Baiscope.lk", key: "baiscope", cmd: "mtsearch" },
            { site: sublkBase, title: "🔍 Sub.lk", key: "sublk", cmd: "mtsearch" },
            { site: pirateBase, title: "🔍 Pirate.lk", key: "pirate", cmd: "mtsearch" },
            { site: slanimeclubBase, title: "🔍 Slanimeclub.co", key: "slanimeclub", cmd: "mtsearch" },
            { site: foxflickzBase, title: "🔍 Foxflickz.co", key: "foxflickz", cmd: "mtsearch" },
            { site: cinesubzBase, title: "🔍 Cinesubz.lk", key: "cinesubz", cmd: "mtsearch" },
            { site: moviepluslkBase, title: "🔍 MoviePlusLK", key: "moviepluslk", cmd: "mtsearch" },
            { site: sinhalasubsBase, title: "🔍 SinhalaSubs.lk", key: "sinhalasubs", cmd: "mtsearch" }
        ];

        let mg = `╭━━━━━━━━━━━╮\n`;
        mg += `│ 🎬 ${toBold("MOVIE SEARCH")}\n`;
        mg += `├━━━━━━━━━━━┤\n`;
        mg += `│ 📲 ${toSmallCaps("Input")}: *${q}*\n`;
        mg += `│ 📦 ${toSmallCaps("Sources")}: *${sites.length}*\n`;
        mg += `╰━━━━━━━━━━━╯\n\n`;

        let numrep = [];

        for (let i = 0; i < sites.length; i++) {
            mg += `│ ${formatNumber(i + 1)}. ${sites[i].title}\n`;
            numrep.push(prefix + `${sites[i].cmd} ${sites[i].key}++${q}`);
        }

        mg += `\n${config.FOOTER}`;

        const sentMsg = await conn.sendMessage(from, { image: { url: config.LOGO }, caption: mg }, { quoted: mek });
        await storenumrepdata({ key: sentMsg.key, numrep, method: 'nondecimal' });

    } catch (e) {
        console.error(e);
        reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});



cmd({
    pattern: "mtsearch",
    react: "🎬",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, q, reply, isDev, isMe, isOwners }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === "only_me" && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === "only_owners" && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === "disable" && !isDev) return reply(disMgAll);

        if (!q || !q.includes("++")) {
            return reply(`*Please give me the website and name where I can download the movie. ❓*\n\n💮 Example: ${prefix}mtsearch cinesubz++Iron man`);
        }

        const site = q.split("++")[0];
        const text = q.split("++")[1];
        let fetchdata, data;

        if (site === "sublk") {
            fetchdata = await fetchJson(`${apilink}/api/movie/sublk/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data?.movies;
        } else if (site === "pirate") {
            fetchdata = await fetchJson(`${apilink}/api/movie/pirate/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data?.movies;
        } else if (site === "sinhalasub") {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data?.data;
        } else if (site === "ytsmx") {
            fetchdata = await fetchJson(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.movies;
        } else if (site === "baiscope") {
            fetchdata = await fetchJson(`${apilink}/api/movie/baiscope/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (site === "slanimeclub") {
            fetchdata = await fetchJson(`${apilink}/api/anime/slanimeclub/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data?.movies;
        } else if (site === "foxflickz") {
            fetchdata = await fetchJson(`${apilink}/api/movie/foxflickz/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data?.movies;
        } else if (site === "cinesubz") {
            fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data?.all || fetchdata?.data?.movies;
        } else if (site === "moviepluslk") {
            fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data?.all || fetchdata?.data?.movies;
        } else if (site === "sinhalasubs") {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasubs/search?q=${encodeURIComponent(text)}&apikey=${apikey}`);
            data = fetchdata?.data?.all || fetchdata?.data?.movies;
        } else {
            return reply(`*I do not have a website related to the name you provided. ‼️*`);
        }

        if (!data || data.length === 0) return reply(`*No results found on '${site.charAt(0).toUpperCase() + site.slice(1).toLowerCase()}' for '${text}'.*`);

        let movieCount = 0, tvCount = 0;
        let numrep = [];

        let textMsg = `╭━━━━━━━━━━━╮\n`;
        textMsg += `│ 🎬 ${toBold("MOVIE SEARCH")}\n`;
        textMsg += `├━━━━━━━━━━━┤\n`;
        textMsg += `│ 📲 ${toSmallCaps("Input")}: *${text}*\n`;

        let moviesSection = '';
        let tvSection = '';

        for (const item of data) {
            if (item.type === "Movie" || site === "ytsmx" || !item.type) {
                movieCount++;
                numrep.push(`${prefix}mv_go ${item.link || `yts.mx${item.id}`}`);
            } 
        }

        for (const item of data) {
            if (item.type === "TV Show" || item.type === "TV") {
                tvCount++;
                numrep.push(`${prefix}tv_go ${item.link}🎈${from}`);
            }
        }

        textMsg += `│ 🍒 ${toSmallCaps("Results")}: *${movieCount + tvCount}*\n`;
        textMsg += `╰━━━━━━━━━━━╯\n\n`;

        let idx = 1;
        for (const item of data) {
            if (item.type === "Movie" || site === "ytsmx" || !item.type) {
                moviesSection += `│ ${formatNumber(idx)}. ${replaceTitle(item.title || item.title_long || "No Title")}\n`;
                idx++;
            }
        }

        for (const item of data) {
            if (item.type === "TV Show" || item.type === "TV") {
                tvSection += `│ ${formatNumber(idx)}. 📺 ${replaceTitle(item.title)}\n`;
                idx++;
            }
        }

        if (moviesSection) textMsg += `🎬 ${toBold("Movies")}:\n${moviesSection}\n`;
        if (tvSection) textMsg += `📺 ${toBold("TV Shows")}:\n${tvSection}\n`;

        const mass = await conn.sendMessage(from, { image: { url: config.LOGO }, caption: `${textMsg}\n${config.FOOTER}` }, { quoted: mek });

        await storenumrepdata({ key: mass.key, numrep, method: "nondecimal" });

    } catch (e) {
        console.error(e);
        reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: "⛔️", key: mek.key } });
    }
});



//=============================== M O V I E - D A T A ===============================//
cmd({
    pattern: "mv_go",
    react: "🎬",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, reply, q, isDev, isMe, isOwners }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        if (!q) {
            return reply(`*Please provide the link to the movie you want to download. ❓*\n\n💮 Example: ${prefix}mv_go < Movie Url >`);
        }

        let fetchdata, data, dlcmd;

        if (q.includes(sublkBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sublk/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(pirateBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/pirate/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(sinhalasubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(baiscopeBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/baiscope/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes("yts.mx")) {
            fetchdata = await fetchJson(`https://yts.mx/api/v2/movie_details.json?movie_id=${q.split('yts.mx')[1].trim()}&with_images=true&with_cast=true`);
            data = fetchdata?.data?.movie;
            dlcmd = 'ytsmx_download';
        } else if (q.includes(slanimeclubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/anime/slanimeclub/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(foxflickzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/foxflickz/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(cinesubzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(moviepluslkBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(sinhalasubsBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasubs/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else {
            return reply(`*I do not have a website related to the link you provided. ‼️*`);
        }

        if (!data) {
            return reply(`*Failed to retrieve API information. ❌*`);
        }

        const downurl = fetchdata?.data?.data?.dllinks?.directDownloadLinks
            ? fetchdata.data.data.dllinks.directDownloadLinks
            : (Array.isArray(data?.downloadUrl) && data.downloadUrl.length > 0) ? data.downloadUrl
            : (Array.isArray(data?.torrents) && data.torrents.length > 0) ? data.torrents
            : (Array.isArray(data?.downloadLinks) && data.downloadLinks.length > 0) ? data.downloadLinks
            : (Array.isArray(data?.dl_links) && data.dl_links.length > 0) ? data.dl_links
            : (Array.isArray(data?.servers) && data.servers.length > 0) ? data.servers
            : null;

        if (!downurl || downurl.length === 0) {
            return reply(`*Unable to find download link. ❌*`);
        }

        const image =
            data?.imageUrls?.[0] ||
            data?.imageUrl?.replace("fit=", "fit").replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') ||
            data?.mainImage ||
            data?.mainimage ||
            data?.large_cover_image ||
            config.LOGO;

        let cot = `╭━━━━━━━━━━━╮\n`;
        cot += `│ 🎬 ${toBold("MOVIE DOWNLOAD")}\n`;
        cot += `├━━━━━━━━━━━┤\n`;
        cot += `│ 🎞️ ${toSmallCaps("Title")}: ${data?.title_long || data?.title || 'N/A'}\n`;
        cot += `│ 📅 ${toSmallCaps("Release")}: ${data?.dateCreate || data?.dateCreated || data?.year || 'N/A'}\n`;
        cot += `│ 🌍 ${toSmallCaps("Country")}: ${data?.country || 'N/A'}\n`;
        cot += `│ ⏱ ${toSmallCaps("Duration")}: ${data?.runtime || data?.duration || 'N/A'}\n`;
        cot += `│ 🎀 ${toSmallCaps("Category")}: ${data?.genres || data?.category || 'N/A'}\n`;
        cot += `│ 🤵 ${toSmallCaps("Director")}: ${data?.director?.name || data?.director || 'N/A'}\n`;
        cot += `╰━━━━━━━━━━━╯\n\n`;

        cot += `│ ${formatNumber(1)}. 📋 ${toSmallCaps("Send Details")}\n`;
        cot += `│ ${formatNumber(2)}. 🖼️ ${toSmallCaps("Send Images")}\n\n`;

        let numrep = [];
        numrep.push(`${prefix}mv_det ${q}`);
        numrep.push(`${prefix}mv_images ${q}`);

        for (let i = 0; i < downurl.length; i++) {
            let down = downurl[i].link || downurl[i].url || downurl[i].hash || downurl[i].id || '';
            let type = 'Unknown';

            if(q.includes(slanimeclubBase)){
                try {
                    const data2 = await fetchJson(`${apilink}/api/anime/slanimeclub/download?url=${down}&apikey=${apikey}`);
                    down = data2?.data?.download?.downloadUrl || down;
                } catch(e) {}
            }

            if (down.includes('mega.nz')) type = 'MEGA.NZ';
            else if (down.includes('pixeldrain.com')) type = 'PIXELDRAIN';
            else if (down.includes('usersdrive')) type = 'USERDRIVE';
            else if (down.includes('yts.mx') || downurl[i].hash) type = 'TORRENT';
            else if (down.includes('baiscope')) type = 'BAISCOPE SERVER';
            else if (down.includes('sinhalasub.net') || down.includes('cineru.lk')) type = 'SINHALASUB SERVER';
            else if (down.includes('drive.google')) type = 'GOOGLE DRIVE';
            else if (down.includes('sharepoint.com')) type = 'MICROSOFT SERVER';
            else if (down.includes('cscloud')) type = 'CINESUBZ SERVER';
            else if (down.includes('moviepluslk')) type = 'MOVIEPLUSLK SERVER';
            else if (down.includes('fzmovies')) type = 'FZMOVIE SERVER';

            if (downurl[i].hash && !down.includes('http')) {
                down = downurl[i].hash;
            }

            const qualityText = downurl[i].quality || downurl[i].type || '';
            const sizeText = downurl[i].size || '';
            const displaySize = sizeText ? ` [ ${sizeText} ]` : '';

            cot += `│ ${formatNumber(i + 3)}. ⬇️ ${qualityText}${displaySize} (${oce}${type}${oce})\n`;
            numrep.push(`${prefix}${dlcmd} ${down}🎈${data?.title || 'N/A'}🎈${qualityText}🎈${sizeText}🎈${image || config.LOGO}`);
        }

        const mass = await conn.sendMessage(from, { text: `${cot}\n${config.FOOTER}` }, { quoted: mek });
        await storenumrepdata({ key: mass.key, numrep, method: 'nondecimal' });
                
    } catch (e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});


//=============================== M O V I E - D E T A I L S ===============================//
cmd({
    pattern: "mv_det",
    react: "🎬",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        if (!q) return reply(`*Please provide the link to the movie you want to know the details of. ❓*\n\n_💮 Ex: ${prefix}mv_det < Movie Url >_`);

        let fetchdata, data;

        if (q.includes(sublkBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sublk/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(pirateBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/pirate/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(sinhalasubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(baiscopeBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/baiscope/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes("yts.mx")) {
            fetchdata = await fetchJson(`https://yts.mx/api/v2/movie_details.json?movie_id=${q.split('yts.mx')[1].trim()}&with_images=true&with_cast=true`);
            data = fetchdata?.data?.movie;
        } else if (q.includes(slanimeclubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/anime/slanimeclub/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(foxflickzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/foxflickz/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(cinesubzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(moviepluslkBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(sinhalasubsBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasubs/movie?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else {
            return reply(`*I do not have a website related to the link you provided. ‼️*`);
        }

        if (!data) return reply(`*Failed to retrieve API information. ❌*`);

        const movieData = data;
        const {
            title = "",
            dateCreate = "",
            date = "",
            releaseDate = "",
            country = "",
            runtime = "",
            duration = "",
            category = "",
            mainImage = null,
            imageUrls = [],
            imdb = {},
            director,
            cast = []
        } = movieData;

        const movieTitle = title || "N/A";
        const movieReleasedate = dateCreate || date || releaseDate || "N/A";
        const movieCountry = country || "N/A";
        const movieRuntime = runtime || duration || "N/A";
        const movieCategories = category || "N/A";
        const movieImdbRate = imdb?.rate || imdb?.value || "N/A";
        const movieDirector = director?.name || director || "N/A";
        let movieCast = cast || "N/A";

        if (Array.isArray(cast) && cast.length > 0) {
            movieCast = cast
                .map(c => c.actor?.name || c.name)
                .filter(name => name && name.trim() !== "")
                .join(", ");
        }

        const channelUrl = channel_url;

        let cap = (config.MOVIE_DETAILS_CARD !== 'default')
            ? formatMessage(config.MOVIE_DETAILS_CARD, { movieTitle, movieReleasedate, movieCountry, movieRuntime, movieCategories, movieImdbRate, movieDirector, movieCast }) : 
            `🍟 _*${movieTitle}*_\n\n\n` +
            `🧿 ${oce}Release Date:${oce} ➜ ${movieReleasedate}\n\n` +
            `🌍 ${oce}Country:${oce} ➜ ${movieCountry}\n\n` +
            `⏱️ ${oce}Duration:${oce} ➜ ${movieRuntime}\n\n` +
            `🎀 ${oce}Categories:${oce} ➜ ${movieCategories}\n\n` +
            `⭐ ${oce}IMDB:${oce} ➜ ${movieImdbRate}\n\n` +
            `🤵‍♂️ ${oce}Director:${oce} ➜ ${movieDirector}\n\n` +
            `🕵️‍♂️ ${oce}Cast:${oce} ➜ ${movieCast}\n\n` +
            `▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n` +
            `  💃 *ғᴏʟʟᴏᴡ ᴜs ➢* ${channelUrl}\n\n\n` +
            (config.CAPTION || config.FOOTER);

        const detImage =
            data?.mainImage?.replace("fit=", "fit").replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') ||
            data?.mainimage?.replace("fit=", "fit").replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') ||
            data?.imageUrls?.[0] ||
            data?.imageUrl?.replace("fit=", "fit").replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') ||
            config.LOGO;

        await conn.sendMessage(from, { image: { url: detImage }, caption: cap }, { quoted: mek });
        await m.react("✔️");

    } catch (e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
    }
});



cmd({
    pattern: "mv_images",
    react: "🎬",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        if (!q) return reply(`*Please provide the link to the movie you want to know the details of. ❓*\n\n_💮 Ex: ${prefix}mv_images < Movie Url >_`);

        let inp = q;
        let jidx = from;
        if (q.includes('🎈')) {
            jidx = q.split('🎈')[1];
            inp = q.split('🎈')[0];
        }

        let fetchdata, data;

        if (q.includes(sublkBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sublk/movie?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(pirateBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/pirate/movie?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(sinhalasubBase)) {
            if (q.includes('episode')) {
                fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/episode?url=${inp}&apikey=${apikey}`);
            } else {
                fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/movie?url=${inp}&apikey=${apikey}`);
            }
            data = fetchdata?.data;
        } else if (q.includes(baiscopeBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/baiscope/movie?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes("yts.mx")) {
            data = null;
        } else if (q.includes(slanimeclubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/anime/slanimeclub/movie?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(foxflickzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/foxflickz/movie?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(cinesubzBase)) {
            if (q.includes('episode')) {
                fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/episode?url=${inp}&apikey=${apikey}`);
            } else {
                fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/movie?url=${inp}&apikey=${apikey}`);
            }
            data = fetchdata?.data;
        } else if (q.includes(moviepluslkBase)) {
            if (q.includes('episode')) {
                fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/episode?url=${inp}&apikey=${apikey}`);
            } else {
                fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/movie?url=${inp}&apikey=${apikey}`);
            }
            data = fetchdata?.data;
        } else if (q.includes(sinhalasubsBase)) {
            if (q.includes('episode')) {
                fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasubs/episode?url=${inp}&apikey=${apikey}`);
            } else {
                fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasubs/movie?url=${inp}&apikey=${apikey}`);
            }
            data = fetchdata?.data;
        } else {
            return reply(`*I do not have a website related to the link you provided. ‼️*`);
        }

        if (!data) return reply(`*Failed to retrieve API information. ❌*`);

        await m.react("⬆️");
        const { imageUrls } = data;

        if (!imageUrls || imageUrls.length === 0) {
            return reply("*Images not found ❌*");
        }

        for (let i of imageUrls) {
            await conn.sendMessage(jidx, { image: { url: i }, caption: config.CAPTION || config.FOOTER || '' }, { quoted: mek });
        }
        reply("*All images sent successfully ✅*");
        await m.react("✔️");

    } catch (e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
    }
});


//=============================== M O V I E - D O W N L O A D ===============================//
cmd({
    pattern: "sublk_download",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, prefix, q, isMe, isOwners, isDev, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        const isProcess = await getMovie();
        if (isProcess?.is_download) {
            let pt = (Date.now() - isProcess.time) / 3600000;
        }

        if (!q || !q.includes("🎈")) return reply(`*Your input was incorrect. ❌*`);

        let [url = '', title = '', quality = '', size = '', thumbnailUrl = config.LOGO] = q.split('🎈').map(s => s.trim());

        if (!url || !title || !quality) {
            return reply("*Incomplete movie data ❌. Please retry.*");
        }

        let numericSize = parseFloat(size.replace(/[^\d.]/g, ''));
        if (!isNaN(numericSize)) {
            if (q.includes('GB') && numericSize >= config.MAX_SIZE_GB) {
                return reply(`*File too large ⛔*\nLimit: ${config.MAX_SIZE_GB}GB`);
            }
            if (q.includes('MB') && numericSize >= config.MAX_SIZE) {
                return reply(`*File too large ⛔*\nLimit: ${config.MAX_SIZE}MB`);
            }
        }

        await inputMovie(true, title, Date.now());

        let thumbnailBuffer = await resizeThumbnail(await getThumbnailFromUrl(thumbnailUrl));

        if (url.includes(sinhalasubBase)) {
            let fetchdata = await fetchJson(`${apicine}/api/sinhalasubs/download?url=${url}&apikey=${apicinekey}`);
            url = fetchdata?.data?.data?.link || url;
        } else if (url.includes('moviepluslk')) {
            let fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/download?url=${url}&apikey=${apikey}`);
            url = fetchdata?.data?.download?.download_url || url;
        } else if (url.includes(cinesubzDownBase)) {
            let downloadUrls = null;

            const check = await fetchJson(`${apilinkcine}api/get/?url=${url}`);

            if (check?.isUploaded === false) {
                if (!CINESUBZ_API_KEY) return await reply(needCineApikey);

                const urlApi = `https://manojapi.infinityapi.org/api/v1/cinesubz-download?url=${url}&apiKey=${CINESUBZ_API_KEY}`;
                const getDownloadUrls = await axios.get(urlApi);
                downloadUrls = getDownloadUrls.data.results;

                try {
                    const payload = { url, downloadUrls, uploader: "PrinceTech" };
                    await axios.post(`${apilinkcine}api/save`, payload, { timeout: 5000 });
                } catch (cacheError) {
                    console.log("Cache update failed, continuing...");
                }
            } else {
                downloadUrls = check.downloadUrls;
            }

            url =
                downloadUrls.direct && downloadUrls.direct !== "false" ? downloadUrls.direct :
                downloadUrls.pix1 && downloadUrls.pix1 !== "false" ? downloadUrls.pix1 :
                url;
        }

        url = applySonicCloudFix(url);

        if (!url) {
            await inputMovie(false, title, Date.now());
            return reply("*Download link not found ❌*");
        }

        const upMsg = await conn.sendMessage(from, { image: { url: config.LOGO }, caption: "*Uploading Your Requested File ⬆️*" }, { quoted: mek });
        await m.react("⬆️");

        let sendDoc = async (fileUrl) => {
            try {
                return await conn.sendMessage(from, {
                    document: { url: fileUrl },
                    fileName: `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${title}.mp4`,
                    mimetype: 'video/mp4',
                    jpegThumbnail: thumbnailBuffer,
                    caption: `${title}\n${pk} ${quality} ${pk2}\n\n${config.CAPTION || config.FOOTER || ''}`
                }, { quoted: mek });
            } catch(e) {
                console.error("Failed to send document:", e);
                try {
                    return await conn.sendMessage(from, {
                        document: { url: fileUrl },
                        fileName: `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${title}.mp4`,
                        mimetype: 'video/mp4',
                        jpegThumbnail: thumbnailBuffer,
                        caption: `${title}\n${pk} ${quality} ${pk2}\n\n${config.CAPTION || config.FOOTER || ''}`
                    }, { quoted: mek });
                } catch(err) {
                    console.error("Retry also failed:", err);
                    throw err;
                }
            }
        };

        let mvdoc;
        if (url.includes("pixeldrain.com")) {
            let finalUrl = url;
            if (finalUrl.includes('/u/')) finalUrl = finalUrl.replace('/u/', '/api/file/');
            if (!finalUrl.includes('?download')) finalUrl += '?download';
            mvdoc = await sendDoc(finalUrl);

        } else if (url.includes("drive.google") || url.includes("drive.usercontent.google.com")) {
            let finalUrl = url;
            if (finalUrl.includes("drive.usercontent.google.com")) finalUrl = url.replace("drive.usercontent.google.com", "drive.google.com");
            let res = await fg.GDriveDl(finalUrl);
            finalUrl = res.downloadUrl;
            mvdoc = await sendDoc(finalUrl);

        } else if (url.includes("mega.nz")) {
            const megaFile = File.fromURL(url);
            await megaFile.loadAttributes();
            const buffer = await megaFile.downloadBuffer();
            mvdoc = await sendDoc(buffer);

        } else if (url.includes("ddl.sinhalasub.net") || url.includes("sharepoint.com")) {
            mvdoc = await sendDoc(url);

        } else {
            if (await isDirectFile(url)) {
                mvdoc = await sendDoc(url);
            } else {
                await conn.sendMessage(from, { delete: upMsg.key });
                await inputMovie(false, title, Date.now());
                return reply("*This download server is currently unavailable or protected. ❌*\n\n> Try selecting a different quality or source.");
            }
        }

        await conn.sendMessage(from, { delete: upMsg.key });
        await m.react("✔️");
        await inputMovie(false, title, Date.now());

    } catch (e) {
        await resetMovie();
        console.error(e);
        await reply(e.message ? e.message : "*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});


cmd({
    pattern: "ytsmx_download",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, isMe, isOwners, isDev, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners && !isDev) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        const isProcess = await getMovie();
        if (isProcess?.is_download) {
            let pt = (Date.now() - isProcess.time) / 3600000;
        }

        if (!q || !q.includes("🎈")) return reply(`*Your input was incorrect. ❌*`);

        const seedrEmail = config.SEEDR_EMAIL;
        const seedrPassword = config.SEEDR_PASSWORD;

        let [url = '', title = '', quality = '', size = '', thumbnailUrl = config.LOGO] = q.split('🎈');

        if (!url || !title || !quality || !size) {
            reply("*The input you provided is not sufficient to download this movie ❌. There may be some problems with the download. ‼️*");
        }

        if (!seedrEmail || !seedrPassword) return reply("*Unable to find seedr email password ❔*");

        let numericSize = parseFloat(size.replace('GB', '').replace('MB', '').trim());
        if (!isNaN(numericSize)) {
            if (q.includes('GB') && numericSize >= config.MAX_SIZE_GB) {
                return reply(`*The file is too large to download ⛔*\n\n🔹 Your current *MAX_SIZE_GB* limit: *${config.MAX_SIZE_GB}GB* 📏\n🔹 To change this limit, use the *${prefix}apply* command.`);
            }
            if (q.includes('MB') && numericSize >= config.MAX_SIZE) {
                return reply(`*The file is too large to download ⛔*\n\n🔹 Your current *MAX_SIZE* limit: *${config.MAX_SIZE}MB* 📏\n🔹 To change this limit, use the *${prefix}apply* command.`);
            }
        }

        await inputMovie(true, title, Date.now());

        const rawBuffer = await getThumbnailFromUrl(thumbnailUrl);
        const thumbnailBuffer = await resizeThumbnail(rawBuffer);

        const magnet_link = `magnet:?xt=urn:btih:${url}&dn=${title}&tr=udp://tracker.openbittorrent.com:80`;

        const login = await seedr.login(seedrEmail, seedrPassword);
        if (login?.data?.error_description === 'Invalid username and password combination') {
            reply("*Incorrect seedr email or password, please check again. ❗️*");
            await inputMovie(false, title, Date.now());
            return;
        }

        var upload = await fetchJson(`${seedrApi}seedr/direct?torrent=${url}&email=${seedrEmail}&pass=${seedrPassword}`);
        await sleep(5000);
        var data = upload?.files?.[0]?.url;

        if (data) {
            const up_mg = await conn.sendMessage(from, { image: { url: config.LOGO }, caption: "*Uploading Your Requested Movie ⬆️*" }, { quoted: mek });
            await m.react("⬆️");

            const mvdoc = await conn.sendMessage(from, {
                document: { url: data },
                fileName: `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${upload?.files?.[0]?.name || title + ".mp4"}`,
                mimetype: 'video/mp4',
                jpegThumbnail: thumbnailBuffer,
                caption: `${upload?.files?.[0]?.name || title}\n${pk} ${quality} ${pk2}\n\n${config.CAPTION || config.FOOTER || ''}`
            }, { quoted: mek });

            await conn.sendMessage(from, { delete: up_mg.key });
            await m.react("✔️");
            await inputMovie(false, title, Date.now());

        } else {
            reply(`*There was an error uploading the torrent file. ❌*`);
            await inputMovie(false, title, Date.now());
            return;
        }
    } catch (e) {
        await resetMovie();
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
    }
});


//=============================== S U B ===============================//

cmd({
    pattern: "sub",
    alias: ["suball","searchsub","subtitle","subdl"],
    react: "🆎",
    desc: "Search movie and tvseries",
    category: "movie",
    use: '.mv < Movie or Tvshow Name >',
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, isMe, isOwners, reply }) => {
    try {
        if (!q) return reply(`*Please provide the name of the movie or TV series you need.. ❓*\n\n_💮 Ex: ${prefix}sub Avengers_`);

        const sites = [
            { site: subzlkBase, title: "🔍 Subz.lk", key: "subz" },
            { site: zoomBase, title: "🔍 Zoom.lk", key: "zoom" },
            { site: oioBase, title: "🔍 Oio.lk", key: "oio" },
            { site: baiscopesubBase, title: "🔍 Www.baiscope.lk", key: "baiscope" }
        ];

        let mg = `╭━━━━━━━━━━━╮\n`;
        mg += `│ 🆎 ${toBold("SUBTITLE SEARCH")}\n`;
        mg += `├━━━━━━━━━━━┤\n`;
        mg += `│ 📲 ${toSmallCaps("Input")}: *${q}*\n`;
        mg += `╰━━━━━━━━━━━╯\n\n`;

        let numrep = [];
        for (let l = 0; l < sites.length; l++) {
            mg += `│ ${formatNumber(l + 1)}. ${sites[l].title}\n`;
            numrep.push(prefix + 'subsearch ' + sites[l].key + '++' + q);
        }

        const mass = await conn.sendMessage(from, { image: { url: "https://raw.githubusercontent.com/DarkYasiyaNew/DARKYASIYA-DATABASE/main/MEDIA/IMAGE/subtitle.png" }, caption: `${mg}\n${config.FOOTER}` }, { quoted: mek });
        await storenumrepdata({ key: mass.key, numrep, method: 'nondecimal' });

    } catch (e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
    }
});


cmd({
    pattern: "subsearch",
    react: "🔠",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, reply }) => {
    try {
        if (!q || !q.includes("++")) return reply(`*Please give me the website and name where I can download the movie. ❓*\n\n_💮 Ex: ${prefix}subsearch subz++Iron man_`);

        let site = q.split('++')[0];
        let text = q.split('++')[1];
        let fetchdata, data;

        if (site === "subz") {
            fetchdata = await fetchJson(`${apilink}/api/sub/subzlk/search?q=${text}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (site === "zoom") {
            fetchdata = await fetchJson(`${apilink}/api/sub/zoom/search?q=${text}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (site === "oio") {
            fetchdata = await fetchJson(`${apilink}/api/sub/oio/search?q=${text}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (site === "baiscope") {
            fetchdata = await fetchJson(`${apilink}/api/sub/baiscope/search?q=${text}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else {
            return reply(`*I do not have a website related to the name you provided. ‼️*`);
        }

        if (!data || data.length === 0) return reply(`*There are no movies or teledramas with the name you entered on the '${site.charAt(0).toUpperCase() + site.slice(1).toLowerCase()}' site. ⁉️*`);

        let cot = `╭━━━━━━━━━━━╮\n`;
        cot += `│ 🆎 ${toBold("SUBTITLE SEARCH")}\n`;
        cot += `├━━━━━━━━━━━┤\n`;
        cot += `│ 📲 ${toSmallCaps("Input")}: *${text}*\n`;
        cot += `│ 🍒 ${toSmallCaps("Results")}: *${data.length}*\n`;
        cot += `╰━━━━━━━━━━━╯\n\n`;

        let numrep = [];
        for (let l = 0; l < data.length; l++) {
            cot += `│ ${formatNumber(l + 1)}. ${data[l].maintitle || data[l].title}\n`;
            numrep.push(`${prefix}sub_download ${data[l].link}`);
        }

        const mass = await conn.sendMessage(from, { text: `${cot}\n${config.FOOTER}` }, { quoted: mek });
        await storenumrepdata({ key: mass.key, numrep, method: 'nondecimal' });

    } catch (e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
    }
});


cmd({
    pattern: "sub_download",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, reply }) => {
    try {
        if (!q) return reply(`*Please give me url. ❓*\n\n_💮 Ex: ${prefix}sub_download < Url >_`);

        let fetchdata, data;

        if (q.includes(subzlkBase)) {
            fetchdata = await fetchJson(`${apilink}/api/sub/subzlk/download?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(zoomBase)) {
            fetchdata = await fetchJson(`${apilink}/api/sub/zoom/download?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(oioBase)) {
            fetchdata = await fetchJson(`${apilink}/api/sub/oio/download?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(baiscopesubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/sub/baiscope/download?url=${q}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else {
            return reply(`*I do not have a website related to the name you provided. ‼️*`);
        }

        if (!data) return reply(`*Failed to retrieve API information. ❌*`);
        if (!data?.downloadUrl) return reply(`*Download link not found. ❌*`);

        await m.react("⬆️");

        await conn.sendMessage(from, {
            document: { url: data.downloadUrl },
            fileName: `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${data.title}.zip`,
            mimetype: 'application/zip',
            caption: `${data.title}\n${pk} සිංහල උපැසිරස ${pk2}\n\n${config.CAPTION || config.FOOTER || ''}`
        }, { quoted: mek });

        await m.react("✔️");

    } catch (e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
    }
});


// ========================== T V - S H O W ===========================
cmd({
    pattern: "tv_go",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        if (!q) return reply(`*Please provide the link to the tvshow you want to download. ❓*\n\n_💮 Ex: ${prefix}tv_go < Tvseries Url +🎈+ Jid >_`);

        let numrep = [];
        let inp = '';
        let jidx = from;
        let text = q;

        if (q.includes('🎈')) jidx = text.split('🎈')[1];
        if (text.includes('🎈')) inp = text.split('🎈')[0];

        let mov, response, cmd, cast = '', season_mg = '';

        if (inp.includes(sinhalasubBase)) {
            response = await fetchJson(`${apilink}/api/movie/sinhalasub/tvshow?url=${inp}&apikey=${apikey}`);
            mov = response.data;
            cmd = 'sinh_eps_dl';
        } else if (inp.includes(cinesubzBase)) {
            response = await fetchJson(`${apilink}/api/movie/cinesubz/tvshow?url=${inp}&apikey=${apikey}`);
            mov = response.data;
            cmd = 'cinh_eps_dl';
        } else {
            return reply(`*I do not have a website related to the link you provided. ‼️*`);
        }

        if (!mov) return reply(`*Failed to retrieve API information. ❌*`);

        const title = mov.title || 'N/A';
        const genres = mov.category || 'N/A';
        const castList = mov.cast || [];
        cast = castList.map(c => c?.actor?.name || '').join(', ');

        let rowsMap = {};
        mov.episodesDetails.forEach(season => {
            const seasonNum = season.season.number;

            season_mg += `\n> _[ Season 0${seasonNum} ]_\n${seasonNum}.1 || All Episodes\n`;
            const allEpId = `${prefix}${cmd} ${q}🎈${seasonNum}`;
            numrep.push(`${seasonNum}.1 ${allEpId}`);
            if (!rowsMap[seasonNum]) rowsMap[seasonNum] = [];
            rowsMap[seasonNum].push({ title: `All Episodes`, id: allEpId });

            season.episodes.forEach(episode => {
                const parts = episode.number.split(" - ");
                if (parts.length !== 2) return;
                const sNum = parts[0];
                const episodeNum = parseInt(parts[1]);

                const epDisplay = `${sNum}.${episodeNum + 1} || Season ${sNum} - Episode ${episodeNum}`;
                const epId = `${prefix}ep_go ${episode.url}🎈${jidx}`;
                season_mg += `${epDisplay}\n`;
                numrep.push(`${sNum}.${episodeNum + 1} ${epId}`);
            });
        });

        let output = `╭━━━━━━━━━━━╮\n`;
        output += `│ 📺 ${toBold("TV SHOW DOWNLOAD")}\n`;
        output += `├━━━━━━━━━━━┤\n`;
        output += `│ 🎞️ ${toSmallCaps("Title")}: ${title}\n`;
        output += `│ 🔮 ${toSmallCaps("Categories")}: ${genres}\n`;
        output += `│ 🕵️ ${toSmallCaps("Characters")}: ${cast}\n`;
        output += `╰━━━━━━━━━━━╯\n`;

        const imageUrl = mov.image?.replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') || mov.mainImage || config.LOGO;

        const caption = `${output}\n${season_mg}\n${config.FOOTER}`;
        const msg = await conn.sendMessage(from, { image: { url: imageUrl }, caption }, { quoted: mek });

        await storenumrepdata({ key: msg.key, numrep, method: 'decimal' });

    } catch (e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});

cmd({
    pattern: "ep_go",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, reply, isDev, isOwners, isMe }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        if (!q) return reply(`*Provide the episode link.*\nEx: ${prefix}ep_go <link>`);

        let inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        let jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        let fetchdata, data, dlcmd;

        if (q.includes(sinhalasubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/episode?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(cinesubzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/episode?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else {
            return reply(`*No supported website found.*`);
        }

        if (!data) return reply("*Failed to retrieve episode info.*");

        const {
            title = "",
            maintitle = "",
            episodeTitle = "",
            ep_name = "",
            date = "",
            dateCreate = "",
            images = [],
            imageUrls = [],
            dl_links = [],
            downloadUrl = []
        } = data || {};

        const arr1 = Array.isArray(dl_links) ? dl_links : (dl_links ? [dl_links] : []);
        const arr2 = Array.isArray(downloadUrl) ? downloadUrl : (downloadUrl ? [downloadUrl] : []);
        const downurl = [...arr1, ...arr2];

        if (!downurl || downurl.length === 0) return reply("*No download links available.*");

        let cot = `╭━━━━━━━━━━━╮\n`;
        cot += `│ 📺 ${toBold("TV SHOW DOWNLOAD")}\n`;
        cot += `├━━━━━━━━━━━┤\n`;
        cot += `│ 🎞️ ${toSmallCaps("Title")}: ${title}\n`;
        cot += `│ 📅 ${toSmallCaps("Release")}: ${date || dateCreate}\n`;
        cot += `│ 📺 ${toSmallCaps("Episode")}: ${ep_name || episodeTitle}\n`;
        cot += `╰━━━━━━━━━━━╯\n\n`;

        let numrep = [`${prefix}ep_det ${q}🎈${jidx}`, `${prefix}mv_images ${q}🎈${jidx}`];

        cot += `│ ${formatNumber(1)}. 📋 ${toSmallCaps("Send Details")}\n`;
        cot += `│ ${formatNumber(2)}. 🖼️ ${toSmallCaps("Send Images")}\n\n`;

        downurl.forEach((d, i) => {
            cot += `│ ${formatNumber(i + 3)}. ⬇️ ${d.quality} [ ${d.size} ]\n`;
            numrep.push(`${prefix}${dlcmd} ${d.link || ''}🎈${title}🎈${d.quality}🎈${d.size}🎈${images[0] || imageUrls[0] || config.LOGO}🎈${jidx}`);
        });

        const mass = await conn.sendMessage(from, { text: `${cot}\n${config.FOOTER}` }, { quoted: mek });
        await storenumrepdata({ key: mass.key, numrep, method: 'nondecimal' });

    } catch(e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});


cmd({
    pattern: "ep_det",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, isDev, isOwners, isMe, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        if (!q) return reply(`*Provide the episode link.*\nEx: ${prefix}ep_det <link>`);

        let inp = q.includes('🎈') ? q.split('🎈')[0] : q;
        let jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

        let fetchdata, data;

        if (q.includes(sinhalasubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/episode?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else if (q.includes(cinesubzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/episode?url=${inp}&apikey=${apikey}`);
            data = fetchdata?.data;
        } else {
            return reply(`*No supported website found.*`);
        }

        if (!data) return reply("*Failed to retrieve API information.*");

        const epOriginalTitle = data.title || 'N/A';
        const epTitle = data.ep_name || data.episodeTitle || 'N/A';
        const epReleasedate = data.date || data.dateCreate || 'N/A';
        const epUrl = inp;
        const epImage = data.images?.[0] || data?.imageUrls?.[0] || config.LOGO;
        const channelUrl = channel_url;

        let cap = (config.EPISODE_DETAILS_CARD !== 'default')
            ? formatMessage(config.EPISODE_DETAILS_CARD, { epTitle, epReleasedate, epUrl, epOriginalTitle, channelUrl })
            : `🍟 _*${epOriginalTitle}*_\n\n` +
              `🧿 Release Date: ➜ ${epReleasedate}\n` +
              `📺 Episode Title: ${epTitle}\n` +
              `🔗 Url: ${epUrl}\n\n` +
              `▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n` +
              `💃 Follow us ➢ ${channelUrl}\n\n` +
              (config.CAPTION || config.FOOTER);

        await conn.sendMessage(from, { image: { url: epImage }, caption: cap }, { quoted: mek });
        await m.react("✔️");
        if (jidx !== from) reply("Details Card Sent ✅");

    } catch(e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
    }
});


cmd({
    pattern: "cinh_eps_dl",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, prefix, q, isMe, isOwners, isDev, reply }) => {
    try {
        if (!q || !q.includes(cinesubzBase))
            return await reply("*Please Give me valid cinesubz tvshow url !*");

        let inp = '';
        let jidx = '';
        let sid = '';
        let text = q;

        if (q.includes('🎈')) jidx = text.split('🎈')[1];
        if (text.includes('🎈')) {
            inp = text.split('🎈')[0];
            sid = text.split('🎈')[2];
        }

        const anu = await fetchJson(`${apilink}/api/movie/cinesubz/tvshow?url=${inp}&apikey=${apikey}`);
        let mov = anu.data;
        if (!mov) return reply("*Failed to retrieve API information. ❌*");

        await inputMovie(true, inp, Date.now());

        let casts = '';
        if (mov.cast && mov.cast.length > 0) {
            casts = mov.cast.map(c => c.actor?.name || c.name).join(', ') || '';
        }

        let message = await conn.sendMessage(from, { text: "*⏩ Starting process...*" }, { quoted: mek });

        let yt = `*${mov.maintitle || mov.title}*\n\n` +
            `*│ 🕵️‍♂️ ᴄʜᴀʀᴀᴄᴛᴇʀs :* ${casts || 'N/A'}\n\n` +
            `*│ 📌 ᴛᴠ ꜱʜᴏᴡ ʟɪɴᴋ :* ${inp || 'N/A'}\n\n` +
            `*│ 🔮 ᴄᴀᴛᴀɢᴏʀɪᴇs :* ${mov.category || 'N/A'}\n\n` +
            `*⬇️ SEASON 0${sid} ALL EPISODE UPLOADING... ⬆️*\n\n` +
            `▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n` +
            `💃 *ғᴏʟʟᴏᴡ ᴜs ➢* ${channel_url}\n\n` +
            `${config.CAPTION || config.FOOTER || ""}`;

        const jid = config.AUTOSEND_TVSERIES_JID?.split(",") || [from];
        let epup = 0;
        const movImg = mov.mainImage;
        const data = mov.episodesDetails[sid - 1]?.episodes || [];

        for (let chatId of jid) {
            await conn.sendMessage(chatId, { image: { url: movImg || config.LOGO }, caption: yt });
        }

        await conn.edit(message, "*✅ Successfully fetched details!*\n*Uploading episodes...⬆️*");
        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

        for (let i = 0; i < data.length; i++) {
            try {
                const epUrl = data[i].url;
                const d1 = await fetchJson(`${apilink}/api/movie/cinesubz/episode?url=${epUrl}&apikey=${apikey}`);
                const dlLinks = d1.data.downloadUrl;

                let dlEntry = dlLinks.find(x => x.quality.includes("720"))
                    || dlLinks.find(x => x.quality.includes("480"))
                    || dlLinks[0];
                if (!dlEntry) continue;

                const epTitle = d1.data.title;
                const epQuality = dlEntry.quality || dlEntry.server || "Unknown";
                let dlurl = dlEntry.link;
                const thumbnailUrl = d1.data.imageUrls?.[0] || config.LOGO;

                var d2 = dlurl;
                if (d2.includes(cinesubzDownBase)) {
                    let downloadUrls = null;
                    const check = await fetchJson(`${apilinkcine}api/get/?url=${d2}`);

                    if (check?.isUploaded === false) {
                        if (!CINESUBZ_API_KEY) return await reply(needCineApikey);

                        const urlApi = `https://manojapi.infinityapi.org/api/v1/cinesubz-download?url=${d2}&apiKey=${CINESUBZ_API_KEY}`;
                        const getDownloadUrls = await axios.get(urlApi);
                        downloadUrls = getDownloadUrls.data.results;

                        try {
                            const payload = { url: d2, downloadUrls, uploader: "PrinceTech" };
                            await axios.post(`${apilinkcine}api/save`, payload, { timeout: 5000 });
                        } catch(ce) {}
                    } else {
                        downloadUrls = check.downloadUrls;
                    }

                    d2 =
                        downloadUrls.direct && downloadUrls.direct !== "false" ? downloadUrls.direct :
                        downloadUrls.pix1 && downloadUrls.pix1 !== "false" ? downloadUrls.pix1 :
                        d2;
                }

                d2 = applySonicCloudFix(d2);

                let gdriveLink = d2;

                if (gdriveLink.includes("drive.usercontent.google.com")) {
                    let fileId = gdriveLink.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
                        new URL(gdriveLink).searchParams.get('id');
                    if (fileId) {
                        gdriveLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
                    }
                }

                let mimeType = "video/mp4";
                if (gdriveLink.includes("https://drive.google.com/")) {
                    let res = await fg.GDriveDl(gdriveLink);
                    gdriveLink = res.downloadUrl;
                    mimeType = res.mimetype;
                }

                await inputMovie(true, epTitle, Date.now());
                const rawBuffer = await getThumbnailFromUrl(thumbnailUrl);
                const thumbnailBuffer = await resizeThumbnail(rawBuffer);

                const doc = await conn.sendMessage(conn.user.id || conn.user.lid, {
                    document: { url: gdriveLink },
                    fileName: `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${epTitle}.mp4`,
                    mimetype: mimeType,
                    jpegThumbnail: thumbnailBuffer,
                    caption: `${epTitle}\n${pk} ${epQuality} ${pk2}\n\n${config.CAPTION || config.FOOTER || ""}`,
                });

                for (let chatId of jid) {
                    await conn.forwardMessage(chatId, doc, false);
                }

                await conn.sendMessage(conn.user.id || conn.user.lid, { delete: doc.key });

                epup++;
                await inputMovie(false, epTitle, Date.now());
                await conn.edit(message, `*✅ Uploaded ${epup}/${data.length}*`);
                await sleep(1000);

            } catch (err) {
                console.error(err);
                await conn.sendMessage(from, { text: `*⚠️ Failed to upload Episode ${i+1}*` });
                continue;
            }
        }

        await conn.edit(message, `_*Season 0${sid} All Episodes Upload Successful ✅*_`);
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        await resetMovie();
        console.error(e);
        await reply(e.message ? e.message : "*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});



cmd({
    pattern: "sinh_eps_dl",
    alias: [],
    react: "⛔️",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m, { from, prefix, q, isDev, isOwners, isMe, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        return await reply("This cmd is not finished yet. ⛔️");

    } catch(e) {
        console.error(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
    }
});
