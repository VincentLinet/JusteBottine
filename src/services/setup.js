import * as Discord from "discord.js";

import * as Schema from "@/models/schema";

const { PermissionsBitField, PermissionFlagsBits, OAuth2Scopes } = Discord;
const { ViewChannel, SendMessages, SendMessagesInThreads, EmbedLinks, MentionEveryone } = PermissionFlagsBits;

const permissions = new PermissionsBitField([ViewChannel, SendMessages, SendMessagesInThreads, EmbedLinks, MentionEveryone]);

export const database = async () => {
  await Schema.create();
};

export const commands = async (client) => {
  const body = client.commands.map(({ data }) => data.toJSON());
  const registered = await client.application.commands.set(body);
  console.log(`Registered ${registered.size} application (/) commands.`);
};

export const invite = (client) => {
  const url = client.generateInvite({ scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands], permissions });
  console.log(`Invite link: ${url}`);
};
