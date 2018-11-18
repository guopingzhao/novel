const {awaitAll} = require("../../src/util/tools");
const qukankan = "m.7kankan.com";
const aoshi = "www.23zw.me";
const maopu = "m.maopuzw.com";
const quanben = "m.qb520.org";

const sortMap = {
  [qukankan]: 2,
  [aoshi]: 1,
  [maopu]: 0,
  [quanben]: 3,
}


function mergeCatalog(source, obj = []) {
  const sourceL = source.length;
  const offset = 50;
  let catalog = null
  obj.forEach(({ name, addr }, index) => {
    catalog = source.slice(
      Math.max(0, index - offset),
      Math.min(sourceL, index + offset)
    ).find((item) => item.name === name);
    if (catalog && !catalog.addr.includes(addr)) {
      catalog.addr = `${catalog.addr},${addr}`
    }
  })
}

function assign(source, obj = {}) {
  for (const k in obj) {
    if (k === "catalog" && !!source[k]) {
      mergeCatalog(source[k], obj[k]);
    } else if(k === "catalogAddr" && !!source[k]) {
      source[k] = `${source[k]},${obj[k]}`
    } else if (!!source[k]) {
      continue;
    } else if (obj[k]) {
      source[k] = obj[k];
    }
  }
}

function getSourceKey(source) {
  if (source.includes(qukankan)) {
    return qukankan;
  } else if (source.includes(aoshi)) {
    return aoshi;
  } else if (source.includes(maopu)) {
    return maopu;
  } else if (source.includes(quanben)) {
    return quanben;
  }
}

async function handleItem(item, detailScript) {
  const detail = {};
  const sources = item.sources.split(",").sort((a, b) => sortMap[getSourceKey(a)] - sortMap[getSourceKey(b)]);
  for (const source of sources) {
    let falg;
    if (source.includes(qukankan)) {
      falg = await detailScript[qukankan](source).catch(() => {});
    } else if (source.includes(aoshi)) {
      falg = await detailScript[aoshi](source).catch(() => {});
    } else if (source.includes(maopu)) {
      falg = await detailScript[maopu](source).catch(() => {});
    } else if (source.includes(quanben)) {
      falg = await detailScript[quanben](source).catch(() => {});
    }
    if (falg) {
      assign(detail, falg);
    }
  }
  return {
    ...detail,
    ...item,
  };
}

let detailScript = null;

async function start(list, modules) {
  if (!detailScript) {
    detailScript = Object.values(modules).reduce((a, {dir, detail}) => {
      return {
        ...a,
        [getSourceKey(dir)]: require(detail)
      }
    }, {})
  }
  let result  = [];
  for (let item of list) {
    result.push(handleItem(item, detailScript));
  }
  process.send(await awaitAll(result, null));
}
console.log(process.pid, "准备就绪");
process.on("message", ({ list, modules }) => {
  start(list, modules);
})

