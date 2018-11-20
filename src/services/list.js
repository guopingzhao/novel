const listDao = require("../dao/list.dao");
const categoryDao = require("../dao/category.dao");
const {list2map, listObj2list} = require("../util/tools");
const {transListCategoryAuthor} = require("../util/dataHelper");
const authorDao = require("../dao/authors.dao");

const categoryId = "category_id";
const authorId = "author_id";


module.exports = {
  async search({keyword = "", ...other} = {}) {

    const categorys = keyword ? listObj2list(await categoryDao.queryByName(keyword), categoryId) : [];
    const authors = keyword ? listObj2list(await authorDao.queryByName(keyword), authorId) : [];

    const categorysMap = list2map(await categoryDao.query(), categoryId);
    const authorsMap = list2map(await authorDao.query(), authorId);

    const [list, rows] = await listDao.search(keyword, authors, categorys, other);

    return [transListCategoryAuthor(list, categorysMap, authorsMap), rows];
  },
  async getListbyCategory(categoryId) {
    const categorysMap = list2map(await categoryDao.query(), categoryId);
    const authorsMap = list2map(await authorDao.query(), authorId);

    const [list, rows] = await listDao.queryByCategory(categoryId);

    return [transListCategoryAuthor(list, categorysMap, authorsMap), rows];
  },
  async getListbyAuthor(authorId) {
    const categorysMap = list2map(await categoryDao.query(), categoryId);
    const authorsMap = list2map(await authorDao.query(), authorId);

    const [list, rows] = await listDao.queryByAuthor(authorId);
    
    return [transListCategoryAuthor(list, categorysMap, authorsMap), rows];
  },
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
  }
}