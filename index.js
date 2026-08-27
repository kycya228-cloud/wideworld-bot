require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const PREFIX = '!';

client.once('ready', () => {
    console.log(`✅ Бот ${client.user.tag} запущен!`);
    client.user.setActivity('!help | By vipgegeHAHAHA');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        const sent = await message.reply('🏓 Pinging...');
        sent.edit(`🏓 Pong! Задержка: ${sent.createdTimestamp - message.createdTimestamp}ms | API: ${client.ws.ping}ms`);
    }

    if (command === 'hello' || command === 'привет') {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('👋 Привет!')
            .setDescription(`Привет, ${message.author}! Я бот **By vipgegeHAHAHA**!`)
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    if (command === 'help' || command === 'помощь') {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📖 Команды')
            .addFields(
                { name: '!ping', value: 'Проверка бота', inline: true },
                { name: '!hello', value: 'Приветствие', inline: true },
                { name: '!server', value: 'Информация о сервере', inline: true },
                { name: '!help', value: 'Список команд', inline: true }
            )
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    if (command === 'server') {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🏠 Информация о сервере')
            .addFields(
                { name: 'Название', value: message.guild.name, inline: true },
                { name: 'Участники', value: `${message.guild.memberCount}`, inline: true },
                { name: 'Каналы', value: `${message.guild.channels.cache.size}`, inline: true },
                { name: 'Создан', value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }
});

client.login(process.env.TOKEN);
