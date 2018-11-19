const { query, like } = require("../util/mysql");
const BaseDao = require("./base.dao");

// +---------------+---------------+------+-----+---------+----------------+
// | Field         | Type          | Null | Key | Default | Extra          |
// +---------------+---------------+------+-----+---------+----------------+
// | novel_id      | int(11)       | NO   | PRI | NULL    | auto_increment |
// | novel_name    | varchar(40)   | YES  |     | NULL    |                |
// | novel_author  | varchar(40)   | NO   |     | NULL    |                |
// | novel_cover   | varchar(255)  | YES  |     | NULL    |                |
// | novel_sources | varchar(2048) | YES  |     | NULL    |                |
// | novel_brief   | varchar(2048) | YES  |     | NULL    |                |
// | create_time   | datetime      | YES  |     | NULL    |                |
// | update_time   | datetime      | YES  |     | NULL    |                |
// +---------------+---------------+------+-----+---------+----------------+

const tableName = "novel_list";

const insertSql = `INSERT INTO ${tableName}(novel_name, novel_author, novel_category, novel_cover, novel_sources, novel_brief, novel_catalog, create_time, update_time) VALUES ?`;
const searchSql = (val) => `SELECT * FROM ${tableName} WHERE ${like(val)}`

class NovelListDao extends BaseDao {
  constructor(tableName) {
    super(tableName);
    this.insertSql = insertSql;
    this.searchSql = searchSql;
  }
  async search(val, autorid, categoryIds) {
    return query(
      this.searchSql({
        novel_name: val,
        novel_author: autorid,
        novel_category: categoryIds,
        novel_brief: val
      })
    )
  }
  async queryById(id) {
    return query(
      this.queryWhereSql({novel_id: id})
    )
  }
  async queryByName(name) {
    return query(
      this.queryWhereSql({novel_name: name})
    )
  }
  async queryByCategory(queryByCategory) {
    return query(
      this.queryWhereSql({novel_category: queryByCategory})
    )
  }
  async queryByAuthor(name) {
    return query(
      this.queryWhereSql({novel_author: name})
    )
  }
}

module.exports = new NovelListDao(tableName);