const {search} = require("../dao/list.dao");
const categoryDao = require("../dao/category.dao");
const authorDao = require("../dao/authors.dao");

module.exports = {
  async search(val) {
    const categoryIds = (await categoryDao.queryByNames(val)).map(({category_id}) => category_id);
    const {author_id} = await authorDao.queryByName(val);
  }
}