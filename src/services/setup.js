import * as Discord from "discord.js";

import * as Schema from "@/models/schema";

const { PermissionsBitField, PermissionFlagsBits, OAuth2Scopes } = Discord;
const { ViewChannel, SendMessages, EmbedLinks, MentionEveryone } = PermissionFlagsBits;

// MentionEveryone lets the bot ping roles that are not set as mentionable
const permissions = new PermissionsBitField([ViewChannel, SendMessages, EmbedLinks, MentionEveryone]);

export const database = async () => {
  await Schema.create();
};

// Global bulk overwrite: Discord only applies what changed, so it is safe on every start
export const commands = async (client) => {
  const body = client.commands.map(({ data }) => data.toJSON());
  const registered = await client.application.commands.set(body);
  console.log(`Registered ${registered.size} application (/) commands.`);
};

export const invite = (client) => {
  const url = client.generateInvite({ scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands], permissions });
  console.log(`Invite link: ${url}`);
};
