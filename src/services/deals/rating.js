import config from "config";

import * as Http from "@/libs/http";

const { deals } = config;
const { country, rating } = deals;
const { minimum, unrated } = rating;

const REVIEWS = "https://store.steampowered.com/appreviews";
const SEARCH = "https://store.steampowered.com/api/storesearch/";

export const score = ({ total_positive: positive, total_reviews: total }) => {
  if (!total) return null;
  const average = positive / total;
  return Math.round((average - (average - 0.5) * 2 ** -Math.log10(total + 1)) * 100);
};

export const steam = async (id) => {
  try {
    const params = new URLSearchParams({ json: 1, language: "all", purchase_type: "all", num_per_page: 0 });
    const { query_summary: summary } = await Http.json(`${REVIEWS}/${id}?${params}`);
    return summary ? score(summary) : null;
  } catch {
    return null;
  }
};

const normalize = (name) =>
  name
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const lookup = async (title) => {
  try {
    const params = new URLSearchParams({ term: title, cc: country, l: "english" });
    const { items = [] } = await Http.json(`${SEARCH}?${params}`);
    const match = items.find(({ type, name }) => type === "app" && normalize(name) === normalize(title));
    return match ? steam(match.id) : null;
  } catch {
    return null;
  }
};

export const passes = ({ rating }) => (rating === null ? unrated : rating >= minimum);
