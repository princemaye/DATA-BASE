import * as __import0 from "@octokit/rest";


// lib/warning_db.js
const { Octokit } = __import0;

class WarningDB {
    constructor(token, userName, repoName, filePath) {
        this.octokit = new Octokit({ auth: token });
        this.OWNER = userName;
        this.REPO = repoName;
        this.FILE_PATH = filePath; // e.g., "WARNING_DB/warnings.json"
    }

    // Get file from GitHub
    async getFile() {
        try {
            const { data } = await this.octokit.repos.getContent({
                owner: this.OWNER,
                repo: this.REPO,
                path: this.FILE_PATH,
            });
            const content = Buffer.from(data.content, "base64").toString();
            return { content: JSON.parse(content || "{}"), sha: data.sha };
        } catch (err) {
            if (err.status === 404) {
                console.log(`📁 File does not exist: ${this.FILE_PATH}, will create on first save.`);
                return { content: {}, sha: null };
            }
            console.error("❌ GitHub error in WarningDB:", err.message);
            throw err;
        }
    }

    // Save file to GitHub - FIXED: Don't pass sha if it's null
    async saveFile(newContent, message, sha) {
        const params = {
            owner: this.OWNER,
            repo: this.REPO,
            path: this.FILE_PATH,
            message,
            content: Buffer.from(JSON.stringify(newContent, null, 2)).toString("base64"),
        };
        
        // Only add sha if it's not null (for updates)
        if (sha) {
            params.sha = sha;
        }

        return await this.octokit.repos.createOrUpdateFileContents(params);
    }

    // Get user warnings
    async getUserWarnings(groupId, userId) {
        try {
            const { content } = await this.getFile();
            const key = `${groupId}_${userId}`;
            return content[key] || { count: 0, lastWarning: null, warnings: [] };
        } catch (err) {
            console.error("❌ Error getting user warnings:", err.message);
            return { count: 0, lastWarning: null, warnings: [] };
        }
    }

    // Add warning for user
    async addWarning(groupId, userId, reason = "Anti-link violation", type = "anti-link") {
        try {
            const { content, sha } = await this.getFile();
            const key = `${groupId}_${userId}`;
            const timestamp = Date.now();
            const warningId = `WARN_${timestamp}`;
            
            if (!content[key]) {
                content[key] = {
                    count: 0,
                    lastWarning: null,
                    warnings: []
                };
            }
            
            content[key].count += 1;
            content[key].lastWarning = timestamp;
            content[key].warnings.push({
                id: warningId,
                timestamp: timestamp,
                reason: reason,
                type: type
            });
            
            // Keep only last 10 warnings
            if (content[key].warnings.length > 10) {
                content[key].warnings = content[key].warnings.slice(-10);
            }
            
            await this.saveFile(content, `Add warning for ${userId} in ${groupId}`, sha);
            console.log(`✅ Warning added: ${userId} in ${groupId} (Total: ${content[key].count})`);
            return content[key].count;
        } catch (err) {
            console.error("❌ Error adding warning:", err.message);
            throw err;
        }
    }

    // Reset warnings for user
    async resetWarnings(groupId, userId) {
        try {
            const { content, sha } = await this.getFile();
            const key = `${groupId}_${userId}`;
            
            if (content[key]) {
                delete content[key];
                await this.saveFile(content, `Reset warnings for ${userId} in ${groupId}`, sha);
                console.log(`✅ Warnings reset for ${userId} in ${groupId}`);
                return true;
            }
            return false;
        } catch (err) {
            console.error("❌ Error resetting warnings:", err.message);
            return false;
        }
    }

    // Get all warnings in a group
    async getGroupWarnings(groupId) {
        try {
            const { content } = await this.getFile();
            const groupWarnings = {};
            const prefix = `${groupId}_`;
            
            for (const [key, data] of Object.entries(content)) {
                if (key.startsWith(prefix)) {
                    const userId = key.replace(prefix, '');
                    groupWarnings[userId] = data;
                }
            }
            return groupWarnings;
        } catch (err) {
            console.error("❌ Error getting group warnings:", err.message);
            return {};
        }
    }

    // Remove specific warning by ID
    async removeWarning(groupId, userId, warningId) {
        try {
            const { content, sha } = await this.getFile();
            const key = `${groupId}_${userId}`;
            
            if (content[key]) {
                const initialLength = content[key].warnings.length;
                content[key].warnings = content[key].warnings.filter(w => w.id !== warningId);
                
                if (content[key].warnings.length < initialLength) {
                    content[key].count = content[key].warnings.length;
                    if (content[key].count === 0) {
                        content[key].lastWarning = null;
                    } else {
                        content[key].lastWarning = content[key].warnings[content[key].warnings.length - 1].timestamp;
                    }
                    
                    await this.saveFile(content, `Remove warning ${warningId} for ${userId}`, sha);
                    console.log(`✅ Warning ${warningId} removed for ${userId}`);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error("❌ Error removing warning:", err.message);
            return false;
        }
    }

    // Export all warnings (for backup)
    async exportWarnings() {
        try {
            const { content } = await this.getFile();
            return content;
        } catch (err) {
            console.error("❌ Error exporting warnings:", err.message);
            return {};
        }
    }

    // Import warnings (from backup) - FIXED: Handle initial creation
    async importWarnings(warningsData) {
        try {
            const result = await this.getFile();
            const sha = result.sha; // This could be null if file doesn't exist
            
            await this.saveFile(warningsData, "Import warnings from backup", sha);
            console.log(`✅ Warnings imported successfully (${Object.keys(warningsData).length} records)`);
            return true;
        } catch (err) {
            console.error("❌ Error importing warnings:", err.message);
            throw err;
        }
    }

    // Clear all warnings (dangerous!)
    async clearAllWarnings() {
        try {
            const result = await this.getFile();
            const sha = result.sha; // This could be null if file doesn't exist
            
            const emptyContent = {};
            await this.saveFile(emptyContent, "Clear all warnings", sha);
            console.log("✅ All warnings cleared");
            return true;
        } catch (err) {
            console.error("❌ Error clearing warnings:", err.message);
            throw err;
        }
    }

    // Get warning statistics
    async getStats() {
        try {
            const { content } = await this.getFile();
            const totalUsers = Object.keys(content).length;
            let totalWarnings = 0;
            let activeWarnings = 0;
            
            for (const [, data] of Object.entries(content)) {
                totalWarnings += data.count;
                if (data.count > 0) {
                    activeWarnings++;
                }
            }
            
            return {
                totalUsers,
                totalWarnings,
                activeWarnings,
                averageWarnings: totalUsers > 0 ? (totalWarnings / totalUsers).toFixed(2) : 0
            };
        } catch (err) {
            console.error("❌ Error getting stats:", err.message);
            return { totalUsers: 0, totalWarnings: 0, activeWarnings: 0, averageWarnings: 0 };
        }
    }
}

export default WarningDB;
