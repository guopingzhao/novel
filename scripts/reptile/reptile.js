const { resolve } = require("path");
const { writeFileSync, readFileSync, existsSync, appendFileSync } = require("fs");
const moment = require("moment");
const modules = require("./modules");
const { forkChild } = require("../../src/util/tools");
const warehousingAuthor = require("../mysql/warehousing.author");
const warehousingCategory = require("../mysql/warehousing.category");
const warehousing = require("../mysql/warehousing.novel");
const warehousingCatalog = require("../mysql/warehousing.catalog");

console.log(process.argv)

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
const maxProcessCoef = parseFloat(maxProcessCoefStr.replace(/maxProcessCoef=/g, "")) || defaultMaxProcessCoef;

// 第三步每次完善几条
const obtainNumStr = args.find((item) => item.includes("obtainNum=")) || "";
const obtainNum = (~~obtainNumStr.replace(/obtainNum=/g, "")) || 9;

// 第三步完善时跳过多少条
const skipNumfStr = args.find((item) => item.includes("skipNum=")) || "";
const skipNum = (~~skipNumfStr.replace(/skipNum=/g, "")) || 0;

// 第四步录入目录跳过多少条
const skipCatalogNumfStr = args.find((item) => item.includes("skipCatalogNum=")) || "";
const skipCatalogNum = (~~skipCatalogNumfStr.replace(/skipCatalogNum=/g, "")) || 0;

// 最大子进程数
const maxChildProcessNum = ~~(require("os").cpus().length * maxProcessCoef) || 2;

async function mergeList() {
    const txts = [];
    for (const {dir, sourceAlias} of Object.values(modules)) {
        if (sources.includes(sourceAlias)) 
            txts.push(resolve(dir, "list.txt"))
    }

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
        if (!categorys.includes(category.trim())) categorys.push(category.trim());
        authors[author.trim()] = true;
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
    const result = Object.values(listMap);
    const authorList = Object.keys(authors);
    writeFileSync(resolve(__dirname, "./list.json"), JSON.stringify(result, null, 2));
    writeFileSync(resolve(__dirname, "./categorys.json"), JSON.stringify(categorys, null, 2));
    writeFileSync(resolve(__dirname, "./authors.json"), JSON.stringify(authorList, null, 2));
    await warehousingAuthor(authorList);
    await warehousingCategory(categorys);
    return result;
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

let perfectNum = 0, errorNum = 0, allNum = 0;
async function perfect(list=[]) {
    if (skipNum) {
        list = list.slice(0, -skipNum);
    }
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} 读取分类`)
    const categoryMap = await warehousing.getCategoryMap();
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} 读取作者`)
    const authorMap = await warehousing.getAuthorMap();
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} 开始遍历`)
    const forks = [];
    const childs = [];
    let partNum = obtainNum, max = Math.ceil(list.length / partNum);
    let spliceList = () => list.splice(Math.max(list.length - obtainNum, 0), partNum)
    for (let i = 0; i < maxChildProcessNum && list.length > 0; i++) {
        forks.push(forkChild(resolve(__dirname, "perfect.js"), (child) => {
            childs.push(child);
            child.send({ list: spliceList(), modules });
            child.on("message", async (message) => {
                if (Array.isArray(message)) {
                    for (const item of message) {
                        if (!item || (item && !item.isReload)) {
                            ++allNum;
                        }
                        if (item && item.name && item.catalogAddr) {
                            ++perfectNum;
                            item.authorId = authorMap[item.author.trim()];
                            item.categorys = item.category.split(",").map((it) => categoryMap[it.trim()]).join() ;
                            warehousing(item).then((result) => {
                                if (!result) {
                                    ++errorNum;
                                    warehousing(item);
                                }
                            })
                            
                        } else if(!item.isReload) {
                            item.isReload = true;
                            list.push(item);
                        }
                    }
                } else {
                    allNum += partNum;
                }
                if ( list.length > 0 ) {
                    child.send({ list: spliceList(), modules });
                } else {
                    child.disconnect();
                }
                console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} 遍历${allNum}条 插入${perfectNum}条 成功${perfectNum - errorNum}条 失败${errorNum}条`)
            })
        }));
    }
    console.log(`一共需要整理${list.length}条，每次整理${partNum}条，最多整理${max}次，开启${maxChildProcessNum}个子进程整理: ${childs.map((item) => item.pid).join()}`);
    await Promise.all(forks);
    perfectNum = 0, errorNum = 0, allNum = 0;
}

async function catalog() {
    let list = await warehousingCatalog.getList();
    if (skipCatalogNum) {
        list = list.slice(0, -skipCatalogNum);
    }

    const forks = [];
    const childs = [];
    let partNum = obtainNum, max = Math.ceil(list.length / partNum);
    let spliceList = () => list.splice(Math.max(list.length - partNum, 0), partNum)
    for (let i = 0; i < maxChildProcessNum && list.length > 0; i++) {
        forks.push(forkChild(resolve(__dirname, "catalog.js"), (child) => {
            childs.push(child);
            child.send({ list: spliceList() });
            child.on("message", async (message) => {
                if (Array.isArray(message)) {
                    for (const item of message) {
                        if (!item || (item && !item.isReload)) {
                            ++allNum;
                        }
                        if (item.catalog && item.catalog.length) {
                            ++perfectNum;
                            warehousingCatalog(item.catalog, item.novel_id).then((result) => {
                                if (!result) {
                                    ++errorNum;
                                    warehousingCatalog(item.catalog, item.novel_id).then((result) => {
                                        if (!result) {
                                            appendFileSync(resolve(__dirname, 'fail.txt'), JSON.stringify({
                                                novelId: item.novel_id,
                                                catalog: item.catalog
                                            }))
                                        } else {
                                            --errorNum;
                                        }
                                    });
                                }
                            })
                        } else if(!item.isReload) {
                            item.isReload = true;
                            list.push(item);
                        }
                    }
                } else {
                    allNum += partNum;
                }
                if ( list.length > 0 ) {
                    child.send({ list: spliceList(), modules });
                } else {
                    child.disconnect();
                }
                console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} 遍历${allNum}本 插入${perfectNum}本 成功${perfectNum - errorNum}本 失败${errorNum}本`)
            })
        }));
    }
    console.log(`一共需要爬取${list.length}本，每次爬取${partNum}本，最多整理${max}次，开启${maxChildProcessNum}个子进程整理: ${childs.map((item) => item.pid).join()}`);
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
    console.log(`==========合并列表完成，开始完善列表信息并入库 列表长度${list.length} ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);
    if (steps.includes(3)) {
        await perfect(list);
    } else {
        console.log("==========忽略完善列表和入库==========");
    }
    
    console.log(`==========完善列表信息结束, 开始录入目录 ${moment().format("YYYY-MM-DD HH:mm:ss")}==========`);

    if (steps.includes(4)) {
        await catalog();
    } else {
        console.log("==========忽略录入目录==========");
    }
    console.log("==========录入目录完成==========");

    console.log(`==========用时: ${((Date.now() - start) / 1000 / 60).toFixed(0)}分钟==========`);
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