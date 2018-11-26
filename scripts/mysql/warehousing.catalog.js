const catalogDao = require("../../src/dao/catalog.dao");
const novelListDao = require("../../src/dao/list.dao");
const {datetime} = require("../../src/util/tools");

module.exports = async function warehousing(catalog, novelId) {
    if (catalog.length && novelId) {
        const catalogParams = catalog.map(({name, addr}, index) => {
            return [
                novelId, name, addr, index,
                datetime(), datetime()
            ]
        })
        const {affectedRows} = await catalogDao.insert(catalogParams).catch((err) => {
            console.error(err, {
                novelId,
                catalog
            })
        }) || {};
        return affectedRows > 0;
    }
    return false;
}

module.exports.getList = function() {
    return novelListDao.query()
}