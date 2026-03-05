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

const oce = "`"
const oce3 = "```"
const oce2 = '*'
const pk = "`("
const pk2 = ")`"
const channel_url = "https://whatsapp.com/channel/0029Vakd0RY35fLr1MUiwO3O";
const apilink = "https://b9c3af4f-e0a4-4974-a7f3-5dfe5eca1d0d-00-2x3mdie5gi2gf.janeway.replit.dev";
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
const cinesubzDownBase = "https://drive2.cscloud12.online";
const flixhqBase = "https://flixhq.to";
const fzmovieBase = "https://fzmovies.live";
const hdhub4uBase = "https://hdhub4u";
const nkiriBase = "https://nkiri.com";

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

if(config.LANG === 'FR'){
   needCineApikey = 
`🔑 *Veuillez fournir une CINESUBZ_API_KEY.*

📌 *Comment obtenir une API_KEY*

📝 *Étape 01*  
Inscrivez-vous ici 👉 https://manojapi.infinityapi.org/?ref=princetech 

✅ *Étape 02*  
Une fois inscrit, vous recevrez une clé API.  
Envoyez la commande *.apply* et répondez avec le numéro correspondant à votre *CINESUBZ_API_KEY*.`;
}
// =================== F U N C T I O N =====================
const { storenumrepdata } = require('../lib/numreply-db')
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
            { site: flixhqBase, title: "🔍 FlixHQ (English)", key: "flixhq", cmd: "mtsearch" },
            { site: fzmovieBase, title: "🔍 FZMovie", key: "fzmovie", cmd: "mtsearch" },
            { site: hdhub4uBase, title: "🔍 HDHub4U", key: "hdhub4u", cmd: "mtsearch" },
            { site: nkiriBase, title: "🔍 Nkiri", key: "nkiri", cmd: "mtsearch" }
        ];

        let mg = `╔═〘 ${botName} MOVIE 〙═╗\n\n`;
        mg += ` *Input:* ${q}\n`;
        mg += `╚═════════════════╝\n\n`;


        // ✨ DESIGN LIKE THE ONE YOU REQUESTED
        mg += `╭━❮ AVAILABLE SOURCES ❯━⊷\n`;

        let s_m_g = '';
        let numrep = [];
        let buttons = [];

        for (let i = 0; i < sites.length; i++) {
            mg += `┃➠ ${formatNumber(i + 1)} | ${sites[i].title}\n`;
            numrep.push(prefix + `${sites[i].cmd} ${sites[i].key}++${q}`);

            buttons.push({
                buttonId: `${prefix}${sites[i].cmd} ${sites[i].key}++${q}`,
                buttonText: { displayText: sites[i].title },
                type: 1
            });
        }

        mg += `╰━━━━━━━━━━━━━━━━━⊷\n\n${config.FOOTER}`;


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
            fetchdata = await fetchJson(`${apilink}/api/movie/sublk/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.movies;
        } else if (site === "pirate") {
            fetchdata = await fetchJson(`${apilink}/api/movie/pirate/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.movies;
        } else if (site === "sinhalasub") {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.data;
        } else if (site === "ytsmx") {
            fetchdata = await fetchJson(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.movies;
        } else if (site === "baiscope") {
            fetchdata = await fetchJson(`${apilink}/api/movie/baiscope/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data;
        } else if (site === "slanimeclub") {
            fetchdata = await fetchJson(`${apilink}/api/anime/slanimeclub/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.movies;
        } else if (site === "foxflickz") {
            fetchdata = await fetchJson(`${apilink}/api/movie/foxflickz/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.movies;
        } else if (site === "cinesubz") {
            fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.all;
        }  else if (site === "moviepluslk") {
            fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.all;
        } else if (site === "flixhq") {
            fetchdata = await fetchJson(`${apilink}/api/movie/flixhq/search?query=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.all;
        } else if (site === "fzmovie") {
            fetchdata = await fetchJson(`${apilink}/api/movie/fzmovie/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.all;
        } else if (site === "hdhub4u") {
            fetchdata = await fetchJson(`${apilink}/api/movie/hdhub4u/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.movies;
        } else if (site === "nkiri") {
            fetchdata = await fetchJson(`${apilink}/api/movie/nkiri/search?q=${encodeURIComponent(text)}`);
            data = fetchdata?.data?.movies;
        } else {
            return reply(`*I do not have a website related to the name you provided. ‼️*`);
        }

        if (!data || data.length === 0) return reply(`*No results found on '${site.charAt(0).toUpperCase() + site.slice(1).toLowerCase()}' for '${text}'.*`);

        let movieCount = 0, tvCount = 0;
        let rowsMovies = [];
        let rowsTV = [];
        let numrep = [];

        for (const item of data) {
            if (item.type === "Movie" || site === "ytsmx" || !item.type) {
                movieCount++;
                rowsMovies.push({
                    title: replaceTitle(item.title || item.title_long || "No Title"),
                    description: "Click to download movie",
                    id: `${prefix}mv_go ${item.link || `yts.mx${item.id}`}`
                });
                numrep.push(`${prefix}mv_go ${item.link || `yts.mx${item.id}`}`);
            } 
                }
                
                for (const item of data) {
                  if (item.type === "TV Show" || item.type === "TV") {
                tvCount++;
                rowsTV.push({
                    title: replaceTitle(item.title),
                    description: "Click to download TV show",
                    id: `${prefix}tv_go ${item.link}🎈${from}`
                });
                numrep.push(`${prefix}tv_go ${item.link}🎈${from}`);
            }
        }

        let caption = `╭─────────────────╮\n` +
                      `│ 🔎 *${botName} SEARCH* 🎥\n` +
                      `├─────────────────┤\n` +
                      `│ 📲 Input: *${text}*\n` +
                      `│ 🍒 Results: *${movieCount + tvCount}*\n` +
                      `╰─────────────────╯`;


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
            fetchdata = await fetchJson(`${apilink}/api/movie/sublk/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(pirateBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/pirate/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(sinhalasubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(baiscopeBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/baiscope/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes("yts.mx")) {
            fetchdata = await fetchJson(`https://yts.mx/api/v2/movie_details.json?movie_id=${q.split('yts.mx')[1].trim()}&with_images=true&with_cast=true`);
            data = fetchdata?.data?.movie;
            dlcmd = 'ytsmx_download';
        } else if (q.includes(slanimeclubBase)) {
            fetchdata = await fetchJson(`${apilink}/api/anime/slanimeclub/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(foxflickzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/foxflickz/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(cinesubzBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(moviepluslkBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(flixhqBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/flixhq/info?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(fzmovieBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/fzmovie/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(hdhub4uBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/hdhub4u/movie?url=${q}`);
            data = fetchdata?.data;
            dlcmd = 'sublk_download';
        } else if (q.includes(nkiriBase)) {
            fetchdata = await fetchJson(`${apilink}/api/movie/nkiri/movie?url=${q}`);
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
            : data?.downloadUrl
                ? data.downloadUrl
                : data?.torrents;

        if (!downurl) {
            return reply(`*Unable to find download link. ❌*`);
        }

                let msg = `─────────────────────\n\n` +
          `  *${formatNumber(1)} ||* Send Details\n` +
          `  *${formatNumber(2)} ||* Send Images\n\n`;

let cot = `╭──────────────────╮
│ ${botName || "PRINCE-MDX"} MOVIE DOWNLOAD
╰──────────────────╯

➠ Title       : ${data?.title_long || data.title || 'N/A'}
➠ Release Date: ${data?.dateCreate || data?.dateCreated || data?.year || 'N/A'}
➠ Country     : ${data?.country || 'N/A'}
➠ Duration    : ${data?.runtime || data?.duration || 'N/A'}
➠ Movie Link  : ${q.replace("yts.mx", "")}
➠ Categories  : ${data?.genres || data?.category || 'N/A'}
➠ Director    : ${data?.director?.name || data?.director || 'N/A'}
`;

        const image =
            data?.imageUrls?.[0] ||
            data?.imageUrl?.replace("fit=", "fit").replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') ||
            data?.mainImage ||
            data?.mainimage ||
            data?.large_cover_image ||
            config.LOGO;

        let numrep = [];
        numrep.push(`${prefix}mv_det ${q}`);
        numrep.push(`${prefix}mv_images ${q}`);

        // Add download links info to message and buttons
        let buttons = [];

                
        for (let i = 0; i < downurl.length; i++) {
            let down = downurl[i].link || downurl[i].url || downurl[i].id;
            let type = 'Unknown';

                        if(q.includes(slanimeclubBase)){
                                const data2 = await fetchJson(`${apilink}/api/anime/slanimeclub/download?url=${down}`);
                                down = data2?.data.download.downloadUrl || down
                        }

            if (down.includes('mega.nz')) type = 'MEGA.NZ';
            else if (down.includes('pixeldrain.com')) type = 'PIXELDRAIN';
            else if (down.includes('usersdrive')) type = 'USERDRIVE';
            else if (down.includes('yts.mx')) type = 'TORRENT';
            else if (down.includes('baiscope')) type = 'BAISCOPE SERVER';
            else if (down.includes('sinhalasub.net')) type = 'SINHALASUB SERVER';
                              else if (down.includes('drive.google')) type = 'GOOGLE DRIVE';
                        else if (down.includes('sharepoint.com')) type = 'MICROSOFT SERVER';
                        else if (down.includes('cscloud')) type = 'CINESUBZ SERVER';
            else if (down.includes('moviepluslk')) type = 'MOVIEPLUSLK SERVER';

            msg += `  *${formatNumber(i + 3)} ||* ${downurl[i].quality} [ ${downurl[i].size} (\`${type}\`) ]\n`;
            numrep.push(`${prefix}${dlcmd} ${down}🎈${data?.title || 'N/A'}🎈${downurl[i].quality}🎈${downurl[i].size}🎈${image || config.LOGO}`);

        }

                
    } catch (e) {
        l(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});


//=============================== M O V I E - D E T A I L S && I M A G E S===============================//
cmd({
    pattern: "mv_det",
    react: "🎬",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m,{ from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwners, isDev, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
try{

        if(!dbData?.FREE_MOVIE_CMD && !isDev) {
                reply(preMg)
                return
        }       
        
        if(config.MOVIE_DL === 'only_me' && !isMe && !isDev) {
                reply(disMgOnlyme)
                return
        } else if(config.MOVIE_DL === 'only_owners' && !isOwners){
                reply(disMgOnlyOwners)
                return
        } else if(config.MOVIE_DL === 'disable' && !isDev){
                reply(disMgAll)
                return
        }
        
  if(!q) {
    reply(`*Please provide the link to the movie you want to know the details of. ❓*\n\n_💮 Ex: ${prefix}mv_det < Movie Url >_`);
    return
  }


  var fetchdata;
  var data;
  if(q.includes(sublkBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/sublk/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(pirateBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/pirate/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(sinhalasubBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(baiscopeBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/baiscope/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes("yts.mx")) {
    fetchdata = await fetchJson(`https://yts.mx/api/v2/movie_details.json?movie_id=${q.split('yts.mx')[1].trim()}&with_images=true&with_cast=true`);
    data = fetchdata?.data?.movie;
    
  } else if(q.includes(slanimeclubBase)) {
    fetchdata = await fetchJson(`${apilink}/api/anime/slanimeclub/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(foxflickzBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/foxflickz/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(cinesubzBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(moviepluslkBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(flixhqBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/flixhq/info?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(fzmovieBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/fzmovie/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(hdhub4uBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/hdhub4u/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(nkiriBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/nkiri/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else {
    return reply(`*I do not have a website related to the link you provided. ‼️*`);
  }

  if(data){

          
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

         
             /*var casts = ''
             if(cast){
             for (let i of cast ){ 
                  let name = i.actor?.name || i.name
                  casts += name + ','
             }
             casts = casts.slice(0, -1); // Remove last comma
             }*/

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
               .map(c => c.actor?.name || c.name) // get name
              .filter(name => name && name.trim() !== "") // remove empty or whitespace-only names
              .join(", "); // comma + space
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
                      (config.CAPTION || config.FOOTER)

             const image =
  data?.mainImage.replace("fit=", "fit").replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') ||
  data?.mainimage.replace("fit=", "fit").replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') ||
  data?.imageUrls?.[0] ||
  data?.imageUrl?.replace("fit=", "fit").replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') ||
  
  config.LOGO;
          
             await conn.sendMessage(from, { image: { url: image }, caption: cap }, { quoted : mek })
             
             await m.react("✔️");

  } else {
        reply(`*Failed to retrieve API information. ❌*`);
        return
  }
      } catch (e) {
        l(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
      }
   })



cmd({
    pattern: "mv_images",
    react: "🎬",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m,{ from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwners, isDev, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
try{

        if(!dbData?.FREE_MOVIE_CMD && !isDev) {
                reply(preMg)
                return
        }       
        
        if(config.MOVIE_DL === 'only_me' && !isMe && !isDev) {
                reply(disMgOnlyme)
                return
        } else if(config.MOVIE_DL === 'only_owners' && !isOwners){
                reply(disMgOnlyOwners)
                return
        } else if(config.MOVIE_DL === 'disable' && !isDev){
                reply(disMgAll)
                return
        }
        
  if(!q) {
    reply(`*Please provide the link to the movie you want to know the details of. ❓*\n\n_💮 Ex: ${prefix}mv_images < Movie Url >_`);
    return
  }

                          var inp = q
                                var jidx = from;               
                                var text = q
                                if (q.includes('🎈')) jidx = text.split('🎈')[1]
                                if (text.includes('🎈')) { inp = text.split('🎈')[0]}  

  var fetchdata;
  var data;
  if(q.includes(sublkBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/sublk/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(pirateBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/pirate/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(sinhalasubBase)) {
     if(q.includes('episode')) {
        fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/episode?url=${q}`);
     } else {
        fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/movie?url=${q}`);
     }
     data = fetchdata?.data;
    
  } else if(q.includes(baiscopeBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/baiscope/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes("yts.mx")) {
    // fetchdata = await fetchJson(`https://yts.mx/api/v2/movie_details.json?movie_id=${q.split('yts.mx')[1].trim()}&with_images=true&with_cast=true`);
    data = null;
    
  } else if(q.includes(slanimeclubBase)) {
    fetchdata = await fetchJson(`${apilink}/api/anime/slanimeclub/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(foxflickzBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/foxflickz/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(cinesubzBase)) {
     if(q.includes('episode')) {
        fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/episode?url=${q}`);
     } else {
        fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/movie?url=${q}`);
     }
     data = fetchdata?.data;
    
  } else if(q.includes(moviepluslkBase)) {
     if(q.includes('episode')) {
        fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/episode?url=${q}`);
     } else {
        fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/movie?url=${q}`);
     }
     data = fetchdata?.data;
    
  } else if(q.includes(flixhqBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/flixhq/info?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(fzmovieBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/fzmovie/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(hdhub4uBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/hdhub4u/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(nkiriBase)) {
    fetchdata = await fetchJson(`${apilink}/api/movie/nkiri/movie?url=${q}`);
    data = fetchdata?.data;
    
  } else {
    return reply(`*I do not have a website related to the link you provided. ‼️*`);
  }

  if(!data){
        reply(`*Failed to retrieve API information. ❌*`);
        return
  }
  
             await m.react("⬆️");
             const { imageUrls } = data;

          if(imageUrls.length === 0){
                  reply("*Images not found ❌*");
          }

          for(let i of imageUrls){
             await conn.sendMessage(jidx, { image: { url: i }, caption: config.CPATION || config.FOOTER || '' }, { quoted : mek })
          }
             reply("*All images send successfully ✅*");
             await m.react("✔️");


      } catch (e) {
        l(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
      }
   })


//=============================== M O V I E - D O W N L O A D ===============================//
cmd({
    pattern: "sublk_download",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, prefix, l, quoted, q, isMe, isOwners, isDev, reply }) => {
    try {
        // Permission checks
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

        // Prevent simultaneous downloads
        const isProcess = await getMovie();
        if (isProcess?.is_download) {
            let pt = (Date.now() - isProcess.time) / 3600000; // ms → hrs
           // if (pt < 10) return reply(`_Another movie is being downloaded ❗_\n\nCurrently: *${isProcess.name}*`);
        }

        // Validate input
        if (!q || !q.includes("🎈")) return reply(`*Your input was incorrect. ❌*`);

        let [url = '', title = '', quality = '', size = '', thumbnailUrl = config.LOGO] = q.split('🎈').map(s => s.trim());

        if (!url || !title || !quality || !size) {
            return reply("*Incomplete movie data ❌. Please retry.*");
        }

        // File size check
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

        // Prepare thumbnail
        let thumbnailBuffer = await resizeThumbnail(await getThumbnailFromUrl(thumbnailUrl));

        // SinhalaSub special link
        if (url.includes(sinhalasubBase)) {
            let fetchdata = await fetchJson(`${apicine}/api/sinhalasubs/download?url=${url}&apikey=${apicinekey}`);
            url = fetchdata?.data?.data?.link || url;
        } else if (url.includes('moviepluslk')) {
            let fetchdata = await fetchJson(`${apilink}/api/movie/moviepluslk/download?url=${url}`);
            url = fetchdata?.data?.download?.download_url || url;
        } else if (url.includes(cinesubzDownBase)) {
    try {
        // ALWAYS get fresh links from the external API
        const urlApi = `https://manojapi.infinityapi.org/api/v1/cinesubz-download?url=${encodeURIComponent(url)}&apiKey=${CINESUBZ_API_KEY}`;
        const getDownloadUrls = await axios.get(urlApi, { timeout: 10000 });
        
        if (getDownloadUrls.data?.results) {
            const downloadUrls = getDownloadUrls.data.results;
            
            // CRITICAL CHANGE: Use Pixeldrain links FIRST (they don't expire)
            url =
                downloadUrls.pix1 && downloadUrls.pix1 !== "false" ? downloadUrls.pix1 :
                downloadUrls.pix2 && downloadUrls.pix2 !== "false" ? downloadUrls.pix2 :
                downloadUrls.direct && downloadUrls.direct !== "false" ? downloadUrls.direct :
                url;
            
            console.log("Selected URL type:", 
                url.includes('pixeldrain.com') ? '✅ Pixeldrain (No expiry)' : 
                url.includes('cscloud') ? '⚠️ Cscloud (May expire)' : 
                'Other');
            
            // Update cache with fresh links
            try {
                const payload = { url, downloadUrls, uploader: "PrinceTech" };
                await axios.post(`${apilinkcine}api/save`, payload, { timeout: 5000 });
            } catch (cacheError) {
                console.log("Cache update failed, continuing...");
            }
        }
    } catch (apiError) {
        console.error("Failed to get fresh Cinesubz links:", apiError.message);
        // Keep original URL if API fails
    }
}
/*
                const newHost = "d2.sonic-cloud.online";
                const oldSuffix = ".cscloud12.online";
                const newSuffix = ".sonic-cloud.online";

                const urlObj = new URL(url);
                const currentHost = urlObj.hostname;

                  // Replace old or existing sonic-cloud domains with the new host
                  if (currentHost.endsWith(oldSuffix) || currentHost.endsWith(newSuffix)) {
                    urlObj.hostname = newHost;
                    url = urlObj.toString();
                  }

                  // Fix: `startsWith` instead of `starsWith`, and remove `https://` from the check
                 if (currentHost.startsWith("08.sonic-cloud.online")) {
                   urlObj.hostname = "d9.sonic-cloud.online";
                   url = urlObj.toString();
                 }
*/
        if (!url) {
            await inputMovie(false, title, Date.now());
            return reply("*Download link not found ❌*");
        }

        // Sending "uploading" message
        const upMsg = await conn.sendMessage(from, { image: { url: config.LOGO }, text: "*Uploading Your Requested File ⬆️*" }, { quoted: mek });
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

                // Retry once
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
                    throw err; // Let the calling function handle the failure
                }
            }
        };


        let mvdoc;
        if (url.includes("pixeldrain.com") || url.includes("ddl.sinhalasub.net") || url.includes("baiscope") || url.includes("sharepoint.com") || url.includes("cscloud")) {
            let finalUrl = url;
            if (!url.includes("pixeldrain.com")) finalUrl = url;
            if (url.includes("pixeldrain.com") && !url.includes('?download')) finalUrl += '?download';
            if (url.includes("pixeldrain.com") && !url.includes('/api/file/')) finalUrl = url.replace('/u/', '/api/file/');
            mvdoc = await sendDoc(finalUrl);
                        
        } else if (url.includes("drive.google") || url.includes("drive.usercontent.google.com")) {
            let finalUrl = url;
                        if(finalUrl.includes("drive.usercontent.google.com")) finalUrl = url.replace("drive.usercontent.google.com", "drive.google.com");
                        let res = await fg.GDriveDl(finalUrl);
                        finalUrl = res.downloadUrl;
                        mvdoc = await sendDoc(finalUrl);
            
        } else if (url.includes("mega.nz")) {
            const { File } = require("megajs");
            const file = File.fromURL(url);
            await file.loadAttributes();
            const buffer = await file.downloadBuffer();
            mvdoc = await sendDoc(buffer);
                        
        } else {
            await inputMovie(false, title, Date.now());
            return reply("*Unsupported download link ✖️*\n\n> " + url);
        }

        // Remove "uploading" message
        await conn.sendMessage(from, { delete: upMsg.key });
        await m.react("✔️");
        await inputMovie(false, title, Date.now());

    } catch (e) {
        await resetMovie();
        l(e);
        await reply(e.message ? e.message : "An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});


cmd({
    pattern: "ytsmx_download",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m,{ from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwners, isDev, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
try{

        if(!dbData?.FREE_MOVIE_CMD && !isDev) {
                reply(preMg)
                return
        }       
        
        if(config.MOVIE_DL === 'only_me' && !isMe) {
                reply(disMgOnlyme)
                return
        } else if(config.MOVIE_DL === 'only_owners' && !isOwners && !isDev){
                reply(disMgOnlyOwners)
                return
        } else if(config.MOVIE_DL === 'disable' && !isDev){
                reply(disMgAll)
                return
        }
        
                        const isProcess = await getMovie();
                                if(isProcess.is_download){
                                var pmt = isProcess.time
                                var pt = ( new Date().getTime() - pmt ) / 36000 
                                // if (pt < 10) return reply(`_Another movie is being downloaded, please try again after it finishes downloading. ❗_\n\n_Movie being downloaded ⬆️_\n\n*${isProcess.name}*`)
                                }

      
      
  if(!q || !q.includes("🎈")) {
    reply(`*Your input was incorrect. ❌*`);
    return
  }

        
      const seedrEmail = config.SEEDR_EMAIL;
      const seedrPassword = config.SEEDR_PASSWORD;
        
      let url = '', title = '', quality = '', size = '', thumbnailUrl = config.LOGO;

      const parts = q.split('🎈');

      url = parts[0] || '';
      title = parts[1] || '';
      quality = parts[2] || '';
      size = parts[3] || '';
      thumbnailUrl = parts[4] || config.LOGO;

      if(!url || !title || !quality || !size || !thumbnailUrl){
            reply("*The input you provided is not sufficient to download this movie ❌. There may be some problems with the download. ‼️*");
            // return
      }

      if(!seedrEmail || !seedrPassword){
            reply("*Unable to find seedr email password ❔*");
            return
      }

      size = parseFloat(size.replace('GB', '').replace('MB', '').trim());
      if (!isNaN(size)) {
          if (q.includes('GB') && size >= config.MAX_SIZE_GB) {
              return reply(`*The file is too large to download ⛔*\n\n` +
                           `🔹 Your current *MAX_SIZE_GB* limit: *${config.MAX_SIZE_GB}GB* 📏\n` +
                           `🔹 To change this limit, use the *${prefix}apply* command.`);
          }
          if (q.includes('MB') && size >= config.MAX_SIZE) {
              return reply(`*The file is too large to download ⛔*\n\n` +
                           `🔹 Your current *MAX_SIZE* limit: *${config.MAX_SIZE}MB* 📏\n` +
                           `🔹 To change this limit, use the *${prefix}apply* command.`);
          }
      }

      await inputMovie(true, title, new Date().getTime());

     const rawBuffer = await getThumbnailFromUrl(thumbnailUrl);
     const thumbnailBuffer = await resizeThumbnail(rawBuffer);

        
      const magnet_link = `magnet:?xt=urn:btih:${url}&dn=${title}&tr=udp://tracker.openbittorrent.com:80`
        
      const login = await seedr.login(seedrEmail, seedrPassword);
        if(login?.data?.error_description === 'Invalid username and password combination'){
                reply("*Incorrect seedr email or password, please check again. ❗️*");
                await inputMovie(false, title, new Date().getTime());
                return
        }

        
 /*    const checkVideos = await seedr.getVideos();
     const allVideos = checkVideos.flat();
     for (let video of allVideos) {
       await seedr.deleteFolder(video.fid);
     }

        
      const add = await seedr.addMagnet(magnet_link);
        if(add?.result === "not_enough_space_wishlist_full"){
                reply("*The seedr account is full of memory. ♨️*");
                await inputMovie(false, title, new Date().getTime());
                return
        } else if(add?.error === "Illegal magnet link provided"){
                reply("*This is not a valid magnet URL. ♨️*");
                await inputMovie(false, title, new Date().getTime());
                return  
        }
*/

      var upload = await fetchJson(`${seedrApi}seedr/direct?torrent=${url}&email=${seedrEmail}&pass=${seedrPassword}`);
      await sleep(5000);
      var data = upload?.files?.[0]?.url //add?.user_torrent_id;

  if(data){

          
        /*
        await sleep(1000 * 5)
        await seedr.login(seedrEmail, seedrPassword);
        let checkVideo = await seedr.getVideos();
        
        let validVideos = checkVideo?.length === 0 ? false : true;
          

        if (!validVideos) {
          reply("*There was an error uploading the torrent file. ❌*");
          await inputMovie(false, title, new Date().getTime());
          return;
        }


        const download = await seedr.getFile(checkVideo[0][0].id);
          
        if(!download?.url){
              reply("*Download links cannot be found. ❌*");
              await inputMovie(false, title, new Date().getTime());
              return
        }
*/
        const up_mg = await conn.sendMessage(from, { image: { url:  config.LOGO }, text: "*Uploading Your Requested Movie ⬆️*" }, { quoted: mek });
        await m.react("⬆️");

        const mvdoc = await conn.sendMessage(from, {
                                                  document: { url: data }, 
                                                  fileName: `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${upload?.[0]?.name || title + ".mp4"}`,
                                                  mimetype: `video/mp4`, 
                                                  jpegThumbnail: thumbnailBuffer,
                                                  caption: `${upload?.[0]?.name || title}\n${pk} ${quality} ${pk2}\n\n${config.CAPTION || config.FOOTER || ''}`
                                                  }, { quoted: mek });
          
        //await seedr.deleteFolder(checkVideos[0][0].fid); 
        await conn.sendMessage(from, { delete: up_mg.key });
        await m.react("✔️");
        await inputMovie(false, title, new Date().getTime());
    
  } else {
        reply(`*There was an error uploading the torrent file. ❌*`);
        await inputMovie(false, title, new Date().getTime());
        return
  }
      } catch (e) {
        await resetMovie();
        l(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
      }
   })


//=============================== S U B ===============================//

cmd({
    pattern: "subtitle",
    alias: ["suball","searchsub","sub","subdl"],
    react: "🆎",
    desc: "Search movie and tvseries",
    category: "movie",
    use: '.mv < Movie or Tvshow Name >',
    filename: __filename
},
async(conn, mek, m,{ from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
try{

  if(!q) {
    reply(`*Please provide the name of the movie or TV series you need.. ❓*\n\n_💮 Ex: ${prefix}mv Avengers_`);
    return
  }

      const sites = [
            { site: subzlkBase, title: "*🔍 Search Subz.lk*", key: "subz" },
            { site: zoomBase, title: "*🔍 Search Zoom.lk*", key: "zoom" },
            { site: oioBase, title: "*🔍 Search Oio.lk*", key: "oio" }
      ]

      var s_m_g = '';
      var numrep = [];
      for (let l = 0 ; l < sites.length; l++) {
            s_m_g += `${formatNumber(l + 1)} || ${sites[l].title}\n\n`
            numrep.push(prefix + 'subsearch ' + sites[l].key + '++' + q);
      }

     let mg = `╭─────────────────────╮\n` +
              `│  *PRINCE-MDX 𝖲𝖴𝖡𝖳𝖨𝖳𝖫𝖤*\n` +            
              `├─────────────────────┤\n` +
              `│ 📲 ${oce}Input:${oce} *${q}*\n` +
              `╰─────────────────────╯\n\n` +
              `${s_m_g}`

      const mass = await conn.sendMessage(from, { image: { url : "https://files.catbox.moe/y51vgu.jpg" || config.LOGO }, caption: mg }, { quoted: mek });
                       const jsonmsg = {
                          key : mass.key,
                          numrep,
                          method : 'nondecimal'
                          }
                        await storenumrepdata(jsonmsg) 
      
      } catch (e) {
        l(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
      }
   })


cmd({
    pattern: "subsearch",
    react: "🔠",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m,{ from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
try{

  if(!q || !q.includes("++")) {
    reply(`*Please give me the website and name where I can download the movie. ❓*\n\n_💮 Ex: ${prefix}subsearch subz++Iron man_`);
    return
  }

  let site = q.split('++')[0];
  let text = q.split('++')[1];
  var fetchdata;
  var data;
  if(site === "subz") {
    fetchdata = await fetchJson(`${apilink}/api/sub/subzlk/search?q=${text}`);
    data = fetchdata?.data;
    
  } else if(site === "zoom") {
    fetchdata = await fetchJson(`${apilink}/api/sub/zoom/search?q=${text}`);
    data = fetchdata?.data;
    
  } else if(site === "oio") {
    fetchdata = await fetchJson(`${apilink}/api/sub/oio/search?q=${text}`);
    data = fetchdata?.data;
    
  } else {
    return reply(`*I do not have a website related to the name you provided. ‼️*`);
  }

  if(data){

                    let s_r_m = "";
                    let numrep = [];
                    let movieCount = 0;
  
              for (let l = 0 ; l < data.length; l++) {            
                      s_r_m += `  *${formatNumber(l + 1)} ||* ${data[l].maintitle || dala[l].title}\n`
                      numrep.push(`${prefix}sub_download ${data[l].link}` )
                 }


                 if(!s_r_m) return reply(`*There are no movies or teledramas with the name you entered on the '${site.charAt(0).toUpperCase() + site.slice(1).toLowerCase()}' site. ⁉️*`)
    
    let cot = `╭─────────────────────╮\n` +
              `│ 🔎 *PRINCE-MDX 𝖲𝖴𝖡𝖳𝖨𝖳𝖫𝖤* \n` +            
              `├─────────────────────┤\n` +
              `│ 📲 ${oce}Input:${oce} *${text}*\n` +
              `│ 🍒 ${oce}Results:${oce} *${data.length}*\n` +
              `╰─────────────────────╯\n\n` +
              `${s_r_m}`
    
          const mass = await conn.sendMessage(from, { text: `${cot}\n\n${config.FOOTER}` }, { quoted: mek });
          const jsonmsg = {
                          key : mass.key,
                          numrep,
                          method : 'nondecimal'
                          }
                        await storenumrepdata(jsonmsg) 

    
  } else {
        reply(`*Failed to retrieve API information. ❌*`);
        return
  }
      } catch (e) {
        l(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
      }
   })


cmd({
    pattern: "sub_download",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m,{ from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
try{

 if(!q) {
    reply(`*Please give me url. ❓*\n\n_💮 Ex: ${prefix}sub_download < Url >_`);
    return
  }
        
  var fetchdata;
  var data;
  if(q.includes(subzlkBase)) {
    fetchdata = await fetchJson(`${apilink}/api/sub/subzlk/download?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(zoomBase)) {
    fetchdata = await fetchJson(`${apilink}/api/sub/zoom/download?url=${q}`);
    data = fetchdata?.data;
    
  } else if(q.includes(oioBase)) {
    fetchdata = await fetchJson(`${apilink}/api/sub/oio/download?url=${q}`);
    data = fetchdata?.data;
    
  } else {
    return reply(`*I do not have a website related to the name you provided. ‼️*`);
  }

        if(!data) {
                reply(`*Failed to retrieve API information. ❌*`);
                return
        }
        if(!data?.downloadUrl) {
        reply(`*Download link not found. ❌*`);
        return
        }

        await m.react("⬆️");
        
        const mvdoc = await conn.sendMessage(from, {
                                                  document: { url: data.downloadUrl }, 
                                                  fileName: `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${data.title}.zip`,
                                                  mimetype: `application/zip`, 
                                                  caption: `${data.title}\n${pk} ❤️❤️ ${pk2}\n\n${config.CAPTION || config.FOOTER || ''}`
                                                  }, { quoted: mek });            
        
        await m.react("✔️");

      } catch (e) {
        l(e);
        await reply("*An error occurred. Please try again later. ⛔️*");
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
      }
   })

// ========================== T V - S H O W ===========================
cmd({
  pattern: "tv_go",
  react: "📺",
  dontAddCommandList: true,
  filename: __filename
},
async (conn, mek, m, {
  from, prefix, msr, creator, quoted, body, isCmd, command, args, q, isGroup, sender,
  senderNumber, l, botNumber2, botNumber, pushname, isMe, isOwners, isDev, groupMetadata,
  groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply
}) => {
  try {

        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);

        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

          
    if (!q) {
      return reply(`*Please provide the link to the tvshow you want to download. ❓*\n\n_💮 Ex: ${prefix}tv_go < Tvseries Url +🎈+ Jid >_`);
    }

    let numrep = [];
    let inp = '';
    let jidx = from;
    let text = q;

    if (q.includes('🎈')) jidx = text.split('🎈')[1];
    if (text.includes('🎈')) inp = text.split('🎈')[0];

    let mov, response, cmd, cast = '', season_mg = '';

    // Fetch API
    if (inp.includes(sinhalasubBase)) {
      response = await fetchJson(`${apilink}/api/movie/sinhalasub/tvshow?url=${inp}`);
      mov = response.data;
      cmd = 'sinh_eps_dl';
    } else if (inp.includes(cinesubzBase)) {
      response = await fetchJson(`${apilink}/api/movie/cinesubz/tvshow?url=${inp}`);
      mov = response.data;
      cmd = 'cinh_eps_dl';
    } else {
      return reply(`*I do not have a website related to the link you provided. ‼️*`);
    }

    if (!mov) return reply(`*Failed to retrieve API information. ❌*`);

    // Extract metadata
    const title = mov.title || 'N/A';
    const genres = mov.category || 'N/A';
    const castList = mov.cast || [];
    cast = castList.map(c => c?.actor?.name || '').join(', ');

    // Prepare season/episode options
    mov.episodesDetails.forEach(season => {
      const seasonNum = season.season.number;

      season_mg += `\n> _[ Season 0${seasonNum} ]_\n${seasonNum}.1 || All Episodes\n`;
      const allEpId = `${prefix}${cmd} ${q}🎈${seasonNum}`;
      numrep.push(`${seasonNum}.1 ${allEpId}`);

      season.episodes.forEach(episode => {
        const parts = episode.number.split(" - ");
        if (parts.length !== 2) return;
        const seasonNum = parts[0];
        const episodeNum = parseInt(parts[1]);

        const epDisplay = `${seasonNum}.${episodeNum + 1} || Season ${seasonNum} - Episode ${episodeNum}`;
        const epId = `${prefix}ep_go ${episode.url}🎈${jidx}`;
        season_mg += `${epDisplay}\n`;
        numrep.push(`${seasonNum}.${episodeNum + 1} ${epId}`);
      });
    });

    // Final output text
    const output = `*${botName} 𝖳𝖵 𝖲𝖧𝖮𝖶*

*│ 🎞️ ᴛɪᴛʟᴇ :* ${title}

*│ 🔮 ᴄᴀᴛᴀɢᴏʀɪᴇs :* ${genres}

*│ 🕵️‍♂️ ᴄʜᴀʀᴀᴄᴛᴇʀs :* ${cast}
`;

    const imageUrl = mov.image?.replace(/-\d+x\d+\.jpg$/, '.jpg').replace(/-\d+x\d+\.webp$/, '.webp') || mov.mainImage || config.LOGO;


  } catch (e) {
    l(e);
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
async(conn, mek, m,{ from, prefix, q, reply, isDev, isOwners, isMe }) => {
try {

        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);

        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);
        
  if(!q) return reply(`*Provide the episode link.*\nEx: ${prefix}ep_go <link>`);

  let inp = q.includes('🎈') ? q.split('🎈')[0] : q;
  let jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

  // Fetch data
  let fetchdata, data, dlcmd;
  if(q.includes(sinhalasubBase)){
    fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/episode?url=${inp}`);
    data = fetchdata?.data;
    dlcmd = 'sublk_download';
  } else if(q.includes(cinesubzBase)){
    fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/episode?url=${inp}`);
    data = fetchdata?.data;
    dlcmd = 'sublk_download';
  } else {
          return reply(`*No supported website found.*`);
  }

  if(!data) return reply("*Failed to retrieve episode info.*");

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


  if(!downurl || downurl.length === 0) return reply("*No download links available.*");

  // Caption
  let cot = `${botName || "PRINCE-MDX"} TV SHOW\n\n` +
`┃➠ Title       : ${title}
┃➠ Release Date: ${date}
┃➠ Episode     : ${ep_name || episodeTitle}
┃➠ Link        : ${inp}

> Select JID: ${jidx}`;

  // Buttons / Lists

} catch(e){
  console.error(e);
  await reply("*An error occurred. Please try again later. ⛔️*");
  await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
}});


cmd({
  pattern: "ep_det",
  react: "📺",
  dontAddCommandList: true,
  filename: __filename
},
async(conn, mek, m, { from, prefix, q, isDev, isOwners, isMe, reply }) => {
try {
  // Permission checks
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);

        if (config.MOVIE_DL === 'only_me' && !isMe && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners) return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable' && !isDev) return reply(disMgAll);

  if(!q) return reply(`*Provide the episode link.*\nEx: ${prefix}ep_det <link>`);

  // Handle multi-JID
  let inp = q.includes('🎈') ? q.split('🎈')[0] : q;
  let jidx = q.includes('🎈') ? q.split('🎈')[1] : from;

  // Fetch API data
  let fetchdata, data;
  if(q.includes(sinhalasubBase)){
    fetchdata = await fetchJson(`${apilink}/api/movie/sinhalasub/episode?url=${inp}`);
    data = fetchdata?.data;
  } if(q.includes(cinesubzBase)){
    fetchdata = await fetchJson(`${apilink}/api/movie/cinesubz/episode?url=${inp}`);
    data = fetchdata?.data;
  } else return reply(`*No supported website found.*`);

  if(!data) return reply("*Failed to retrieve API information.*");

  // Map API fields correctly
  const epOriginalTitle = data.title || 'N/A';
  const epTitle = data.ep_name || data.episodeTitle || 'N/A';
  const epReleasedate = data.date || data.dateCreate || 'N/A';
  const epUrl = inp;
  const epImage = data.images?.[0] || data?.imageUrls[0] || config.LOGO;
  const channelUrl = channel_url;

  // Build caption
  let cap = (config.EPISODE_DETAILS_CARD !== 'default') 
    ? formatMessage(config.EPISODE_DETAILS_CARD, { epTitle, epReleasedate, epUrl, epOriginalTitle, channelUrl }) 
    : `🍟 _*${epOriginalTitle}*_\n\n` +
      `🧿 Release Date: ➜ ${epReleasedate}\n` +
      `📺 Episode Title: ${epTitle}\n` +
      `🔗 Url: ${epUrl}\n\n` +
      `▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n` +
      `💃 Follow us ➢ ${channelUrl}\n\n` +
      (config.CAPTION || config.FOOTER);

  // Send details card
  await conn.sendMessage(from, { image: { url: epImage }, caption: cap }, { quoted: mek });


  await m.react("✔️");
  if(jidx !== from) reply("Details Card Sent ✅");

} catch(e) {
  console.error(e);
  await reply("*An error occurred. Please try again later. ⛔️*");
  await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key }});
}});


cmd({
    pattern: "cinh_eps_dl",
    react: "📺",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, l, quoted, body, prefix, isCmd, command, args, q, isGroup, sender, pushname, isMe, isOwner, reply }) => {
try {
    if (!q || !q.includes(cinesubzBase)) 
        return await reply("*Please Give me valid cinesubz tvshow url !*")

    let inp = ''
    let jidx = ''
    let sid = ''
    let text = q

    if (q.includes('🎈')) jidx = text.split('🎈')[1]
    if (text.includes('🎈')) { 
        inp = text.split('🎈')[0]
        sid = text.split('🎈')[2]
    }   

    const anu = await fetchJson(`${apilink}/api/movie/cinesubz/tvshow?url=${inp}`);
    let mov = anu.data;
    if (!mov) return reply("*Failed to retrieve API information. ❌*");

    await inputMovie(true, inp, new Date().getTime());

    let casts = ''
    if (mov.cast && mov.cast.length > 0) {
        casts = mov.cast.map(c => c.actor?.name || c.name).join(', ') || ''
    }
    
    let message = await conn.sendMessage(from, { text: "*⏩ Starting process...*" }, { quoted: mek })    

    let yt = `*${mov.maintitle}*

 ➠ᴄʜᴀʀᴀᴄᴛᴇʀs :* ${casts || 'N/A'}

 ➠ᴛᴠ ꜱʜᴏᴡ ʟɪɴᴋ :* ${inp || 'N/A'}

 ➠ᴄᴀᴛᴀɢᴏʀɪᴇs :* ${mov.category || 'N/A'}

 ➠ SEASON 0${sid} ALL EPISODE UPLOADING... ⬆️*

▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃

${config.CAPTION || config.FOOTER || ""}
`

    const jid = config.AUTOSEND_TVSERIES_JID?.split(",") || [from];
    let epup = 0;
    const movImg = mov.mainImage;
    const data = mov.episodesDetails[sid - 1]?.episodes || [];

        for (let chatId of jid) {
    await conn.sendMessage(chatId, { image: { url: movImg || config.LOGO }, caption: yt + `${config.CAPTION}` })
        }
        
    await conn.edit(message, "*✅ Successfully fetched details!*\n*Uploading episodes...⬆️*")
    await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } })

    // -------- EPISODE LOOP --------
    for (let i = 0; i < data.length; i++) {
        try {
            const epUrl = data[i].url
            const d1 = await fetchJson(`${apilink}/api/movie/cinesubz/episode?url=${epUrl}`);
            const dlLinks = d1.data.downloadUrl;

            let dlEntry = dlLinks.find(x => x.quality.includes("720")) 
                        || dlLinks.find(x => x.quality.includes("480")) 
                        || dlLinks[0]
            if (!dlEntry) continue

            const epTitle = d1.data.title
            const quality = dlEntry.quality
            const dlurl = dlEntry.link
            const thumbnailUrl = d1.data.imageUrls?.[0] || config.LOGO

            // GET GDRIVE LINK
            var d2 = dlurl;
                        if (d2.includes(cinesubzDownBase)) {
              let downloadUrls = null;

              const check = await fetchJson(`${apilinkcine}api/get/?url=${d2}`);

              if (check?.isUploaded === false) {

                                if(!CINESUBZ_API_KEY) return await reply(needCineApikey);
                                  
                // Fetch new download links from external API
                const urlApi = `https://manojapi.infinityapi.org/api/v1/cinesubz-download?url=${url}&apiKey=${CINESUBZ_API_KEY}`;
                const getDownloadUrls = await axios.get(urlApi);

                downloadUrls = getDownloadUrls.data.results;

                // Save to your API
                const payload = { url, downloadUrls, uploader: "PrinceTech" };
                const response = await axios.post(`${apilinkcine}api/save`, payload);

                /*
                const urlApi = `https://movie-api-ymd.koyeb.app/api/movie/cinesubz/download?url=${encodeURIComponent(d2)}`;
                const getDownloadUrls = await axios.get(urlApi);

                                const movieData = getDownloadUrls.data?.data;
                downloadUrls = movieData.downloadUrl


                // Save to your API
                const payload = { url: d2, name: movieData?.title || title, size: movieData?.size, downloadurl: downloadUrls, uploader: "PrinceTech" };
                const response = await axios.get(`${apilinkcine}api/save`, { params: payload });
                                */

              } else {
                // Already uploaded → use existing links
                downloadUrls = check.downloadUrls;

              }
                        
                d2 =
                  downloadUrls.direct && downloadUrls.direct !== "false" ? downloadUrls.direct :
                  downloadUrls.pix1 && downloadUrls.pix1 !== "false" ? downloadUrls.pix1 :
                  url;
            }
                        
            let gdriveLink = d2

            if (gdriveLink.includes("https://drive.usercontent.google.com/")) {
                gdriveLink = gdriveLink.replace("https://drive.usercontent.google.com/", "https://drive.google.com/")
            }

            let mimeType = "video/mp4"
            if (gdriveLink.includes("https://drive.google.com/")) {
                let res = await fg.GDriveDl(gdriveLink)
                gdriveLink = res.downloadUrl
                mimeType = res.mimetype
            }

            // UPLOAD
            await inputMovie(true, epTitle, new Date().getTime());
            const rawBuffer = await getThumbnailFromUrl(thumbnailUrl);
            const thumbnailBuffer = await resizeThumbnail(rawBuffer);

                        const doc = await conn.sendMessage(conn.user.id || conn.user.lid, {
                document: { url: gdriveLink },
                fileName: `${config.FILE_NAME} ${epTitle}.mp4`,
                mimetype: mimeType,
                jpegThumbnail: thumbnailBuffer,
                caption: `${epTitle}\n${pk} ${quality} ${pk2}\n\n${config.CAPTION || config.FOOTER || ""}`,
            });
                        
                        for (let chatId of jid) {
                                await conn.forwardMessage(chatId, doc, false);
                        }

                        await conn.sendMessage(conn.user.id || conn.user.lid, { delete: doc.key });

            epup++
            await inputMovie(false, epTitle, new Date().getTime());
            await conn.edit(message, `*✅ Uploaded ${epup}/${data.length}*`)
            await sleep(1000)

        } catch (err) {
            l(err)
            await conn.sendMessage(from, { text: `*⚠️ Failed to upload Episode ${i+1}*` })
            continue
        }
    }

    await conn.edit(message, `_*Season 0${sid} All Episodes Upload Successful ✅*_`)
    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } })

} catch (e) {
    await resetMovie();
    l(e);
    await reply(e.message ? e.message : "*An error occurred. Please try again later. ⛔️*");
    await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } })
}
})



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
}});

