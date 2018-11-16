const { query } = require("../util/mysql");
const BaseDao = require("./base.dao");

// +---------------+-------------+------+-----+---------+----------------+
// | Field         | Type        | Null | Key | Default | Extra          |
// +---------------+-------------+------+-----+---------+----------------+
// | category_id   | int(11)     | NO   | PRI | NULL    | auto_increment |
// | category_name | varchar(40) | YES  |     | NULL    |                |
// | create_time   | datetime    | YES  |     | NULL    |                |
// +---------------+-------------+------+-----+---------+----------------+

const tableName = "novel_category";

const insertSql = `INSERT INTO ${tableName}(category_name, create_time) VALUES ?`;


class CategoryDao extends BaseDao {
  constructor(tableName) {
    super(tableName);
    this.insertSql = insertSql;
  }
  async queryById(id) {
    return query(
      this.queryWhereSql({category_id: id})
    )
  }
  async queryByName(name) {
    return query(
      this.queryWhereSql({category_name: name})
    )
  }
}

module.exports = new CategoryDao(tableName);