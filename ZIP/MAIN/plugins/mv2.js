const axios = require("axios");
const https = require("https");
const config = require("../config");

const { cmd } = require("../command");
const { fetchJson, resizeThumbnail } = require("../lib/functions");

// CDN images may use mismatched TLS certs — bypass verification
const tlsAgent = new https.Agent({ rejectUnauthorized: false });

async function safeImageBuffer(url) {
    try {
        const res = await axios.get(url, {
            httpsAgent: tlsAgent,
            responseType: "arraybuffer",
            timeout: 15000,
        });
        return Buffer.from(res.data);
    } catch (_) {
        return null;
    }
}

const { inputMovie, getMovie, resetMovie } = require("../lib/movie_db");
const { storenumrepdata } = require("../lib/numreply-db");
const dbData = require("../lib/config");

// ─── API ─────────────────────────────────────────────────────────────────────
const SILENT_API = "https://mv-api.silent7.app";
const API_KEY    = "api=silenttech";
const NEWSLETTER = "120363404978384902@newsletter";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const oce    = "`";
const pk     = "`(";
const pk2    = ")`";
const botName = "PRINCE-𝖬𝖣X";

const preMg         = "*The command is a command given to premium users by the owners here. ‼️*";
const disMgOnlyme   = "*This feature is set to work only with the Bot number. ‼️*";
const disMgOnlyOwners = "*This feature is set to work only with the owner. ‼️*";
const disMgAll      = "*This feature is disabled. ‼️*";

function formatNumber(n) {
    return String(n).padStart(2, "0");
}

function formatDuration(seconds) {
    if (!seconds) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatBytes(bytes) {
    const b = parseInt(bytes) || 0;
    if (b === 0) return "N/A";
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + " GB";
    if (b >= 1048576)    return (b / 1048576).toFixed(0) + " MB";
    return (b / 1024).toFixed(0) + " KB";
}

const contextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER,
        newsletterName: botName,
        serverMessageId: -1,
    },
};

function guardCheck(config, dbData, isDev, isMe, isOwners) {
    if (!dbData?.FREE_MOVIE_CMD && !isDev) return preMg;
    if (config.MOVIE_DL === "only_me"     && !isMe     && !isDev) return disMgOnlyme;
    if (config.MOVIE_DL === "only_owners" && !isOwners)           return disMgOnlyOwners;
    if (config.MOVIE_DL === "disable"     && !isDev)              return disMgAll;
    return null;
}

// API now returns all episodes in one call via payload.full_resource_list (no pagination)
async function fetchAllMediaPages(subjectId) {
    const res = await fetchJson(`${SILENT_API}/api/media?id=${subjectId}&${API_KEY}`);
    return res?.payload?.full_resource_list || res?.data?.list || [];
}

// ─────────────────────────────────────────────────────────────────────────────
//  movie  —  Search movies & TV series
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "movie",
        alias: ["mv", "tv", "silentmovie"],
        react: "🎬",
        desc: "Search & download movies/series (English)",
        category: "download",
        use: ".movie <Movie or Series Name>",
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = guardCheck(config, dbData, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q)
                return reply(`*Please provide a movie or series name. ❓*\n\n💮 Example: ${prefix}movie Avengers`);

            const res = await fetchJson(`${SILENT_API}/api/search?q=${encodeURIComponent(q)}&${API_KEY}`);
            const items = res?.payload?.items || res?.data?.items;
            if (!items?.length)
                return reply(`*No results found for "${q}". ❌*`);

            let movieList = "";
            const numrep  = [];

            for (const item of items) {
                const isTV    = item.subjectType === 2;
                const icon    = isTV ? "📺" : "🎬";
                const typeTag = isTV ? "[Series]" : "[Movie]";
                const idx     = numrep.length + 1;
                const year    = (item.releaseDate || "").slice(0, 4);

                // Pack: subjectId🎈title🎈subjectType🎈cover🎈genre🎈releaseDate🎈imdb
                const packed = [
                    item.subjectId,
                    item.title,
                    item.subjectType,
                    item.cover?.url || config.LOGO,
                    item.genre       || "N/A",
                    item.releaseDate || "N/A",
                    item.imdbRatingValue || "N/A",
                ].join("🎈");

                movieList += `*${formatNumber(idx)} ||* ${icon} ${typeTag} ${item.title}${year ? ` (${year})` : ""}\n`;
                numrep.push(`${prefix}movie_go ${packed}`);
            }

            const caption =
                `╭─────────────────╮\n` +
                `│ 🔎 *${botName} MOVIE SEARCH* 🎬\n` +
                `├─────────────────┤\n` +
                `│ 📲 ${oce}Input:${oce} *${q}*\n` +
                `│ 🍒 ${oce}Results:${oce} *${items.length}*\n` +
                `╰─────────────────╯\n\n` +
                `${movieList}`;

            const mass = await conn.sendMessage(
                from,
                { image: { url: config.LOGO }, caption: `${caption}\n${config.FOOTER}`, contextInfo },
                { quoted: mek },
            );

            await storenumrepdata({ key: mass.key, numrep, method: "nondecimal" });
        } catch (e) {
            console.error(e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, { react: { text: "⛔️", key: mek.key } });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  movie_go  —  Detail card + quality (movie) OR season list (series)
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "movie_go",
        react: "🎬",
        dontAddCommandList: true,
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = guardCheck(config, dbData, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q) return reply(`*Please provide movie data. ❓*`);

            const parts       = q.split("🎈");
            const subjectId   = parts[0] || "";
            const title       = parts[1] || "N/A";
            const subjectType = parseInt(parts[2]) || 1;
            const cover       = parts[3] || config.LOGO;
            const genre       = parts[4] || "N/A";
            const releaseDate = parts[5] || "N/A";
            const imdb        = parts[6] || "N/A";

            const isTV      = subjectType === 2;
            const typeLabel = isTV ? "📺 Series" : "🎬 Movie";

            // Fetch cover image and details in parallel; media is paginated separately below
            const [coverBuf, details] = await Promise.all([
                safeImageBuffer(cover),
                fetchJson(`${SILENT_API}/api/item-details?id=${subjectId}&${API_KEY}`),
            ]);

            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            const detPayload   = details?.payload || details?.data || {};
            const desc         = detPayload.description || "";
            const totalSeasons = detPayload.seNum || 0;

            // Paginate through all media pages to discover what's actually available
            const mediaList = await fetchAllMediaPages(subjectId);

            const infoCot =
                `╭──────────────────╮\n` +
                `│ ${typeLabel}\n` +
                `╰──────────────────╯\n\n` +
                `  ▫ 🎞️ Title    : *${title}*\n` +
                `  ▫ 📅 Released : ${releaseDate.slice(0, 10)}\n` +
                `  ▫ 🎀 Genre    : ${genre}\n` +
                `  ▫ ⭐ IMDB     : ${imdb}\n` +
                (isTV ? `  ▫ 📺 Seasons  : ${totalSeasons || "N/A"}\n` : "") +
                (desc ? `\n📝 _${desc.slice(0, 200)}${desc.length > 200 ? "..." : ""}_\n` : "");

            if (!mediaList.length) {
                await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `${infoCot}\n❌ *No download links found for this title.*\n_The API may not have it yet._\n\n${config.FOOTER}`,
                        contextInfo,
                    },
                    { quoted: mek },
                );
                return;
            }

            if (isTV) {
                // ── Series: derive available seasons ONLY from actual media list ──
                // Only show seasons that truly have downloadable episodes
                const seasonMap = new Map(); // se → episode count
                for (const item of mediaList) {
                    if (!item.se || !item.ep || !item.resourceLink) continue;
                    if (!seasonMap.has(item.se)) seasonMap.set(item.se, new Set());
                    seasonMap.get(item.se).add(item.ep);
                }
                const availableSeasons = [...seasonMap.entries()].sort((a, b) => a[0] - b[0]);

                if (!availableSeasons.length) {
                    await conn.sendMessage(
                        from,
                        {
                            ...coverMedia,
                            caption: `${infoCot}\n❌ *No season data found.*\n\n${config.FOOTER}`,
                            contextInfo,
                        },
                        { quoted: mek },
                    );
                    return;
                }

                let seasonList = `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n📺 *Select Season:*\n\n`;
                const numrep = [];

                for (const [se, epSet] of availableSeasons) {
                    const idx     = numrep.length + 1;
                    const epCount = epSet.size;
                    seasonList += `*${formatNumber(idx)} ||* 📁 Season ${se}  •  ${epCount} episode${epCount !== 1 ? "s" : ""}\n`;

                    // Pack: subjectId🎈title🎈cover🎈seasonNum
                    const packed = [subjectId, title, cover, se].join("🎈");
                    numrep.push(`${prefix}mv_season ${packed}`);
                }

                const epMsg = await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `${infoCot}${seasonList}\n${config.FOOTER}`,
                        contextInfo,
                    },
                    { quoted: mek },
                );

                await storenumrepdata({ key: epMsg.key, numrep, method: "nondecimal" });

            } else {
                // ── Movie: show quality list directly ──
                // All items have se=0, ep=0; each item is a different quality
                const qualities = mediaList
                    .filter(i => i.resourceLink)
                    .sort((a, b) => (parseInt(a.resolution) || 0) - (parseInt(b.resolution) || 0));

                if (!qualities.length) {
                    await conn.sendMessage(
                        from,
                        {
                            ...coverMedia,
                            caption: `${infoCot}\n❌ *No download links found.*\n\n${config.FOOTER}`,
                            contextInfo,
                        },
                        { quoted: mek },
                    );
                    return;
                }

                let qualityList = `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n📥 *Select Quality:*\n\n`;
                const numrep = [];

                for (const dl of qualities) {
                    const idx          = numrep.length + 1;
                    const qualityLabel = `${dl.resolution || "?"}p`;
                    const sizeLabel    = formatBytes(dl.size);
                    const dur          = formatDuration(dl.duration);

                    qualityList += `*${formatNumber(idx)} ||* 🎯 ${qualityLabel}  •  📦 ${sizeLabel}  •  ⏱ ${dur}\n`;

                    // Pack: resourceLink🎈title🎈qualityLabel🎈sizeLabel🎈cover🎈epLabel
                    const packed = [
                        dl.resourceLink,
                        title,
                        qualityLabel,
                        sizeLabel,
                        cover,
                        "",
                    ].join("🎈");
                    numrep.push(`${prefix}movie_dl ${packed}`);
                }

                const epMsg = await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `${infoCot}${qualityList}\n${config.FOOTER}`,
                        contextInfo,
                    },
                    { quoted: mek },
                );

                await storenumrepdata({ key: epMsg.key, numrep, method: "nondecimal" });
            }

        } catch (e) {
            console.error(e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, { react: { text: "⛔️", key: mek.key } });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  mv_season  —  Episode list for a chosen season
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "mv_season",
        react: "📺",
        dontAddCommandList: true,
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = guardCheck(config, dbData, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q) return reply(`*Please provide season data. ❓*`);

            const parts     = q.split("🎈");
            const subjectId = parts[0] || "";
            const title     = parts[1] || "N/A";
            const cover     = parts[2] || config.LOGO;
            const seasonNum = parseInt(parts[3]) || 1;

            // Fetch cover and all paginated media in parallel
            const [coverBuf, mediaList] = await Promise.all([
                safeImageBuffer(cover),
                fetchAllMediaPages(subjectId),
            ]);

            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            // Deduplicate episodes by episode number to get unique episode list
            const epSet = new Map();
            for (const item of mediaList) {
                if (item.se !== seasonNum) continue;
                if (!epSet.has(item.ep)) epSet.set(item.ep, item.title || `Episode ${item.ep}`);
            }

            const episodes = [...epSet.entries()].sort((a, b) => a[0] - b[0]);

            if (!episodes.length) {
                await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `❌ *No episodes found for Season ${seasonNum}.*\n\n${config.FOOTER}`,
                        contextInfo,
                    },
                    { quoted: mek },
                );
                return;
            }

            let epList = `╭──────────────────╮\n│ 📺 *${title}*\n│ 📁 Season ${seasonNum}\n╰──────────────────╯\n\n📥 *Select Episode:*\n\n`;
            const numrep = [];

            for (const [epNum, epTitle] of episodes) {
                const idx = numrep.length + 1;
                epList += `*${formatNumber(idx)} ||* E${String(epNum).padStart(2, "0")} — ${epTitle}\n`;

                // Pack: subjectId🎈title🎈cover🎈seasonNum🎈epNum🎈epTitle
                const packed = [subjectId, title, cover, seasonNum, epNum, epTitle].join("🎈");
                numrep.push(`${prefix}mv_ep ${packed}`);
            }

            const epMsg = await conn.sendMessage(
                from,
                {
                    ...coverMedia,
                    caption: `${epList}\n${config.FOOTER}`,
                    contextInfo,
                },
                { quoted: mek },
            );

            await storenumrepdata({ key: epMsg.key, numrep, method: "nondecimal" });

        } catch (e) {
            console.error(e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, { react: { text: "⛔️", key: mek.key } });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  mv_ep  —  Quality selection for a chosen series episode
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "mv_ep",
        react: "🎯",
        dontAddCommandList: true,
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = guardCheck(config, dbData, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q) return reply(`*Please provide episode data. ❓*`);

            const parts     = q.split("🎈");
            const subjectId = parts[0] || "";
            const title     = parts[1] || "N/A";
            const cover     = parts[2] || config.LOGO;
            const seasonNum = parseInt(parts[3]) || 1;
            const epNum     = parseInt(parts[4]) || 1;
            const epTitle   = parts[5] || `Episode ${epNum}`;

            const epLabel = `S${seasonNum}E${String(epNum).padStart(2, "0")} — ${epTitle}`;

            // Fetch cover and all paginated media in parallel
            const [coverBuf, mediaList] = await Promise.all([
                safeImageBuffer(cover),
                fetchAllMediaPages(subjectId),
            ]);

            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            // Filter to entries for this specific season + episode
            const qualities = mediaList
                .filter(i => i.se === seasonNum && i.ep === epNum && i.resourceLink)
                .sort((a, b) => (parseInt(a.resolution) || 0) - (parseInt(b.resolution) || 0));

            if (!qualities.length) {
                await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `❌ *No download links found for ${epLabel}.*\n\n${config.FOOTER}`,
                        contextInfo,
                    },
                    { quoted: mek },
                );
                return;
            }

            // Always show quality selection (even if only one option)
            let qualityList =
                `╭──────────────────╮\n` +
                `│ 📺 *${title}*\n` +
                `│ 🎬 ${epLabel}\n` +
                `╰──────────────────╯\n\n` +
                `📥 *Select Quality:*\n\n`;
            const numrep = [];

            for (const dl of qualities) {
                const idx          = numrep.length + 1;
                const qualityLabel = `${dl.resolution || "?"}p`;
                const sizeLabel    = formatBytes(dl.size);
                const dur          = formatDuration(dl.duration);

                qualityList += `*${formatNumber(idx)} ||* 🎯 ${qualityLabel}  •  📦 ${sizeLabel}  •  ⏱ ${dur}\n`;

                const packed = [dl.resourceLink, title, qualityLabel, sizeLabel, cover, epLabel].join("🎈");
                numrep.push(`${prefix}movie_dl ${packed}`);
            }

            const epMsg = await conn.sendMessage(
                from,
                {
                    ...coverMedia,
                    caption: `${qualityList}\n${config.FOOTER}`,
                    contextInfo,
                },
                { quoted: mek },
            );

            await storenumrepdata({ key: epMsg.key, numrep, method: "nondecimal" });

        } catch (e) {
            console.error(e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, { react: { text: "⛔️", key: mek.key } });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  movie_dl  —  Download the chosen quality / episode
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "movie_dl",
        react: "⬇️",
        dontAddCommandList: true,
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = guardCheck(config, dbData, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q)
                return reply(`*Usage: ${prefix}movie_dl <url>🎈<title>🎈<quality>🎈<size>🎈<cover>🎈<epLabel>*`);

            const parts       = q.split("🎈");
            const downloadUrl = parts[0]?.trim() || "";
            const title       = parts[1]?.trim() || "Unknown";
            const quality     = parts[2]?.trim() || "N/A";
            const sizeLabel   = parts[3]?.trim() || "N/A";
            const cover       = parts[4]?.trim() || config.LOGO;
            const epLabel     = parts[5]?.trim() || "";

            if (!downloadUrl) return reply("*Invalid download URL. ❌*");

            const coverBuf   = await safeImageBuffer(cover);
            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            const displayTitle = epLabel ? `${title} — ${epLabel}` : title;

            const statusMsg = await conn.sendMessage(
                from,
                {
                    text: `*⬆️ Uploading:* *${displayTitle}*\n📦 Size: ${sizeLabel} | 🎯 Quality: ${quality}\n\n_Please wait..._`,
                },
                { quoted: mek },
            );

            await inputMovie(true, displayTitle, Date.now());
            await m.react("⬆️");

            let thumbnailBuffer;
            try {
                if (coverBuf) thumbnailBuffer = await resizeThumbnail(coverBuf);
            } catch (_) {
                thumbnailBuffer = undefined;
            }

            const safeTitle  = displayTitle.replace(/[/\\:*?"<>|]/g, " ").trim();
            const filePrefix = config.FILE_NAME ? config.FILE_NAME + " " : "";
            const fileName   = `${filePrefix}${safeTitle} [${quality}].mp4`;

            const caption =
                `*${displayTitle}*\n` +
                `${pk} ${quality} | ${sizeLabel} ${pk2}\n\n` +
                (config.CAPTION || config.FOOTER || "");

            const docPayload = {
                document: { url: downloadUrl },
                fileName,
                mimetype: "video/mp4",
                caption,
            };

            if (thumbnailBuffer) docPayload.jpegThumbnail = thumbnailBuffer;

            await conn.sendMessage(from, docPayload, { quoted: mek });

            await conn.sendMessage(from, {
                text: `*✅ Upload Successful!*\n📌 *${displayTitle}* | 🎯 ${quality}`,
                edit: statusMsg.key,
            });
            await m.react("✔️");
            await inputMovie(false, displayTitle, Date.now());

        } catch (e) {
            await resetMovie();
            console.error(e);
            await reply(e.message || "*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, { react: { text: "⛔️", key: mek.key } });
        }
    },
);
