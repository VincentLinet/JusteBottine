import config from "config";

import * as Http from "@/libs/http";
import Data from "@/messages/deals";

const { deals } = config;
const { country, locale } = deals;

const API = "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions";
const STORE = "https://store.epicgames.com";
const IMAGES = ["OfferImageWide", "DieselStoreFrontWide", "featuredMedia", "Thumbnail"];
const { kinds } = Data;
const KINDS = { BASE_GAME: kinds.game, DLC: kinds.dlc, ADD_ON: kinds.addon, BUNDLE: kinds.bundle, EDITION: kinds.edition };

const offers = ({ promotions }) =>
  promotions?.promotionalOffers?.flatMap(({ promotionalOffers }) => promotionalOffers) || [];

// A free giveaway is a running promotion bringing the price down to 0
const running = (now) => ({ startDate, endDate, discountSetting }) =>
  discountSetting?.discountPercentage === 0 && new Date(startDate) <= now && now < new Date(endDate);

const slug = ({ productSlug, offerMappings, catalogNs }) => {
  const mappings = [...(offerMappings || []), ...(catalogNs?.mappings || [])];
  const mapping = mappings.find(({ pageSlug }) => pageSlug);
  return mapping?.pageSlug || productSlug?.replace(/\/home$/, "");
};

const image = ({ keyImages = [] }) =>
  IMAGES.map((type) => keyImages.find((image) => image.type === type)).find(Boolean)?.url;

const format = (now) => (game) => {
  const { id, title, description, offerType, price } = game;
  const { endDate } = offers(game).find(running(now));
  const page = slug(game);

  return {
    store: "epic",
    id,
    title,
    description,
    url: page && `${STORE}/${locale}/p/${page}`,
    image: image(game),
    price: price.totalPrice.fmtPrice.originalPrice,
    until: new Date(endDate),
    tags: [],
    kind: KINDS[offerType] || kinds.game
  };
};

const free = (now) => (game) => {
  const { discountPrice, originalPrice } = game.price?.totalPrice || {};
  return discountPrice === 0 && originalPrice > 0 && offers(game).some(running(now));
};

export const list = async (now = new Date()) => {
  const params = new URLSearchParams({ locale, country, allowCountries: country });
  const { data } = await Http.json(`${API}?${params}`);
  const elements = data?.Catalog?.searchStore?.elements || [];

  return elements
    .filter(free(now))
    .map(format(now))
    .filter(({ url }) => url);
};
