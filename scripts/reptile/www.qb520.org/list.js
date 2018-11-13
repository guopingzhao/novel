const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const {unlinkSync, writeFileSync, existsSync} = require("fs");
const {resolve} = require("path");
const request = require("../../../src/util/request");

const filePath = resolve(__dirname, "./list.txt");
if(existsSync(filePath)) unlinkSync(filePath);

const list = [];

function p (url, i) {
    request(url, ({body}) => {
        const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        const c = $(".m_menu a").slice(1+i, 2+i).text().replace(/(小说|类型)/g, "") || "其他";
        $("tr+tr").each((index, tr) => {
            list.push(JSON.stringify({
                class: c, 
                name: $(tr).find("td").slice(0, 1).text(), 
                addr: "http://www.qb520.org" + $(tr).find("td a").slice(0, 1).attr("href"),
                author: $(tr).find("td").slice(2, 3).text(), 
            }));
        })
        if($("a.next") && $("a.next").attr("href")) {
            p($("a.next").attr("href"), i);
        }
    })
}

for(let i = 1; i < 11; i++) {
    p(`http://www.qb520.org/qblist/${i}.html`, i)
}

process.once("exit", (code) => {
    if (!code) {
        writeFileSync(filePath, JSON.stringify(list, null, 2));
    }
})