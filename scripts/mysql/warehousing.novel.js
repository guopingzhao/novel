const novelListDao = require("../../src/dao/list.dao");
const catalogDao = require("../../src/dao/catalog.dao");
const authorDao = require("../../src/dao/authors.dao");
const categoryDao = require("../../src/dao/category.dao");
const {datetime} = require("../../src/util/tools");

module.exports = async function warehousing({catalog=[], ...other}) {
    const {name, catalogAddr, cover, author, sources, brief, category} = other;
    const categorys = (await categoryDao.queryByNames(
        category.split(",").map((name) => name.trim())
        )).map(({category_id}) => category_id).join();

    const {author_id} = (await authorDao.queryByName(author.trim()))[0] || {author_id: 0};
    const {insertId} = await novelListDao.insert([[
        name, author_id, categorys, 
        cover, sources, brief, catalogAddr, 
        datetime(), datetime()
    ]]);
    if (catalog.length) {
        const catalogParams = catalog.map(({name, addr}, index) => {
            return [
                insertId, name, addr, index,
                datetime(), datetime()
            ]
        })
        return catalogDao.insert(catalogParams);
    }
    return true;
}