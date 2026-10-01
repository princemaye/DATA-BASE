import * as __import0 from "mongodb";
const { MongoClient } = __import0;

class SessionManager {
  constructor(uri, dbName = "princeBot", collectionName = "sessions") {
    this.client = new MongoClient(uri);
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.collection = null;
  }

  async connect() {
    if (!this.collection) {
      await this.client.connect();
      this.collection = this.client.db(this.dbName).collection(this.collectionName);
    }
  }

  // 1. Save creds.json (or update if exists)
  async saveSession(sessionId, creds) {
    await this.connect();
    const result = await this.collection.updateOne(
      { sessionId },
      { $set: { creds, updatedAt: new Date() } },
      { upsert: true }
    );
    return result;
  }

  // 2. Get creds.json by ID
  async getSession(sessionId) {
    await this.connect();
    return await this.collection.findOne({ sessionId });
  }

  // 3. Delete creds.json
  async deleteSession(sessionId) {
    await this.connect();
    return await this.collection.deleteOne({ sessionId });
  }

  // 4. List all sessions
  async listSessions() {
    await this.connect();
    return await this.collection.find({}, { projection: { _id: 0, sessionId: 1, updatedAt: 1 } }).toArray();
  }

  async close() {
    await this.client.close();
  }
}

export default SessionManager;
