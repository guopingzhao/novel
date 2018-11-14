const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const host = "http://m.7kankan.com";

module.exports = async function p (url) {
    const {body, status} = await request(url, {mobile: true});
    if (status !== 200) return;
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const name = $("#index > div.cover > div.block > div.block_txt2 > h2 > a").text();
    const cover = $("#index > div.cover > div.block > div.block_img2 > img").attr("src");
    const brief = $("#index > div.cover > div.intro_info").text();
    const catalogUrl = host + "/" + $("#index > div.cover > div:nth-child(3) > span:nth-child(2) > a").attr("href")
    const catalog = await catalogScript(catalogUrl)
    return {
        name,
        catalogAddr: catalogUrl,
        brief,
        cover,
        catalog
    };
}

module.exports.catalogScript = async function catalogScript (url) {
    const catalog = [];
    const {body, status} = await request(url, {mobile: true});
    if (status !== 200) return;
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);

    $("#index > div.cover > ul > li:nth-child(1) > a").each((index, a) => {
        catalog.push({
            name: $(a).text(),
            addr: `${host}${$(a).attr("href")}`
        })
    })
    let next = null;
    $("#index .page").first().children().each((index, a) => {
        if($(a).text() === "下一页" && $(a).attr("href")) {
            next = $(a).attr("href");
        }
    });
    if(next) {
        console.log("http://m.7kankan.com catalog 下一页");
        return [...catalog, ...await catalogFunc(host + next)];
    }
    return catalog;
}