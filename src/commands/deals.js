import * as Discord from "discord.js";

import * as Channel from "@/services/deals/channel";

const { ChannelType, PermissionFlagsBits, InteractionContextType } = Discord;
const { GuildText, GuildAnnouncement } = ChannelType;

const channel = (required) => (option) =>
  option
    .setName("channel")
    .setDescription("Le salon dans lequel les jeux gratuits sont publiés")
    .setRequired(required)
    .addChannelTypes(GuildText, GuildAnnouncement);

const data = new Discord.SlashCommandBuilder()
  .setName("deals")
  .setDescription("Gérer les annonces de jeux gratuits.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("register")
      .setDescription("Publier les jeux gratuits Epic Games / Steam dans un salon.")
      .addChannelOption(channel(true))
      .addRoleOption((option) => option.setName("role").setDescription("Rôle mentionné à chaque annonce"))
      .addBooleanOption((option) => option.setName("epic").setDescription("Publier les offres Epic Games Store (par défaut : oui)"))
      .addBooleanOption((option) => option.setName("steam").setDescription("Publier les offres Steam (par défaut : oui)"))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("unregister")
      .setDescription("Arrêter de publier les jeux gratuits dans un salon.")
      .addChannelOption(channel(true))
  )
  .addSubcommand((subcommand) => subcommand.setName("list").setDescription("Lister les salons recevant les jeux gratuits."))
  .addSubcommand((subcommand) => subcommand.setName("check").setDescription("Chercher de nouveaux jeux gratuits maintenant."));

const execute = async (interaction) => {
  if (interaction.isChatInputCommand()) await Channel.execute(interaction);
};

export default { data, execute };
