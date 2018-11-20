const { query, findOne } = require("../util/mysql");
const BaseDao = require("./base.dao");

// +-------------+-------------+------+-----+---------+----------------+
// | Field       | Type        | Null | Key | Default | Extra          |
// +-------------+-------------+------+-----+---------+----------------+
// | author_id   | int(11)     | NO   | PRI | NULL    | auto_increment |
// | author_name | varchar(40) | YES  |     | NULL    |                |
// | create_time | datetime    | YES  |     | NULL    |                |
// +-------------+-------------+------+-----+---------+----------------+

const tableName = "novel_author";

const insertSql = `INSERT INTO ${tableName}(author_name, create_time) VALUES ?`;


class CategoryDao extends BaseDao {
  constructor(tableName) {
    super(tableName);
    this.insertSql = insertSql;
  }
  async queryById(id) {
    return findOne(query(
      this.queryWhereSql({author_id: id})
    ))
  }
  async queryByIds(ids) {
    return query(
      this.queryWhereSql({author_id: ids})
    )
  }
  async queryByName(name) {
    return query(
      this.queryWhereSql({author_name: name})
    )
  }
  async queryByNames(names) {
    return query(
      this.queryWhereSql({author_name: names}, {isJoin: false})
    )
  }
}

module.exports = new CategoryDao(tableName);