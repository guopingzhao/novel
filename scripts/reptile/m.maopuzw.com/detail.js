const request = require("../../../src/util/request");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const host = "https://m.maopuzw.com";

module.exports = async function p (url) {
    const {body, status} = await request(url, {mobile: true});
    if (status !== 200) return;
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);
    const name = $("body > div.cover > div.block > div.block_txt2 > h2 > a").text();
    const cover = $("body > div.cover > div.block > div.block_img2 > img").attr("src");
    const brief = $("body > div.cover > div.intro_info").text();
    const catalogUrl = host + $("body > div.cover > div:nth-child(3) > span:nth-child(2) > a").attr("href")
    return {
        name,
        catalogAddr: catalogUrl,
        brief,
        cover,
    };
}

module.exports.catalogScript = catalogScript;

async function catalogScript (url, isNextPage = false) {
    const catalog = [];
    const {body, status} = await request(url, {mobile: true});
    if (status !== 200) return;
    const bodyStr = iconv.decode(body, "gbk");
    const $ = cheerio.load(bodyStr);

    $(".chapter a").each((index, a) => {
        catalog.push({
            name: $(a).text().trim(),
            addr: `${host}${$(a).attr("href")}`
        })
    })
    if (isNextPage) {
        const matcher = $(".page").last().text().match(/\d+/g);
        if(matcher[1] && ~~matcher[1]) {
            const totalPage = ~~matcher[1];
            let catalogs = null;
            for (let i = 2; i <= totalPage; i++) {
                catalogs = await catalogScript(url.replace(/\/$/, `_${i}`))
                if (catalogs) {
                    catalog.push(...catalogs);
                }
            }
        }
    }
    return catalog;
}