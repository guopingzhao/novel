const { unlinkSync, existsSync ,appendFileSync } = require("fs");
const { resolve } = require("path");

const filePath = resolve(__dirname, "perfect.json");
if (existsSync(filePath)) unlinkSync(filePath)

const qukankan = "m.7kankan.com";
const aoshi = "www.23zw.me";
const maopu = "m.maopuzw.com";
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

async function handleItem(item, detailScript) {
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
    return true;
}

async function start(list, modules) {
  const detailScript = Object.values(modules).reduce((a, {dir, detail}) => {
    return {
      ...a,
      [getSourceKey(dir)]: detail
    }
  }, {})
  const promise = [];

  for (let i = 0, l = list.length; i < l; i++) {
    const hand = handleItem(list[i], detailScript);
    if (promise.length < 5) {
      promise.push(hand);
    } else {
      await Promise.all(promise.splice(0, promise.length).concat(hand));
    }
    if (perfect.length > 2000) {
      console.log(`perfect 写入${perfect.length}条`);
      appendFileSync(filePath, perfect.splice(0, perfect.length).join("\n") + "\n");
    }
  }
  appendFileSync(filePath, perfect.join("\n"));
}

process.once("message", ({ list, modules }) => {
  start(list, modules);
})