const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../data/msg_counts.json');
const SAVE_INTERVAL = 30000; // save every 30 seconds
const SAVE_EVERY_N = 50;     // or every 50 increments

let counts = {};
let dirtyCount = 0;
let saveTimer = null;

function load() {
    try {
        if (fs.existsSync(FILE)) {
            counts = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        }
    } catch {
        counts = {};
    }
}

function save() {
    try {
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify(counts, null, 2));
        dirtyCount = 0;
    } catch {}
}

function scheduleSave() {
    if (!saveTimer) {
        saveTimer = setInterval(() => {
            if (dirtyCount > 0) save();
        }, SAVE_INTERVAL);
        saveTimer.unref?.();
    }
}

function increment(groupId, userId) {
    if (!groupId || !userId) return;
    if (!counts[groupId]) counts[groupId] = {};
    counts[groupId][userId] = (counts[groupId][userId] || 0) + 1;
    dirtyCount++;
    if (dirtyCount >= SAVE_EVERY_N) save();
}

function getTop(groupId, n = 5) {
    const group = counts[groupId] || {};
    return Object.entries(group)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
}

// Load on require, schedule periodic save
load();
scheduleSave();

module.exports = { increment, getTop, save };
