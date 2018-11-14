const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const { appendFileSync, unlinkSync, existsSync} = require("fs");
const { resolve } = require("path");
const request = require("../../../src/util/request");

const filePath = resolve(__dirname, "./list.txt");
if(existsSync(filePath)) unlinkSync(filePath);

const list = [];
let errorNum = 0;

async function p (url, i) {
    await request(url, ({body}) => {
        const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        const c = $(".blockcontent").slice(0, 1).find("a").slice(i, 1 + i).text().replace(/(小说|类型)/g, "") || "其他";
        $("tr+tr").each((index, tr) => {
            list.push(JSON.stringify({
                class: c, 
                name: $(tr).find("td").slice(0, 1).text(), 
                addr: $(tr).find("td a").slice(0, 1).attr("href"),
                author: $(tr).find("td").slice(2, 3).text()
            }))
        })
        if (list.length > 1000) {
            console.log(`www.7kankan.com 写入${list.length}条`);
            appendFileSync(filePath, list.splice(0, list.length).join("\n") + "\n");
        }
    }).catch(() => {
        console.log(`www.7kankan.com 错误数${++errorNum}`)
    })
    return true;
}

let step = 1;

function start(i) {
    request(`http://www.7kankan.com/files/article/sort${i}/0/1.htm`, async ({body}) => {
        const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        const max = ~~$("#pagelink > a.last").text();
        const promise = [];
        for (let j = 1; j <= max; j++) {
            const req = p(`http://www.7kankan.com/files/article/sort${i}/0/${j}.htm`, i);
            if (promise.length < step) {
                promise.push(req)
            } else {
                await Promise.all(promise.splice(0, promise.length).concat(req))
            }
        }
    })
}
console.log(`www.maopuzw.com 爬取开始`);
for(let i = 1; i < 11; i++) {
    start(i);
}

process.once("exit", (code) => {
    if(!code) {
        appendFileSync(filePath, list.join("\n"));
    }
})