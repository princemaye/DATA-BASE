const { cmd, commands } = require("../command");
const config = require('../config');
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "getcmd",
    alias: ["getcode", "cmdcode", "viewcmd"],
    desc: "Get the source code of a command (Dev only)",
    category: "dev",
    use: ".getcmd <command_name>",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isDev }) => {
    if (!isDev) {
      return reply("❌ This command is for developers only!");
    }

    const cmdName = args[0]?.toLowerCase();

    if (!cmdName) {
      return reply(
        "❌ Please provide a command name!\n\nUsage: .getcmd <command_name>\nExample: .getcmd menu",
      );
    }

    const foundCmd = commands.find((c) => {
      if (c.pattern?.toLowerCase() === cmdName) return true;
      if (c.alias && Array.isArray(c.alias)) {
        return c.alias.some((a) => a.toLowerCase() === cmdName);
      }
      return false;
    });

    if (!foundCmd) {
      return reply(
        `❌ Command "${cmdName}" not found!\n\nMake sure the command exists.`,
      );
    }

    const filePath = foundCmd.filename;

    if (!filePath || filePath === "Not Provided") {
      return reply(`❌ Source file path not available for "${cmdName}"`);
    }

    if (!fs.existsSync(filePath)) {
      return reply(`❌ Source file not found: ${filePath}`);
    }

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const cmdCode = extractFullCommand(fileContent, foundCmd.pattern);

      if (!cmdCode) {
        return reply(`❌ Could not extract code for "${cmdName}" from file.`);
      }

      await sendCodeInChunks(conn, from, mek, cmdName, cmdCode, filePath);
    } catch (e) {
      console.error("getcmd error:", e);
      reply(`❌ Error reading command: ${e.message}`);
    }
  },
);

function extractFullCommand(fileContent, pattern) {
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patternRegex = new RegExp(
    `pattern:\\s*["'\`]${escapedPattern}["'\`]`,
    "i",
  );
  const match = fileContent.match(patternRegex);

  if (!match) return null;

  const patternIndex = match.index;

  let cmdStartIndex = patternIndex;
  for (let i = patternIndex; i >= 0; i--) {
    const slice = fileContent.substring(i, i + 4);
    if (slice === "cmd(" || slice === "cmd ") {
      cmdStartIndex = i;
      break;
    }
  }

  let parenCount = 0;
  let endIndex = cmdStartIndex;
  let started = false;

  for (let i = cmdStartIndex; i < fileContent.length; i++) {
    const char = fileContent[i];

    if (char === "(") {
      parenCount++;
      started = true;
    } else if (char === ")") {
      parenCount--;
      if (started && parenCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  let cmdCode = fileContent.substring(cmdStartIndex, endIndex);

  const nextChars = fileContent.substring(endIndex, endIndex + 5).trim();
  if (nextChars.startsWith(";")) {
    cmdCode += ";";
  }

  return cmdCode.trim();
}

async function sendCodeInChunks(conn, from, mek, cmdName, code, filePath) {
  const fileName = path.basename(filePath);
  const header = `╭━━━━━━━━━━━━━━━╮
│ 🔧 *CMD: ${cmdName}*
│ 📁 File: ${fileName}
│ 📊 Size: ${code.length} chars
╰━━━━━━━━━━━━━━━╯\n\n`;

  const maxLength = 4000;

  if (header.length + code.length + 20 <= maxLength) {
    await conn.sendMessage(from, {
        text: header + "```javascript\n" + code + "\n```",
      },
      { quoted: mek },
    );
  } else {
    const chunks = [];
    for (let i = 0; i < code.length; i += maxLength) {
      chunks.push(code.substring(i, i + maxLength));
    }

    await conn.sendMessage(from, {
        text: header + `📄 Sending in ${chunks.length} parts...`,
      },
      { quoted: mek },
    );

    for (let i = 0; i < chunks.length; i++) {
      await conn.sendMessage(from, {
        text: `📄 *Part ${i + 1}/${chunks.length}*\n\n\`\`\`javascript\n${chunks[i]}\n\`\`\``,
      });
    }
  }
}

cmd(
  {
    pattern: "listcmds",
    alias: ["allcmds", "cmdlist"],
    desc: "List all commands with their files (Dev only)",
    category: "dev",
    use: ".listcmds [category]",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply, isDev }) => {
    if (!isDev) {
      return reply("❌ This command is for developers only!");
    }

    const category = args[0]?.toLowerCase();

    let filteredCmds = commands;
    if (category) {
      filteredCmds = commands.filter(
        (c) => c.category?.toLowerCase() === category,
      );
    }

    if (filteredCmds.length === 0) {
      return reply(
        category
          ? `❌ No commands found in category "${category}"`
          : "❌ No commands found",
      );
    }

    const categories = {};
    filteredCmds.forEach((c) => {
      const cat = c.category || "misc";
      if (!categories[cat]) categories[cat] = [];
      const fileName = c.filename ? path.basename(c.filename) : "unknown";
      categories[cat].push(`${c.pattern} (${fileName})`);
    });

    let text = `╭━━━━━━━━━━━━━━━╮
│ 🔧 *DEV CMD LIST*
│ 📊 Total: ${filteredCmds.length} commands
╰━━━━━━━━━━━━━━━╯\n\n`;

    for (const [cat, cmds] of Object.entries(categories)) {
      text += `*📁 ${cat.toUpperCase()}*\n`;
      cmds.slice(0, 30).forEach((c) => {
        text += `  • ${c}\n`;
      });
      if (cmds.length > 30) {
        text += `  ... and ${cmds.length - 30} more\n`;
      }
      text += "\n";
    }

    await conn.sendMessage(from, { text }, { quoted: mek });
  },
);

module.exports = {};
