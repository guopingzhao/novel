const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const {unlinkSync, existsSync, appendFileSync} = require("fs");
const {resolve} = require("path");
const request = require("../../../src/util/request");

const filePath = resolve(__dirname, "./list.txt");
if(existsSync(filePath)) unlinkSync(filePath);

const list = [];

let errorNum = 0;

function p (url) {
    return request(url, ({body}) => {
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
    }).catch(() => {
        console.log(`www.23zw.me 错误数${++errorNum}`)
    })
}

function start() {
    request("https://www.23zw.me/class_0_1.html", async ({body}) => {
        const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        const max = ~~$("#pagelink > a.last").text();
        const promise = [];
        for (let i = 1; i <= max; i++) {
            const req = p(`https://www.23zw.me/class_0_${i}.html`);
            if (promise.length < 5) {
                promise.push(req)
            } else {
                await Promise.all(promise.splice(0, promise.length).concat(req))
            }
        }
    })
}

start();

process.once("exit", (code) => {
    if (!code) {
        appendFileSync(filePath, list.join("\n"));
    }
})