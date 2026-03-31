const axios = require("axios");
const https = require("https");
const config = require("../config");

const { cmd } = require("../command");
const { fetchJson, resizeThumbnail } = require("../lib/functions");
const { inputMovie, resetMovie } = require("../lib/movie_db");
const { storenumrepdata } = require("../lib/numreply-db");
const dbData = require("../lib/config");

// ─── API ─────────────────────────────────────────────────────────────────────
const BASE =
    "https://prince-tech-stream-api.princemayel99.workers.dev/api/movies";

// Secret key — must match PROXY_KEY in worker.js.
// Appended to the proxyUrl when the bot downloads the file server-side,
// giving the request a longer timeout and bypassing bot-detection heuristics.
const PROXY_KEY = "ptk_94f2a1b8e3c5d7f9a2b4c6e8f0d1327c";

// Cover images may have TLS mismatches — bypass verification
const tlsAgent = new https.Agent({ rejectUnauthorized: false });

async function safeCover(url) {
    try {
        const r = await axios.get(url, {
            httpsAgent: tlsAgent,
            responseType: "arraybuffer",
            timeout: 15000,
        });
        return Buffer.from(r.data);
    } catch (_) {
        return null;
    }
}

// Extract the real CDN URL buried inside the proxy URL.
// The proxy uses either ?v=<base64> or ?url=<percentEncoded>.
function extractCdnUrl(proxyUrl) {
    try {
        const u = new URL(proxyUrl);
        const encoded = u.searchParams.get("url") || u.searchParams.get("v");
        if (!encoded) return null;
        // base64 values start with "aHR0" (= "htt"), percent-encoded start with "http"
        const isBase64 = !encoded.startsWith("http");
        return isBase64
            ? Buffer.from(encoded, "base64").toString("utf8")
            : decodeURIComponent(encoded);
    } catch {
        return null;
    }
}

// Download a video to a Buffer.
// 1st attempt: fetch the raw CDN URL directly (fast, no proxy hop).
// 2nd attempt: fetch via the Worker proxy with the secret key.
async function downloadToBuffer(proxyUrl) {
    const cdnUrl = extractCdnUrl(proxyUrl);
    const headers = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://videodownloader.site/",
        Origin: "https://videodownloader.site",
    };

    // --- try 1: direct CDN ---
    if (cdnUrl) {
        try {
            const r = await axios.get(cdnUrl, {
                responseType: "arraybuffer",
                timeout: 300000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers,
            });
            return Buffer.from(r.data);
        } catch (e) {
            console.warn("pmovie direct CDN failed:", e.message);
        }
    }

    // --- try 2: Worker proxy with key ---
    const keyedUrl = proxyUrl + "&key=" + PROXY_KEY;
    const r = await axios.get(keyedUrl, {
        responseType: "arraybuffer",
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers,
    });
    return Buffer.from(r.data);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const oce = "`";
const pk = "`(";
const pk2 = ")`";
const botName = "PRINCE-𝖬𝖣X";

const preMg =
    "*The command is a command given to premium users by the owners here. ‼️*";
const disMgOnlyme =
    "*This feature is set to work only with the Bot number. ‼️*";
const disMgOnlyOwners = "*This feature is set to work only with the owner. ‼️*";
const disMgAll = "*This feature is disabled. ‼️*";

function pad(n) {
    return String(n).padStart(2, "0");
}
function formatNumber(n) {
    return pad(n);
}

function formatBytes(bytes) {
    const b = parseInt(bytes);
    if (isNaN(b) || b === 0) return "N/A";
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + " GB";
    if (b >= 1048576) return (b / 1048576).toFixed(2) + " MB";
    return b + " B";
}

function formatDuration(seconds) {
    if (!seconds) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function accessGuard(dbData, config, isDev, isMe, isOwners) {
    if (!dbData?.FREE_MOVIE_CMD && !isDev) return preMg;
    if (config.MOVIE_DL === "only_me" && !isMe && !isDev) return disMgOnlyme;
    if (config.MOVIE_DL === "only_owners" && !isOwners) return disMgOnlyOwners;
    if (config.MOVIE_DL === "disable" && !isDev) return disMgAll;
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  pmovie — Search movies & TV series
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "pmovie",
        alias: ["pmv", "ptv", "princemovie"],
        react: "🎬",
        desc: "Search & download movies/series via Prince Stream API",
        category: "download",
        use: ".pmovie <Movie or Series Name>",
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = accessGuard(dbData, config, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q)
                return reply(
                    `*Please provide a movie or series name. ❓*\n\n💮 Example: ${prefix}pmovie Avengers`,
                );

            const res = await fetchJson(
                `${BASE}/search?q=${encodeURIComponent(q)}&type=0&page=1`,
            );
            if (!res?.success || !res?.data?.items?.length)
                return reply(`*No results found for "${q}". ❌*`);

            const items = res.data.items.filter((i) => i.hasResource);
            if (!items.length)
                return reply(`*No downloadable results found for "${q}". ❌*`);

            let movieList = "";
            const numrep = [];

            for (const item of items) {
                const isTV = item.subjectType === 2;
                const icon = isTV ? "📺" : "🎬";
                const typeTag = isTV ? "[TV]" : "[Movie]";
                const idx = numrep.length + 1;
                const year = (item.releaseDate || "").slice(0, 4);
                const packed = [
                    item.detailPath,
                    item.title,
                    item.subjectType,
                    item.cover?.url || config.LOGO,
                    item.genre || "N/A",
                    item.releaseDate || "N/A",
                    item.duration || 0,
                    item.imdbRatingValue || "N/A",
                    item.subtitles || "N/A",
                ].join("🎈");

                movieList += `*${formatNumber(idx)} ||* ${icon} ${typeTag} ${item.title}${year ? ` (${year})` : ""}\n`;
                numrep.push(`${prefix}pmovie_go ${packed}`);
            }

            const caption =
                `╭─────────────────╮\n` +
                `│ 🔎 *${botName} MOVIE SEARCH* 🎬\n` +
                `├─────────────────┤\n` +
                `│ 📲 ${oce}Input:${oce} *${q}*\n` +
                `│ 🍒 ${oce}Results:${oce} *${items.length}*\n` +
                `╰─────────────────╯\n\n` +
                movieList;

            const mass = await conn.sendMessage(
                from,
                {
                    image: { url: config.LOGO },
                    caption: `${caption}\n${config.FOOTER}`,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: mass.key,
                numrep,
                method: "nondecimal",
            });
        } catch (e) {
            console.error("pmovie error:", e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  pmovie_go — Info card + quality/episode picker
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "pmovie_go",
        react: "🎬",
        dontAddCommandList: true,
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = accessGuard(dbData, config, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q) return reply("*No movie data provided. ❓*");

            const parts = q.split("🎈");
            const detailPath = parts[0] || "";
            const title = parts[1] || "N/A";
            const subjectType = parseInt(parts[2]) || 1;
            const cover = parts[3] || config.LOGO;
            const genre = parts[4] || "N/A";
            const releaseDate = parts[5] || "N/A";
            const duration = parseInt(parts[6]) || 0;
            const imdb = parts[7] || "N/A";
            const subtitles = parts[8] || "N/A";

            const isTV = subjectType === 2;
            const typeLabel = isTV ? "📺 TV Series" : "🎬 Movie";

            const infoCot =
                `╭──────────────────╮\n` +
                `│ ${typeLabel}\n` +
                `╰──────────────────╯\n\n` +
                `  ▫ 🎞️ Title      : *${title}*\n` +
                `  ▫ 📅 Released   : ${releaseDate.slice(0, 10)}\n` +
                `  ▫ ⏱ Duration   : ${formatDuration(duration)}\n` +
                `  ▫ 🎀 Genre      : ${genre}\n` +
                `  ▫ ⭐ IMDB       : ${imdb}\n` +
                `  ▫ 🆎 Subtitles  : ${subtitles}\n`;

            const coverBuf = await safeCover(cover);
            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            if (!isTV) {
                // ── MOVIE: fetch quality links, show picker ───────────────────
                const infoMsg = await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `${infoCot}\n🔍 _Fetching available qualities..._\n\n${config.FOOTER}`,
                    },
                    { quoted: mek },
                );

                const dlRes = await fetchJson(`${BASE}/${detailPath}/download`);
                const links = dlRes?.data?.links || [];

                if (!links.length) {
                    await conn.sendMessage(
                        from,
                        {
                            text: `❌ *No download links available for this title.*`,
                        },
                        { quoted: infoMsg },
                    );
                    return;
                }

                let qualityList = `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n`;
                qualityList += `⬇️ *Choose a quality to download:*\n\n`;
                const numrep = [];

                for (const lnk of links) {
                    const idx = numrep.length + 1;
                    const size = formatBytes(lnk.size);
                    const dur = formatDuration(lnk.duration);
                    qualityList += `*${formatNumber(idx)} ||* 🎥 *${lnk.quality}* — ${size} | ⏱ ${dur}\n`;
                    numrep.push(
                        `${prefix}pmovie_dl ${detailPath}🎈${title}🎈${cover}🎈0🎈0🎈${lnk.quality}`,
                    );
                }

                const qMsg = await conn.sendMessage(
                    from,
                    {
                        text: `${qualityList}\n${config.FOOTER}`,
                    },
                    { quoted: infoMsg },
                );

                await storenumrepdata({
                    key: qMsg.key,
                    numrep,
                    method: "nondecimal",
                });
            } else {
                // ── TV SERIES: fetch seasons, show episode grid ───────────────
                const infoMsg = await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `${infoCot}\n🔍 _Loading seasons & episodes..._\n\n${config.FOOTER}`,
                    },
                    { quoted: mek },
                );

                const seasRes = await fetchJson(
                    `${BASE}/${detailPath}/seasons`,
                );
                const seasons = seasRes?.data?.seasons || [];

                if (!seasons.length) {
                    await conn.sendMessage(
                        from,
                        {
                            text: `❌ *No episodes found for this series.*\n_The API may not have this title yet._`,
                        },
                        { quoted: infoMsg },
                    );
                    return;
                }

                let gridCot = `📋 *Episodes available for ${title}:*\n`;
                const numrep = [];

                for (const sObj of seasons) {
                    const s = sObj.season;
                    const sn = formatNumber(s);
                    const eps = sObj.episodes;
                    gridCot += `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n`;
                    gridCot += `> 📺 *Season ${sn}* — ${eps} episode${eps > 1 ? "s" : ""}\n`;
                    for (let e = 1; e <= eps; e++) {
                        const en = formatNumber(e);
                        gridCot += `${s}.${e} || S${sn}E${en}\n`;
                        numrep.push(
                            `${s}.${e} ${prefix}pmovie_ep ${detailPath}🎈${title}🎈${cover}🎈${s}🎈${e}`,
                        );
                    }
                }

                gridCot += `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n`;
                gridCot += `_Reply with Season.Episode (e.g. *1.3* = S01E03)_\n${config.FOOTER}`;

                const epMsg = await conn.sendMessage(
                    from,
                    {
                        text: gridCot,
                    },
                    { quoted: infoMsg },
                );

                await storenumrepdata({
                    key: epMsg.key,
                    numrep,
                    method: "decimal",
                });
            }
        } catch (e) {
            console.error("pmovie_go error:", e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  pmovie_ep — Quality picker for a specific TV episode
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "pmovie_ep",
        react: "📺",
        dontAddCommandList: true,
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = accessGuard(dbData, config, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q) return reply("*No episode data provided. ❓*");

            const parts = q.split("🎈");
            const detailPath = parts[0] || "";
            const title = parts[1] || "N/A";
            const cover = parts[2] || config.LOGO;
            const season = parseInt(parts[3]) || 1;
            const episode = parseInt(parts[4]) || 1;

            const label = `S${pad(season)}E${pad(episode)}`;

            const statusMsg = await conn.sendMessage(
                from,
                {
                    text: `🔍 _Fetching qualities for ${title} ${label}..._`,
                },
                { quoted: mek },
            );

            const dlRes = await fetchJson(
                `${BASE}/${detailPath}/download?season=${season}&episode=${episode}`,
            );
            const links = dlRes?.data?.links || [];

            if (!links.length) {
                await conn.sendMessage(from, {
                    text: `❌ *No download links found for ${title} ${label}.*`,
                    edit: statusMsg.key,
                });
                return;
            }

            let qualityList = `📺 *${title}* — ${label}\n`;
            qualityList += `▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n`;
            qualityList += `⬇️ *Choose a quality to download:*\n\n`;
            const numrep = [];

            for (const lnk of links) {
                const idx = numrep.length + 1;
                const size = formatBytes(lnk.size);
                const dur = formatDuration(lnk.duration);
                qualityList += `*${formatNumber(idx)} ||* 🎥 *${lnk.quality}* — ${size} | ⏱ ${dur}\n`;
                numrep.push(
                    `${prefix}pmovie_dl ${detailPath}🎈${title}🎈${cover}🎈${season}🎈${episode}🎈${lnk.quality}`,
                );
            }

            await conn.sendMessage(from, {
                text: `✅ _Got it!_`,
                edit: statusMsg.key,
            });

            const qMsg = await conn.sendMessage(
                from,
                {
                    text: `${qualityList}\n${config.FOOTER}`,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: qMsg.key,
                numrep,
                method: "nondecimal",
            });
        } catch (e) {
            console.error("pmovie_ep error:", e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  pmovie_dl — Final download & send
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "pmovie_dl",
        react: "⬇️",
        dontAddCommandList: true,
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
        try {
            const block = accessGuard(dbData, config, isDev, isMe, isOwners);
            if (block) return reply(block);

            if (!q) return reply("*No download data provided. ❓*");

            const parts = q.split("🎈");
            const detailPath = parts[0] || "";
            const title = parts[1] || "N/A";
            const cover = parts[2] || config.LOGO;
            const season = parseInt(parts[3]) || 0;
            const episode = parseInt(parts[4]) || 0;
            const quality = parts[5] || "";

            if (!detailPath) return reply("*Invalid download data. ❌*");

            const isTV = season > 0;
            const label = isTV ? `S${pad(season)}E${pad(episode)}` : "";

            const coverBuf = await safeCover(cover);
            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            const statusMsg = await conn.sendMessage(
                from,
                {
                    ...coverMedia,
                    caption: `*🔍 Preparing download:*\n📌 *${title}*${label ? ` — ${label}` : ""}\n🎥 Quality: *${quality || "Best"}*\n\n_Please wait..._`,
                },
                { quoted: mek },
            );

            // Re-fetch download links (ensures URL is always fresh / not expired)
            const dlRes = await fetchJson(
                isTV
                    ? `${BASE}/${detailPath}/download?season=${season}&episode=${episode}`
                    : `${BASE}/${detailPath}/download`,
            );
            const links = dlRes?.data?.links || [];

            if (!links.length) {
                await conn.sendMessage(from, {
                    text: "*Download link not found. ❌*",
                    edit: statusMsg.key,
                });
                return;
            }

            // Pick the requested quality, else fall back to best available
            const chosen = quality
                ? links.find(
                      (l) => l.quality?.toUpperCase() === quality.toUpperCase(),
                  ) || links[links.length - 1]
                : links[links.length - 1];

            const sizeBytes = parseInt(chosen.size) || 0;
            const sizeLabel = formatBytes(chosen.size);

            // Optional size gate
            if (sizeBytes) {
                const sizeGB = sizeBytes / 1073741824;
                const sizeMB = sizeBytes / 1048576;
                if (sizeGB >= (config.MAX_SIZE_GB || 99)) {
                    await conn.sendMessage(from, {
                        text: `*File too large ⛔*\nSize: ${sizeLabel}\nLimit: ${config.MAX_SIZE_GB} GB`,
                        edit: statusMsg.key,
                    });
                    return;
                }
                if (sizeMB >= (config.MAX_SIZE || 9999)) {
                    await conn.sendMessage(from, {
                        text: `*File too large ⛔*\nSize: ${sizeLabel}\nLimit: ${config.MAX_SIZE} MB`,
                        edit: statusMsg.key,
                    });
                    return;
                }
            }

            await conn.sendMessage(from, {
                text: `*⬇️ Downloading:* *${title}*${label ? ` [${label}]` : ""}\n📦 Size: ${sizeLabel} | 🎥 Quality: ${chosen.quality}\n\n_This may take a few minutes for large files..._`,
                edit: statusMsg.key,
            });

            // Try to download — attempts CDN directly, then falls back to proxy+key
            let videoBuffer;
            try {
                videoBuffer = await downloadToBuffer(chosen.proxyUrl);
            } catch (dlErr) {
                console.error("pmovie_dl download error:", dlErr.message);
                // Both CDN and proxy are blocked from this server.
                // Send a clean tap-to-download link the user can open on their phone.
                await conn.sendMessage(from, {
                    text: `⚠️ *Server download blocked.*\n_Tap the link below on your phone to download directly:_`,
                    edit: statusMsg.key,
                });
                let linkMsg =
                    `🎬 *${title}*${label ? ` — ${label}` : ""}\n` +
                    `▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n`;
                for (const lnk of links) {
                    const name = `${title.replace(/[^a-zA-Z0-9]/g, "_")}${label ? `_${label}` : ""}_${lnk.quality}.mp4`;
                    const tapUrl =
                        `${BASE.replace("/api/movies", "/api/proxy")}?url=${encodeURIComponent(extractCdnUrl(lnk.proxyUrl) || lnk.proxyUrl)}&name=${encodeURIComponent(name)}`;
                    linkMsg += `🎥 *${lnk.quality}* — ${formatBytes(lnk.size)} | ⏱ ${formatDuration(lnk.duration)}\n${tapUrl}\n\n`;
                }
                linkMsg += config.FOOTER || "";
                await conn.sendMessage(from, { text: linkMsg }, { quoted: mek });
                await m.react("🔗");
                return;
            }

            await inputMovie(true, title, Date.now());

            let thumbnailBuffer;
            try {
                if (coverBuf) thumbnailBuffer = await resizeThumbnail(coverBuf);
            } catch (_) {}

            const fileName = isTV
                ? `${config.FILE_NAME ? config.FILE_NAME + " " : ""}${title} ${label}.mp4`
                : `${config.FILE_NAME ? config.FILE_NAME + " " : ""}${title} [${chosen.quality}].mp4`;

            const caption =
                `*${title}*${label ? ` — ${label}` : ""}\n` +
                `${pk} ${chosen.quality} | ${sizeLabel} ${pk2}\n\n` +
                (config.CAPTION || config.FOOTER || "");

            await conn.sendMessage(from, {
                text: `*⬆️ Uploading:* *${title}*${label ? ` [${label}]` : ""}\n📦 Size: ${sizeLabel} | 🎥 Quality: ${chosen.quality}`,
                edit: statusMsg.key,
            });
            await m.react("⬆️");

            const docPayload = {
                document: videoBuffer,
                fileName,
                mimetype: "video/mp4",
                caption,
            };
            if (thumbnailBuffer) docPayload.jpegThumbnail = thumbnailBuffer;

            await conn.sendMessage(from, docPayload, { quoted: mek });

            // Send English subtitle if available
            const subtitles = dlRes?.data?.subtitles || [];
            const enSub =
                subtitles.find((s) => s.languageCode === "en") || subtitles[0];
            if (enSub?.url) {
                await conn.sendMessage(
                    from,
                    {
                        document: { url: enSub.url },
                        fileName: isTV
                            ? `${title} ${label} [${enSub.language || "English"}].srt`
                            : `${title} [${enSub.language || "English"}].srt`,
                        mimetype: "application/x-subrip",
                        caption: `🆎 *${enSub.language || "English"} Subtitles* — ${title}${label ? ` ${label}` : ""}`,
                    },
                    { quoted: mek },
                );
            }

            await conn.sendMessage(from, {
                text: "*✅ Upload Successful!*",
                edit: statusMsg.key,
            });
            await m.react("✔️");
            await inputMovie(false, title, Date.now());
        } catch (e) {
            await resetMovie();
            console.error("pmovie_dl error:", e.message || e);
            reply("*Download failed. Please try again or choose a different quality. ⛔️*");
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);
