import cron from "node-cron";
import config from "config";

import * as Errors from "@/core/errors";
import * as Channels from "@/models/channel";
import * as Deals from "@/models/deal";
import * as Template from "@/templates/deal";
import * as Epic from "./epic";
import * as Steam from "./steam";
import * as Rating from "./rating";

const { deals } = config;
const { schedule: expression, timezone, cooldown } = deals;

export const stores = { epic: Epic, steam: Steam };

let running = false;

const collect = async () => {
  const fetcher = async ([store, service]) => {
    try {
      const games = await service.list();
      return [store, games.filter(Rating.passes)];
    } catch (error) {
      Errors.error(`Unable to fetch ${store} deals: ${error.message}`);
      return [store, []];
    }
  };
  const entries = await Promise.all(Object.entries(stores).map(fetcher));
  return Object.fromEntries(entries);
};

const publish = async (client, channel, store, games) => {
  const { id, role } = channel;
  if (!channel[store] || games.length === 0) return 0;

  const recent = await Deals.recent(id, store, cooldown);
  const fresh = games.filter((game) => !recent.includes(game.id));
  if (fresh.length === 0) return 0;

  const target = await client.channels.fetch(id).catch(() => null);
  if (!target?.isSendable()) {
    Errors.warning(`Channel ${id} is unreachable, skipping ${store} deals.`);
    return 0;
  }

  for (const game of fresh) {
    await target.send(Template.message(game, role));
    await Deals.save({ channel: id, store, product: game.id, until: game.until });
  }

  return fresh.length;
};

export const dispatch = async (client, guild) => {
  const channels = guild ? await Channels.guild(guild) : await Channels.active();
  if (channels.length === 0) return 0;

  const catalog = await collect();
  let count = 0;

  for (const channel of channels) {
    for (const [store, games] of Object.entries(catalog)) {
      try {
        count += await publish(client, channel, store, games);
      } catch (error) {
        Errors.error(`Unable to publish ${store} deals in ${channel.id}: ${error.message}`);
      }
    }
  }

  return count;
};

const run = async (client) => {
  if (running) return;
  running = true;
  try {
    const count = await dispatch(client);
    if (count > 0) console.log(`Posted ${count} new deal(s).`);
  } catch (error) {
    Errors.error(`Deals dispatch failed: ${error.message}`);
  } finally {
    running = false;
  }
};

export const schedule = (client) => {
  cron.schedule(expression, () => run(client), { timezone });
  run(client);
};
