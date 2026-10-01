import * as __import0 from "@octokit/rest";
const { Octokit } = __import0;

class GitHubDB {
    constructor(token, userName, repoName, filePath) {
        this.octokit = new Octokit({ auth: token });
        this.OWNER = userName; // your GitHub username
        this.REPO = repoName; // your repo name
        this.FILE_PATH = filePath; // file path
    }

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
                console.log(`📁 Creating auto-reply file: ${this.FILE_PATH}`);
                try {
                    const { data } = await this.octokit.repos.createOrUpdateFileContents({
                        owner: this.OWNER,
                        repo: this.REPO,
                        path: this.FILE_PATH,
                        message: "Create auto-reply file",
                        content: Buffer.from(JSON.stringify({}, null, 2)).toString("base64"),
                    });
                    return { content: {}, sha: data.content.sha };
                } catch (createErr) {
                    console.error("❌ Failed to create file:", createErr.message);
                    return { content: {}, sha: null };
                }
            }
            console.error("❌ GitHub error:", err.message);
            throw err;
        }
    }

    async saveFile(newContent, message, sha) {
        return await this.octokit.repos.createOrUpdateFileContents({
            owner: this.OWNER,
            repo: this.REPO,
            path: this.FILE_PATH,
            message,
            content: Buffer.from(JSON.stringify(newContent, null, 2)).toString("base64"),
            sha,
        });
    }

    async saveAutoReply(trigger, response) {
        try {
            const { content, sha } = await this.getFile();
            content[trigger] = { response, timestamp: new Date() };
            await this.saveFile(content, `Save auto-reply for ${trigger}`, sha);
            console.log(`✅ Auto-reply saved: ${trigger}`);
        } catch (err) {
            console.error("❌ Error saving auto-reply:", err.message);
            throw err;
        }
    }

    async deleteAutoReply(trigger) {
        try {
            const { content, sha } = await this.getFile();
            if (content[trigger]) {
                delete content[trigger];
                await this.saveFile(content, `Delete auto-reply ${trigger}`, sha);
                console.log(`✅ Auto-reply deleted: ${trigger}`);
                return true;
            }
            console.log(`❌ No auto-reply found for: ${trigger}`);
            return false;
        } catch (err) {
            console.error("❌ Error deleting auto-reply:", err.message);
            return false;
        }
    }

    async deleteAllAutoReplies() {
        try {
            const { sha } = await this.getFile();
            const emptyContent = {};
            await this.saveFile(emptyContent, "Delete all auto-replies", sha);
            console.log("✅ All auto-replies deleted");
            return true;
        } catch (err) {
            console.error("❌ Error deleting all auto-replies:", err.message);
            throw err;
        }
    }

    async updateAutoReply(trigger, newResponse) {
        try {
            const { content, sha } = await this.getFile();
            if (content[trigger]) {
                content[trigger].response = newResponse;
                content[trigger].timestamp = new Date();
                await this.saveFile(content, `Update auto-reply for ${trigger}`, sha);
                console.log(`✅ Auto-reply updated: ${trigger}`);
                return true;
            }
            console.log(`❌ No auto-reply found for: ${trigger}`);
            return false;
        } catch (err) {
            console.error("❌ Error updating auto-reply:", err.message);
            throw err;
        }
    }

    async getAllReplies() {
        try {
            const { content } = await this.getFile();
            return content;
        } catch (err) {
            console.error("❌ Error fetching replies:", err.message);
            return {};
        }
    }

    async findReply(trigger) {
        try {
            const { content } = await this.getFile();
            return content[trigger] || null;
        } catch (err) {
            console.error("❌ Error finding reply:", err.message);
            return null;
        }
    }

    async handleAutoReply(conn, m, isOwners) {
        try {
            // Don't respond if message is from bot or owner
            if (!m.message || m.key.fromMe || isOwners) return;
            
            const from = m.key.remoteJid;
            const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
            
            if (!text) return;
            
            const reply = await this.findReply(text.toUpperCase());
            if (reply) {
                await conn.sendMessage(from, { text: reply.response }, { quoted: m });
            }
        } catch (err) {
            console.error("❌ Error in auto-reply handler:", err.message);
        }
    }
}

export default GitHubDB;