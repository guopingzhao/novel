const { query, join } = require("../util/mysql");

module.exports = class BaseDao {
  constructor(tableName) {
    this.tableName = tableName;
    this.srotStr = ["ASC", "DESC"]
    this.initSql();
  }
  initSql() {
    this.querySql = `SELECT * FROM ${this.tableName}`;

    this.queryWhereSql = (info) => `${this.querySql} WHERE ${join(info)}`;

    this.deleteWhereSql = (info) => `DELETE FROM ${this.tableName}${info ? ` WHERE ${join(info)}` : ""}`;

    this.updateWhereSql = (info, condition) => `UPDATE ${this.tableName} SET ${join(info)} WHERE ${join(condition)}`;
  }

  async insert(params) {
    return query(this.insertSql, [params]);
  }
  async query(params) {
    return query(params ? this.queryWhereSql(params) : this.querySql);
  }
  async update(info, condition) {
    return query(
      this.updateWhereSql(info, condition)
    )
  }
  async dellete(info) {
    return query(
      this.deleteWhereSql(info)
    )
  }

}