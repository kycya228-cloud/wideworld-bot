require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

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

// Приветствие нового участника
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.systemChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setDescription(
            `> Приветствую тебя ${member}, ты попал на DC сервер **${member.guild.name}**!\n\n` +
            `🌐 Наш сайт: **WideWorld.pw**\n` +
            `🎮 Minecraft IP: **mc.wideworld.pw**\n\n` +
            `👤 Ты уже **${member.guild.memberCount}** участник!\n\n` +
            `*Надеюсь, что тебе понравится у нас :) Удачи!*`
        )
        .setTimestamp();

    channel.send({ embeds: [embed] });
});

// Прощание
client.on('guildMemberRemove', async (member) => {
    const channel = member.guild.systemChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('😢 Участник вышел')
        .setDescription(`**${member.user.tag}** покинул сервер.`)
        .setTimestamp();

    channel.send({ embeds: [embed] });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // === ОСНОВНЫЕ ===

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

    // === ПОЛЕЗНЫЕ ===

    if (command === 'say' || command === 'скажи') {
        const text = args.join(' ');
        if (!text) {
            return message.reply('❌ Использование: `!say <текст>`');
        }
        message.delete().catch(() => {});
        message.channel.send(text);
    }

    if (command === 'embed') {
        const text = args.join(' ');
        if (!text) {
            return message.reply('❌ Использование: `!embed <текст>`');
        }
        message.delete().catch(() => {});
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setDescription(text)
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }

    if (command === 'avatar' || command === 'аватар') {
        const user = message.mentions.users.first() || message.author;
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`🖼 Аватар ${user.tag}`)
            .setImage(user.displayAvatarURL({ size: 512 }));
        message.reply({ embeds: [embed] });
    }

    if (command === 'userinfo' || command === 'whois') {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(user.id);
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`👤 Информация о ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'ID', value: user.id, inline: true },
                { name: 'Создан', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Зашёл', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', inline: true },
                { name: 'Роли', value: member ? `${member.roles.cache.size}` : 'N/A', inline: true }
            )
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    // === МОДЕРАЦИЯ ===

    if (command === 'clear' || command === 'purge') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ Нет прав! Нужна пермишн `Manage Messages`.');
        }
        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
            return message.reply('❌ Использование: `!clear <1-100>`');
        }
        await message.channel.bulkDelete(amount + 1);
        const msg = await message.channel.send(`✅ Удалено **${amount}** сообщений!`);
        setTimeout(() => msg.delete(), 3000);
    }

    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ Нет прав! Нужна пермишн `Kick Members`.');
        }
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Использование: `!kick @user [причина]`');
        const reason = args.slice(1).join(' ') || 'Не указана';
        const member = message.guild.members.cache.get(user.id);
        await member.kick(reason);
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('👢 Участник кикнут')
            .addFields(
                { name: 'Участник', value: `${user.tag}`, inline: true },
                { name: 'Модератор', value: `${message.author.tag}`, inline: true },
                { name: 'Причина', value: reason, inline: false }
            );
        message.reply({ embeds: [embed] });
    }

    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ Нет прав! Нужна пермишн `Ban Members`.');
        }
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Использование: `!ban @user [причина]`');
        const reason = args.slice(1).join(' ') || 'Не указана';
        const member = message.guild.members.cache.get(user.id);
        await member.ban({ reason });
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔨 Участник забанен')
            .addFields(
                { name: 'Участник', value: `${user.tag}`, inline: true },
                { name: 'Модератор', value: `${message.author.tag}`, inline: true },
                { name: 'Причина', value: reason, inline: false }
            );
        message.reply({ embeds: [embed] });
    }

    if (command === 'mute' || command === 'timeout') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Нет прав! Нужна пермишн `Moderate Members`.');
        }
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Использование: `!mute @user <минуты> [причина]`');
        const minutes = parseInt(args[1]) || 5;
        const reason = args.slice(2).join(' ') || 'Не указана';
        const member = message.guild.members.cache.get(user.id);
        await member.timeout(minutes * 60 * 1000, reason);
        const embed = new EmbedBuilder()
            .setColor(0xFFAA00)
            .setTitle('🔇 Участник замьючен')
            .addFields(
                { name: 'Участник', value: `${user.tag}`, inline: true },
                { name: 'Время', value: `${minutes} мин`, inline: true },
                { name: 'Причина', value: reason, inline: false }
            );
        message.reply({ embeds: [embed] });
    }

    if (command === 'unmute') {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ Нет прав!');
        }
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Использование: `!unmute @user`');
        const member = message.guild.members.cache.get(user.id);
        await member.timeout(null);
        message.reply(`✅ ${user.tag} размьючен!`);
    }

    // === РАЗВЛЕЧЕНИЯ ===

    if (command === 'meme') {
        const memes = [
            '😂 Когда код работает с первого раза — это не баг, это мечта.',
            '😂 Программист: "Это работает на моей машине." Девопс: "А у нас другой сценарий."',
            '😂 99 багов в коде, добавь один — 100 багов в коде.',
            '😂 Git commit -m "Fix" — лучший комментарий в истории.',
            '😂 Stack Overflow — лучший друг программиста.',
            '😂 Debugging: быть детективом в криминальном шоу, где ты убийца.',
            '😂 - Почему программисты путают Хэллоуин и Рождество? - Потому что OCT 31 = DEC 25.',
            '😂 TL;DR — Too Long; Didn\'t Read —.memo для программистов.'
        ];
        const embed = new EmbedBuilder()
            .setColor(0xFFAA00)
            .setTitle('😂 Мем дня')
            .setDescription(memes[Math.floor(Math.random() * memes.length)])
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    if (command === '8ball' || command === 'шар') {
        const question = args.join(' ');
        if (!question) return message.reply('❌ Использование: `!8ball <вопрос>`');
        const answers = [
            '🟢 Да, конечно!',
            '🟢 Безусловно!',
            '🟢 100%!',
            '🟡 Возможно...',
            '🟡 Думаю да',
            '🟡 Вероятно',
            '🔴 Нет',
            '🔴 Ни за что!',
            '🔴 Забудь об этом',
            '⚪ Спроси позже...',
            '⚪ Не могу сказать...',
            '⚪ Концентрируйся и спроси снова'
        ];
        const embed = new EmbedBuilder()
            .setColor(0x9900FF)
            .setTitle('🔮 Магический шар')
            .addFields(
                { name: 'Вопрос', value: question },
                { name: 'Ответ', value: answers[Math.floor(Math.random() * answers.length)] }
            )
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    if (command === 'coinflip' || command === 'монетка') {
        const result = Math.random() < 0.5 ? 'Орёл 🪙' : 'Решка 🪙';
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🪙 Подбрасываю монетку...')
            .setDescription(result)
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    // === ИНФО ===

    if (command === 'server') {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🏠 Информация о сервере')
            .addFields(
                { name: 'Название', value: message.guild.name, inline: true },
                { name: 'Участники', value: `${message.guild.memberCount}`, inline: true },
                { name: 'Каналы', value: `${message.guild.channels.cache.size}`, inline: true },
                { name: 'Ролей', value: `${message.guild.roles.cache.size}`, inline: true },
                { name: 'Эмодзи', value: `${message.guild.emojis.cache.size}`, inline: true },
                { name: 'Создан', value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    if (command === 'help' || command === 'помощь') {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📖 Команды By vipgegeHAHAHA')
            .addFields(
                { name: '📌 Основные', value: '`!ping` `!hello` `!help`', inline: false },
                { name: '📌 Полезные', value: '`!say` `!embed` `!avatar` `!userinfo`', inline: false },
                { name: '📌 Модерация', value: '`!clear` `!kick` `!ban` `!mute` `!unmute`', inline: false },
                { name: '📌 Развлечения', value: '`!meme` `!8ball` `!coinflip`', inline: false },
                { name: '📌 Инфо', value: '`!server`', inline: false }
            )
            .setFooter({ text: 'By vipgegeHAHAHA' })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }
});

client.login(process.env.TOKEN);
