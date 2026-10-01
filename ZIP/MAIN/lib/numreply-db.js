const msg = new Map()

// --- Helpers ---
function isDecimal(number) {
  return !Number.isInteger(number)
}


async function pqs_connection_start() {
  console.log('📊 Num Reply DB : 🔢 Connected')
  return true
}

async function createTableIfNotExists() {}
async function add_old_data_to_msg_array() {}

async function start_numrep_process() {
  try {
    await pqs_connection_start()
    await createTableIfNotExists()
    await add_old_data_to_msg_array()
  } catch (error) {
    console.error('Error in start_numrep_process:', error)
  }
}

async function upload_to_pqs(data) {
  const { key } = data
  if (!msg.has(key.remoteJid)) msg.set(key.remoteJid, new Map())
  msg.get(key.remoteJid).set(key.id, data)
  return true
}

async function storenumrepdata(json) {
  const { key } = json
  if (!msg.has(key.remoteJid)) msg.set(key.remoteJid, new Map())
  msg.get(key.remoteJid).set(key.id, json)
  return msg.get(key.remoteJid).get(key.id)
}

async function get_data_from_pqs() {
  const obj = {}
  for (const [jid, innerMap] of msg.entries()) {
    obj[jid] = Object.fromEntries(innerMap)
  }
  return obj
}

async function getstorednumrep(quotedid, jid, num) {
  if (!msg.has(jid) || !msg.get(jid).has(quotedid)) return false
  if (msg.get(jid).get(quotedid)?.key?.fromMe === false) return false

  const storedMsg = msg.get(jid).get(quotedid)
  const numrep = storedMsg.numrep
  const method = storedMsg?.method

  if (method === 'nondecimal' || !method) {
    if (!isNaN(num) && parseInt(num) > 0 && parseInt(num) <= numrep.length) {
      return numrep[parseInt(num) - 1]
    } else {
      return null
    }
  } else if (method === 'decimal') {
    if (isDecimal(parseFloat(num))) {
      let [integerPart, decimalPart] = num.split('.')
      let formattedNum = `${integerPart}.${decimalPart.padEnd(1, '0')}`

      for (let item of numrep) {
        let itemNum = item.split(' ')[0]
        if (itemNum === formattedNum) {
          return item.split(' ').slice(1).join(' ')
        }
      }
    }
  }
  return null
}

// Clear all stored data
function clear_all_data() {
  msg.clear()
  console.log('🗑️ Num Reply DB cleared (Memory Only)')
}

// Export data as plain object (for debugging or persistence)
function export_data() {
  const obj = {}
  for (const [jid, innerMap] of msg.entries()) {
    obj[jid] = Object.fromEntries(innerMap)
  }
  return obj
}

// Import data back (e.g. after reload)
function import_data(obj) {
  msg.clear()
  for (const [jid, messages] of Object.entries(obj)) {
    msg.set(jid, new Map(Object.entries(messages)))
  }
  console.log('📥 Num Reply DB imported into memory')
}

export default {
  pqs_connection_start,
  start_numrep_process,
  upload_to_pqs,
  get_data_from_pqs,
  storenumrepdata,
  getstorednumrep,
  createTableIfNotExists,

  clear_all_data,
  export_data,
  import_data,
}
