const {resolve} = require("path");

// module name
const qukankan = "qukankan";
const aoshi = "aoshi";
const maopu = "maopu";
const quanben = "quanben";

// module root path
const qukankanDir = resolve(__dirname, "./m.7kankan.com");   // a
const aoshiDir = resolve(__dirname, "./www.23zw.me");        // b
const maopuDir = resolve(__dirname, "./m.maopuzw.com");      // c
const quanbenDir = resolve(__dirname, "./m.qb520.org");    // d


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

module.exports = modules;