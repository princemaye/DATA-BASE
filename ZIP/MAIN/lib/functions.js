const axios = require('axios')
const fs = require('fs')
const path = require('path')
const mimes = require('mime-types')
const {
    fileTypeFromBuffer
} = require('file-type')
const sharp = require("sharp");

const getContextInfo = (botName) => {
    return {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363404978384902@newsletter',
            newsletterName: botName || 'PRINCE-MDX',
            serverMessageId: 143
        }
    };
};

const getBuffer = async (url, options) => {
    try {
        options ? options : {}
        var res = await axios({
            method: 'get',
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (e) {
        console.log(e)
    }
}

const getGroupAdmins = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];
    const admins = [];
    for (const p of participants) {
        if (p?.admin === 'admin' || p?.admin === 'superadmin') {
            if (p.id) admins.push(p.id);
            if (p.lid && p.lid !== p.id) admins.push(p.lid);
            if (p.jid) admins.push(p.jid);
            if (p.pn && p.pn !== p.jid) admins.push(p.pn);
        }
    }
    return admins;
}

const isParticipantAdmin = (participants, userIds) => {
    if (!participants || !Array.isArray(participants)) return false;
    if (!userIds) return false;
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    for (const p of participants) {
        if (p?.admin === 'admin' || p?.admin === 'superadmin') {
            for (const uid of ids) {
                if (uid && (p.id === uid || p.lid === uid || p.jid === uid || p.pn === uid)) {
                    return true;
                }
            }
        }
    }
    return false;
}

const getParticipantIds = (participants) => {
    if (!participants || !Array.isArray(participants)) return [];
    const ids = [];
    for (const p of participants) {
        if (p.id) ids.push(p.id);
        if (p.lid && p.lid !== p.id) ids.push(p.lid);
        if (p.jid) ids.push(p.jid);
        if (p.pn && p.pn !== p.jid) ids.push(p.pn);
    }
    return ids;
}

const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

const h2k = (eco) => {
    var lyrik = ['', 'K', 'M', 'B', 'T', 'P', 'E']
    var ma = Math.log10(Math.abs(eco)) / 3 | 0
    if (ma == 0) return eco
    var ppo = lyrik[ma]
    var scale = Math.pow(10, ma * 3)
    var scaled = eco / scale
    var formatt = scaled.toFixed(1)
    if (/\.0$/.test(formatt))
        formatt = formatt.substr(0, formatt.length - 2)
    return formatt + ppo
}

const isUrl = (url) => {
    return url.match(
        new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/,
            'gi'
        )
    )
}

const Json = (string) => {
    return JSON.stringify(string, null, 2)
}

const runtime = (seconds) => {
    seconds = Number(seconds)
    var d = Math.floor(seconds / (3600 * 24))
    var h = Math.floor(seconds % (3600 * 24) / 3600)
    var m = Math.floor(seconds % 3600 / 60)
    var s = Math.floor(seconds % 60)
    var dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : ''
    var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : ''
    var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : ''
    var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : ''
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}

async function getsize(fx) {
    function formatBytes(x) {
        let units = ['B', 'KB', 'MB', 'GB', 'TB']
        let bytes = x
        let i;

        for (i = 0; bytes >= 1024 && i < 4; i++) {
            bytes /= 1024;
        }

        return bytes.toFixed(2) + ' ' + units[i];
    }
    return formatBytes((await axios.head(fx)).headers['content-length'])
}

function formatBytes(x) {
    let units = ['B', 'KB', 'MB', 'GB', 'TB']
    let bytes = x
    let i;

    for (i = 0; bytes >= 1024 && i < 4; i++) {
        bytes /= 1024;
    }

    return bytes.toFixed(2) + ' ' + units[i];
}

async function formatSize(bytes, si = true, dp = 2) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return `${bytes} B`;
    }

    const units = si ?
        ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"] :
        ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (
        Math.round(Math.abs(bytes) * r) / r >= thresh &&
        u < units.length - 1
    );

    return `${bytes.toFixed(dp)} ${units[u]}`;
}

async function getFile(url) {
    try {
        const fileType = require("file-type");
        const response = await getBuffer(url)
        let type = await fileType.fromBuffer(response);
        let savepath = "./" + getRandom('.' + type.ext)
        await fs.promises.writeFile(savepath, response);
        return savepath
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}
async function fetchBuffer(string, options = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            if (/^https?:\/\//i.test(string)) {
                let data = await axios.get(string, {
                    headers: {
                        ...(!!options.headers ? options.headers : {}),
                    },
                    responseType: "arraybuffer",
                    ...options,
                })
                let buffer = await data?.data
                let name = /filename/i.test(data.headers?.get("content-disposition")) ? data.headers?.get("content-disposition")?.match(/filename=(.*)/)?.[1]?.replace(/["';]/g, '') : ''
                let mime = mimes.lookup(name) || data.headers.get("content-type") || (await fileTypeFromBuffer(buffer))?.mime
                resolve({
                    data: buffer,
                    size: Buffer.byteLength(buffer),
                    sizeH: formatSize(Buffer.byteLength(buffer)),
                    name,
                    mime,
                    ext: mimes.extension(mime)
                });
            } else if (/^data:.*?\/.*?;base64,/i.test(string)) {
                let data = Buffer.from(string.split`,` [1], "base64")
                let size = Buffer.byteLength(data)
                resolve({
                    data,
                    size,
                    sizeH: formatSize(size),
                    ...((await fileTypeFromBuffer(data)) || {
                        mime: "application/octet-stream",
                        ext: ".bin"
                    })
                });
            } else if (fs.existsSync(string) && fs.statSync(string).isFile()) {
                let data = fs.readFileSync(string)
                let size = Buffer.byteLength(data)
                resolve({
                    data,
                    size,
                    sizeH: formatSize(size),
                    ...((await fileTypeFromBuffer(data)) || {
                        mime: "application/octet-stream",
                        ext: ".bin"
                    })
                });
            } else if (Buffer.isBuffer(string)) {
                let size = Buffer?.byteLength(string) || 0
                resolve({
                    data: string,
                    size,
                    sizeH: formatSize(size),
                    ...((await fileTypeFromBuffer(string)) || {
                        mime: "application/octet-stream",
                        ext: ".bin"
                    })
                });
            } else if (/^[a-zA-Z0-9+/]={0,2}$/i.test(string)) {
                let data = Buffer.from(string, "base64")
                let size = Buffer.byteLength(data)
                resolve({
                    data,
                    size,
                    sizeH: formatSize(size),
                    ...((await fileTypeFromBuffer(data)) || {
                        mime: "application/octet-stream",
                        ext: ".bin"
                    })
                });
            } else {
                let buffer = Buffer.alloc(20)
                let size = Buffer.byteLength(buffer)
                resolve({
                    data: buffer,
                    size,
                    sizeH: formatSize(size),
                    ...((await fileTypeFromBuffer(buffer)) || {
                        mime: "application/octet-stream",
                        ext: ".bin"
                    })
                });
            }
        } catch (e) {
            reject(new Error(e?.message || e))
        }
    });
}

async function getDateAndTime(timeZone = 'Asia/Colombo') {
    try {
        const dateOptions = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
        const timeOptions = { timeZone, hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' };

        const currentDate = new Intl.DateTimeFormat('en-US', dateOptions).format(new Date());
        const currentTime = new Intl.DateTimeFormat('en-US', timeOptions).format(new Date());

        return {
            date: currentDate,
            time: currentTime
        };
    } catch (error) {
        console.error("Invalid timeZone or other error:", error.message);
        return null;
    }
}

const tr1 = async (text, toLang) => {
  try {
    const { translate } = require('@vitalets/google-translate-api');
    const res = await translate(text, { to: toLang });
    return res.text;
  } catch (error) {
    console.error("Translation Error:", error);
    return text;
  }
}


const tr2 = async (text, toLang) => {
  try {
      
    const translate = require('translate-google');
    const res = await translate(text, { to: toLang });
    return res;
  } catch (err) {
    console.error("Translation Error:", err);
    return text;
  }
};


const tr = async (text, toLang) => {
  try {
    const translate = require('google-translate-api-x');
    const res = await translate(text, { to: toLang });
    return res.text;
  } catch (error) {
    console.error("Translation Error:", error);
    return text;
  }
};

async function getThumbnailFromUrl(url) {
    try {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        return Buffer.from(response.data, "binary");
    } catch (error) {
        console.error("Error fetching thumbnail:", error);
        return null;
    }
}

async function resizeThumbnail(buffer) {
    return await sharp(buffer)
        .resize({ width: 200, height: 200 })
        .jpeg({ quality: 70 })
        .toBuffer();
}

async function checkDailymotionLink(url) {
  try {
    const videoIdMatch = url.match(/video\/([a-zA-Z0-9]+)/);
    if (!videoIdMatch) return { valid: false, message: "Invalid URL format" };

    const videoId = videoIdMatch[1];

    const response = await axios.get(`https://www.dailymotion.com/player/metadata/video/${videoId}`);

    if (response.status === 200 && response.data.title) {
      return {
        valid: true,
        title: response.data.title,
        duration: response.data.duration,
        thumbnail: response.data.thumbnails,
        message: "Valid Dailymotion link ✅"
      };
    }

    return { valid: false, message: "Not a valid Dailymotion video ❌" };
  } catch (err) {
    return { valid: false, message: "Error: " + err.message };
  }
}

async function checkGDriveLink(url) {
  try {
    const res = await axios.head(url, {
      maxRedirects: 0,
      validateStatus: status => status >= 200 && status < 400
    });

    // Check if it redirects to a download page
    if (res.status === 302 && res.headers.location.includes("googleusercontent")) {
      return { valid: true, message: "Valid Google Drive link ✅" };
    } else if (res.status === 200) {
      return { valid: true, message: "Valid Google Drive file page ✅" };
    } else {
      return { valid: false, message: "Invalid Google Drive link ❌" };
    }
  } catch (error) {
    return { valid: false, message: "Error: " + error.message };
  }
}

const getMyGroupDetails = async (conn) => {
    try {
        const groups = await conn.groupFetchAllParticipating();
        return Object.values(groups).map(group => ({
            name: group.subject,
            jid: group.id
        }));
    } catch (err) {
        console.error("Error fetching groups:", err);
        return [];
    }
};

const formatMessage = (template, values) => {
     return template.replace(/\${(.*?)}/g, (_, key) => values[key] || '');
};

const platformAwareRestart = (delay = 1500) => {
    const isReplit = !!(process.env.REPL_ID || process.env.REPL_SLUG);
    
    setTimeout(() => {
        if (isReplit) {
            console.log('🔄 Restarting via process.exit (Replit)...');
            process.exit(0);
        } else {
            const { exec } = require('child_process');
            const botName = require('../package.json').name || 'prince-mdx';
            console.log(`🔄 Restarting via PM2 (${botName})...`);
            exec(`pm2 restart ${botName}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ PM2 restart failed: ${error.message}`);
                    console.log('🔄 Falling back to process.exit...');
                    process.exit(0);
                }
            });
        }
    }, delay);
};

module.exports = {
    getBuffer,
    getGroupAdmins,
    isParticipantAdmin,
    getParticipantIds,
    getRandom,
    h2k,
    isUrl,
    Json,
    runtime,
    sleep,
    fetchJson,
    getsize,
    formatBytes,
    fetchBuffer,
    formatSize,
    getFile,
    getDateAndTime,
    tr,
    getThumbnailFromUrl,
    resizeThumbnail,
    checkDailymotionLink,
    checkGDriveLink,
    getMyGroupDetails,
    formatMessage,
    platformAwareRestart,
    uploadToCatbox,
    getContextInfo
}

async function uploadToCatbox(buffer, filename = 'file.bin') {
    const FormData = require('form-data');

    const ext = filename.split('.').pop().toLowerCase();
    const mimeMap = {
        mp3: 'audio/mpeg', ogg: 'audio/ogg', opus: 'audio/ogg',
        mp4: 'video/mp4', webp: 'image/webp', jpg: 'image/jpeg',
        jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    };
    const mimetype = mimeMap[ext] || 'application/octet-stream';
    const TIMEOUT = 20000;

    // 1️⃣ Catbox
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, { filename, contentType: mimetype });
        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: TIMEOUT,
        });
        if (res.data && res.data.startsWith('https://')) return res.data.trim();
        throw new Error(res.data || 'No URL');
    } catch (e) { console.log('Catbox error:', e.message, '— trying fallback...'); }

    // 2️⃣ uguu.se
    try {
        const form = new FormData();
        form.append('files[]', buffer, { filename, contentType: mimetype });
        const res = await axios.post('https://uguu.se/upload.php', form, {
            headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: TIMEOUT,
        });
        const url = res.data?.files?.[0]?.url;
        if (url && url.startsWith('http')) return url.trim();
        throw new Error('No URL');
    } catch (e) { console.log('uguu.se error:', e.message, '— trying fallback...'); }

    // 3️⃣ tmpfiles.org
    try {
        const form = new FormData();
        form.append('file', buffer, { filename, contentType: mimetype });
        const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: TIMEOUT,
        });
        const raw = res.data?.data?.url;
        if (raw && raw.startsWith('http')) {
            return raw.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        }
        throw new Error('No URL');
    } catch (e) { console.log('tmpfiles.org error:', e.message, '— trying fallback...'); }

    // 4️⃣ Litterbox (temporary, 1h)
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('time', '1h');
        form.append('fileToUpload', buffer, { filename, contentType: mimetype });
        const res = await axios.post('https://litterbox.catbox.moe/resources/internals/api.php', form, {
            headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: TIMEOUT,
        });
        if (res.data && res.data.startsWith('https://')) return res.data.trim();
        throw new Error(res.data || 'No URL');
    } catch (e) { console.log('Litterbox error:', e.message, '— trying fallback...'); }

    // 5️⃣ transfer.sh
    try {
        const res = await axios.put(`https://transfer.sh/${encodeURIComponent(filename)}`, buffer, {
            headers: { 'Content-Type': mimetype, 'Max-Days': '1' },
            maxContentLength: Infinity, maxBodyLength: Infinity, timeout: TIMEOUT,
        });
        const url = (res.data || '').trim();
        if (url.startsWith('http')) return url;
        throw new Error('No URL');
    } catch (e) { console.log('transfer.sh error:', e.message, '— trying fallback...'); }

    // 6️⃣ 0x0.st
    try {
        const form = new FormData();
        form.append('file', buffer, { filename, contentType: mimetype });
        const res = await axios.post('https://0x0.st', form, {
            headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: TIMEOUT,
        });
        const url = (res.data || '').trim();
        if (url.startsWith('http')) return url;
        throw new Error('No URL');
    } catch (e) { console.log('0x0.st error:', e.message); }

    return null;
}
