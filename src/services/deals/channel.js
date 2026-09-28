import * as Discord from "discord.js";

import * as Channels from "@/models/channel";
import * as Strings from "@/services/strings";
import * as Deals from "@/services/deals";
import Data from "@/messages/deals";

const { MessageFlags, PermissionFlagsBits } = Discord;
const { ViewChannel, SendMessages, SendMessagesInThreads, EmbedLinks } = PermissionFlagsBits;

const STORES = { epic: "Epic Games", steam: "Steam" };

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

const selection = (row) =>
  Object.entries(STORES)
    .filter(([store]) => row[store])
    .map(([, name]) => name)
    .join(", ");

const register = async (interaction) => {
  const { options, guild, guildId, client } = interaction;
  const selected = options.getChannel("channel", true);
  const role = options.getRole("role");
  const epic = options.getBoolean("epic") ?? true;
  const steam = options.getBoolean("steam") ?? true;

  if (!epic && !steam) return interaction.reply(ephemeral(Data.nothing));

  const channel = await client.channels.fetch(selected.id).catch(() => null);
  const send = channel?.isThread() ? SendMessagesInThreads : SendMessages;
  const permissions = channel?.permissionsFor(guild.members.me);
  if (!permissions?.has([ViewChannel, send, EmbedLinks])) {
    return interaction.reply(ephemeral(Strings.inject(Data.forbidden, { channel: `<#${selected.id}>` })));
  }

  await Channels.register({ id: channel.id, guild: guildId, role: role?.id, epic, steam });

  const content = Strings.inject(Data.registered, { channel: `${channel}`, list: selection({ epic, steam }) });
  return interaction.reply(ephemeral(content));
};

const unregister = async (interaction) => {
  const { options, guildId } = interaction;
  const channel = options.getChannel("channel", true);

  const removed = await Channels.deactivate(channel.id, guildId);
  const text = removed ? Data.unregistered : Data.unknown;

  return interaction.reply(ephemeral(Strings.inject(text, { channel: `${channel}` })));
};

const list = async (interaction) => {
  const channels = await Channels.guild(interaction.guildId);
  if (channels.length === 0) return interaction.reply(ephemeral(Data.empty));

  const line = (row) => {
    const mention = row.role ? ` → <@&${row.role}>` : "";
    return `• <#${row.id}> (${selection(row)})${mention}`;
  };

  return interaction.reply(ephemeral([Data.list, ...channels.map(line)].join("\n")));
};

const check = async (interaction) => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const count = await Deals.dispatch(interaction.client, interaction.guildId);
  const text = count > 0 ? Strings.inject(Data.checked, { count }) : Data.uptodate;
  return interaction.editReply(text);
};

const subcommands = { register, unregister, list, check };

export const execute = async (interaction) => {
  const subcommand = subcommands[interaction.options.getSubcommand()];
  if (subcommand) return subcommand(interaction);
};
