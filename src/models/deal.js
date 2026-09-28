import sql from "@/libs/database/sql";

export const recent = async (channel, store, cooldown) =>
  sql` SELECT product
    FROM deal
    WHERE channel = ${channel}
      AND store = ${store}
      AND posted > NOW() - INTERVAL ${cooldown} DAY;`.execute((rows) => rows.map(({ product }) => product));

export const save = async ({ channel, store, product, until = null }) =>
  sql`
    INSERT INTO deal (channel, store, product, until, posted)
    VALUES (${channel}, ${store}, ${product}, ${until}, NOW())
    ON DUPLICATE KEY UPDATE
      until = VALUES(until),
      posted = VALUES(posted);`.execute();
