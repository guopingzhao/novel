const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const {appendFileSync, writeFileSync} = require("fs");

const filePath = "./www.7kankan.com.content.txt";
writeFileSync(filePath, "");
// brief
async function p (url, i) {
    const {body} = await request(url);
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const content = $("#content").text().trim();
    writeFileSync(filePath, content);
}

p(`http://www.7kankan.com/files/article/html/79/79351/20100158.html`)