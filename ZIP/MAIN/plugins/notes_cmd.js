const { cmd } = require("../command");
const config = require('../config');
const DBM = require("../lib/user-db");
const dbData = require("../lib/config");

const ymd_db = new DBM(dbData.TOKEN, dbData.USER_NAME, dbData.REPO_NAME);
const tableName = dbData.tableName;

const ownerOnlyMsg = "❌ This command is for bot owners only!";

async function getUserNotes(sender) {
  const userId = sender.split("@")[0];
  const allNotes = (await ymd_db.get(tableName, "USER_NOTES")) || {};
  return allNotes[userId] || [];
}

async function setUserNotes(sender, userNotes) {
  const userId = sender.split("@")[0];
  let allNotes = (await ymd_db.get(tableName, "USER_NOTES")) || {};
  allNotes[userId] = userNotes;
  await ymd_db.input(tableName, "USER_NOTES", allNotes);
  return true;
}

function getQuotedText(m) {
  if (!m.quoted) return null;
  const quoted = m.quoted;

  if (quoted.text) return quoted.text;
  if (typeof quoted.msg === "string") return quoted.msg;
  if (quoted.conversation) return quoted.conversation;
  if (quoted.caption) return quoted.caption;
  if (quoted.extendedTextMessage?.text) return quoted.extendedTextMessage.text;
  if (quoted.imageMessage?.caption) return quoted.imageMessage.caption;
  if (quoted.videoMessage?.caption) return quoted.videoMessage.caption;
  if (quoted.msg?.conversation) return quoted.msg.conversation;
  if (quoted.msg?.extendedTextMessage?.text)
    return quoted.msg.extendedTextMessage.text;
  if (quoted.msg?.imageMessage?.caption) return quoted.msg.imageMessage.caption;
  if (quoted.msg?.videoMessage?.caption) return quoted.msg.videoMessage.caption;

  return null;
}

cmd(
  {
    pattern: "addnote",
    alias: ["newnote", "makenote", "savenote"],
    desc: "Add a new note (reply to a message or type text)",
    category: "owner",
    use: ".addnote <text> or reply to a message",
    filename: __filename,
  },
  async (conn, mek, m, { from, sender, args, reply, isOwners }) => {
    if (!isOwners) return reply(ownerOnlyMsg);
    
    try {
      let noteText = args.join(" ").trim();

      if (!noteText && m.quoted) {
        noteText = getQuotedText(m);
      }

      if (!noteText) {
        return reply(
          "❌ Please provide note text or reply to a message!\n\nUsage: .addnote <text>\nOr reply to a message with .addnote",
        );
      }

      const userNotes = await getUserNotes(sender);
      const noteId = userNotes.length + 1;

      userNotes.push({
        id: noteId,
        text: noteText,
        createdAt: new Date().toISOString(),
      });

      await setUserNotes(sender, userNotes);

      await conn.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━╮
│ 📝 *NOTE SAVED*
├━━━━━━━━━━━━━━━┤
│ 🔢 Note #${noteId}
│ 📄 ${noteText.substring(0, 50)}${noteText.length > 50 ? "..." : ""}
│
│ ✅ Saved to database!
╰━━━━━━━━━━━━━━━╯`,
        },
        { quoted: mek },
      );
    } catch (e) {
      console.error("addnote error:", e);
      reply("❌ Failed to save note. Please try again.");
    }
  },
);

cmd(
  {
    pattern: "getnote",
    alias: ["listnote", "viewnote", "shownote"],
    desc: "Get a specific note by number",
    category: "owner",
    use: ".getnote <number>",
    filename: __filename,
  },
  async (conn, mek, m, { from, sender, args, reply, isOwners }) => {
    if (!isOwners) return reply(ownerOnlyMsg);
    
    try {
      const noteNum = parseInt(args[0]);

      if (!noteNum || isNaN(noteNum)) {
        return reply(
          "❌ Please provide a note number!\n\nUsage: .getnote <number>",
        );
      }

      const userNotes = await getUserNotes(sender);
      const note = userNotes.find((n) => n.id === noteNum);

      if (!note) {
        return reply(
          `❌ Note #${noteNum} not found!\n\nUse .getnotes to see all your notes.`,
        );
      }

      const createdDate = new Date(note.createdAt).toLocaleDateString();

      await conn.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━╮
│ 📝 *NOTE #${note.id}*
├━━━━━━━━━━━━━━━┤
│
│ ${note.text}
│
├━━━━━━━━━━━━━━━┤
│ 📅 Created: ${createdDate}
╰━━━━━━━━━━━━━━━╯`,
        },
        { quoted: mek },
      );
    } catch (e) {
      console.error("getnote error:", e);
      reply("❌ Failed to get note. Please try again.");
    }
  },
);

cmd(
  {
    pattern: "getnotes",
    alias: ["getallnotes", "listnotes", "mynotes", "allnotes"],
    desc: "Get all your notes",
    category: "owner",
    filename: __filename,
  },
  async (conn, mek, m, { from, sender, reply, isOwners }) => {
    if (!isOwners) return reply(ownerOnlyMsg);
    
    try {
      const userNotes = await getUserNotes(sender);

      if (userNotes.length === 0) {
        return reply(
          "📝 You don't have any notes yet!\n\nUse .addnote <text> to create one.",
        );
      }

      let notesList = "";
      userNotes.forEach((note) => {
        const preview = note.text.substring(0, 40);
        notesList += `│ ${note.id}. ${preview}${note.text.length > 40 ? "..." : ""}\n`;
      });

      await conn.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━╮
│ 📝 *YOUR NOTES* (${userNotes.length})
├━━━━━━━━━━━━━━━┤
${notesList}├━━━━━━━━━━━━━━━┤
│ 📖 .getnote <num> - View full
│ ✏️ .updatenote <num> <text>
│ 🗑️ .delnote <num> - Delete
╰━━━━━━━━━━━━━━━╯`,
        },
        { quoted: mek },
      );
    } catch (e) {
      console.error("getnotes error:", e);
      reply("❌ Failed to get notes. Please try again.");
    }
  },
);

cmd(
  {
    pattern: "updatenote",
    alias: ["editnote", "changenote", "update"],
    desc: "Update a note (reply to a message or type text)",
    category: "owner",
    use: ".updatenote <number> <new text> or reply with .update <number>",
    filename: __filename,
  },
  async (conn, mek, m, { from, sender, args, reply, isOwners }) => {
    if (!isOwners) return reply(ownerOnlyMsg);
    
    try {
      const noteNum = parseInt(args[0]);
      let newText = args.slice(1).join(" ").trim();

      if (!noteNum || isNaN(noteNum)) {
        return reply(
          "❌ Please provide a note number!\n\nUsage: .updatenote <number> <new text>\nOr reply to a message with .update <number>",
        );
      }

      if (!newText && m.quoted) {
        newText = getQuotedText(m);
      }

      if (!newText) {
        return reply(
          "❌ Please provide the new text or reply to a message!\n\nUsage: .updatenote <number> <new text>\nOr reply to a message with .update <number>",
        );
      }

      const userNotes = await getUserNotes(sender);
      const noteIndex = userNotes.findIndex((n) => n.id === noteNum);

      if (noteIndex === -1) {
        return reply(`❌ Note #${noteNum} not found!`);
      }

      const oldText = userNotes[noteIndex].text;
      userNotes[noteIndex].text = newText;
      userNotes[noteIndex].updatedAt = new Date().toISOString();

      await setUserNotes(sender, userNotes);

      await conn.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━╮
│ ✏️ *NOTE UPDATED*
├━━━━━━━━━━━━━━━┤
│ 🔢 Note #${noteNum}
│
│ 📝 Old: ${oldText.substring(0, 30)}...
│ 📝 New: ${newText.substring(0, 30)}...
│
│ ✅ Updated in database!
╰━━━━━━━━━━━━━━━╯`,
        },
        { quoted: mek },
      );
    } catch (e) {
      console.error("updatenote error:", e);
      reply("❌ Failed to update note. Please try again.");
    }
  },
);

cmd(
  {
    pattern: "delnote",
    alias: ["deletenote", "removenote", "rmnote"],
    desc: "Delete a specific note",
    category: "owner",
    use: ".delnote <number>",
    filename: __filename,
  },
  async (conn, mek, m, { from, sender, args, reply, isOwners }) => {
    if (!isOwners) return reply(ownerOnlyMsg);
    
    try {
      const noteNum = parseInt(args[0]);

      if (!noteNum || isNaN(noteNum)) {
        return reply(
          "❌ Please provide a note number!\n\nUsage: .delnote <number>",
        );
      }

      const userNotes = await getUserNotes(sender);
      const noteIndex = userNotes.findIndex((n) => n.id === noteNum);

      if (noteIndex === -1) {
        return reply(`❌ Note #${noteNum} not found!`);
      }

      const deletedNote = userNotes[noteIndex];
      userNotes.splice(noteIndex, 1);

      await setUserNotes(sender, userNotes);

      await conn.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━╮
│ 🗑️ *NOTE DELETED*
├━━━━━━━━━━━━━━━┤
│ 🔢 Note #${noteNum}
│ 📄 ${deletedNote.text.substring(0, 30)}...
│
│ ✅ Deleted from database!
│ 📝 Remaining: ${userNotes.length} notes
╰━━━━━━━━━━━━━━━╯`,
        },
        { quoted: mek },
      );
    } catch (e) {
      console.error("delnote error:", e);
      reply("❌ Failed to delete note. Please try again.");
    }
  },
);

cmd(
  {
    pattern: "delallnotes",
    alias: ["removeallnotes", "deleteallnotes", "clearnotes"],
    desc: "Delete all your notes",
    category: "owner",
    filename: __filename,
  },
  async (conn, mek, m, { from, sender, reply, isOwners }) => {
    if (!isOwners) return reply(ownerOnlyMsg);
    
    try {
      const userNotes = await getUserNotes(sender);

      if (userNotes.length === 0) {
        return reply("📝 You don't have any notes to delete!");
      }

      const count = userNotes.length;

      await setUserNotes(sender, []);

      await conn.sendMessage(from, {
          text: `╭━━━━━━━━━━━━━━━╮
│ 🗑️ *ALL NOTES DELETED*
├━━━━━━━━━━━━━━━┤
│
│ ✅ Deleted ${count} note(s)
│
│ 📝 Your notes are now empty!
╰━━━━━━━━━━━━━━━╯`,
        },
        { quoted: mek },
      );
    } catch (e) {
      console.error("delallnotes error:", e);
      reply("❌ Failed to delete notes. Please try again.");
    }
  },
);

cmd(
  {
    pattern: "notes",
    alias: ["notehelp", "notecmd", "notelist", "note"],
    desc: "Show notes commands help",
    category: "owner",
    filename: __filename,
  },
  async (conn, mek, m, { from, prefix, reply, isOwners }) => {
    if (!isOwners) return reply(ownerOnlyMsg);
    
    await conn.sendMessage(from, {
        text: `╭━━━━━━━━━━━━━━━╮
│ 📝 *NOTES COMMANDS*
│ ⚠️ Owner Only
╰━━━━━━━━━━━━━━━╯

*Add a note:*
${prefix}addnote <text>
${prefix}newnote <text>
${prefix}makenote <text>
_Or reply to a message with ${prefix}addnote_

*Get a specific note:*
${prefix}getnote <number>
${prefix}listnote <number>

*Get all your notes:*
${prefix}getnotes
${prefix}getallnotes
${prefix}listnotes

*Update a note:*
${prefix}updatenote <number> <new text>
${prefix}update <number> <new text>
_Or reply to a message with ${prefix}update <number>_

*Delete a specific note:*
${prefix}delnote <number>
${prefix}deletenote <number>
${prefix}removenote <number>

*Delete all your notes:*
${prefix}delallnotes
${prefix}removeallnotes
${prefix}deleteallnotes

_Notes are personal and stored securely in the database._`,
      },
      { quoted: m },
    );
  },
);

module.exports = {};
