const mysql = require("mysql");
const {EventEmitter} = require("events");

let defaultConfig = {
  host: "localhost",
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
  createConn(config={}) {
    const {normal, wrong} = this.connStatusMap;
    const conn = mysql.createConnection({
      ...this.mysqlConfig,
      ...config
    })

    const result = {
      conn,
      status: normal
    }

    conn.connect();
    conn.once("error", () => {
      console.log(`${conn.threadId}发生错误`)
      result.conn = null;
      result.status = wrong;
    })
    conn.once("end", () => {
      console.log(`${conn.threadId}释放连接`)
      result.conn = null;
      result.status = normal;
    })
    return result;
  }
  getFreeConn() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject("获取连接超时");
      }, this.timeout);
      const poolEntries = Object.entries(this.pool);
      let vacancyOrError = null;

      for (let [key, val] of poolEntries) {
        if (val.conn && !val.status) {
          resolve([key, val]);
          break;
        }
        if (!val.conn || val.status === this.connStatusMap.wrong) {
          vacancyOrError = key;
        }
      }

      if (vacancyOrError !== null) {
        const conn = this.createConn();
        this.pool[vacancyOrError] = conn;
        resolve([vacancyOrError, conn])
      } else {
        this.once("queryEnd", (data) => {
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
      const {wrong, normal, busy} = this.connStatusMap;

      const [key, connection] = await this.getFreeConn();
      connection.status = busy;

      const queryParams = params ? [sql, params] : [sql];

      const query = connection.conn.query(...queryParams, (err, result) => {
        if (err) {
          cb(err);
          reject(err);
        } else {
          cb(result);
          resolve(result);
        }
      });


      query.once("error", () => {
        console.log("query error");
        connection.status = wrong;
      })
     
      query.once("end", () => {
        connection.status = normal;
        this.emit("queryEnd", [key, connection]);
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
module.exports.setMysqlConfig = mysqlPool.setMysqlConfig;
module.exports.join = (info) => {
  const params = Object.entries(info);
  const lastIndex = params.length - 1;
  return params.reduce((sql, [k, v], index) => {
    if (index === lastIndex) {
      return `${sql}${k}="${v}"`
    }
    return `${sql}${k}="${v}", `
  }, "")
}
