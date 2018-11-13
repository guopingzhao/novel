const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

module.exports = async function p (url) {
    const {body, status} = await request(url);
    if (status !== 200) return
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const name = $("#content tr:nth-child(1) table td td:nth-child(1)").text();
    const addr = "http://www.7kankan.com" + $("#content tr:nth-child(5) table td:nth-child(1) li:nth-child(1) a").attr("href");
    const cover = $("#content tr:nth-child(5) td:nth-child(2) img").attr("src");
    const str = $("#content tr:nth-child(5) table td:nth-child(2)").text().trim();
    const index = str.indexOf("内容简介");
    const brief = str.substring(index + 5);
    const catalogPage = await request(addr)
    const catalogPageBodyStr = iconv.decode(catalogPage.body, "gbk");
    const catalog = [];
    cheerio.load(catalogPageBodyStr)(".uclist dd a").each((index, a) => {
        catalog.push({
            name: $(a).text(),
            addr: addr.replace("index.html", $(a).attr("href"))
        })
    })
    return {
        name,
        catalogAddr: addr,
        brief,
        cover,
        catalog
    }
}