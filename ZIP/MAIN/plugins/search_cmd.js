import { fileURLToPath as __fileURLToPath } from "node:url";
const __filename = __fileURLToPath(import.meta.url);
import __import0 from "axios";
import * as __import1 from "cheerio";
import __import2 from "../command.js";
import __import3 from "../config.js";
import __import4 from "../lib/scraper.js";
import __import5 from "fs";
import __import6 from "path";
import * as __import7 from "child_process";
import __import8 from "util";
import __import9 from "../lib/numreply-db.js";
import __import10 from "../lib/functions.js";
import * as __import11 from "wa-sticker-formatter";
import __import12 from "../lib/language.json" with { type: 'json' };
// ============================= R E Q U E S T =============================
const axios = __import0;
const cheerio = __import1;
const { cmd } = __import2; 
const config = __import3;
const { getNpmPackageInfo, getNpmDownloads, getGithubUser, tiktokSearch } = __import4;

const fs = __import5;
const path = __import6;
const { exec } = __import7;
const OMDB_API_KEY = "da3d5959";
const TMDB_API_KEY = "91c9bde7f4f9487b7b4f75d6c6dfc84b"; 
const util = __import8
const { storenumrepdata } = __import9;
const {getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = __import10;
const { Sticker, StickerTypes } = __import11;
const botName = config.BOT_NAME && config.BOT_NAME !== "default" ? config.BOT_NAME : null;

// ============================= L A N G U A G E =============================
var allLangs = __import12;
var LANG = config.LANG === 'EN' ? 'EN' 
         : config.LANG === 'FR' ? 'FR' 
         : 'EN';

var lang = allLangs[LANG];
var enterMovieOrTVShowName, noResultsFound, invalidChoice, errorProcessingSelection, errorFetchingMovieDetails, needPnum, errorMg = lang;

// ============================= C M D =============================
cmd({
    pattern: "npm",
    alias: ["npminfo", "package", "pkginfo"],
    desc: "Get detailed information about npm packages",
    category: "search",
    react: "📦",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) {
            return await reply(`❌ *Please provide a package name!*\n\n📝 *Usage:* ${prefix}npm <package-name>\n📝 *Example:* ${prefix}npm express`);
        }

        const packageName = q.trim().toLowerCase();
        
        try {
            // Fetch package data from npm registry
            const response = await axios.get(`https://registry.npmjs.org/${packageName}`, {
                timeout: 10000
            });

            const packageData = response.data;
            const latestVersion = packageData['dist-tags']?.latest || 'Unknown';
            const versions = Object.keys(packageData.versions || {});
            const latestVersionData = packageData.versions?.[latestVersion] || {};

            // Format the information
     let info = `NPM Package Information\n\n`;
info += `➠ Name           : ${packageData.name || 'N/A'}\n`;
info += `➠ Description    : ${packageData.description || 'No description available'}\n`;
info += `➠ Latest Version : ${latestVersion}\n`;
info += `➠ Total Versions : ${versions.length}\n`;
info += `➠ Author         : ${packageData.author?.name || latestVersionData.author?.name || 'N/A'}\n`;
info += `➠ Homepage       : ${packageData.homepage || latestVersionData.homepage || 'N/A'}\n`;
info += `➠ License        : ${packageData.license || latestVersionData.license || 'N/A'}\n`;
            // Repository information
            if (packageData.repository?.url || latestVersionData.repository?.url) {
                const repoUrl = (packageData.repository?.url || latestVersionData.repository?.url)
                    .replace('git+', '')
                    .replace('.git', '')
                    .replace('git://', 'https://');
                info += `🗂️ *Repository:* ${repoUrl}\n`;
            }

            // Keywords
            const keywords = packageData.keywords || latestVersionData.keywords || [];
            if (keywords.length > 0) {
                info += `🏷️ *Keywords:* ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? '...' : ''}\n`;
            }

            // Dependencies
            const dependencies = latestVersionData.dependencies || {};
            const depCount = Object.keys(dependencies).length;
            if (depCount > 0) {
                info += `📦 *Dependencies:* ${depCount}\n`;
            }

            // Download stats (using npms.io API for additional stats)
            try {
                const statsResponse = await axios.get(`https://api.npms.io/v2/package/${packageName}`, {
                    timeout: 5000
                });
                const stats = statsResponse.data;
                
                if (stats.evaluation?.popularity?.downloadsCount) {
                    info += `⬇️ *Downloads:* ${stats.evaluation.popularity.downloadsCount.toLocaleString()}\n`;
                }
                
                if (stats.score?.final) {
                    const score = (stats.score.final * 100).toFixed(1);
                    info += `⭐ *Quality Score:* ${score}%\n`;
                }
            } catch (statsError) {
                // Stats API failed, continue without stats
            }

            // Installation command
            info += `\n💻 *Installation:*\n`;
            info += `\`\`\`npm install ${packageName}\`\`\`\n`;
            info += `\`\`\`yarn add ${packageName}\`\`\`\n\n`;
            
            // Links
            info += `🔗 *Links:*\n`;
            info += `• NPM: https://www.npmjs.com/package/${packageName}\n`;
            
            if (packageData.repository?.url) {
                const repoUrl = packageData.repository.url
                    .replace('git+', '')
                    .replace('.git', '')
                    .replace('git://', 'https://');
                info += `• Repository: ${repoUrl}\n`;
            }

            info += `\n> ${config.FOOTER}`;

            // Send with NPM logo
            await conn.sendMessage(from, {
                image: { url: "https://raw.githubusercontent.com/npm/logos/master/npm%20logo/npm-logo-red.png" },
                caption: info
            }, { quoted: mek });

        } catch (apiError) {
            if (apiError.response?.status === 404) {
                await reply(`❌ *Package not found!*\n\n🔍 Package "${packageName}" doesn't exist on NPM registry.\n\n💡 *Tip:* Check the package name spelling and try again.`);
            } else {
                throw apiError;
            }
        }

    } catch (error) {
        console.error('NPM Plugin Error:', error);
        await reply(`❌ *Error occurred while fetching package information*\n\n🔧 *Error:* ${error.message}\n\n💡 *Try again later or check your internet connection.*`);
    }
});

// Additional command to search npm packages
cmd({
    pattern: "npmsearch",
    alias: ["searchnpm", "pkgsearch"],
    desc: "Search for npm packages",
    category: "search", 
    react: "🔍",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) {
            return await reply(`❌ *Please provide a search query!*\n\n📝 *Usage:* ${prefix}npmsearch <search-term>\n📝 *Example:* ${prefix}npmsearch web framework`);
        }

        const searchQuery = q.trim();
        
        try {
            // Search using npms.io API
            const response = await axios.get(`https://api.npms.io/v2/search`, {
                params: {
                    q: searchQuery,
                    size: 10
                },
                timeout: 10000
            });

            const results = response.data.results;

            if (!results || results.length === 0) {
                return await reply(`❌ *No packages found for "${searchQuery}"*\n\n💡 *Try different search terms.*`);
            }

            let searchResults = `🔍 *NPM Search Results for "${searchQuery}"*\n\n`;

            results.slice(0, 8).forEach((result, index) => {
                const pkg = result.package;
                const score = (result.score.final * 100).toFixed(1);
                
                searchResults += `${index + 1}. 📦 *${pkg.name}*\n`;
                searchResults += `   📄 ${pkg.description?.substring(0, 80)}${pkg.description?.length > 80 ? '...' : ''}\n`;
                searchResults += `   🔢 v${pkg.version} | ⭐ ${score}%\n`;
                searchResults += `   💻 \`npm install ${pkg.name}\`\n\n`;
            });

            searchResults += `🔗 *More results:* https://www.npmjs.com/search?q=${encodeURIComponent(searchQuery)}\n\n`;
            searchResults += `💡 *Use* \`${prefix}npm <package-name>\` *to get detailed info about a package*\n\n`;
            searchResults += `> ${config.FOOTER}`;

            await reply(searchResults);

        } catch (apiError) {
            throw apiError;
        }

    } catch (error) {
        console.error('NPM Search Plugin Error:', error);
        await reply(`❌ *Error occurred while searching packages*\n\n🔧 *Error:* ${error.message}\n\n💡 *Try again later or check your internet connection.*`);
    }
});


cmd({
    pattern: "github",
    alias: ["git", "gh", "githubuser"],
    react: "🐙",
    desc: "Get GitHub user details including profile picture",
    category: "search",
    use: '.github <username>',
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, pushname, reply, prefix }) => {

    try {
        if (!q) {
            return reply(`❌ Please provide a GitHub username!\n\n📝 *Usage:* ${prefix}github <username>\n💡 *Example:* ${prefix}github torvalds`);
        }

        const username = q.trim();
        

        try {
            // Fetch user data from GitHub API
            const response = await axios.get(`https://api.github.com/users/${username}`, {
                headers: {
                    'User-Agent': 'PRINCE-MDX-Bot'
                }
            });

            const user = response.data;

            // Check if user exists
            if (!user || user.message === 'Not Found') {
                return reply(`❌ User *${username}* not found on GitHub!\n\n💡 Please check the username and try again.`);
            }

            // Format user details
            const userInfo = `
GITHUB USER DETAILS

➠ Name         : ${user.name || 'Not provided'}
➠ Username     : @${user.login}
➠ Email        : ${user.email || 'Not public'}
➠ Company      : ${user.company || 'Not specified'}
➠ Location     : ${user.location || 'Not specified'}
➠ Blog/Website : ${user.blog || 'None'}
➠ Bio          : ${user.bio || 'No bio available'}

STATISTICS
➠ Public Repos : ${user.public_repos}
➠ Followers    : ${user.followers}
➠ Following    : ${user.following}
➠ Public Gists : ${user.public_gists}

➠ Account Created : ${new Date(user.created_at).toDateString()}
➠ Last Updated    : ${new Date(user.updated_at).toDateString()}

➠ Profile URL : ${user.html_url}

${config.FOOTER}`;

            // Send user details with profile picture
            if (user.avatar_url) {
                await conn.sendMessage(from, {
                    image: { url: user.avatar_url  },
                    caption: userInfo
                }, { quoted: mek });
            } else {
                await reply(userInfo);
            }

        } catch (apiError) {
            console.error('GitHub API Error:', apiError);
            
            if (apiError.response && apiError.response.status === 404) {
                return reply(`❌ User *${username}* not found on GitHub!\n\n💡 Please check the username and try again.`);
            } else if (apiError.response && apiError.response.status === 403) {
                return reply(`⚠️ GitHub API rate limit exceeded. Please try again later.`);
            } else {
                return reply(`❌ An error occurred while fetching user details.\n\n🔧 Please try again later or contact the developer.`);
            }
        }

    } catch (error) {
        console.error('GitHub Plugin Error:', error);
        reply(`❌ An unexpected error occurred!\n\n🔧 Please try again later.`);
    }
});

// Additional command for GitHub repository search
cmd({
    pattern: "gitrepo",
    alias: ["grepo", "githubRepo"],
    react: "📁",
    desc: "Get GitHub repository details",
    category: "search",
    use: '.gitrepo <username/repository>',
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, pushname, reply, prefix }) => {

    try {
        if (!q) {
            return reply(`❌ Please provide a repository path!\n\n📝 *Usage:* ${prefix}gitrepo <username/repository>\n💡 *Example:* ${prefix}gitrepo microsoft/vscode`);
        }

        const repoPath = q.trim();
        
        // Validate repository path format
        if (!repoPath.includes('/') || repoPath.split('/').length !== 2) {
            return reply(`❌ Invalid repository format!\n\n📝 *Correct format:* username/repository\n💡 *Example:* microsoft/vscode`);
        }


        try {
            const response = await axios.get(`https://api.github.com/repos/${repoPath}`, {
                headers: {
                    'User-Agent': 'PRINCE-MDX-Bot'
                }
            });

            const repo = response.data;
const repoInfo = `
GITHUB REPOSITORY

➠ Repository      : ${repo.name}
➠ Owner           : @${repo.owner.login}
➠ Full Name       : ${repo.full_name}
➠ Description     : ${repo.description || 'No description available'}

➠ Language        : ${repo.language || 'Not specified'}
➠ Size            : ${repo.size} KB
➠ Stars           : ${repo.stargazers_count}
➠ Forks           : ${repo.forks_count}
➠ Watchers        : ${repo.watchers_count}
➠ Issues          : ${repo.open_issues_count}

➠ Created         : ${new Date(repo.created_at).toDateString()}
➠ Updated         : ${new Date(repo.updated_at).toDateString()}
➠ Last Push       : ${new Date(repo.pushed_at).toDateString()}

➠ Visibility      : ${repo.private ? 'Private' : 'Public'}
➠ Fork            : ${repo.fork ? 'Yes' : 'No'}
➠ License         : ${repo.license ? repo.license.name : 'No license'}

➠ Clone URL       : ${repo.clone_url}
➠ Repository URL  : ${repo.html_url}

${config.FOOTER}`;

            await reply(repoInfo);

        } catch (apiError) {
            console.error('GitHub Repo API Error:', apiError);
            
            if (apiError.response && apiError.response.status === 404) {
                return reply(`❌ Repository *${repoPath}* not found!\n\n💡 Please check the repository path and try again.`);
            } else if (apiError.response && apiError.response.status === 403) {
                return reply(`⚠️ GitHub API rate limit exceeded. Please try again later.`);
            } else {
                return reply(`❌ An error occurred while fetching repository details.\n\n🔧 Please try again later.`);
            }
        }

    } catch (error) {
        console.error('GitHub Repo Plugin Error:', error);
        reply(`❌ An unexpected error occurred!\n\n🔧 Please try again later.`);
    }
});


cmd({
    pattern: "omdb",
    alias: ["imdbsearch", "imdb"],
    desc: "Search for Movies/TV Shows using OMDB",
    category: "search",
    use: "omdb <Movie/TV Show Name>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return await reply("❗️ Please provide a Movie/TV Show name.");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const searchUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl);

        if (!searchRes.data || !searchRes.data.Search || searchRes.data.Search.length === 0) {
            return await reply("❌ No results found.");
        }

        const topResults = searchRes.data.Search.slice(0, 5);
        const numrep = [];
        const tex = `\`🎬 OMDB Search Result List\`\n\n*Query:* ${q}\nSelect an option below to view details.`;


    } catch (error) {
        console.error(error);
        await reply("❌ Error fetching movie details.");
    }
});

cmd({
    pattern: "omdbget",
    react: "🎬",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    try {
        const [type, id] = args;
        if (!type || !id) return await reply("❗️ Invalid command usage. Usage: omdbget <type> <imdbID>");

        const detailsUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}&plot=full`;
        const res = await axios.get(detailsUrl);
        const details = res.data;

        if (details.Response === "False") return await reply("❌ No details found for this item.");
        
        const title = details.Title || "N/A";
        const year = details.Year || "N/A";
        const genres = details.Genre || "N/A";
        const imdbrating = `${details.imdbRating}/10` || "N/A";
        const released = details.Released || "N/A";
        const duration = details.Runtime || "N/A";
        const director = details.Director || "N/A";
        const cast = details.Actors || "N/A";
        const plot = details.Plot || "N/A";
        const url = `https://www.imdb.com/title/${details.imdbID}` || "N/A";
        const footer = config.FOOTER;
        const caption = config.CAPTION || config.FOOTER;

        let omdbInfo = (config.OMDB_DETAILS_CARD && config.OMDB_DETAILA_CARD !== "default") ? formatMessage(config.OMDB_DETAILS_CARD, { title, year, genre, imdbrating, released, duration, director, cast, plot, url, footer, caption }) : `🎬 *${title}* (${year})
        
        🎭 *Genres:* ${genres}
        ⭐ *IMDB Rating:* ${imdbrating}
        📅 *Released:* ${released}
        ⏳ *Runtime:* ${duration}
        🎬 *Director:* ${director}
        👥 *Actors:* ${cast}
        📝 *Plot:* ${plot}
        🔗 *Link:* ${url}
        
        ${footer}`;

        await conn.sendMessage(m.chat, {
            image: { url: details.Poster.replace(/_SX300/, "_SX0") },
            caption: omdbInfo
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        await reply("❌ Error processing movie/TV show selection.");
    }
});


cmd({
    pattern: "tv",
    alias: ["movie", "tv"],
    desc: "Get Movie/TV Show details from TMDB.",
    category: "search",
    use: "tmdb <Movie/TV Show Name>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return await reply("❗️ Please provide a Movie/TV Show name.");

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
        const searchRes = await axios.get(searchUrl);

        if (!searchRes.data || !searchRes.data.results || searchRes.data.results.length === 0) {
            return await reply(noResultsFound);
        }

        const topResults = searchRes.data.results.slice(0, 5); // limit results
        const numrep = [];
        let tex = `\`🎬 TMDB Search Result List\`\n\n*Query:* ${q}\nSelect an option below to view details.`;


    } catch (error) {
        console.error(error);
        await reply(errorFetchingMovieDetails);
    }
});

cmd({
    pattern: "tmdbget",
    react: "🎬",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    try {
        const [type, id] = args;
        if (!type || !id) return await reply("❗️ Invalid command usage.");

        const detailsUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos`;
        const res = await axios.get(detailsUrl);
        const details = res.data;

        let trailerUrl = "No Trailer Available";
        const trailer = details.videos?.results?.find(v => v.type === "Trailer");
        if (trailer) {
            trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
        
        const title = details.title || deails.name || "N/A";
        const released = details.release_date || details.first_air_date || "N/A";
        const imdbrating = `${details.vote_average}/10` || "N/A";
        const genres = details.genres.map(g => g.name).join(", ") || "N/A";
        const overview = overview || "N/A";
        const trailerurl = trailerUrl || "N/A";
        const footer = config.FOOTER;
        const caption = config.CAPTION || config.FOOTER;

        let msg = (config.TMDB_DETAILS_CARD && config.TMDB_DETAILS_CARD !== "default") ? formatMessage(config.TMDB_DETAILS_CARD, { title, released, imdbrating, genres, overview, trailerurl, footer, caption }) : `🎬 *${title}*
        
        📅 *Released:* ${released}
        ⭐ *Rating:* ${imdbrating}
        🎭 *Genres:* ${genres}
        📖 *Overview:* ${overview}
        🎥 *Trailer:* ${trailerurl}
        
        ${footer}`;

        await conn.sendMessage(m.chat, {
            image: { url: `https://image.tmdb.org/t/p/original${details.poster_path}` },
            caption: msg
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        await reply(errorProcessingSelection);
    }
});



cmd({
    pattern: "google",
    alias: ["gs"],
    react: '🔎',
    desc: "Search something on Google",
    category: "search",
    use: 'google < query >',
    filename: __filename
},
async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) return reply("Please enter a search term ❗️");

        const { data } = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
            params: {
                q: q,
                key: 'AIzaSyDMbI3nvmQUrfjoCJYLS69Lej1hSXQjnWI',
                cx: 'baf9bdb0c631236e5'
            }
        });

        if (!data?.items || data.items.length === 0) {
            return reply(noResultsFound);
        }

        let tex = `🔍 *Google Search Results*\n\n`;
        for (let i = 0; i < Math.min(5, data.items.length); i++) {
            tex += `*${i + 1}. ${data.items[i].title}*\n_${data.items[i].snippet}_\n🔗 ${data.items[i].link}\n\n`;
        }

        await reply(tex);

    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});


cmd({
    pattern: "truecall",
    alias: ["numverify", "lookup", "numlookup"],
    react: "💯",
    desc: "Lookup phone number information",
    category: "search",
    use: "truecall <phone_number>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❗ Please provide a phone number.\n\nExample: `.numlookup +14158586273`");

        const number = encodeURIComponent(q.trim());
        const apiKey = '60b1c47a51ca0189e59ca12c2b6c956d';

        const { data } = await axios.get(`http://apilayer.net/api/validate?access_key=${apiKey}&number=${number}`);

        if (!data.valid) {
            return reply("❌ Invalid phone number or API error.");
        }

            const info = `🔎 *Phone Number Lookup*\n\n` +
             `📞 Number: *${data.international_format}*\n` +
             `🌍 Country: *${data.country_name}* (${data.country_code})\n` +
             `📌 Location: *${data.location || "Not Available"}*\n` +
             `📡 Carrier: *${data.carrier || "Not Detected"}*\n` +
             `📱 Line Type: *${data.line_type || "Unknown"}*\n\n` +
             `> ${config.FOOTER}`;


        await conn.sendMessage(from, { text: info }, { quoted: mek });

    } catch (err) {
        console.error(err);
        return reply("⚠️ An error occurred while looking up the phone number.");
    }
});

cmd({
    pattern: "tiktoksearch",
    alias: ["tiktoks", "ttsearch"],
    react: '🔎',
    desc: "Search tiktok videos",
    category: "search",
    use: 'tiktoksearch < query >',
    filename: __filename
},
async (conn, mek, m, { q, reply, from, prefix }) => {
    try {
        if (!q) return reply("Please enter a search term ❗️");

        const data = await tiktokSearch(q);

        if (!data || data.length === 0) {
            return reply(noResultsFound);
        }

        const numrep = [];
        

        let tex = `\`💈 PRINCE-MDX 𝖳𝖨𝖪𝖳𝖮𝖪 𝖲𝖤𝖠𝖱𝖢𝖧𝖤𝖱 💈\`\n`;


    } catch (e) {
        console.error(e);
        await reply(errorMg);
    }
});
