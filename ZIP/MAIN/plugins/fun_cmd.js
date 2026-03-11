// ============================= R E Q U E S T =============================
const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('prince-baileys');
const { generateTweetImage, formatDate, fmtCount } = require('../lib/tweet-generator');

// ============================= L A N G U A G E =============================
var allLangs = require("../lib/language.json");
var LANG = config.LANG === 'EN' ? 'EN' 
         : config.LANG === 'FR' ? 'FR' 
         : 'EN';

var lang = allLangs[LANG];
var { errorMg } = lang;

// ============================= API CONFIG =============================
const apiurl = 'https://api.princetechn.com/api';
const apikey = 'prince';

// ============================= C M D =============================

// New Year Quotes
cmd({
    pattern: "newyear",
    desc: "Fetch New Year Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/newyear?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Christmas Quotes
cmd({
    pattern: "christmas",
    desc: "Fetch Christmas Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/christmas?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Valentine Quotes
cmd({
    pattern: "valentine",
    alias: ["valentines", "valentinesday"],
    desc: "Fetch Valentines Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/valentines?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Girlfriend's Day Quotes
cmd({
    pattern: "gfsday",
    desc: "Fetch GirlFriends Day Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/girlfriendsday?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Boyfriend's Day Quotes
cmd({
    pattern: "bfsday",
    desc: "Fetch BouFriends Day Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/boyfriendsday?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Pickup Lines
cmd({
    pattern: "pickup",
    alias: ["pickupline", "pickuplines", "lines"],
    desc: "Fetch Pickup Lines.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/pickupline?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No pickup line found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Father's Day Quotes
cmd({
    pattern: "fathersday",
    desc: "Fetch Fathers Day Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/fathersday?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Mother's Day Quotes
cmd({
    pattern: "mothersday",
    desc: "Fetch Mothers Day Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/mothersday?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Heartbreak Quotes
cmd({
    pattern: "heartbreak",
    desc: "Fetch Heartbreak Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/heartbreak?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Jokes (API Version)
cmd({
    pattern: "jokes",
    alias: ["jokeapi"],
    desc: "Fetch Jokes with setup and punchline.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/jokes?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result && data.result.setup && data.result.punchline) {
            await reply(`Set Up: ${data.result.setup}\nPunchline: ${data.result.punchline}`);
        } else {
            await reply("❌ No joke found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Halloween Quotes
cmd({
    pattern: "halloween",
    desc: "Fetch Halloween Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/halloween?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Motivation Quotes
cmd({
    pattern: "motivation",
    desc: "Fetch Motivational Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/motivation?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Love Quotes (API)
cmd({
    pattern: "lovequotes",
    alias: ["lovequote"],
    desc: "Fetch Love Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/love?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Gratitude Quotes
cmd({
    pattern: "gratitude",
    desc: "Fetch Gratitude Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/gratitude?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Thank You Quotes
cmd({
    pattern: "thankyou",
    desc: "Fetch ThankYou Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/thankyou?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Shayari Quotes
cmd({
    pattern: "shayari",
    desc: "Fetch Shayari Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/shayari?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Goodnight Quotes
cmd({
    pattern: "goodnight",
    desc: "Fetch Goodnight Quotes/Wishes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/goodnight?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Truth Quotes
cmd({
    pattern: "truth",
    desc: "Fetch Truth Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/truth?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Advice Quotes
cmd({
    pattern: "advice",
    desc: "Fetch Advice Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/advice?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Flirt Messages
cmd({
    pattern: "flirt",
    desc: "Fetch Flirty Messages.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/flirt?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// General Quotes (API)
cmd({
    pattern: "quotes",
    alias: ["quoteapi"],
    desc: "Fetch General Quotes.",
    category: "fun",
    react: "👓",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get(`${apiurl}/fun/quotes?apikey=${apikey}`);
        const data = response.data;
        if (data && data.result) {
            await reply(data.result);
        } else {
            await reply("❌ No quote found!");
        }
    } catch (e) {
        console.log(e); 
        reply(`Error: ${e.message}`);
    }
});

// Cat Images
cmd({
    pattern: "cat",
    desc: "Fetch Random Cat Images.",
    category: "search",
    react: "😼",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://api.thecatapi.com/v1/images/search');
        const data = response.data;
        const imageUrl = data && data[0] && data[0].url;
        
        if (!imageUrl) {
            return reply("❌ Error: No cat image found!");
        }
        
        await conn.sendMessage(from, { 
            image: { url: imageUrl },
            caption: config.FOOTER || "🐱 Random Cat"
        }, { quoted: mek });
        
    } catch (e) {
        console.error("Cat command error:", e); 
        reply(`Error fetching cat image: ${e.message}`);
    }
});

// Dog Images
cmd({
    pattern: "dog",
    desc: "Fetch Random Dog Images.",
    category: "search",
    react: "🐶",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://dog.ceo/api/breeds/image/random');
        const imageUrl = response.data && response.data.message;
        
        if (!imageUrl) {
            return reply("❌ Error: No dog image found!");
        }
        
        await conn.sendMessage(from, { 
            image: { url: imageUrl },
            caption: config.FOOTER || "🐶 Random Dog"
        }, { quoted: mek });
        
    } catch (e) {
        console.error("Dog command error:", e); 
        reply(`Error fetching dog image: ${e.message}`);
    }
});

// Fun Fact (API)
cmd({
    pattern: "funfact",
    alias: ["factapi"],
    desc: "Get a Random fun Fact from API",
    react: "🧠",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data && response.data.text;
        
        if (!fact) {
            return reply("❌ Error: No fun fact found!");
        }
        
        const funFact = `
🧠 *Random Fun Fact* 🧠

${fact}

Isn't that interesting? 🤔
`;
        reply(funFact);
    } catch (e) {
        console.error(e);
        reply("⚠️ An error occurred while fetching fun fact. Please try again later.");
    }
});

// Hack Prank
cmd({
    pattern: "hack",
    desc: "Hacking Prank lol.",
    category: "fun",
    react: "💻",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const steps = [
            "Injecting Malware",
            " █ 10%",
            " █ █ 20%",
            " █ █ █ 30%",
            " █ █ █ █ 40%",
            " █ █ █ █ █ 50%",
            " █ █ █ █ █ █ 60%",
            " █ █ █ █ █ █ █ 70%",
            " █ █ █ █ █ █ █ █ 80%",
            " █ █ █ █ █ █ █ █ █ 90%",
            " █ █ █ █ █ █ █ █ █ █ 100%",
            "System hyjacking on process.. \n Conecting to Server error to find 404",
            "Device successfully connected... \n Receiving data...",
            "Data hyjacked from device 100% completed \n killing all evidence killing all malwares...",
            " HACKING COMPLETED",
            " SENDING LOG DOCUMENTS...",
            " SUCCESSFULLY SENT DATA AND Connection disconnected",
            "BACKLOGS CLEARED"
        ];

        for (const line of steps) {
            await conn.sendMessage(from, { text: line }, { quoted: mek });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ============================= FAKE TWEET =============================

function _ftRandN(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _ftHandle(name) {
    const h = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .substring(0, 15);
    return h || 'user' + _ftRandN(100, 9999);
}

cmd(
    {
        pattern: "ftweek",
        alias: ["faketweet", "faketw"],
        desc: "Generate a fake X (Twitter) tweet card matching zeoob.com's dark theme. Send with a photo to include it in the tweet.",
        category: "fun",
        use: ".ftweek <tweet text>",
        react: "🐦",
        filename: __filename,
    },
    async (conn, mek, m, { reply, from, sender, pushname, q }) => {
        try {
            if (!q) return await reply(
                "❌ Please provide the tweet text!\n\n" +
                "Example: *.ftweek Just launched my new project! 🚀*\n\n" +
                "_Tip: Send with an image attached (or reply to an image) to add a photo to the tweet._"
            );

            await reply("🐦 _Generating fake tweet..._");

            const name    = pushname || 'User';
            const handle  = _ftHandle(name);
            const date    = formatDate();
            const reposts = fmtCount(_ftRandN(1000, 99000));
            const likes   = fmtCount(_ftRandN(5000, 250000));

            // ── Fetch profile picture ──────────────────────────────────────
            let avatarBuffer = null;
            try {
                const ppUrl = await Promise.race([
                    conn.profilePictureUrl(sender, 'image').catch(() => null),
                    new Promise(r => setTimeout(() => r(null), 6000)),
                ]);
                if (ppUrl) {
                    const ppRes = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 8000 });
                    avatarBuffer = Buffer.from(ppRes.data);
                }
            } catch {}

            // ── Detect tweet photo (current message image OR quoted image) ─
            let postImageBuffer = null;
            try {
                const curType = mek.message
                    ? Object.keys(mek.message).find(k => k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage')
                    : null;

                if (curType === 'imageMessage') {
                    // User sent ".ftweek text" as an image caption
                    postImageBuffer = await downloadMediaMessage(mek, 'buffer', {});
                } else if (m.quoted && m.quoted.type === 'imageMessage') {
                    // User replied to an image with ".ftweek text"
                    postImageBuffer = await m.quoted.download();
                }
            } catch {}

            // ── Render ─────────────────────────────────────────────────────
            const imgBuf = await generateTweetImage({
                name,
                handle,
                avatarBuffer,
                text            : q,
                date,
                reposts,
                likes,
                device          : 'Twitter for Android',
                postImageBuffer,
            });

            await conn.sendMessage(from, {
                image   : imgBuf,
                caption : `🐦 *Fake Tweet Generated!*\n\n> _${q}_\n\n${config.FOOTER}`,
                mentions: [sender],
            }, { quoted: mek });

        } catch (err) {
            console.log('FTWEEK Error:', err);
            await reply('❌ Failed to generate tweet. Please try again.');
        }
    },
);
