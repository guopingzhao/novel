const {readFileSync} = require("fs");
const {resolve} = require("path");
const moment = require("moment");

const {setMysqlConfig} = require("../../src/util/mysql");
const novelListDao = require("../../src/dao/list.dao");
const catalogDao = require("../../src/dao/catalog.dao");
const categoryDao = require("../../src/dao/category.dao");
const authorDao = require("../../src/dao/authors.dao");

const perfectPath = resolve(__dirname, "../reptile/perfect.txt");
const list = readFileSync(perfectPath).toString().trim().split(/\n/);

setMysqlConfig({password: "123456"});

// novel_name, novel_author, novel_cover, novel_sources, novel_brief, novel_catalog, create_time, update_time

async function initNovelAndCatalog ({catalog, ...other}) {
  const {name, catalogAddr, cover, author, sources, brief, category} = other;


  const categorys = (await Promise.all(category.split(",").map(name => categoryDao.queryByName(name.trim())))).map(({category_id}) => category_id).join();
  const {author_id} = (await authorDao.queryByName(author.trim()))[0];
  const {insertId} = await novelListDao.insert([[name, author_id, categorys, cover, sources, brief, catalogAddr, moment().format("YYYY-MM-DD HH:mm:ss"), moment().format("YYYY-MM-DD HH:mm:ss")]]);
  const catalogParams = catalog.map(({name, addr}, index) => [insertId, name, addr, index, moment().format("YYYY-MM-DD HH:mm:ss"), moment().format("YYYY-MM-DD HH:mm:ss")])
  catalogDao.insert(catalogParams)
}

function initCateAndAu() {
  const cate = {};
  const au = {};
  for (const obj of list) {
    const {author, category} = JSON.parse(obj)
    au[author] = true;
    if(category.includes(",")) {
      category.split(",").forEach((item) => {
        if(item.trim()) {
          cate[item.trim()] = true;
        }
      })
    } else {
      cate[category.trim()] = true;
    }
  }
  console.log(categoryDao.insert(Object.keys(cate).map((name) => [name, moment().format("YYYY-MM-DD HH:mm:ss")])));
  console.log(authorDao.insert(Object.keys(au).map((name) => [name, moment().format("YYYY-MM-DD HH:mm:ss")])));
}
// initCateAndAu();
for (const item of list) {
  initNovelAndCatalog(JSON.parse(item));
}
