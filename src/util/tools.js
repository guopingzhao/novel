const {fork} = require("child_process");
const moment = require("moment");

function forkChild(m, args=[], options={}, cb = () => { }) {
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
function datetime(data) {
  return moment(data).format("YYYY-MM-DD HH:mm:ss");
}
function mutex () {
  let lock = false;
  const next = () => lock = false;
  return (cb, pointer) => {
    return (...args) => {
      while(lock) {console.log('等待')};
      lock = true;
      if (pointer) {
        cb.call(pointer, ...args, next)
      } else {
        cb(...args, next);
      }
      lock = false;
    }
  }
}
function awaitAll(promises, errorValue) {
  let l = promises.length, result = [];
  return new Promise((resolve) => {
    let cb = (res) => {
      result.push(res)
      --l;
      if(!l) {
        resolve(result)
      }
    }
    for (let promise of promises) {
      promise.then(cb)
      .catch((err) => {
        cb(errorValue !== undefined ?  errorValue : err)
      });
    }
  })
}
module.exports.forkChild = forkChild;
module.exports.datetime = datetime; 
module.exports.awaitAll = awaitAll; 
module.exports.synclock = mutex();