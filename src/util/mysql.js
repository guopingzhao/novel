const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "www.zgpv.top",
  port: 3306,
  user: "root",
  password: "root123",
  database: "novel",
  typeCast: true,
  multipleStatements: true
})

module.exports = connection;
module.exports.query = function (sql, params, cb = () => {}) {

  if (!sql) {
    throw new Error("Invalid SQL statement");
  }
  return new Promise((resolve, reject) => {
    if (typeof params === "function") {
      cb = params;
      params = undefined;
    }
  
    const queryParams = params ? [sql, params] : [sql];
  
    connection.connect();
  
    connection.query(...queryParams, (err, result) => {
      if (err) {
        cb(err);
        reject(err);
      } else {
        cb(result);
        resolve(result);
      }
    });
  
    connection.end();
  })
}
module.exports.join = (info) => {
  const params = Object.entries(info);
  const lastIndex = params.length - 1;
  return params.reduce((sql, [k, v], index) => {
    if (index === lastIndex) {
      return `${sql}${k}=${v}`
    }
    return `${sql}${k}=${v}, `
  }, "")
}