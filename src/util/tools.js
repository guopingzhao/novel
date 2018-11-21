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

function list2map (list=[], field) {
  const result = {};
  list.forEach((item) => {
    result[item[field]] = item;
  })
  return result;
}

function listObj2list(list=[], field) {
  return list.map((item) => item[field]);
}

module.exports.forkChild = forkChild;
module.exports.datetime = datetime; 
module.exports.awaitAll = awaitAll; 
module.exports.list2map = list2map; 
module.exports.listObj2list = listObj2list; 