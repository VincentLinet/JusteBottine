# JusteBottine

Le luxe des bottines de Juline dans un bot discord.

Discord bot that announces free-to-keep games from the Epic Games Store and Steam.

## Setup

Create a `.env` with `TOKEN` (bot token), `OWNER` (user id receiving crash reports) and the MySQL credentials `DB_HOST`,
`DB_USER`, `DB_PASS`, `DB_BASE`, `DB_PORT` (the database must exist). Then:

```sh
yarn install
yarn dev                          # or: yarn build && yarn start
```

On startup the bot creates its tables, registers its slash commands globally and logs an invite link to add it to
any server. Nothing else to configure.

Deployment uses pm2: `pm2 deploy ecosystem.config.cjs production`. The server is reached through the `justebottine`
SSH alias, to declare in your `~/.ssh/config`:

```
Host justebottine
  HostName <server ip>
  User <ssh user>
```

## Commands

All `/deals` subcommands require the *Manage Server* permission.

| Command | Description |
| --- | --- |
| `/deals register channel [role] [epic] [steam]` | Post deals in a channel, optionally mentioning a role |
| `/deals unregister channel` | Stop posting deals in a channel |
| `/deals list` | List the channels receiving deals on this server |
| `/deals check` | Look for new deals right now |

## How it works

`src/services/deals` polls both stores on the `deals.schedule` cron (hourly by default, see `config/default.js`):

- **Epic**: the public `freeGamesPromotions` feed, keeping running promotions that bring the price to 0.
- **Steam**: the store search (`maxprice=free&specials=1`), confirmed with `appdetails` (100% discount). The end date
  is read from the store page when available.

Each posted product is stored in the `deal` table and won't be announced again in the same channel for
`deals.cooldown` days.

## Layout

```
config/            node-config files (per NODE_ENV)
messages/          user-facing texts
src/command/       Discord client bootstrap
src/commands/      slash command definitions
src/events/        Discord event handlers
src/libs/          database, http and time helpers
src/models/        SQL queries
src/services/      business logic (deals fetching and dispatching)
src/templates/     embed builders
```
