/**
 * Created by Administrator on 2019/11/4.
 */

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

let resolvePromise = function(promise2, x, resolve, reject) {
  // 判断x的类型 来处理promise2是成功还是失败
  if (promise2 == x) { //这里应该报一个类型错误，来解决问题4
    return reject(new TypeError('循环引用了'))
  }
  // 断上一次then返回的是普通值还是函数
  if (typeof x === 'function' || (typeof x === 'object' && x !== null)) {
    let called; // 表示是否调用过成功或者失败，
    try {
      let then = x.then;
      if (typeof then === 'function') {
        then.call(x, y => {
          if (called) return; //如果调用过就return掉
          called = true;
          resolvePromise(promise2, y, resolve, reject);
        }, r => {
          if (called) return; //如果调用过就return掉
          called = true;
          reject(r)
        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) return; //如果调用过就return掉
      called = true;
      reject(e)
    }
  } else {
    resolve(x)
  }

}

class Promise {
  constructor(executor) {
    this.status = PENDING;      // 默认等待态
    this.value = undefined;     // 为什么成功
    this.reason = undefined;    // 为什么失败
    this.resolveCallbacks = []; // 当then是pending 我希望吧成功的方法都放到数组中
    this.rejectCallbacks = [];

    let resolve = (value) => {
      // 如果是promise就调用这个promise的then方法
      if (value instanceof Promise) {
        // 不停的解析 等待着解析出一个常量 传递给下面
        return value.then(resolve, reject);
      }
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        this.resolveCallbacks.forEach(fn => fn())
      }
    }

    let reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.rejectCallbacks.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }


  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val;
    onRejected = typeof onRejected === 'function' ? onRejected : r => {
        throw r
      }
    let promise2;
    promise2 = new Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e)
          }
        }, 0)
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e)
          }
        }, 0)
      }

      if (this.status === PENDING) {
        this.resolveCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
        this.rejectCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e)
            }
          }, 0)
        })
      }
    })
    return promise2;
  }

  catch(reject) {
    return this.then(null, reject)
  }

  // 无论成功或者失败都会进入，跟状态没有关系
  finally() {
    let P = this.constructor;
    return this.then(
      value => P.resolve(callback()).then(() => value),
      reason => P.resolve(callback()).then(() => {
        throw reason
      })
    );
  }
}


Promise.all = function(promises) {
  return new Promise((resolve, reject) => {
    let arr = [];
    let i = 0;

    function processData(index, y) {
      arr[index] = y;
      if (++i === promises.length) {
        resolve(arr)
      }
    }

    for (let i = 0; i < promises.length; i++) {
      let promise = promises[i];
      if (typeof promise === 'function' || (typeof promise === 'object' && promise !== null)) {
        if (typeof promise.then === 'function') {
          promise.then(y => {
            processData(i, y); // 递归调用
          }, reject)
        } else {
          processData(i, promise);
        }
      } else {
        processData(i, promise);
      }
    }
  })
}

Promise.race = function(values) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < values.length; i++) {
      let current = values[i];
      if ((typeof current === 'object' && current !== null) || typeof current == 'function') {
        let then = current.then;
        if (typeof then == 'function') { // 比较哪个promise比较快，谁快用快
          then.call(current, resolve, reject)
        } else {
          resolve(current);
        }
      } else {
        resolve(current);
      }
    }
  });
}

Promise.resolve = function(value) {
  return new Promise((resolve) => {
    resolve(value);
  })
}

Promise.reject = function(reason) {
  return new Promise((resolve, reject) => {
    reject(reason);
  })
}

Promise.deferred = function() {
  let dfd = {};
  dfd.promise = new Promise(function(resolve, reject) {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });
  return dfd
}

module.exports = Promise