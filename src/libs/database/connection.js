import * as Util from "util";
import * as Pool from "./pool.js";

export const get = async (database) => {
  const pool = Pool.get(database);
  const connection = await pool.getConnection();
  connection.query = Util.promisify(connection.query);
  connection.beginTransaction = Util.promisify(connection.beginTransaction);
  connection.commit = Util.promisify(connection.commit);
  connection.rollback = Util.promisify(connection.rollback);

  return connection;
};

export const init = async (database) => {
  const connection = await get(database);
  await connection.beginTransaction();

  return connection;
};

export default { get, init };
