import * as Discord from "discord.js";

const data = new Discord.SlashCommandBuilder().setName("ping").setDescription("Répond Pong !");

const execute = async (interaction) => {
  if (interaction.isChatInputCommand()) await interaction.reply("Pong !");
};

export default { data, execute };
