const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const cluster = require("cluster");
const cupNum = require("os").cpus().length;
const {unlinkSync, appendFileSync, existsSync} = require("fs");
const {resolve} = require("path");
const request = require("../../../src/util/request");

const filePath = resolve(__dirname, "./list.txt");

if (cluster.isMaster) {
    let addrs = [];
    let list = [];

    if(existsSync(filePath)) unlinkSync(filePath);
    start();
    async function start() {
        const {body} = await request(`http://m.qb520.org/topallvote/1.html`)
        const bodyStr = iconv.decode(body, "gbk");
        const $ = cheerio.load(bodyStr);
        const max = ~~$(".page").last().text().replace(/.*\/(\d*).*\).*/, "$1");
        console.log(max, $(".page").last().text())
        for (let j = 1; j <= max; j++) {
            addrs.push(`http://m.qb520.org/topallvote/${j}.html`)
        }

        console.log(`m.qb520.org 爬取开始, ${cupNum}个工作线程`);

        for (let i = 0; i < cupNum; i++) {
            cluster.fork().send(addrs.pop())
        }
        cluster.on('message', (worker, message) => {
            list.push(...message);
            if(addrs.length > 0) {
                worker.send(addrs.pop());
            } else {
                worker.disconnect();
            }
            console.log(`m.qb520.org 写入${list.length}条`)
        })
    }
    
    process.once("exit", (code) => {
        console.log(`m.qb520.org 完成爬取`);
        if (!code) {
            appendFileSync(filePath, list.join("\n"));
        }
    })

} else {
    let list = [];
    async function p (url, rep) {
        request(url, ({body}) => {
            const bodyStr = iconv.decode(body, "gbk");
            const $ = cheerio.load(bodyStr);

            $("div.cover .line").each((index, li) => {
                const text = $(li).first().text().replace(/\[\]/, "").trim()
                list.push(JSON.stringify({
                    class: text.replace(/\[([^\]]+)\].+/, "$1").trim(), 
                    name: text.replace(/.*\](.*)\/.*/, "$1").trim(), 
                    addr: "http://m.qb520.org" + $(li).find("a:nth-child(2)").attr("href"),
                    author: text.replace(/.*\].*\/(.*)/, "$1").trim(), 
                }));
            })
            process.send(list.splice(0, list.length));
        }).catch(() => {
            if(rep){
                console.error(`m.qb520.org 错误地址${url}, 放弃!!!!!!`)
                process.send([])
            } else {
                p(url, true)
                console.log(`m.qb520.org 错误地址${url}, 并重试`)
            }
        })
    }
    console.log(`m.qb520.org ${process.pid}准备就绪`);
    process.on('message', (addr) => {
        p(addr);
    })
    process.on('exit', () => {
        console.log(`m.qb520.org ${process.pid}关闭`);
    })
}


