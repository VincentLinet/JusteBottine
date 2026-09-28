import { Events } from "discord.js";
import * as Channels from "@/models/channel";

const name = Events.GuildDelete;
const kind = "on";
const execute = async (guild) => {
  if (!guild.available) return;

  await Channels.leave(guild.id);
};

const event = { name, kind, execute };

export default event;
