import { fileURLToPath as __fileURLToPath } from "node:url";
const __filename = __fileURLToPath(import.meta.url);
import __import0 from "axios";
import __import1 from "../command.js";
import __import2 from "../config.js";
import __import3 from "qrcode";
import * as __import4 from "compile-run";
import * as __import5 from "mathjs";
import __import6 from "../lib/language.json" with { type: 'json' };
// ============================= R E Q U E S T =============================
const axios = __import0;
const { cmd, commands } = __import1;
const config = __import2;
const qrcode = __import3;
const WEATHER_API_KEY = "2244e068bad8437c93efe32310cad85a";
const { python } = __import4;
const math = __import5;

// ============================= L A N G U A G E =============================
var allLangs = __import6;
var LANG = config.LANG === 'EN' ? 'EN' 
         : config.LANG === 'FR' ? 'FR' 
         : 'EN';

var lang = allLangs[LANG];
let { providePartsError, createPrankError, pythonCodeError, pythonRunError, 
      apiEndpointError, invalidUrlError, jsonApiError, testEndpointError, 
      provideSongNameError, lyricsNotFoundError, invalidNumberMsg, qrCaption, 
      weatherUsage, weatherErr, wikiUsage, wikiNotFound, wikiApiEr, 
      ipConfigErr, needMath, wrongMath, mathMg, mathFunMg, mathAdv } = lang;

// ============================= H E L P E R   F U N C T I O N S =============================
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function parseOptions(args) {
    const options = {
        method: 'GET',
        headers: {},
        params: {},
        data: null,
        showHeaders: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '-method' && args[i + 1]) {
            options.method = args[i + 1].toUpperCase();
            i++;
        } else if (arg === '-h' && args[i + 1]) {
            try {
                const headers = JSON.parse(args[i + 1]);
                options.headers = { ...options.headers, ...headers };
            } catch (e) {
                // If not JSON, treat as single header
                const headerParts = args[i + 1].split(':');
                if (headerParts.length === 2) {
                    options.headers[headerParts[0].trim()] = headerParts[1].trim();
                }
            }
            i++;
        } else if (arg === '-data' && args[i + 1]) {
            try {
                options.data = JSON.parse(args[i + 1]);
            } catch (e) {
                options.data = args[i + 1];
            }
            i++;
        } else if (arg === '-params' && args[i + 1]) {
            try {
                options.params = JSON.parse(args[i + 1]);
            } catch (e) {
                // Parse as key=value pairs
                const paramParts = args[i + 1].split('&');
                paramParts.forEach(param => {
                    const [key, value] = param.split('=');
                    if (key && value) {
                        options.params[key] = value;
                    }
                });
            }
            i++;
        } else if (arg === '-headers') {
            options.showHeaders = true;
        }
    }

    return options;
}

// ============================= C O M M A N D S =============================
cmd({
    pattern: "sendpoll",
    desc: "Send yes/no poll",
    react: "🗳️",
    filename: __filename
},
async (conn, mek, m, { reply, from }) => {
    try {
        await conn.sendMessage(
            from,
            {
                poll: {
                    name: 'My Poll',
                    values: ['Yes', 'No'],
                    selectableCount: 1,
                    toAnnouncementGroup: false
                }
            }
        )
    } catch (e) {
        console.error(e);
        reply("❌ Error sending poll!");
    }
});

cmd({
    pattern: "weather",
    desc: "Get live weather updates",
    category: "other",
    react: "🌦️",
    use: "weather Colombo",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    const location = args.join(" ");
    if (!location) return reply(weatherUsage);

    try {
        const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const data = res.data;
        const weatherInfo = `
Weather in ${data.name}, ${data.sys.country}:
➠ Temperature : ${data.main.temp}°C
➠ Feels Like  : ${data.main.feels_like}°C
➠ Wind Speed  : ${data.wind.speed} m/s
➠ Humidity    : ${data.main.humidity}%
➠ Condition   : ${data.weather[0].description}

${config.FOOTER}`;
        await reply(weatherInfo);
    } catch (error) {
        console.error("Weather API Error:", error.message);
        await reply(weatherErr);
    }
});

cmd({
    pattern: "wiki",
    desc: "Search Wikipedia for any topic",
    category: "other",
    react: "📖",
    use: "wiki <query>",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    const query = args.join(" ");
    if (!query) return reply(wikiUsage);

    try {
        const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
        if (!res.data.extract) return reply(wikiNotFound);

        await reply(`📖 *Wikipedia Summary:*\n\n📌 ${res.data.extract}\n🔗 ${res.data.content_urls.desktop.page}\n\n${config.FOOTER}`);
    } catch (error) {
        console.error("Wikipedia API Error:", error.message);
        await reply(wikiApiEr);
    }
});

cmd({
    pattern: "ipinfo",
    alias: ["ip"],
    desc: "Get details of an IP address",
    category: "other",
    react: "🌎",
    use: "ipinfo <IP>",
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    if (!args[0]) return reply("📌 *Usage:* .ipinfo 8.8.8.8");

    try {
        let res = await axios.get(`http://ip-api.com/json/${args[0]}`);
        let data = res.data;

        let msg = `🌍 *IP Lookup: ${args[0]}*\n\n` +
                  `📍 *Country:* ${data.country} (${data.countryCode})\n` +
                  `🏙️ *City:* ${data.city}\n` +
                  `🕰️ *Timezone:* ${data.timezone}\n` +
                  `🔌 *ISP:* ${data.isp}\n` +
                  `📡 *Coordinates:* ${data.lat}, ${data.lon}\n\n` +
                  `🔗 *Map:* https://www.google.com/maps?q=${data.lat},${data.lon}`;

        await conn.sendMessage(m.chat, { text: msg }, { quoted: mek });
    } catch (error) {
        console.log(error);
        await reply(ipConfigErr);
    }
});

cmd({
    pattern: "whlink",
    alias: ["wlink", "linkgen", "chatlink"],
    desc: "Generate WhatsApp link from number & optional message",
    category: "other",
    react: "🔗",
    use: "whlink 2376xxxxxx Hello there",
    filename: __filename,
}, async (conn, m, msg, { q, reply }) => {
    let number = null;
    let messageText = "";

    if (m.quoted && m.quoted.sender) {
        number = m.quoted.sender.split("@")[0];
    }

    if (!number && q) {
        const args = q.trim().split(" ");
        number = args[0].replace(/[^0-9]/g, "");
        messageText = args.slice(1).join(" ");
        if (number.startsWith("0") && number.length === 10) {
            number = "94" + number.slice(1);
        }
    }

    if (!number || number.length < 9) {
        return reply(invalidNumberMsg);
    }

    const encodedMsg = encodeURIComponent(messageText);
    const link = `https://wa.me/${number}${messageText ? `?text=${encodedMsg}` : ""}`;

    const preview = `🔗 *WhatsApp Link Generated!*\n\n` +
                    `📱 *Number:* +${number}\n` +
                    (messageText ? `💬 *Message:* ${messageText}\n` : ``) +
                    `🌐 *Link:* ${link}`;

    await reply(preview);

    try {
        const qr = await qrcode.toBuffer(link, { width: 300 });
        await conn.sendMessage(m.chat, {
            image: qr,
            caption: qrCaption
        }, { quoted: m });
    } catch (e) {
        console.log("QR Error:", e);
    }
});

cmd({
    pattern: "readmore",
    alias: ["rm", "rmore"],
    desc: "Create a WhatsApp-style Read More prank message",
    category: "other",
    react: "😏",
    use: "readmore <text> | Reply to a message",
    filename: __filename
}, async (conn, mek, m, { from, reply, args }) => {
    try {
        const spam = "\u200B".repeat(4001);

        if (m.quoted && m.quoted.msg) {
            const quotedText = m.quoted.msg.trim();
            const lines = quotedText.split('\n');

            if (lines.length >= 2) {
                const firstLine = lines[0];
                const rest = lines.slice(1).join('\n');
                const prankMsg = `${firstLine}${spam}${rest}`;
                await conn.sendMessage(from, { text: prankMsg }, { quoted: mek });
            } else {
                const words = quotedText.split(/\s+/);
                if (words.length >= 2) {
                    const firstWord = words[0];
                    const rest = words.slice(1).join(` ${spam}`);
                    const prankMsg = `${firstWord}${spam}${rest}`;
                    await conn.sendMessage(from, { text: prankMsg }, { quoted: mek });
                } else {
                    const prankMsg = `${quotedText}${spam}ㅤ`;
                    await conn.sendMessage(from, { text: prankMsg }, { quoted: mek });
                }
            }
            return;
        }

        if (args.length < 1) return await reply(`*Usage:*\n• Reply to a message with .readmore\n• .readmore <first part> | <second part>\n• .readmore <word1> <word2> <word3>...`);

        const fullText = args.join(' ');

        if (fullText.includes('|')) {
            const parts = fullText.split('|');
            const firstPart = parts[0].trim();
            const secondPart = parts.slice(1).join('|').trim();
            const prankMsg = `${firstPart}${spam}${secondPart}`;
            await reply(prankMsg);
        } else {
            const words = fullText.split(/\s+/);
            if (words.length >= 2) {
                const firstWord = words[0];
                const rest = words.slice(1).join(` ${spam}`);
                const prankMsg = `${firstWord}${spam}${rest}`;
                await reply(prankMsg);
            } else {
                const prankMsg = `${fullText}${spam}ㅤ`;
                await reply(prankMsg);
            }
        }
    } catch (e) {
        console.error("WH Prank Error:", e);
        await reply(createPrankError);
    }
});

cmd({
    pattern: "runpy",
    react: "🐍",
    alias: ["pyexec", "pythonrun"],
    desc: "Run quoted Python code",
    category: "other",
    use: "runpy <reply python code>",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        if (m.quoted && m.quoted.msg) {
            const code = m.quoted.msg.trim();
            const result = await python.runSource(code);

            if (result.stdout) await reply(`✅ *Output:*\n\`\`\`\n${result.stdout.trim()}\n\`\`\``);
            if (result.stderr) await reply(`⚠️ *Error:*\n\`\`\`\n${result.stderr.trim()}\n\`\`\``);
        } else {
            return reply(pythonCodeError);
        }
    } catch (err) {
        console.error("❌ Compile error:", err);
        await reply(`${pythonRunError}\n\`\`\`\n${err.stderr || err.message}\n\`\`\``);
    }
});

// FIXED: Changed from template tag function to regular string concatenation
cmd({
    pattern: "testapi",
    alias: ["api", "get"],
    desc: "Fetch data from an API endpoint",
    category: "other",
    react: "🌐",
    filename: __filename
}, async (conn, mek, m, {
    from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber,
    botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName,
    participants, groupAdmins, isBotAdmins, isAdmins, reply, isOwners
}) => {
    try {
        if (!q) {
            return reply(`${apiEndpointError}\n\nUsage:\n➠ ${config.PREFIX}testapi <url>\n\nExamples:\n➠ ${config.PREFIX}testapi https://api.princetechn.com/api/ai/ai?apikey=prince&q=Whats+Your+Model\n\nSupported Methods: GET, POST, PUT, DELETE`);
        }

        const urlParts = q.split(' ');
        const url = urlParts[0];
        
        if (!isValidUrl(url)) {
            return reply(invalidUrlError);
        }

        const options = parseOptions(urlParts.slice(1));
        
        const axiosConfig = {
            method: options.method || 'GET',
            url: url,
            timeout: 10000,
            headers: {
                'User-Agent': 'PRINCE-MDX-Bot/1.0',
                ...options.headers
            }
        };

        if (options.data && ['POST', 'PUT', 'PATCH'].includes(axiosConfig.method.toUpperCase())) {
            axiosConfig.data = options.data;
            axiosConfig.headers['Content-Type'] = 'application/json';
        }

        if (options.params) {
            axiosConfig.params = options.params;
        }

        await reply('🔄 *Fetching data from API...*');

        const response = await axios(axiosConfig);
        
        let output = `✅ *API Response Success*\n`;
        output += `📊 *Status:* ${response.status} ${response.statusText}\n`;
        output += `⚡ *Method:* ${axiosConfig.method.toUpperCase()}\n`;
        
        if (response.headers['content-type']?.includes('application/json')) {
            output += `📄 *Response Data:*\n`;
            const jsonData = typeof response.data === 'string' ? 
                JSON.parse(response.data) : response.data;
            
            const jsonString = JSON.stringify(jsonData, null, 2);
            if (jsonString.length > 2000) {
                output += `\`\`\`json\n${jsonString.substring(0, 5000)}...\n\`\`\`\n`;
                output += `\n⚠️ *Response too large, showing first 5000 characters*`;
            } else {
                output += `\`\`\`json\n${jsonString}\n\`\`\``;
            }
        } else if (response.headers['content-type']?.includes('text/')) {
            output += `📄 *Response Data:*\n`;
            const textData = response.data.toString();
            if (textData.length > 2000) {
                output += `\`\`\`\n${textData.substring(0, 5000)}...\n\`\`\`\n`;
                output += `\n⚠️ *Response too large, showing first 5000 characters*`;
            } else {
                output += `\`\`\`\n${textData}\n\`\`\``;
            }
        } else {
            output += `📄 *Response Type:* ${response.headers['content-type']}\n`;
            output += `📦 *Size:* ${response.headers['content-length'] || 'Unknown'} bytes\n`;
            output += `\n⚠️ *Binary/Non-text response received*`;
        }

        if (options.showHeaders) {
            output += `\n\n📋 *Response Headers:*\n`;
            Object.entries(response.headers).forEach(([key, value]) => {
                output += `• ${key}: ${value}\n`;
            });
        }

        await reply(output);
    } catch (error) {
        console.error('API Fetch Error:', error);
        
        let errorMsg = `❌ *API Request Failed*\n\n`;
        
        if (error.response) {
            errorMsg += `🌐 *URL:* ${error.config?.url}\n`;
            errorMsg += `📊 *Status:* ${error.response.status} ${error.response.statusText}\n`;
            errorMsg += `⚡ *Method:* ${error.config?.method?.toUpperCase()}\n\n`;
            errorMsg += `💬 *Error Message:*\n`;
            
            if (error.response.data) {
                const errorData = typeof error.response.data === 'string' ? 
                    error.response.data : JSON.stringify(error.response.data, null, 2);
                errorMsg += `\`\`\`\n${errorData.substring(0, 1000)}\n\`\`\``;
            } else {
                errorMsg += `\`\`\`\n${error.message}\n\`\`\``;
            }
        } else if (error.request) {
            errorMsg += `🌐 *URL:* ${error.config?.url}\n`;
            errorMsg += `❌ *Error:* No response received\n`;
            errorMsg += `💬 *Details:* ${error.message}`;
        } else {
            errorMsg += `❌ *Error:* ${error.message}`;
        }

        await reply(errorMsg);
    }
});

// FIXED: Changed from template tag function to regular string concatenation
cmd({
    pattern: "json",
    alias: ["jsonapi"],
    desc: "Quick fetch JSON data from API",
    category: "other", 
    react: "📄",
    filename: __filename
}, async (conn, mek, m, {
    from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber,
    botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName,
    participants, groupAdmins, isBotAdmins, isAdmins, reply, isOwners
}) => {
    try {
        if (!q) {
            return reply(`${jsonApiError}\n\n*Usage:* ${config.PREFIX}json <url>\n\n*Examples:*\n• ${config.PREFIX}json https://api.princetechn.com/api/ai/ai?apikey=prince&q=Whats+Your+Model\n• ${config.PREFIX}json https://jsonplaceholder.typicode.com/posts/1`);
        }

        if (!isValidUrl(q)) {
            return reply(invalidUrlError);
        }

        await reply('🔄 *Fetching JSON data...*');

        const response = await axios.get(q, {
            timeout: 10000,
            headers: {
                'User-Agent': 'PRINCE-MDX-Bot/1.0',
                'Accept': 'application/json'
            }
        });

        const jsonData = response.data;
        const jsonString = JSON.stringify(jsonData, null, 2);

        let output = `✅ *JSON API Response*\n\n`;
        output += `📊 *Status:* ${response.status}\n\n`;
        output += `📄 *JSON Data:*\n`;

        if (jsonString.length > 2500) {
            output += `\`\`\`json\n${jsonString.substring(0, 2500)}...\n\`\`\`\n`;
            output += `\n⚠️ *Response too large, showing first 2500 characters*`;
        } else {
            output += `\`\`\`json\n${jsonString}\n\`\`\``;
        }

        await reply(output);
    } catch (error) {
        console.error('JSON API Error:', error);
        
        let errorMsg = `❌ *JSON API Request Failed*\n\n`;
        if (error.response) {
            errorMsg += `📊 *Status:* ${error.response.status}\n`;
            errorMsg += `❌ *Error:* ${error.response.statusText}`;
        } else {
            errorMsg += `❌ *Error:* ${error.message}`;
        }
        
        await reply(errorMsg);
    }
});

cmd({
    pattern: "lyrics",
    alias: ["lyric", "song"],
    desc: "Search song lyrics",
    category: "search",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return reply(provideSongNameError);
        
        await m.react("⏳");
        
        const response = await axios.get(`https://api.princetechn.com/api/search/lyricsv2?apikey=prince&query=${encodeURIComponent(q)}`);
        const data = response.data;
        
        if (!data || !data.status || !data.result) {
            await m.react("❌");
            return reply(lyricsNotFoundError);
        }
        
        const result = data.result;
        const lyrics = result.lyrics || "";
        
        if (!lyrics) {
            await m.react("❌");
            return reply(lyricsNotFoundError);
        }
        
        let lyricsText = `🎵 *${result.title || q}*\n`;
        lyricsText += `👤 *Artist:* ${result.artist || "Unknown"}\n`;
        if (result.album) lyricsText += `💿 *Album:* ${result.album}\n`;
        lyricsText += `\n━━━━━━━━━━━━━━━━━━━\n\n`;
        lyricsText += lyrics.substring(0, 3500);
        
        if (lyrics.length > 3500) {
            lyricsText += "\n\n...\n_[Lyrics truncated due to length]_";
        }
        
        lyricsText += `\n\n━━━━━━━━━━━━━━━━━━━\n> 🎶 _Prince MDX Lyrics_`;
        
        await m.react("✅");
        
        if (result.image) {
            await conn.sendMessage(from, {
                image: { url: result.image },
                caption: lyricsText
            }, { quoted: mek });
        } else {
            await reply(lyricsText);
        }
    } catch (error) {
        console.error('Lyrics Search Error:', error);
        await m.react("❌");
        await reply(lyricsNotFoundError);
    }
});

cmd({
    pattern: "math",
    alias: ["solve", "samikarana"],
    react: "🧮",
    desc: "Solve and explain any math equation",
    category: "other",
    use: ".math <math_expression>",
    filename: __filename,
}, async (conn, mek, m, { reply, q, prefix }) => {
    try {
        if (!q) return await reply(needMath + ` \`${prefix}samikarana 2 + 3 * 4\``);

        const simplified = math.simplify(q).toString();
        const evaluated = math.evaluate(q);

        const msg = `${mathMg}\n\n` +
                    `📌 *Original:* \n\`\`\`${q}\`\`\`\n` +
                    `🔁 *Simplified:* \n\`\`\`${simplified}\`\`\`\n` +
                    `✅ *Final Answer:* \n\`\`\`${evaluated}\`\`\``;

        await reply(msg);
    } catch (err) {
        console.log(err);
        await reply(wrongMath);
    }
});

cmd({
    pattern: "supportmath",
    alias: ["mathhelp", "mathformats", "samikahelp"],
    react: "📚",
    desc: "Show all supported math expression examples",
    category: "other",
    use: ".supportmath",
    filename: __filename,
}, async (conn, mek, m, { reply }) => {
    try {
        const message = `${mathFunMg}\n\n🔢 *Basic Operations*\n➤ 2 + 3 * 4\n➤ (5 + 2) / 3\n➤ 7^2\n➤ 10 % 3\n\n🧮 *Advanced Functions*\n${mathAdv}\n\n📐 *Trigonometry*\n➤ sin(90 deg)\n➤ cos(pi)\n➤ tan(45 deg)\n\n🧠 *Constants*\n➤ pi\n➤ e\n\n📦 *Mixed Examples*\n➤ sin(90 deg) + sqrt(16)\n➤ (3^2 + 4^2)^0.5\n➤ log(10) * e\n\n💡 *Tip:* Use \`${config.PREFIX}math\` command to solve!\nExample: \`${config.PREFIX}math sqrt(36) + 2^3\``;

        await reply(message);
    } catch (err) {
        console.log(err);
        await reply("❌ Error displaying math help!");
    }
});
