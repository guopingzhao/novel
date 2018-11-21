const { query, joinOrLike, join } = require("../util/mysql");

module.exports = class BaseDao {
  constructor(tableName) {
    this.tableName = tableName;
    this.srotStr = ["ASC", "DESC"]
    this.initSql();
  }
  initSql() {
    this.querySql = `SELECT * FROM ${this.tableName}`;

    this.queryWhereSql = (info, {isJoin=true, isCount=false} = {}) => {
      const size = info.size || 10;
      const page = ~~info.page;
      
      delete info.page;
      delete info.size;
      const params = joinOrLike(isJoin, {fields: info});
      const sql = `SELECT ${isCount ? ` sql_calc_found_rows ` : ""} * FROM ${this.tableName}${params ? ` WHERE ${params}` : ""}${page ? ` LIMIT ${(page - 1) * size},${size}` : ""}; ${isCount ? "select found_rows()" : ""}`
      return sql;
    };

    this.deleteWhereSql = (info) => `DELETE FROM ${this.tableName}${info ? ` WHERE ${join(info)}` : ""}`;

    this.updateWhereSql = (info, condition) => `UPDATE ${this.tableName} SET ${join(info)} WHERE ${join(condition)}`;
  }

  async insert(params) {
    return query(this.insertSql, [params]);
  }
  async query(params={}) {
    return query(this.queryWhereSql(params));
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