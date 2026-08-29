require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const voice = require('@discordjs/voice');
const play = require('play-dl');

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
const VERIFY_ROLE_NAME = 'Участник';

client.once('ready', () => {
    console.log(`✅ Бот ${client.user.tag} запущен!`);
    client.user.setActivity('!help | By vipgegeHAHAHA');
});

// Приветствие нового участника
client.on('guildMemberAdd', async (member) => {
    let channel = member.guild.systemChannel;
    if (!channel) {
        channel = member.guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(member.guild.members.me).has('SendMessages'));
    }
    if (!channel) return;

    const inviter = await member.guild.invites.fetch().then(invites => {
        const invite = invites.find(i => i.uses > 0 && i.inviter && i.inviter.id !== member.id);
        return invite ? invite.inviter : null;
    }).catch(() => null);

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setDescription(
            `**Приветствую тебя ${member} ты попал на дискорд сервер лучшей копии**\n\n` +
            `ReallyWorld **WideWorld**\n\n` +
            `Наш айпи: **mc.wideworld.pw**\n` +
            `Наш сайт: **wideworld.pw**\n\n` +
            `👤 ты уже участник **${member.guild.memberCount}-й**\n\n` +
            `Спасибо что зашел к нам!\n` +
            `Кто пригласил: ${inviter ? inviter.toString() : 'Неизвестно'}\n` +
            `Приглашений у него: **?**`
        )
        .setThumbnail('https://cdn.discordapp.com/attachments/1532035417774362745/1542800472891723826/content.png?ex=6a928c68&is=6a913ae8&hm=02ce7876adad5133d5b9a6f028d7bced1968fdcfdbdf7b364d24d9f535a0a9d7')
        .setTimestamp();

    channel.send({ content: `${member}`, embeds: [embed] });
});

// Прощание
client.on('guildMemberRemove', async (member) => {
    let channel = member.guild.systemChannel;
    if (!channel) {
        channel = member.guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(member.guild.members.me).has('SendMessages'));
    }
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

    if (command === 'приветствие' || command === 'welcome') {
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setDescription(
                `**Приветствую тебя ${message.author} ты попал на дискорд сервер лучшей копии**\n\n` +
                `ReallyWorld **WideWorld**\n\n` +
                `Наш айпи: **mc.wideworld.pw**\n` +
                `Наш сайт: **wideworld.pw**\n\n` +
                `👤 ты уже участник **${message.guild.memberCount}-й**\n\n` +
                `Спасибо что зашел к нам!`
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/1532035417774362745/1542800472891723826/content.png?ex=6a928c68&is=6a913ae8&hm=02ce7876adad5133d5b9a6f028d7bced1968fdcfdbdf7b364d24d9f535a0a9d7')
            .setTimestamp();
        message.reply({ embeds: [embed] });
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
                { name: '📌 Основные', value: '`!ping` `!hello` `!help` `!приветствие`', inline: false },
                { name: '📌 Полезные', value: '`!say` `!embed` `!avatar` `!userinfo`', inline: false },
                { name: '📌 Модерация', value: '`!clear` `!kick` `!ban` `!mute` `!unmute`', inline: false },
                { name: '📌 Музыка', value: '`!join` `!play <ссылка>` `!stop` `!leave`', inline: false },
                { name: '📌 Развлечения', value: '`!meme` `!8ball` `!coinflip`', inline: false },
                { name: '📌 Инфо', value: '`!server`', inline: false },
                { name: '📌 Тикеты', value: '`!ticket` (админ) `!close` (тикет)', inline: false },
                { name: '📌 Верификация', value: '`!verify` (админ)', inline: false }
            )
            .setFooter({ text: 'By vipgegeHAHAHA' })
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
                `Через этот раздел можно обратиться по любым рабочим вопросам:\n\n` +
                `• Проблемы с покупкой и доступом\n` +
                `• Технические ошибки и баги\n` +
                `• Предложения по улучшению проекта\n` +
                `• Сотрудничество и партнёрские вопросы\n\n` +
                `Пожалуйста, сразу описывайте ситуацию подробно и без флуда.\n\n` +
                `Выберите причину обращения ниже.`
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Выберите причину обращения')
            .addOptions(
                {
                    label: 'Покупка и доступ',
                    description: 'Проблемы с покупкой и доступом',
                    value: 'purchase',
                    emoji: '🛒'
                },
                {
                    label: 'Технические ошибки',
                    description: 'Баги и технические проблемы',
                    value: 'technical',
                    emoji: '🔧'
                },
                {
                    label: 'Предложения',
                    description: 'Предложения по улучшению',
                    value: 'suggestion',
                    emoji: '💡'
                },
                {
                    label: 'Сотрудничество',
                    description: 'Партнёрские вопросы',
                    value: 'partnership',
                    emoji: '🤝'
                },
                {
                    label: 'Другое',
                    description: 'Другие вопросы',
                    value: 'other',
                    emoji: '📩'
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
                purchase: '🛒 Покупка и доступ',
                technical: '🔧 Технические ошибки',
                suggestion: '💡 Предложения',
                partnership: '🤝 Сотрудничество',
                other: '📩 Другое'
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
            const role = interaction.guild.roles.cache.find(r => r.name === VERIFY_ROLE_NAME);
            if (!role) {
                return interaction.reply({ content: '❌ Роль не найдена! Попроси админа создать роль `Участник`.', ephemeral: true });
            }

            if (interaction.member.roles.cache.has(role.id)) {
                return interaction.reply({ content: '✅ Ты уже верифицирован!', ephemeral: true });
            }

            await interaction.member.roles.add(role);
            await interaction.reply({ content: `✅ Добро пожаловать! Тебе выдана роль **${role.name}**.`, ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
