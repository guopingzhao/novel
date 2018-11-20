const authorDao = require("../../src/dao/authors.dao");
const {datetime, awaitAll} = require("../../src/util/tools");

function warehous(list) {
    const authorParams = list.map((name) => [name, datetime()]);
    return authorDao.insert(authorParams)
        .then((result) => {
            console.log(`成功${result.affectedRows}条`)
        })
        .catch((error) => {
            console.error(error)
        })
}

module.exports = function (list) {

    const results = [];

    while(list.length) {
        results.push(
            warehous(
                list.splice(
                    Math.max(0, list.length - 100) ,
                    100
                )
            )
        )
    }

    return awaitAll(results)
}