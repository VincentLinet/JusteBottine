import * as Database from "./database";

class SQL {
  constructor(literals, values = []) {
    this.literals = Array.isArray(literals) ? [...literals] : [literals];
    this.values = values;
  }

  get sql() {
    return this.literals.join("?");
  }

  append(partial) {
    const lastIndex = this.literals.length - 1;
    const isPartialSQL = partial instanceof SQL;
    if (isPartialSQL) {
      const [head, ...tail] = partial.literals;
      this.literals[lastIndex] += ` ${head}`;
      this.literals = [...this.literals, ...tail];
      this.values = [...this.values, ...partial.values];
    } else {
      this.literals[lastIndex] += ` ${partial}`;
    }
    return this;
  }

  appendIf(cond, partial) {
    if (cond) this.append(partial);
    return this;
  }

  database(db) {
    this.db = db;
    return this;
  }

  pool(p) {
    this._pool = p;
    return this;
  }

  connection(co) {
    if (co) this._connection = co;
    return this;
  }

  execute(transformation, defaultValue) {
    return Database.execute(this.db, this._connection, this._pool, defaultValue, transformation)(this);
  }

  executeRaw() {
    return Database.raw(this.db, this._connection, this._pool)(this);
  }

  single(defaultValue) {
    return Database.single(this.db, this._connection, this._pool, defaultValue)(this);
  }

  bulk(values, size) {
    return Database.bulk(this.db, this._connection, this._pool, values, size)(this);
  }

  isEmpty() {
    return this.literals.reduce((acc, literal) => acc && literal.length === 0, true) && this.values.length === 0;
  }
}

Object.defineProperty(SQL.prototype, "sql", { enumerable: true });

export default (literals, ...values) => new SQL(literals, values);
