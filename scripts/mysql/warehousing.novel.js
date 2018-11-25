const novelListDao = require("../../src/dao/list.dao");
const authorDao = require("../../src/dao/authors.dao");
const categoryDao = require("../../src/dao/category.dao");
const {datetime, list2map} = require("../../src/util/tools");

module.exports = async function warehousing(item) {
    const {name, catalogAddr, cover, authorId, sources, brief, categorys} = item;
    
    const {insertId} = await novelListDao.insert([[
        name, authorId, categorys, 
        cover, sources, brief, catalogAddr, 
        datetime(), datetime()
    ]]).catch(() => {}) || {};

    return !!insertId;
}

module.exports.getCategoryMap = async () => list2map(await categoryDao.query(), "category_name", "category_id");
module.exports.getAuthorMap = async () => list2map(await authorDao.query(), "author_name", "author_id");