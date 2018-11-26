const mysql = require("mysql");
const {EventEmitter} = require("events");
const {synclock} = require("./tools");

let defaultConfig = {
  host: "zgpv.top",
  port: 3306,
  user: "root",
  password: "root123",
  database: "novel",
  typeCast: true,
  multipleStatements: true,
  charset: "UTF8"
}

class MysqlPool extends EventEmitter {
  constructor(options={}) {
    super();
    const {timeout = 10000, max = 100, mysqlConfig = defaultConfig} = options;
    this.connStatusMap = {
      busy: 1,
      normal: 0,
      wrong: -1
    }
    this.pool = this.initPool(Math.max(1, max));
    this.timeout = timeout;
    this.mysqlConfig = mysqlConfig;
    this.query = this.query.bind(this);
    this.setMysqlConfig = this.setMysqlConfig.bind(this);
    this.setMaxListeners(max * 10);
    this.getFreeConn = synclock(this.getFreeConn, this);
  }
  initPool(num) {
    const keys = Object.keys(new Array(num).fill(null));
    return keys.reduce((pool, key) => {
      pool[key] = {
        conn: null,
        status: this.connStatusMap.normal
      }
      return pool;
    }, {})
  }
  createConn(key) {
    return new Promise((resolve, reject) => {
      const {normal, wrong} = this.connStatusMap;
      const conn = mysql.createConnection(this.mysqlConfig);
      const result = {
        conn,
        status: normal
      }

      conn.once("error", () => {
        console.error(`${key} 发生错误`)
        result.status = wrong;
      })

      conn.once("end", () => {
        console.log(`${key} 释放连接`)
        result.conn = null;
        result.status = normal;
      })
      conn.connect((err) => {
        if(err) {
          reject(err);
          result.conn = null;
          result.status = wrong;
        } else {
          resolve(result);
        }
      });
    })
  }
  getFreeConn() {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject("获取连接超时");
      }, this.timeout);
      const poolEntries = Object.entries(this.pool);
      let vacancyOrError = null;
      const {busy, wrong} = this.connStatusMap;
      for (let [key, val] of poolEntries) {
        if (val.conn && !val.status) {
          val.status = busy;
          clearTimeout(timer);
          resolve([key, val]);
          return;
        }
        if (!vacancyOrError && !val.conn) {
          vacancyOrError = key;
        }
      }

      if (vacancyOrError !== null) {
          const conn = await this.createConn(vacancyOrError).catch((err) => reject(err));
          if (!conn) return;
          this.pool[vacancyOrError] = conn;
          clearTimeout(timer);
          conn.status = busy;
          resolve([vacancyOrError, conn])
      } else {
        this.once("queryEnd", (data) => {
          clearTimeout(timer);
          data[1].status = busy;
          resolve(data)
        })
      }
    })
  }
  query (sql, params, cb = () => {}) {
    if (!sql) {
      throw new Error("Invalid SQL statement");
    }
    return new Promise(async (resolve, reject) => {
      if (typeof params === "function") {
        cb = params;
        params = undefined;
      }
      const {wrong, normal} = this.connStatusMap;

      const freeConn = await this.getFreeConn().catch((error) => {
        const message = "Failed to get SQL connection";
        const result = {
          message,
          error
        }
        reject(result);
        cb(result);
      });

      if (!freeConn) return;

      const [key, connection] = freeConn;

      const queryParams = params ? [sql, params] : [sql];

      const query = connection.conn.query(...queryParams, (err, result) => {
        if (err) {
          connection.status = wrong;
          cb(err);
          reject(err);
        } else {
          if (
            Array.isArray(result) && 
            result[1] && 
            Array.isArray(result[1]) && 
            result[1][0] && 
            "found_rows()" in result[1][0]
          ) {
            result[1] = result[1][0]["found_rows()"]
          }
          cb(null, result);
          resolve(result);
        }
      });

      query.once("error", (err) => {
        console.error("query error", key, err.sqlMessage, err.sqlState, err.sql);
        connection.status = wrong;
        cb(err);
        reject(err);
      })
     
      query.once("end", () => {
          if (this.listenerCount("queryEnd") && connection.status !== wrong) {
            this.emit("queryEnd", freeConn);
          } else {
            connection.status = normal;
          }
      })
    })
  }
  setMysqlConfig(config) {
    this.mysqlConfig = {
      ...this.mysqlConfig, 
      ...config
    }
  }
}

const mysqlPool = new MysqlPool();

module.exports.query = mysqlPool.query;
module.exports.noErrorQuery = (...args) => mysqlPool.query(...args).catch(() => {});
module.exports.setMysqlConfig = mysqlPool.setMysqlConfig;
module.exports.join = join;
module.exports.like = like;
module.exports.findOne = findOne;
module.exports.strify = strify;

module.exports.joinOrLike = joinOrLike;

function strify (options) {
  const {
    fields,
    connector="=",
    format=(val) => val,
    arrValConnector = "OR"
  } = options;
  const res = [];
  Object.entries(fields).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      const arr = v.map((val) => (
        strify({
          ...options,
          fields: {
            [k]: val
          }
        })
      ));
      if (arr.length) {
        res.push(arr.join(` ${arrValConnector} `))
      }
    } else if(v) {
      res.push(`${k} ${connector} "${format(v)}"`)
    }
  })
  return res;
}

function join(info, connector='OR') {
  return strify({fields: info, arrValConnector: connector}).join(` OR `)
}

function findOne(res) {
  const cb = (result) => {
    if (Array.isArray(reresults)) {
      return result[0] || null;
    }
    return null;
  }
  if (res instanceof Promise) {
    return res.then(cb)
  } else {
    return cb(res)
  }
}

function like(fields, connector="OR", format) {
  if(typeof connector === "function") {
    format = connector;
    connector = "OR";
  }
  if (!format) {
    format = (val) => `%${val}%`
  }

  return strify({fields, connector: "LIKE", format}).join(` ${connector} `)
}

function joinOrLike(isJoin, options={}) {
  const {fields, connector, format} = options;
  if(isJoin) {
    return join(fields, connector);
  }
  return like(fields, connector, format);
}