const { resolve } = require("path");
const { writeFileSync, openSync } = require("fs");
const { forkChild } = require("../../src/util/tools");


const outLogPath = resolve(__dirname, "child-out.log");
const errorLogPath = resolve(__dirname, "child-error.log");

writeFileSync(outLogPath, "");
writeFileSync(errorLogPath, "");

const outLog = openSync(outLogPath, "w");
const errorLog = openSync(errorLogPath, "w");
const forkOptions = { isErrorExitRestart: true, stdio: ["ignore", outLog, errorLog, 'ipc'] }

forkChild(resolve(__dirname, "reptile.js"), process.argv.slice(2), forkOptions);

require("http").createServer().listen(0) // 防止退出重启