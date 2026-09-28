# CLAUDE.md

Discord bot posting free-to-keep games from the Epic Games Store and Steam. The architecture comes from `../hamingja`
(same author), the deals feature was ported from https://github.com/theo-mazars/DEH (Epic only, discord.js v13, Prisma).

## Running things

- Yarn 4 with **Plug'n'Play**, there is no `node_modules`. Always run scripts through yarn (`yarn node file.cjs`,
  `yarn build`); a bare `node` cannot resolve dependencies. `yarn start` works because nodemon inherits the PnP loader.
- `yarn build` bundles `src/app.js` into `dist/main.cjs` (CJS, even though the package is
  `"type": "module"`). The `@/…` imports are esbuild aliases defined in `esbuild.config.js`, not Node paths: a new
  top-level folder under `src/` needs a new alias there.
- `node-cron` is marked `external` in esbuild: its ESM build calls `fileURLToPath(import.meta.url)`, which is empty once
  bundled as CJS and crashes at startup. Any dependency relying on `import.meta` needs the same treatment.
- The `esbuild … lists build scripts, but all build scripts have been disabled` warning on install is harmless.
- `yarn lint` reports `no-console` warnings on purpose (logs are intentional); only errors matter.
- There are no tests. To check the store fetchers against the live APIs, bundle a throwaway script with the same aliases
  and run it with `yarn node` (no Discord token or database needed). Top-level `await` is not allowed in the CJS output,
  wrap the script in an async IIFE.
- The bot is plug and play, everything happens on `ClientReady` (`src/services/setup.js`): tables are created
  (`CREATE TABLE IF NOT EXISTS`, `src/models/schema.js`), slash commands are registered **globally** with a bulk
  overwrite (only changes are applied, safe on every start, can take a while to show in clients), and an invite link is
  logged. There is no guild-scoped registration and no refresh script on purpose: don't add a `GUILD` variable back.
- The only required env are `TOKEN` and the `DB_*` credentials; the MySQL database itself must already exist. The
  application id comes from the logged-in client, not from the env.
- `GuildDelete` deactivates the guild's channels, but ignores the event when `guild.available` is false (outage, the bot
  is still a member).

## Conventions (inherited from hamingja)

- Namespace imports everywhere (`import * as Deals from "@/services/deals"`), double quotes, `printWidth` 120, no trailing
  commas (`.prettierrc`).
- Every command/event is a default export (`{ data, execute }` / `{ name, kind, execute }`) re-exported from the
  folder's `index.js` barrel; `src/command/index.js` wires them on the client. Adding one = new file + barrel line.
- Layers: `commands/` (definitions only) → `services/` (logic) → `models/` (SQL) and `templates/` (embeds).
- `config` (node-config) reads `config/*.js` at runtime from the working directory, so the bot must be started from the
  repo root. The config files are ESM `export default` loaded through Node's `require(esm)` (Node ≥ 22.12).
- SQL goes through the tagged template in `src/libs/database/sql.js`: values are escaped placeholders, identifiers
  cannot be interpolated. `.execute(transformation)` calls `transformation(result)` on the raw mysql result (rows array
  for SELECT, `{ affectedRows }` for writes). MySQL `BOOLEAN` columns come back as `0`/`1`.
- `Message.build` (`src/services/message.js`) always stamps `timestamp: now` and returns `{ embeds, components }`; add
  `content`/`allowedMentions` by spreading the result.

## Language

- Everything users see is **French** (command descriptions, replies, embeds), except slash command and option names,
  which stay **English** (`/deals register channel …`). Logs and `Errors.*` output stay **English** too.
- Texts live in `messages/deals.js`. Command descriptions are hardcoded in `src/commands/*.js` (Discord needs them at
  registration time).
- Subcommand names are mapped to handlers in `src/services/deals/channel.js` (`subcommands`) and option names
  (`channel`, `role`, `epic`, `steam`) are read there too: renaming one means editing both files, then restart the bot.
- `Strings.inject` does a plain `String.replace` per key: only the **first** occurrence is replaced, and a key that is
  a prefix of another (`%store` / `%stores`) corrupts the longer one. Use distinct names (`%list`).
- hamingja's `services/pattern.js` (dynamic `import()` of message files) was deliberately not copied: dynamic relative
  imports don't survive bundling. Import message files statically.

## Store APIs (the non-obvious part)

### Epic (`src/services/deals/epic.js`)

- Only the public `freeGamesPromotions` feed is used. DEH's enrichment calls to `epicgames.com/graphql` (persisted
  query hashes) now return **403 Cloudflare**: don't reintroduce them. Consequence: no genres/features for Epic.
- A giveaway is a promotional offer with `discountSetting.discountPercentage === 0` (0 = the price you pay is 0% of the
  original, not "no discount") whose window contains now, plus `totalPrice.discountPrice === 0`. The feed also lists
  regular sales (e.g. 50%) and upcoming giveaways, both must be filtered out.
- `productSlug` is often `null` or suffixed with `/home`; the store URL slug comes from `offerMappings[].pageSlug`, then
  `catalogNs.mappings[].pageSlug`.
- The deal id stored for deduplication is the offer `id`, not the slug.

### Steam (`src/services/deals/steam.js`)

- DEH had no Steam support, this is new. Steam has no giveaway API: the list comes from scraping app ids out of the
  search results HTML (`search/results/?maxprice=free&specials=1&infinite=1&json=1`, field `results_html`). Only the
  first page (~50 results) is read.
- The `data-ds-appid="\d+"` regex intentionally skips packages, whose attribute holds a comma-separated list.
- `appdetails` quirk: a 100%-off item can report `price_overview.final` equal to `initial` (e.g. `199`/`199`) with
  `discount_percent: 100` and `final_formatted: "Free"`. Check `discount_percent === 100`, never `final === 0`.
- `appdetails` is heavily rate limited (~200 requests / 5 min): fetch sequentially with `Time.sleep()` between calls.
- It is requested with `l=french` (French genres/descriptions). Developers without a French description return English.
- The end of a Steam giveaway is only on the store page, as English text (`Free to keep when you get it before
  29 Sep @ 3:00pm.`) with **no timezone**. The page is fetched with `l=english` so the regex matches, then `localize()`
  rewrites it to French (`29 sept. à 15h00`); unknown formats are posted as-is. Age-gated games need the cookies in
  `cookies`. Steam deals therefore have `until: null` and a text `deadline`.
- Allowed item types are in `config.deals.steam.types` (`game`, `dlc`).

## Deduplication and scheduling

- `deal` rows are keyed by `(channel, store, product)`; a product is not reposted in a channel for `deals.cooldown` days
  (30). This replaces DEH's key on the promotion end date, which Steam cannot provide reliably.
- The job runs on `deals.schedule` (hourly, `Europe/Paris`) and once on `ClientReady`. A `running` flag prevents
  overlapping runs; `/deals check` calls `dispatch` for its guild only and bypasses that flag.
- A deal is saved only after the message is sent: a crash between the two means a repost, never a silent miss.
- Role mentions are part of the deal message (`content` + `allowedMentions`), unlike DEH which sent then deleted a ping.

## Deployment

- pm2 via `ecosystem.config.cjs` (`interpreter: "yarn"` so PnP applies). The deploy `host` is the SSH alias
  `justebottine` (resolved by the deployer's `~/.ssh/config`): never commit the server IP or SSH user. The repo is
  `VincentLinet/JusteBottine`.
- Crash reports are DMed to the `OWNER` env user (hamingja called it `CACTI`).
- The database is MySQL (`src/models/schema.js`, applied on startup; there are no migrations, so altering an existing
  table needs a manual `ALTER`). It exists for the
  per-guild channel registration and the deduplication; a single-server setup could do without it.
