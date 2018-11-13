const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

module.exports = async function p (url, i) {
    const {body, status} = await request(url)
    if (status !== 200) return;
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const name = $("#container > div.topr > div.chapter_list_novel_title > h1").text();
    const cover = "https://www.23zw.me" + $("#container > div.cover > img").attr("src");
    const brief = $("#container > div.topr > div.intro").text().trim().replace(/.*简介：?/, "");
    const catalog = [];
    $("#chapter_list a").each((index, a) => {
        catalog.push({
            name: $(a).text(),
            addr: url.replace("index.html", $(a).attr("href"))
        })
    })
    return {
        name,
        catalogAddr: url,
        brief,
        cover,
        catalog
    }
}