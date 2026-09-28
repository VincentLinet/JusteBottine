import { Events } from "discord.js";
import * as Setup from "@/services/setup";
import * as Deals from "@/services/deals";

const name = Events.ClientReady;
const kind = "once";
const execute = async (client) => {
  console.log(`Ready! Logged in as ${client.user.tag}`);

  await Setup.database();
  await Setup.commands(client);
  Setup.invite(client);

  Deals.schedule(client);
};

const event = { name, kind, execute };

export default event;
