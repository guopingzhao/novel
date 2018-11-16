const { query } = require("../util/mysql");
const BaseDao = require("./base.dao");

// +-----------------+---------------+------+-----+---------+----------------+
// | Field           | Type          | Null | Key | Default | Extra          |
// +-----------------+---------------+------+-----+---------+----------------+
// | catalog_id      | int(11)       | NO   | PRI | NULL    | auto_increment |
// | novel_id        | int(11)       | NO   |     | NULL    |                |
// | catalog_name    | varchar(40)   | YES  |     | NULL    |                |
// | content_sources | varchar(1024) | YES  |     | NULL    |                |
// | catalog_index   | int(11)       | NO   |     | NULL    |                |
// | create_time     | datetime      | YES  |     | NULL    |                |
// | update_time     | datetime      | YES  |     | NULL    |                |
// +-----------------+---------------+------+-----+---------+----------------+

const tableName = "novel_catalog";

const insertSql = `INSERT INTO ${tableName}(novel_id, catalog_name, content_sources, catalog_index, create_time, update_time) VALUES ?`;


class CatalogDao extends BaseDao {
  constructor(tableName) {
    super(tableName);
    this.insertSql = insertSql;
  }
  async queryById(id) {
    return query(
      this.queryWhereSql({catalog_id: id})
    )
  }
  async queryByNovelId(id) {
    return query(
      this.queryWhereSql({novel_id: id})
    )
  }
  async queryByName(name) {
    return query(
      this.queryWhereSql({catalog_name: name})
    )
  }
}

module.exports = new CatalogDao(tableName);