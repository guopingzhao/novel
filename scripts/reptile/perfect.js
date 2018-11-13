const { readFileSync, writeFileSync } = require("fs");
const { exec } = require("child_process");

const qukankan = "www.7kankan.com";
const aoshi = "www.23zw.me";
const maopu = "www.maopuzw.com";
const quanben = "www.qb520.org";

const sortMap = {
  [qukankan]: 2,
  [aoshi]: 1,
  [maopu]: 0,
  [quanben]: 3,
}

let perfect = [];

function mergeCatalog(source, obj = []) {
  const sourceL = source.length;
  const offset = 50;
  let catalog = null
  obj.forEach(({ name, addr }, index) => {
    catalog = source.slice(
      Math.max(0, index - offset),
      Math.min(sourceL, index + offset)
    ).find((item) => item.name === name);
    if (catalog && !catalog.addr.includes(add)) {
      catalog.addr = `${catalog.addr},${add}`
    }
  })
}

function assign(source, obj = {}) {
  for (const k in obj) {
    if (k === "catalog" && !!source[k]) {
      mergeCatalog(source[k], obj[k]);
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

async function start(list, modules) {
  const detailScript = Object.values(modules).reduce((a, {dir, detail}) => {
    return {
      ...a,
      [getSourceKey(dir)]: detail
    }
  }, {})
  for (let item of list) {
    const detail = {};
    const sources = item.sources.split(",").sort((a, b) => sortMap[getSourceKey(a)] - sortMap[getSourceKey(b)]);
    for (const source of sources) {
      let falg;
      if (source.includes(qukankan)) {
        falg = await detailScript[qukankan](source);
      } else if (source.includes(aoshi)) {
        falg = await detailScript[aoshi](source);
      } else if (source.includes(maopu)) {
        falg = await detailScript[maopu](source);
      } else if (source.includes(quanben)) {
        falg = await detailScript[quanben](source);
      }
      if (falg) {
        assign(detail, falg);
      }
    }
    perfect.push({
      ...detail,
      ...item,
    });
  }
  writeFileSync("./perfect.json", JSON.stringify(perfect, null, 2));
}

process.once("message", ({ list, modules }) => {
  start(list, modules);
})