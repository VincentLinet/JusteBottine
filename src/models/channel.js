import sql from "@/libs/database/sql";

export const register = async ({ id, guild, role = null, epic = true, steam = true }) =>
  sql`
    INSERT INTO channel (id, guild, role, epic, steam, active)
    VALUES (${id}, ${guild}, ${role}, ${epic}, ${steam}, TRUE)
    ON DUPLICATE KEY UPDATE
      role = VALUES(role),
      epic = VALUES(epic),
      steam = VALUES(steam),
      active = TRUE;`.execute();

export const deactivate = async (id, guild) =>
  sql`
    UPDATE channel
    SET active = FALSE
    WHERE id = ${id} AND guild = ${guild} AND active = TRUE;`.execute(({ affectedRows }) => affectedRows > 0);

export const active = async () =>
  sql` SELECT *
    FROM channel
    WHERE active = TRUE;`.execute();

export const guild = async (guild) =>
  sql` SELECT *
    FROM channel
    WHERE guild = ${guild} AND active = TRUE;`.execute();

export const leave = async (guild) =>
  sql`
    UPDATE channel
    SET active = FALSE
    WHERE guild = ${guild};`.execute();
