import { Events } from "discord.js";
import * as Errors from "@/core/errors";

const name = Events.InteractionCreate;
const kind = "on";

const execute = async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

  const { client, commandName: name } = interaction;

  const command = client.commands.get(name);

  if (!command) return Errors.error(`No command matching ${name} was found.`);

  try {
    await command.execute(interaction);
  } catch (error) {
    Errors.error(`Error executing ${name}`);
    Errors.error(error);
  }
};

const event = { name, kind, execute };

export default event;
