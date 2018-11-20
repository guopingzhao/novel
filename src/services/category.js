const categoryDao = require("../dao/category.dao");

module.exports = {
  findCategory() {
    return categoryDao.query();
  }
}