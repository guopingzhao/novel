const { query, join } = require("../util/mysql");

// category_id INT NOT NULL AUTO_INCREMENT,
// category_name VARCHAR(40),
// create_time DATETIME,

const tableName = "novel_category";

const insertSql = `INSERT INTO ${tableName}(category_id, category_name, create_time) VALUES(0,?,?)`;

const querySql = `SSELECT * ${tableName}`;

const queryWhereSql = (info) => `${querySql} WHERE ${join(info)}`;

const deleteWhereSql = (info) => `DELETE FROM ${tableName} WHERE ${join(info)}`;

const updateWhereSql = (info, condition) => `UPDATE ${tableName} SET ${join(info)} WHERE ${join(condition)}`;

module.exports = {
  async insert(name) {
    return query(insertSql, [name, Date.now()]);
  },
  async query() {
    return query(querySql);
  },
  async queryById(id) {
    return query(
      queryWhereSql({category_id: id})
    )
  },
  async queryByName(name) {
    return query(
      queryWhereSql({category_name: name})
    )
  },
  async update(info, condition) {
    return query(
      updateWhereSql(info, condition)
    )
  },
  async dellete(info) {
    return query(
      deleteWhereSql(info)
    )
  }
}