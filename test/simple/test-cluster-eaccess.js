// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


var common = require('../common');
var assert = require('assert');
var cluster = require('cluster');
var path = require('path');
var fs = require('fs');
var net = require('net');

var socketPath = common.PIPE;
if (process.platform === 'win32') {
  // for windows pipes are handled specially and we can't write to
  // common.PIPE with fs.writeFileSync like we can on other platforms
  socketPath = path.join(common.fixturesDir, 'socket-path');
}

if (cluster.isMaster) {
  var worker = cluster.fork();
  var gotError = 0;
  worker.on('message', function(err) {
    gotError++;
    console.log(err);
    if (process.platform === 'win32')
      assert.strictEqual('EACCES', err.code);
    else
      assert.strictEqual('EADDRINUSE', err.code);
    worker.disconnect();
  });
  process.on('exit', function() {
    console.log('master exited');
    try {
      fs.unlinkSync(socketPath);
    } catch (e) {
    }
    assert.equal(gotError, 1);
  });
} else {
  fs.writeFileSync(socketPath, 'some contents');

  var server = net.createServer().listen(socketPath, function() {
    console.log('here');
  });

  server.on('error', function(err) {
    process.send(err);
  });
}
