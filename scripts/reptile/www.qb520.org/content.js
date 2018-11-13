const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const {appendFileSync, writeFileSync} = require("fs");

const filePath = "./www.qb520.org.content.txt";
writeFileSync(filePath, "");
// brief
async function p (url, i) {
    const {body} = await request(url);
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const content = $("#content").text().trim().replace(/(猫扑中文|www.maopuzw.com)/g, "");
    writeFileSync(filePath, content);
}

p(`http://www.qb520.org/xiaoshuo/173/173485/1269524.html`)