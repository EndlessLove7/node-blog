'use strict';
var foo = (params) => {
  console.log('这是从引用模块传递过来的参数：' + params);
  process.nextTick(() => {
    console.log('nextTick callBack!');
  })
  console.log('nextTick was set');
  process.on('exit',(code) => {
    console.log('about to exit with code:' + code);
  })
}
module.exports = foo;
