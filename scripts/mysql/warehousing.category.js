const categoryDao = require("../../src/dao/category.dao");
const {datetime} = require("../../src/util/tools");

module.exports = function (list) {
    const categoryParams = list.map((name) => [name, datetime()]);

    return categoryDao.insert(categoryParams)
        .then((result) => {
            console.log(`成功${result.affectedRows}条`)
        })
        .catch((error) => {
            console.error(error)
        })
}