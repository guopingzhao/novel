const {awaitAll} = require("../../src/util/tools");
const {detail} = require("./detail");

async function start(list) {
  let result  = [];
  for (let item of list) {
    result.push(detail(item));
  }
  process.send(await awaitAll(result, null, (err, i) => {
    console.error(list[i], '执行详情脚本失败')
  }));
}
console.log(process.pid, "准备就绪");
process.on("message", ({ list }) => {
  start(list);
})

