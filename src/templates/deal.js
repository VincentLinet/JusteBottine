import * as Discord from "discord.js";

import * as Message from "@/services/message";
import * as Strings from "@/services/strings";
import * as Time from "@/libs/time";
import Data from "@/messages/deals";

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = Discord;

const STORES = {
  epic: { name: "Epic Games Store", color: 0x9dfe89 },
  steam: { name: "Steam", color: 0x66c0f4 }
};

const SUMMARY = 300;

const truncate = (text = "", size = SUMMARY) => (text.length <= size ? text : `${text.slice(0, size - 1).trimEnd()}…`);

const limit = ({ until, deadline }) => {
  if (until) return `<t:${Time.standardize(until)}:F> (<t:${Time.standardize(until)}:R>)`;
  return deadline || Data.soon;
};

export const message = (deal, role) => {
  const { store, title, description, url, image, price, tags = [], kind } = deal;
  const { name, color } = STORES[store];

  const announce = Strings.inject(Data.announce, { title, store: name });

  const fields = [
    { name: Data.price, value: `~~${price}~~ → **${Data.free}**`, inline: true },
    { name: Data.until, value: limit(deal), inline: true }
  ];
  if (tags.length > 0) fields.push({ name: Data.genres, value: tags.map((tag) => `\`${tag}\``).join(" "), inline: false });

  const claim = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(Data.claim).setURL(url);
  const components = [new ActionRowBuilder().addComponents(claim)];

  const content = Message.build({
    color,
    title: `${title} - ${name}`,
    url,
    description: [announce, truncate(description)].filter(Boolean).join("\n\n"),
    image: image ? { url: image } : undefined,
    fields,
    footer: { text: kind },
    components
  });

  if (!role) return content;
  return { ...content, content: `<@&${role}>`, allowedMentions: { roles: [role] } };
};
