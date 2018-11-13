const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const {appendFileSync, writeFileSync} = require("fs");

const filePath = "./www.23zw.me.content.txt";
writeFileSync(filePath, "");
// brief
async function p (url, i) {
    const {body} = await request(url);
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const content = $("#text_area").text().trim();
    writeFileSync(filePath, content);
}

p(`https://www.23zw.me/olread/63/63185/ec94c886c4bd1c4e1f753c505a9df4ec.html`)