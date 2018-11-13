const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const {unlinkSync, existsSync, appendFileSync} = require("fs");
const {resolve} = require("path");
const request = require("../../../src/util/request");

const filePath = resolve(__dirname, "./list.txt");
if(existsSync(filePath)) unlinkSync(filePath);

const list = [];

function p (url) {
    request(url, ({body}) => {
        const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        $("tr+tr").each((index, tr) => {
            const td = $(tr).find("td");
            list.push(JSON.stringify({
                class: td.slice(0, 1).text().replace(/(小说|类型)/g, "") || "其他",
                name: td.slice(2, 3).text(),
                addr: td.slice(2, 3).find("a").attr("href"),
                author: td.slice(4, 5).text(),
            }));
        })
        if (list.length > 10000) {
            console.log(`www.23zw.me 写入${list.length}条`);
            appendFileSync(filePath, list.splice(0, list.length).join("\n") + "\n");
        }
        if($("a.next") && $("a.next").attr("href")) {
            p($("a.next").attr("href"))
        }
    })
}

p("https://www.23zw.me/class_0_1.html")

process.once("exit", (code) => {
    if (!code) {
        appendFileSync(filePath, list.join("\n"));
    }
})