import * as Pool from "./pool";

export { default as connection } from "./connection";

const cut = (data, size = 500) => {
  const iterations = Math.ceil(data.length / size);
  return Array.from({ length: iterations }).map((_, index) => data.slice(index * size, (index + 1) * size));
};

const query = async (database, connection, stream, text, values) => {
  if (connection !== undefined) return connection.query(text, values);
  const creation = stream || Pool.get(database);
  const result = await creation.query(text, values);
  return result;
};

export const execute = (database, connection, stream, defaultValue, transformation) => {
  return async (text, values) => {
    try {
      const result = await query(database, connection, stream, text, values);
      return transformation !== undefined ? transformation(result, defaultValue) : result;
    } catch (err) {
      console.error(err);
      if (defaultValue) return defaultValue;
      throw err;
    }
  };
};

const toSingle = (result, defaultValue) => {
  const isFunction = typeof defaultValue === "function";
  return result.length === 0
    ? isFunction
      ? defaultValue()
      : defaultValue
    : isFunction
      ? defaultValue(result[0])
      : result[0];
};

export const raw = (database, connection, stream) => {
  return execute(database, connection, stream);
};

export const single = (database, connection, stream, defaultValue) => {
  return execute(database, connection, stream, defaultValue, toSingle);
};

export const bulk = (database, connection, stream, values, size = 500) => {
  const exec = raw(database, connection, stream);

  return async (query) => {
    if (!values || values.length === 0) return;

    const chunks = cut(values, size);

    for (const chunk of chunks) {
      const [{ length: columns }] = chunk;

      const placeholders = chunk.map(() => `(${Array(columns).fill("?").join(",")})`).join(",");

      const sql = query.sql.replace("$VALUES", `VALUES ${placeholders}`);
      const flattened = chunk.flat();

      await exec(sql, flattened);
    }
  };
};
