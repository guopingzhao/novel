const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

module.exports = async function p (url, next = true) {
    const {body} = await request(url, {mobile: true});
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    let content = $("#nr1").text().trim();
    if (next) {
        const num = ~~$("#nr_title").text().trim().replace(/.*\(.*\/(\d*).*\).*/, "$1");
        for (let i = 2; i <= num; i++) {
            content += await p(url.replace(".html", `_${i}.html`), false);
        }
    }
    return content;
}