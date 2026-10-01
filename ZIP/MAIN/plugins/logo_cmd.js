import { fileURLToPath as __fileURLToPath } from "node:url";
const __filename = __fileURLToPath(import.meta.url);
import __import0 from "../config.js";
import __import1 from "axios";
import __import2 from "../command.js";
const config = __import0;
const axios = __import1;
const { cmd } = __import2;

const API_KEY = 'prince';
const API_BASE = 'https://api.princetechn.com/api/ephoto360';

const fetchLogo = async (effect, text) => {
  try {
    const response = await axios.get(`${API_BASE}/${effect}`, {
      params: { apikey: API_KEY, text },
      timeout: 30000
    });
    
    if (response.data?.success && response.data?.result?.image_url) {
      return response.data.result.image_url;
    }
    return null;
  } catch (error) {
    console.error(`Logo ${effect} error:`, error.message);
    return null;
  }
};

const sendLogo = async (conn, from, mek, effect, text, emoji, effectName) => {
  const imageUrl = await fetchLogo(effect, text);
  
  if (imageUrl) {
    try {
      const imgResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      await conn.sendMessage(from, {
        image: Buffer.from(imgResponse.data),
        caption: `${emoji} *${effectName}*\n\n${config.FOOTER}`
      }, { quoted: mek });
      return true;
    } catch (e) {
      await conn.sendMessage(from, {
        image: { url: imageUrl },
        caption: `${emoji} *${effectName}*\n\n${config.FOOTER}`
      }, { quoted: mek });
      return true;
    }
  }
  return false;
};

cmd({
  pattern: "glossysilver",
  alias: ["glossy", "silverlogo"],
  desc: "Generate Glossy Silver text logo",
  category: "logo",
  use: ".glossysilver <text>",
  react: "🪞",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .glossysilver Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "glossysilver", q, "🪞", "Glossy Silver Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "galaxy",
  alias: ["galaxylogo", "space"],
  desc: "Generate Galaxy text logo",
  category: "logo",
  use: ".galaxy <text>",
  react: "🌌",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .galaxy Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "galaxy", q, "🌌", "Galaxy Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "galaxystyle",
  alias: ["galaxytext", "galaxytree"],
  desc: "Generate Galaxy Style text logo",
  category: "logo",
  use: ".galaxystyle <text>",
  react: "✨",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .galaxystyle Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "galaxystyle", q, "✨", "Galaxy Style Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "1917",
  alias: ["sunset", "1917style"],
  desc: "Generate 1917 Sunset Style logo",
  category: "logo",
  use: ".1917 <text>",
  react: "🌅",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .1917 Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "1917", q, "🌅", "1917 Sunset Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "lighteffect",
  alias: ["light", "lightlogo"],
  desc: "Generate Light Effect text logo",
  category: "logo",
  use: ".lighteffect <text>",
  react: "💡",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .lighteffect Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "lighteffect", q, "💡", "Light Effect Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "texteffect",
  alias: ["textstyle", "textart"],
  desc: "Generate Text Effect logo",
  category: "logo",
  use: ".texteffect <text>",
  react: "🖋️",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .texteffect Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "texteffect", q, "🖋️", "Text Effect Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "glowingtext",
  alias: ["glow", "glowlogo"],
  desc: "Generate Glowing Text logo",
  category: "logo",
  use: ".glowingtext <text>",
  react: "🔆",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .glowingtext Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "glowingtext", q, "🔆", "Glowing Text Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "blackpinklogo",
  alias: ["blackpink", "bplogo"],
  desc: "Generate BlackPink Style logo",
  category: "logo",
  use: ".blackpinklogo <text>",
  react: "🖤",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .blackpinklogo Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "blackpinklogo", q, "🖤", "BlackPink Style Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "glitchtext",
  alias: ["glitch", "glitchlogo"],
  desc: "Generate Glitch Text logo",
  category: "logo",
  use: ".glitchtext <text>",
  react: "📺",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .glitchtext Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "glitchtext", q, "📺", "Glitch Text Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "gradienttext",
  alias: ["gradient", "gradientlogo"],
  desc: "Generate Gradient Text logo",
  category: "logo",
  use: ".gradienttext <text>",
  react: "🌈",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .gradienttext Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "gradienttext", q, "🌈", "Gradient Text Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "logomaker",
  alias: ["makelogo", "createlogo"],
  desc: "Generate Logo Maker style",
  category: "logo",
  use: ".logomaker <text>",
  react: "🎨",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .logomaker Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "logomaker", q, "🎨", "Logo Maker");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "advancedglow",
  alias: ["advglow", "superglow"],
  desc: "Generate Advanced Glow logo",
  category: "logo",
  use: ".advancedglow <text>",
  react: "✨",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .advancedglow Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "advancedglow", q, "✨", "Advanced Glow Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "writetext",
  alias: ["write", "writestyle"],
  desc: "Generate Write Text logo",
  category: "logo",
  use: ".writetext <text>",
  react: "✍️",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .writetext Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "writetext", q, "✍️", "Write Text Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "luxurygold",
  alias: ["luxury", "goldluxury"],
  desc: "Generate Luxury Gold logo",
  category: "logo",
  use: ".luxurygold <text>",
  react: "👑",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .luxurygold Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "luxurygold", q, "👑", "Luxury Gold Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "underwater",
  alias: ["water", "ocean"],
  desc: "Generate Underwater text logo",
  category: "logo",
  use: ".underwater <text>",
  react: "🌊",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("*Please provide text to create logo*\n\nExample: .underwater Prince Tech");
  
  const success = await sendLogo(conn, from, mek, "underwater", q, "🌊", "Underwater Logo");
  if (!success) reply("*Unable to generate logo. Please try again.*");
});

cmd({
  pattern: "logomenu",
  alias: ["logolist", "logos"],
  desc: "Show all available logo commands",
  category: "logo",
  react: "🎨",
  filename: __filename
}, async (conn, mek, m, { from }) => {
  const prefix = config.PREFIX || ".";
  
  const menuText = `╭━━━━━━━━━━━━━━━╮
│ 🎨 *LOGO COMMANDS*
├━━━━━━━━━━━━━━━┤
│
│ 🪞 ${prefix}glossysilver <text>
│ 🌌 ${prefix}galaxy <text>
│ ✨ ${prefix}galaxystyle <text>
│ 🌅 ${prefix}1917 <text>
│ 💡 ${prefix}lighteffect <text>
│ 🖋️ ${prefix}texteffect <text>
│ 🔆 ${prefix}glowingtext <text>
│ 🖤 ${prefix}blackpinklogo <text>
│ 📺 ${prefix}glitchtext <text>
│ 🌈 ${prefix}gradienttext <text>
│ 🎨 ${prefix}logomaker <text>
│ ✨ ${prefix}advancedglow <text>
│ ✍️ ${prefix}writetext <text>
│ 👑 ${prefix}luxurygold <text>
│ 🌊 ${prefix}underwater <text>
│
├━━━━━━━━━━━━━━━┤
│ 📝 *Usage:* ${prefix}galaxy Prince
╰━━━━━━━━━━━━━━━╯

${config.FOOTER}`;

  await conn.sendMessage(from, { text: menuText }, { quoted: mek });
});

export default { fetchLogo, sendLogo };
