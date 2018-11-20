const kankan = require("./m.7kankan.com/content")
const maopuzw = require("./m.maopuzw.com/content")
const qb520 = require("./m.qb520.org/content")
const zw = require("./www.23zw.me/content")

module.exports = (addr) => {
  switch(true) {
    case addr.includes("m.7kankan.com"):
      return kankan(addr)
    case addr.includes("m.maopuzw.com"):
      return maopuzw(addr)
    case addr.includes("m.qb520.org"):
      return qb520(addr)
    case addr.includes("www.23zw.me"):
      return zw(addr)
    default:
      return null;
  }
}