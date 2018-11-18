const authorDao = require("../../src/dao/authors.dao");
const {datetime} = require("../../src/util/tools");

module.exports = function (list) {
    const authorParams = list.map((name) => [name, datetime()]);

    return authorDao.insert(authorParams)
        .then((result) => {
            console.log(`成功${result.affectedRows}条`)
        })
        .catch((error) => {
            console.log(error)
        })
}