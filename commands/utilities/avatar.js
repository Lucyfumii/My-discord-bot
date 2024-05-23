const discord = require("discord.js");

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName("avatar")
        .setDescription("display the avatar")
        .addUserOption(option => option
            .setName("user")
            .setDescription("select the user")
        ),
    /**
     * @param {discord.ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;
        await interaction.deferReply({ ephemeral: false });
        await this.displayAvatar(interaction, user);
    },

    async displayAvatar(interaction, user) {
        const languages = {
            size: "Size",
            serverAvatar: "Server Avatar",
            displayAvatar: "Displayed Avatar",
            displayBanner: "Displayed Banner",
            animated: "Animated",
            format: "Format",
            general: "General",
            error: "Only {X} can use these selectMenus/Buttons"
        };

        const emojis = {
            false: "❌",
            true: "✅",
            change: "🔁"
        };

        const userFetched = await interaction.client.users.fetch(user.id, { force: true });
        const memberExists = await interaction.guild.members.fetch(user.id).then(() => true).catch(() => false);
        const member = memberExists ? await interaction.guild.members.fetch(user.id) : null;

        const sizes = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
        const formats = ['png', 'webp', 'jpg', 'jpeg', ...(userFetched.displayAvatarURL().includes(".gif") ? ["gif"] : [])];
        let type = "avatar";
        let change = "user";

        const embed = new discord.EmbedBuilder()
            .setAuthor({ name: userFetched.tag, iconURL: userFetched.displayAvatarURL({ size: 1024 }) })
            .addFields({
                name: languages.general,
                value: [
                    `> **${languages.animated}: ${userFetched.displayAvatarURL().includes(".gif") ? emojis.true : emojis.false}**`,
                    `> **${languages.serverAvatar}: ${emojis.false}**`
                ].join("\n")
            })
            .setColor(interaction.member.displayColor)
            .setImage(userFetched.displayAvatarURL({ size: 1024 }));

        const buttons = new discord.ActionRowBuilder().addComponents(
            new discord.ButtonBuilder().setCustomId("change-to-banner").setLabel("Banner").setEmoji(emojis.change).setStyle("Primary").setDisabled(!userFetched.banner),
            new discord.ButtonBuilder().setURL(userFetched.displayAvatarURL({ size: 1024 })).setLabel("Avatar Link").setStyle("Link")
        );

        const sizeMenu = new discord.ActionRowBuilder().addComponents(
            new discord.StringSelectMenuBuilder().addOptions(
                sizes.map(size => ({ label: `${size}x${size}`, value: size.toString() }))
            ).setCustomId("size_menu").setPlaceholder(`${languages.size}: 1024x1024`).setMaxValues(1).setDisabled(!userFetched.avatar)
        );

        const formatMenu = new discord.ActionRowBuilder().addComponents(
            new discord.StringSelectMenuBuilder().addOptions(
                formats.map(format => ({ label: format.toUpperCase(), value: format }))
            ).setCustomId("format_menu").setPlaceholder(`${languages.format}: ${userFetched.displayAvatarURL().includes(".gif") ? "GIF" : "WEBP"}`).setMaxValues(1).setDisabled(!userFetched.avatar)
        );

        const changeMenu = new discord.ActionRowBuilder().addComponents(
            new discord.StringSelectMenuBuilder().addOptions(
                { label: "Server", value: "server", emoji: emojis.change }
            ).setCustomId("change_menu").setPlaceholder(`${languages.displayAvatar}: User`).setMaxValues(1)
        );

        if (!memberExists || member.displayAvatarURL() === userFetched.displayAvatarURL()) {
            changeMenu.components[0].setDisabled(true);
        }

        const message = await interaction.editReply({ embeds: [embed], components: [sizeMenu, formatMenu, changeMenu, buttons] });
        const collector = message.createMessageComponentCollector({ idle: 3e5 });

        collector.on("collect", async (i) => {
            await i.deferUpdate();
            let size = 1024;
            let format = embed.data.image.url.split('.').pop().split("?")[0] || "webp";

            if (i.user.id !== interaction.user.id) {
                const errorText = languages.error.replace("{X}", interaction.user.toString());
                await i.followUp({ content: errorText, ephemeral: true });
                return;
            }

            if (type === "avatar") {
                if (i.customId === "change-to-banner") {
                    type = "banner";
                    change = "user";
                    const bannerFormats = ['png', 'webp', 'jpg', 'jpeg', ...(userFetched.bannerURL().includes(".gif") ? ['gif'] : [])];
                    const bannerFormat = userFetched.bannerURL().includes("a_") ? "gif" : "webp";

                    buttons.components[0].setCustomId("change-to-avatar").setLabel("Avatar").setEmoji(emojis.change);
                    formatMenu.components[0].setOptions(bannerFormats.map(format => ({ label: format.toUpperCase(), value: format }))).setPlaceholder(`${languages.format}: ${bannerFormat.toUpperCase()}`);
                    buttons.components[1].setURL(userFetched.bannerURL({ size: Number(size), extension: bannerFormat, forceStatic: true })).setLabel("Banner Link");
                    changeMenu.components[0].setPlaceholder(`${languages.displayBanner}: User`).setDisabled(true);

                    embed.setFields({
                        name: languages.general,
                        value: `> **${languages.animated}: ${userFetched.bannerURL().includes(".gif") ? emojis.true : emojis.false}**`
                    });
                    embed.setImage(userFetched.bannerURL({ forceStatic: true, extension: bannerFormat, size: Number(size) }));

                    await i.editReply({ embeds: [embed], components: [sizeMenu, formatMenu, changeMenu, buttons] });
                } else if (i.customId === "change_menu") {
                    const selected = i.values[0];
                    const targetUser = selected === "server" ? member : userFetched;
                    const userType = selected === "server" ? "Server" : "User";
                    const userFormats = ['png', 'webp', 'jpg', 'jpeg', ...(targetUser.displayAvatarURL().includes(".gif") ? ['gif'] : [])];
                    const userFormat = targetUser.displayAvatarURL().includes("a_") ? "gif" : "webp";

                    change = selected;
                    embed.setFields({
                        name: languages.general,
                        value: [
                            `> **${languages.animated}: ${targetUser.displayAvatarURL().includes(".gif") ? emojis.true : emojis.false}**`,
                            `> **${languages.serverAvatar}: ${selected === "server" ? emojis.true : emojis.false}**`
                        ].join("\n")
                    });
                    embed.setImage(targetUser.displayAvatarURL({ size: Number(size), extension: userFormat, forceStatic: true }));
                    changeMenu.components[0].setPlaceholder(`${languages.displayAvatar}: ${userType}`);
                    formatMenu.components[0].setOptions(userFormats.map(format => ({ label: format.toUpperCase(), value: format }))).setPlaceholder(`${languages.format}: ${userFormat.toUpperCase()}`);
                    buttons.components[1].setURL(targetUser.displayAvatarURL({ size: Number(size), extension: userFormat, forceStatic: true }));

                    await i.editReply({ embeds: [embed], components: [sizeMenu, formatMenu, changeMenu, buttons] });
                } else if (i.customId === "size_menu") {
                    size = i.values[0];
                    const targetUser = change === "user" ? userFetched : member;

                    embed.setImage(targetUser.displayAvatarURL({ size: Number(size), extension: format, forceStatic: true }));
                    buttons.components[1].setURL(targetUser.displayAvatarURL({ size: Number(size), extension: format, forceStatic: true }));
                    sizeMenu.components[0].setPlaceholder(`${languages.size}: ${size}x${size}`);

                    await i.editReply({ embeds: [embed], components: [sizeMenu, formatMenu, changeMenu, buttons] });
                } else if (i.customId === "format_menu") {
                    format = i.values[0];
                    size = embed.data.image.url.split("?size=")[1];
                    const targetUser = change === "user" ? userFetched : member;

                    embed.setImage(targetUser.displayAvatarURL({ size: Number(size), extension: format, forceStatic: true }));
                    buttons.components[1].setURL(targetUser.displayAvatarURL({ size: Number(size), extension: format, forceStatic: true }));
                    formatMenu.components[0].setPlaceholder(`${languages.format}: ${format.toUpperCase()}`);

                    await i.editReply({ embeds: [embed], components: [sizeMenu, formatMenu, changeMenu, buttons] });
                }
            } else if (type === "banner") {
                if (i.customId === "change-to-avatar") {
                    type = "avatar";
                    change = "user";
                    const avatarFormats = ['png', 'webp', 'jpg', 'jpeg', ...(userFetched.displayAvatarURL().includes(".gif") ? ['gif'] : [])];
                    const avatarFormat = userFetched.displayAvatarURL().includes("a_") ? "gif" : "webp";

                    buttons.components[0].setCustomId("change-to-banner").setLabel("Banner").setEmoji(emojis.change);
                    formatMenu.components[0].setOptions(avatarFormats.map(format => ({ label: format.toUpperCase(), value: format }))).setPlaceholder(`${languages.format}: ${avatarFormat.toUpperCase()}`);
                    buttons.components[1].setURL(userFetched.displayAvatarURL({ size: Number(size), extension: avatarFormat, forceStatic: true })).setLabel("Avatar Link");
                    changeMenu.components[0].setPlaceholder(`${languages.displayAvatar}: User`).setOptions({ label: "Server", value: "server", emoji: emojis.change });

                    if (!memberExists || member.displayAvatarURL() === userFetched.displayAvatarURL()) {
                        changeMenu.components[0].setDisabled(true);
                    } else {
                        changeMenu.components[0].setDisabled(false);
                    }

                    embed.setFields({
                        name: languages.general,
                        value: [
                            `> **${languages.animated}: ${userFetched.displayAvatarURL().includes(".gif") ? emojis.true : emojis.false}**`,
                            `> **${languages.serverAvatar}: ${emojis.false}**`
                        ].join("\n")
                    });
                    embed.setImage(userFetched.displayAvatarURL({ forceStatic: true, extension: avatarFormat, size: Number(size) }));

                    await i.editReply({ embeds: [embed], components: [sizeMenu, formatMenu, changeMenu, buttons] });
                } else if (i.customId === "size_menu") {
                    size = i.values[0];

                    embed.setImage(userFetched.bannerURL({ size: Number(size), extension: format, forceStatic: true }));
                    buttons.components[1].setURL(userFetched.bannerURL({ size: Number(size), extension: format, forceStatic: true }));
                    sizeMenu.components[0].setPlaceholder(`${languages.size}: ${size}x${size}`);

                    await i.editReply({ embeds: [embed], components: [sizeMenu, formatMenu, changeMenu, buttons] });
                } else if (i.customId === "format_menu") {
                    format = i.values[0];
                    size = embed.data.image.url.split("?size=")[1];

                    embed.setImage(userFetched.bannerURL({ size: Number(size), extension: format, forceStatic: true }));
                    buttons.components[1].setURL(userFetched.bannerURL({ size: Number(size), extension: format, forceStatic: true }));
                    formatMenu.components[0].setPlaceholder(`${languages.format}: ${format.toUpperCase()}`);

                    await i.editReply({ embeds: [embed], components: [sizeMenu, formatMenu, changeMenu, buttons] });
                }
            }
        });

        collector.on("end", async () => {
            changeMenu.components[0].setDisabled(true);
            sizeMenu.components[0].setDisabled(true);
            formatMenu.components[0].setDisabled(true);
            buttons.components[0].setDisabled(true);

            interaction.editReply({ components: [sizeMenu, formatMenu, changeMenu, buttons] });
        });
    }
};
