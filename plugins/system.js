const axios = require('axios');
const { TIME_ZONE } = require('../config');
const { exec } = require('child_process');
const { haki, tiny, runtime, commands, getOS, getRAMUsage, PluginDB, installPlugin, images } = require('../utils');

haki(
 {
  pattern: 'ping',
  fromMe: false,
  desc: 'haki response in milliseconds.',
  type: 'system',
 },
 async (message) => {
  const start = new Date().getTime();
  const pingMsg = await message.reply('Pinging...');
  const end = new Date().getTime();
  const responseTime = (end - start) / 1000;
  await pingMsg.edit(`*sᴘᴇᴇᴅ ${responseTime} sᴇᴄs*`);
 }
);

haki(
 {
  pattern: 'menu',
  fromMe: false,
  description: 'Show All Commands',
  dontAddCommandList: true,
 },
 async (message, match, m, client) => {
  const { prefix, pushName } = message;
  const currentTime = new Date().toLocaleTimeString('en-IN', { timeZone: TIME_ZONE });
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const currentDate = new Date().toLocaleDateString('en-IN', { timeZone: TIME_ZONE });
  let menuText = `🌐 *Haki-Md* 🌐
═════════════════
👤 *User*: ${pushName}
💡 *Prefix*: ${prefix}
🖥️ *OS*: ${getOS()}
⚙️ *Plugins*: ${commands.length}
⏳ *Runtime*: ${runtime(process.uptime())}
💾 *RAM*: ${getRAMUsage()}
🕰️ *Time*: ${currentTime}
📅 *Day*: ${currentDay}
📆 *Date*: ${currentDate}
📦 *Version*: ${require('../package.json').version}
═════════════════\n`;

  const categorized = commands
   .filter((cmd) => cmd.pattern && !cmd.dontAddCommandList)
   .map((cmd) => ({
    name: cmd.pattern.toString().split(/\W+/)[2],
    category: cmd.type?.toLowerCase() || 'misc',
   }))
   .reduce((acc, { name, category }) => {
    acc[category] = (acc[category] || []).concat(name);
    return acc;
   }, {});

  Object.keys(categorized)
   .sort()
   .forEach((category) => {
    menuText += `\n📂 *${category.toUpperCase()}*\n` +
                categorized[category].sort().map(cmd => `➤ ${cmd}`).join('\n') + '\n═════════════════';
   });

  const media = await images();
  return message.send(media, { caption: menuText });
 }
);

haki(
 {
  pattern: 'list',
  fromMe: false,
  description: 'Show All Commands',
  dontAddCommandList: true,
 },
 async (message) => {
  let commandListText = '\t\t```Command List```\n';
  const commandList = [];

  commands.forEach((command) => {
   if (command.pattern && !command.dontAddCommandList) {
    const commandName = command.pattern.toString().split(/\W+/)[2];
    const description = command.desc || command.info || 'No description available';
    commandList.push({ name: commandName, description });
   }
  });

  commandList.sort((a, b) => a.name.localeCompare(b.name));
  commandList.forEach(({ name, description }, index) => {
   commandListText += `\`\`\`${index + 1} ${name.trim()}\`\`\`\n`;
   commandListText += `Use: \`\`\`${description}\`\`\`\n\n`;
  });

  return await message.sendMessage(message.jid, commandListText.trim());
 }
);

haki(
 {
  pattern: 'restart',
  fromMe: true,
  info: 'Restarts the haki',
  type: 'system',
 },
 async (message, match, m, client) => {
  await message.reply('_Restarting..._');
  await process.exit(1);
 }
);

haki(
 {
  pattern: 'shutdown',
  fromMe: true,
  info: 'Shutdown the haki',
  type: 'system',
 },
 async (m) => {
  await m.reply('_Shutting Down_');
  await exec(require('../package.json').scripts.stop);
 }
);

haki(
 {
  pattern: 'runtime',
  fromMe: false,
  desc: 'Check uptime of haki',
  type: 'system',
 },
 async (message, match) => {
  message.send(`*Uptime:* ${runtime(process.uptime())}`);
 }
);

haki(
 {
  pattern: 'install',
  fromMe: true,
  desc: 'Installs External plugins',
  type: 'system',
 },
 async (message, match, m, client) => {
  if (!match) return message.reply('_Provide Plugin URl_');
  let url = new URL(match);
  if (url.host === 'gist.github.com') url = `https://gist.githubusercontent.com${url.pathname}/raw`;
  const { data } = await axios.get(url);
  const plugin_name = data.match(/(?<=pattern:) ["'](.*?)["']/)?.[1]?.split(' ')?.[0] || `__${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(`${__dirname}/${plugin_name}.js`, data);
  require(`./${plugin_name}`);
  await installPlugin(url, plugin_name);
  message.send(`_Installed: ${plugin_name}_`);
 }
);

haki(
 {
  pattern: 'plugin',
  fromMe: true,
  desc: 'plugin list',
  type: 'system',
 },
 async (message, match, m, client) => {
  const plugins = await PluginDB.findAll();
  if (plugins.length < 1) return message.send('_External Plugins Not Found_');
  message.send(plugins.map((p) => `\`\`\`${p.dataValues.name}\`\`\`: ${p.dataValues.url}`).join('\n'));
 }
);

haki(
 {
  pattern: 'remove',
  fromMe: true,
  desc: 'Remove external plugins',
  type: 'system',
 },
 async (message, match, m, client) => {
  if (!match) return message.sendMessage('_Need a plugin name_');
  const plugin = await PluginDB.findOne({ where: { name: match } });
  if (!plugin) return message.sendMessage('_Plugin not found_');
  await plugin.destroy();
  delete require.cache[require.resolve(`./${match}.js`)];
  fs.unlinkSync(`${__dirname}/${match}.js`);
  message.sendMessage(`Plugin ${match} deleted`);
 }
);

haki(
  {
    pattern: "eval",
    alias: ["$"],
    category: "tools",
    filename: __filename,
    fromMe: true,
    desc: "Runs JavaScript code on the Node.js server.",
    use: "< run code >",
    dontAddCommandList: true,
  },
  async (message, query, { isCreator, cmdName, Void }) => {
    try {
      if (!query) {
        return message.reply("*Provide a query to run*");
      }
      let result = eval("const a = async()=>{\n" + query + "\n}\na()");
      if (typeof result === "object") {
        await message.reply(JSON.stringify(result));
      } else {
        await message.reply(result.toString());
      }
    } catch (error) {
      return await message.reply(error.toString());
    }
  }
);