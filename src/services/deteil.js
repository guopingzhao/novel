const listDao = require("../dao/list.dao");
const categoryDao = require("../dao/category.dao");
const {list2map} = require("../util/tools");
const {transListCategoryAuthor} = require("../util/dataHelper");
const authorDao = require("../dao/authors.dao");
const contentScript = require("../../scripts/reptile/content");

const categoryId = "category_id";
const authorId = "author_id";


module.exports = {
  async getDetail(novelId) {
    const detail = await listDao.queryById(novelId);
    if (detail) {
      const categorys = await categoryDao.query();
      const authors = await authorDao.queryByIds([detail["novel_author"]]);

      const categorysMap = list2map(categorys, categoryId);
      const authorsMap = list2map(authors, authorId);

      return transListCategoryAuthor([detail], categorysMap, authorsMap)[0];

    }
    return detail;
  },
  async getContent(addr) {
    return contentScript(addr);
  }
}