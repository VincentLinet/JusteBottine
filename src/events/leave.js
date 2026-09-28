import { Events } from "discord.js";
import * as Channels from "@/models/channel";

const name = Events.GuildDelete;
const kind = "on";
const execute = async (guild) => {
  // Also fired when a guild becomes unavailable during a Discord outage, the bot is still a member then
  if (!guild.available) return;

  await Channels.leave(guild.id);
};

const event = { name, kind, execute };

export default event;
