// ============================= R E Q U E S T =============================
const axios = require("axios");
const { cmd } = require("../command.js");
const config = require("../config");
const { translate } = require("@vitalets/google-translate-api");
const tinyurl = require("tinyurl");
const QRCode = require("qrcode");
const whois = require("whois-json");
const crypto = require("crypto");
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const os = require('os');
const path = require('path');

// Find ffmpeg — bundled binary first, then system PATH fallback
function findFfmpeg() {
    try {
        const staticPath = require('ffmpeg-static');
        if (staticPath && fs.existsSync(staticPath)) return staticPath;
    } catch (_) {}
    // Heroku buildpack path
    if (fs.existsSync('/app/vendor/ffmpeg/ffmpeg')) return '/app/vendor/ffmpeg/ffmpeg';
    // System PATH
    try { return execSync('which ffmpeg').toString().trim(); } catch (_) {}
    return 'ffmpeg';
}
const ffmpegBin = findFfmpeg();

// Tell fluent-ffmpeg (used by wa-sticker-formatter) where ffmpeg lives
const fluentFfmpeg = require('fluent-ffmpeg');
fluentFfmpeg.setFfmpegPath(ffmpegBin);

const sharp = require("sharp");
const Obf = require("javascript-obfuscator");
const { image2url } = require('@dark-yasiya/imgbb.js');
const fileType = require("file-type");
const { getContentType, downloadContentFromMessage } = require('prince-baileys');
const { Sticker, createSticker, StickerTypes } = require("wa-sticker-formatter");
const {getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions');

const { TempMail } = require("tempmail.lol");
const tempmail = new TempMail();
const botName = config.BOT_NAME && config.BOT_NAME !== "default" ? config.BOT_NAME : null;
// ============================= L A N G U A G E =============================
var allLangs = require("../lib/language.json");
var LANG = config.LANG === 'EN' ? 'EN' 
         : config.LANG === 'FR' ? 'FR' 
         : 'EN';

var lang = allLangs[LANG];
var { errorMg, currencyUsage, currencyFailed, shortUrlGenerated, shortUrlFailed, validUrl, qrCodeFailed, qrCodeEnterText, qrCodeGenerated, translateUsage, translateFailed, usageMessage, whoisFailedMessage, whoisResponseMessage, passwordLengthError, passwordCountError, invalidSelectionMessage, base64Usage, base64InvalidAction, base64InvalidInput, fakeAddressFailed, failMsg, successMsg, usageMsg, jsCodeNeed, jsCodeError, tempMailError, tempMailAPIError, inboxEmptyError, inboxFetchError, fetchingAddressMsg, fetchingPersonMsg, generatingVisaMsg, generatingMasterCardMsg, generatingProfileMsg, generatingCardMsg, profileFetchError, unableToFetchAddress, unableToFetchPerson, errorGeneratingVisa, errorGeneratingMasterCard, errorGeneratingProfile, errorGeneratingCard, bankFetchError } = lang;

// ============================= F U N C T I O N S =============================
// Alternative translation function if the package doesn't work
async function translateText(text, targetLang) {
    try {
        // Try the first method
        const result = await translate(text, { to: targetLang });
        return result.text;
    } catch (error) {
        console.log("Translation method 1 failed, trying alternative...");
        
        // Alternative: Use Google Translate API directly
        try {
            const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
                params: {
                    client: 'gtx',
                    sl: 'auto',
                    tl: targetLang,
                    dt: 't',
                    q: text
                }
            });
            
            if (response.data && response.data[0]) {
                return response.data[0].map(item => item[0]).join('');
            }
            throw new Error("Translation failed");
        } catch (apiError) {
            console.log("Alternative translation also failed");
            throw apiError;
        }
    }
}


async function imgId(num = 10) {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var characters9 = characters.length;
  for (var i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters9));
  }
  return result;
}

async function textToSticker(text) {
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 48px Sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 256);

    const pngBuffer = canvas.toBuffer("image/png");
    const webpBuffer = await sharp(pngBuffer)
        .webp({ quality: 90 })
        .toBuffer();

    return webpBuffer;
}

// ============================= C M D =============================
cmd({
    pattern: "flux",
    alias: ["fluxai", "imageai", "aigen", "generate"],
    desc: "Generate an image using Flux AI",
    category: "ai",
    react: "🎨",
    use: "flux a cute cat wearing glasses",
    filename: __filename
}, async (conn, mek, m, { args, reply, from, q }) => {
    try {
        // Get the prompt from q or args
        const prompt = q || args.join(' ');
        
        if (!prompt || prompt.trim().length === 0) {
            return reply("❌ Please provide a prompt for image generation.\n\nExample: `.flux a beautiful sunset over mountains`");
        }

        // Show processing
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        // Send initial processing message
        const processingMsg = await reply(`🎨 *Generating image with Flux AI...*\n\n📝 *Prompt:* ${prompt}\n⏳ Please wait, this may take 10-20 seconds...`);

        try {
            // Call Flux API with arraybuffer response
            const response = await axios.get(`https://apisKeith.top/ai/flux?q=${encodeURIComponent(prompt)}`, {
                responseType: "arraybuffer",
                timeout: 45000 // 45 seconds timeout for image generation
            });

            // Convert arraybuffer to buffer
            const imageBuffer = Buffer.from(response.data);

            // Check if we got valid image data
            if (!imageBuffer || imageBuffer.length < 1000) {
                throw new Error("Invalid image data received");
            }

            // Delete processing message
            await conn.sendMessage(from, { 
                delete: processingMsg.key 
            }).catch(e => console.log("Could not delete message:", e));

            // Send the generated image directly from buffer
            await conn.sendMessage(from, {
                image: imageBuffer,
                caption: `🎨 *Flux AI Image Generation*\n\n📝 *Prompt:* ${prompt}\n\n${config.FOOTER || "✨ Generated with Flux AI"}`
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        } catch (apiError) {
            console.error("Flux API Error:", apiError);
            
            // Try alternative API if first one fails
            try {
                await conn.sendMessage(from, { 
                    text: `🔄 *Trying alternative AI image generator...*`,
                    edit: processingMsg.key 
                });

                // Alternative 1: Use another Flux endpoint
                const altResponse = await axios.get(`https://api.nekorinn.my.id/ai/flux?prompt=${encodeURIComponent(prompt)}`, {
                    responseType: "arraybuffer",
                    timeout: 30000
                });

                const altBuffer = Buffer.from(altResponse.data);

                await conn.sendMessage(from, {
                    image: altBuffer,
                    caption: `🎨 *AI Image Generation*\n\n📝 *Prompt:* ${prompt}\n\n${config.FOOTER || "✨ Generated with AI"}`
                }, { quoted: mek });

                await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

            } catch (altError) {
                console.error("Alternative API error:", altError);
                
                // Try one more API
                try {
                    await conn.sendMessage(from, { 
                        text: `🔄 *Trying third image generator...*`,
                        edit: processingMsg.key 
                    });

                    const thirdResponse = await axios.get(`https://ai.tntapi.tech/api/generate-image`, {
                        params: { prompt: prompt },
                        responseType: "arraybuffer",
                        timeout: 25000
                    });

                    const thirdBuffer = Buffer.from(thirdResponse.data);

                    await conn.sendMessage(from, {
                        image: thirdBuffer,
                        caption: `🎨 *AI Image Generation*\n\n📝 *Prompt:* ${prompt}\n\n${config.FOOTER || "✨ Generated with AI"}`
                    }, { quoted: mek });

                    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

                } catch (thirdError) {
                    console.error("Third API error:", thirdError);
                    
                    // All APIs failed
                    await conn.sendMessage(from, { 
                        text: `❌ *Failed to generate image*\n\nAll AI services are currently unavailable.\n\nPlease try:\n1. A different prompt\n2. Try again in a few minutes\n3. Check if the prompt is appropriate`,
                        edit: processingMsg.key 
                    });
                    
                    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
                }
            }
        }

    } catch (error) {
        console.error("Flux command error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply("⚠️ An error occurred. Please try again later.");
    }
});


cmd({
    pattern: "editimg",
    alias: ["editimg", "imgedit", "editimage", "aimg"],
    desc: "Edit images with AI using text prompts",
    category: "ai",
    react: "🎨",
    use: "imageedit make it look like a painting (reply to image)",
    filename: __filename
}, async (conn, mek, m, { args, reply, from, quoted, q, body }) => {
    try {
        // Check if user replied to a message
        if (!m.quoted) {
            return reply(`🎨 *Image Editor*\n\nUsage: Reply to an image with your edit prompt.\n\nExample:\n\`\`\`
.imageedit make it look like a cartoon
.imageedit add sunglasses
.imageedit change background to beach
\`\`\``);
        }

        // Extract prompt from message
        let prompt = '';
        
        // Get the text after command from body
        if (body) {
            // Remove the command part (imageedit or any alias)
            const commandPattern = /^(imageedit|editimg|imgedit|aimg|editimage)\s*/i;
            prompt = body.replace(commandPattern, '').trim();
        }
        
        // If no prompt in body, try from q
        if (!prompt && q) {
            prompt = q.trim();
        }
        
        // If still no prompt, try args
        if (!prompt && args.length > 0) {
            prompt = args.join(' ').trim();
        }

        if (!prompt || prompt.length === 0) {
            return reply("❌ Please provide an edit prompt.\n\nExample: `.imageedit make it look like a painting`");
        }

        // Check the type of quoted message (using the same method as your working code)
        const quotedType = m.quoted.type;
        console.log("DEBUG - Quoted type:", quotedType); // For debugging
        
        // List of allowed types (from your working example)
        const allowedTypes = ['imageMessage', 'viewOnceMessageV2'];
        
        // Also allow stickers by checking if it's a sticker
        const isSticker = quotedType === 'stickerMessage';
        const isImage = allowedTypes.includes(quotedType);
        
        if (!isImage && !isSticker) {
            return reply("❌ Please reply to an image, sticker, or view-once image message.");
        }

        // Show processing
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        const processingMsg = await reply(`🎨 *Processing your image edit...*\n\n📝 *Prompt:* ${prompt}\n⏳ Please wait...`);

        try {
            // Download the media
            const fileName = `edit-${Date.now()}.${isSticker ? 'webp' : 'jpg'}`;
            const buffer = await m.quoted.download();
            
            if (!buffer || buffer.length === 0) {
                throw new Error("Failed to download image");
            }

            // Convert sticker to image if needed
            let finalBuffer = buffer;
            if (isSticker) {
                finalBuffer = await sharp(buffer)
                    .png()
                    .toBuffer();
            }

            // Convert to base64
            const base64Image = finalBuffer.toString("base64");

            // Call the AI image editing API
            const response = await axios.post(
                "https://ai-studio.anisaofc.my.id/api/edit-image",
                {
                    image: base64Image,
                    prompt: prompt
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": "Mozilla/5.0"
                    },
                    timeout: 60000
                }
            );

            // Check response
            if (!response.data || !response.data.imageUrl) {
                throw new Error("API returned no image URL");
            }

            const resultUrl = response.data.imageUrl;

            // Delete processing message
            await conn.sendMessage(from, { 
                delete: processingMsg.key 
            }).catch(e => console.log("Could not delete message:", e));

            // Send the edited image
            await conn.sendMessage(from, {
                image: { url: resultUrl },
                caption: `🎨 *AI Image Edit*\n\n📝 *Prompt:* ${prompt}\n\n${config.FOOTER || "✨ Edited with AI"}`
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        } catch (processError) {
            console.error("Image processing error:", processError);
            
            // Update processing message with error
            await conn.sendMessage(from, { 
                text: `❌ *Image Edit Failed*\n\nError: ${processError.message || "Unknown error"}\n\nPlease try:\n1. A different image\n2. A simpler prompt\n3. Try again later`,
                edit: processingMsg.key 
            });
            
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        }

    } catch (error) {
        console.error("ImageEdit command error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply("⚠️ An error occurred. Please try again later.");
    }
});

cmd({
    pattern: "currency",
    desc: "Convert currency values",
    category: "convert",
    react: "💱",
    use: "currency 100 USD LKR",
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    if (args.length < 3) return await reply(currencyUsage,);
    
    let [amount, from, to] = args;
    try {
        const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`);
        let rate = res.data.rates[to.toUpperCase()];
        if (!rate) return await reply(currencyUsage, "🔗");
        
        let converted = (parseFloat(amount) * rate).toFixed(2);
        await reply(`💱 *Currency Conversion:*

${amount} ${from.toUpperCase()} = ${converted} ${to.toUpperCase()}

> ${config.FOOTER}`);
    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(currencyFailed, "❌");
    }
});


cmd({
    pattern: "shorturl",
    desc: "Shorten long URLs",
    alias: ["surl", "short", "tourl"],
    category: "convert",
    react: "🔗",
    use: "shorturl < Url >",
    filename: __filename
}, async (conn, mek, m, { args, reply, q }) => {
    if (!q) return await reply(validUrl, "❌");
    
    try {
        let shortUrl = await tinyurl.shorten(args[0]);
        await reply(`${shortUrlGenerated} ${shortUrl})

> ${config.FOOTER}`);
    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(shortUrlFailed, "❌");
    }
});



cmd({
    pattern: "translate",
    alias: ["trt", "trans", "lang", "tr"],
    desc: "Translate text (use: .translate en [text] or reply to a message with .translate en)",
    category: "convert",
    react: "🌍",
    use: "translate en Hello or reply to a message with .translate en",
    filename: __filename
}, async (conn, mek, m, { args, reply, from, quoted }) => {
    try {
        let lang, text;
        
        // Function to extract text from message object
        const extractText = (msgObj) => {
            if (!msgObj) return null;
            
            // Try different possible text properties
            if (typeof msgObj === 'string') return msgObj;
            if (msgObj.text) return msgObj.text;
            if (msgObj.body) return msgObj.body;
            if (msgObj.message) return msgObj.message;
            if (msgObj.conversation) return msgObj.conversation;
            if (msgObj.extendedTextMessage && msgObj.extendedTextMessage.text) {
                return msgObj.extendedTextMessage.text;
            }
            
            // If it's an object with content, try to stringify or get first property
            const keys = Object.keys(msgObj);
            if (keys.length > 0) {
                // Check for common message properties
                for (const key of ['text', 'body', 'message', 'caption', 'content']) {
                    if (msgObj[key]) return msgObj[key];
                }
                // Return string representation if no specific text property found
                return JSON.stringify(msgObj);
            }
            
            return null;
        };
        
        // Check if user is replying to a message
        if (quoted && args.length === 1) {
            lang = args[0];
            
            // Extract text from quoted message
            text = extractText(quoted);
            
            if (!text) {
                return reply("❌ No text found in the quoted message. Please reply to a text message.");
            }
            
            // Clean up the text if it contains JSON or other metadata
            if (text.includes('{') && text.includes('}')) {
                try {
                    const parsed = JSON.parse(text);
                    text = extractText(parsed) || text;
                } catch (e) {
                    // If not valid JSON, use as is
                }
            }
        } 
        // Check if user is providing text directly
        else if (args.length >= 2) {
            lang = args[0];
            text = args.slice(1).join(" ");
        }
        // Invalid usage
        else {
            return reply(translateUsage || `❌ Usage: 
1. Direct: .translate en Hello World
2. Reply: Reply to a message with .translate en`);
        }
        
        // Validate language code
        if (!lang || lang.length < 2 || lang.length > 5) {
            return reply("⚠️ Invalid language code. Examples: en, es, fr, si, ta, hi, ur, id, ja, ko, zh, ru, de");
        }
        
        // Show processing message
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        // Debug log
        console.log("Translating:", { lang, text, type: typeof text });
        
        // Check if text is valid
        if (!text || text.trim().length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ No text to translate. Please provide text or reply to a text message.");
        }
        
        // If text is an object string representation, try to extract actual text
        if (typeof text === 'string' && text.startsWith('[object')) {
            // Try to get the message content from the original message
            if (m.quoted && m.quoted.msg) {
                const quotedMsg = m.quoted.msg;
                if (quotedMsg.conversation) {
                    text = quotedMsg.conversation;
                } else if (quotedMsg.extendedTextMessage && quotedMsg.extendedTextMessage.text) {
                    text = quotedMsg.extendedTextMessage.text;
                } else if (quotedMsg.imageMessage && quotedMsg.imageMessage.caption) {
                    text = quotedMsg.imageMessage.caption;
                }
            }
        }
        
        // Final check for valid text
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ Could not extract text from the message. Please try again or use direct text input.");
        }
        
        // Translate the text
        let translatedText;
        try {
            // Method 1: Using translate-google (if installed)
            const translateGoogle = require("translate-google");
            translatedText = await translateGoogle(text, { to: lang });
        } catch (translateError) {
            console.log("translate-google failed, trying alternative...");
            
            // Method 2: Using Google Translate API directly
            try {
                const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
                    params: {
                        client: 'gtx',
                        sl: 'auto',
                        tl: lang,
                        dt: 't',
                        q: text
                    }
                });
                
                if (response.data && response.data[0]) {
                    translatedText = response.data[0].map(item => item[0]).join('');
                } else {
                    throw new Error("Translation API returned no data");
                }
            } catch (apiError) {
                console.log("All translation methods failed:", apiError);
                throw new Error("Translation failed. Please try again.");
            }
        }
        
        // Format and send the translation
        let translationMessage = `🌍 *Translation:*

🔤 *Original:* ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}
🌐 *Target Language:* ${lang.toUpperCase()}
📝 *Translated:* ${translatedText.substring(0, 500)}${translatedText.length > 500 ? '...' : ''}

> ${config.FOOTER}`;
        
        // Send success reaction and message
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        await reply(translationMessage);
        
    } catch (e) {
        console.log("Translation Error:", e);
        
        // Handle specific errors
        if (e.message && (e.message.includes("unsupported language") || e.message.includes("invalid target language"))) {
            await reply("❌ Unsupported language code. Please use a valid language code (e.g., en, es, fr, si, ta, hi, ur, id)");
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            await reply(translateFailed || `❌ Translation failed: ${e.message}`);
        }
    }
});

cmd({
    pattern: "qrcode",
    alias: ["toqr", "genqr", "t2qr"],
    desc: "Generate a QR Code from text",
    category: "convert",
    react: "📸",
    use: "qrcode < Text >",
    filename: __filename
}, async (conn, mek, m, { args, reply, q, from }) => {
    if (!q) return await reply(qrCodeEnterText);

    let text = q;

    try {
        let qrImage = await QRCode.toDataURL(text);  // <-- Use 'text' variable
        let buffer = Buffer.from(qrImage.split(",")[1], "base64");

        await conn.sendMessage(from, {  
            image: buffer, 
            caption: `${qrCodeGenerated}` 
        }, { quoted: mek });
        

    } catch (error) {
        console.log(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(qrCodeFailed, "❌");
    }
});

cmd({
    pattern: "domain",
    desc: "Check domain whois information",
    category: "convert",
    react: "🌍",
    use: "domain <domain url>",
    filename: __filename
}, async (conn, mek, m, { args, from, reply }) => {
    if (!args[0]) return reply(usageMessage,);

    let domain = args[0];

    try {
        let res = await axios.get(`https://www.whoisxmlapi.com/whoisserver/WhoisService`, {
            params: {
                apiKey: config.WHOIS_API_KEY,
                domainName: domain,
                outputFormat: "json"
            }
        });

        console.log("WHOIS API RESPONSE:", JSON.stringify(res.data, null, 2));

        if (!res.data || !res.data.WhoisRecord) {
            return reply(whoisFailedMessage,);
        }

        let info = res.data.WhoisRecord;

        let created = info.createdDateNormalized || info.registryData?.createdDate || "N/A";
        let updated = info.updatedDateNormalized || info.registryData?.updatedDate || "N/A";
        let expires = info.expiresDateNormalized || info.registryData?.expiresDate || "N/A";
        let registrar = info.registrarName || "N/A";
        let whoisServer = info.whoisServer || info.registryData?.whoisServer || "N/A";
        let nameServers = info.registryData?.nameServers?.hostNames?.join(", ") || "N/A";
        let contactEmail = info.contactEmail || "Privacy Protected";

let whoisText = 
`WHOIS LOOKUP: ${domain}

➠ Created Date: ${created}
➠ Updated Date: ${updated}
➠ Expiry Date: ${expires}
➠ Registrar: ${registrar}
➠ Contact Email: ${contactEmail}
➠ Whois Server: ${whoisServer}
➠ Name Servers: ${nameServers}

${config.FOOTER}`;

        const sentMsg = await conn.sendMessage(m.chat, { text: whoisText }, { quoted: mek });
        await conn.sendMessage(m.chat, { react: { text: "✅", key: sentMsg.key } });

    } catch (error) {
        console.log(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(whoisFailedMessage);
    }
});

cmd({
    pattern: "password",
    desc: "Generate random passwords & select one",
    category: "convert",
    react: "🔐",
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {

    const length = parseInt(args[0]) || 12;
    const count = parseInt(args[1]) || 5;

    if (length < 6 || length > 50) {
        return reply(passwordLengthError, "❌");
    }

    if (count < 1 || count > 10) {
        return reply(passwordCountError, "❌");
    }

    const charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+?><:{}[]";
    
    function generatePassword(len) {
        let password = "";
        for (let i = 0; i < len; i++) {
            password += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        return password;
    }

    let passwordList = [];
    let messageText = "🔑 *Generated Passwords:*\n\n";

    for (let i = 0; i < count; i++) {
        let pass = generatePassword(length);
        passwordList.push(pass);
        messageText += `*${i + 1}️⃣*  \`${pass}\`\n`;
    }

    messageText += `\n📥 *Reply with a number (1-${count}) to select a password.*`;

    const sentMsg = await conn.sendMessage(m.chat, { text: messageText }, { quoted: mek });

    conn.ev.on("messages.upsert", async (messageUpdate) => {
        const mekInfo = messageUpdate?.messages[0];
        if (!mekInfo?.message) return;

        const messageType = mekInfo?.message?.conversation || mekInfo?.message?.extendedTextMessage?.text;
        const isReplyToSentMsg = mekInfo?.message?.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

        if (isReplyToSentMsg) {
            let selectedIndex = parseInt(messageType.trim()) - 1;

            if (selectedIndex >= 0 && selectedIndex < count) {
                await conn.sendMessage(m.chat, { text: `${passwordList[selectedIndex]}` }, { quoted: mekInfo });
            } else {
                await reply(invalidSelectionMessage,);
            }
        }
    });
});

cmd({
    pattern: "base64",
    desc: "Base64 Encode/Decode",
    category: "convert",
    react: "🛠️",
    use: "base64 encode <Text or Reply to a text message>",
    filename: __filename
}, async (conn, mek, m, { args, reply, prefix }) => {
    let action = args[0];
    let text = args.slice(1).join(" ") || m?.quoted?.msg || false;

    if (!action || !text) 
        return await reply(base64Usage, );

    let result;
    if (action.toLowerCase() === "encode") {
        result = Buffer.from(text, "utf-8").toString("base64");
    } else if (action.toLowerCase() === "decode") {
        try {
            result = Buffer.from(text, "base64").toString("utf-8");
        } catch (err) {
            return await reply(base64InvalidInput, );
        }
    } else {
        return await reply(base64InvalidAction, );
    }

    await reply(`🛠️ *Base64 ${action.toUpperCase()} Result:*\n\`${result}\``);
});




cmd({
    pattern: "fakeaddress",
    desc: "Generate a random fake address",
    category: "convert",
    react: "🏡",
    use: "fakeaddress",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        let res = await axios.get("https://randomuser.me/api/");
        let data = res.data.results[0];

        let msg = 
`FAKE ADDRESS

➠ Street: ${data.location.street.number} ${data.location.street.name}
➠ City: ${data.location.city}
➠ State: ${data.location.state}
➠ ZIP Code: ${data.location.postcode}
➠ Country: ${data.location.country}
➠ Phone: ${data.phone}

${config.FOOTER}`;

        await conn.sendMessage(m.chat, { text: msg }, { quoted: mek });

    } catch (error) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(errorMg);
    }
});


cmd({
    pattern: "url",
    react: "🔗",
    alias: ["tourl", "imgurl", "telegraph", "imgtourl", "image2url","imgbb"],
    desc: "Convert a given image to a direct URL.",
    category: "convert",
    use: "img2url <reply image>",
    filename: __filename
},
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        const isQuotedImage = quoted && quoted.type === "imageMessage";
        const isQuotedViewOnce = quoted && quoted.type === "viewOnceMessage";

        if (!isQuotedImage && !isQuotedViewOnce) {
            return reply(failMsg, "⚠️");
        }

        await Promise.all([
            m.react("⏳"),
            (async () => {

                const nameJpg = await imgId();
                const buffer = await quoted.download(nameJpg);
                const type = await fileType.fromBuffer(buffer);
                const filePath = `./temp/${nameJpg}.${type.ext}`;

                await fs.promises.writeFile(filePath, buffer);
                const result = await image2url(filePath);

                const imageUrl = result.result.url;
                await m.react("✅");
                
                await conn.sendMessage(from, {
                    text: `🔗 *Image Uploaded*\n\n✅ *Upload Successful!*\n\n🌍 *URL:*\n${imageUrl}\n\n> ${config.FOOTER || 'Prince MDX'}`
                }, { quoted: mek });

                fs.unlinkSync(filePath);
            })()
        ]);
            
} catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(errorMg);
}
})

cmd({
    pattern: "text2sticker",
    react: "🌟",
    alias: ["textsticker", "txts"],
    desc: "Convert text or mention to sticker",
    category: "convert",
    use: "text2sticker Hello world!",
    filename: __filename
},
async(conn, mek, m, { body, args, reply, q, from }) => {
    try {
        const text = q || (m.mentionedJid?.length ? `@${m.mentionedJid[0].split("@")[0]}` : null);
        if (!text) return reply("⚠️ Please provide text or mention someone.");
        
        const buffer = await textToSticker(text);
        await conn.sendMessage(from, { sticker: buffer }, { quoted: mek });
    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(errorMg);
    }
});


cmd({
    pattern: "sticker",
    react: "🖼️",
    alias: ["s", "stic"],
    desc: "Converts a replied image/video/sticker to a sticker.",
    category: "convert",
    use: "sticker <Reply to image/video/sticker>",
    filename: __filename
},
async (conn, mek, m, { reply, quoted, q, from, pushname }) => {
    try {

        const type = getContentType(m.quoted);
        const isQuotedImage = quoted && type === 'imageMessage';
        const isQuotedSticker = quoted && type === 'stickerMessage';
        const isQuotedVideo = quoted && type === 'videoMessage';

        if (isQuotedImage || isQuotedSticker || isQuotedVideo) {
            const buffer = await quoted.download();
            const cropOption = q && q.includes("--crop") ? StickerTypes.CROPPED : StickerTypes.FULL;
            const packName  = q ? q.replace("--crop", "").trim() : pushname;
            const stickerOpts = {
                pack: packName,
                author: `${botName || "ᴘʀɪɴᴄᴇ ᴛᴇᴄʜ❤️"} `,
                type: cropOption,
                categories: ["🤩", "🎉"],
                quality: 50,
                background: "transparent"
            };

            let inputBuffer = buffer;

            if (isQuotedVideo) {
                // For video: ffmpeg → animated WebP directly, then send as sticker
                // Bypasses wa-sticker-formatter (which can't take WebP as input)
                const tmpIn  = path.join(os.tmpdir(), `stk_in_${Date.now()}.mp4`);
                const tmpOut = path.join(os.tmpdir(), `stk_out_${Date.now()}.webp`);
                fs.writeFileSync(tmpIn, buffer);

                await new Promise((resolve, reject) => {
                    const proc = spawn(ffmpegBin, [
                        '-i', tmpIn,
                        '-t', '6',
                        '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black',
                        '-r', '12',
                        '-vcodec', 'libwebp_anim',
                        '-loop', '0',
                        '-compression_level', '6',
                        '-quality', '50',
                        '-preset', 'icon',
                        '-an',
                        '-y', tmpOut
                    ]);
                    proc.on('close', code => {
                        try { fs.unlinkSync(tmpIn); } catch (_) {}
                        code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`));
                    });
                    proc.on('error', err => {
                        try { fs.unlinkSync(tmpIn); } catch (_) {}
                        reject(err);
                    });
                });

                const webpBuffer = fs.readFileSync(tmpOut);
                try { fs.unlinkSync(tmpOut); } catch (_) {}
                // Add pack/author metadata via wa-sticker-formatter
                const vidSticker = new Sticker(webpBuffer, stickerOpts);
                const vidStickerBuf = await vidSticker.toBuffer();
                return await conn.sendMessage(from, { sticker: vidStickerBuf }, { quoted: mek });
            }

            const sticker = new Sticker(inputBuffer, stickerOpts);
            const stickerBuffer = await sticker.toBuffer();
            await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

        } else {
            await reply("❌ Please reply to an image, video or sticker!");
        }
            
    } catch (e) {
        console.log("Sticker Error:", e?.message || e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply("❌ Failed to create sticker.");
    }
});


cmd({
    pattern: "tgs",
    alias: ["telesticker"],
    react: "🎭",
    desc: "Import a Telegram sticker set link and send all stickers to WhatsApp",
    category: "sticker",
    use: "tgs <t.me/addstickers/StickerSetName>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, pushname, isOwners, isDev }) => {
    try {
        if (!isOwners && !isDev) return reply("❌ Only owners can use this command.");
        if (!q) return reply("📌 Provide a Telegram sticker set link.\nExample: .tgs https://t.me/addstickers/Animals");

        if (!q.includes('/addstickers/')) {
            return reply("❌ Please provide a valid Telegram sticker link.\nExample: https://t.me/addstickers/Animals\n\n_Sticker search is not available._");
        }

        const token = config.TG_BOT_TOKEN || "8107461315:AAHpymvXxCI56YwMdsBer8eehQlmWIPZP78";

        const TG = `https://api.telegram.org/bot${token}`;
        const setName = q.split('/addstickers/')[1].split(/[\s?]/)[0];

        const setRes = await axios.get(`${TG}/getStickerSet?name=${encodeURIComponent(setName)}`, { timeout: 15000 });
        const set = setRes.data?.result;
        if (!set) return reply("❌ Could not find that sticker set.");

        const staticStickers = set.stickers.filter(s => !s.is_animated && !s.is_video);
        if (!staticStickers.length) return reply("❌ This set has no static stickers (animated/video stickers are not supported).");

        const packName = set.title || pushname || "TelegramPack";
        await reply(`📦 *${packName}*\n🔢 Sending ${staticStickers.length} stickers...`);

        for (const item of staticStickers) {
            try {
                const fileRes = await axios.get(`${TG}/getFile?file_id=${item.file_id}`, { timeout: 10000 });
                const filePath = fileRes.data?.result?.file_path;
                if (!filePath) continue;

                const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
                const bufRes  = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 15000 });

                const sticker = new Sticker(Buffer.from(bufRes.data), {
                    pack: packName,
                    author: `${botName || "ᴘʀɪɴᴄᴇ ᴛᴇᴄʜ❤️"}`,
                    type: StickerTypes.FULL,
                    quality: 60,
                    background: "transparent"
                });

                const stickerBuf = await sticker.toBuffer();
                await conn.sendMessage(from, { sticker: stickerBuf }, { quoted: mek });
                await new Promise(r => setTimeout(r, 400));
            } catch (_) {}
        }

        await reply(`✅ *${packName}* — ${staticStickers.length} sticker(s) sent!`);

    } catch (e) {
        console.log("TGS Error:", e?.message || e);
        await reply("❌ Error importing sticker set.");
    }
});



cmd({
    pattern: "emomix",
    alias: ["emojimix", "emix"],
    react: "✨",
    desc: "Mix two emojis into a custom sticker",
    category: "sticker",
    use: "emomix 😹+😂",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, pushname }) => {
    try {
        if (!q) return reply("📌 Provide two emojis separated by +\nExample: .emomix 😹+😂");

        const res = await axios.get(
            `https://levanter.onrender.com/emix?q=${encodeURIComponent(q)}`,
            { timeout: 15000 }
        );

        if (!res.data?.status || !res.data?.result) {
            return reply("❌ Failed to generate emoji mix. Try a different emoji combo.");
        }

        const sticker = new Sticker(res.data.result, {
            pack: pushname || "EmojiMix",
            author: `${botName || "ᴘʀɪɴᴄᴇ ᴛᴇᴄʜ❤️"}`,
            type: StickerTypes.FULL,
            categories: ["✨", "🔥"],
            quality: 70,
            background: "transparent"
        });

        const stickerBuf = await sticker.toBuffer();
        await conn.sendMessage(from, { sticker: stickerBuf }, { quoted: mek });

    } catch (e) {
        console.log("EmoMix Error:", e?.message || e);
        await reply("❌ Error generating emoji mix.");
    }
});


cmd({
    pattern: "transcribe",
    alias: ["stt", "speech2text", "voicetotext"],
    react: "🎙️",
    desc: "Transcribe a voice/audio message to text",
    category: "tools",
    use: "transcribe <reply to audio/voice>",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = m.quoted;
        if (!quoted) return reply("📌 Reply to a voice or audio message.");

        const type = quoted.type || '';
        const isAudio =
            type === 'audioMessage' ||
            type === 'ptpMessage' ||
            quoted?.msg?.mimetype?.includes('audio') ||
            quoted?.mimetype?.includes('audio');

        if (!isAudio) return reply("❌ Please reply to a voice or audio message.");

        const buf = await quoted.download();
        if (!buf) return reply("❌ Failed to download the audio.");

        const { uploadToCatbox } = require('../lib/functions');
        const hostedUrl = await uploadToCatbox(buf, 'audio.mp3');
        if (!hostedUrl) return reply("❌ Failed to upload audio for transcription.");

        const apiUrl = `https://apiskeith.top/ai/transcribe?q=${encodeURIComponent(hostedUrl)}`;
        const { data } = await axios.get(apiUrl, { timeout: 60000 });

        const text = data?.result?.text?.trim();
        const lang = data?.result?.language || 'Unknown';
        const dur  = data?.result?.duration?.toFixed(1) || '?';

        if (!text) return reply("❌ Could not transcribe the audio.");

        await reply(
`🎙️ *Transcription*
━━━━━━━━━━━━━━━
${text}
━━━━━━━━━━━━━━━
🌐 Language: ${lang}
⏱️ Duration: ${dur}s`
        );

    } catch (e) {
        console.log("Transcribe Error:", e.message || e);
        reply("⚠️ An error occurred while transcribing.");
    }
});


cmd({
    pattern: "toimage",
    react: "🔄",
    alias: ["ti", "img"],
    desc: "Converts a replied sticker to an image.",
    category: "convert",
    use: "toimage <Reply to sticker>",
    filename: __filename
},
async (conn, mek, m, { reply, quoted, from }) => {
    try {

        const type = getContentType(m.quoted);
            
        // Check if the quoted message is a sticker
        if (!quoted ||  type !== 'stickerMessage') {
            return await reply("❌ Please reply to a sticker!");
        }

        const stickerBuffer = await quoted.download();
        
        const imageBuffer = await sharp(stickerBuffer)
            .png()
            .toBuffer();

        // Send the converted image
        await conn.sendMessage(from, { image: imageBuffer, caption: `Here is your converted image! 🖼️\n\n${config.FOOTER}` }, { quoted: mek });

    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(errorMg);
    }
});



async function toVideo(audioBuffer) {
    return new Promise((resolve, reject) => {
        const tmpDir = os.tmpdir();
        const inFile  = path.join(tmpDir, `tov_in_${Date.now()}.mp3`);
        const outFile = path.join(tmpDir, `tov_out_${Date.now()}.mp4`);

        fs.writeFileSync(inFile, audioBuffer);

        const proc = spawn(ffmpegBin, [
            '-f', 'lavfi', '-i', 'color=c=black:size=1280x720:rate=25',
            '-i', inFile,
            '-shortest',
            '-c:v', 'libx264', '-tune', 'stillimage',
            '-c:a', 'aac', '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-y', outFile
        ]);

        proc.on('close', (code) => {
            try { fs.unlinkSync(inFile); } catch (_) {}
            if (code !== 0) return reject(new Error(`ffmpeg exited with code ${code}`));
            const buf = fs.readFileSync(outFile);
            try { fs.unlinkSync(outFile); } catch (_) {}
            resolve(buf);
        });

        proc.on('error', (err) => {
            try { fs.unlinkSync(inFile); } catch (_) {}
            reject(err);
        });
    });
}

cmd({
    pattern: "tovideo",
    alias: ["tomp4", "tovid", "toblackscreen", "blackscreen"],
    react: "🎥",
    desc: "Convert a replied audio message to an MP4 video with black screen.",
    category: "convert",
    use: "tovideo <reply to audio>",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const type = getContentType(m.quoted);
        if (!m.quoted || type !== 'audioMessage') {
            return reply("❌ Please reply to an audio message.");
        }

        const audioBuf = await m.quoted.download();
        if (!audioBuf) return reply("❌ Failed to download the audio.");

        const videoBuf = await toVideo(audioBuf);

        await conn.sendMessage(from, {
            video: videoBuf,
            mimetype: "video/mp4",
            caption: `Converted Video 🎥\n\n${config.FOOTER}`
        }, { quoted: mek });

    } catch (e) {
        console.log("toVideo Error:", e.message || e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply("❌ Failed to convert audio to video.");
    }
});



cmd({
    pattern: "removebg",
    alias: ["rmbg", "bgremove", "nobg"],
    desc: "Remove background from quoted image",
    category: "convert",
    react: "🖼️",
    use: "removebg (reply to image)",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {
    try {
        // Check if user replied to a message
        if (!m.quoted) {
            return reply("📌 Reply to an image message to remove its background");
        }

        // Check the type of quoted message
        const quotedType = m.quoted.type;
        
        // Allow image and view-once messages (same as Keith's system)
        if (!['imageMessage', 'viewOnceMessageV2'].includes(quotedType)) {
            return reply("❌ Only image messages are supported");
        }

        // Show processing
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        let filePath;
        
        try {
            // Generate unique filename for temp file
            const fileName = `removebg_${Date.now()}.jpg`;
            filePath = `./temp/${fileName}`;
            
            // Create temp directory if it doesn't exist
            if (!fs.existsSync('./temp')) {
                fs.mkdirSync('./temp');
            }
            
            // Download the image directly to buffer
            const buffer = await m.quoted.download();
            
            if (!buffer || buffer.length === 0) {
                throw new Error("Could not extract image content");
            }
            
            // Save to temporary file (same as Keith's saveMediaToTemp)
            fs.writeFileSync(filePath, buffer);
            
            // Upload to get public URL - using imgbb (alternative to Uguu)
            // Keith uses uploadToUguu, we'll use image2url
            const uploadResult = await image2url(filePath);
            
            if (!uploadResult || !uploadResult.result || !uploadResult.result.url) {
                throw new Error("Failed to upload image to hosting service");
            }
            
            const imageUrl = uploadResult.result.url;
            
            // Call Keith's removebg API (exact same endpoint)
            const response = await axios.get(
                `https://apisKeith.top/ai/removebg?url=${encodeURIComponent(imageUrl)}`,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    },
                    timeout: 60000 // 60 seconds timeout
                }
            );
            
            console.log("RemoveBG API Response:", response.data); // Debug log
            
            // Check response (same as Keith's check)
            if (!response.data?.status || !response.data?.result) {
                return reply("❌ No response from RemoveBG API");
            }
            
            const cutoutUrl = response.data.result;
            
            // Send back the processed image (same as Keith)
            await conn.sendMessage(from, { 
                image: { url: cutoutUrl } 
            }, { quoted: mek });
            
            // Success reaction
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
            
        } catch (err) {
            console.error("RemoveBG error:", err);
            
            // More specific error messages
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                await reply("❌ RemoveBG service is currently unavailable. Please try again later.");
            } else if (err.message.includes("timeout")) {
                await reply("❌ Request timed out. The image might be too large or the service is busy.");
            } else if (err.message.includes("extract")) {
                await reply("❌ Could not extract image content. Please make sure you replied to a valid image.");
            } else {
                await reply("❌ Failed to remove background. Try a different image.");
            }
            
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            
        } finally {
            // Clean up temp file (same as Keith's cleanup)
            if (filePath && fs.existsSync(filePath)) {
                try { 
                    fs.unlinkSync(filePath); 
                    console.log("Cleaned up temp file:", filePath);
                } catch (cleanupErr) {
                    console.log("Failed to delete temp file:", cleanupErr);
                }
            }
        }
        
    } catch (error) {
        console.error("RemoveBG command error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply("⚠️ An unexpected error occurred. Please try again.");
    }
});


cmd({
    pattern: "cjs2esm",
    react: "⚜️",
    alias: ["c2e", "commonjstoesm", "commonjs2esm"],
    desc: "Convert cjs code to esm code",
    category: "convert",
    use: "cjs2esm <reply CJS code>",
    filename: __filename
},
async (conn, mek, m, { from, quoted, reply, quotedText }) => {
    try {
       
        if (!quotedText) return reply(`${jsCodeNeed} CJS`, "⚠️");

        const data = await fetchJson(`https://api.nekorinn.my.id/tools/cjs2esm?code=${quotedText}`);
        if (!data?.status) {
            await m.react("❌");
            return reply(jsCodeError);
        }

        // Send processed image
        await conn.sendMessage(from, {
            text: data.result
        }, { quoted: mek });


    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(errorMg);
    }
});

cmd({
    pattern: "encrypt",
    react: "🔒",
    alias: ["obfuscator", "en"],
    desc: "Encrypt a javascript code.",
    category: "convert",
    use: "encrypt <Reply to Jscode>",
    filename: __filename
},
async (conn, mek, m, { reply, quoted, from }) => {
    try {

        const forq = m.quoted.msg;
        const obfuscationResult = Obf.obfuscate(forq, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1
        });

        await reply(obfuscationResult.getObfuscatedCode());
            
    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(e?.message || "Tag a valid JavaScript code to encrypt!");
    }
});


cmd({
    pattern: "tempmail",
    alias: ["mailgen"],
    react: "📩",
    desc: "Generate temporary email address",
    category: "convert",
    use: "tempmail",
    filename: __filename
},
async (conn, mek, m, { reply, from }) => {
    try {

        const inbox = await tempmail.createInbox();
        const emailAddress = inbox.address;
        const token = inbox.token;

        await reply(`📧 Your TempMail address:\n${emailAddress}`);

        const quotedMsg = await conn.sendMessage(from, { text: token }, { quoted: mek });

        await conn.sendMessage(from, { text: `📝 Quoted message is your token.\nUse *.tempinbox ${token}* to check your inbox.` },
            { quoted: quotedMsg }
        );

    } catch (error) {
        console.error(error);
        await reply(tempMailError);
    }
});


cmd({
    pattern: "tempinbox",
    alias: ["mailinbox", "getmail"],
    react: "📬",
    desc: "Check inbox for temporary email address",
    category: "convert",
    use: "tempinbox <token or email>",
    filename: __filename
},
async (conn, mek, m, { reply, q }) => {
    try {
        if (!q) return reply("📨 To fetch messages, please provide the email address or token you received earlier.");

        const mail = encodeURIComponent(q);
        const checkMail = `https://tempmail.apinepdev.workers.dev/api/getmessage?email=${mail}`;

        const response = await fetch(checkMail);
        if (!response.ok) {
            return reply(`❌ ${response.status}` ,tempMailAPIError);
        }

        const data = await response.json();
        if (!data || !data.messages || data.messages.length === 0) {
            return reply(inboxEmptyError);
        }

        for (const message of data.messages) {
            const parsedMsg = JSON.parse(message.message);
const mailMessage = 
`TEMPMAIL MESSAGE

➠ Sender: ${message.sender}
➠ Subject: ${message.subject}
➠ Date: ${new Date(parsedMsg.date).toLocaleString()}

➠ Message:
${parsedMsg.body}`;
            await reply(mailMessage);
        }
    } catch (error) {
        console.error('❌ Error fetching temp inbox:', error);
        await reply(inboxFetchError);
    }
});


//===========================================================
function generateValidCardNumber(prefix, length) {
    let cardNumber = prefix;

    for (let i = prefix.length; i < length - 1; i++) {
        cardNumber += Math.floor(Math.random() * 10);
    }

    let sum = 0;
    let isEven = true;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    const checksum = (10 - (sum % 10)) % 10;
    return cardNumber + checksum;
}

function generateCardDetails(type) {
    let prefix, length;
    
    if (type === 'visa') {
        prefix = '4';
        length = 16;
    } else if (type === 'mastercard') {
        const prefixes = ['51', '52', '53', '54', '55'];
        prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        length = 16;
    }
    
    const cardNumber = generateValidCardNumber(prefix, length);
    const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const expiryYear = String(Math.floor(Math.random() * 7) + 24); // 2024-2030
    const cvv = Array.from({length: 3}, () => Math.floor(Math.random() * 10)).join('');
    
    return {
        number: cardNumber.replace(/(.{4})/g, '$1 ').trim(),
        expiry: `${expiryMonth}/${expiryYear}`,
        cvv: cvv
    };
}

async function fetchRandomUser() {
    try {
        const response = await axios.get('https://randomuser.me/api/', {
            timeout: 10000
        });
        
        if (response.data && response.data.results && response.data.results.length > 0) {
            const user = response.data.results[0];
            return {
                name: {
                    first: user.name.first,
                    last: user.name.last,
                    full: `${user.name.first} ${user.name.last}`
                },
                email: user.email,
                phone: user.phone,
                dob: new Date(user.dob.date).toLocaleDateString(),
                address: {
                    street: `${user.location.street.number} ${user.location.street.name}`,
                    city: user.location.city,
                    state: user.location.state,
                    country: user.location.country,
                    postcode: user.location.postcode,
                    full: `${user.location.street.number} ${user.location.street.name}, ${user.location.city}, ${user.location.state} ${user.location.postcode}, ${user.location.country}`
                },
                picture: user.picture.large
            };
        }
        return null;
    } catch (error) {
        console.log('RandomUser API error:', error.message);
        return null;
    }
}

async function fetchRandomAddress() {
    try {
        const response = await axios.get('https://fakerapi.it/api/v1/addresses?_quantity=1', {
            timeout: 10000
        });
        
        if (response.data && response.data.data && response.data.data.length > 0) {
            const addr = response.data.data[0];
            return {
                street: addr.street,
                city: addr.city,
                state: addr.county_code,
                country: addr.country,
                zipcode: addr.zipcode,
                full: `${addr.street}, ${addr.city}, ${addr.county_code} ${addr.zipcode}, ${addr.country}`
            };
        }
        return null;
    } catch (error) {
        console.log('FakerAPI address error:', error.message);
        return null;
    }
}

async function fetchRandomCompany() {
    try {
        const response = await axios.get('https://fakerapi.it/api/v1/companies?_quantity=1', {
            timeout: 10000
        });
        
        if (response.data && response.data.data && response.data.data.length > 0) {
            return response.data.data[0].name + ' Bank';
        }
        return null;
    } catch (error) {
        console.log('FakerAPI company error:', error.message);
        return null;
    }
}

cmd({
    pattern: "fakeaddress",
    alias: ["address", "faddr"],
    desc: "Generate random address from API",
    category: "convert",
    react: "🏠",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        await reply(fetchingAddressMsg);
        
        let address = await fetchRandomAddress();
        
        if (!address) {
            const user = await fetchRandomUser();
            if (user) address = user.address;
        }
        
        if (address) {
            const message = 
`RANDOM ADDRESS GENERATED

➠ Street: ${address.street}
➠ City: ${address.city}
➠ State: ${address.state}
➠ Zip Code: ${address.zipcode || address.postcode}
➠ Country: ${address.country}

➠ Full Address:
${address.full}

Real data from API for testing purposes only`;
            
            await reply(message);
        } else {
            await reply(unableToFetchAddress);
        }
    } catch (error) {
        await reply("❌ Error fetching address: " + error.message);
    }
});

cmd({
    pattern: "fakeperson",
    alias: ["person", "fperson"],
    desc: "Generate random person from API",
    category: "convert",
    react: "👤",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        await reply(fetchingPersonMsg);
        
        const user = await fetchRandomUser();
        
        if (user) {
            const message = 
`RANDOM PERSON GENERATED

➠ Name: ${user.name.full}
➠ Email: ${user.email}
➠ Phone: ${user.phone}
➠ Date of Birth: ${user.dob}

Real data from API for testing purposes only`;
            await conn.sendMessage(mek.key.remoteJid, {
                image: { url: user.picture },
                caption: message
            });
        } else {
            await reply(unableToFetchPerson);
        }
    } catch (error) {
        await reply("❌ Error fetching person: " + error.message);
    }
});

cmd({
    pattern: "fakevisa",
    alias: ["visa", "fvisa"],
    desc: "Generate fake Visa card",
    category: "convert",
    react: "💳",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        await reply(errorGeneratingVisa);
        
        const visa = generateCardDetails('visa');
        const bank = await fetchRandomCompany();
        
        if (bank) {
            const message = 
`FAKE VISA CARD GENERATED

➠ Bank: ${bank}
➠ Type: Visa
➠ Number: ${visa.number}
➠ Expiry: ${visa.expiry}
➠ CVV: ${visa.cvv}

This is a generated fake card for testing only.
Do not use for real transactions.`;
            await reply(message);
        } else {
            await reply(bankFetchError);
        }
    } catch (error) {
        await reply("❌ Error generating Visa card: " + error.message);
    }
});

cmd({
    pattern: "fakemaster",
    alias: ["mastercard", "fmaster"],
    desc: "Generate fake MasterCard",
    category: "convert",
    react: "💳",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        await reply(generatingMasterCardMsg);
        
        const mastercard = generateCardDetails('mastercard');
        const bank = await fetchRandomCompany();
        
        if (bank) {
            const message = 
`FAKE MASTERCARD GENERATED

➠ Bank: ${bank}
➠ Type: MasterCard
➠ Number: ${mastercard.number}
➠ Expiry: ${mastercard.expiry}
➠ CVV: ${mastercard.cvv}

This is a generated fake card for testing only.
Do not use for real transactions.`;
            await reply(message);
        } else {
            await reply(bankFetchError);
        }
    } catch (error) {
        await reply("❌ Error generating MasterCard: " + error.message);
    }
});


cmd({
    pattern: "fakecard",
    alias: ["card", "fcard", "ccgen"],
    desc: "Generate both Visa and MasterCard",
    category: "convert",
    react: "💳",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        await reply(generatingCardMsg);
        
        const visa = generateCardDetails('visa');
        const mastercard = generateCardDetails('mastercard');
        const bank1 = await fetchRandomCompany();
        const bank2 = await fetchRandomCompany();
        
        if (bank1 && bank2) {
            const message = 
`FAKE CREDIT CARDS GENERATED

➠ VISA CARD
• Bank: ${bank1}
• Number: ${visa.number}
• Expiry: ${visa.expiry} | CVV: ${visa.cvv}

➠ MASTERCARD
• Bank: ${bank2}
• Number: ${mastercard.number}
• Expiry: ${mastercard.expiry} | CVV: ${mastercard.cvv}

Generated fake cards for testing only.
Do not use for actual transactions.
All numbers pass Luhn validation.`;
            await reply(message);
        } else {
            await reply(bankFetchError);
        }
    } catch (error) {
        await reply("❌ Error generating cards: " + error.message);
    }
});

//============================ CREATE PDF ============================
const { image2url: uploadToImgBB } = require('@dark-yasiya/imgbb.js');

cmd({
    pattern: "pdf",
    react: "📄",
    alias: ["topdf", "makepdf", "createpdf"],
    desc: "Create a PDF from text or image",
    category: "convert",
    use: ".pdf <name> <text> or reply to message/image",
    filename: __filename
},
async (conn, mek, m, { from, args, q, quoted, reply }) => {
    const input = q?.trim() || "";
    const parts = input.split(/\s+/);
    const pdfName = parts[0] || "";
    const restContent = parts.slice(1).join(" ");

    let content = restContent;

    if (!content && quoted) {
        const mtype = quoted.mtype || quoted.type || Object.keys(quoted.message || {})[0] || "";
        const isImage = mtype.includes("image") || quoted.mimetype?.includes("image");
        
        if (isImage) {
            try {
                const buffer = await quoted.download();
                const tempPath = `./temp/pdf_img_${Date.now()}.jpg`;
                await fs.promises.writeFile(tempPath, buffer);
                const upload = await uploadToImgBB(tempPath);
                await fs.promises.unlink(tempPath).catch(() => {});
                if (upload && upload.result && upload.result.url) {
                    const imageUrl = upload.result.url;
                    const caption = quoted.text || quoted.caption || m.quoted?.text || "";
                    content = caption ? `${caption}\n\n${imageUrl}` : imageUrl;
                } else {
                    throw new Error("Invalid upload response");
                }
            } catch (e) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("Failed to process the quoted image: " + e.message);
            }
        } else {
            content = quoted.text || quoted.conversation || quoted.caption || m.quoted?.text || "";
        }
    }
    
    // Ensure content is a string
    if (content && typeof content !== 'string') {
        content = "";
    }

    if (!pdfName) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("Please provide a PDF name and content\n\n*Usage:*\n.pdf <name> <text>\n.pdf <name> <image_url>\n.pdf <name> (quote a message/image)");
    }

    if (!content) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("Please provide content for the PDF\n\n*Usage:*\n.pdf <name> <text>\n.pdf <name> <image_url>\n.pdf <name> (quote a message/image)");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    try {
        const res = await axios.get(`https://api.princetechn.com/api/tools/topdf`, {
            params: { apikey: "prince", query: content },
            responseType: "arraybuffer"
        });

        const fileName = pdfName.endsWith(".pdf") ? pdfName : `${pdfName}.pdf`;

        await conn.sendMessage(from, {
            document: Buffer.from(res.data),
            mimetype: "application/pdf",
            fileName: fileName,
            caption: `📄 *${fileName}*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
        console.error("Create PDF error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("Failed to create PDF: " + e.message);
    }
});
