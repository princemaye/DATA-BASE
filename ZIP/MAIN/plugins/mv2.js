const axios = require("axios");
const https = require("https");
const zlib = require("zlib");
const config = require("../config");

const { cmd, commands } = require("../command");

const { fetchJson, resizeThumbnail } = require("../lib/functions");

// CDN images from this API use mismatched TLS certs — bypass verification
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

// Fetch subtitle, auto-decompress gzip if needed, return plain text Buffer
async function fetchSubtitleBuffer(url) {
    try {
        const res = await axios.get(url, {
            httpsAgent: tlsAgent,
            responseType: "arraybuffer",
            timeout: 15000,
            // Don't let axios auto-decompress — we handle it manually
            decompress: false,
        });
        let buf = Buffer.from(res.data);
        // Detect gzip magic bytes: 0x1F 0x8B
        if (buf[0] === 0x1f && buf[1] === 0x8b) {
            buf = zlib.gunzipSync(buf);
        }
        return buf;
    } catch (_) {
        return null;
    }
}

const { inputMovie, getMovie, resetMovie } = require("../lib/movie_db");
const { storenumrepdata } = require("../lib/numreply-db");
const dbData = require("../lib/config");

// ─── API ─────────────────────────────────────────────────────────────────────
const SILENT_API = "https://silent-movies-api.vercel.app";
const NEWSLETTER = "120363404978384902@newsletter";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
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

function formatNumber(n) {
    return String(n).padStart(2, "0");
}

function formatDuration(seconds) {
    if (!seconds) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
            if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
            if (config.MOVIE_DL === "only_me" && !isMe && !isDev)
                return reply(disMgOnlyme);
            if (config.MOVIE_DL === "only_owners" && !isOwners)
                return reply(disMgOnlyOwners);
            if (config.MOVIE_DL === "disable" && !isDev) return reply(disMgAll);

            if (!q)
                return reply(
                    `*Please provide a movie or series name. ❓*\n\n💮 Example: ${prefix}movie Avengers`,
                );

            const res = await fetchJson(
                `${SILENT_API}/api/search?q=${encodeURIComponent(q)}&key=silent`,
            );

            // Actual response: { status, data: { pager, items: [...] } }
            const items = res?.data?.items;
            if (!items?.length) {
                return reply(`*No results found for "${q}". ❌*`);
            }

            let movieList = "";
            let numrep = [];

            for (const item of items) {
                const isTV = item.subjectType === 2;
                const icon = isTV ? "📺" : "🎬";
                const typeTag = isTV ? "[TV]" : "[Movie]";
                const idx = numrep.length + 1;
                const packed = [
                    item.subjectId,
                    item.title,
                    item.subjectType,
                    item.cover?.url || config.LOGO,
                    item.genre || "N/A",
                    item.releaseDate || "N/A",
                    item.duration || 0,
                    item.imdbRatingValue || "N/A",
                    item.subtitles || "N/A",
                ].join("🎈");

                movieList += `*${formatNumber(idx)} ||* ${icon} ${typeTag} ${item.title} (${(item.releaseDate || "").slice(0, 4)})\n`;
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
                {
                    image: { url: config.LOGO },
                    caption: `${caption}\n${config.FOOTER}`,
                    contextInfo,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: mass.key,
                numrep,
                method: "nondecimal",
            });
        } catch (e) {
            console.error(e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  movie_go  —  Movie / Series detail + quality selection
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
            if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
            if (config.MOVIE_DL === "only_me" && !isMe && !isDev)
                return reply(disMgOnlyme);
            if (config.MOVIE_DL === "only_owners" && !isOwners)
                return reply(disMgOnlyOwners);
            if (config.MOVIE_DL === "disable" && !isDev) return reply(disMgAll);

            if (!q) return reply(`*Please provide movie data. ❓*`);

            const parts = q.split("🎈");
            const subjectId   = parts[0] || "";
            const title       = parts[1] || "N/A";
            const subjectType = parseInt(parts[2]) || 1;
            const cover       = parts[3] || config.LOGO;
            const genre       = parts[4] || "N/A";
            const releaseDate = parts[5] || "N/A";
            const duration    = parseInt(parts[6]) || 0;
            const imdb        = parts[7] || "N/A";
            const subtitles   = parts[8] || "N/A";

            const isTV     = subjectType === 2;
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

            // Fetch cover image and media qualities in parallel
            const [coverBuf, media] = await Promise.all([
                safeImageBuffer(cover),
                fetchJson(`${SILENT_API}/api/media?id=${subjectId}&key=silent`),
            ]);

            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            const downloadUrls = media?.data?.data?.downloadUrls;
            const captionsList = media?.data?.data?.captionsList || [];

            if (!downloadUrls?.length) {
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

            // Find English subtitle URL (prefer en, fall back to first available)
            const engCaption =
                captionsList.find((c) => c.langCode === "en") ||
                captionsList[0] ||
                null;
            const captionUrl = engCaption?.url || "";
            const captionLang = engCaption?.language || "";

            // Build quality selection list appended directly to info card
            let qualityList = `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n📥 *Select Quality:*\n\n`;
            const numrep = [];

            for (const dl of downloadUrls) {
                const idx = numrep.length + 1;
                const qualityLabel = `${dl.quality}p`;
                const sizeLabel = dl.size_formatted || "N/A";

                qualityList += `*${formatNumber(idx)} ||* 🎯 ${qualityLabel}  •  📦 ${sizeLabel}\n`;

                // Pack: downloadUrl🎈title🎈captionUrl🎈captionLang🎈quality🎈sizeFormatted🎈cover
                const packed = [
                    dl.downloadUrl,
                    title,
                    captionUrl,
                    captionLang,
                    qualityLabel,
                    sizeLabel,
                    cover,
                ].join("🎈");
                numrep.push(`${prefix}movie_dl ${packed}`);
            }

            if (captionUrl) {
                qualityList += `\n🆎 _Subtitle: ${captionLang} included automatically_`;
            }

            // Single combined message — info + qualities together
            const epMsg = await conn.sendMessage(
                from,
                {
                    ...coverMedia,
                    caption: `${infoCot}${qualityList}\n\n${config.FOOTER}`,
                    contextInfo,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: epMsg.key,
                numrep,
                method: "nondecimal",
            });
        } catch (e) {
            console.error(e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  movie_dl  —  Download the chosen quality
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
            if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
            if (config.MOVIE_DL === "only_me" && !isMe && !isDev)
                return reply(disMgOnlyme);
            if (config.MOVIE_DL === "only_owners" && !isOwners)
                return reply(disMgOnlyOwners);
            if (config.MOVIE_DL === "disable" && !isDev) return reply(disMgAll);

            if (!q)
                return reply(
                    `*Usage: ${prefix}movie_dl <downloadUrl>🎈<title>🎈<captionUrl>🎈<captionLang>🎈<quality>🎈<size>🎈<cover>*`,
                );

            const parts       = q.split("🎈");
            const downloadUrl = parts[0]?.trim() || "";
            const title       = parts[1]?.trim() || "Unknown";
            const captionUrl  = parts[2]?.trim() || "";
            const captionLang = parts[3]?.trim() || "English";
            const quality     = parts[4]?.trim() || "N/A";
            const sizeLabel   = parts[5]?.trim() || "N/A";
            const cover       = parts[6]?.trim() || config.LOGO;

            if (!downloadUrl) return reply("*Invalid download URL. ❌*");

            // Fetch cover for thumbnail
            const coverBuf = await safeImageBuffer(cover);
            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            const statusMsg = await conn.sendMessage(
                from,
                {
                    text: `*⬆️ Uploading:* *${title}*\n📦 Size: ${sizeLabel} | 🎯 Quality: ${quality}\n\n_Please wait..._`,
                },
                { quoted: mek },
            );

            await inputMovie(true, title, Date.now());
            await m.react("⬆️");

            let thumbnailBuffer;
            try {
                if (coverBuf) thumbnailBuffer = await resizeThumbnail(coverBuf);
            } catch (_) {
                thumbnailBuffer = undefined;
            }

            const fileName = `${config.FILE_NAME ? config.FILE_NAME + " " : ""}${title} [${quality}].mp4`;

            const caption =
                `*${title}*\n` +
                `${pk} ${quality} | ${sizeLabel} ${pk2}\n\n` +
                (config.CAPTION || config.FOOTER || "");

            // Stream directly from URL — Baileys pipes to WA without buffering
            const docPayload = {
                document: { url: downloadUrl },
                fileName,
                mimetype: "video/mp4",
                caption,
            };

            if (thumbnailBuffer) docPayload.jpegThumbnail = thumbnailBuffer;

            await conn.sendMessage(from, docPayload, { quoted: mek });

            // Send subtitle if available — fetch & decompress manually (API returns gzip)
            if (captionUrl) {
                const subtitleBuf = await fetchSubtitleBuffer(captionUrl);
                if (subtitleBuf) {
                    await conn.sendMessage(
                        from,
                        {
                            document: subtitleBuf,
                            fileName: `${title} [${captionLang}].srt`,
                            mimetype: "application/x-subrip",
                            caption: `🆎 *${captionLang} Subtitles* — ${title}`,
                            contextInfo,
                        },
                        { quoted: mek },
                    );
                }
            }

            await conn.sendMessage(from, {
                text: `*✅ Upload Successful!*\n📌 *${title}* | 🎯 ${quality}`,
                edit: statusMsg.key,
            });
            await m.react("✔️");
            await inputMovie(false, title, Date.now());
        } catch (e) {
            await resetMovie();
            console.error(e);
            await reply(
                e.message
                    ? e.message
                    : "*An error occurred. Please try again later. ⛔️*",
            );
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);
