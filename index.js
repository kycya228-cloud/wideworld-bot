require('dotenv').config({ path: __dirname + '/.env' });
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const voice = require('@discordjs/voice');
const play = require('play-dl');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const PREFIX = '!';
const TICKET_CATEGORY_NAME = 'ТИКЕТЫ';
const VERIFY_ROLE_NAME = 'Игрок';
const BANNED_WORDS = ['хуй', 'пизда', 'блять', 'блядь', 'сука', 'нахуй', 'ебать', 'ёб', 'еба', 'пидор', 'гей', 'фашист', 'нацист'];
const DATA_FILE = __dirname + '/data.json';

let userData = {};
let reminders = [];
let warnings = {};
let coins = {};
let welcomeChannelId = null;
let VERIFY_ROLE_NAME_ENV = 'Игрок';
const captchaAnswers = new Map();
let reactionRoles = {};

try {
    if (fs.existsSync(DATA_FILE)) {
        const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        userData = saved.userData || {};
        reminders = saved.reminders || [];
        warnings = saved.warnings || {};
        reactionRoles = saved.reactionRoles || {};
        coins = saved.coins || {};
        welcomeChannelId = saved.welcomeChannelId || null;
    }
} catch (e) {}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ userData, reminders, warnings, reactionRoles, coins, welcomeChannelId }, null, 2));
    } catch (e) {}
}

function addXP(userID, xp) {
    if (!userData[userID]) userData[userID] = { xp: 0, level: 1 };
    userData[userID].xp += xp;
    const needed = userData[userID].level * 100;
    if (userData[userID].xp >= needed) {
        userData[userID].level++;
        userData[userID].xp -= needed;
        return true;
    }
    return false;
}

function getLevel(userID) {
    if (!userData[userID]) return { xp: 0, level: 1 };
    return userData[userID];
}

client.once('ready', () => {
    console.log(`✅ Бот ${client.user.tag} запущен!`);
    client.user.setActivity('!help | By vipgegeHAHAHA');

    // Проверка напоминаний каждую минуту
    setInterval(async () => {
        const now = Date.now();
        const due = reminders.filter(r => r.time <= now);
        for (const r of due) {
            try {
                const channel = await client.channels.fetch(r.channelID);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFFAA00)
                        .setTitle('🔔 Напоминание!')
                        .setDescription(`<@${r.userID}>: ${r.text}`)
                        .setTimestamp();
                    channel.send({ embeds: [embed] });
                }
            } catch (e) {}
        }
        reminders = reminders.filter(r => r.time > now);
        if (due.length > 0) saveData();
    }, 60000);
});

// Приветствие
client.on('guildMemberAdd', async (member) => {
    if (welcomeChannelId === 'off') return;
    let channel = null;
    if (welcomeChannelId) {
        channel = member.guild.channels.cache.get(welcomeChannelId);
        if (!channel) return;
    } else {
        channel = member.guild.systemChannel;
        if (!channel) {
            channel = member.guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(member.guild.members.me).has('SendMessages'));
        }
    }
    if (!channel) return;

    const inviter = await member.guild.invites.fetch().then(invites => {
        const invite = invites.find(i => i.uses > 0 && i.inviter && i.inviter.id !== member.id);
        return invite ? invite.inviter : null;
    }).catch(() => null);

    const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('✦ Добро пожаловать на WideWorld ✦')
        .setDescription(
            `╔══════════════════════════════╗\n\n` +
            `👋 Добро пожаловать, ${member}\n\n` +
            `Ты попал на сервер **лучшей копии** Minecraft\n\n` +
            `╚══════════════════════════════╝\n\n` +
            `🌐 **Наш сайт:** [wideworld.pw](https://wideworld.pw)\n` +
            `🎮 **IP сервера:** \`mc.wideworld.pw\`\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📌 Что тебя ждёт:\n` +
            `> 🔹 Уникальный геймплей\n` +
            `> 🔹 Дружелюбное комьюнити\n` +
            `> 🔹 Ивенты и турниры\n` +
            `> 🔹 Справедливая модерация\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `👤 Ты **${member.guild.memberCount}-й** участник\n` +
            `${inviter ? `🔗 Пригласил: ${inviter}` : '🔗 Пригласитель: Неизвестно'}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*Не забудь пройти верификацию в канале #верификация*`
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setImage('https://cdn.discordapp.com/attachments/1532035417774362745/1542800472891723826/content.png?ex=6a928c68&is=6a913ae8&hm=02ce7876adad5133d5b9a6f028d7bced1968fdcfdbdf7b364d24d9f535a0a9d7')
        .setFooter({ text: 'WideWorld • mc.wideworld.pw', iconURL: member.guild.iconURL() })
        .setTimestamp();

    channel.send({ content: `${member}`, embeds: [embed] });
});

// Защита роли верификации — нельзя снять
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const role = newMember.guild.roles.cache.find(r => r.name.toLowerCase() === VERIFY_ROLE_NAME_ENV.toLowerCase());
    if (!role) return;
    const hadRole = oldMember.roles.cache.has(role.id);
    const hasRole = newMember.roles.cache.has(role.id);
    if (hadRole && !hasRole) {
        await newMember.roles.add(role).catch(() => {});
        const logChannel = newMember.guild.channels.cache.find(ch => ch.name === 'логи' || ch.name === 'logs');
        if (logChannel) {
            logChannel.send(`🔒 Роль **${role.name}** была снята с ${newMember}, но вернута обратно!`).catch(() => {});
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // XP за сообщение
    if (message.guild) {
        const leveledUp = addXP(message.author.id, Math.floor(Math.random() * 10) + 5);
        if (leveledUp) {
            const lvl = getLevel(message.author.id);
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⬆️ Новый уровень!')
                .setDescription(`${message.author}, ты достиг уровня **${lvl.level}**!`);
            message.channel.send({ embeds: [embed] }).then(msg => setTimeout(() => msg.delete(), 5000));
        }
    }

    // Авто-модерация (только для не-команд)
    if (message.guild && !message.member.permissions.has(PermissionFlagsBits.Administrator) && !message.content.startsWith(PREFIX)) {
        const lower = message.content.toLowerCase();
        for (const word of BANNED_WORDS) {
            if (lower.includes(word)) {
                await message.delete().catch(() => {});
                const w = (warnings[message.author.id] || 0) + 1;
                warnings[message.author.id] = w;
                if (w >= 3) {
                    await message.member.timeout(10 * 60 * 1000, 'Мат (авто-модерация)');
                    message.channel.send(`🔇 ${message.author} замьючен на 10 мин за мат (3 предупреждения)`);
                } else {
                    message.channel.send(`⚠️ ${message.author}, мат запрещён! Предупреждение **${w}/3**`).then(msg => setTimeout(() => msg.delete(), 5000));
                }
                return;
            }
        }

        if (message.content.includes('http://') || message.content.includes('https://')) {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                await message.delete().catch(() => {});
                message.channel.send(`🔗 ${message.author}, ссылки запрещены!`).then(msg => setTimeout(() => msg.delete(), 5000));
                return;
            }
        }
    }

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

    if (command === 'реклама' || command === 'clan' || command === 'клан') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }
        // !реклама <ссылка> [название клана] — если без ссылки, шлёт пример как на скрине
        const invite = args[0] && args[0].startsWith('http') ? args.shift() : 'https://discord.gg/wideworld';
        const clanName = args.join(' ') || 'CLAN/НЕБО';
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🤝 ${clanName} 🔍`)
            .setDescription(
                `👋 Ку ребятки давно искали хороший клан без софтов? Тогда вам к нам новый клан **${clanName}** 🔍\n` +
                `Данный клан состоит из разных версий, онлайна мало но мы надеемся на вас, всем удачи\n\n` +
                `**Ссылка на сервер**\n` +
                `[Присоединиться](${invite})`
            )
            .setFooter({ text: 'WideWorld • mc.wideworld.pw', iconURL: message.guild.iconURL() })
            .setTimestamp();
        // синяя полоска слева как на скрине — через setColor
        await message.channel.send({ embeds: [embed] });
        // отдельно кидаем инвайт чтобы дискорд отрисовал карточку как на скрине (зеленая кнопка Перейти на сервер)
        if (invite.startsWith('http')) await message.channel.send(invite).catch(() => {});
        message.delete().catch(() => {});
        return;
    }

    if (command === 'help' || command === 'помощь') {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📖 Команды бота')
            .addFields(
                { name: '📌 Основные', value: '`!ping` `!hello` `!help`', inline: false },
                { name: '📌 Полезные', value: '`!say` `!embed` `!avatar` `!userinfo`', inline: false },
                { name: '📌 Модерация', value: '`!clear` `!kick` `!ban` `!mute` `!unmute`', inline: false },
                { name: '📌 Музыка', value: '`!join` `!play <ссылка>` `!stop` `!leave`', inline: false },
                { name: '📌 Развлечения', value: '`!meme` `!8ball` `!coinflip` `!poll <вопрос>` `!spam <кол-во> <текст>` `!анекдот` `!шар <вопрос>`', inline: false },
                { name: '📌 Уровни', value: '`!rank` `!leaderboard`', inline: false },
                { name: '📌 Напоминания', value: '`!remind <минуты> <текст>`', inline: false },
                { name: '📌 Статистика', value: '`!server` `!stats` `!дата` `!ктоя`', inline: false },
                { name: '📌 Тикеты', value: '`!ticket` (админ) `!close` (тикет)', inline: false },
                { name: '📌 Верификация', value: '`!verify` (админ)', inline: false },
                { name: '📌 Роли', value: '`!role2 <роль>` `!выдатьвсем <роль>` `!role <роль>` (админ)', inline: false },
                { name: '📌 Приветствие', value: '`!welcome #канал` `!welcome off` (админ)', inline: false },
                { name: '📌 Реклама', value: '`!реклама [ссылка] [название]` `!clan` (админ)', inline: false }
            )
            .setFooter({ text: 'By vipgegeHAHAHA' })
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    // === СПАМ ===

    if (command === 'spam') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }
        const count = parseInt(args[0]);
        const text = args.slice(1).join(' ');
        if (!count || !text) return message.reply('❌ Использование: `!spam <кол-во> <текст>`');
        if (count > 20) return message.reply('❌ Максимум 20 раз!');
        message.delete().catch(() => {});
        for (let i = 0; i < count; i++) {
            message.channel.send(text);
        }
    }

    // === РОЛИ ПО РЕАКЦИЯМ ===

    if (command === 'roles') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }
        if (!args[0]) {
            return message.reply('❌ Использование: `!roles <канал> эмодзи1 @роль1, эмодзи2 @роль2`\nПример: `!roles #роли 🎮 @Игровая, 🎵 @Музыка`');
        }
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply('❌ Укажи канал!');
        const rolePairs = args.slice(1).join(' ').split(',').map(s => s.trim()).filter(s => s);
        if (rolePairs.length === 0) return message.reply('❌ Укажи пары эмодзи + роль!');

        let description = '**Выбери роль нажав на эмодзи:**\n\n';
        const reactions = [];
        const mapping = {};

        for (const pair of rolePairs) {
            const parts = pair.split(/\s+/);
            if (parts.length < 2) continue;
            const emoji = parts[0];
            const roleName = parts.slice(1).join(' ').replace(/[@<>!&]/g, '');
            const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (!role) continue;
            description += `${emoji} — ${role}\n`;
            reactions.push(emoji);
            mapping[emoji] = role.id;
        }

        if (reactions.length === 0) return message.reply('❌ Не нашёл роли! Проверь названия.');

        const embed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setDescription(description)
            .setFooter({ text: 'Нажми на эмодзи чтобы получить роль' })
            .setTimestamp();

        const msg = await channel.send({ embeds: [embed] });
        for (const emoji of reactions) {
            await msg.react(emoji).catch(() => {});
        }
        reactionRoles[msg.id] = mapping;
        saveData();
        message.reply(`✅ Панель ролей создана в ${channel}`);
    }

    if (command === 'roleremove' || command === 'rr') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }
        const msgId = args[0];
        if (!msgId) return message.reply('❌ Укажи ID сообщения!');
        if (reactionRoles[msgId]) {
            delete reactionRoles[msgId];
            saveData();
            message.reply('✅ Роль-панель удалена!');
        } else {
            message.reply('❌ Не нашёл такую панель!');
        }
    }

    // === УРОВНИ ===

    if (command === 'rank') {
        const user = message.mentions.users.first() || message.author;
        const lvl = getLevel(user.id);
        const needed = lvl.level * 100;
        const bar = '█'.repeat(Math.floor(lvl.xp / needed * 10)) + '░'.repeat(10 - Math.floor(lvl.xp / needed * 10));
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`📊 Ранг ${user.tag}`)
            .addFields(
                { name: 'Уровень', value: `${lvl.level}`, inline: true },
                { name: 'XP', value: `${lvl.xp}/${needed}`, inline: true },
                { name: 'Прогресс', value: bar, inline: false }
            );
        message.reply({ embeds: [embed] });
    }

    if (command === 'leaderboard' || command === 'топ') {
        const sorted = Object.entries(userData)
            .sort(([, a], [, b]) => (b.level * 100 + b.xp) - (a.level * 100 + a.xp))
            .slice(0, 10);
        let text = '';
        sorted.forEach(([id, data], i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            text += `${medal} <@${id}> — Ур. **${data.level}** (${data.xp} XP)\n`;
        });
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Топ-10 участников')
            .setDescription(text || 'Пока нет данных');
        message.reply({ embeds: [embed] });
    }

    // === ОПРОСЫ ===

    if (command === 'poll') {
        const question = args.join(' ');
        if (!question) return message.reply('❌ Использование: `!poll <вопрос>`');
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📊 Опрос')
            .setDescription(question)
            .setFooter({ text: `Опрос от ${message.author.tag}` })
            .setTimestamp();
        const msg = await message.channel.send({ embeds: [embed] });
        await msg.react('👍');
        await msg.react('👎');
        message.delete().catch(() => {});
    }

    // === НАПОМИНАНИЯ ===

    if (command === 'remind' || command === 'напомни') {
        const minutes = parseInt(args[0]);
        const text = args.slice(1).join(' ');
        if (!minutes || !text) return message.reply('❌ Использование: `!remind <минуты> <текст>`');
        reminders.push({
            userID: message.author.id,
            channelID: message.channel.id,
            text: text,
            time: Date.now() + minutes * 60 * 1000
        });
        saveData();
        message.reply(`✅ Напомню через **${minutes}** мин: ${text}`);
    }

    // === СТАТИСТИКА ===

    if (command === 'stats') {
        const online = message.guild.members.cache.filter(m => m.presence?.status === 'online').size;
        const bots = message.guild.members.cache.filter(m => m.user.bot).size;
        const textChannels = message.guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = message.guild.channels.cache.filter(c => c.type === 2).size;
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`📊 Статистика ${message.guild.name}`)
            .addFields(
                { name: '👥 Всего участников', value: `${message.guild.memberCount}`, inline: true },
                { name: '🟢 Онлайн', value: `${online}`, inline: true },
                { name: '🤖 Ботов', value: `${bots}`, inline: true },
                { name: '💬 Текстовых каналов', value: `${textChannels}`, inline: true },
                { name: '🔊 Голосовых каналов', value: `${voiceChannels}`, inline: true },
                { name: '📅 Создан', value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }

    // Верификация - выдать панель (админ)
    if (command === 'verify') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }

        const embed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setDescription(
                `🔐 **Верификация**\n\n` +
                `Нажми кнопку ниже чтобы получить доступ к серверу.\n` +
                `После верификации тебе станет доступен весь сервер.`
            );

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel('✅ Верифицироваться')
                .setStyle(ButtonStyle.Success)
        );

        await message.channel.send({ embeds: [embed], components: [button] });
        message.delete().catch(() => {});
    }

    // Настройка приветствия
    if (command === 'welcome' || command === 'приветствие') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }
        const arg = args[0];
        if (!arg) {
            const cur = welcomeChannelId === 'off' ? 'выключено' : welcomeChannelId ? `<#${welcomeChannelId}>` : 'авто (системный канал)';
            return message.reply(`📌 Текущий канал приветствия: ${cur}\nИспользование: \`!welcome #канал\` или \`!welcome off\``);
        }
        if (arg.toLowerCase() === 'off' || arg.toLowerCase() === 'выкл') {
            welcomeChannelId = 'off';
            saveData();
            return message.reply('✅ Приветствие **выключено**.');
        }
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply('❌ Укажи канал: `!welcome #канал` или `!welcome off`');
        welcomeChannelId = channel.id;
        saveData();
        message.reply(`✅ Канал приветствия установлен: ${channel}`);
    }

    // Установить роль верификации
    if (command === 'role') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }
        const roleName = args.join(' ');
        if (!roleName) return message.reply(`❌ Текущая роль верификации: **${VERIFY_ROLE_NAME_ENV}**\nИспользование: \`!role <название или @упоминание>\``);
        let role = message.mentions.roles.first();
        if (!role) {
            role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        }
        if (!role) return message.reply(`❌ Роль **${roleName}** не найдена!`);
        VERIFY_ROLE_NAME_ENV = role.name;
        message.reply(`✅ Роль верификации установлена: **${role.name}**`);
    }

    // Выдать роль всем
    if (command === 'role2') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }
        const roleName = args.join(' ');
        if (!roleName) return message.reply('❌ Использование: `!role2 <название роли>`');
        const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        if (!role) return message.reply(`❌ Роль **${roleName}** не найдена!`);
        const msg = await message.reply(`🔄 Выдаю роль **${role.name}** участникам...`);
        let count = 0;
        const members = await message.guild.members.fetch();
        for (const [, member] of members) {
            if (!member.user.bot && !member.roles.cache.has(role.id)) {
                await member.roles.add(role).catch(() => {});
                count++;
            }
        }
        msg.edit(`✅ Роль **${role.name}** выдана **${count}** участникам!`);
    }

    // Выдать роль всем (алиас)
    if (command === 'выдатьвсем' || command === 'giveall') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы!');
        }
        const roleName = args.join(' ');
        if (!roleName) return message.reply('❌ Использование: `!выдатьвсем <название роли>`');
        let role = message.mentions.roles.first();
        if (!role) {
            role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        }
        if (!role) return message.reply(`❌ Роль **${roleName}** не найдена!`);
        const msg = await message.reply(`🔄 Выдаю роль **${role.name}** участникам...`);
        let count = 0;
        const members = await message.guild.members.fetch();
        for (const [, member] of members) {
            if (!member.user.bot && !member.roles.cache.has(role.id)) {
                await member.roles.add(role).catch(() => {});
                count++;
            }
        }
        msg.edit(`✅ Роль **${role.name}** выдана **${count}** участникам!`);
    }

    // === ЭКОНОМИКА ===

    if (command === 'daily' || command === 'ежедневно') {
        const uid = message.author.id;
        if (!coins[uid]) coins[uid] = { amount: 0, daily: 0 };
        const now = Date.now();
        if (coins[uid].daily && now - coins[uid].daily < 24 * 60 * 60 * 1000) {
            const next = coins[uid].daily + 24 * 60 * 60 * 1000;
            const diff = next - now;
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            return message.reply(`⏰ Подожди ещё **${hours}ч ${mins}м** до следующей ежедневки!`);
        }
        const reward = Math.floor(Math.random() * 500) + 100;
        coins[uid].amount += reward;
        coins[uid].daily = now;
        saveData();
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('💰 Ежедневная награда!')
            .setDescription(`Ты получил **${reward}** коинов!\nБаланс: **${coins[uid].amount}** коинов`);
        message.reply({ embeds: [embed] });
    }

    if (command === 'balance' || command === 'bal' || command === 'баланс') {
        const user = message.mentions.users.first() || message.author;
        const uid = user.id;
        if (!coins[uid]) coins[uid] = { amount: 0, daily: 0 };
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`💰 Баланс ${user.username}`)
            .setDescription(`**${coins[uid].amount}** коинов`);
        message.reply({ embeds: [embed] });
    }

    if (command === 'transfer' || command === 'pay' || command === 'передать') {
        const target = message.mentions.users.first();
        if (!target) return message.reply('❌ Использование: `!transfer @пользователь <сумма>`');
        if (target.id === message.author.id) return message.reply('❌ Нельзя переводить себе!');
        if (target.bot) return message.reply('❌ Нельзя переводить ботам!');
        const amount = parseInt(args[1]);
        if (!amount || amount <= 0) return message.reply('❌ Укажи сумму!');
        const uid = message.author.id;
        if (!coins[uid]) coins[uid] = { amount: 0, daily: 0 };
        if (coins[uid].amount < amount) return message.reply(`❌ Недостаточно коинов! У тебя **${coins[uid].amount}**`);
        if (!coins[target.id]) coins[target.id] = { amount: 0, daily: 0 };
        coins[uid].amount -= amount;
        coins[target.id].amount += amount;
        saveData();
        message.reply(`✅ Ты перевёл **${amount}** коинов ${target}`);
    }

    if (command === 'slot' || command === 'слоты') {
        const uid = message.author.id;
        if (!coins[uid]) coins[uid] = { amount: 0, daily: 0 };
        const bet = parseInt(args[0]) || 100;
        if (bet <= 0) return message.reply('❌ Ставка должна быть больше 0!');
        if (coins[uid].amount < bet) return message.reply(`❌ Недостаточно! Нужно **${bet}**, у тебя **${coins[uid].amount}**`);
        const symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '💎', '7️⃣'];
        const s1 = symbols[Math.floor(Math.random() * symbols.length)];
        const s2 = symbols[Math.floor(Math.random() * symbols.length)];
        const s3 = symbols[Math.floor(Math.random() * symbols.length)];
        let win = 0;
        if (s1 === s2 && s2 === s3) win = bet * 5;
        else if (s1 === s2 || s2 === s3 || s1 === s3) win = bet * 2;
        coins[uid].amount += win - bet;
        saveData();
        const embed = new EmbedBuilder()
            .setColor(win > 0 ? 0x00FF00 : 0xFF0000)
            .setTitle('🎰 Слот-машина')
            .setDescription(`[ ${s1} | ${s2} | ${s3} ]\n\n${win > 0 ? `🏆 Выигрыш: **${win}** коинов!` : `😔 Проигрыш: **-${bet}** коинов`}\nБаланс: **${coins[uid].amount}**`);
        message.reply({ embeds: [embed] });
    }

    if (command === 'rob' || command === 'ограбить') {
        const target = message.mentions.users.first();
        if (!target) return message.reply('❌ Использование: `!rob @пользователь`');
        if (target.id === message.author.id) return message.reply('❌ Нельзя грабить себя!');
        if (target.bot) return message.reply('❌ Нельзя грабить ботов!');
        const uid = message.author.id;
        if (!coins[uid]) coins[uid] = { amount: 0, daily: 0 };
        if (!coins[target.id]) coins[target.id] = { amount: 0, daily: 0 };
        if (coins[target.id].amount < 50) return message.reply('❌ У жертвы мало коинов!');
        const chance = Math.random();
        if (chance < 0.5) {
            const stolen = Math.floor(Math.random() * Math.min(coins[target.id].amount, 500)) + 50;
            coins[uid].amount += stolen;
            coins[target.id].amount -= stolen;
            saveData();
            message.reply(`💰 Ты成功 ограбил ${target} и украл **${stolen}** коинов!`);
        } else {
            const fine = Math.floor(Math.random() * 200) + 50;
            coins[uid].amount -= fine;
            saveData();
            message.reply(`🚔 Ты попался! Штраф **${fine}** коинов. Баланс: **${coins[uid].amount}**`);
        }
    }

    // === ИГРЫ ===

    if (command === 'trivia' || command === 'викторина') {
        const questions = [
            { q: 'Какая столица Франции?', a: ['париж', 'paris'] },
            { q: 'Сколько планет в Солнечной системе?', a: ['8', 'восемь'] },
            { q: 'Кто написал "Войну и мир"?', a: ['толстой', 'лев толстой', 'leo tolstoy'] },
            { q: 'Какой газ мы вдыхаем?', a: ['кислород', 'o2'] },
            { q: 'Какая самая большая планета?', a: ['юпитер', 'jupiter'] },
            { q: 'Сколько дней в високосном году?', a: ['366', 'триста шестьдесят шесть'] },
            { q: 'Какой язык программирования создан в 1995?', a: ['javascript', 'java script'] },
            { q: 'Как называется валюта Японии?', a: ['йена', 'иена', 'yen', 'jpy'] },
            { q: 'Кто изобрёл лампочку?', a: ['эдисон', 'тесла', 'edison'] },
            { q: 'Какой океан самый большой?', a: ['тихий', 'pacific'] },
        ];
        const q = questions[Math.floor(Math.random() * questions.length)];
        const embed = new EmbedBuilder()
            .setColor(0xFF6600)
            .setTitle('🧠 Викторина')
            .setDescription(`**${q.q}**\n\nНапиши ответ в чат! У тебя 15 секунд.`)
            .setFooter({ text: 'Ответ в чат' });
        await message.reply({ embeds: [embed] });
        const filter = m => m.author.id === message.author.id;
        try {
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
            const answer = collected.first().content.toLowerCase().trim();
            if (q.a.includes(answer)) {
                const reward = Math.floor(Math.random() * 200) + 100;
                const uid = message.author.id;
                if (!coins[uid]) coins[uid] = { amount: 0, daily: 0 };
                coins[uid].amount += reward;
                saveData();
                message.reply(`✅ Правильно! Ты получил **${reward}** коинов!`);
            } else {
                message.reply(`❌ Неправильно! Правильный ответ: **${q.a[0]}**`);
            }
        } catch {
            message.reply(`⏰ Время вышло! Правильный ответ: **${q.a[0]}**`);
        }
    }

    if (command === 'ship' || command === 'совместимость') {
        const user1 = message.author;
        const user2 = message.mentions.users.first();
        if (!user2) return message.reply('❌ Использование: `!ship @пользователь`');
        if (user2.id === user1.id) return message.reply('❌ Нельзя проверять себя с собой!');
        const percent = Math.floor(Math.random() * 101);
        let hearts = '';
        for (let i = 0; i < 10; i++) {
            hearts += i < Math.floor(percent / 10) ? '❤️' : '🖤';
        }
        let text = '';
        if (percent >= 90) text = '💘 Идеальная пара!';
        else if (percent >= 70) text = '💕 Отличная совместимость!';
        else if (percent >= 50) text = '💜 Неплохо!';
        else if (percent >= 30) text = '💔 Маловато...';
        else text = '💀 Не судьба...';
        const embed = new EmbedBuilder()
            .setColor(0xFF69B4)
            .setTitle('💘 Совместимость')
            .setDescription(`${user1} + ${user2}\n\n${hearts}\n\n**${percent}%**\n${text}`);
        message.reply({ embeds: [embed] });
    }

    // === РАЗВЛЕЧЕНИЯ (дополнительные) ===

    if (command === 'анекдот' || command === 'joke') {
        const jokes = [
            '— Почему программист путает Хеллоуин и Рождество? — Потому что Oct 31 = Dec 25.',
            '— Что сказал 0 числу 8? — Классный пояс!',
            '— Как программист проверяетidelity? — Он не проверяет, он доверяет.',
            '— Почему у программиста всегда холодные ноги? — Потому что он сидит в Windows.',
            '— Что делает программист на отдыхе? — Отдыхает от программиста.',
            '— Как назвать программиста без女朋友? — Соло кодер.',
            '— Почему Java-разработчики путают Рождество и Хеллоуин? — Потому что Oct 31 == Dec 25.',
            '— Как программист убивает время? — Он оптимизирует его.',
            '— Что сказал один баг другому? — Мы family!',
            '— Почему программист ходил к врачу? — У него были проблемы с backbone.',
            '— Как программист_notes в ресторане? — Он оставляет commit в меню.',
            '— Что делает код, когда ему холодно? — Он компилируется в warmer.',
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('😂 Анекдот')
            .setDescription(joke);
        message.reply({ embeds: [embed] });
    }

    if (command === 'дата' || command === 'date') {
        const now = new Date();
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📅 Текущая дата и время')
            .setDescription(
                `**Дата:** ${now.toLocaleDateString('ru-RU')}\n` +
                `**Время:** ${now.toLocaleTimeString('ru-RU')}\n` +
                `**День недели:** ${now.toLocaleDateString('ru-RU', { weekday: 'long' })}`
            );
        message.reply({ embeds: [embed] });
    }

    if (command === 'ктоя' || command === 'whoami') {
        const user = message.author;
        const member = message.member;
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('👤 Информация о тебе')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Имя', value: user.tag, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'Создан', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Зашёл на сервер', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Роли', value: member.roles.cache.map(r => r.toString()).join(' '), inline: false }
            );
        message.reply({ embeds: [embed] });
    }

    if (command === 'шар' || command === 'ball') {
        const question = args.join(' ');
        if (!question) return message.reply('❌ Использование: `!шар <вопрос>`');
        const answers = [
            '✅ Да!', '❌ Нет!', '🤔 Возможно...', '🎭 Спроси позже',
            '💯 Точно да!', '🚫 Точно нет!', '😴 Может быть...', '🎯 Скорее да',
            '⚠️ Не уверен', '🎲 Попробуй снова', '💀 Нет и не будет!',
            '🙌 Конечно!', '🫡 Так и есть', '🤡 Ты шутишь?'
        ];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        const embed = new EmbedBuilder()
            .setColor(0x7B2FBE)
            .setTitle('🔮 Шар судьбы')
            .addFields(
                { name: 'Вопрос', value: question },
                { name: 'Ответ', value: answer }
            );
        message.reply({ embeds: [embed] });
    }

    // === МУЗЫКА ===

    if (command === 'join') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Зайди в голосовой канал!');
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return message.reply('❌ Нет прав на подключение/говорение!');
        }

        const connection = voice.joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎵 Подключился!')
            .setDescription(`Зашёл в **${voiceChannel.name}**`);
        message.reply({ embeds: [embed] });
    }

    if (command === 'play') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('❌ Зайди в голосовой канал!');
        }

        const query = args.join(' ');
        if (!query) {
            return message.reply('❌ Использование: `!play <ссылка YouTube или название>`');
        }

        await message.reply('🔍 Ищу трек...');

        try {
            const search = await play.search(query, { limit: 1 });
            if (!search || !search[0]) {
                return message.edit('❌ Ничего не нашёл!');
            }

            const stream = await play.stream(search[0].url);

            const connection = voice.joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            const resource = voice.createAudioResource(stream.stream, {
                inputType: stream.type
            });

            const player = voice.createAudioPlayer();
            player.play(resource);
            connection.subscribe(player);

            player.on('error', error => {
                console.error('Ошибка плеера:', error);
            });

            player.on(voice.AudioPlayerStatus.Idle, () => {
                connection.destroy();
            });

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🎵 Играет!')
                .setDescription(`[${search[0].title}](${search[0].url})`)
                .addFields(
                    { name: 'Длительность', value: search[0].durationRaw, inline: true },
                    { name: 'Канал', value: search[0].channel.name, inline: true }
                )
                .setThumbnail(search[0].thumbnails[0].url);
            message.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.edit('❌ Ошибка при воспроизведении!');
        }
    }

    if (command === 'stop') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Зайди в голосовой канал!');

        const connection = voice.getVoiceConnection(message.guild.id);
        if (!connection) return message.reply('❌ Бот не в голосовом канале!');

        connection.destroy();
        message.reply('⏹️ Остановлен!');
    }

    if (command === 'leave') {
        const connection = voice.getVoiceConnection(message.guild.id);
        if (!connection) return message.reply('❌ Бот не в голосовом канале!');

        connection.destroy();
        message.reply('👋 Вышел из голосового канала!');
    }

    // === ТИКЕТЫ ===

    if (command === 'ticket') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Только администраторы могут использовать эту команду!');
        }

        const banner = new EmbedBuilder()
            .setImage('https://cdn.discordapp.com/attachments/1532035417774362745/1542800472891723826/content.png?ex=6a928c68&is=6a913ae8&hm=02ce7876adad5133d5b9a6f028d7bced1968fdcfdbdf7b364d24d9f535a0a9d7')
            .setColor(0x2F3136);

        const panel = new EmbedBuilder()
            .setColor(0x2F3136)
            .setDescription(
                `🛠 **Центр поддержки ${message.guild.name}**\n\n` +
                `**Нужна помощь? Создайте тикет.**\n\n` +
                `Выберите причину обращения:\n\n` +
                `❓ **Помощь по серверу** — вопросы по серверу, правилам, функционалу\n` +
                `🐛 **Баги и ошибки** — нашёл баг? сообщи нам\n` +
                `🎭 **Выдача ролей** — запрос на получение роли\n` +
                `🔧 **Тех поддержка** — проблемы с игрой, модами, подключением\n` +
                `🤝 **Партнерство** — предложение о сотрудничестве`
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Выберите причину обращения')
            .addOptions(
                {
                    label: 'Помощь по серверу',
                    description: 'Вопросы по серверу и правилам',
                    value: 'server_help',
                    emoji: '❓'
                },
                {
                    label: 'Баги и ошибки',
                    description: 'Сообщить о баге или ошибке',
                    value: 'bugs',
                    emoji: '🐛'
                },
                {
                    label: 'Выдача ролей',
                    description: 'Запрос на получение роли',
                    value: 'role',
                    emoji: '🎭'
                },
                {
                    label: 'Тех поддержка',
                    description: 'Проблемы с игрой, модами, подключением',
                    value: 'tech',
                    emoji: '🔧'
                },
                {
                    label: 'Партнерство',
                    description: 'Предложение о сотрудничестве',
                    value: 'partner',
                    emoji: '🤝'
                }
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await message.channel.send({ embeds: [banner] });
        await message.channel.send({ embeds: [panel], components: [row] });
        message.delete().catch(() => {});
    }

    if (command === 'close') {
        if (!message.channel.name.startsWith('тикет-')) {
            return message.reply('❌ Эта команда только для тикет-каналов!');
        }
        message.reply('🔒 Тикет закрывается через 5 секунд...');
        setTimeout(() => {
            message.channel.delete().catch(() => {});
        }, 5000);
    }
});

// Обработка выбора причины
client.on('interactionCreate', async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_select') {
            const reasons = {
                server_help: '❓ Помощь по серверу',
                bugs: '🐛 Баги и ошибки',
                role: '🎭 Выдача ролей',
                tech: '🔧 Тех поддержка',
                partner: '🤝 Партнерство'
            };

            const reason = reasons[interaction.values[0]] || '📩 Другое';
            const user = interaction.user;
            const guild = interaction.guild;

            let category = guild.channels.cache.find(c => c.name === TICKET_CATEGORY_NAME && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({
                    name: TICKET_CATEGORY_NAME,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel']
                        },
                        {
                            id: user.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        }
                    ]
                });
            }

            const ticketChannel = await guild.channels.create({
                name: `тикет-${user.username}`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['ViewChannel']
                    },
                    {
                        id: user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    }
                ]
            });

            const ticketEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('📩 Тикет создан')
                .setDescription(
                    `${user}, добро пожаловать!\n\n` +
                    `**Причина:** ${reason}\n\n` +
                    `Опишите вашу проблему подробно.\n` +
                    `Для закрытия тикета напишите \`!close\``
                )
                .setTimestamp();

            await ticketChannel.send({ content: `${user}`, embeds: [ticketEmbed] });
            await interaction.reply({ content: `✅ Тикет создан: ${ticketChannel}`, ephemeral: true });
        }
    }

    // Верификация - кнопка
    if (interaction.isButton()) {
        if (interaction.customId === 'verify_button') {
            const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === VERIFY_ROLE_NAME_ENV.toLowerCase());
            if (!role) {
                return interaction.reply({ content: `❌ Роль **${VERIFY_ROLE_NAME_ENV}** не найдена!`, ephemeral: true });
            }

            if (interaction.member.roles.cache.has(role.id)) {
                return interaction.reply({ content: '✅ Ты уже верифицирован!', ephemeral: true });
            }

            const a = Math.floor(Math.random() * 30) + 1;
            const b = Math.floor(Math.random() * 30) + 1;
            const correct = a + b;
            const wrong1 = correct + Math.floor(Math.random() * 5) + 1;
            let wrong2 = correct - Math.floor(Math.random() * 5) - 1;
            if (wrong2 < 0) wrong2 = 0;
            const answers = [correct, wrong1, wrong2].sort(() => Math.random() - 0.5);

            const row = new ActionRowBuilder();
            for (const ans of answers) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`verify_captcha_${ans}`)
                        .setLabel(`${ans}`)
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            const captchaEmbed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔐 Проверка')
                .setDescription(`Реши пример чтобы подтвердить что ты не бот:\n\n**${a} + ${b} = ?**`)
                .setTimestamp();

            await interaction.reply({ embeds: [captchaEmbed], components: [row], ephemeral: true });
        }

        if (interaction.customId.startsWith('verify_captcha_')) {
            const answer = parseInt(interaction.customId.split('_')[2]);
            const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === VERIFY_ROLE_NAME_ENV.toLowerCase());
            if (!role) {
                return interaction.reply({ content: `❌ Роль не найдена!`, ephemeral: true });
            }

            if (interaction.member.roles.cache.has(role.id)) {
                return interaction.reply({ content: '✅ Ты уже верифицирован!', ephemeral: true });
            }

            if (answer !== undefined) {
                await interaction.member.roles.add(role);
                await interaction.reply({ content: `✅ Правильно! Добро пожаловать! Тебе выдана роль **${role.name}**.`, ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Неправильно! Попробуй снова.', ephemeral: true });
            }
        }
    }
});

// Обработка ответа капчи в ЛС
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.guild) return;
    const userId = message.author.id;
    if (!captchaAnswers.has(userId)) return;
    const correct = captchaAnswers.get(userId);
    const userAnswer = parseInt(message.content.trim());
    if (isNaN(userAnswer)) return;
    captchaAnswers.delete(userId);
    if (userAnswer === correct) {
        const guild = client.guilds.cache.first();
        if (!guild) return;
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return;
        const role = guild.roles.cache.find(r => r.name.toLowerCase() === VERIFY_ROLE_NAME_ENV.toLowerCase());
        if (!role) return;
        await member.roles.add(role);
        await message.reply(`✅ Правильно! Тебе выдана роль **${role.name}**.`);
    } else {
        await message.reply(`❌ Неправильно! Правильный ответ: **${correct}**. Попробуй снова.`);
    }
});

// Роли по реакциям — выдать
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (!reactionRoles[reaction.message.id]) return;
    const roleId = reactionRoles[reaction.message.id][reaction.emoji.name];
    if (!roleId) return;
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    const role = guild.roles.cache.get(roleId);
    if (!role) return;
    await member.roles.add(role).catch(() => {});
});

// Роли по реакциям — снять
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (!reactionRoles[reaction.message.id]) return;
    const roleId = reactionRoles[reaction.message.id][reaction.emoji.name];
    if (!roleId) return;
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    const role = guild.roles.cache.get(roleId);
    if (!role) return;
    await member.roles.remove(role).catch(() => {});
});

client.login(process.env.TOKEN);
