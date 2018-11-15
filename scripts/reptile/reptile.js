const { resolve } = require("path");
const { writeFileSync, openSync, readFileSync, existsSync, appendFileSync } = require("fs");
const moment = require("moment");
const { forkChild } = require("../../src/util/tools");

console.log(process.argv)

// module name
const qukankan = "qukankan";
const aoshi = "aoshi";
const maopu = "maopu";
const quanben = "quanben";

// module root path
const qukankanDir = resolve(__dirname, "./m.7kankan.com"); // a
const aoshiDir = resolve(__dirname, "./www.23zw.me");        // b
const maopuDir = resolve(__dirname, "./m.maopuzw.com");      // c
const quanbenDir = resolve(__dirname, "./www.qb520.org");    // d


const modules = {
    [qukankan]: {
        sourceAlias: "a",
        dir: qukankanDir,
        list: resolve(qukankanDir, "list.js"),
        detail: resolve(qukankanDir, "detail.js"),
        content: resolve(qukankanDir, "content.js"),
    },
    [aoshi]: {
        sourceAlias: "b",
        dir: aoshiDir,
        list: resolve(aoshiDir, "list.js"),
        detail: resolve(aoshiDir, "detail.js"),
        content: resolve(aoshiDir, "content.js"),
    },
    [maopu]: {
        sourceAlias: "c",
        dir: maopuDir,
        list: resolve(maopuDir, "list.js"),
        detail: resolve(maopuDir, "detail.js"),
        content: resolve(maopuDir, "content.js"),
    },
    [quanben]: {
        sourceAlias: "d",
        dir: quanbenDir,
        list: resolve(quanbenDir, "list.js"),
        detail: resolve(quanbenDir, "detail.js"),
        content: resolve(quanbenDir, "content.js"),
    },
}

const defaultStep = "step=1,2,3";
const defaultSources = "sources=" + Object.values(modules).reduce((a, {sourceAlias}) => a ? `${a},${sourceAlias}` : sourceAlias ,"");
const defaultMaxProcessCoef = 4;

const args = process.argv.slice(2);

// 执行步骤
const stepStr = args.find((item) => item.includes("step=")) || defaultStep;
const steps = stepStr.replace(/step=/g, "").split(/(,|，)/).map((item="") => ~~item.trim());

// 爬取源
const sourcesStr = args.find((item) => item.includes("sources=")) || defaultSources;
const sources = sourcesStr.replace(/sources=/g, "").split(/(,|，)/).map((item="") => item.trim());

// 最大子进程数是cpu数量的多少倍
const maxProcessCoefStr = args.find((item) => item.includes("maxProcessCoef=")) || "";
const maxProcessCoef = (~~maxProcessCoefStr.replace(/maxProcessCoef=/g, "")) || defaultMaxProcessCoef;

// 第三步每次完善几条
const perNumfStr = args.find((item) => item.includes("perNum=")) || "";
const perNum = (~~perNumfStr.replace(/perNum=/g, "")) || 9;

// 第三步完善时跳过多少条
const skipNumfStr = args.find((item) => item.includes("skipNum=")) || "";
const skipNum = (~~skipNumfStr.replace(/skipNum=/g, "")) || 0;

// 最大子进程数
const maxChildProcessNum = ~~(require("os").cpus().length * maxProcessCoef) || 2;

function mergeList() {
    const txts = Object.values(modules).map(({ dir }) => resolve(dir, "list.txt"));

    let list = [];
    console.log("==========开始读取文件==========");
    txts.forEach((file) => {
        if (!existsSync(file)) return;
        try {
            const items = readFileSync(file).toString().trim().split(/\s*\n\s*/);
            if (Array.isArray(items)) {
                list = list.concat(items)
            }
        } catch (error) {
            console.log("读取list文件反序列化失败", error);
        }
    })
    console.log(`==========读取文件结束, 列表长度：${list.length}==========`);
    const listMap = {};
    const categorys = [];
    const authors = {};
    list.forEach((item) => {
        try {
            item = JSON.parse(item.replace(/,\s*$/, ""));
        } catch (error) {
            console.log(item.replace(/,\s*$/, ""));
            return;
        }
        const key = `${item.name}<>${item.author}`;
        const addr = item.addr;
        const category = item.class;
        const author = item.author;
        const isExist = key in listMap;
        if (!categorys.includes(category)) categorys.push(category);
        authors[author] = true;
        delete item.addr;
        delete item.class;
        listMap[key] = {
            ...item,
            category: isExist
                ? listMap[key].category.includes(category)
                    ? listMap[key].category
                    : `${listMap[key].category},${category}`
                : category,
            sources: isExist
                ? listMap[key].sources.includes(addr)
                    ? listMap[key].sources
                    : `${listMap[key].sources},${addr}`
                : addr
        }
    })
    console.log("合并列表完成，开始写入文件");
    writeFileSync(resolve(__dirname, "./list.json"), JSON.stringify(Object.values(listMap), null, 2));
    writeFileSync(resolve(__dirname, "./categorys.json"), JSON.stringify(categorys, null, 2));
    writeFileSync(resolve(__dirname, "./authors.json"), JSON.stringify(Object.keys(authors), null, 2));
    return Object.values(listMap);
}

async function reptileList() {
    return Promise.all(
        Object.values(modules).map(({ list, sourceAlias }) => {
            if (sources.includes(sourceAlias)) {
                return forkChild(list);
            } else {
                console.log("忽略执行：", list);
                return true;
            }
        })
    )
}

let lock = 0;
let perfectNum = 0;
async function perfect(list=[]) {
    const perfectPath = resolve(__dirname, "perfect.txt");

    if (skipNum) {
        list = list.slice(skipNum);
    } else {
        writeFileSync(perfectPath, "");
    }

    const forks = [];
    const childs = [];
    let j = 0, partNum = perNum, max = Math.ceil(list.length / partNum);
    for (let i = 0; i < maxChildProcessNum; i++) {
        forks.push(forkChild(resolve(__dirname, "perfect.js"), (child) => {
            childs.push(child);
            child.send({ list: list.slice(j * partNum, (++j * partNum)), modules });
            child.on("message", (message) => {
                while(lock){}
                if ((lock = ~lock)) {
                    if (Array.isArray(message)) {
                        appendFileSync(perfectPath, message.join("\n") + "\n");
                    }
                    if ( j < max) {
                        child.send({ list: list.slice(j * partNum, ((++j) * partNum)), modules });
                    } else {
                        child.disconnect(0);
                    }
                    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} ${perfectNum += (message.length || partNum)}条`)
                }
                lock = ~lock; 
            })
        }));
    }
    console.log(`一共需要整理${list.length}条，每次整理${partNum}条，最多整理${max}次，开启${maxChildProcessNum}个子进程整理: ${childs.map((item) => item.pid).join()}`);
    await Promise.all(forks);
}

async function start() {
    const start = Date.now();
    console.log(`==========开始时间: ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
    console.log("==========开始爬取列表==========");
    if (steps.includes(1)) {
        await reptileList();
    } else {
        console.log("==========忽略爬取列表==========");
    }
    console.log(`==========列表爬取结束，开始合并列表 ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
    let list = [];
    if (steps.includes(2)) {
        list = await mergeList();
    } else {
        console.log("从文件读取列表");
        try {
            list = JSON.parse(readFileSync(resolve(__dirname, "./list.json")));
        } catch (error){
            console.error("读取文件列表失败", error);
        }
    }
    console.log(`==========合并列表完成，开始完善列表信息 列表长度${list.length} ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
    if (steps.includes(3)) {
        await perfect(list);
    } else {
        console.log("==========忽略完善列表==========");
    }
    
    console.log("==========完善列表信息结束==========");


    console.log(`==========用时: ${Date.now() - start}ms==========`);
    console.log(`==========结束时间: ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
}

start();

process.once("exit", (code) => {
    if (!code) {
        console.log("爬取完成")
    } else {
        console.log("意外终止")
    }
})