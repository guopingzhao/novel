const { fork, execSync } = require("child_process");
const { resolve } = require("path");
const { writeFileSync, openSync, readFileSync, existsSync } = require("fs");
const moment = require("moment");

// execSync(`rm -rf ${__dirname}/**/*.txt`);

// module name
const qukankan = "qukankan";
const aoshi = "aoshi";
const maopu = "maopu";
const quanben = "quanben";

// module root path
const qukankanDir = resolve(__dirname, "./www.7kankan.com");
const aoshiDir = resolve(__dirname, "./www.23zw.me");
const maopuDir = resolve(__dirname, "./m.maopuzw.com");
const quanbenDir = resolve(__dirname, "./www.qb520.org");

const outLogPath = resolve(__dirname, "child-out.log");
const errorLogPath = resolve(__dirname, "child-error.log");

writeFileSync(outLogPath, "");
writeFileSync(errorLogPath, "");

const outLog = openSync(outLogPath, "w");
const errorLog = openSync(errorLogPath, "w");

const modules = {
    [qukankan]: {
        dir: qukankanDir,
        list: resolve(qukankanDir, "list.js"),
        detail: require(resolve(qukankanDir, "detail.js")),
        content: resolve(qukankanDir, "content.js"),
    },
    [aoshi]: {
        dir: aoshiDir,
        list: resolve(aoshiDir, "list.js"),
        detail: require(resolve(aoshiDir, "detail.js")),
        content: resolve(aoshiDir, "content.js"),
    },
    [maopu]: {
        dir: maopuDir,
        list: resolve(maopuDir, "list.js"),
        detail: require(resolve(maopuDir, "detail.js")),
        content: resolve(maopuDir, "content.js"),
    },
    [quanben]: {
        dir: quanbenDir,
        list: resolve(quanbenDir, "list.js"),
        detail: require(resolve(quanbenDir, "detail.js")),
        content: resolve(quanbenDir, "content.js"),
    },
}

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

async function mergeList() {
    const txts = Object.values(modules).map(({ dir }) => resolve(dir, "list.txt"));

    let list = [];

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

    const listMap = {};
    const categorys = [];
    const authors = [];
    list.forEach((item) => {
        try {
            item = JSON.parse(item.replace(/,\s*$/, ""));
            const key = `${item.name}<>${item.author}`;
            const addr = item.addr;
            const category = item.class;
            const author = item.author;
            const isExist = key in listMap;
            if (!categorys.includes(category)) categorys.push(category);
            if (!authors.includes(author)) authors.push(author);
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
        } catch (error) {
            console.log(item.replace(/,\s*$/, ""))
        }
    })

    writeFileSync(resolve(__dirname, "./list.json"), JSON.stringify(Object.values(listMap), null, 2));
    writeFileSync(resolve(__dirname, "./categorys.json"), JSON.stringify(categorys, null, 2));
    writeFileSync(resolve(__dirname, "./authors.json"), JSON.stringify(authors, null, 2));
    return Object.values(listMap);
}

async function reptileList() {
    return Promise.all(
        Object.values(modules).map(({ list }) => {
            return forkChild(list);
        })
    )
}


async function start() {
    const start = Date.now();
    console.log(`==========开始时间: ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
    console.log("==========开始爬取列表==========");
    await reptileList();
    console.log(`==========列表爬取结束，开始合并列表 ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
    const list = await mergeList()
    console.log(`==========合并列表完成，开始完善列表信息 ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
    await forkChild(resolve(__dirname, "perfect.js"), (child) => child.send({ list, modules }));
    console.log("==========完善列表信息结束==========");
    console.log(`==========用时: ${Date.now() - start}ms==========`);
    console.log(`==========结束时间: ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
}
mergeList()
// start();

process.once("exit", (code) => {
    if (!code) {
        console.log("爬取完成")
    } else {
        console.log("意外终止")
    }
})