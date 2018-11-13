const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const {appendFileSync, writeFileSync} = require("fs");

const filePath = "./www.maopuzw.com.content.txt";
writeFileSync(filePath, "");
// brief
async function p (url, i) {
    const {body} = await request(url);
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const content = $("#clickeye_content").text().trim().replace(/(猫扑中文|www.maopuzw.com)/g, "");
    writeFileSync(filePath, content);
}

p(`https://www.maopuzw.com/html/188/188116/103007402.html`)