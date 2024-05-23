const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Get information about my commands!"),
    cooldown: 30,
    async execute(interaction) {
        const guildid = interaction.guild.id;
        const dirs = [];
        const categories = [];

        fs.readdirSync("./commands/").forEach((dir) => {
            let commands = fs.readdirSync(`./commands/${dir}`).filter(file => file.endsWith(".js"));
            const cmds = commands.map((command) => {
                let file = require(`../../commands/${dir}/${command}`);
                return {
                    name: dir,
                    commands: {
                        name: file.data.name,
                        description: file.data.description
                    }
                }
            });

            categories.push(cmds.filter(categ => categ.name === dir));
        })

        let page = 0;
        const emojis = {
            "music": "🎵",
            "utilities": "🛄",
        };

        const description = {
            "music": "Music commands.",
            "utilities": "Generally useful commands to use.",
        }

        const menuoptions = [
            {
                label: "Home",
                description: "Home Page",
                emoji: "🏡",
                value: "home"
            }
        ]

        categories.forEach(cat => {
            dirs.push(cat[0].name);
        });

        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: 'HuoHuo Help', 
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }), 
            })
            .setColor('#2F3136')
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`Prefix của bot là: /help \nDùng menu để xem các lệnh dựa trên danh mục!\n\n`)
            .addFields(
                { name: '`# THÔNG TIN :`', value: '> **CONTACT OF BOT OWNER**\n```https://www.facebook.com/thyahannn/```', inline: false }
            )
            .setTimestamp()
            .setFooter({
                text: `/help | Requested by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            });
            

        dirs.forEach((dir, index) => {
            embed.addFields({ name: `${emojis[dir] ||''} ${dir.charAt(0).toUpperCase() + dir.slice(1).toLowerCase()}`, value: `${description[dir] ? description[dir] : `${dir.charAt(0).toUpperCase() + dir.slice(1).toLowerCase()} Commands`}`},)

            menuoptions.push({
                label: `${dir.charAt(0).toUpperCase() + dir.slice(1).toLowerCase()}`,
                description: `${dir.charAt(0).toUpperCase() + dir.slice(1).toLowerCase()} commands page`,
                emoji: `${emojis[dir] || ''}`,
                value: `${page++}`
            })
        });

        const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId('select')
            .setPlaceholder('Click to see all the categories')
            .addOptions(menuoptions)
        )

        interaction.reply({ embeds: [embed], components: [row], fetchReply: true});
    }
}