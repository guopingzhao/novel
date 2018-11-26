const { fork } = require("child_process");
const moment = require("moment");

function forkChild(m, args = [], options = {}, cb = () => { }) {
  if (typeof args === "function") {
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

  const { isErrorExitRestart = true, ...forkOptions } = options;
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
          res(forkChild(m, args, forkOptions, cb));
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

function awaitAll(promises, errorValue, fail = () => { }) {
  if (typeof errorValue === "function") {
    fail = errorValue
    errorValue = undefined
  }
  let l = promises.length, lx = l, result = [];
  return new Promise((resolve) => {
    let cb = (res, i) => {
      result[i] = res;
      --l;
      if (!l) {
        resolve(result)
      }
    }
    for (let i = 0; i < lx; i++) {
      promises[i].then((res) => {
        cb(res, i)
      }).catch((err) => {
        fail(err, i);
        cb(errorValue !== undefined ? errorValue : err, i)
      });
    }
  })
}

function list2map(list = [], field, valueField) {
  const result = {};
  const callback = valueField 
    ? (item) => result[item[field]] = item[valueField] 
    : (item) => result[item[field]] = item
  list.forEach(callback)
  return result;
}

function listObj2list(list = [], field) {
  return list.map((item) => item[field]);
}

function mutex() {
  const queues = [];
  let lock = false, result = null;
  const actuator = async () => {
    lock = true;
    while (queues.length) {
      const { fn, success, fail } = queues.shift();
      try {
        result = fn();
      } catch (err) {
        fail(err);
        continue;
      }
      if (result instanceof Promise) {
        success(await result.catch(fail))
      } else {
        success(result)
      }
    }
    lock = false;
  }
  return (cb, pointer) => {
    return (...args) => {
      return new Promise((resolve, reject) => {
        queues.push({
          fn: () => cb.call(pointer, ...args),
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
        if (!lock) actuator();
      })
    }
  }
}



module.exports.forkChild = forkChild;
module.exports.datetime = datetime;
module.exports.awaitAll = awaitAll;
module.exports.list2map = list2map;
module.exports.listObj2list = listObj2list;
module.exports.synclock = mutex();