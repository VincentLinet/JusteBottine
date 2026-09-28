import sql from "@/libs/database/sql";

const channel = () =>
  sql`
    CREATE TABLE IF NOT EXISTS channel (
      id         VARCHAR(20) NOT NULL,
      guild      VARCHAR(20) NOT NULL,
      role       VARCHAR(20) NULL,
      epic       BOOLEAN     NOT NULL DEFAULT TRUE,
      steam      BOOLEAN     NOT NULL DEFAULT TRUE,
      active     BOOLEAN     NOT NULL DEFAULT TRUE,
      registered DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX channel_guild_index (guild)
    );`.execute();

const deal = () =>
  sql`
    CREATE TABLE IF NOT EXISTS deal (
      channel VARCHAR(20)            NOT NULL,
      store   ENUM ('epic', 'steam') NOT NULL,
      product VARCHAR(255)           NOT NULL,
      until   DATETIME               NULL,
      posted  DATETIME               NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (channel, store, product),
      CONSTRAINT deal_channel_fk FOREIGN KEY (channel) REFERENCES channel (id) ON DELETE CASCADE
    );`.execute();

export const create = async () => {
  await channel();
  await deal();
};
