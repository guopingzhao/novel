const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

module.exports = async function p (url, i) {
    const {body} = await request(url, {mobile: true});
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const content = $("#nr").text().trim();
    return content;
}