const pino = require('pino');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, Browsers, delay, makeCacheableSignalKeyStore, DisconnectReason } = require('baileys');
const { PausedChats } = require('./database');
const config = require('../config');
const { serialize } = require('./serialize');
const { Greetings, commands } = require('../utils');
const { Message } = require('../client');
const { loadMessage, saveMessage, saveChat, getName } = require('./database').Store;

const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });

const connect = async () => {
 const sessionDir = path.join(__dirname, './session');
 const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

 const client = makeWASocket({
  auth: {
   creds: state.creds,
   keys: makeCacheableSignalKeyStore(state.keys, logger),
  },
  logger: logger.child({ module: 'baileys' }),
  browser: Browsers.ubuntu('Firefox'),
  emitOwnEvents: true,
  version: [2, 3000, 1015901307],
  generateHighQualityLinkPreview: true,
  getMessage: async (key) => (await loadMessage(key.id))?.message || { conversation: null },
 });

 const handleConnection = async ({ connection, lastDisconnect }) => {
  if (connection === 'open') {
   const msg = `■HAKI-MD ${require('../package.json').version}\n■Prefix: ${config.HANDLERS.replace(/[\[\]]/g, '')}\n■Plugins: ${commands.length}\n■Mode: ${config.WORK_TYPE}`;
   console.log('Connected✅️💪\n' + msg);
   await client.sendMessage(client.user.id, { text: '```' + msg + '```' });
  }
  if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
   console.log('Reconnecting...');
   await delay(10000);
   connect();
  }
 };

 const handleMessages = async ({ messages }) => {
  const msg = await serialize(JSON.parse(JSON.stringify(messages[0])), client);
  await saveMessage(messages[0], msg.sender);

  if (config.AUTO_READ) await client.readMessages([msg.key]);
  if (config.AUTO_STATUS_READ && msg.from === 'status@broadcast') await client.readMessages([msg.key]);

  const isResume = new RegExp(`${config.HANDLERS}( ?resume)`, 'is').test(msg.body);
  const pausedChats = await PausedChats.getPausedChats();
  if (pausedChats.some((chat) => chat.chatId === msg.from && !isResume)) return;

  if (config.LOGS) await logMessage(msg, client);

  for (const command of commands) {
   const privilege = msg.dev || msg.isOwner || msg.sudo;
   const canExecute = config.WORK_TYPE === 'private' ? privilege : config.WORK_TYPE === 'public' ? !command.fromMe || privilege : false;

   const execute = (Instance, arguments) => command.function(new Instance(client, msg), ...arguments, msg, client, messages[0]);

   if (command.on) {
    const handlers = {
     text: () => msg.body && execute(Message, [msg.body]),
     delete: () => {
      if (msg.type === 'protocolMessage' && msg.message.protocolMessage.type === 'MESSAGE_DELETE') {
       const whatsappMsg = new Message(client, msg);
       whatsappMsg.messageId = msg.message.protocolMessage.key?.id;
       command.function(whatsappMsg, msg, client, messages[0]);
      }
     },
    };
    handlers[command.on]?.();
   }

   if (canExecute && msg.body && command.pattern) {
    const matched = msg.body.match(command.pattern);
    if (matched) {
     msg.prefix = matched[1];
     msg.command = matched[1] + matched[2];
     execute(Message, [matched[3] || false]);
     break;
    }
   }
  }
 };
 const handleCall = async (callUpdate) => {
  const { id: callId, from: callerId, status } = callUpdate;

  if (status === 'offer') {
   if (config.ANTICALL === 'on') await client.rejectCall(callId);
   else if (config.ANTICALL === 'block') {
    await client.rejectCall(callId);
    await client.updateBlockStatus(callerId, 'block');
    await client.sendMessage(callerId, { text: "*_You've been blocked for calling._*" });
   }
  }
 };

 client.ev.on('connection.update', handleConnection);
 client.ev.on('creds.update', saveCreds);
 client.ev.on('group-participants.update', (data) => Greetings(data, client));
 client.ev.on('chats.update', (chats) => Promise.all(chats.map(saveChat)));
 client.ev.on('messages.upsert', handleMessages);
 client.ev.on('call', handleCall);

 process.on('unhandledRejection', (err) => handleErrors(err, client));
 process.on('uncaughtException', (err) => handleErrors(err, client));

 return client;
};

const handleErrors = async (err, conn, msg = {}) => {
 const { message, stack } = err;
 const fileName = stack?.split('\n')[1]?.trim();
 const errorText = `─━❲ ERROR REPORT ❳━─\nMessage: ${message}\nFrom: ${fileName}`;
 console.error('Error:', err);
 await conn.sendMessage(conn.user.id, { text: '```' + errorText + '```' });
};

const logMessage = async (msg, conn) => {
 if (msg.sender === conn.user?.id) return;
 const name = await getName(msg.sender);
 const isGroup = msg.from?.endsWith('@g.us');
 const chat = isGroup ? (await conn.groupMetadata(msg.from).catch(() => ({}))).subject : '';
 const body = msg.body;
 if (name && body && (isGroup ? chat : true)) {
  console.log(chat ? `${chat}:\n${name}: ${body}` : `${name}: ${body}`);
 }
};

module.exports = { connect };
