const axios = require("axios");
const https = require("https");
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

const { inputMovie, getMovie, resetMovie } = require("../lib/movie_db");
const { storenumrepdata } = require("../lib/numreply-db");
const dbData = require("../lib/config");

// ─── API ────────────────────────────────────────────────────────────────────
const SILENT_API = "https://silent-movies-api.vercel.app";

// ─── Series structure prober ─────────────────────────────────────────────────
// Probes the API to find EXACTLY which seasons and episodes exist.
// Returns: { season: [ep1, ep2, ...], ... }  e.g. { 1:[1..10], 8:[1..6] }
async function probeSeriesStructure(subjectId) {
    const MAX_SEASONS = 15;
    const MAX_EPS = 35;

    const probe = (s, e) =>
        fetchJson(
            `${SILENT_API}/api/download?movie_id=${subjectId}&season=${s}&episode=${e}&key=silent`,
        )
            .then((r) => !!r?.download_url)
            .catch(() => false);

    // Phase 1: which seasons exist? probe E1 for each season in parallel
    const s1Results = await Promise.all(
        Array.from({ length: MAX_SEASONS }, (_, i) => i + 1).map((s) =>
            probe(s, 1).then((ok) => (ok ? s : null)),
        ),
    );
    const validSeasons = s1Results.filter(Boolean);
    if (!validSeasons.length) return {};

    // Phase 2: probe E2-MAX_EPS for each valid season in one big parallel batch
    // (E1 is already confirmed valid)
    const epProbes = [];
    for (const s of validSeasons) {
        for (let e = 2; e <= MAX_EPS; e++) {
            epProbes.push(probe(s, e).then((ok) => ({ s, e, ok })));
        }
    }
    const epResults = await Promise.all(epProbes);

    // Build { season: [sorted valid ep list] }
    const structure = {};
    for (const s of validSeasons) structure[s] = [1]; // E1 already confirmed
    for (const { s, e, ok } of epResults) {
        if (ok) structure[s].push(e);
    }
    for (const s of Object.keys(structure)) {
        structure[s].sort((a, b) => a - b);
    }
    return structure;
}

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

function formatBytes(bytes) {
    const b = parseInt(bytes);
    if (isNaN(b)) return "N/A";
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

// ─────────────────────────────────────────────────────────────────────────────
//  smovie  —  Search movies & TV series
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "smovie",
        alias: ["smv", "stv", "silentmovie"],
        react: "🎬",
        desc: "Search & download movies/series (English)",
        category: "download",
        use: ".smovie <Movie or Series Name>",
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
                    `*Please provide a movie or series name. ❓*\n\n💮 Example: ${prefix}smovie Avengers`,
                );

            const res = await fetchJson(
                `${SILENT_API}/api/search?q=${encodeURIComponent(q)}&key=silent`,
            );

            if (!res?.results?.length) {
                return reply(`*No results found for "${q}". ❌*`);
            }

            const results = res.results;

            let movieList = "";
            let numrep = [];

            for (const item of results) {
                const isTV = item.subjectType === 2;
                const icon = isTV ? "📺" : "🎬";
                const typeTag = isTV ? "[TV]" : "[Movie]";
                const idx = numrep.length + 1;
                const packed = `${item.subjectId}🎈${item.title}🎈${item.subjectType}🎈${item.cover?.url || config.LOGO}🎈${item.genre || "N/A"}🎈${item.releaseDate || "N/A"}🎈${item.duration || 0}🎈${item.imdbRatingValue || "N/A"}🎈${item.subtitles || "N/A"}`;

                movieList += `*${formatNumber(idx)} ||* ${icon} ${typeTag} ${item.title} (${(item.releaseDate || "").slice(0, 4)})\n`;
                numrep.push(`${prefix}smovie_go ${packed}`);
            }

            const caption =
                `╭─────────────────╮\n` +
                `│ 🔎 *${botName} MOVIE SEARCH* 🎬\n` +
                `├─────────────────┤\n` +
                `│ 📲 ${oce}Input:${oce} *${q}*\n` +
                `│ 🍒 ${oce}Results:${oce} *${results.length}*\n` +
                `╰─────────────────╯\n\n` +
                `${movieList}`;

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
            console.error(e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  smovie_go  —  Movie / Series details page
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "smovie_go",
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
            const subjectId = parts[0] || "";
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

            const coverBuf = await safeImageBuffer(cover);
            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            if (!isTV) {
                // ── MOVIE: single download option ─────────────────────────────
                const dlPacked = `${subjectId}🎈${title}🎈${cover}🎈0🎈0`;
                const cot =
                    infoCot +
                    `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n` +
                    `  *01 ||* ⬇️ Download Movie\n`;

                const mass = await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `${cot}\n${config.FOOTER}`,
                    },
                    { quoted: mek },
                );

                await storenumrepdata({
                    key: mass.key,
                    numrep: [`${prefix}smovie_dl ${dlPacked}`],
                    method: "nondecimal",
                });
            } else {
                // ── TV SERIES: probe API for the exact episode structure ───────
                // Step 1 — send info card immediately with a "detecting" note
                const infoMsg = await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `${infoCot}\n🔍 _Detecting available seasons & episodes..._\n\n${config.FOOTER}`,
                    },
                    { quoted: mek },
                );

                // Step 2 — probe (runs while user reads the info card)
                const structure = await probeSeriesStructure(subjectId);
                const validSeasons = Object.keys(structure)
                    .map(Number)
                    .sort((a, b) => a - b);

                if (!validSeasons.length) {
                    await conn.sendMessage(
                        from,
                        {
                            text: `❌ *No downloadable episodes found for this title.*\n_The API may not have this series yet._`,
                        },
                        { quoted: infoMsg },
                    );
                    return;
                }

                // Step 3 — build the exact episode grid & numrep entries
                let gridCot = `📋 *Episodes available for ${title}:*\n`;
                const numrep = [];

                for (const s of validSeasons) {
                    const eps = structure[s];
                    const sn = formatNumber(s);
                    gridCot += `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n`;
                    gridCot += `> 📺 *Season ${sn}* — ${eps.length} episode${eps.length > 1 ? "s" : ""}\n`;
                    for (const e of eps) {
                        const en = formatNumber(e);
                        gridCot += `${s}.${e} || S${sn}E${en}\n`;
                        numrep.push(
                            `${s}.${e} ${prefix}smovie_dl ${subjectId}🎈${title}🎈${cover}🎈${s}🎈${e}`,
                        );
                    }
                }

                gridCot += `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n`;
                gridCot += `_Reply with Season.Episode (e.g. 1.3 = S01E03)_\n${config.FOOTER}`;

                // Step 4 — send the grid as a reply to the info card
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
            console.error(e);
            reply("*An error occurred. Please try again later. ⛔️*");
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);

// ─────────────────────────────────────────────────────────────────────────────
//  smovie_dl  —  Download movie / specific episode
// ─────────────────────────────────────────────────────────────────────────────
cmd(
    {
        pattern: "smovie_dl",
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
                    `*Usage: ${prefix}smovie_dl <id>🎈<title>🎈<cover>🎈<season>🎈<episode>*`,
                );

            const parts = q.split("🎈");
            const subjectId = parts[0]?.trim() || "";
            const title = parts[1]?.trim() || "N/A";
            const cover = parts[2]?.trim() || config.LOGO;
            const season = parseInt(parts[3]) || 0;
            const episode = parseInt(parts[4]) || 0;

            if (!subjectId) return reply("*Invalid movie ID. ❌*");

            const isTV = season > 0 || episode > 0;
            const label = isTV
                ? `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`
                : "Movie";

            // Fetch cover image safely (CDN has TLS cert mismatch)
            const coverBuf2 = await safeImageBuffer(cover);
            const coverMedia2 = coverBuf2
                ? { image: coverBuf2 }
                : { image: { url: config.LOGO } };

            // Status message shown while fetching download link
            const statusMsg = await conn.sendMessage(
                from,
                {
                    ...coverMedia2,
                    text: `*🔍 Fetching download link for:*\n📌 *${title}* ${isTV ? `[ ${label} ]` : ""}\n\n_Please wait..._`,
                },
                { quoted: mek },
            );

            const dl = await fetchJson(
                `${SILENT_API}/api/download?movie_id=${subjectId}&season=${season}&episode=${episode}&key=silent`,
            );

            if (!dl?.download_url) {
                await conn.sendMessage(from, {
                    text: "*Download link not found ❌*",
                    edit: statusMsg.key,
                });
                return;
            }

            const sizeBytes = parseInt(dl.size_bytes) || 0;
            const sizeLabel = formatBytes(dl.size_bytes);
            const quality = dl.quality || "N/A";

            // Optional size gate
            if (sizeBytes) {
                const sizeGB = sizeBytes / 1073741824;
                const sizeMB = sizeBytes / 1048576;
                if (sizeGB >= (config.MAX_SIZE_GB || 99)) {
                    await conn.sendMessage(from, {
                        text: `*File too large ⛔*\nSize: ${sizeLabel}\nLimit: ${config.MAX_SIZE_GB}GB`,
                        edit: statusMsg.key,
                    });
                    return;
                }
                if (sizeMB >= (config.MAX_SIZE || 9999)) {
                    await conn.sendMessage(from, {
                        text: `*File too large ⛔*\nSize: ${sizeLabel}\nLimit: ${config.MAX_SIZE}MB`,
                        edit: statusMsg.key,
                    });
                    return;
                }
            }

            await inputMovie(true, title, Date.now());

            await conn.sendMessage(from, {
                text: `*⬆️ Uploading:* *${title}* ${isTV ? `[ ${label} ]` : ""}\n📦 Size: ${sizeLabel} | 🎯 Quality: ${quality}`,
                edit: statusMsg.key,
            });

            await m.react("⬆️");

            // Reuse the cover buffer already fetched — avoids a second TLS-failing request
            let thumbnailBuffer;
            try {
                if (coverBuf2)
                    thumbnailBuffer = await resizeThumbnail(coverBuf2);
            } catch (_) {
                thumbnailBuffer = undefined;
            }

            const fileName = isTV
                ? `${config.FILE_NAME ? config.FILE_NAME + " " : ""}${title} ${label}.mp4`
                : `${config.FILE_NAME ? config.FILE_NAME + " " : ""}${title}.mp4`;

            const caption =
                `*${title}*${isTV ? ` — ${label}` : ""}\n` +
                `${pk} ${quality} | ${sizeLabel} ${pk2}\n\n` +
                (config.CAPTION || config.FOOTER || "");

            // Always stream via URL — never buffer the file into memory.
            // Baileys pipes it directly to WhatsApp servers, so any file size works.
            const docPayload = {
                document: { url: dl.download_url },
                fileName,
                mimetype: "video/mp4",
                caption,
            };

            if (thumbnailBuffer) docPayload.jpegThumbnail = thumbnailBuffer;

            await conn.sendMessage(from, docPayload, { quoted: mek });

            // Send subtitle file if available
            if (dl.subtitle_url) {
                await conn.sendMessage(
                    from,
                    {
                        document: { url: dl.subtitle_url },
                        fileName: isTV
                            ? `${title} ${label} [English].srt`
                            : `${title} [English].srt`,
                        mimetype: "application/x-subrip",
                        caption: `🆎 *English Subtitles* — ${title}${isTV ? ` ${label}` : ""}`,
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
