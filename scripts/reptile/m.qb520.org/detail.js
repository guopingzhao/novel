const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const host = "http://m.qb520.org";

module.exports = async function p (url) {
    const {body, status} = await request(url, {mobile: true});
    if (status !== 200) return;
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const name = $("body > div.cover > div.block > div.block_txt2 > h2 > a").text();
    const src = $("body > div.cover > div.block > div.block_img2 > img").attr("src");
    const cover = src.includes(host) ? src : `${host}${src}`;
    const brief = $("body > div.cover > div.intro_info").text();
    const catalog = await catalogScript(url)
    return {
        name,
        catalogAddr: url,
        brief,
        cover,
        catalog
    };
}

module.exports.catalogScript = catalogScript;
async function catalogScript (url) {
    const catalog = [];
    const {body, status} = await request(url, {mobile: true});
    if (status !== 200) return;
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);

    $(".chapter li a").each((index, a) => {
        catalog.push({
            name: $(a).text().trim(),
            addr: `${host}${$(a).attr("href")}`
        })
    })
    return catalog;
}