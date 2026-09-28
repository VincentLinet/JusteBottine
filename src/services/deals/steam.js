import config from "config";

import * as Http from "@/libs/http";
import * as Time from "@/libs/time";
import * as Strings from "@/services/strings";
import Data from "@/messages/deals";

const { deals } = config;
const { country, steam } = deals;
const { types } = steam;

const SEARCH = "https://store.steampowered.com/search/results/";
const DETAILS = "https://store.steampowered.com/api/appdetails";
const APP = "https://store.steampowered.com/app";

// Only single apps: packages list several ids ("1,2") and are ignored
const APPID = /data-ds-appid="(\d+)"/g;
const EXPIRY = /Free to keep when you get it before ([^.<]+)\./;
const { kinds, months } = Data;
const KINDS = { game: kinds.game, dlc: kinds.dlc };
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
// "29 Sep @ 3:00pm" or "Sep 29 @ 3:00pm"
const DEADLINE = /^(?:(\d{1,2}) ([a-z]{3})|([a-z]{3}) (\d{1,2})),? @ (\d{1,2}):(\d{2})(am|pm)$/i;

// Skips the age gate of mature games
const cookies = { Cookie: "birthtime=0; lastagecheckage=1-0-1990; wants_mature_content=1" };

const search = async () => {
  const params = new URLSearchParams({ maxprice: "free", specials: 1, infinite: 1, json: 1, cc: country, l: "english" });
  const { results_html: html = "" } = await Http.json(`${SEARCH}?${params}`);
  return [...new Set([...html.matchAll(APPID)].map(([, id]) => id))];
};

const details = async (id) => {
  const params = new URLSearchParams({ appids: id, cc: country, l: "french" });
  const { [id]: result } = await Http.json(`${DETAILS}?${params}`);
  return result?.success ? result.data : null;
};

// Steam only gives the deadline as English text, reformatted to French when recognised
const localize = (text) => {
  const match = text.match(DEADLINE);
  if (!match) return text;

  const [, dayFirst, monthSecond, monthFirst, daySecond, hours, minutes, period] = match;
  const month = MONTHS.indexOf((monthSecond || monthFirst).toLowerCase());
  if (month === -1) return text;

  const hour = (Number(hours) % 12) + (period.toLowerCase() === "pm" ? 12 : 0);
  const time = `${hour}h${minutes}`;

  return Strings.inject(Data.deadline, { day: dayFirst || daySecond, month: months[month], time });
};

// Steam does not expose the end of the giveaway anywhere else than on the store page
const expiry = async (id) => {
  try {
    const html = await Http.text(`${APP}/${id}/?cc=${country}&l=english`, { headers: cookies });
    const [, deadline] = html.match(EXPIRY) || [];
    return deadline ? localize(deadline.trim()) : null;
  } catch {
    return null;
  }
};

const free = (app) => app && types.includes(app.type) && app.price_overview?.discount_percent === 100;

const format = async (app) => {
  const { steam_appid: id, name, short_description, header_image, price_overview, genres = [], type } = app;

  return {
    store: "steam",
    id: String(id),
    title: name,
    description: short_description,
    url: `${APP}/${id}`,
    image: header_image,
    price: price_overview.initial_formatted,
    until: null,
    deadline: await expiry(id),
    tags: genres.map(({ description }) => description),
    kind: KINDS[type] || kinds.game
  };
};

export const list = async () => {
  const ids = await search();
  const games = [];

  // Sequential on purpose, the appdetails endpoint is heavily rate limited
  for (const id of ids) {
    const app = await details(id);
    if (free(app)) games.push(await format(app));
    await Time.sleep();
  }

  return games;
};
