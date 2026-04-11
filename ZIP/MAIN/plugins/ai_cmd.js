// ============================= R E Q U E S T =============================
const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");
const { fetchJson, uploadToCatbox } = require("../lib/functions");
const { blackbox } = require("../lib/scraper");
const { downloadMediaMessage } = require("prince-baileys");

const PRINCE_API_KEY = "prince";
const PRINCE_API_BASE = "https://api.princetechn.com/api/ai";

// ============================= L A N G U A G E =============================
var allLangs = require("../lib/language.json");
var LANG = config.LANG === 'EN' ? 'EN' 
         : config.LANG === 'FR' ? 'FR' 
         : 'EN';

var lang = allLangs[LANG];
var { queryMsg, noInputMsg, unsupportedLangMsg, errorMg } = lang;

// ============================= HELPER FUNCTION =============================
async function callPrinceAI(query) {
    try {
        const url = `${PRINCE_API_BASE}/ai?apikey=${PRINCE_API_KEY}&q=${encodeURIComponent(query)}`;
        const res = await fetchJson(url);
        if (res?.success && res?.result) {
            return { success: true, data: res.result };
        }
        return { success: false, data: null };
    } catch (e) {
        console.error("Prince AI Error:", e.message);
        return { success: false, data: null };
    }
}

//============================ MAIN AI COMMAND ============================
cmd({
    pattern: "ai",
    react: "🤖",
    alias: ["prince", "princeai", "ask"],
    desc: "Chat with Prince AI",
    category: "ai",
    use: "ai <query>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, prefix, q }) => {
    if (!q) return await reply(noInputMsg, `\`${prefix}ai your question\``);

    try {
        const result = await callPrinceAI(q);
        
        if (result.success) {
            await reply(result.data, '🤖');
        } else {
            const scraperData = await blackbox(q).catch(() => null);
            if (scraperData) {
                await reply(scraperData, '🤖');
            } else {
                await reply(errorMg);
            }
        }
    } catch (error) {
        console.error("AI Error:", error.message);
        await reply(errorMg);
    }
});

//============================ BLACKBOX AI ============================
cmd({
    pattern: "blackbox",
    react: "👾",
    alias: ["bbox", "bb"],
    desc: "Use BlackBox AI to get a response",
    category: "ai",
    use: "blackbox <query>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply(queryMsg, '🧠');

        const scraperData = await blackbox(q).catch(() => null);
        
        if (scraperData) {
            await reply(scraperData, '🧠');
        } else {
            const result = await callPrinceAI(q);
            if (result.success) {
                await reply(result.data, '🧠');
            } else {
                await reply(errorMg);
            }
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.error(e);
        await reply(errorMg);
    }
});

//============================ GEMINI AI ============================
cmd({
    pattern: "gemini",
    react: "💎",
    alias: ["geminiai", "geminichat", "ai2"],
    desc: "Use Gemini AI to get a response",
    category: "ai",
    use: "gemini <query>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, prefix, q }) => {
    if (!q) return await reply(noInputMsg, `\`${prefix}gemini your question\``);

    try {
        const res = await fetchJson(`https://ymd-ai.onrender.com/api/gemini?q=${encodeURIComponent(q)}`).catch(() => null);
        
        if (res?.data) {
            await reply(res.data, '💎');
        } else {
            const result = await callPrinceAI(q);
            if (result.success) {
                await reply(result.data, '💎');
            } else {
                await reply(errorMg);
            }
        }
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        await reply(errorMg);
    }
});

//============================ META AI ============================
cmd({
    pattern: "meta",
    react: "🌐",
    alias: ["metaai", "metachat", "ai4"],
    desc: "Use Meta AI to get a response",
    category: "ai",
    use: "meta <query>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply(queryMsg, '🌐');
        
        const data = await fetchJson("https://api.siputzx.my.id/api/ai/metaai?query=" + encodeURIComponent(q)).catch(() => null);
        
        if (data?.data) {
            await reply(data.data, '🌐');
        } else {
            const result = await callPrinceAI(q);
            if (result.success) {
                await reply(result.data, '🌐');
            } else {
                await reply(errorMg);
            }
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.error(e);
        await reply(errorMg);
    }
});

//============================ CHATGPT AI ============================
cmd({
    pattern: "chatgpt",
    react: "🧠",
    alias: ["gptai", "chatgptchat", "gpt", "ai5"],
    desc: "Use ChatGPT AI to get a response",
    category: "ai",
    use: "chatgpt <query>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply(queryMsg, '🧠');

        const res1 = await fetchJson("https://api.dreaded.site/api/chatgpt?text=" + encodeURIComponent(q)).catch(() => null);

        if (res1?.success && res1?.result?.prompt) {
            await reply(res1.result.prompt, '🧠');
        } else {
            const result = await callPrinceAI(q);
            if (result.success) {
                await reply(result.data, '🧠');
            } else {
                await reply(errorMg);
            }
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.error(e);
        await reply(errorMg);
    }
});

//============================ AI CODE ============================
cmd({
    pattern: "aicode",
    react: "💻",
    alias: ["codeai", "codechat", "ai6"],
    desc: "Use AI to generate code",
    category: "ai",
    use: "aicode <language | prompt>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply("❗️Please provide a query like: `javascript | how to reverse a string`", '💻');

        const supportedLangs = ["javascript", "typescript", "python", "swift", "ruby", "csharp", "go", "rust", "php", "matlab", "r", "java", "c", "cpp"];

        let lang = 'javascript';
        let text = q;

        if (q.includes("|")) {
            const parts = q.split("|");
            lang = parts[0].trim().toLowerCase();
            text = parts.slice(1).join("|").trim();
        }

        if (!supportedLangs.includes(lang)) {
            return await reply(`❌ Unsupported language. Use: ${supportedLangs.join(", ")}`, '💻');
        }

        const res = await fetchJson(`https://api.dreaded.site/api/aicode?prompt=${encodeURIComponent(text)}&language=${encodeURIComponent(lang)}`).catch(() => null);

        if (res?.success && res?.result?.prompt?.code) {
            await reply("```" + lang + "\n" + res.result.prompt.code + "\n```", '💻');
        } else {
            const codePrompt = `Write ${lang} code for: ${text}. Only provide the code, no explanation.`;
            const result = await callPrinceAI(codePrompt);
            if (result.success) {
                await reply(result.data, '💻');
            } else {
                await reply("❌ AI response failed. Please try again.");
            }
        }

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(errorMg);
    }
});

//============================ IMAGE GENERATION ============================
cmd({
    pattern: "imagine",
    react: "🎨",
    alias: ["imagegen", "imagegenai", "ai7", "genimg"],
    desc: "Generate an image from text",
    category: "ai",
    use: "imagine <prompt>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply("❗️Please provide an image description", '🎨');

        await reply("🎨 Generating image, please wait...");

        const res1 = await fetchJson("https://api.dreaded.site/api/imagine?text=" + encodeURIComponent(q)).catch(() => null);

        if (res1?.success && res1?.result) {
            await conn.sendMessage(from, { 
                image: { url: res1.result }, 
                caption: `🎨 *Image Generated*\n\n📝 Prompt: ${q}\n\n${config.FOOTER}` 
            }, { quoted: mek });
        } else {
            await reply("❌ Image generation failed. Please try again later.");
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.error(e);
        await reply("❌ Image generation failed. Please try again later.");
    }
});

//============================ TRANSLATE ============================
cmd({
    pattern: "translate",
    react: "🌍",
    alias: ["tr", "trans"],
    desc: "Translate text to another language",
    category: "ai",
    use: "translate <lang> | <text>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply("❗️Usage: .translate en | Bonjour", '🌍');

        let targetLang = 'en';
        let text = q;

        if (q.includes("|")) {
            const parts = q.split("|");
            targetLang = parts[0].trim().toLowerCase();
            text = parts.slice(1).join("|").trim();
        }

        const translatePrompt = `Translate the following text to ${targetLang}: "${text}". Only provide the translation, no explanation.`;
        const result = await callPrinceAI(translatePrompt);
        
        if (result.success) {
            await reply(`🌍 *Translation (${targetLang.toUpperCase()})*\n\n${result.data}`, '🌍');
        } else {
            await reply(errorMg);
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.error(e);
        await reply(errorMg);
    }
});

//============================ SUMMARIZE ============================
cmd({
    pattern: "summarize",
    react: "📝",
    alias: ["sum", "summary", "tldr"],
    desc: "Summarize text or article",
    category: "ai",
    use: "summarize <text>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply("❗️Please provide text to summarize", '📝');

        const summarizePrompt = `Summarize the following text in a concise manner: "${q}"`;
        const result = await callPrinceAI(summarizePrompt);
        
        if (result.success) {
            await reply(`📝 *Summary*\n\n${result.data}`, '📝');
        } else {
            await reply(errorMg);
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.error(e);
        await reply(errorMg);
    }
});

//============================ EXPLAIN ============================
cmd({
    pattern: "explain",
    react: "📚",
    alias: ["eli5", "define"],
    desc: "Explain a concept simply",
    category: "ai",
    use: "explain <topic>",
    filename: __filename
},
async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply("❗️Please provide a topic to explain", '📚');

        const explainPrompt = `Explain "${q}" in simple terms that anyone can understand. Be concise but thorough.`;
        const result = await callPrinceAI(explainPrompt);
        
        if (result.success) {
            await reply(`📚 *Explanation: ${q}*\n\n${result.data}`, '📚');
        } else {
            await reply(errorMg);
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.error(e);
        await reply(errorMg);
    }
});

//============================ BIBLE AI COMMAND ============================
const bibleSourcesCache = new Map();

cmd({
    pattern: "bibleai",
    react: "📖",
    alias: ["aibible", "scripture"],
    desc: "Ask Bible-based questions and get answers with references",
    category: "ai",
    use: "bibleai <question>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, prefix, q }) => {
    if (!q) return await reply(`📖 Ask a Bible question.\n\nExample: ${prefix}bibleai what is faith`);

    try {
        const res = await axios.get(`https://apisKeith.top/ai/bible?q=${encodeURIComponent(q)}`);
        const data = res.data;

        if (!data.status || !data.result?.results?.data?.answer) {
            return reply("❌ No Bible answer found.");
        }

        const answer = data.result.results.data.answer;
        const sources = data.result.results.data.sources;

        const caption = `📖 *${q}*\n\n${answer}\n\n📌 *Sources:* Reply with a number to view\n` +
            sources.map((src, i) => {
                if (src.type === "verse") return `${i + 1}. 📜 ${src.text}`;
                if (src.type === "article") return `${i + 1}. 📘 ${src.title}`;
                return `${i + 1}. ${src.text || src.title || "Source"}`;
            }).join("\n");

        const sent = await conn.sendMessage(from, { text: caption }, { quoted: mek });
        const messageId = sent.key.id;
        
        bibleSourcesCache.set(messageId, { sources, from, timestamp: Date.now() });
        
        setTimeout(() => bibleSourcesCache.delete(messageId), 5 * 60 * 1000);

    } catch (e) {
        console.error("bibleai error:", e);
        await reply("❌ Error fetching Bible answer: " + e.message);
    }
});

cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    try {
        const quoted = mek.message?.extendedTextMessage?.contextInfo;
        if (!quoted?.stanzaId) return;
        
        const cached = bibleSourcesCache.get(quoted.stanzaId);
        if (!cached || cached.from !== from) return;
        
        const index = parseInt(body?.trim()) - 1;
        if (isNaN(index)) return;
        
        const selected = cached.sources[index];
        if (!selected) {
            return conn.sendMessage(from, { text: "❌ Invalid number. Reply with a valid source number." }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: "📖", key: mek.key } });

        if (selected.type === "verse") {
            const ref = selected.bcv?.referenceLong?.replace(/\s+/g, "").replace(":", ":") || selected.text;
            try {
                const verseRes = await axios.get(`https://apisKeith.top/search/bible?q=${encodeURIComponent(ref)}`);
                const verseData = verseRes.data;

                if (!verseData.status || !verseData.result?.verses) {
                    return conn.sendMessage(from, { text: `❌ Couldn't fetch verse: ${selected.text}` }, { quoted: mek });
                }

                const verses = verseData.result.verses.map(v =>
                    `📖 *${v.book} ${v.chapter}:${v.verse}*\n${v.text}`
                ).join("\n\n");

                await conn.sendMessage(from, { text: verses }, { quoted: mek });
            } catch (err) {
                console.error("Verse fetch error:", err);
                await conn.sendMessage(from, { text: "❌ Error fetching verse text." }, { quoted: mek });
            }
        } else if (selected.type === "article") {
            await conn.sendMessage(from, {
                image: { url: selected.image },
                caption: `📘 *${selected.title}*\n\n${selected.text}\n\n🔗 ${selected.url}`
            }, { quoted: mek });
        }
    } catch (e) {
        console.log("Bible source handler error:", e.message);
    }
});


// ═══════════════════════════════════════════════════════════════════════════
//  PHOTO EDITOR COMMANDS  (Gifted API)
//  Usage for all three: reply to an image (or send image as caption) + prompt
// ═══════════════════════════════════════════════════════════════════════════

const GIFTED_PE_KEY = 'gifted';
const GIFTED_PE_BASE = 'https://api.giftedtech.co.ke/api/tools';

// Helper: download quoted/current image → upload to Catbox → return public URL
async function getEditableImageUrl(conn, mek, m) {
    try {
        const msgType = mek.message
            ? Object.keys(mek.message).find(k => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage')
            : null;

        let buf = null;
        if (msgType === 'imageMessage') {
            buf = await downloadMediaMessage(mek, 'buffer', {});
        } else if (m.quoted && m.quoted.type === 'imageMessage') {
            buf = await m.quoted.download();
        }
        if (!buf) return null;

        const url = await uploadToCatbox(buf, 'photo.jpg');
        return url || null;
    } catch {
        return null;
    }
}

// ── photoedit (V1) ──────────────────────────────────────────────────────────
cmd({
    pattern: 'photoedit',
    alias: ['pedit', 'editphoto'],
    react: '🎨',
    desc: 'AI photo editor — reply to an image with a prompt',
    category: 'ai',
    use: '.photoedit <prompt>  (reply to image)',
    filename: __filename,
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('*Please provide a prompt.*\nExample: `.photoedit change his shirt to red`');

        const imgUrl = await getEditableImageUrl(conn, mek, m);
        if (!imgUrl) return reply('*Please reply to an image or send one as a caption.*');

        const statusMsg = await conn.sendMessage(from, { text: '🎨 _Editing your photo..._' }, { quoted: mek });

        const res = await fetchJson(
            `${GIFTED_PE_BASE}/photoeditor?apikey=${GIFTED_PE_KEY}&url=${encodeURIComponent(imgUrl)}&prompt=${encodeURIComponent(q)}`
        );

        if (!res?.result || typeof res.result !== 'string') {
            await conn.sendMessage(from, { text: '❌ *Edit failed. The API could not process this image.*', edit: statusMsg.key });
            return;
        }

        await conn.sendMessage(from, { text: '✅ _Done!_', edit: statusMsg.key });
        await conn.sendMessage(from, {
            image: { url: res.result },
            caption: `✏️ *Photo Edit Complete*\n\n📝 _Prompt: ${q}_\n\n> ${config.FOOTER}`,
        }, { quoted: mek });

    } catch (e) {
        console.error('photoedit error:', e.message);
        reply('❌ *An error occurred. Please try again.*');
    }
});

// ── photoedit2 (V2 — GPT image model) ──────────────────────────────────────
cmd({
    pattern: 'photoedit2',
    alias: ['pedit2', 'editphoto2', 'gptphoto'],
    react: '🖼️',
    desc: 'AI photo editor v2 (GPT model) — reply to an image with a prompt',
    category: 'ai',
    use: '.photoedit2 <prompt>  (reply to image)',
    filename: __filename,
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply('*Please provide a prompt.*\nExample: `.photoedit2 make the background a beach`');

        const imgUrl = await getEditableImageUrl(conn, mek, m);
        if (!imgUrl) return reply('*Please reply to an image or send one as a caption.*');

        const statusMsg = await conn.sendMessage(from, { text: '🖼️ _Editing with GPT model..._' }, { quoted: mek });

        // V2 returns raw PNG binary, not JSON
        const res = await axios.get(
            `${GIFTED_PE_BASE}/photoeditorv2?apikey=${GIFTED_PE_KEY}&url=${encodeURIComponent(imgUrl)}&prompt=${encodeURIComponent(q)}&model=gpt-image-1`,
            { responseType: 'arraybuffer', timeout: 90000 }
        );

        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('image')) {
            await conn.sendMessage(from, { text: '❌ *Edit failed. The API returned an unexpected response.*', edit: statusMsg.key });
            return;
        }

        const imgBuf = Buffer.from(res.data);
        await conn.sendMessage(from, { text: '✅ _Done!_', edit: statusMsg.key });
        await conn.sendMessage(from, {
            image: imgBuf,
            caption: `🖼️ *Photo Edit v2 Complete*\n\n📝 _Prompt: ${q}_\n🤖 _Model: GPT-image-1_\n\n> ${config.FOOTER}`,
        }, { quoted: mek });

    } catch (e) {
        console.error('photoedit2 error:', e.message);
        reply('❌ *An error occurred. Please try again.*');
    }
});

// ── photoedit3 (V3 — model + resolution selection) ─────────────────────────
// Usage: .photoedit3 <prompt>
//        .photoedit3 <prompt> | <model>
//        .photoedit3 <prompt> | <model> | <resolution>
// Available models: ezremove_4.0, ezremove_4.0_pro, ezremove_3.0, ezremove_3.0_pro,
//                   nano_banana, nano_banana_pro, seedream_4, seedream_45
// Available resolutions: 1K, 2K, 4K
cmd({
    pattern: 'photoedit3',
    alias: ['pedit3', 'editphoto3', 'aiphoto'],
    react: '✨',
    desc: 'AI photo editor v3 (multi-model) — reply to an image with a prompt',
    category: 'ai',
    use: '.photoedit3 <prompt> | <model> | <resolution>',
    filename: __filename,
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                '*Usage:* `.photoedit3 <prompt> | <model> | <resolution>`\n\n' +
                '*Models:* ezremove_4.0, ezremove_4.0_pro, ezremove_3.0, ezremove_3.0_pro, nano_banana, nano_banana_pro, seedream_4, seedream_45\n' +
                '*Resolutions:* 1K, 2K, 4K\n\n' +
                '_Defaults: model=ezremove\\_4.0, resolution=1K_'
            );
        }

        const parts   = q.split('|').map(s => s.trim());
        const prompt  = parts[0];
        const model   = parts[1] || 'ezremove_4.0';
        const resolution = parts[2] || '1K';

        const imgUrl = await getEditableImageUrl(conn, mek, m);
        if (!imgUrl) return reply('*Please reply to an image or send one as a caption.*');

        const statusMsg = await conn.sendMessage(from, {
            text: `✨ _Editing with model *${model}* at *${resolution}*..._`,
        }, { quoted: mek });

        const res = await fetchJson(
            `${GIFTED_PE_BASE}/photoeditorv3?apikey=${GIFTED_PE_KEY}` +
            `&url=${encodeURIComponent(imgUrl)}` +
            `&prompt=${encodeURIComponent(prompt)}` +
            `&model=${encodeURIComponent(model)}` +
            `&resolution=${encodeURIComponent(resolution)}`
        );

        const outputUrl = res?.result?.output;
        if (!outputUrl) {
            await conn.sendMessage(from, { text: '❌ *Edit failed. The API could not process this image.*', edit: statusMsg.key });
            return;
        }

        await conn.sendMessage(from, { text: '✅ _Done!_', edit: statusMsg.key });
        await conn.sendMessage(from, {
            image: { url: outputUrl },
            caption:
                `✨ *Photo Edit v3 Complete*\n\n` +
                `📝 _Prompt: ${prompt}_\n` +
                `🤖 _Model: ${model}_\n` +
                `🖥️ _Resolution: ${resolution}_\n\n` +
                `> ${config.FOOTER}`,
        }, { quoted: mek });

    } catch (e) {
        console.error('photoedit3 error:', e.message);
        reply('❌ *An error occurred. Please try again.*');
    }
});


// ═══════════════════════════════════════════════════════════════════════════
//  GIFTED TOOLS — AUDIO & IMAGE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

// Helper: download quoted/current AUDIO → upload to Catbox → return public URL
// Also accepts a bare URL passed as q (user pastes an audio link)
async function getUploadedAudioUrl(conn, mek, m, q) {
    // If user supplied a direct URL, use it straight away
    if (q && (q.startsWith('http://') || q.startsWith('https://'))) return q.trim();

    try {
        const msgType = mek.message
            ? Object.keys(mek.message).find(k => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage')
            : null;

        const isAudio = t => t === 'audioMessage' || t === 'documentMessage';
        let buf = null;

        if (isAudio(msgType)) {
            buf = await downloadMediaMessage(mek, 'buffer', {});
        } else if (m.quoted && isAudio(m.quoted.type)) {
            buf = await m.quoted.download();
        }
        if (!buf) return null;

        return await uploadToCatbox(buf, 'audio.mp3') || null;
    } catch {
        return null;
    }
}

// ── vocalremover (V1) ────────────────────────────────────────────────────────
cmd({
    pattern: 'vocalremover',
    alias: ['removevocals', 'splitvocals', 'vrm'],
    react: '🎙️',
    desc: 'Remove/separate vocals from a song — reply to audio or paste a URL',
    category: 'ai',
    use: '.vocalremover  (reply to audio OR .vocalremover <audio URL>)',
    filename: __filename,
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        const audioUrl = await getUploadedAudioUrl(conn, mek, m, q);
        if (!audioUrl) return reply('*Please reply to an audio message or provide an audio URL.*');

        const statusMsg = await conn.sendMessage(from, { text: '🎙️ _Separating vocals..._' }, { quoted: mek });

        const res = await fetchJson(
            `${GIFTED_PE_BASE}/vocalremover?apikey=${GIFTED_PE_KEY}&url=${encodeURIComponent(audioUrl)}`
        );

        const { title, vocals, instrumental } = res?.result || {};
        if (!vocals && !instrumental) {
            await conn.sendMessage(from, { text: '❌ *Failed. The API could not process this audio.*', edit: statusMsg.key });
            return;
        }

        await conn.sendMessage(from, { text: '✅ _Separation complete! Sending tracks..._', edit: statusMsg.key });

        if (vocals) {
            await conn.sendMessage(from, {
                audio: { url: vocals },
                mimetype: 'audio/mpeg',
                ptt: false,
            }, { quoted: mek });
            await conn.sendMessage(from, { text: `🎤 *Vocals* — ${title || 'track'}\n> ${config.FOOTER}` }, { quoted: mek });
        }
        if (instrumental) {
            await conn.sendMessage(from, {
                audio: { url: instrumental },
                mimetype: 'audio/mpeg',
                ptt: false,
            }, { quoted: mek });
            await conn.sendMessage(from, { text: `🎵 *Instrumental* — ${title || 'track'}\n> ${config.FOOTER}` }, { quoted: mek });
        }

    } catch (e) {
        console.error('vocalremover error:', e.message);
        reply('❌ *An error occurred. Please try again.*');
    }
});

// ── vocalremover2 (V2) ───────────────────────────────────────────────────────
cmd({
    pattern: 'vocalremover2',
    alias: ['removevocals2', 'splitvocals2', 'vrm2'],
    react: '🎚️',
    desc: 'Vocal remover v2 (3 tracks: original + vocals + instrumental)',
    category: 'ai',
    use: '.vocalremover2  (reply to audio OR .vocalremover2 <audio URL>)',
    filename: __filename,
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        const audioUrl = await getUploadedAudioUrl(conn, mek, m, q);
        if (!audioUrl) return reply('*Please reply to an audio message or provide an audio URL.*');

        const statusMsg = await conn.sendMessage(from, { text: '🎚️ _Separating tracks (v2)..._' }, { quoted: mek });

        const res = await fetchJson(
            `${GIFTED_PE_BASE}/vocalremoverv2?apikey=${GIFTED_PE_KEY}&url=${encodeURIComponent(audioUrl)}`
        );

        const { title, original, vocals, instrumental } = res?.result || {};
        if (!vocals && !instrumental) {
            await conn.sendMessage(from, { text: '❌ *Failed. The API could not process this audio.*', edit: statusMsg.key });
            return;
        }

        await conn.sendMessage(from, { text: '✅ _Separation complete! Sending tracks..._', edit: statusMsg.key });

        const tracks = [
            { url: original,     label: '🔊 Original' },
            { url: vocals,       label: '🎤 Vocals' },
            { url: instrumental, label: '🎵 Instrumental' },
        ];

        for (const { url, label } of tracks) {
            if (!url) continue;
            await conn.sendMessage(from, {
                audio: { url },
                mimetype: 'audio/mpeg',
                ptt: false,
            }, { quoted: mek });
            await conn.sendMessage(from, { text: `${label} — ${title || 'track'}\n> ${config.FOOTER}` }, { quoted: mek });
        }

    } catch (e) {
        console.error('vocalremover2 error:', e.message);
        reply('❌ *An error occurred. Please try again.*');
    }
});


cmd({
    pattern: 'tts',
    alias: ['texttospeech', 'speak'],
    react: '🔊',
    desc: 'Convert text to speech audio',
    category: 'ai',
    use: 'tts <text>',
    filename: __filename,
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const voice = 'en_uk_female';

        let text = (q || '').trim();

        // If no text typed, try to use quoted message text
        if (!text && m.quoted) {
            const qt = m.quoted;
            text = (typeof qt.msg === 'string')
                ? qt.msg
                : (qt.msg?.text || qt.msg?.caption || '');
        }

        if (!text) return reply(
            `🔊 *Text To Speech*\n\n` +
            `Usage: *.tts <text>*\n` +
            `Or reply to any message with *.tts*`
        );

        await reply(`🔊 Generating speech...`);

        const url = `${PRINCE_API_BASE}/tts?apikey=${PRINCE_API_KEY}&text=${encodeURIComponent(text)}&voice=${voice}`;

        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });

        const audioBuffer = Buffer.from(res.data);

        if (!audioBuffer.length) return reply('❌ Failed to generate audio. Please try again.');

        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: false,
        }, { quoted: mek });

    } catch (e) {
        console.error('TTS error:', e.message);
        reply('❌ *Failed to generate speech. Please try again.*');
    }
});

