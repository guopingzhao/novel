const {fork} = require("child_process");

module.exports.forkChild = function forkChild(m, args=[], options={}, cb = () => { }) {
  if(typeof args === "function") {
    cb = args;
    args = [];
  }
  if (!Array.isArray(args) && typeof args === "boolean") {
    options = args;
    args = [];
  }
  if (typeof options === "function") {
    cb = options;
    options = {};
  }

  const {isErrorExitRestart=true, ...forkOptions} = options;
  return new Promise((res) => {
      console.log(`fork ${m}`);
      const child = fork(m, args, forkOptions);
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