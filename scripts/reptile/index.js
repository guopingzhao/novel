const { fork } = require("child_process");
const { resolve } = require("path");
const { writeFileSync, openSync, readFileSync, existsSync } = require("fs");
const moment = require("moment");

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

const outLogPath = resolve(__dirname, "child-out.log");
const errorLogPath = resolve(__dirname, "child-error.log");

writeFileSync(outLogPath, "");
writeFileSync(errorLogPath, "");

const outLog = openSync(outLogPath, "w");
const errorLog = openSync(errorLogPath, "w");

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
const defaultSources = "sources=a,b,c,d";Object.values(modules).reduce((a, {sourceAlias}) => a ? `${a},${sourceAlias}` : sourceAlias ,"")

const args = process.argv.slice(2);

const stepStr = args.find((item) => item.includes("step=")) || defaultStep;
const steps = stepStr.replace(/step=/g, "").split(/(,|，)/).map((item="") => ~~item.trim());

const sourcesStr = args.find((item) => item.includes("sources=")) || defaultSources;
const sources = sourcesStr.replace(/sources=/g, "").split(/(,|，)/).map((item="") => item.trim());



function forkChild(m, cb = () => { }) {
    return new Promise((res) => {
        console.log(`fork ${m}`);
        const child = fork(m, { stdio: ["ignore", outLog, errorLog, 'ipc'] });
        cb(child);
        child.on("error", () => {
            console.log("error")
        })
        child.once("exit", (code) => {
            console.log(`${m} exit, code:${code}`);
            if (code !== 0) {
                console.log(`${m} restart`);
                res(forkChild(m, cb));
            } else {
                res(true);
            }
        })
    })
}

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
    console.log(`==========合并列表完成，开始完善列表信息 ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
    if (steps.includes(3)) {
        await forkChild(resolve(__dirname, "perfect.js"), (child) => child.send({ list, modules }));
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