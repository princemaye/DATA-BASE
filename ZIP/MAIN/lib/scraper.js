import __import0 from "axios";
import __import1 from "crypto";
import * as __import2 from "cheerio";
import __import3 from "querystring";
import __import4 from "yt-search";
import * as __import5 from "fs";
import * as __import6 from "path";
import * as __import7 from "child_process";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const __dirname = __pathDirname(__fileURLToPath(import.meta.url));
const axios = __import0;
const crypto = __import1;
const cheerio = __import2;
const qs = __import3;
const file_size_url = (...args) => import('file_size_url').then(({ default: file_size_url }) => file_size_url(...args));
const yts = __import4;
const creator = "Dark-Yasiya";
const { promises } = __import5;
const { join } = __import6;
const { spawn } = __import7;

// ====================================== D O W N L O A D ======================================
async function ytmp3_v2(set) { 
  try {
    if (!set) {
      return { success: false, message: 'Invalid or missing URL' };
    }

    const response = await fetch('https://yt-five-tau.vercel.app/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: set, format: 'mp3' })
    });

    if (!response.ok) {
      return { success: false, message: `API Error: ${response.statusText}` };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}



async function fbdownload(url) {
    try {
        if (!url) throw new Error("URL is required");

        // List of reliable APIs (updated regularly)
        const apis = [
            {
                name: "SocialDownloader",
                url: `https://api.socialdownloader.social/facebook/download?url=${encodeURIComponent(url)}`,
                parser: (data) => {
                    if (data.success && data.download_url) {
                        return {
                            title: data.title || "Facebook Video",
                            sd: data.download_url,
                            hd: data.hd_url || data.download_url,
                            image: data.thumbnail,
                            duration: data.duration
                        };
                    }
                    throw new Error("Invalid response");
                }
            },
            {
                name: "VideoDownloaderAPI",
                url: `https://api.videodownloader.photo/api/facebook?url=${encodeURIComponent(url)}`,
                parser: (data) => {
                    if (data.status === "ok") {
                        return {
                            title: data.title || "Facebook Video",
                            sd: data.url,
                            hd: data.hd || data.url,
                            image: data.thumb,
                            duration: "N/A"
                        };
                    }
                    throw new Error("Invalid response");
                }
            },
            {
                name: "DLFacebook",
                url: `https://dlfb.org/api/v1/download?url=${encodeURIComponent(url)}`,
                parser: (data) => {
                    if (data.success) {
                        // Find best quality
                        let sd = null;
                        let hd = null;
                        
                        if (data.formats && Array.isArray(data.formats)) {
                            const qualities = data.formats.sort((a, b) => {
                                // Sort by quality: hd > sd > low
                                const qualityOrder = { 'hd': 3, 'sd': 2, 'low': 1 };
                                return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
                            });
                            
                            sd = qualities.find(f => f.quality === 'sd')?.url || qualities[0]?.url;
                            hd = qualities.find(f => f.quality === 'hd')?.url || sd;
                        }
                        
                        return {
                            title: data.title || "Facebook Video",
                            sd: sd || data.url,
                            hd: hd || data.url,
                            image: data.thumbnail,
                            duration: data.duration
                        };
                    }
                    throw new Error("Invalid response");
                }
            },
            {
                name: "FBVideoAPI",
                url: `https://api.fbvideodownloader.org/download?url=${encodeURIComponent(url)}`,
                parser: (data) => {
                    if (data.success) {
                        return {
                            title: data.video_title || "Facebook Video",
                            sd: data.links.sd || data.links.download,
                            hd: data.links.hd || data.links.sd || data.links.download,
                            image: data.thumbnail,
                            duration: data.duration
                        };
                    }
                    throw new Error("Invalid response");
                }
            }
        ];

        // Try each API until one works
        for (const api of apis) {
            try {
                console.log(`Trying ${api.name}...`);
                
                const response = await fetch(api.url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        "Accept": "application/json"
                    },
                    timeout: 8000 // 8 second timeout per API
                });
                
                if (!response.ok) {
                    console.log(`${api.name} HTTP error: ${response.status}`);
                    continue;
                }
                
                const data = await response.json();
                const result = await api.parser(data);
                
                return {
                    success: true,
                    code: 200,
                    result: {
                        title: result.title,
                        desc: "Facebook Video",
                        duration: result.duration || "N/A",
                        image: result.image,
                        sd: result.sd,
                        hd: result.hd
                    }
                };
                
            } catch (apiError) {
                console.log(`${api.name} failed:`, apiError.message);
                continue;
            }
        }
        
        // Fallback: Try a simple HTML parser as last resort
        return await fallbackFbDownload(url);

    } catch (error) {
        console.error("Facebook download error:", error.message);
        return {
            success: false,
            error: "Failed to download Facebook video. The video might be private or the service is temporarily unavailable."
        };
    }
}

async function fallbackFbDownload(url) {
    try {
        // Simple fallback using a different approach
        const response = await fetch(`https://getfbstuff.com/api/download?url=${encodeURIComponent(url)}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    code: 200,
                    result: {
                        title: data.title || "Facebook Video",
                        desc: "Facebook Video",
                        duration: "N/A",
                        image: null,
                        sd: data.download_link,
                        hd: data.download_link
                    }
                };
            }
        }
        
        throw new Error("Fallback also failed");
        
    } catch (fallbackError) {
        throw new Error("All download methods failed");
    }
}
async function ytsearch(teks) {
    try {
        let data = await yts(teks);
        return {
            status: true,
            creator: creator,
            results: data.all
        };
    } catch (error) {
        return {
            status: false,
            message: error.message
        };
    }
}


async function ytmp3(url) {
    try {
        const downloadResponse = await axios.post(
            "https://api.grabtheclip.com/submit-download",
            {
                url: url,
                height: 0,
                media_type: "audio"
            },
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
                }
            }
        );

        let task_id = downloadResponse?.data?.task_id;
        let data = (await yts(url)).all[0];
        let downloadUrl = null;

        do {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Puka cududa
            let response = await axios.get(`https://api.grabtheclip.com/get-download/${task_id}`);
            downloadUrl = response?.data?.result?.url;
        } while (!downloadUrl);

        return {
            status: true,
            creator: creator,
            task_id: task_id,
            result: {
              data,
            download: {
                url: downloadUrl
            }
         }
      };
    } catch (error) {
        console.log(error);
        return {
            status: false,
            creator: creator,
            error: error.message
        };
    }
}


async function ytmp4(url, quality = 360) {
  try {

      if(!url) throw new Error("Url required 📛")
      const downloadResponse = await axios.post(
          "https://api.grabtheclip.com/submit-download",
          {
              url: url,
              height: quality,
              media_type: "video"
          },
          {
              headers: {
                  "Accept": "application/json",
                  "Content-Type": "application/json",
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
              }
          }
      );

      let task_id = downloadResponse?.data?.task_id;
      let data = (await yts(url)).all[0];
      let downloadUrl = null;

      do {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Puka cududa
          let response = await axios.get(`https://api.grabtheclip.com/get-download/${task_id}`);
          downloadUrl = response?.data?.result?.url;
      } while (!downloadUrl);

      return {
          status: true,
          creator: creator,
          task_id: task_id,
          result: {
            data,
          download: {
              url: downloadUrl
          }
       }
    };
  } catch (error) {
      console.log(error);
      return {
          status: false,
          creator: creator,
          error: error.message
      };
  }
}

async function tiktok(url, count = 12, cursor = 0, web = 1, hd = 1) {
  try {
    const baseUrl = "https://tikwm.com";
    const payload = qs.stringify({
      url,
      count,
      cursor,
      web,
      hd
    });

    const headers = {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'origin': baseUrl,
      'referer': baseUrl
    };

    const response = await axios.post("https://tikwm.com/api/", payload, { headers });

    const data = response?.data?.data;
    if (!data) throw new Error("Invalid response from API.");

    // Function to ensure URLs are correct
    const fixUrl = (url) => (url?.startsWith("http") ? url : baseUrl + url);

    const result = {
      status: true,
      creator: creator,
      result: {
        id: data.id,
        region: data.region,
        title: data.title,
        cover: fixUrl(data.cover),
        duration: data.duration,
        play: fixUrl(data.play),
        sd: fixUrl(data.wmplay),
        hd: fixUrl(data.hdplay),
        music: fixUrl(data.music),
        play_count: data.play_count,
        digg_count: data.digg_count,
        comment_count: data.comment_count,
        share_count: data.share_count,
        download_count: data.download_count,
        collect_count: data.collect_count,
      },
    };

    return result;
  } catch (error) {
    console.error("Error fetching TikTok video:", error);
    return {
      status: false,
      creator: creator,
      error: error.message,
    };
  }
}

async function tiktok_v2(url) {
  try {
    const baseUrl = "https://ttsave.app/";

    const response = await axios.post(
      `${baseUrl}download`,
      { query: url, language_id: '1' },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
          Referer: `${baseUrl}en`,
        },
      }
    );

    const $ = cheerio.load(response.data);
    const sd = $("#button-download-ready > a:nth-child(2)").attr("href");
    const hd = $("#button-download-ready > a:nth-child(1)").attr("href");
    const audio = $("#button-download-ready > a:nth-child(3)").attr("href");
    const cover = $("#button-download-ready > a:nth-child(4)").attr("href");

    return {
      status: true,
      creator: '',
      result: {
        sd,
        hd,
        audio,
        cover
      }
    }
  } catch(e){
    console.error(e);
    return null
  }
}

async function tiktokSearch(keywords, count = 12, cursor = 0, web = 1, hd = 1) {
  try {
    const baseUrl = "https://tikwm.com";
    const payload = qs.stringify({
      keywords,
      count,
      cursor,
      web,
      hd
    });

    const headers = {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'origin': baseUrl,
      'referer': baseUrl
    };

    const response = await axios.post("https://tikwm.com/api/feed/search", payload, { headers });

    const data = response?.data?.data?.videos;
    if (!data) throw new Error("Invalid response from API");

  return data.map(item => {
    const fix = (url) => url?.startsWith("http") ? url : baseUrl + url;

    return {
      id: item.video_id,
      title: item.title?.trim() || "No title",
      region: item.region,
      duration: item.duration + "s",
      views: item.play_count,
      likes: item.digg_count,
      comments: item.comment_count,
      shares: item.share_count,
      downloads: item.download_count,
      created_at: new Date(item.create_time * 1000).toISOString(),
      video_url: fix(item.play),
      video_url_wm: fix(item.wmplay),
      cover: fix(item.cover),
      music: {
        id: item.music_info?.id || "",
        title: item.music_info?.title || "",
        url: item.music_info?.play || fix(item.music),
        author: item.music_info?.author || "",
        duration: item.music_info?.duration || 0,
        album: item.music_info?.album || ""
      },
      author: {
        id: item.author?.id || "",
        username: item.author?.unique_id || "",
        nickname: item.author?.nickname || "",
        avatar: fix(item.author?.avatar)
      }
    };
  });

  } catch (error) {
    console.error("Error fetching TikTok videos:", error.message);
    return {
      status: false,
      error: error.message
    };
  }
}

async function getNpmPackageInfo(packageName) {
    try {
        const res = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const data = res.data;
        const latestVersion = data["dist-tags"].latest;
        const packageInfo = data.versions[latestVersion];

        return {
            name: data.name,
            version: latestVersion,
            description: data.description || "No description available.",
            license: packageInfo.license || "No license info",
            homepage: packageInfo.homepage || "No homepage",
            repository: packageInfo.repository
                ? packageInfo.repository.url.replace("git+", "").replace(".git", "")
                : "No repository",
            bugs: packageInfo.bugs ? packageInfo.bugs.url : "No bug tracker",
            downloads: await getNpmDownloads(packageName),
            maintainers: data.maintainers ? data.maintainers.map(m => m.name).join(", ") : "Unknown",
            keywords: packageInfo.keywords ? packageInfo.keywords.join(", ") : "No keywords",
            lastPublished: new Date(data.time[latestVersion]).toLocaleString(),
            image: "https://static-00.iconduck.com/assets.00/npm-icon-2048x2048-8sw7kisf.png"
        };
    } catch (error) {
        return { error: "❌ Package not found or API error." };
    }
}

async function getNpmDownloads(packageName) {
    try {
        const res = await axios.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        return res.data.downloads || "Unknown";
    } catch {
        return "Unknown";
    }
}

async function ytmp4_v2(url, format = "360") {
    try {
        if (!url) throw new Error("URL parameter is required.");
        
        // Format handling: Remove 'p' or 'P'
        format = format.replace(/p/gi, "");
        
        const firstUrl = `https://p.savenow.to/ajax/download.php?format=${format}&url=${url}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        };
        
        const firstResponse = await axios.get(firstUrl, { headers });
        if (!firstResponse?.data?.repeat_download === false) throw new Error("Video download is not available.");
        
        const id = firstResponse.data.id;
        
        let attempts = 0;
        const maxAttempts = 100; // Limit retries

        const checkProgress = async () => {
            if (attempts >= maxAttempts) throw new Error("Download timeout.");
            attempts++;
            
            const secondUrl = `https://p.savenow.to/api/progress?id=${id}`;
            try {
                const secondResponse = await axios.get(secondUrl);
                const { download_url, text } = secondResponse.data;
                
                if (text === "Finished") return download_url;
                await new Promise(resolve => setTimeout(resolve, 2000));
                return checkProgress();
            } catch (error) {
                throw new Error(`Error in progress check: ${error.message}`);
            }
        };
        
        // Extract video details
        let videoIdMatch = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
        if (!videoIdMatch) throw new Error("Invalid YouTube URL");
        
        let data = await yts({ videoId: videoIdMatch[1] });
        
        const result = {
            status: true,
            creator: creator,
            result: data,
            download: {
                url: await checkProgress()
            }
        };
        
        return result;
    } catch (error) {
        console.error(error);
        return {
            status: false,
            message: error.message
        };
    }
}

async function mediaFire(url) {
  try {
    const response = await fetch('https://r.jina.ai/' + url, {
      headers: {
        'x-return-format': 'html',
      }
    });
    const text = await response.text();
    const $ = cheerio.load(text);
  
    const Time = $('div.DLExtraInfo-uploadLocation div.DLExtraInfo-sectionDetails').text().match(/This file was uploaded from (.*?) on (.*?) at (.*?)\n/);
    const result = {
      title: $('div.dl-btn-label').text().trim(),
      link: $('div.dl-utility-nav a').attr('href'),
      filename: $('div.dl-btn-label').attr('title'),
      url: $('a#downloadButton').attr('href'),
      size: $('a#downloadButton').text().match(/\((.*?)\)/)[1],
      from: Time[1],
      date: Time[2],
      time: Time[3],
      map: {
        background: "https://static.mediafire.com/images/backgrounds/download/additional_content/world.svg",
        region: "https://static.mediafire.com/images/backgrounds/download/additional_content/"+$('div.DLExtraInfo-uploadLocationRegion').attr('data-lazyclass')+".svg",
      },
      repair: $('a.retry').attr('href'),
    };

    
    return result;
  } catch (error) {
    return { error: error.message };
  }
}


const APIs = {
    1: 'https://apkcombo.com',
    2: 'https://apk-dl.com',
    3: 'https://apk.support',
    4: 'https://apps.evozi.com/apk-downloader',
    5: 'http://ws75.aptoide.com/api/7',
    6: 'https://cafebazaar.ir'
};

const Proxy = (url) => (url ? `https://translate.google.com/translate?sl=en&tl=fr&hl=en&u=${encodeURIComponent(url)}&client=webapp` : '');

const tools = (ID, path = '/', query = {}) =>
    (ID in APIs ? APIs[ID] : ID) + path + (Object.keys(query).length ? '?' + new URLSearchParams(query) : '');

async function apkSearch(args) {
    let res = await fetch(tools(5, '/apps/search', {
        query: args,
        limit: 1000
    }));

    res = await res.json();
    
    return res.datalist?.list?.map(v => ({
        name: v.name,
        id: v.package
    })) || [];
}

async function apkDownload(id) {
    let res = await fetch(tools(5, '/apps/search', {
        query: id,
        limit: 1
    }));

    res = await res.json();
    if (!res.datalist?.list?.length) {
        throw new Error("APK not found");
    }

    let app = res.datalist.list[0];
    let size = await file_size_url(app.file.path); // Ensure this function is implemented

    return {
        name: app.name,
        lastUpdate: app.updated,
        package: app.package,
        size,
        image: app.icon,
        dl_link: app.file.path
    };
}


async function twitter(link) {
    try {
        const config = { 'URL': link };
        const { data } = await axios.post(
            'https://twdown.net/download.php',
            qs.stringify(config),
            {
                headers: {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "sec-ch-ua": '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
            }
        );

        const $ = cheerio.load(data);

        const desc = $('div:nth-child(1) > div:nth-child(2) > p').text().trim() || "No description";
        const thumb = $('div:nth-child(1) > img').attr('src') || null;
        const video_sd = $('tr:nth-child(2) > td:nth-child(4) > a').attr('href') || null;
        const video_hd = $('tbody > tr:nth-child(1) > td:nth-child(4) > a').attr('href') || null;
        const audio = $('body > div.jumbotron > div > center > div.row > div > div:nth-child(5) > table > tbody > tr:nth-child(3) > td:nth-child(4) > a').attr('href');

        return {
            desc,
            thumb,
            video_sd,
            video_hd,
            audio: audio ? `https://twdown.net/${audio}` : null
        };
    } catch (error) {
        console.error("Twitter Download Error:", error.message);
        return null;
    }
}


async function xvideosSearch(url) {
  return new Promise(async (resolve) => {
    await axios
      .request(
        `https://www.xvideos.com/?k=${url}&p=${
          Math.floor(Math.random() * 9) + 1
        }`,
        { method: "get" }
      )
      .then(async (result) => {
        let $ = cheerio.load(result.data, { xmlMod3: false });
        let title = [];
        let duration = [];
        let quality = [];
        let url = [];
        let thumb = [];
        let hasil = [];

        $("div.mozaique > div > div.thumb-under > p.title").each(function (
          a,
          b
        ) {
          title.push($(this).find("a").attr("title"));
          duration.push($(this).find("span.duration").text());
          url.push("https://www.xvideos.com" + $(this).find("a").attr("href"));
        });
        $("div.mozaique > div > div.thumb-under").each(function (a, b) {
          quality.push($(this).find("span.video-hd-mark").text());
        });
        $("div.mozaique > div > div > div.thumb > a").each(function (a, b) {
          thumb.push($(this).find("img").attr("data-src"));
        });
        for (let i = 0; i < title.length; i++) {
          hasil.push({
            title: title[i],
            duration: duration[i],
            quality: quality[i],
            thumb: thumb[i],
            url: url[i],
          });
        }
        resolve(hasil);
      });
  });
}

async function xvideosdl(url) {
  return new Promise((resolve, reject) => {
    fetch(url, { method: "get" })
      .then((res) => res.text())
      .then((res) => {
        let $ = cheerio.load(res, { xmlMode: false });
        const title = $("meta[property='og:title']").attr("content");
        const keyword = $("meta[name='keywords']").attr("content");
        const views =
          $(
            "div#video-tabs > div > div > div > div > strong.mobile-hide"
          ).text() + " views";
        const vote = $("div.rate-infos > span.rating-total-txt").text();
        const likes = $("span.rating-good-nbr").text();
        const deslikes = $("span.rating-bad-nbr").text();
        const thumb = $("meta[property='og:image']").attr("content");
        const url = $("#html5video > #html5video_base > div > a").attr("href");
        resolve({
          status: 200,
          result: { title, url, keyword, views, vote, likes, deslikes, thumb },
        });
      });
  });
}

function addResolutionLabels(formats = []) {
  return formats.map(format => {
    let label;

    if (format.height >= 1080) label = "1080p";
    else if (format.height >= 720) label = "720p";
    else if (format.height >= 480) label = "480p";
    else if (format.height >= 360) label = "360p";
    else if (format.height >= 240) label = "240p";
    else label = "144p";

    return {
      ...format,
      label
    };
  });
}

async function allInOneInfo(url) {
  try {
    const getInfo = await axios.get(
      "https://savevid.com/api/v2/info?url=" + encodeURIComponent(url)
    );

    if (getInfo.status === 502 || getInfo?.data?.status !== "success") {
      throw new Error(getInfo?.data?.message || "Invalid response");
    }

    const {
      formats,
      requested_downloads,
      http_headers,
      _version,
      ...rest
    } = getInfo.data.response;

    return {
      data: {
        info: rest,
        formats: addResolutionLabels(formats)
      }
    };
  } catch (err) {
    console.error("Info Error:", err.message);
    return null;
  }
}

async function allInOneDownload(url, format) {
  try {
    const getInfo = await axios.get(
      "https://savevid.com/api/v2/download?url=" +
        encodeURIComponent(url) +
        "&format=" +
        format
    );

    if (getInfo.status === 502 || getInfo?.data?.status !== "success") {
      throw new Error(getInfo?.data?.message || "Invalid response");
    }

    const resUrl = getInfo?.data?.response?.url;

    return {
      data: {
        downloadUrl: "https://savevid.com/api/v2/proxy?file=" + encodeURIComponent(resUrl)
      }
    };
  } catch (err) {
    console.error("Download Error:", err.message);
    return null;
  }
}
// ======================================  N E W S ======================================
async function hirunews() {
    try {
      
        const { data } = await axios.get('https://www.hirunews.lk/');
        const $ = cheerio.load(data);
        const latestUrl = $('.card-v1').attr('href');
        const latestGet = await axios.get(latestUrl);
        const $2 = cheerio.load(latestGet.data);

        const title = $2('.head-title').text().trim();
        const image = $2(".featured-image > img").attr('src');
        const date = $2(".head-content > div > span:nth-child(2)").text().trim()
        let desc = $2('#this-article')
  .html()
  .replace(/<br\s*\/?>/gi, '\n\n')
  .replace(/\n{2,}/g, '\n\n')
  .replace(/<[^>]+>/g, '')
  .trim();


        return {
          result:{
            title,
            image,
            date,
            desc,
            url: latestUrl
        }
      };

    } catch (error) {
        console.error(error.message);
        return null;
    }
}

async function sirasanews() {
    try {
      
        const baseUrl = "https://sinhala.newsfirst.lk";
        const { data } = await axios.get(`${baseUrl}/latest-news`);
        const $ = cheerio.load(data);
        let latestUrl = $('.ng-star-inserted > div > div > a').attr('href');
        latestUrl = baseUrl + latestUrl

        const latestGet = await axios.get(latestUrl);
        const $2 = cheerio.load(latestGet.data);

        const title = $2(".ng-star-inserted > h1").text().trim();
        const image = $2("#post_img").attr('src');
        const date = $2(".author_main > span").text().trim()
        let desc = $2('#testId')
  .html()
  .replace(/<p\s*\/?>/gi, '\n\n')
  .replace(/\n{2,}/g, '\n\n')
  .replace(/<[^>]+>/g, '')
  .trim();

      return {
          result:{
            title,
            image,
            date,
            desc,
            url: latestUrl
        }
      };

    } catch (error) {
        console.error(error.message);
        return null;
    }
}

async function derananews() {
    try {
      
        const baseUrl = "https://sinhala.adaderana.lk/";
        const { data } = await axios.get(`${baseUrl}`);
        const $ = cheerio.load(data);
        let latestUrl = $(".col-xs-12.col-sm-6.col-md-5 > div > div > h3 > a").attr('href');
        latestUrl = baseUrl + latestUrl
        
        const latestGet = await axios.get(latestUrl);
        const $2 = cheerio.load(latestGet.data);

        const title = $2(".news-heading").text().trim();
        const image = $2(".news-banner > img").attr('src');
        const date = $2(".col-xs-12.col-sm-8.col-lg-7 > article > p").text().trim().replace(/\s+/g, ' ');
        let desc = $2('.news-content')
  .html()
  .replace(/<p\s*\/?>/gi, '\n\n')
  .replace(/\n{2,}/g, '\n\n')
  .replace(/<[^>]+>/g, '')
  .trim();

      return {
          result:{
            title,
            image,
            date,
            desc,
            url: latestUrl
        }
      };

    } catch (error) {
        console.error(error.message);
        return null;
    }
}
// ====================================== A I ======================================
const blackbox = async(query) => {
    if (!query) throw new Error("A query is required to proceed. ❓");
  
    const payload = {
      messages: [{ id: "INRanod", content: query, role: "user" }],
      agentMode: {},
      id: "INRanod",
      previewToken: null,
      userId: null,
      codeModelMode: true,
      trendingAgentMode: {},
      isMicMode: false,
      userSystemPrompt: null,
      maxTokens: 1024,
      playgroundTopP: null,
      playgroundTemperature: null,
      isChromeExt: false,
      githubToken: "",
      clickedAnswer2: false,
      clickedAnswer3: false,
      clickedForceWebSearch: false,
      visitFromDelta: false,
      isMemoryEnabled: false,
      mobileClient: false,
      userSelectedModel: null,
      validated: "00f37b34-a166-4efb-bce5-1312d87f2f94",
      imageGenerationMode: false,
      webSearchModePrompt: false,
      deepSearchMode: false,
      domains: null,
      vscodeClient: false,
      codeInterpreterMode: false,
      customProfile: {
        name: "",
        occupation: "",
        traits: [],
        additionalInfo: "",
        enableNewChats: false
      },
      session: null,
      isPremium: false,
      subscriptionCache: null,
      beastMode: false
    };
  
    try {
      const fetchResponse = await fetch('https://blackbox.ai/api/chat', {
        method: 'POST',
        headers: {
          "Accept": "*/*",
          'Content-Type': 'application/json',
          "Origin": "https://www.blackbox.ai",
          "Cookie": "sessionId=c0ebbf8e-1c4b-499c-be36-652744c02024; intercom-id-x55eda6t=1c15f786-00e3-41a0-ae79-29ede7dbf5a1; intercom-session-x55eda6t=; intercom-device-id-x55eda6t=0ab02a4d-44c7-4ae9-a4e2-86c45eed16a0; render_app_version_affinity=dep-cusmsvlumphs73c9hfo0; __Host-authjs.csrf-token=1af0346a1017106691b395118021580cfd4cddb20c9db86dd3e8b978f8d845c5%7Ca72558df1e20bdab4376b6555d838cc57193edf4a1bac915b7338c1109243ce5; __Secure-authjs.callback-url=https%3A%2F%2Fwww.blackbox.ai; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..hGmmfRwO_REcSKOZ.itC32J4l_mVelLqxqXs1z84lsrZxJIpeUW8Z8_10gezjUP8UbQWH6-Yn4a1MVWchpEpy-M_AfgmH2I2NvMykogz15u0Dz910lexOreYedg_HLaWlGuU9dz_-GMFfEyzHHSyhR6gEISEgS1ntYDIX26rvDaUdRn1U5GzLVLrziCGR9tlzGYHGAyw6vXUeUAl33WSUWHSXpsWOXeyStOluXrkFePiGrjBQz0XZfzJ08pv2gL3RJkqb1eHU8qVu9tIK7mY1w_Qwbq4s2K800YRRmsETiMBvQ5R4vFtFVMo1vr-npLgKGUeF3b_JuxBuTsSBDlRKD117HJA_7BuI5V23H9nWQHteNoc3ZBl1rNoNrqS26oG5vaM4RNaZydR1fX-7ulXzkoeH-xQWR1plvhGl5fd3wsv6Sb4AhBZuNX5pHpOZnfiYLX2XyZIoJuGxJhTZBFGa0oWA1tt_0cPVQ_aPmVn07yYI2iKwvUUq0TdkyunMNk05-Ds3GTLvXBdpN0FQ.M1snWUJXb10YFgXatSaqxg",
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(payload)
      });
  
      return await fetchResponse.text();
    } catch (error) {
      console.error("❌ Error:", error.message);
      throw new Error("Failed to fetch response from API");
    }
  };
  
// ====================================== O T H E R ======================================
async function getGithubUser(username) {
    try {
        const res = await axios.get(`https://api.github.com/users/${username}`);
        return res.data;
    } catch (error) {
        return { error: "❌ User not found or API error." };
    }
}


function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      let tmp = join(__dirname, 'tmp', +new Date() + '.' + ext);
      let out = tmp + '.' + ext2;
      await promises.writeFile(tmp, buffer);
      spawn('ffmpeg', [
        '-y',
        '-i', tmp,
        ...args,
        out
      ])
        .on('error', reject)
        .on('close', async (code) => {
          try {
            await promises.unlink(tmp);
            if (code !== 0) return reject(code);
            resolve({
              data: await promises.readFile(out),
              filename: out,
              delete() {
                return promises.unlink(out);
              }
            });
          } catch (e) {
            reject(e);
          }
        });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Convert Audio to WhatsApp Voice Note (PTT)
 */
function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
  ], ext, 'ogg');
}

/**
 * Convert Audio to WhatsApp-compatible Opus
 */
function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus');
}

/**
 * Convert Video to WhatsApp-compatible MP4
 */
function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-ab', '128k',
    '-ar', '44100',
    '-crf', '32',
    '-preset', 'slow'
  ], ext, 'mp4');
}


export default { 
  blackbox, 
  fbdownload, 
  apkSearch, 
  apkDownload, 
  ytmp3, 
  ytmp4, 
  ytsearch, 
  tiktok, 
  tiktok_v2,
  tiktokSearch,
  getNpmPackageInfo, 
  getNpmDownloads, 
  getGithubUser, 
  ytmp3_v2, 
  ytmp4_v2, 
  mediaFire, 
  twitter,
  toAudio,
  toPTT,
  toVideo,
  ffmpeg,
  xvideosSearch,
  xvideosdl,
  allInOneInfo,
  allInOneDownload,
  hirunews,
  sirasanews,
  derananews
};
