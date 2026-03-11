// ============================= R E Q U E S T =============================
const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");
const {fetchJson} = require("../lib/functions");
const { blackbox } = require("../lib/scraper");

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
