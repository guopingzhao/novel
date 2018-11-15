const {fork} = require("child_process");

module.exports.forkChild = function forkChild(m, options={}, cb = () => { }) {
  if (typeof options === "function") {
    cb = options;
    options = {};
  }
  const {isErrorExitRestart, ...forkOptions} = options;
  return new Promise((res) => {
      console.log(`fork ${m}`);
      const child = fork(m, forkOptions);
      cb(child);
      child.on("error", () => {
          console.log("error")
      })
      child.once("exit", (code) => {
          console.log(`${m} exit, code:${code}`);
          if (code !== 0) {
            if (isErrorExitRestart) {
              console.log(`${m} restart`);
              res(forkChild(m, cb));
            } else {
              res(false);
            }
          } else {
              res(true);
          }
      })
  })
}