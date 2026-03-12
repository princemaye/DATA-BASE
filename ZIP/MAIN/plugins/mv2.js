const axios = require('axios');
const https  = require('https');
const config = require('../config');

const { cmd, commands } = require('../command');

const {
    sleep,
    fetchJson,
    getThumbnailFromUrl,
    resizeThumbnail,
} = require('../lib/functions');

// CDN images from this API use mismatched TLS certs — bypass verification
const tlsAgent = new https.Agent({ rejectUnauthorized: false });

async function safeImageBuffer(url) {
    try {
        const res = await axios.get(url, { httpsAgent: tlsAgent, responseType: 'arraybuffer', timeout: 15000 });
        return Buffer.from(res.data);
    } catch (_) {
        return null;
    }
}

const { inputMovie, getMovie, resetMovie } = require('../lib/movie_db');
const { storenumrepdata } = require('../lib/numreply-db');
const dbData = require('../lib/config');

const { buttonDesc, buttonTitle } = require('../lib/config');

// ─── API ────────────────────────────────────────────────────────────────────
const SILENT_API = 'https://darkvibe314-silent-movies-api.hf.space';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const oce = '`';
const pk  = '`(';
const pk2 = ')`';
const botName = 'PRINCE-𝖬𝖣X';

const preMg          = '*The command is a command given to premium users by the owners here. ‼️*';
const disMgOnlyme    = '*This feature is set to work only with the Bot number. ‼️*';
const disMgOnlyOwners= '*This feature is set to work only with the owner. ‼️*';
const disMgAll       = '*This feature is disabled. ‼️*';

function formatNumber(n) { return String(n).padStart(2, '0'); }

function formatBytes(bytes) {
    const b = parseInt(bytes);
    if (isNaN(b)) return 'N/A';
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
    if (b >= 1048576)    return (b / 1048576).toFixed(2)    + ' MB';
    return b + ' B';
}

function formatDuration(seconds) {
    if (!seconds) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  smovie  —  Search movies & TV series
// ─────────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'smovie',
    alias: ['smv', 'stv', 'silentmovie'],
    react: '🎬',
    desc: 'Search & download movies/series (English)',
    category: 'download',
    use: '.smovie <Movie or Series Name>',
    filename: __filename,
},
async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me'     && !isMe     && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners)           return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable'     && !isDev)              return reply(disMgAll);

        if (!q) return reply(`*Please provide a movie or series name. ❓*\n\n💮 Example: ${prefix}smovie Avengers`);

        const res = await fetchJson(`${SILENT_API}/api/search?query=${encodeURIComponent(q)}`);

        if (!res?.results?.length) {
            return reply(`*No results found for "${q}". ❌*`);
        }

        const results = res.results;

        let movieList = '';
        let numrep    = [];
        let buttons   = [];
        let mi = 0, ti = 0;

        for (const item of results) {
            const isTV    = item.subjectType === 2;
            const icon    = isTV ? '📺' : '🎬';
            const typeTag = isTV ? '[TV]' : '[Movie]';
            const idx     = numrep.length + 1;
            const packed  = `${item.subjectId}🎈${item.title}🎈${item.subjectType}🎈${item.cover?.url || config.LOGO}🎈${item.genre || 'N/A'}🎈${item.releaseDate || 'N/A'}🎈${item.duration || 0}🎈${item.imdbRatingValue || 'N/A'}🎈${item.subtitles || 'N/A'}`;

            movieList += `*${formatNumber(idx)} ||* ${icon} ${typeTag} ${item.title} (${(item.releaseDate || '').slice(0,4)})\n`;
            numrep.push(`${prefix}smovie_go ${packed}`);

            if (config.MESSAGE_TYPE?.toLowerCase() === 'button') {
                buttons.push({
                    title: `${icon} ${item.title}`,
                    description: `${typeTag} • ${(item.releaseDate || '').slice(0,4)}`,
                    id: `${prefix}smovie_go ${packed}`
                });
            }
        }

        const caption =
            `╭─────────────────╮\n` +
            `│ 🔎 *${botName} MOVIE SEARCH* 🎬\n` +
            `├─────────────────┤\n` +
            `│ 📲 ${oce}Input:${oce} *${q}*\n` +
            `│ 🍒 ${oce}Results:${oce} *${results.length}*\n` +
            `╰─────────────────╯\n\n` +
            `${movieList}`;

        if (config.MESSAGE_TYPE?.toLowerCase() === 'button' && buttons.length) {
            const listData = {
                title: buttonTitle,
                sections: [{ title: 'Search Results', rows: buttons }]
            };
            await conn.sendMessage(from, {
                image: { url: config.LOGO },
                caption,
                footer: config.FOOTER,
                buttons: [{
                    buttonId: 'action',
                    type: 4,
                    buttonText: { displayText: '🔽 Select Option' },
                    nativeFlowInfo: { name: 'single_select', paramsJson: JSON.stringify(listData) }
                }],
                headerType: 1,
                viewOnce: true,
            }, { quoted: mek });
        } else {
            const mass = await conn.sendMessage(from, {
                image: { url: config.LOGO },
                caption: `${caption}\n${config.FOOTER}`,
            }, { quoted: mek });

            await storenumrepdata({ key: mass.key, numrep, method: 'nondecimal' });
        }

    } catch (e) {
        console.error(e);
        reply('*An error occurred. Please try again later. ⛔️*');
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});


// ─────────────────────────────────────────────────────────────────────────────
//  smovie_go  —  Movie / Series details page
// ─────────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'smovie_go',
    react: '🎬',
    dontAddCommandList: true,
    filename: __filename,
},
async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me'     && !isMe     && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners)           return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable'     && !isDev)              return reply(disMgAll);

        if (!q) return reply(`*Please provide movie data. ❓*`);

        const parts       = q.split('🎈');
        const subjectId   = parts[0] || '';
        const title       = parts[1] || 'N/A';
        const subjectType = parseInt(parts[2]) || 1;
        const cover       = parts[3] || config.LOGO;
        const genre       = parts[4] || 'N/A';
        const releaseDate = parts[5] || 'N/A';
        const duration    = parseInt(parts[6]) || 0;
        const imdb        = parts[7] || 'N/A';
        const subtitles   = parts[8] || 'N/A';

        const isTV = subjectType === 2;
        const typeLabel = isTV ? '📺 TV Series' : '🎬 Movie';

        let cot =
            `╭──────────────────╮\n` +
            `│ ${typeLabel}\n` +
            `╰──────────────────╯\n\n` +
            `  ▫ 🎞️ Title      : *${title}*\n` +
            `  ▫ 📅 Released   : ${releaseDate.slice(0, 10)}\n` +
            `  ▫ ⏱ Duration   : ${formatDuration(duration)}\n` +
            `  ▫ 🎀 Genre      : ${genre}\n` +
            `  ▫ ⭐ IMDB       : ${imdb}\n` +
            `  ▫ 🆎 Subtitles  : ${subtitles}\n\n`;

        let numrep = [];
        let buttons = [];

        if (!isTV) {
            // ── MOVIE: single download option ─────────────────────────────
            const dlPacked = `${subjectId}🎈${title}🎈${cover}🎈0🎈0`;
            cot += `▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n\n`;
            cot += `  *01 ||* ⬇️ Download Movie\n`;
            numrep.push(`${prefix}smovie_dl ${dlPacked}`);

            if (config.MESSAGE_TYPE?.toLowerCase() === 'button') {
                buttons.push({ title: '⬇️ Download Movie', description: 'Fetch & send the MP4 file', id: `${prefix}smovie_dl ${dlPacked}` });
            }

        } else {
            // ── TV SERIES: season × episode numreply grid ─────────────────
            // Generate S1–S5, E1–E10 as decimal-method numreply
            const MAX_SEASONS  = 5;
            const MAX_EPISODES = 15;

            cot += `▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃\n`;
            cot += `*Reply with Season.Episode (e.g. 1.3 = S01E03)*\n\n`;

            for (let s = 1; s <= MAX_SEASONS; s++) {
                cot += `> _[ Season ${String(s).padStart(2,'0')} ]_\n`;
                for (let e = 1; e <= MAX_EPISODES; e++) {
                    cot += `${s}.${e} || S${String(s).padStart(2,'0')}E${String(e).padStart(2,'0')}\n`;
                    numrep.push(`${s}.${e} ${prefix}smovie_dl ${subjectId}🎈${title}🎈${cover}🎈${s}🎈${e}`);
                    if (config.MESSAGE_TYPE?.toLowerCase() === 'button') {
                        buttons.push({
                            title: `S${String(s).padStart(2,'0')}E${String(e).padStart(2,'0')}`,
                            description: `Season ${s} Episode ${e}`,
                            id: `${prefix}smovie_dl ${subjectId}🎈${title}🎈${cover}🎈${s}🎈${e}`
                        });
                    }
                }
                cot += '\n';
            }

            cot += `\n_💡 For other episodes, use:_\n${oce}${prefix}smovie_dl ${subjectId}🎈${title}🎈${cover}🎈<season>🎈<episode>${oce}`;
        }

        const coverBuf = await safeImageBuffer(cover);
        const coverMedia = coverBuf ? { image: coverBuf } : { image: { url: config.LOGO } };

        if (config.MESSAGE_TYPE?.toLowerCase() === 'button' && !isTV && buttons.length) {
            const listData = {
                title: buttonTitle,
                sections: [{ title: 'Download', rows: buttons }]
            };
            await conn.sendMessage(from, {
                ...coverMedia,
                caption: cot,
                footer: config.FOOTER,
                buttons: [{
                    buttonId: 'action',
                    type: 4,
                    buttonText: { displayText: '🔽 Select Option' },
                    nativeFlowInfo: { name: 'single_select', paramsJson: JSON.stringify(listData) }
                }],
                headerType: 1,
                viewOnce: true,
            }, { quoted: mek });
        } else {
            const mass = await conn.sendMessage(from, {
                ...coverMedia,
                caption: `${cot}\n${config.FOOTER}`,
            }, { quoted: mek });

            await storenumrepdata({
                key: mass.key,
                numrep,
                method: isTV ? 'decimal' : 'nondecimal',
            });
        }

    } catch (e) {
        console.error(e);
        reply('*An error occurred. Please try again later. ⛔️*');
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});


// ─────────────────────────────────────────────────────────────────────────────
//  smovie_dl  —  Download movie / specific episode
// ─────────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'smovie_dl',
    react: '⬇️',
    dontAddCommandList: true,
    filename: __filename,
},
async (conn, mek, m, { from, prefix, q, isDev, isMe, isOwners, reply }) => {
    try {
        if (!dbData?.FREE_MOVIE_CMD && !isDev) return reply(preMg);
        if (config.MOVIE_DL === 'only_me'     && !isMe     && !isDev) return reply(disMgOnlyme);
        if (config.MOVIE_DL === 'only_owners' && !isOwners)           return reply(disMgOnlyOwners);
        if (config.MOVIE_DL === 'disable'     && !isDev)              return reply(disMgAll);

        if (!q) return reply(`*Usage: ${prefix}smovie_dl <id>🎈<title>🎈<cover>🎈<season>🎈<episode>*`);

        const parts     = q.split('🎈');
        const subjectId = parts[0]?.trim() || '';
        const title     = parts[1]?.trim() || 'N/A';
        const cover     = parts[2]?.trim() || config.LOGO;
        const season    = parseInt(parts[3]) || 0;
        const episode   = parseInt(parts[4]) || 0;

        if (!subjectId) return reply('*Invalid movie ID. ❌*');

        const isTV = season > 0 || episode > 0;
        const label = isTV
            ? `S${String(season).padStart(2,'0')}E${String(episode).padStart(2,'0')}`
            : 'Movie';

        // Fetch cover image safely (CDN has TLS cert mismatch)
        const coverBuf2 = await safeImageBuffer(cover);
        const coverMedia2 = coverBuf2 ? { image: coverBuf2 } : { image: { url: config.LOGO } };

        // Status message shown while fetching download link
        const statusMsg = await conn.sendMessage(from, {
            ...coverMedia2,
            text: `*🔍 Fetching download link for:*\n📌 *${title}* ${isTV ? `[ ${label} ]` : ''}\n\n_Please wait..._`,
        }, { quoted: mek });

        const dl = await fetchJson(
            `${SILENT_API}/api/download?movie_id=${subjectId}&season=${season}&episode=${episode}`
        );

        if (!dl?.download_url) {
            await conn.sendMessage(from, { text: '*Download link not found ❌*', edit: statusMsg.key });
            return;
        }

        const sizeBytes  = parseInt(dl.size_bytes) || 0;
        const sizeLabel  = formatBytes(dl.size_bytes);
        const quality    = dl.quality || 'N/A';

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
            text: `*⬆️ Uploading:* *${title}* ${isTV ? `[ ${label} ]` : ''}\n📦 Size: ${sizeLabel} | 🎯 Quality: ${quality}`,
            edit: statusMsg.key,
        });

        await m.react('⬆️');

        let thumbnailBuffer;
        try {
            thumbnailBuffer = await resizeThumbnail(await getThumbnailFromUrl(cover));
        } catch (_) {
            thumbnailBuffer = undefined;
        }

        const fileName = isTV
            ? `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${title} ${label}.mp4`
            : `${config.FILE_NAME ? config.FILE_NAME + ' ' : ''}${title}.mp4`;

        const caption =
            `*${title}*${isTV ? ` — ${label}` : ''}\n` +
            `${pk} ${quality} | ${sizeLabel} ${pk2}\n\n` +
            (config.CAPTION || config.FOOTER || '');

        // Try buffer download first, fallback to streaming URL
        const docPayload = {
            fileName,
            mimetype: 'video/mp4',
            caption,
        };

        if (thumbnailBuffer) docPayload.jpegThumbnail = thumbnailBuffer;

        try {
            const buf = (await axios.get(dl.download_url, { responseType: 'arraybuffer', timeout: 120000 })).data;
            docPayload.document = buf;
        } catch (_) {
            docPayload.document = { url: dl.download_url };
        }

        await conn.sendMessage(from, docPayload, { quoted: mek });

        // Send subtitle file if available
        if (dl.subtitle_url) {
            await conn.sendMessage(from, {
                document: { url: dl.subtitle_url },
                fileName: isTV
                    ? `${title} ${label} [English].srt`
                    : `${title} [English].srt`,
                mimetype: 'application/x-subrip',
                caption: `🆎 *English Subtitles* — ${title}${isTV ? ` ${label}` : ''}`,
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { text: '*✅ Upload Successful!*', edit: statusMsg.key });
        await m.react('✔️');
        await inputMovie(false, title, Date.now());

    } catch (e) {
        await resetMovie();
        console.error(e);
        await reply(e.message ? e.message : '*An error occurred. Please try again later. ⛔️*');
        await conn.sendMessage(from, { react: { text: '⛔️', key: mek.key } });
    }
});
