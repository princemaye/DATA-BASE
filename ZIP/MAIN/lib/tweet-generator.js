/**
 * tweet-generator.js
 * Generates a fake Twitter/X tweet image matching zeoob.com's dark-theme output.
 * CSS values, icon PNGs and SVG paths scraped directly from zeoob.com.
 */

'use strict';

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

// ─── Assets (scraped from zeoob.com/assets/img/) ────────────────────────────
const ASSET_DIR = path.join(__dirname, 'tweet-assets');

function _loadIconB64(filename) {
    return fs.readFileSync(path.join(ASSET_DIR, filename)).toString('base64');
}

// Cached at module load
const ICONS = {
    comment : _loadIconB64('twitter-post-comment.png'),
    retweet : _loadIconB64('twitter-post-retweet.png'),
    liked   : _loadIconB64('twitter-post-liked.png'),
    share   : _loadIconB64('twitter-post-share-pc.png'),
};

// ─── Exact verified-badge SVG path from zeoob.com HTML ─────────────────────
const VERIFIED_PATH =
    'M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 ' +
    '0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 ' +
    '13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25' +
    '-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 ' +
    '2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 ' +
    '0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 ' +
    '3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 ' +
    '2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 ' +
    '1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334' +
    '-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293' +
    '-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345' +
    '.696-.436 1.04-.207.346.23.44.696.21 1.04z';

// ─── Exact dark-theme colours from zeoob.com CSS ────────────────────────────
const C = {
    bg       : '#000000',
    text     : '#efefef',   // .dark .head_title, .dark .tweet-text, .dark .bold
    handle   : '#8899a6',   // .location_
    link     : '#1b95e0',   // .link  (mentions)
    device   : '#1b95e0',   // .name_of_device
    verified : '#1da1f2',   // svg.verified
    border   : '#2f3336',   // .dark .upper-lower-line
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function _esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Word-wrap tweet text.
 * At 22px Arial on 530px wide content: ~11.5px avg char → ~46 chars/line.
 */
function _wrap(text, maxChars = 46) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (test.length <= maxChars) {
            cur = test;
        } else {
            if (cur) lines.push(cur);
            cur = w.length > maxChars ? w.substring(0, maxChars) : w;
        }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 8);
}

/**
 * Build a single SVG <tspan> line, colourising @mentions like .link class.
 */
function _linesvg(line, x, dy) {
    const parts = line.split(/(@\S+)/g);
    const inner = parts.map(p =>
        /^@\S+$/.test(p)
            ? `<tspan fill="${C.link}">${_esc(p)}</tspan>`
            : _esc(p)
    ).join('');
    return `<tspan x="${x}" dy="${dy}">${inner}</tspan>`;
}

/**
 * Returns the current time formatted like zeoob:  "4:17 PM. Jan 11, 2026 ."
 */
function formatDate() {
    const now    = new Date();
    const h      = now.getHours() % 12 || 12;
    const min    = String(now.getMinutes()).padStart(2, '0');
    const ap     = now.getHours() >= 12 ? 'PM' : 'AM';
    const months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${h}:${min} ${ap}. ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} .`;
}

// ─── SVG builder ─────────────────────────────────────────────────────────────
/**
 * Builds the tweet SVG string with exact zeoob.com dark-theme layout.
 *
 * @param {object}      opts
 * @param {string}      opts.name         - Display name
 * @param {string}      opts.handle       - @handle (without @)
 * @param {string|null} opts.avatarB64    - JPEG base64 of profile picture (96×96)
 * @param {string}      opts.text         - Tweet body
 * @param {string}      opts.date         - Formatted date string
 * @param {string}      opts.reposts      - e.g. "18k"
 * @param {string}      opts.likes        - e.g. "14k"
 * @param {string}      opts.device       - e.g. "Twitter for Android"
 * @param {string|null} opts.postImgB64   - JPEG base64 of post photo (optional)
 * @param {number}      opts.postImgH     - Rendered height for post photo (px)
 */
function buildTweetSVG({ name, handle, avatarB64, text, date, reposts, likes, device = 'Twitter for Android', postImgB64 = null, postImgH = 0 }) {
    // ── Exact dimensions from zeoob CSS ──
    const W        = 550;   // #download max-width
    const PAD      = 10;    // #download padding 0px 10px
    const CW       = W - 2 * PAD;  // 530 — content width

    // Header (.header_post height:68px)
    const HEADER_H = 68;
    const AV_SIZE  = 48;                        // .prifile_img_psot 48×48
    const AV_X     = PAD;                       // 10
    const AV_Y     = (HEADER_H - AV_SIZE) / 2; // 10 — centred in header
    const AV_CX    = AV_X + AV_SIZE / 2;       // 34
    const AV_CY    = AV_Y + AV_SIZE / 2;       // 34

    // Head title: margin-left:10px after avatar, margin-top:6px
    const TITLE_X   = PAD + AV_SIZE + 10;       // 68
    const NAME_FS   = 16;
    const NAME_Y    = AV_Y + 6 + NAME_FS;       // 32 — baseline
    const HANDLE_FS = 15;
    const HANDLE_Y  = NAME_Y + 4 + HANDLE_FS;   // 51

    // Verified badge — placed right of name
    // Bold 16px Arial ≈ 9.5px/char
    const nameTextW = Math.min(name.length * 9.5, 220);
    const BADGE_X   = TITLE_X + nameTextW + 4;
    const BADGE_Y   = NAME_Y - NAME_FS + 1;

    // Tweet text (.tweet-text: 22px, line-height:32px)
    const TWEET_FS = 22;
    const TWEET_LH = 32;
    const TWEET_X  = PAD;
    const TWEET_Y  = HEADER_H + 6 + TWEET_FS;  // ~94 — first baseline

    const lines   = _wrap(text, 46);
    const TWEET_H = lines.length * TWEET_LH;

    // Optional post image (.post_img: margin:10px 0px, border-radius:10px)
    // Placed between tweet text and date line
    const POST_IMG_MARGIN = postImgB64 ? 10 : 0;
    const POST_IMG_Y = TWEET_Y + TWEET_H - TWEET_FS + TWEET_LH + POST_IMG_MARGIN;
    const POST_IMG_BLOCK = postImgH + (postImgB64 ? POST_IMG_MARGIN * 2 : 0);

    // Date line (.likes_time_date_div padding:7px 0px)
    const DATE_FS = 15;
    const DATE_Y  = POST_IMG_Y + (postImgB64 ? postImgH + POST_IMG_MARGIN : 0) + 7 + DATE_FS;

    // Stats section (.upper-lower-line: border-top+bottom, padding:12px 0px)
    const SEP1_Y   = DATE_Y + 7 + 4;
    const STATS_FS = 15;
    const STATS_Y  = SEP1_Y + 12 + STATS_FS;
    const SEP2_Y   = STATS_Y + 12 + 4;

    // Icons row (.liked_disliked_images: each 25% of CW = 132.5px)
    const ICON_SZ      = 24;   // 1.5em at 16px body = 24px
    const ICON_TOP_PAD = Math.round(CW * 0.25 * 0.14);  // ≈ 18
    const ICON_Y       = SEP2_Y + ICON_TOP_PAD;
    const TOTAL_H      = ICON_Y + ICON_SZ + ICON_TOP_PAD + 6;

    // ── SVG pieces ──

    // Avatar (circle-clipped)
    const avatarEl = avatarB64
        ? `<image href="data:image/jpeg;base64,${avatarB64}" x="${AV_X}" y="${AV_Y}" width="${AV_SIZE}" height="${AV_SIZE}" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice"/>`
        : `<circle cx="${AV_CX}" cy="${AV_CY}" r="${AV_SIZE / 2}" fill="#536471"/>`;

    // Verified badge
    const verifiedBadge =
        `<svg x="${BADGE_X}" y="${BADGE_Y}" width="18" height="18" viewBox="0 0 24 24" fill="${C.verified}">` +
        `<path d="${VERIFIED_PATH}"/>` +
        `</svg>`;

    // Tweet text tspans
    const textTspans = lines
        .map((l, i) => _linesvg(l, TWEET_X, i === 0 ? 0 : TWEET_LH))
        .join('');

    // Post image block (full-width, border-radius:10px via rounded clipPath)
    const postImgEl = postImgB64
        ? `<defs><clipPath id="pi"><rect x="${PAD}" y="${POST_IMG_Y}" width="${CW}" height="${postImgH}" rx="10" ry="10"/></clipPath></defs>` +
          `<image href="data:image/jpeg;base64,${postImgB64}" x="${PAD}" y="${POST_IMG_Y}" width="${CW}" height="${postImgH}" clip-path="url(#pi)" preserveAspectRatio="xMidYMid slice"/>`
        : '';

    // Stats row
    const statsRow =
        `<text x="${PAD + 10}" y="${STATS_Y}" font-family="Arial,Helvetica,sans-serif" font-size="${STATS_FS}">` +
        `<tspan fill="${C.text}" font-weight="bold">${_esc(reposts)}</tspan>` +
        `<tspan fill="${C.handle}"> Retweets</tspan>` +
        `<tspan fill="${C.text}" font-weight="bold">&#160;&#160;&#160;${_esc(likes)}</tspan>` +
        `<tspan fill="${C.handle}"> Likes</tspan>` +
        `</text>`;

    // Icons row (4 PNG icons, each centred in 25% of CW)
    const iconSlot  = CW / 4;
    const iconOrder = ['comment', 'retweet', 'liked', 'share'];
    const iconsRow  = iconOrder.map((key, i) => {
        const cx = PAD + (i + 0.5) * iconSlot;
        const ix = Math.round(cx - ICON_SZ / 2);
        return `<image href="data:image/png;base64,${ICONS[key]}" x="${ix}" y="${ICON_Y}" width="${ICON_SZ}" height="${ICON_SZ}"/>`;
    }).join('\n  ');

    return `<svg width="${W}" height="${TOTAL_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="av">
      <circle cx="${AV_CX}" cy="${AV_CY}" r="${AV_SIZE / 2}"/>
    </clipPath>
  </defs>
  <rect width="${W}" height="${TOTAL_H}" fill="${C.bg}"/>
  ${avatarEl}
  <text x="${TITLE_X}" y="${NAME_Y}" fill="${C.text}" font-size="${NAME_FS}" font-family="Arial,Helvetica,sans-serif" font-weight="bold">${_esc(name)}</text>
  ${verifiedBadge}
  <text x="${TITLE_X}" y="${HANDLE_Y}" fill="${C.handle}" font-size="${HANDLE_FS}" font-family="Arial,Helvetica,sans-serif">@${_esc(handle)}</text>
  <text x="${TWEET_X}" y="${TWEET_Y}" fill="${C.text}" font-size="${TWEET_FS}" font-family="Arial,Helvetica,sans-serif" xml:space="preserve">${textTspans}</text>
  ${postImgEl}
  <text x="${PAD + 10}" y="${DATE_Y}" fill="${C.handle}" font-size="${DATE_FS}" font-family="Arial,Helvetica,sans-serif">
    ${_esc(date)}<tspan fill="${C.device}">&#160;${_esc(device)}</tspan>
  </text>
  <line x1="${PAD}" y1="${SEP1_Y}" x2="${W - PAD}" y2="${SEP1_Y}" stroke="${C.border}" stroke-width="1"/>
  ${statsRow}
  <line x1="${PAD}" y1="${SEP2_Y}" x2="${W - PAD}" y2="${SEP2_Y}" stroke="${C.border}" stroke-width="1"/>
  ${iconsRow}
</svg>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Generate a fake tweet PNG buffer.
 *
 * @param {object}       opts
 * @param {string}       opts.name           Display name
 * @param {string}       opts.handle         @handle (without @)
 * @param {Buffer|null}  opts.avatarBuffer    Raw image buffer for profile pic
 * @param {string}       opts.text           Tweet text
 * @param {string}       [opts.date]         Pre-formatted date (defaults to now)
 * @param {string}       opts.reposts        Retweet count string e.g. "18k"
 * @param {string}       opts.likes          Like count string e.g. "14k"
 * @param {string}       [opts.device]       Device string
 * @param {Buffer|null}  [opts.postImageBuffer]  Raw image buffer for tweet photo
 * @returns {Promise<Buffer>} PNG buffer
 */
async function generateTweetImage(opts) {
    const { name, handle, avatarBuffer, text, reposts, likes } = opts;
    const date   = opts.date   || formatDate();
    const device = opts.device || 'Twitter for Android';

    // Profile picture — 96×96 circle-cropped
    let avatarB64 = null;
    if (avatarBuffer) {
        const resized = await sharp(avatarBuffer)
            .resize(96, 96, { fit: 'cover' })
            .jpeg({ quality: 90 })
            .toBuffer();
        avatarB64 = resized.toString('base64');
    }

    // Optional tweet photo — scale to 530px wide, maintain aspect ratio, cap at 400px tall
    let postImgB64 = null;
    let postImgH   = 0;
    if (opts.postImageBuffer) {
        const POST_W = 530;
        const MAX_H  = 400;
        const meta   = await sharp(opts.postImageBuffer).metadata();
        const nat_w  = meta.width  || POST_W;
        const nat_h  = meta.height || POST_W;
        // Calculate rendered height at POST_W width
        let renderedH = Math.round((nat_h / nat_w) * POST_W);
        if (renderedH > MAX_H) renderedH = MAX_H;

        const resized = await sharp(opts.postImageBuffer)
            .resize(POST_W, renderedH, { fit: 'fill' })
            .jpeg({ quality: 88 })
            .toBuffer();
        postImgB64 = resized.toString('base64');
        postImgH   = renderedH;
    }

    const svg = buildTweetSVG({ name, handle, avatarB64, text, date, reposts, likes, device, postImgB64, postImgH });
    return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Format a number into Twitter-style short string.
 * e.g. 18000 → "18k", 1400000 → "1.4M"
 */
function fmtCount(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 10_000)    return Math.round(n / 1_000) + 'k';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
    return String(n);
}

module.exports = { generateTweetImage, formatDate, fmtCount };
