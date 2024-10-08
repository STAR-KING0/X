const config = require('../config');
const { haki, getJson, postJson, toAudio, aptoideDl, toPTT, getBuffer, convertToWebP, twitter, pinterest } = require('../utils');

haki(
 {
  pattern: 'spotify ?(.*)',
  fromMe: false,
  desc: 'Downloads Spotify Music',
  type: 'download',
 },
 async (message, match, m, client) => {
  if (!match || !match.includes('spotify.com')) return await message.reply('*_Provide a valid Spotify link!_*');
  const res = await getJson('https://giftedapis.us.kg/api/download/spotifydl?url=' + encodeURIComponent(match.trim()) + '&apikey=gifted');
  const msg = await message.reply('*_Downloading ' + res.data.title + '_*');
  const audio = await toAudio(res.preview);
  await msg.edit(`*_Download Success_*\n*Song Name: ${res.data.title}*\n*Duration: ${res.data.duration}*`);
  return await message.send(audio, { quoted: message });
 }
);

haki(
 {
  pattern: 'fb ?(.*)',
  fromMe: false,
  desc: 'Downloads Facebook Videos | Reels',
  type: 'download',
 },
 async (message, match, m, client) => {
  if (!match || !match.includes('facebook.com')) return await message.reply('*_Provide Vaild Facebook Url_*');
  const res = await getJson('https://api.guruapi.tech/fbvideo?url=' + encodeURIComponent(match.trim() + ''));
  const msg = await message.reply('*_Downloading ' + res.result.title + '_*');
  await msg.react('⬇️');
  await msg.edit('*_Download Success_*');
  await message.send(res.result.hd, { caption: res.result.title, quoted: msg });
  return await msg.react('✅');
 }
);

haki(
 {
  pattern: 'insta',
  fromMe: false,
  desc: 'Downloads Instagram Videos Only!',
  type: 'download',
 },
 async (message, match, m, client) => {
  if (!match || !match.includes('instagram.com')) return await message.reply('*_Provide a Valid Instagram URL_*');
  const msg = await message.reply('_Downloading_');
  await msg.react('⬇️');
  const res = await getJson(`https://api.guruapi.tech/insta/v1/igdl?url=${encodeURIComponent(match.trim())}`);

  if (res) {
   await msg.edit('_Download Success_');
   await msg.react('✅');
   const extarctedUrl = res.media[0].url.replace(/'/g, '');
   return await message.send(extarctedUrl, { quoted: msg });
  } else {
   return await message.sendMessage(message.chat, '```Error From API```');
  }
 }
);

haki(
 {
  pattern: 'tgs ?(.*)',
  fromMe: false,
  desc: 'Downloads Telegram Stickers',
  type: 'download',
 },
 async (message, match, m, client) => {
  if (!match || !match.includes('t.me')) return await message.reply('_Downloads Telegram Stickers_');
  await message.reply('_Downloading Stickers_');
  const res = await getJson('https://giftedapis.us.kg/api/download/tgs?url=' + encodeURIComponent(match.trim()) + '&apikey=gifted');
  for (const stickerUrl of res.results) {
   const stickerBuffer = await getBuffer(stickerUrl);
   const stickerWebp = await convertToWebP(stickerBuffer);
   await message.sendMessage(message.jid, stickerWebp, { packname: config.PACKNAME, author: config.AUTHOR }, 'sticker');
  }
 }
);

haki(
 {
  pattern: 'drive',
  fromMe: false,
  desc: 'Downloads Files From Google Drive Via Url',
  type: 'download',
 },
 async (message, match, m, client) => {
  if (!match || !match.includes('drive.google.com')) return await message.reply('_Provide Google Drive File Url_');
  await message.reply('_Downloading_');
  const res = await getJson(`https://giftedapis.us.kg/api/download/gdrivedl?url=${encodeURIComponent(match.trim())}&apikey=gifted`);
  return await message.send(res.result.download);
 }
);

haki(
 {
  pattern: 'twitter ?(.*)',
  fromMe: false,
  desc: 'Downloads Twitter Videos',
  type: 'download',
 },
 async (message, match, m) => {
  if (!match || !match.includes('x.com' || 'twitter.com')) return await message.reply('*_Provide Twiiter Url_*');
  await message.reply('_Downloading Video_');
  const res = await twitter(match);
  return await message.send(res);
 }
);

haki(
 {
  pattern: 'pinterest',
  fromMe: false,
  desc: 'Search & Download Pinterest Images',
  type: 'download',
 },
 async (message, match) => {
  if (!match) return message.reply('_Provide Search Query!_');
  const res = await pinterest(match);
  for (const images of res) {
   await message.send(images);
  }
 }
);

haki(
 {
  pattern: 'apk',
  fromMe: false,
  desc: 'Search & Download Apk files',
  type: 'download',
 },
 async (message, match) => {
  if (!match) return message.reply('_Provide Apk Name_');
  const msg = await message.reply(`_Searching for ${match}_`);
  const res = await aptoideDl(match);
  await msg.edit(`_Found ${res.appname}. Downloading..._`);
  const apkBuffer = await getBuffer(res.link);
  await message.haki.sendMessage(
   message.jid,
   {
    document: apkBuffer,
    fileName: `${res.appname}.apk`,
    mimetype: 'application/vnd.android.package-archive',
   },
   { quoted: message }
  );
 }
);

haki(
 {
  pattern: 'ytv ?(.*)',
  fromMe: false,
  desc: 'Downloads Youtube Videos From URL',
  type: 'download',
 },
 async (message, match, client) => {
  if (!match || !/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(match)) {
   return await message.reply('ɴᴇᴇᴅ ʏᴛ ᴜʀʟ');
  }
  const msgdl = await message.reply('_Downloading ' + match + '_');
  const res = await getJson('https://api.guruapi.tech/ytdl/ytmp4?url=' + match);
  const buff = await getBuffer(res.video_url);
  await msgdl.edit(`_Successfully Downloaded ${res.title}_`);
  return await message.send(buff, { caption: res.description });
 }
);

haki(
 {
  pattern: 'yta ?(.*)',
  fromeMe: false,
  desc: 'Downloads Youtube Audio From URL',
  type: 'download',
 },
 async (message, match, client) => {
  if (!match || !/^(https:\/\/)?(www\.)?(youtube\.com|youtu\.be)/.test(match)) {
   return await message.reply('ɴᴇᴇᴅ ʏᴛ ᴜʀʟ');
  }
  const msgdl = await message.reply('_Downloading ' + match + '_');
  const res = await getJson('https://api.guruapi.tech/ytdl/ytmp4?url=' + match);
  const buff = await getBuffer(res.audio_url);
  await msgdl.edit(`_Successfully Downloaded ${res.title}\n${res.author}_`);
  return await message.send(buff);
 }
);


haki({
  pattern': "play", 
  alias: ["music"],
  desc: "Downloads audio from YouTube.",
  fromMe: true,
  type: "downloader",
  use: "<search text>"
}, async (_0x213b75, _0x13be17) => {
  try {
    if (!_0x13be17) {
      return await _0x213b75.reply("*_Give Me a Search Query_*");
    }
    let _0x14c1a1 = await yts(_0x13be17);
    let _0x4f86cb = _0x14c1a1.all[0];
    if (!_0x4f86cb) {
      return await _0x213b75.reply("*_No results found for your search_*");
    }
    let _0x4342ba = await smdBuffer(_0x4f86cb.thumbnail);
    await _0x213b75.bot.sendMessage(_0x213b75.jid, {
      'image': _0x4342ba,
      'caption': "\n*HAKI-MD*\n\n*🍀Title :* " + _0x4f86cb.title + "\n*🍀Url :* " + _0x4f86cb.url + "\n*🍀Description :* " + _0x4f86cb.timestamp + "\n*🍀Views :* " + _0x4f86cb.views + "\n*🍀Uploaded :* " + _0x4f86cb.ago + "\n*🍀Author :* " + _0x4f86cb.author.name + "\n\n== |🍀| powered by Haki |🍀| ==\n"
    });
    const _0x23d6e1 = "https://api-gifted-tech.onrender.com/api/download/ytmp3v2?url=" + _0x4f86cb.url + "&apikey=gifteddevskk";
    let _0x4acf6c = 3;
    while (_0x4acf6c > 0) {
      try {
        const _0x2cc463 = await axios.get(_0x23d6e1);
        const _0x509920 = _0x2cc463.data;
        console.log("API Response:", _0x509920);
        if (_0x509920.success && _0x509920.url) {
          const _0x539170 = _0x509920.url;
          const _0x3ce5d2 = await axios({
            'url': _0x539170,
            'method': "GET",
            'responseType': "stream"
          });
          const _0x239ef4 = path.join(__dirname, _0x4f86cb.title + ".mp3");
          const _0x49450f = fs.createWriteStream(_0x239ef4);
          _0x3ce5d2.data.pipe(_0x49450f);
          await new Promise((_0x46fbcf, _0x176108) => {
            _0x49450f.on("finish", _0x46fbcf);
            _0x49450f.on("error", _0x176108);
          });
          console.log("Audio saved to " + _0x239ef4);
          await _0x213b75.bot.sendMessage(_0x213b75.jid, {
            'audio': {
              'url': _0x239ef4
            },
            'fileName': _0x4f86cb.title + ".mp3",
            'mimetype': "audio/mpeg"
          }, {
            'quoted': _0x213b75
          });
          fs.unlinkSync(_0x239ef4);
          return;
        } else {
          console.log("Error: Could not download audio, API response:", _0x509920);
          await _0x213b75.reply("*_Error: Could not download the audio. Please try again later!_*");
          return;
        }
      } catch (_0x2b8c59) {
        console.error("Retry Error:", _0x2b8c59);
        _0x4acf6c--;
        if (_0x4acf6c === 0) {
          await _0x213b75.reply("*_Error: Could not download the audio after multiple attempts. Please try again later!_*");
        }
      }
    }
  } catch (_0x3c9fcf) {
    console.error("Caught Error:", _0x3c9fcf);
    return _0x213b75.error(_0x3c9fcf + "\n\ncommand: play", _0x3c9fcf, "*_File not found!!_*");
  }
});

smd(
  {
    pattern: "gitclone",
    desc: "Downloads repositories as zip files directly from GitHub.",
    type: "downloader",
    fromMe: true,
    use: "<add repository URL.>",
  },
  async (_0x1ae8f8, _0x1c586e) => {
    try {
      let repoUrl = _0x1c586e
        ? _0x1c586e
        : _0x1ae8f8.reply_message
        ? _0x1ae8f8.reply_message.text
        : "";

      if (!repoUrl) {
        return await _0x1ae8f8.reply(
          "*Provide Repo URL, e.g., .git https://github.com/STAR-KING0/Queen_NIKKA_*"
        );
      }

      const githubRegex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;

      if (!githubRegex.test(repoUrl)) {
        return await _0x1ae8f8.reply("*Provide a valid GitHub Repository URL*");
      }

      let [, owner, repo] = repoUrl.match(githubRegex) || [];
      repo = repo.replace(/.git$/, "");

      // Construct the GitHub API URL for downloading the repository as a zip
      const githubApiUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;

      // Fetch the repository zip file
      let response = await axios.get(githubApiUrl, { responseType: "arraybuffer" });

      // Check if the response is valid
      if (response.status !== 200 || response.data.length === 0) {
        return await _0x1ae8f8.reply(
          "*Error: Unable to fetch the repository. Check the repository URL.*"
        );
      }

      const zipFileName = `${repo}.zip`;

      // Send the zip file to the user
      await _0x1ae8f8.bot.sendMessage(_0x1ae8f8.jid, {
        document: Buffer.from(response.data),
        fileName: zipFileName,
        mimetype: "application/zip",
      });

    } catch (error) {
      console.error(error); // Log error for debugging
      return _0x1ae8f8.error(
        "Error: " + error.message + "\n\ncommand: git",
        error,
        "*_Failed to fetch the repository!!!_*"
      );
    }
  }
);
 const ytIdRegex = /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:watch\?.*(?:|\&)v=|embed|shorts\/|v\/)|youtu\.be\/)([-_0-9A-Za-z]{11})/;