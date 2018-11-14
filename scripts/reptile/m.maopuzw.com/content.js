const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

module.exports = async function p (url, i) {
    const {body} = await request(url, {mobile: true});
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const content = $("#nr1").text().trim().replace(/(猫扑中文|m.maopuzw.com)/g, "");
    return content;
}