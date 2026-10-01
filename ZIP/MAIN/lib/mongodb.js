import * as __import0 from "mongodb";
const { MongoClient } = __import0;
const dbName = "autoReplies";
let client = null

const errorMessage = "*This cannot be executed because there is an error in your database. Please contact a PRINCE-MD owner 🛠️.*"

async function connectMDB(clients) {
    try {
        client = clients
        // console.log("UserDB connected successfully!");
    } catch (err) {
        client = null
       // console.error("UserDB connection failed:", err);
    }
}


//===========================================================================================================================
async function saveAutoReply(replycollectionName, trigger, response) {
    try {
        if(!client) throw errorMessage
        const db = client.db(dbName);
        const collection = db.collection(replycollectionName);        
        const existingReply = await collection.findOne({ trigger });

        if (existingReply) {
            const result = await collection.updateOne(
                { trigger },
                { $set: { response, timestamp: new Date() } }
            );

        } else {
            const result = await collection.insertOne({ trigger, response, timestamp: new Date() });
        }
    } catch (err) {
        console.error("❌ Error saving/updating auto-reply:", err);
    }
}

async function deleteAutoReply(replycollectionName, trigger) {
    try {
        if(!client) throw errorMessage
        const db = client.db(dbName);
        const collection = db.collection(replycollectionName);

        const result = await collection.deleteOne({ trigger });

        if (result.deletedCount > 0) {
            console.log(`✅ Auto-reply deleted: ${trigger}`);
            return true
        } else {
            console.log("❌ No auto-reply found for trigger:", trigger);
            return false
        }
    } catch (err) {
        console.error("❌ Error deleting auto-reply:", err);
        return false
    }
}

async function updateAutoReply(replycollectionName, trigger, newResponse) {
    try {
        if(!client) throw errorMessage
        const db = client.db(dbName);
        const collection = db.collection(replycollectionName);

        const result = await collection.updateOne(
            { trigger },
            { $set: { response: newResponse, timestamp: new Date() } }
        );

        if (result.matchedCount > 0) {
            console.log(`✅ Auto-reply updated for: ${trigger}`);
            return true
        } else {
            console.log("❌ No auto-reply found for trigger:", trigger);
            return false
        }
    } catch (err) {
        console.error("❌ Error updating auto-reply:", err);
    }
}

async function deleteAllAutoReplies(replycollectionName) {
    try {
        if(!client) throw errorMessage
        const db = client.db(dbName);
        const collection = db.collection(replycollectionName);

        const result = await collection.deleteMany({});

        console.log(`✅ Deleted ${result.deletedCount} auto-replies.`);
    } catch (err) {
        console.error("❌ Error deleting all auto-replies:", err);
    }
}

async function handleAutoReply(replycollectionName, conn, m, isOwners) {
    try {
        if(!client) throw errorMessage
        if (!m.message/* || m.key.fromMe || isOwners*/) return;
        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
        const db = client.db(dbName);
        const collection = db.collection(replycollectionName);
        
        const autoReply = await collection.findOne({ trigger: text.toUpperCase() }) || null;
        if (autoReply) {
            await conn.sendMessage(from, { text: autoReply.response }, { quoted: m });
        }
    } catch (err) {
        console.error("❌ Error in auto-reply:", err);
    }
}

async function getAllReplies(replycollectionName) {
    try {
        if(!client) throw errorMessage
        const db = client.db(dbName);
        const collection = db.collection(replycollectionName);
        const autoReplies = await collection.find({}).toArray();
        return autoReplies;
    } catch (err) {
        console.error("❌ Error fetching all auto-replies:", err);
        return null;
    }
}

async function findReplies(replycollectionName, trigger) {
    try {
        if(!client) throw errorMessage
        const db = client.db(dbName);
        const collection = db.collection(replycollectionName);
        const existingReply = await collection.findOne({ trigger });

        return existingReply ? true : false;
    } catch (err) {
        console.error("❌ Error finding auto-replies:", err);
        return null; 
    }
}


export default {  
                   saveAutoReply, 
                   deleteAutoReply, 
                   updateAutoReply, 
                   deleteAllAutoReplies, 
                   handleAutoReply, 
                   getAllReplies, 
                   findReplies, 
                   connectMDB 
                }
