/**
 * Created by Administrator on 2019/11/4.
 */

let Promise = require('./promise')
//let p = new Promise((resolve, reject) => {
//  reject(1000)
//})
//
//let p1 = p.then((data) => {
//  console.log(data)
//  return data
//}).then((data) => {
//  console.log(data)
//}).catch((e) => {
//  console.log(e)
//  console.log('catch')
//}).finally(() => {
//  console.log('finally')
//})

let t = setTimeout(() => {
  return 1000
}, 1000)

Promise.all([1, 2, 3, t, 4]).then(res => {
  console.log(res)
})
