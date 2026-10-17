'use strict';

// 导入http模块
var http = require('http');
var server = http.createServer((Request, Response) => {
  console.log(Request.method, ': ', Request.url);
  Response.writeHead(200, {'Content-Type': 'text/html'});
  Response.end('<h1>hello world! </h1>')
})

server.listen(8080);

console.log('server is running at http://127.0.0.1:8080');