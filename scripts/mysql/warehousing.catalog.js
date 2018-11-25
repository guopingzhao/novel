const catalogDao = require("../../src/dao/catalog.dao");
const novelListDao = require("../../src/dao/list.dao");
const {datetime} = require("../../src/util/tools");

module.exports = async function warehousing(catalog, novelId) {
    if (catalog.length && novelId) {
        const catalogParams = catalog.map(({name, addr}, index) => {
            return [
                insertId, name, addr, index,
                datetime(), datetime()
            ]
        })
        catalogDao.insert(catalogParams).catch(() => {
            console.error({
                novelId,
                catalog
            })
        });
    }
}

module.exports.getList = function() {
    return novelListDao.query()
}