const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const {unlinkSync, appendFileSync, existsSync} = require("fs");
const {resolve} = require("path");
const request = require("../../../src/util/request");

const filePath = resolve(__dirname, "./list.txt");
if(existsSync(filePath)) unlinkSync(filePath);

const list = [];
let errorNum = 0;

async function p (url, i) {
    await request(url, {mobile: true}, ({body}) => {
        const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        const c = $(".content > ul li").slice(i - 1, i).text().replace(/(小说|类型)/g, "") || "其他";
        $(".cover .line").each((index, li) => {
            list.push(JSON.stringify({
                class: c, 
                name: $(li).find("a:nth-child(2)").text(), 
                addr: "https://m.maopuzw.com" + $(li).find("a:nth-child(2)").attr("href"),
                author: $(li).find("a:nth-child(3)").text(), 
            }));
        })
        if (list.length > 1000) {
            console.log(`m.maopuzw.com 写入${list.length}条`);
            appendFileSync(filePath, list.splice(0, list.length).join("\n") + "\n");
        }
    }).catch(() => {
        console.log(`m.maopuzw.com 错误数${++errorNum}`)
    })
    return true;
}
let step = 1;
function start(i) {
    request(`https://m.maopuzw.com/wapsort/${i}_1.html`, {mobile: true}, async ({body}) => {
        const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        const max = ~~$("body > div:nth-child(7)").text().replace(/.*\(.*\/(\d+).*\).*/, "$1");
        const promise = [];
        for (let j = 1; j <= max; j++) {
            const req = p(`https://m.maopuzw.com/wapsort/${i}_${j}.html`, i);
            if (promise.length < step) {
                promise.push(req)
            } else {
                await Promise.all(promise.splice(0, promise.length).concat(req))
            }
        }
    })
}
console.log(`m.maopuzw.com 爬取开始`);
for(let i = 1; i <= 9; i++) {
    start(i)
}

process.once("exit", (code) => {
    if (!code) {
        appendFileSync(filePath, list.join("\n"));
    }
})