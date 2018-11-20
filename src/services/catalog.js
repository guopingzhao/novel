const catalogDao = require("../dao/catalog.dao");

module.exports = {
  findCatalog(novelId) {
    return catalogDao.queryByNovelId(novelId)
  }
}