const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

module.exports = async function p (url) {
    const {body, status} = await request(url);
    if (status !== 200) return;
    const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        const name = $("#wrap > div.Css_4 > div > h1").text().replace(/.*《(.*)》.*/, "$1");
        const cover = "";
        const brief = $("#tuijian").first().text().replace(/\n(\n|.)*/, '');
        const catalog = [];
        $("#chapterlist li a").each((index, a) => {
            catalog.push({
                name: $(a).text(),
                addr: `https://www.maopuzw.com${$(a).attr("href")}`
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