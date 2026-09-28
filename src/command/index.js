import * as Discord from "discord.js";

import * as Errors from "@/core/errors";
import * as Commands from "@/commands";
import * as Events from "@/events";

const { GatewayIntentBits } = Discord;
const { Guilds } = GatewayIntentBits;

const intents = [Guilds];
const Client = new Discord.Client({ intents });

Client.commands = new Discord.Collection();

const notify = async (error, origin = "unknown") => {
  if (!process.env.OWNER) return;
  const user = await Client.users.fetch(process.env.OWNER);
  await user.send(["💥 Bot crashed", `Origin: ${origin}`, "```", String(error?.stack || error), "```"].join("\n"));
};

const errors = [
  { kind: "unhandledRejection", text: "Unhandled Rejection" },
  { kind: "uncaughtException", text: "Uncaught Exception" }
];

errors.forEach(({ kind, text }) => {
  process.on(kind, async (error) => {
    console.error(text, error);
    await notify(error, text).catch(() => {});
    process.exit(1);
  });
});

Client.on("shardDisconnect", () => {
  process.exit(1);
});

Client.login(process.env.TOKEN);

Object.entries(Commands).forEach(([key, command]) => {
  const { data, execute } = command;
  if (!data || !execute) return Errors.command(key);
  const { name } = data;
  Client.commands.set(name, command);
});

Object.values(Events).forEach(({ name, kind, execute }) => {
  const execution = (...args) => execute(...args);
  Client[kind](name, execution);
});
