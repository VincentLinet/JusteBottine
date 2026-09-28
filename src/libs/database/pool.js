import * as MySQL from "mysql";
import * as Util from "util";
import config from "config";

export { default as sql } from "./sql";

const { databases } = config;

const params = { supportBigNumbers: true, bigNumberStrings: true };

const typeCast = (field, next) => {
  if (field.type === "JSON") {
    try {
      return JSON.parse(field.string());
    } catch {
      return next();
    }
  }
  return next();
};

const configure = (configuration) => ({ ...configuration, typeCast, ...params });

const create = (configuration) => MySQL.createPool(configure(configuration));

const pools = Object.entries(databases).reduce((acc, [key, value]) => {
  const pool = create(value);
  pool.query = Util.promisify(pool.query);
  pool.getConnection = Util.promisify(pool.getConnection);
  return { ...acc, [key]: pool };
}, {});

export const get = (database = "default") => {
  if (pools[database] === undefined) {
    const errorMessage = `Unknown database "${database}" specified`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return pools[database];
};

export const manual = (configuration) => {
  const pool = MySQL.createPool(configure(configuration));
  pool.query = Util.promisify(pool.query);
  pool.getConnection = Util.promisify(pool.getConnection);
  return pool;
};

export default { get, manual };
