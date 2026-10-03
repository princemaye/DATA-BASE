import { fileURLToPath as __fileURLToPath } from "node:url";
const __filename = __fileURLToPath(import.meta.url);
import __import0 from "axios";
import __import1 from "https";
import * as configModule from "../config.js";
import __import3 from "../command.js";
import __import4 from "../lib/functions.js";
import __import5 from "../lib/movie_db.js";
import __import6 from "../lib/numreply-db.js";
import __import7 from "../lib/config.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
const axios = __import0;
const https = __import1;
const config = configModule.default ?? configModule.config ?? configModule;

const { cmd } = __import3;
const { fetchJson, resizeThumbnail } = __import4;

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

const { inputMovie, getMovie, resetMovie } = __import5;
const { storenumrepdata } = __import6;
const dbData = __import7;

// ─── API ─────────────────────────────────────────────────────────────────────
// Search                 : api.omegatech.app  (MovieBox-pro)
// Info + stream links    : stream.omegatech.app (v2)
const SEARCH_API = "https://api.omegatech.app/api/movie/MovieBox-pro";
const STREAM_API = "https://stream.omegatech.app/api/v2";
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

function formatBytes(bytes) {
    const b = parseInt(bytes) || 0;
    if (b === 0) return "N/A";
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + " GB";
    if (b >= 1048576) return (b / 1048576).toFixed(0) + " MB";
    return (b / 1024).toFixed(0) + " KB";
}

function guardCheck(config, dbData, isDev, isMe, isOwners) {
    if (!dbData?.FREE_MOVIE_CMD && !isDev) return preMg;
    if (config.MOVIE_DL === "only_me" && !isMe && !isDev) return disMgOnlyme;
    if (config.MOVIE_DL === "only_owners" && !isOwners) return disMgOnlyOwners;
    if (config.MOVIE_DL === "disable" && !isDev) return disMgAll;
    return null;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

// Search → data.results[]  (movies + series that actually have resources)
async function searchTitles(query) {
    const res = await fetchJson(
        `${SEARCH_API}?action=search&keyword=${encodeURIComponent(query)}`,
    );
    return (res?.data?.results || []).filter(
        (i) =>
            i.hasResource !== false &&
            (i.subjectType === 1 || i.subjectType === 2),
    );
}

// Info → data.subject / data.isTvShow / data.seasons[]
async function fetchInfo(subjectId) {
    try {
        const res = await fetchJson(`${STREAM_API}/info/${subjectId}`);
        return res?.data || {};
    } catch (_) {
        return {};
    }
}

// Seasons that really have episodes → [{ se, epCount }]
function getSeasons(info) {
    const a = (info.seasons || [])
        .map((s) => ({ se: s.season, epCount: s.episodeCount || 0 }))
        .filter((s) => s.se > 0 && s.epCount > 0);
    if (a.length) return a.sort((x, y) => x.se - y.se);
    return (info.resource?.seasons || [])
        .map((s) => ({ se: s.se, epCount: s.maxEp || 0 }))
        .filter((s) => s.se > 0 && s.epCount > 0)
        .sort((x, y) => x.se - y.se);
}

function qLabel(s) {
    return s.quality || (s.resolution ? `${s.resolution}p` : "?");
}

// Sources → streams[] (one per resolution, lowest first).
// Each stream: { quality, resolution, size, url (direct CDN), downloadUrl (proxy) }
async function fetchStreams(subjectId, se, ep) {
    const res = await fetchJson(
        `${STREAM_API}/sources/${subjectId}?se=${se}&ep=${ep}`,
    );
    const byRes = new Map();
    for (const s of res?.streams || []) {
        if (!s?.url) continue;
        const key = parseInt(s.resolution) || parseInt(s.quality) || 0;
        if (!byRes.has(key)) byRes.set(key, s);
    }
    return [...byRes.entries()].sort((a, b) => a[0] - b[0]).map(([, s]) => s);
}

// Movies have no season/episode. Try the API's default (1/1), then 0/0,
// and return which pair worked so movie_dl can re-resolve the same one.
async function fetchMovieStreams(subjectId) {
    for (const [se, ep] of [
        [1, 1],
        [0, 0],
    ]) {
        try {
            const streams = await fetchStreams(subjectId, se, ep);
            if (streams.length) return { streams, se, ep };
        } catch (_) {}
    }
    return { streams: [], se: 1, ep: 1 };
}

const CDN_HEADERS = {
    Referer: "https://h5.aoneroom.com/",
    "User-Agent":
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
};

const CHUNK = 8 * 1024 * 1024; // 8 MB per request: short enough to beat server time limits
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Download `url` to `dest` in ranged pieces, appending to the file.
// - If the server honours Range (206): each piece is its own short request,
//   and any dropped piece is simply re-requested from the current file size.
// - If it ignores Range (200): fall back to streaming the whole file.
// - 4xx (403/404/429…) and wrong-size files are NOT retried (err.fatal).
async function downloadWithResume(url, headers, dest, expectedSize, name = "src") {
    let total = 0; // full size once the server tells us
    let failures = 0;
    let logged = false;

    for (;;) {
        const have = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
        const target = total || expectedSize;
        if (target && have >= target) return;

        let r;
        try {
            r = await axios.get(url, {
                httpsAgent: tlsAgent,
                headers: { ...headers, Range: `bytes=${have}-${have + CHUNK - 1}` },
                responseType: "stream",
                timeout: 30000, // idle timeout
                maxRedirects: 5,
                validateStatus: () => true,
            });
        } catch (e) {
            if (++failures >= 5) throw e;
            await sleep(2000);
            continue;
        }

        if (!logged) {
            logged = true;
            console.log(
                `[movie] ${name}: HTTP ${r.status} | length=${r.headers["content-length"] || "-"} | range=${r.headers["content-range"] || "-"} | accept-ranges=${r.headers["accept-ranges"] || "-"}`,
            );
        }

        if (r.status === 416) {
            r.data?.destroy?.();
            if (have > 0) return; // asked past the end → we already have it all
            const err = new Error("HTTP 416");
            err.fatal = true;
            throw err;
        }

        if (r.status !== 200 && r.status !== 206) {
            r.data?.destroy?.();
            const err = new Error(`HTTP ${r.status}`);
            err.fatal = r.status >= 400 && r.status < 500 && r.status !== 408;
            if (err.fatal || ++failures >= 5) throw err;
            await sleep(2000);
            continue;
        }

        // ── 206: ranged piece ──
        if (r.status === 206) {
            const m = /\/(\d+)\s*$/.exec(r.headers["content-range"] || "");
            if (m) total = parseInt(m[1]);

            if (have === 0 && total && expectedSize) {
                const ratio = total / expectedSize;
                if (ratio < 0.9 || ratio > 1.1) {
                    r.data?.destroy?.();
                    const err = new Error(
                        `size mismatch (got ${total}, expected ${expectedSize})`,
                    );
                    err.fatal = true;
                    throw err;
                }
            }

            try {
                await pipeline(r.data, fs.createWriteStream(dest, { flags: "a" }));
                failures = 0;
            } catch (e) {
                console.error(
                    `[movie] ${name}: piece failed at ${fs.statSync(dest).size} bytes → ${e.message}`,
                );
                if (++failures >= 5) throw e;
                await sleep(2000);
                continue;
            }

            // total unknown and we got less than a full piece → that was the end
            if (!total && fs.statSync(dest).size - have < CHUNK) return;
            continue;
        }

        // ── 200: server ignores Range → whole file in a single stream ──
        const cl = parseInt(r.headers["content-length"]) || 0;
        if (cl && expectedSize) {
            const ratio = cl / expectedSize;
            if (ratio < 0.9 || ratio > 1.1) {
                r.data?.destroy?.();
                const err = new Error(`size mismatch (got ${cl}, expected ${expectedSize})`);
                err.fatal = true;
                throw err;
            }
        }
        try {
            await pipeline(r.data, fs.createWriteStream(dest, { flags: "w" }));
            return;
        } catch (e) {
            console.error(
                `[movie] ${name}: full-stream failed at ${fs.existsSync(dest) ? fs.statSync(dest).size : 0} bytes → ${e.message} (no Range support)`,
            );
            if (++failures >= 2) throw e;
            await sleep(2000);
        }
    }
}

// Download a stream to a temp file, trying each source until one completes.
// Order: proxyDownload (by id) → proxy link from sources → direct CDN (Referer)
async function downloadStreamToTemp({ stream, subjectId, se, ep, quality }) {
    const dest = path.join(
        os.tmpdir(),
        `mv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp4`,
    );
    const expected = parseInt(stream.size) || 0;
    const proxyById =
        `${STREAM_API}/download?id=${subjectId}&se=${se}&ep=${ep}` +
        `&quality=${encodeURIComponent(quality)}`;

    const candidates = [
        ["proxyDownload", proxyById, {}],
        ["sources.downloadUrl", stream.downloadUrl, {}],
        ["direct-cdn", stream.url, CDN_HEADERS],
    ].filter(([, u]) => u);

    let lastErr;
    for (const [name, u, h] of candidates) {
        try {
            await downloadWithResume(u, h, dest, expected, name);
            const got = fs.statSync(dest).size;
            if (expected && got < expected * 0.99)
                throw new Error(`incomplete (${got}/${expected})`);
            console.log(`[movie] downloaded via ${name}`);
            return dest;
        } catch (e) {
            lastErr = e;
            console.error(`[movie] source failed: ${name} → ${e.message}`);
            fs.promises.unlink(dest).catch(() => {});
        }
    }
    throw new Error(
        `*Download failed (${lastErr?.message || "unknown"}). Please try again later. ⛔️*`,
    );
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
                return reply(
                    `*Please provide a movie or series name. ❓*\n\n💮 Example: ${prefix}movie Avengers`,
                );

            const items = await searchTitles(q);
            if (!items.length)
                return reply(`*No results found for "${q}". ❌*`);

            let movieList = "";
            const numrep = [];

            for (const item of items) {
                const isTV = item.subjectType === 2;
                const icon = isTV ? "📺" : "🎬";
                const typeTag = isTV ? "[Series]" : "[Movie]";
                const idx = numrep.length + 1;
                const year = (item.releaseDate || "").slice(0, 4);

                // Pack: subjectId🎈title🎈subjectType🎈cover🎈genre🎈releaseDate🎈imdb
                const packed = [
                    item.subjectId,
                    item.title,
                    item.subjectType,
                    item.cover?.url || config.LOGO,
                    item.genre || "N/A",
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

            const parts = q.split("🎈");
            const subjectId = parts[0] || "";
            const title = parts[1] || "N/A";
            const subjectType = parseInt(parts[2]) || 1;
            const cover = parts[3] || config.LOGO;
            const genre = parts[4] || "N/A";
            const releaseDate = parts[5] || "N/A";
            const imdb = parts[6] || "N/A";

            // Info (description + seasons) and cover image in parallel
            const [coverBuf, info] = await Promise.all([
                safeImageBuffer(cover),
                fetchInfo(subjectId),
            ]);

            const isTV = info.isTvShow ?? subjectType === 2;
            const typeLabel = isTV ? "📺 Series" : "🎬 Movie";

            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            const desc = info.subject?.description || "";
            const seasons = isTV ? getSeasons(info) : [];

            const infoCot =
                `╭──────────────────╮\n` +
                `│ ${typeLabel}\n` +
                `╰──────────────────╯\n\n` +
                `  ▫ 🎞️ Title    : *${title}*\n` +
                `  ▫ 📅 Released : ${releaseDate.slice(0, 10)}\n` +
                `  ▫ 🎀 Genre    : ${genre}\n` +
                `  ▫ ⭐ IMDB     : ${imdb}\n` +
                (isTV ? `  ▫ 📺 Seasons  : ${seasons.length || "N/A"}\n` : "") +
                (desc
                    ? `\n📝 _${desc.slice(0, 200)}${desc.length > 200 ? "..." : ""}_\n`
                    : "");

            if (isTV) {
                // ── Series: seasons come from the info endpoint ──
                if (!seasons.length) {
                    await conn.sendMessage(
                        from,
                        {
                            ...coverMedia,
                            caption: `${infoCot}\n❌ *No season data found.*\n_The API may not have it yet._\n\n${config.FOOTER}`,
                        },
                        { quoted: mek },
                    );
                    return;
                }

                let seasonList = `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n📺 *Select Season:*\n\n`;
                const numrep = [];

                for (const { se, epCount } of seasons) {
                    const idx = numrep.length + 1;
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
                    },
                    { quoted: mek },
                );

                await storenumrepdata({
                    key: epMsg.key,
                    numrep,
                    method: "nondecimal",
                });
            } else {
                // ── Movie: fetch stream links and show the quality list ──
                const { streams, se, ep } = await fetchMovieStreams(subjectId);

                if (!streams.length) {
                    await conn.sendMessage(
                        from,
                        {
                            ...coverMedia,
                            caption: `${infoCot}\n❌ *No download links found for this title.*\n_The API may not have it yet._\n\n${config.FOOTER}`,
                        },
                        { quoted: mek },
                    );
                    return;
                }

                const dur = formatDuration(info.subject?.duration);
                let qualityList = `\n▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n📥 *Select Quality:*\n\n`;
                const numrep = [];

                for (const dl of streams) {
                    const idx = numrep.length + 1;
                    const qualityLabel = qLabel(dl);
                    const sizeLabel = formatBytes(dl.size);

                    qualityList += `*${formatNumber(idx)} ||* 🎯 ${qualityLabel}  •  📦 ${sizeLabel}${dur !== "N/A" ? `  •  ⏱ ${dur}` : ""}\n`;

                    // Pack: subjectId🎈title🎈quality🎈size🎈cover🎈epLabel🎈season🎈episode
                    const packed = [
                        subjectId,
                        title,
                        qualityLabel,
                        sizeLabel,
                        cover,
                        "",
                        se,
                        ep,
                    ].join("🎈");
                    numrep.push(`${prefix}movie_dl ${packed}`);
                }

                const epMsg = await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `${infoCot}${qualityList}\n${config.FOOTER}`,
                    },
                    { quoted: mek },
                );

                await storenumrepdata({
                    key: epMsg.key,
                    numrep,
                    method: "nondecimal",
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

            const parts = q.split("🎈");
            const subjectId = parts[0] || "";
            const title = parts[1] || "N/A";
            const cover = parts[2] || config.LOGO;
            const seasonNum = parseInt(parts[3]) || 1;

            // Fetch cover and series info (season / episode counts)
            const [coverBuf, info] = await Promise.all([
                safeImageBuffer(cover),
                fetchInfo(subjectId),
            ]);

            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            // The API gives an episode COUNT per season (no episode titles)
            const season = getSeasons(info).find((s) => s.se === seasonNum);
            const episodes = season
                ? Array.from({ length: season.epCount }, (_, i) => [
                      i + 1,
                      `Episode ${i + 1}`,
                  ])
                : [];

            if (!episodes.length) {
                await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `❌ *No episodes found for Season ${seasonNum}.*\n\n${config.FOOTER}`,
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
                const packed = [
                    subjectId,
                    title,
                    cover,
                    seasonNum,
                    epNum,
                    epTitle,
                ].join("🎈");
                numrep.push(`${prefix}mv_ep ${packed}`);
            }

            const epMsg = await conn.sendMessage(
                from,
                {
                    ...coverMedia,
                    caption: `${epList}\n${config.FOOTER}`,
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

            const parts = q.split("🎈");
            const subjectId = parts[0] || "";
            const title = parts[1] || "N/A";
            const cover = parts[2] || config.LOGO;
            const seasonNum = parseInt(parts[3]) || 1;
            const epNum = parseInt(parts[4]) || 1;
            const epTitle = parts[5] || `Episode ${epNum}`;

            const epLabel = `S${seasonNum}E${String(epNum).padStart(2, "0")} — ${epTitle}`;

            // Fetch cover and the streams for this exact season + episode
            const [coverBuf, qualities] = await Promise.all([
                safeImageBuffer(cover),
                fetchStreams(subjectId, seasonNum, epNum),
            ]);

            const coverMedia = coverBuf
                ? { image: coverBuf }
                : { image: { url: config.LOGO } };

            if (!qualities.length) {
                await conn.sendMessage(
                    from,
                    {
                        ...coverMedia,
                        caption: `❌ *No download links found for ${epLabel}.*\n\n${config.FOOTER}`,
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
                const idx = numrep.length + 1;
                const qualityLabel = qLabel(dl);
                const sizeLabel = formatBytes(dl.size);

                qualityList += `*${formatNumber(idx)} ||* 🎯 ${qualityLabel}  •  📦 ${sizeLabel}\n`;

                // Pack: subjectId🎈title🎈quality🎈size🎈cover🎈epLabel🎈season🎈episode
                const packed = [
                    subjectId,
                    title,
                    qualityLabel,
                    sizeLabel,
                    cover,
                    epLabel,
                    seasonNum,
                    epNum,
                ].join("🎈");
                numrep.push(`${prefix}movie_dl ${packed}`);
            }

            const epMsg = await conn.sendMessage(
                from,
                {
                    ...coverMedia,
                    caption: `${qualityList}\n${config.FOOTER}`,
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
                return reply(
                    `*Usage: ${prefix}movie_dl <subjectId>🎈<title>🎈<quality>🎈<size>🎈<cover>🎈<epLabel>🎈<se>🎈<ep>*`,
                );

            const parts = q.split("🎈");
            const source = parts[0]?.trim() || ""; // subjectId (new) or direct URL (legacy)
            const title = parts[1]?.trim() || "Unknown";
            const quality = parts[2]?.trim() || "N/A";
            const sizeLabel = parts[3]?.trim() || "N/A";
            const cover = parts[4]?.trim() || config.LOGO;
            const epLabel = parts[5]?.trim() || "";
            const se = parseInt(parts[6]);
            const ep = parseInt(parts[7]);

            if (!source) return reply("*Invalid download data. ❌*");

            // Stream links are signed and expire, so resolve a fresh one right before sending
            let match = null; // resolved stream (null = legacy direct URL)
            if (!/^https?:\/\//i.test(source)) {
                const streams = await fetchStreams(
                    source,
                    Number.isFinite(se) ? se : 1,
                    Number.isFinite(ep) ? ep : 1,
                );
                match = streams.find((s) => qLabel(s) === quality);
                if (!match)
                    return reply(
                        "*This quality is no longer available. Please search again. ❌*",
                    );
            }

            const coverBuf = await safeImageBuffer(cover);
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

            const safeTitle = displayTitle.replace(/[/\\:*?"<>|]/g, " ").trim();
            const filePrefix = config.FILE_NAME ? config.FILE_NAME + " " : "";
            const fileName = `${filePrefix}${safeTitle} [${quality}].mp4`;

            const caption =
                `*${displayTitle}*\n` +
                `${pk} ${quality} | ${sizeLabel} ${pk2}\n\n` +
                (config.CAPTION || config.FOOTER || "");

            let tmpFile = null;
            try {
                // Download to disk first (resumable) so a dropped connection
                // can't kill the WhatsApp upload mid-way
                if (match) tmpFile = await downloadStreamToTemp({
                        stream: match,
                        subjectId: source,
                        se: Number.isFinite(se) ? se : 1,
                        ep: Number.isFinite(ep) ? ep : 1,
                        quality,
                    });

                const docPayload = {
                    document: { url: tmpFile || source },
                    fileName,
                    mimetype: "video/mp4",
                    caption,
                };

                if (thumbnailBuffer) docPayload.jpegThumbnail = thumbnailBuffer;

                await conn.sendMessage(from, docPayload, { quoted: mek });
            } finally {
                if (tmpFile) fs.promises.unlink(tmpFile).catch(() => {});
            }

            await conn.sendMessage(from, {
                text: `*✅ Upload Successful!*\n📌 *${displayTitle}* | 🎯 ${quality}`,
                edit: statusMsg.key,
            });
            await m.react("✔️");
            await inputMovie(false, displayTitle, Date.now());
        } catch (e) {
            await resetMovie();
            console.error(e);
            await reply(
                e.message || "*An error occurred. Please try again later. ⛔️*",
            );
            await conn.sendMessage(from, {
                react: { text: "⛔️", key: mek.key },
            });
        }
    },
);
