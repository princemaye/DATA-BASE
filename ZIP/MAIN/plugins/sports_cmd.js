// ============================= SPORTS PLUGIN =============================
const { cmd } = require("../command");
const config = require("../config");
const { fetchJson, getContextInfo } = require("../lib/functions");

const { toBold, toSmallCaps } = require("../lib/fonts");
const { storenumrepdata } = require("../lib/numreply-db");

const SPORTS_API_BASE = "https://apisKeith.top";
const SPORTS_IMAGE = "https://i.ibb.co/gLRMhk9p/N0r-QVLHAY0.jpg";

// ============================= L A N G U A G E =============================
var allLangs = require("../lib/language.json");
var LANG = config.LANG === "EN" ? "EN" : config.LANG === "FR" ? "FR" : "EN";
var lang = allLangs[LANG];
var { errorMg, numreplyMg } = lang;

// ============================= LEAGUE CONFIG =============================
const LEAGUE_CONFIG = {
    1: { name: "Premier League", code: "epl", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    2: { name: "Bundesliga", code: "bundesliga", emoji: "🇩🇪" },
    3: { name: "La Liga", code: "laliga", emoji: "🇪🇸" },
    4: { name: "Ligue 1", code: "ligue1", emoji: "🇫🇷" },
    5: { name: "Serie A", code: "seriea", emoji: "🇮🇹" },
    6: { name: "UEFA Champions League", code: "ucl", emoji: "🏆" },
    7: { name: "FIFA International", code: "fifa", emoji: "🌍" },
    8: { name: "UEFA Euro", code: "euros", emoji: "🇪🇺" },
};

// ============================= HELPER FUNCTIONS =============================
function convertToUserTime(timeStr, dateStr, userTimeZone) {
    if (!timeStr || !dateStr) return null;
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const [hours, minutes] = timeStr.split(":").map(Number);
        const utcDate = new Date(
            Date.UTC(year, month - 1, day, hours, minutes),
        );
        return {
            date: utcDate.toLocaleDateString("en-US", {
                timeZone: userTimeZone,
            }),
            time: utcDate.toLocaleTimeString("en-US", {
                timeZone: userTimeZone,
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
    } catch (e) {
        return null;
    }
}

function getMatchIcon(status) {
    const icons = { HT: "⏸️", FT: "✅", Pen: "✅", "1T": "🔴", "2T": "🔴" };
    return icons[status] || "⏰";
}

function getMatchStatusText(status) {
    const statusMap = {
        "": "Not Started",
        FT: "Full Time",
        "1T": "1st Half",
        "2T": "2nd Half",
        HT: "Half Time",
        Pst: "Postponed",
        Canc: "Cancelled",
        Pen: "Penalties",
    };
    return statusMap[status] || status;
}

// ============================= SUREBET =============================
cmd(
    {
        pattern: "surebet",
        react: "🎲",
        alias: ["bettips", "odds", "predict", "bet", "sureodds"],
        desc: "Get betting tips and odds predictions",
        category: "sports",
        use: "surebet",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply }) => {
        try {
            await conn.sendMessage(from, {
                react: { text: "⏳", key: mek.key },
            });

            const data = await fetchJson(`${SPORTS_API_BASE}/bet`);

            if (!data?.status || !data?.result?.length) {
                await conn.sendMessage(from, {
                    react: { text: "❌", key: mek.key },
                });
                return reply(
                    "❌ No betting tips available right now. Try again later.",
                );
            }

            let txt = `╭━━━━━━━━━━━╮\n`;
            txt += `│ 🎲 ${toBold("BETTING TIPS")}\n`;
            txt += `├━━━━━━━━━━━┤\n`;
            txt += `│ 📊 ${toSmallCaps("Today's Picks")}\n`;
            txt += `╰━━━━━━━━━━━╯\n\n`;

            data.result.forEach((match, i) => {
                txt += `┏━ ${toBold(`Match ${i + 1}`)} ━┓\n`;
                txt += `┃ ⚽ ${toBold(match.match)}\n`;
                txt += `┃ 🏆 ${match.league}\n`;
                txt += `┃ 🕐 ${match.time}\n`;
                txt += `┣━━━━━━━━━┫\n`;

                if (match.predictions?.fulltime) {
                    txt += `┃ 📈 ${toSmallCaps("FT Odds:")}\n`;
                    txt += `┃ 🏠 ${match.predictions.fulltime.home}%\n`;
                    txt += `┃ 🤝 ${match.predictions.fulltime.draw}%\n`;
                    txt += `┃ ✈️ ${match.predictions.fulltime.away}%\n`;
                }

                if (match.predictions?.over_2_5) {
                    txt += `┃ ⚽ ${toSmallCaps("O2.5:")} ✅${match.predictions.over_2_5.yes}%\n`;
                }

                if (match.predictions?.bothTeamToScore) {
                    txt += `┃ 🎯 ${toSmallCaps("BTTS:")} ${match.predictions.bothTeamToScore.yes}%\n`;
                }

                if (typeof match.predictions?.value_bets !== "undefined") {
                    txt += `┃ 💰 ${match.predictions.value_bets}\n`;
                }

                txt += `┗━━━━━━━━━┛\n\n`;
            });

            txt += `_⚠️ Bet responsibly. Past results don't guarantee future outcomes._\n\n${config.FOOTER}`;

            await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: txt,
                },
                { quoted: mek },
            );
            await conn.sendMessage(from, {
                react: { text: "✅", key: mek.key },
            });
        } catch (err) {
            console.error("surebet error:", err);
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            reply("❌ Failed to fetch betting tips. Try again later.");
        }
    },
);

// ============================= LIVESCORE =============================
cmd(
    {
        pattern: "livescore",
        react: "⚽",
        alias: ["live", "score", "livematch"],
        desc: "Get live, finished, or upcoming football matches",
        category: "sports",
        use: "livescore",
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, reply }) => {
        try {
            let info = `╭━━━━━━━━━━━╮
│ ⚽ ${toBold("LIVE SCORES")}
├━━━━━━━━━━━┤
│ ${numreplyMg || "Reply with number"}
├━━━━━━━━━━━┤
│ 1. 🔴 Live Matches
│ 2. ✅ Finished Matches
│ 3. ⏰ Upcoming Matches
╰━━━━━━━━━━━╯`;

            const numrep = [];
            numrep.push(`${prefix}livescoreget live`);
            numrep.push(`${prefix}livescoreget finished`);
            numrep.push(`${prefix}livescoreget upcoming`);

            const sentMsg = await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: info,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: sentMsg.key,
                numrep,
                method: "nondecimal",
            });
        } catch (err) {
            console.error("Livescore error:", err);
            reply("❌ Error loading livescore menu.");
        }
    },
);

// ============================= LIVESCORE GET =============================
cmd(
    {
        pattern: "livescoreget",
        react: "⚽",
        alias: [],
        desc: "Get live scores (internal command)",
        category: "sports",
        use: "livescoreget <live/finished/upcoming>",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, q }) => {
        try {
            const choice = q?.toLowerCase()?.trim();
            const optionMap = {
                live: { name: "Live", emoji: "🔴", filter: ["1T", "2T", "HT"] },
                finished: {
                    name: "Finished",
                    emoji: "✅",
                    filter: ["FT", "Pen"],
                },
                upcoming: {
                    name: "Upcoming",
                    emoji: "⏰",
                    filter: ["", "Pst", "Canc"],
                },
            };

            if (!choice || !optionMap[choice]) {
                return reply(
                    `❌ Invalid option. Use: livescoreget live/finished/upcoming`,
                );
            }

            const selected = optionMap[choice];
            await conn.sendMessage(from, {
                react: { text: selected.emoji, key: mek.key },
            });

            const data = await fetchJson(`${SPORTS_API_BASE}/livescore`);

            if (!data?.status || !data?.result?.games) {
                return reply(`❌ No match data available at the moment.`);
            }

            const games = Object.values(data.result.games);
            const userTimeZone = config.TIME_ZONE || "Africa/Nairobi";

            const now = new Date();
            const currentUserTimeStr = now.toLocaleTimeString("en-US", {
                timeZone: userTimeZone,
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
            });

            let filteredGames = games
                .filter((game) => {
                    const status = game.R?.st || "";
                    return selected.filter.includes(status);
                })
                .map((game) => ({
                    ...game,
                    userMatchTime: convertToUserTime(
                        game.tm,
                        game.dt,
                        userTimeZone,
                    ),
                }));

            if (filteredGames.length === 0) {
                return conn.sendMessage(
                    from,
                    {
                        contextInfo: getContextInfo(
                            config.BOT_NAME !== "default"
                                ? config.BOT_NAME
                                : null,
                        ),
                        image: { url: SPORTS_IMAGE },
                        caption: `╭━━━━━━━━━━━╮\n│ ${selected.emoji} ${toBold(selected.name)}\n╰━━━━━━━━━━━╯\n\n_No matches found._`,
                    },
                    { quoted: mek },
                );
            }

            let output = `╭━━━━━━━━━━━╮\n`;
            output += `│ ${selected.emoji} ${toBold(selected.name)}\n`;
            output += `├━━━━━━━━━━━┤\n`;
            output += `│ 🌍 ${userTimeZone}\n`;
            output += `│ 🕐 ${currentUserTimeStr}\n`;
            output += `╰━━━━━━━━━━━╯\n\n`;

            filteredGames.slice(0, 20).forEach((game) => {
                const statusIcon = getMatchIcon(game.R?.st);
                const score =
                    game.R?.r1 !== undefined
                        ? `${game.R.r1} - ${game.R.r2}`
                        : "vs";
                const time = game.userMatchTime?.time || game.tm || "";
                const statusText = getMatchStatusText(game.R?.st);

                output += `${statusIcon} ${toBold(game.p1)} ${score} ${toBold(game.p2)}\n`;
                output += `   🕒 ${time}${statusText ? ` (${statusText})` : ""}\n\n`;
            });

            output += `_📊 Showing ${Math.min(filteredGames.length, 20)} of ${filteredGames.length} matches_\n\n${config.FOOTER}`;

            await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: output,
                },
                { quoted: mek },
            );
        } catch (err) {
            console.error("livescoreget error:", err);
            reply(`❌ Error fetching matches: ${err.message}`);
        }
    },
);

// ============================= SPORTNEWS =============================
cmd(
    {
        pattern: "sportnews",
        react: "📰",
        alias: ["footballnews", "soccernews"],
        desc: "Get latest football news",
        category: "sports",
        use: "sportnews",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply }) => {
        try {
            await conn.sendMessage(from, {
                react: { text: "⏳", key: mek.key },
            });

            const data = await fetchJson(`${SPORTS_API_BASE}/football/news`);
            const items = data?.result?.data?.items;

            if (!Array.isArray(items) || items.length === 0) {
                await conn.sendMessage(from, {
                    react: { text: "❌", key: mek.key },
                });
                return reply("❌ No football news available at the moment.");
            }

            const news = items.slice(0, 8);

            let txt = `╭━━━━━━━━━━━╮\n`;
            txt += `│ 📰 ${toBold("FOOTBALL NEWS")}\n`;
            txt += `├━━━━━━━━━━━┤\n`;
            txt += `│ 📊 ${toSmallCaps("Latest Headlines")}\n`;
            txt += `╰━━━━━━━━━━━╯\n\n`;

            news.forEach((item, i) => {
                const date = item.createdAt
                    ? new Date(Number(item.createdAt)).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                      )
                    : "Recent";
                txt += `┏━ ${toBold(`News ${i + 1}`)} ━┓\n`;
                txt += `┃ 📰 ${toBold(item.title)}\n`;
                if (item.summary)
                    txt += `┃ 📝 ${item.summary.substring(0, 80)}...\n`;
                txt += `┃ 📅 ${date}\n`;
                txt += `┗━━━━━━━━━┛\n\n`;
            });

            txt += `🔗 ${toSmallCaps("More at:")} Keithsite.top/sports\n\n${config.FOOTER}`;

            await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: txt,
                },
                { quoted: mek },
            );
            await conn.sendMessage(from, {
                react: { text: "✅", key: mek.key },
            });
        } catch (err) {
            console.error("sportnews error:", err);
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key },
            });
            reply("❌ Failed to fetch football news.");
        }
    },
);

// ============================= TOPSCORERS =============================
cmd(
    {
        pattern: "topscorers",
        react: "⚽",
        alias: ["scorers", "goals", "goldenboot"],
        desc: "View top goal scorers across major leagues",
        category: "sports",
        use: "topscorers",
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, reply }) => {
        try {
            let info = `╭━━━━━━━━━━━╮
│ ⚽ ${toBold("TOP SCORERS")}
├━━━━━━━━━━━┤
│ ${numreplyMg || "Reply with number"}
├━━━━━━━━━━━┤\n`;

            const numrep = [];
            Object.entries(LEAGUE_CONFIG).forEach(([num, cfg]) => {
                info += `│ ${num}. ${cfg.emoji} ${cfg.name}\n`;
                numrep.push(`${prefix}topscorersget ${cfg.code}`);
            });
            info += `╰━━━━━━━━━━━╯`;

            const sentMsg = await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: info,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: sentMsg.key,
                numrep,
                method: "nondecimal",
            });
        } catch (err) {
            console.error("Topscorers error:", err);
            reply("❌ Error loading top scorers menu.");
        }
    },
);

// ============================= TOPSCORERS GET =============================
cmd(
    {
        pattern: "topscorersget",
        react: "⚽",
        alias: [],
        desc: "Get top scorers for a league",
        category: "sports",
        use: "topscorersget <code>",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, q }) => {
        try {
            const code = q?.toLowerCase()?.trim();
            const league = Object.values(LEAGUE_CONFIG).find(
                (l) => l.code === code,
            );

            if (!league) {
                return reply(
                    `❌ Invalid league code. Available: ${Object.values(
                        LEAGUE_CONFIG,
                    )
                        .map((l) => l.code)
                        .join(", ")}`,
                );
            }

            await conn.sendMessage(from, {
                react: { text: "⚽", key: mek.key },
            });

            const data = await fetchJson(
                `${SPORTS_API_BASE}/${league.code}/scorers`,
            );

            if (!data?.status || !Array.isArray(data?.result?.topScorers)) {
                return reply(`❌ Failed to fetch ${league.name} scorers.`);
            }

            let output = `╭━━━━━━━━━━━╮\n`;
            output += `│ ${league.emoji} ${toBold(league.name)}\n`;
            output += `│ ⚽ ${toSmallCaps("TOP SCORERS")}\n`;
            output += `╰━━━━━━━━━━━╯\n\n`;

            data.result.topScorers.slice(0, 15).forEach((scorer) => {
                const medal =
                    scorer.rank === 1
                        ? "🥇"
                        : scorer.rank === 2
                          ? "🥈"
                          : scorer.rank === 3
                            ? "🥉"
                            : "▪️";

                output += `${medal} ${toBold(`${scorer.rank}. ${scorer.player}`)}\n`;
                output += `   🏟️ ${scorer.team}\n`;
                output += `   ⚽ ${scorer.goals} goals | 🎯 ${scorer.assists} assists\n`;
                if (scorer.penalties > 0)
                    output += `   🎯 ${scorer.penalties} penalties\n`;
                output += `\n`;
            });

            output += `\n${config.FOOTER}`;
            await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: output,
                },
                { quoted: mek },
            );
        } catch (err) {
            console.error("topscorersget error:", err);
            reply(`❌ Error: ${err.message}`);
        }
    },
);

// ============================= STANDINGS =============================
cmd(
    {
        pattern: "standings",
        react: "📊",
        alias: ["leaguetable", "table", "league"],
        desc: "View current league standings",
        category: "sports",
        use: "standings",
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, reply }) => {
        try {
            let info = `╭━━━━━━━━━━━╮
│ 📊 ${toBold("STANDINGS")}
├━━━━━━━━━━━┤
│ ${numreplyMg || "Reply with number"}
├━━━━━━━━━━━┤\n`;

            const numrep = [];
            Object.entries(LEAGUE_CONFIG).forEach(([num, cfg]) => {
                info += `│ ${num}. ${cfg.emoji} ${cfg.name}\n`;
                numrep.push(`${prefix}standingsget ${cfg.code}`);
            });
            info += `╰━━━━━━━━━━━╯`;

            const sentMsg = await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: info,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: sentMsg.key,
                numrep,
                method: "nondecimal",
            });
        } catch (err) {
            console.error("Standings error:", err);
            reply("❌ Error loading standings menu.");
        }
    },
);

// ============================= STANDINGS GET =============================
cmd(
    {
        pattern: "standingsget",
        react: "📊",
        alias: [],
        desc: "Get standings for a league",
        category: "sports",
        use: "standingsget <code>",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, q }) => {
        try {
            const code = q?.toLowerCase()?.trim();
            const league = Object.values(LEAGUE_CONFIG).find(
                (l) => l.code === code,
            );

            if (!league) {
                return reply(`❌ Invalid league code.`);
            }

            await conn.sendMessage(from, {
                react: { text: "📊", key: mek.key },
            });

            const data = await fetchJson(
                `${SPORTS_API_BASE}/${league.code}/standings`,
            );

            if (!data?.status || !Array.isArray(data?.result?.standings)) {
                return reply(`❌ Failed to fetch ${league.name} standings.`);
            }

            let output = `╭━━━━━━━━━━━╮\n`;
            output += `│ ${league.emoji} ${toBold(league.name)}\n`;
            output += `│ 📊 ${toSmallCaps("STANDINGS")}\n`;
            output += `╰━━━━━━━━━━━╯\n\n`;

            data.result.standings.forEach((team) => {
                let zone = "";
                if (team.position <= 4) zone = "🏆";
                else if (team.position <= 6) zone = "🔵";
                else if (team.position >= 18) zone = "🔴";
                else zone = "⚪";

                const teamName =
                    team.team.length > 12
                        ? team.team.substring(0, 12)
                        : team.team;
                const gd =
                    team.goalDifference >= 0
                        ? `+${team.goalDifference}`
                        : team.goalDifference;
                output += `${zone}${team.position}. ${toBold(teamName)}\n`;
                output += `   P:${team.played} W:${team.won} Pts:${team.points} GD:${gd}\n\n`;
            });

            output += `_🏆UCL 🔵UEL 🔴Rel_\n\n${config.FOOTER}`;
            await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: output,
                },
                { quoted: mek },
            );
        } catch (err) {
            console.error("standingsget error:", err);
            reply(`❌ Error: ${err.message}`);
        }
    },
);

// ============================= FIXTURES =============================
cmd(
    {
        pattern: "fixtures",
        react: "📅",
        alias: ["upcomingmatches", "upcoming", "nextgames", "schedule"],
        desc: "View upcoming matches across major leagues",
        category: "sports",
        use: "fixtures",
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, reply }) => {
        try {
            let info = `╭━━━━━━━━━━━╮
│ 📅 ${toBold("FIXTURES")}
├━━━━━━━━━━━┤
│ ${numreplyMg || "Reply with number"}
├━━━━━━━━━━━┤\n`;

            const numrep = [];
            Object.entries(LEAGUE_CONFIG).forEach(([num, cfg]) => {
                info += `│ ${num}. ${cfg.emoji} ${cfg.name}\n`;
                numrep.push(`${prefix}fixturesget ${cfg.code}`);
            });
            info += `╰━━━━━━━━━━━╯`;

            const sentMsg = await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: info,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: sentMsg.key,
                numrep,
                method: "nondecimal",
            });
        } catch (err) {
            console.error("Fixtures error:", err);
            reply("❌ Error loading fixtures menu.");
        }
    },
);

// ============================= FIXTURES GET =============================
cmd(
    {
        pattern: "fixturesget",
        react: "📅",
        alias: [],
        desc: "Get fixtures for a league",
        category: "sports",
        use: "fixturesget <code>",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, q }) => {
        try {
            const code = q?.toLowerCase()?.trim();
            const league = Object.values(LEAGUE_CONFIG).find(
                (l) => l.code === code,
            );

            if (!league) {
                return reply(`❌ Invalid league code.`);
            }

            await conn.sendMessage(from, {
                react: { text: "📅", key: mek.key },
            });

            const data = await fetchJson(
                `${SPORTS_API_BASE}/${league.code}/upcomingmatches`,
            );

            if (
                !data?.status ||
                !Array.isArray(data?.result?.upcomingMatches)
            ) {
                return reply(`❌ No upcoming ${league.name} fixtures found.`);
            }

            let output = `╭━━━━━━━━━━━╮\n`;
            output += `│ ${league.emoji} ${toBold(league.name)}\n`;
            output += `│ 📅 ${toSmallCaps("FIXTURES")}\n`;
            output += `╰━━━━━━━━━━━╯\n\n`;

            data.result.upcomingMatches.slice(0, 15).forEach((match) => {
                output += `┏━ ${toBold(`MD ${match.matchday}`)} ━┓\n`;
                output += `┃ 🏟️ ${match.homeTeam}\n`;
                output += `┃ ⚔️ VS\n`;
                output += `┃ ✈️ ${match.awayTeam}\n`;
                output += `┃ 📅 ${match.date}\n`;
                output += `┗━━━━━━━━━┛\n\n`;
            });

            output += `\n${config.FOOTER}`;
            await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: output,
                },
                { quoted: mek },
            );
        } catch (err) {
            console.error("fixturesget error:", err);
            reply(`❌ Error: ${err.message}`);
        }
    },
);

// ============================= GAMEHISTORY =============================
cmd(
    {
        pattern: "gamehistory",
        react: "📋",
        alias: ["matchevents", "gameevents", "matchstats"],
        desc: "Get detailed match events and history",
        category: "sports",
        use: "gamehistory",
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, reply }) => {
        try {
            let info = `╭━━━━━━━━━━━╮
│ 📋 ${toBold("MATCH HISTORY")}
├━━━━━━━━━━━┤
│ ${numreplyMg || "Reply with number"}
├━━━━━━━━━━━┤\n`;

            const numrep = [];
            Object.entries(LEAGUE_CONFIG).forEach(([num, cfg]) => {
                info += `│ ${num}. ${cfg.emoji} ${cfg.name}\n`;
                numrep.push(`${prefix}gamehistoryget ${cfg.code}`);
            });
            info += `╰━━━━━━━━━━━╯`;

            const sentMsg = await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: info,
                },
                { quoted: mek },
            );

            await storenumrepdata({
                key: sentMsg.key,
                numrep,
                method: "nondecimal",
            });
        } catch (err) {
            console.error("Gamehistory error:", err);
            reply("❌ Error loading match history menu.");
        }
    },
);

// ============================= GAMEHISTORY GET =============================
cmd(
    {
        pattern: "gamehistoryget",
        react: "📋",
        alias: [],
        desc: "Get match history for a league",
        category: "sports",
        use: "gamehistoryget <code>",
        filename: __filename,
    },
    async (conn, mek, m, { from, reply, q }) => {
        try {
            const code = q?.toLowerCase()?.trim();
            const league = Object.values(LEAGUE_CONFIG).find(
                (l) => l.code === code,
            );

            if (!league) {
                return reply(`❌ Invalid league code.`);
            }

            await conn.sendMessage(from, {
                react: { text: "📋", key: mek.key },
            });

            const data = await fetchJson(
                `${SPORTS_API_BASE}/${league.code}/gamehistory`,
            );

            if (!data?.status || !Array.isArray(data?.result?.matches)) {
                return reply(`❌ No match history found for ${league.name}.`);
            }

            let output = `╭━━━━━━━━━━━╮\n`;
            output += `│ ${league.emoji} ${toBold(league.name)}\n`;
            output += `│ 📋 ${toSmallCaps("RECENT")}\n`;
            output += `╰━━━━━━━━━━━╯\n\n`;

            data.result.matches.slice(0, 10).forEach((match) => {
                output += `┏━━━━━━━━━┓\n`;
                output += `┃ 📅 ${match.date || "N/A"}\n`;
                output += `┃ ${toBold(match.homeTeam)} ${match.homeScore || 0}-${match.awayScore || 0} ${toBold(match.awayTeam)}\n`;
                if (match.events?.length) {
                    match.events.slice(0, 3).forEach((evt) => {
                        output += `┃ ${evt.minute}' ${evt.type === "goal" ? "⚽" : "🟨"} ${evt.player}\n`;
                    });
                }
                output += `┗━━━━━━━━━┛\n\n`;
            });

            output += `\n${config.FOOTER}`;
            await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: output,
                },
                { quoted: mek },
            );
        } catch (err) {
            console.error("gamehistoryget error:", err);
            reply(`❌ Error: ${err.message}`);
        }
    },
);

// ============================= SPORTS MENU =============================
cmd(
    {
        pattern: "sportsmenu",
        react: "⚽",
        alias: ["sportshelp", "footballmenu"],
        desc: "Show all sports commands",
        category: "sports",
        use: "sportsmenu",
        filename: __filename,
    },
    async (conn, mek, m, { from, prefix, reply }) => {
        try {
            const menuText = `
╭───❖ ⚽ ${toBold("SPORTS MENU")} ⚽ ❖───╮
│
│ 🎲 ${prefix}surebet - Betting tips
│ ⚽ ${prefix}livescore - Live scores
│ 📰 ${prefix}sportnews - Football news
│ ⚽ ${prefix}topscorers - Top scorers
│ 📊 ${prefix}standings - League table
│ 📅 ${prefix}fixtures - Upcoming matches
│ 📋 ${prefix}gamehistory - Match history
│
╰─────────────────────────╯

${toBold("Available Leagues:")}
🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League | 🇩🇪 Bundesliga
🇪🇸 La Liga | 🇫🇷 Ligue 1 | 🇮🇹 Serie A
🏆 UCL | 🌍 FIFA | 🇪🇺 Euro

${config.FOOTER}`;

            await conn.sendMessage(
                from,
                {
                    contextInfo: getContextInfo(
                        config.BOT_NAME !== "default" ? config.BOT_NAME : null,
                    ),
                    image: { url: SPORTS_IMAGE },
                    caption: menuText,
                },
                { quoted: mek },
            );
        } catch (e) {
            console.error(e);
            reply(errorMg);
        }
    },
);
