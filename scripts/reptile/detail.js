const modules = require("./modules");

const qukankan = "m.7kankan.com";
const aoshi = "www.23zw.me";
const maopu = "m.maopuzw.com";
const quanben = "m.qb520.org";

const sortMap = {
    [qukankan]: 2,
    [aoshi]: 1,
    [maopu]: 0,
    [quanben]: 3,
}

const detailScript = Object.values(modules).reduce((a, {dir, detail}) => {
    return {
        ...a,
        [getSourceKey(dir)]: require(detail)
    }
}, {})

function mergeCatalog(source, obj = []) {
    const sourceL = source.length;
    const offset = 50;
    let catalog = null
    obj.forEach(({name, addr}, index) => {
        catalog = source.slice(
            Math.max(0, index - offset),
            Math.min(sourceL, index + offset)
        ).find((item) => item.name === name);
        if (catalog && !catalog.addr.includes(addr)) {
            catalog.addr = `${catalog.addr},${addr}`
        }
    })
}

function assign(source, obj = {}) {
    for (const k in obj) {
        if (k === "catalogAddr" && !!source[k]) {
            source[k] = `${source[k]},${obj[k]}`
        } else if (!!source[k]) {
            continue;
        } else if (obj[k]) {
            source[k] = obj[k];
        }
    }
}

function getSourceKey(source) {
    if (source.includes(qukankan)) {
        return qukankan;
    } else if (source.includes(aoshi)) {
        return aoshi;
    } else if (source.includes(maopu)) {
        return maopu;
    } else if (source.includes(quanben)) {
        return quanben;
    }
}

function getScript(source) {
    if (source.includes(qukankan)) {
        return detailScript[qukankan];
    } else if (source.includes(aoshi)) {
        return detailScript[aoshi];
    } else if (source.includes(maopu)) {
        return detailScript[maopu];
    } else if (source.includes(quanben)) {
        return detailScript[quanben];
    }
}

function sourcesSort(sources) {
    return (sources.split(",") || []).sort((a, b) => sortMap[getSourceKey(a)] - sortMap[getSourceKey(b)]);
}

module.exports.detail = async function handle(item) {
    const detail = {};
    const sources = sourcesSort(item.sources);
    for (const source of sources) {
        const script = getScript(source);
        if (!script) continue;
        let falg = await script(source).catch(() => {});
        if (falg) {
            assign(detail, falg);
        }
    }
    return {
        ...detail,
        ...item,
    };
}

module.exports.catalog = async function (url) {
    const sources = sourcesSort(url);
    const catalog = [];
    for (const source of sources) {
        const script = getScript(source);
        if (!script) continue;
        let falg = await script.catalogScript(source).catch(() => {});
        if (falg) {
            mergeCatalog(catalog, falg);
        }
    }
    return catalog;
}