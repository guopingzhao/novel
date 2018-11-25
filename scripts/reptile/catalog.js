const {awaitAll} = require("../../src/util/tools");
const {catalog} = require("./detail");

async function start(list) {
    let result = [];
    for (let item of list) {
        result.push(catalog(item.novel_catalog));
    }
    const data = await awaitAll(result, null, (err, i) => {
        console.error(list[i], '执行详情脚本失败')
    })
    list.forEach((item, index) => {
        item.catalog = data[index];
    })
    process.send(list);
}

console.log(process.pid, "准备就绪");
process.on("message", ({list}) => {
    start(list);
})