// ============================= R E Q U E S T =============================
const config = require("../config");
const { cmd, commands } = require("../command");
const {
    getBuffer,
    getGroupAdmins,
    getRandom,
    h2k,
    isUrl,
    Json,
    runtime,
    sleep,
    fetchJson,
} = require("../lib/functions");
const { downloadMediaMessage } = require("prince-baileys");

const DBM = require("../lib/user-db");
const { storenumrepdata } = require("../lib/numreply-db");
const dbData = require("../lib/config");
const { toSmallCaps, toBold } = require("../lib/fonts");
const ymd_db = new DBM(dbData.TOKEN, dbData.USER_NAME, dbData.REPO_NAME);
const tableName = dbData.tableName;
const key = dbData.key;
const fs = require("fs");
const path = require("path");
const msgCounter = require("../lib/msg-counter");
// ============================= L A N G U A G E =============================
var allLangs = require("../lib/language.json");
var LANG = config.LANG === "EN" ? "EN" : config.LANG === "FR" ? "FR" : "EN";

var lang = allLangs[LANG];
var {
    errorMg,
    needOwner,
    groupOnly,
    needAdmin,
    giveMeAdmin,
    provideMessageForTag,
    userRemovedMessage,
    userRemovedFromGroup,
    userNotInGroupError,
    removeUserReplyError,
    adminsOnlyCmd,
    replyToMedia,
    groupStatusSuccess,
    groupStatusFailed,
    unsupportedMediaType,
} = lang;

// ============================= F U N C T I O N S =============================
async function updateEnv(
    tableName,
    setting,
    data,
    from,
    mek,
    conn,
    reply,
    remove = false,
) {
    try {
        const isInList = async (settingKey) => {
            const getdata = await ymd_db.get(tableName, settingKey);
            if (!Array.isArray(getdata)) return false;
            return getdata.includes(data);
        };

        if (!remove) {
            if (await isInList(setting))
                return await reply("*⚠️ Already Exists*");

            let olddata = await ymd_db.get(tableName, setting);
            if (!Array.isArray(olddata)) olddata = [];

            olddata.push(data);
            await ymd_db.input(tableName, setting, olddata);
            await reply(`*${setting} Active Succussfully This Group ✅*`);
            await conn.sendMessage(from, {
                react: { text: "✔", key: mek.key },
            });
        } else {
            if (!(await isInList(setting)))
                return await reply("*⚠️ Not Found in List*");

            const array = await ymd_db.get(tableName, setting);
            const indexToRemove = array.indexOf(data);
            if (indexToRemove !== -1) {
                array.splice(indexToRemove, 1);
                await ymd_db.input(tableName, setting, array);
            }

            await reply(`*${setting} Deactive Succussfully This Group ✅*`);
            await conn.sendMessage(from, {
                react: { text: "✔", key: mek.key },
            });
        }
    } catch (e) {
        console.error("❌ updateEnv error:", e);
        await reply("*An error occurred while updating.*");
    }
}

// ============================= C M D =============================

cmd(
    {
        pattern: "vcf",
        alias: ["savecontact", "scontact", "savecontacts"],
        react: "📇",
        desc: "Save group participants as vCard",
        category: "group",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        { from, isGroup, isOwners, groupMetadata, reply, isDev, isAdmins },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isOwners) return reply(needOwner);
            if (!isAdmins) return reply(needAdmin);

            const participants = groupMetadata?.participants || [];
            if (participants.length === 0)
                return reply("❌ No participants found.");

            let vcard = "";
            let index = 1;
            let savedCount = 0;

            for (let member of participants) {
                let phoneNumber = null;

                if (member.jid && member.jid.includes("@s.whatsapp.net")) {
                    phoneNumber = member.jid.split("@")[0];
                } else if (member.pn) {
                    phoneNumber = member.pn.replace(/[^0-9]/g, "");
                } else if (member.id && member.id.includes("@s.whatsapp.net")) {
                    phoneNumber = member.id.split("@")[0];
                } else if (member.id && !member.id.includes("@lid")) {
                    phoneNumber = member.id
                        .split("@")[0]
                        .replace(/[^0-9]/g, "");
                }

                if (phoneNumber && /^[0-9]{7,15}$/.test(phoneNumber)) {
                    const displayName =
                        member.notify ||
                        member.name ||
                        member.pushName ||
                        `+${phoneNumber}`;
                    vcard += `BEGIN:VCARD
VERSION:3.0
FN:[${index++}] ${displayName}
TEL;type=CELL;type=VOICE;waid=${phoneNumber}:+${phoneNumber}
END:VCARD
`;
                    savedCount++;
                }
            }

            if (savedCount === 0)
                return reply(
                    "❌ No valid phone numbers found. Participants may be using LID format without phone number data.",
                );

            const vcfPath = path.join(__dirname, "group_contacts.vcf");
            fs.writeFileSync(vcfPath, vcard.trim());

            reply(`📥 Saving ${savedCount} contacts...`);
            await sleep(1500);

            await conn.sendMessage(
                from,
                {
                    document: fs.readFileSync(vcfPath),
                    mimetype: "text/vcard",
                    fileName: "prince_tech_contacts.vcf",
                    caption: `
✅ *Contacts Saved Successfully*

👥 Group: *${groupMetadata.subject}*
📇 Saved Contacts: *${savedCount}*
👥 Total Members: *${participants.length}*

${config.FOOTER}
`,
                },
                { quoted: mek },
            );

            fs.unlinkSync(vcfPath); // cleanup
            await conn.sendMessage(from, {
                react: { text: "✅", key: mek.key },
            });
        } catch (err) {
            console.log(err);
            reply(`❌ Error: ${err.message}`);
        }
    },
);

cmd(
    {
        pattern: "bcgc",
        alias: ["broadcastgc"],
        react: "📢",
        desc: "Broadcast message to all groups",
        category: "owner",
        use: "bcgc <message>",
        filename: __filename,
    },
    async (conn, mek, m, { from, q, reply, isOwners, pushname }) => {
        try {
            // ✅ OWNER CHECK (YOUR SYSTEM)
            if (!isOwners)
                return reply("*❌ This command is for bot owners only!*");

            // ✅ MESSAGE CHECK
            if (!q) {
                return reply(
                    "*❌ Please provide a message to broadcast*\n\n" +
                        "Example:\n" +
                        "`.bcgc Hello all groups`",
                );
            }

            // ✅ FETCH ALL GROUPS
            const groupsData = await conn.groupFetchAllParticipating();
            const groupIds = Object.keys(groupsData);

            if (groupIds.length === 0) {
                return reply("*❌ No groups found to broadcast to.*");
            }

            await reply(
                `📢 *Broadcast Started*\n\n` +
                    `➠ Total Groups: ${groupIds.length}\n` +
                    `➠ Estimated Time: ${groupIds.length * 1.5} seconds`,
            );

            // ✅ SEND MESSAGE TO EACH GROUP
            for (const id of groupIds) {
                await sleep(6000);

                const message =
                    `📢 *Broadcast Message*\n\n` +
                    `👤 From: ${pushname}\n\n` +
                    `${q}`;

                await conn.sendMessage(id, {
                    text: message,
                    contextInfo: {
                        externalAdReply: {
                            showAdAttribution: true,
                            title: "PRINCE-MD",
                            body: `Broadcast to ${groupIds.length} groups`,
                            thumbnailUrl: "https://i.imgur.com/jCrFYOL.jpeg",
                            sourceUrl:
                                "https://whatsapp.com/channel/0029VbCKzJ66hENmMeROfT0e",
                            mediaType: 1,
                            renderLargerThumbnail: true,
                        },
                    },
                });
            }

            await reply(
                `✅ *Broadcast completed successfully!*\n\n➠ Sent to ${groupIds.length} groups`,
            );
        } catch (e) {
            console.error("BCGC ERROR:", e);
            reply("*❌ Error while sending broadcast*");
        }
    },
);

cmd(
    {
        pattern: "listgroupsdb",
        alias: ["listdb", "dbgroups"],
        react: "📋",
        desc: "List all group IDs stored in database for settings",
        category: "group",
        use: "listgroups [setting_name] or listgroups all",
        filename: __filename,
    },
    async (conn, mek, m, { from, q, reply, isOwners, isDev, participants }) => {
        try {
            if (!isOwners && !isDev) return reply(needOwner);

            const setting = q.trim().toUpperCase();
            let resultMessage = "📋 *DATABASE GROUP LIST*\n\n";

            if (setting === "ALL") {
                // List all settings and their group IDs
                const allSettings = [
                    "ANTI_LINK",
                    "ANTI_BAD",
                    "ANTI_BOT",
                    "STATUS_MENTION_BLOCK",
                    "WELCOME_MESSAGE",
                    "GOODBYE_MESSAGE",
                ];

                for (const settingName of allSettings) {
                    try {
                        const data = await ymd_db.get(tableName, settingName);
                        if (Array.isArray(data) && data.length > 0) {
                            resultMessage += `🔹 *${settingName}* (${data.length} groups):\n`;
                            data.forEach((groupId, index) => {
                                resultMessage += `  ${index + 1}. ${groupId}\n`;
                            });
                            resultMessage += "\n";
                        } else {
                            resultMessage += `🔹 *${settingName}*: No groups stored\n\n`;
                        }
                    } catch (error) {
                        resultMessage += `🔹 *${settingName}*: Error fetching data\n\n`;
                    }
                }
            } else if (
                setting &&
                [
                    "ANTI_LINK",
                    "ANTI_BAD",
                    "ANTI_BOT",
                    "STATUS_MENTION_BLOCK",
                    "WELCOME_MESSAGE",
                    "GOODBYE_MESSAGE",
                ].includes(setting)
            ) {
                // List specific setting
                try {
                    const data = await ymd_db.get(tableName, setting);

                    if (!Array.isArray(data)) {
                        resultMessage += `*${setting}*: No data found or data is not an array\n`;
                    } else if (data.length === 0) {
                        resultMessage += `*${setting}*: No groups stored (empty array)\n`;
                    } else {
                        resultMessage += `📊 *${setting}*\n`;
                        resultMessage += `📈 Total Groups: ${data.length}\n\n`;

                        // Show first 20 groups if too many
                        const displayData = data.slice(0, 20);

                        resultMessage += "*Stored Group IDs:*\n";
                        displayData.forEach((groupId, index) => {
                            resultMessage += `${index + 1}. ${groupId}\n`;
                        });

                        if (data.length > 20) {
                            resultMessage += `\n... and ${data.length - 20} more groups`;
                        }

                        // Add summary
                        resultMessage += `\n\n📊 *Summary:* ${data.length} group(s) have ${setting} enabled`;
                    }
                } catch (error) {
                    resultMessage += `❌ Error fetching ${setting}: ${error.message}\n`;
                }
            } else {
                // Show available settings
                resultMessage += "⚠️ *Usage:*\n";
                resultMessage += "• `.listgroups all` - Show all settings\n";
                resultMessage +=
                    "• `.listgroups ANTI_LINK` - Show groups with Anti-Link\n";
                resultMessage +=
                    "• `.listgroups ANTI_BAD` - Show groups with Anti-Bad\n";
                resultMessage +=
                    "• `.listgroups ANTI_BOT` - Show groups with Anti-Bot\n";
                resultMessage +=
                    "• `.listgroups STATUS_MENTION_BLOCK` - Show groups with Anti Status Mention\n";
                resultMessage +=
                    "• `.listgroups WELCOME_MESSAGE` - Show groups with Welcome Message\n";
                resultMessage +=
                    "• `.listgroups GOODBYE_MESSAGE` - Show groups with Goodbye Message\n\n";
                resultMessage +=
                    "*Note:* This checks the database table: " + tableName;
            }

            await reply(resultMessage);
        } catch (e) {
            console.error("Error in listgroups:", e);
            await reply(`❌ Error: ${e.message}`);
        }
    },
);

cmd(
    {
        pattern: "group",
        alias: ["gpsetting", "gpmenu", "welcome", "antilink"],
        react: "👨‍🔧",
        desc: "Group settings menu",
        category: "group",
        use: "group",
        filename: __filename,
    },
    async (
        conn,
        m,
        mek,
        { from, q, reply, isGroup, isAdmins, isBotAdmins, isDev, prefix },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);

            if (!isBotAdmins) return reply(giveMeAdmin);

            const settings = [
                { name: "Anti Link", key: "ANTI_LINK" },
                { name: "Anti Bad Word", key: "ANTI_BAD" },
                { name: "Anti Bot", key: "ANTI_BOT" },
                { name: "Status Mention Block", key: "STATUS_MENTION_BLOCK" },
                { name: "Welcome Message", key: "WELCOME_MESSAGE" },
                { name: "Goodbye Message", key: "GOODBYE_MESSAGE" },
            ];

            let info = `╔════〘 ${toBold("GROUP SETTINGS")} 〙════╗\n\n`;
            const numrep = [];

            for (let i = 0; i < settings.length; i++) {
                const idx = i + 1;
                info += `╭━━❮ ${toBold(settings[i].name)} ❯━━╮\n`;
                info += `┃ ${idx}.1  ${toSmallCaps("enable")}\n`;
                info += `┃ ${idx}.2  ${toSmallCaps("disable")}\n`;
                info += `╰━━━━━━━━━━━╯\n`;
                numrep.push(
                    `${idx}.1 ${prefix}gp_setting set ${settings[i].key}`,
                );
                numrep.push(
                    `${idx}.2 ${prefix}gp_setting remove ${settings[i].key}`,
                );
            }

            info += `\n> ${config.FOOTER}`;

            const sentMsg = await conn.sendMessage(
                from,
                { image: { url: config.LOGO }, caption: info },
                { quoted: mek },
            );

            await storenumrepdata({
                key: sentMsg.key,
                numrep,
                method: "decimal",
            });
        } catch (e) {
            console.log(e);
            await reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "gp_setting",
        react: "👨‍🔧",
        dontAddCommandList: true,
        filename: __filename,
    },
    async (
        conn,
        m,
        mek,
        { from, q, reply, isGroup, isAdmins, isBotAdmins, isDev },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);

            if (!isBotAdmins) return reply(giveMeAdmin);
            const action = q.split(" ")[0];
            const actionConfig = q.split(" ")[1];

            if (actionConfig === "ANTI_LINK") {
                if (action === "set") {
                    await updateEnv(
                        tableName,
                        "ANTI_LINK",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        false,
                    );
                } else {
                    await updateEnv(
                        tableName,
                        "ANTI_LINK",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        true,
                    );
                }
            } else if (actionConfig === "ANTI_BAD") {
                if (action === "set") {
                    await updateEnv(
                        tableName,
                        "ANTI_BAD",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        false,
                    );
                } else {
                    await updateEnv(
                        tableName,
                        "ANTI_BAD",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        true,
                    );
                }
            } else if (actionConfig === "ANTI_BOT") {
                if (action === "set") {
                    await updateEnv(
                        tableName,
                        "ANTI_BOT",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        false,
                    );
                } else {
                    await updateEnv(
                        tableName,
                        "ANTI_BOT",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        true,
                    );
                }
            } else if (actionConfig === "STATUS_MENTION_BLOCK") {
                if (action === "set") {
                    await updateEnv(
                        tableName,
                        "STATUS_MENTION_BLOCK",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        false,
                    );
                } else {
                    await updateEnv(
                        tableName,
                        "STATUS_MENTION_BLOCK",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        true,
                    );
                }
            } else if (actionConfig === "WELCOME_MESSAGE") {
                if (action === "set") {
                    await updateEnv(
                        tableName,
                        "WELCOME_MESSAGE",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        false,
                    );
                } else {
                    await updateEnv(
                        tableName,
                        "WELCOME_MESSAGE",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        true,
                    );
                }
            } else if (actionConfig === "GOODBYE_MESSAGE") {
                if (action === "set") {
                    await updateEnv(
                        tableName,
                        "GOODBYE_MESSAGE",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        false,
                    );
                } else {
                    await updateEnv(
                        tableName,
                        "GOODBYE_MESSAGE",
                        from,
                        from,
                        mek,
                        conn,
                        reply,
                        true,
                    );
                }
            } else return;
        } catch (e) {
            console.log(e);
            await reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "mute",
        react: "🔇",
        alias: ["close", "f_mute"],
        desc: "Change to group settings to only admins can send messages.",
        category: "group",
        use: "mute",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            await conn.groupSettingUpdate(from, "announcement");
            await conn.sendMessage(
                from,
                { text: `*Group Chat closed by Admin ${pushname}* 🔇` },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "unmute",
        react: "🔇",
        alias: ["open", "f_unmute"],
        desc: "Change to group settings to all members can send messages.",
        category: "group",
        use: "unmute",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            await conn.groupSettingUpdate(from, "not_announcement");
            await conn.sendMessage(
                from,
                { text: `*Group Chat Opened by Admin ${pushname}* 🔇` },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "lockgs",
        react: "🔇",
        alias: ["lockgsettings"],
        desc: "Change to group settings to only admins can edit group info",
        category: "group",
        use: "lockgs",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            await conn.groupSettingUpdate(from, "locked");
            await conn.sendMessage(
                from,
                { text: `*Group settings Locked* 🔒` },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "unlockgs",
        react: "🔓",
        alias: ["unlockgsettings"],
        desc: "Change to group settings to all members can edit group info",
        category: "group",
        use: "unlockgs",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            await conn.groupSettingUpdate(from, "unlocked");
            await conn.sendMessage(
                from,
                { text: `*Group settings Unlocked* 🔓` },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "leave",
        react: "🔓",
        alias: ["left", "kickme", "f_leave", "f_left", "f-left"],
        desc: "To leave from the group",
        category: "group",
        use: "leave",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwners,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isOwners) return reply(needOwner);

            await conn.sendMessage(
                from,
                { text: `*Good Bye All* 👋🏻` },
                { quoted: mek },
            );
            await conn.groupLeave(from);
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "updategname",
        react: "🔓",
        alias: ["upgname", "gname"],
        desc: "To Change the group name",
        category: "group",
        use: "updategname",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            if (!q) return reply("*Please write the new Group Subject* 🖊️");
            await conn.groupUpdateSubject(from, q);
            await conn.sendMessage(
                from,
                { text: `✔️ *Group name Updated*` },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "updategdesc",
        react: "🔓",
        alias: ["upgdesc", "gdesc"],
        desc: "To Change the group description",
        category: "group",
        use: "updategdesc",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            if (!q) return reply("*Please write the new Group Description* 🖊️");
            await conn.groupUpdateDescription(from, q);
            await conn.sendMessage(
                from,
                { text: `✔️ *Group Description Updated*` },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "join",
        react: "📬",
        alias: ["joinme", "f_join"],
        desc: "To Join a Group from Invite link",
        category: "group",
        use: "join < Group Link >",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwners,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isOwners) return reply(needOwner);

            if (!q) return reply("*Please write the Group Link 🖇️*");
            let result = args[0]
                .split("https://chat.whatsapp.com/")[1]
                .split("?")[0];
            await conn.groupAcceptInvite(result);
            await conn.sendMessage(
                from,
                { text: `✔️ *Successfully Joined*` },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "invite",
        react: "🖇️",
        alias: ["grouplink", "glink"],
        desc: "To Get the Group Invite link",
        category: "group",
        use: "invite",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            const code = await conn.groupInviteCode(from);

            await conn.sendMessage(
                from,
                {
                    text: `🖇️ *Group Link*\n\nhttps://chat.whatsapp.com/${code}`,
                },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "revoke",
        react: "🖇️",
        alias: ["revokegrouplink", "resetglink", "revokelink", "f_revoke"],
        desc: "To Reset the group link",
        category: "group",
        use: "revoke",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            await conn.groupRevokeInvite(from);
            await conn.sendMessage(
                from,
                { text: `*Group link Reseted* ⛔` },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "kick",
        react: "🥏",
        alias: ["remove"],
        desc: "To Remove a participant from Group",
        category: "group",
        use: "kick",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            quoted,
            q,
            isGroup,
            isAdmins,
            isBotAdmins,
            isDev,
            participants,
            reply,
            msr,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            let users;
            if (mek.quoted) {
                users = mek.quoted.sender;
            } else if (mek?.msg?.contextInfo?.mentionedJid[0]) {
                users = mek?.msg?.contextInfo?.mentionedJid[0];
            }

            if (!users) return reply(removeUserReplyError);

            const isUserInGroup = participants.some(
                (member) => member.id === users,
            );
            if (!isUserInGroup) return reply(userNotInGroupError);
            let response = await conn.groupParticipantsUpdate(
                from,
                [users],
                "remove",
            );

            if (response && response[0].status === "200") {
                await conn.sendMessage(
                    from,
                    {
                        text: `@${users.split("@")[0]} ` + userRemovedFromGroup,
                        mentions: [users],
                    },
                    { quoted: mek },
                );
            } else {
                await reply(userRemovedMessage);
            }
        } catch (e) {
            console.error(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "addmember",
        react: "➕",
        alias: ["add", "invite"],
        desc: "To Add a Member to the Group",
        category: "group",
        use: "addmember <phone_number>",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        { from, q, isGroup, isAdmins, isDev, isOwner, isBotAdmins, reply, msr },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            if (!q)
                return reply(
                    "*❗ Please provide a phone number or invite link to add a member.*",
                );

            let number = q.replace(/[^\d+]/g, ""); // Ensure it's a valid number
            if (number.length === 0)
                return reply(
                    "*❗ No valid phone numbers found. Please check the format.*",
                );

            if (!number.includes("@s.whatsapp.net"))
                number = `${number}@s.whatsapp.net`;

            await conn.groupParticipantsUpdate(from, [number], "add");

            reply(`✅ Successfully added ${number} to the group.`);
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.error(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "promote",
        react: "🥏",
        alias: ["addadmin"],
        desc: "To Add a participatant as a Admin",
        category: "group",
        use: "promote",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            mentionByTag,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            let users;
            if (mek.quoted) {
                users = mek.quoted.sender;
            } else if (mek?.msg?.contextInfo?.mentionedJid[0]) {
                users = mek?.msg?.contextInfo?.mentionedJid[0];
            }

            if (!users) return reply(removeUserReplyError);

            const groupAdmins = await getGroupAdmins(participants);
            if (groupAdmins.includes(users))
                return await conn.sendMessage(
                    from,
                    {
                        text: `*@${users.split("@")[0]} Already an Admin* ❗`,
                        mentions: [users],
                    },
                    { quoted: mek },
                );
            await conn.groupParticipantsUpdate(from, [users], "promote");
            await conn.sendMessage(
                from,
                {
                    text: `*@${users.split("@")[0]} promoted as an Admin*  ✔️`,
                    mentions: [users],
                },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "demote",
        react: "🥏",
        alias: ["removeadmin"],
        desc: "To Demote Admin to Member",
        category: "group",
        use: "demote",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            mentionByTag,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins) return reply(needAdmin);
            if (!isBotAdmins) return reply(giveMeAdmin);

            let users;
            if (mek.quoted) {
                users = mek.quoted.sender;
            } else if (mek?.msg?.contextInfo?.mentionedJid[0]) {
                users = mek?.msg?.contextInfo?.mentionedJid[0];
            }

            if (!users) return reply(removeUserReplyError);
            const groupAdmins = await getGroupAdmins(participants);
            if (!groupAdmins.includes(users))
                return await conn.sendMessage(
                    from,
                    {
                        text: `*@${users.split("@")[0]} Already not an Admin* ❗`,
                        mentions: [users],
                    },
                    { quoted: mek },
                );
            await conn.groupParticipantsUpdate(from, [users], "demote");
            await conn.sendMessage(
                from,
                {
                    text: `*@${users.split("@")[0]} No longer an Admin*  ✔️`,
                    mentions: [users],
                },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "tagall",
        react: "🔊",
        alias: ["f_tagall"],
        desc: "Tag all group members",
        category: "group",
        use: "tagall [message]",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        { from, isGroup, isAdmins, isDev, participants, groupName, reply, q },
    ) => {
        try {
            if (!isGroup) {
                return reply(groupOnly);
            }
            if (!isAdmins && !isDev) {
                return reply(needAdmin);
            }

            let message = q?.trim() || "Please give your attention 🚨";

            let teks = `📢 *TAG ALL MEMBERS*\n`;
            teks += `🏷️ *Group:* ${groupName}\n`;
            teks += `📝 *Message:* ${message}\n`;
            teks += `👥 *Members:* ${participants.length}\n\n`;
            teks += `━━━━━━━━━━━━━━━\n`;

            participants.forEach((mem, i) => {
                const jid = mem.jid || mem.pn || mem.id;
                teks += `${i + 1}. @${jid.split("@")[0]}\n`;
            });

            teks += `━━━━━━━━━━━━━━━`;

            await conn.sendMessage(
                from,
                {
                    text: teks,
                    mentions: participants.map((p) => p.jid || p.pn || p.id),
                },
                { quoted: mek },
            );
        } catch (e) {
            console.log(e);
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            reply(errorMg);
        }
    },
);

cmd(
    {
        pattern: "hidetag",
        react: "🔊",
        alias: ["tag", "f_tag"],
        desc: "To Tag all Members for Message",
        category: "group",
        use: "tag Hi",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        { from, quoted, q, isGroup, isAdmins, isDev, participants, reply, msr },
    ) => {
        try {
            if (!isGroup) {
                return reply(groupOnly);
            }
            if (!isAdmins) {
                if (!isDev) {
                    return reply(needAdmin);
                }
            }

            let messageText = q || (quoted && quoted?.msg);
            if (!messageText) {
                return reply(provideMessageForTag);
            }

            await conn.sendMessage(
                from,
                {
                    text: messageText,
                    mentions: participants.map((a) => a.id),
                },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.error(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "taggroups",
        alias: ["sendtag", "taggrp"],
        react: "♻️",
        desc: "Tag all participants in a WhatsApp group.",
        category: "group",
        use: "taggrp <jid1,jid2,...> ± <message> or .taggrp <jid1,jid2,...> (quote message)",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            isDev,
            msg,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwners,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isOwners) return await reply(ownerMg);
            // Check for correct input format first
            if (!q.includes("±") && !m.quoted) {
                return reply(
                    "*Please Enter Jids & Message Like That...❗*\n\n.taggrp <jid1,jid2,...> ± <message>\n\nOr\n\n.taggrp <jid1,jid2,...> (quote message)",
                );
            }

            let jidsInput, messageText;

            if (m.quoted) {
                jidsInput = q;
                messageText = m.quoted.msg;
            } else {
                if (!q.includes("±")) {
                    return reply(
                        "*Invalid format. Please use .taggrp <jid1,jid2,...> ± <message>*",
                    );
                }
                var [e, f] = q.split("±");
                jidsInput = e;
                messageText = f;
            }
            // Split multiple JIDs
            const jids = jidsInput.split(",").map((jid) => jid.trim());

            for (const groupId of jids) {
                // Validate group jid
                if (!groupId.endsWith("@g.us")) {
                    await reply(
                        `*Please Give me Valid Group Jid Address for ${groupId}... ❗*`,
                    );
                    continue; // Skip to the next JID if invalid
                }

                try {
                    // Get group metadata and participant list
                    const groupInfo = await conn.groupMetadata(groupId);
                    const participantList = await groupInfo.participants;

                    // Send message with mentions
                    await conn.sendMessage(groupId, {
                        text: messageText,
                        mentions: participantList.map(
                            (participant) => participant.id,
                        ),
                    });
                    await reply(
                        `*Message sent to ${groupInfo.subject} (${groupId}) successfully!*`,
                    );
                } catch (groupError) {
                    console.log(
                        `Error sending message to ${groupId}:`,
                        groupError,
                    );
                    await reply(
                        `*Could not send message to ${groupId}. Error: ${groupError.message || groupError}*`,
                    );
                }
                await sleep(500); // Add a small delay between sending to multiple JIDs to avoid rate limiting
            }
        } catch (e) {
            console.log(e);
            await reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "ginfo",
        react: "🥏",
        alias: ["groupinfo"],
        desc: "Get group informations.",
        category: "group",
        use: "ginfo",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            l,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            msr,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isCreator,
            isDev,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins && !isDev) {
                return reply(needAdmin);
            }
            if (!isBotAdmins) return reply(giveMeAdmin);

            const metadata = await conn.groupMetadata(from);
            let ppUrl;
            try {
                ppUrl = await conn.profilePictureUrl(from, "image");
            } catch {
                ppUrl = "https://telegra.ph/file/265c672094dfa87caea19.jpg"; // default image
            }
            const gdata = `\n*${metadata.subject}*

🐉 *Group Jid* - ${metadata.id}

📬 *Participant Count* - ${metadata.size}

👤 *Group Creator* - ${metadata.owner}

📃 *Group Description* - ${metadata.desc}\n\n`;
            await conn.sendMessage(
                from,
                { image: { url: ppUrl }, caption: gdata + config.FOOTER },
                { quoted: mek },
            );
        } catch (e) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            console.log(e);
            reply(errorMg, "❌");
        }
    },
);

cmd(
    {
        pattern: "kickall",
        react: "🧨",
        desc: "Kick all non-admin members (with confirmation)",
        category: "dev",
        filename: __filename,
    },
    async (
        conn,
        m,
        mek,
        {
            from,
            q,
            isGroup,
            isAdmins,
            isBotAdmins,
            participants,
            groupMetadata,
            reply,
            isDev,
            prefix,
            botNumber2,
            botLid,
        },
    ) => {
        try {
            const input = q.trim().toLowerCase();

            if (!isGroup) return reply(groupOnly);
            //if (!isDev) return reply(needOwner);
            if (!isBotAdmins) return reply(giveMeAdmin);

            const SKIP_LIST = dbData.DEVELOPER_NUMBERS || [];

            switch (input) {
                case "true":
                    const groupOwner =
                        groupMetadata.owner ||
                        participants.find((p) => p.admin === "superadmin")?.id;

                    const membersToKick = participants
                        .filter((p) => {
                            const number = p.id.split("@")[0];
                            return (
                                p.id !== botLid &&
                                p.id !== botNumber2 &&
                                p.id !== groupOwner &&
                                p.admin !== "admin" &&
                                !SKIP_LIST.includes(number)
                            );
                        })
                        .map((p) => p.id);

                    if (membersToKick.length === 0)
                        return reply("*No non-admin members to kick.*");

                    reply(`*Kicking ${membersToKick.length} members...*`);
                    for (let id of membersToKick) {
                        await sleep(1000);
                        await conn.groupParticipantsUpdate(
                            from,
                            [id],
                            "remove",
                        );
                    }
                    reply("*✅ Kick completed.*");
                    break;

                case "false":
                    return reply("*❌ Kick canceled.*");

                default:
                    const info =
                        "*⚠️ Confirm Kick*\n\nDo you want to kick all non-admin members?\n\n01. ✅ YES\n02. ❌ NO";

                    const numrep = [];
                    numrep.push(`${prefix}kickall true`);
                    numrep.push(`${prefix}kickall false`);

                    const sentMsg = await conn.sendMessage(
                        from,
                        { text: info },
                        { quoted: mek },
                    );
                    const messageKey = sentMsg.key;

                    const jsonmsg = {
                        key: messageKey,
                        numrep,
                        method: "nondecimal",
                    };
                    await storenumrepdata(jsonmsg);
                    break;
            }
        } catch (e) {
            console.error("kickall error:", e);
            reply("*Error occurred while handling kickall.*");
        }
    },
);

// ============================= GROUP STATUS =============================
cmd(
    {
        pattern: "groupstatus",
        react: "📢",
        alias: ["gstatus", "gstat"],
        desc: "Post replied message as group status",
        category: "group",
        use: ".groupstatus [reply to image/video/audio/text]",
        filename: __filename,
    },
    async (
        conn,
        mek,
        m,
        {
            from,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            isGroup,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isAdmins,
            reply,
        },
    ) => {
        try {
            if (!isGroup) return reply(groupOnly);
            if (!isAdmins && !isOwner) return reply(adminsOnlyCmd);

            if (!m.quoted) return reply(replyToMedia);

            const mtype = m.quoted.type;
            let statusPayload = {};

            if (mtype === "imageMessage") {
                const mediaBuffer = await m.quoted.download();
                const caption = m.quoted.imageMessage?.caption || q || "";
                statusPayload = {
                    groupStatusMessage: {
                        image: mediaBuffer,
                        caption: caption,
                    },
                };
            } else if (mtype === "videoMessage") {
                const mediaBuffer = await m.quoted.download();
                const caption = m.quoted.videoMessage?.caption || q || "";
                statusPayload = {
                    groupStatusMessage: {
                        video: mediaBuffer,
                        caption: caption,
                    },
                };
            } else if (mtype === "audioMessage") {
                const mediaBuffer = await m.quoted.download();
                statusPayload = {
                    groupStatusMessage: {
                        audio: mediaBuffer,
                        ptt: m.quoted.audioMessage?.ptt || false,
                    },
                };
            } else if (
                mtype === "conversation" ||
                mtype === "extendedTextMessage"
            ) {
                const textContent = m.quoted.text || m.quoted.msg || "";
                const bgColors = [
                    "#FF5733",
                    "#33FF57",
                    "#3357FF",
                    "#FF33A1",
                    "#33FFF5",
                    "#F5FF33",
                    "#9933FF",
                ];
                const randomBg =
                    bgColors[Math.floor(Math.random() * bgColors.length)];
                statusPayload = {
                    groupStatusMessage: {
                        text: textContent,
                        backgroundColor: randomBg,
                        font: Math.floor(Math.random() * 5),
                    },
                };
            } else {
                return reply(unsupportedMediaType);
            }

            await conn.sendMessage(from, statusPayload);
            await reply(groupStatusSuccess);
        } catch (e) {
            console.error("groupstatus error:", e);
            reply(groupStatusFailed);
        }
    },
);

//============================ ONLINE MEMBERS ============================
cmd(
    {
        pattern: "online",
        react: "🟢",
        alias: ["listonline", "whosonline"],
        desc: "List members who are currently online in the group",
        category: "group",
        use: ".online",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, isGroup }) => {
        if (!isGroup) return reply("❌ This command only works in groups!");

        try {
            await reply("🔍 Checking online members... Please wait...");

            const groupMeta = await conn.groupMetadata(from);
            const participants = groupMeta.participants;

            const onlineMembers = [];
            const presenceData = new Map();

            const presenceHandler = (update) => {
                if (update.presences) {
                    for (const [jid, presence] of Object.entries(
                        update.presences,
                    )) {
                        presenceData.set(jid, presence);
                        const numOnly = jid.split("@")[0];
                        presenceData.set(numOnly, presence);
                    }
                }
            };

            conn.ev.on("presence.update", presenceHandler);

            try {
                const batchSize = 5;
                for (let i = 0; i < participants.length; i += batchSize) {
                    const batch = participants.slice(i, i + batchSize);
                    await Promise.all(
                        batch.map(async (p) => {
                            const jid = p.id || p.jid;
                            try {
                                await conn.presenceSubscribe(jid);
                            } catch (e) {}
                        }),
                    );
                    await sleep(500);
                }

                await sleep(2000);

                for (const p of participants) {
                    const participantId = p.id || p.jid;
                    const numOnly = participantId.split("@")[0];

                    let presence =
                        presenceData.get(participantId) ||
                        presenceData.get(numOnly);

                    if (!presence && p.pn) {
                        presence =
                            presenceData.get(p.pn) ||
                            presenceData.get(p.pn.split("@")[0]);
                    }

                    if (
                        presence?.lastKnownPresence === "available" ||
                        presence?.lastKnownPresence === "composing"
                    ) {
                        let displayJid = participantId;
                        if (participantId.endsWith("@lid") && p.pn) {
                            displayJid = p.pn;
                        }
                        const number = displayJid.split("@")[0];
                        const name = p.notify || p.name || number;
                        onlineMembers.push({ jid: displayJid, name, number });
                    }
                }
            } finally {
                conn.ev.off("presence.update", presenceHandler);
            }

            if (onlineMembers.length === 0) {
                await conn.sendMessage(from, {
                    react: { text: "😴", key: mek.key },
                });
                return reply(
                    "😴 No members are currently showing as online.\n\n_Note: Some users hide their online status._",
                );
            }

            const mentions = onlineMembers.map((m) => m.jid);
            const memberList = onlineMembers
                .map((m, i) => `${i + 1}. @${m.number}`)
                .join("\n");

            const message =
                `🟢 *ONLINE MEMBERS*\n\n` +
                `📊 *${onlineMembers.length}* of *${participants.length}* members online\n\n` +
                `${memberList}\n\n` +
                `_Note: Users with hidden presence won't appear._`;

            await conn.sendMessage(from, {
                react: { text: "✅", key: mek.key },
            });
            await conn.sendMessage(
                from,
                {
                    text: message,
                    mentions: mentions,
                },
                { quoted: mek },
            );
        } catch (error) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            return reply(`❌ Failed to check online members: ${error.message}`);
        }
    },
);

// ─── Top Members ─────────────────────────────────────────────────────────────

cmd(
    {
        pattern: "topmembers",
        alias: ["topusers", "leaderboard"],
        react: "🏆",
        desc: "Show top 5 most active members in this group by message count.",
        category: "group",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, isGroup, groupName, participants }) => {
        try {
            if (!isGroup) return reply("❌ Group only command.");

            const top = msgCounter.getTop(from, 5);

            if (!top || top.length === 0) {
                return reply(
                    "📭 No message data yet for this group. Data starts collecting once members send messages while the bot is active.",
                );
            }

            const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
            const mentions = [];
            let rows = "";

            for (let i = 0; i < top.length; i++) {
                const [jid, count] = top[i];
                const num = jid.split("@")[0];
                mentions.push(jid);
                rows += `${medals[i]} @${num} — *${count}* msg${count !== 1 ? "s" : ""}\n`;
            }

            const text = `╭━━━ 🏆 TOP MEMBERS ━━━╮
┃📌 Group: ${groupName}
┃
${rows
    .trimEnd()
    .split("\n")
    .map((l) => `┃${l}`)
    .join("\n")}
╰━━━━━━━━━━━━━━━━━━━╯`;

            await conn.sendMessage(from, { text, mentions }, { quoted: mek });
        } catch (e) {
            console.error("topmembers error:", e.message);
            reply("❌ Failed to fetch top members.");
        }
    },
);

// ─── Custom Welcome / Goodbye Message ────────────────────────────────────────

async function getCustomMsg(key) {
    try {
        return (await ymd_db.get(tableName, key)) || null;
    } catch {
        return null;
    }
}
async function setCustomMsg(key, val) {
    await ymd_db.input(tableName, key, val);
}

cmd(
    {
        pattern: "setwelcomemsg",
        alias: ["setwelcome", "customwelcome"],
        react: "👋",
        desc: "Set a custom welcome message for this group. Use {user} for mention, {group} for group name.",
        category: "group",
        use: "setwelcomemsg <text> | reply to a message",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, isAdmins, isGroup, q }) => {
        try {
            if (!isGroup) return reply("❌ Group only command.");
            if (!isAdmins) return reply("❌ Admins only.");

            const qt = m.quoted;
            let text = (q || "").trim();
            if (!text && qt) {
                text =
                    typeof qt.msg === "string"
                        ? qt.msg
                        : qt.msg?.text || qt.msg?.caption || "";
            }

            if (!text)
                return reply(
                    `👋 *Set Custom Welcome Message*\n\n` +
                        `Usage: *.setwelcomemsg <your message>*\n` +
                        `Or reply to any message with *.setwelcomemsg*\n\n` +
                        `*Placeholders:*\n` +
                        `• \`{user}\` — tags the new member\n` +
                        `• \`{group}\` — group name\n\n` +
                        `_If {user} is missing, the mention is auto-added._\n\n` +
                        `*Current custom:* ${(await getCustomMsg("CUSTOM_WELCOME_" + from)) || "_(default)_"}`,
                );

            await setCustomMsg("CUSTOM_WELCOME_" + from, text);
            await reply(
                `✅ Custom welcome message set!\n\n_Preview:_\n${text}`,
            );
        } catch (e) {
            console.error("setwelcomemsg error:", e.message);
            reply("❌ Failed to set welcome message.");
        }
    },
);

cmd(
    {
        pattern: "setgoodbyemsg",
        alias: ["setgoodbye", "customgoodbye"],
        react: "👋",
        desc: "Set a custom goodbye message for this group. Use {user} for mention, {group} for group name.",
        category: "group",
        use: "setgoodbyemsg <text> | reply to a message",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, isAdmins, isGroup, q }) => {
        try {
            if (!isGroup) return reply("❌ Group only command.");
            if (!isAdmins) return reply("❌ Admins only.");

            const qt = m.quoted;
            let text = (q || "").trim();
            if (!text && qt) {
                text =
                    typeof qt.msg === "string"
                        ? qt.msg
                        : qt.msg?.text || qt.msg?.caption || "";
            }

            if (!text)
                return reply(
                    `👋 *Set Custom Goodbye Message*\n\n` +
                        `Usage: *.setgoodbyemsg <your message>*\n` +
                        `Or reply to any message with *.setgoodbyemsg*\n\n` +
                        `*Placeholders:*\n` +
                        `• \`{user}\` — tags the leaving member\n` +
                        `• \`{group}\` — group name\n\n` +
                        `_If {user} is missing, the mention is auto-added._\n\n` +
                        `*Current custom:* ${(await getCustomMsg("CUSTOM_GOODBYE_" + from)) || "_(default)_"}`,
                );

            await setCustomMsg("CUSTOM_GOODBYE_" + from, text);
            await reply(
                `✅ Custom goodbye message set!\n\n_Preview:_\n${text}`,
            );
        } catch (e) {
            console.error("setgoodbyemsg error:", e.message);
            reply("❌ Failed to set goodbye message.");
        }
    },
);

cmd(
    {
        pattern: "delwelcomemsg",
        alias: ["resetwelcome", "resetwelcomemsg"],
        react: "🔄",
        desc: "Reset welcome message to default.",
        category: "group",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, isAdmins, isGroup }) => {
        try {
            if (!isGroup) return reply("❌ Group only command.");
            if (!isAdmins) return reply("❌ Admins only.");
            await setCustomMsg("CUSTOM_WELCOME_" + from, null);
            reply("✅ Welcome message reset to default.");
        } catch (e) {
            reply("❌ Failed to reset welcome message.");
        }
    },
);

cmd(
    {
        pattern: "delgoodbyemsg",
        alias: ["resetgoodbye", "resetgoodbyemsg"],
        react: "🔄",
        desc: "Reset goodbye message to default.",
        category: "group",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, isAdmins, isGroup }) => {
        try {
            if (!isGroup) return reply("❌ Group only command.");
            if (!isAdmins) return reply("❌ Admins only.");
            await setCustomMsg("CUSTOM_GOODBYE_" + from, null);
            reply("✅ Goodbye message reset to default.");
        } catch (e) {
            reply("❌ Failed to reset goodbye message.");
        }
    },
);
