const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

module.exports = async function p (url) {
    const {body, status} = await request(url);
    if (status !== 200) return
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const name = $("#box > h1").text();
    const cover = "";
    const brief = "";
    const catalog = [];
    $("body > table a").each((index, a) => {
        catalog.push({
            name: $(a).text(),
            addr: `http://www.qb520.org${$(a).attr("href")}`
        })
    })
    return {
        name,
        catalogAddr: url,
        brief,
        cover,
        catalog
    };
}