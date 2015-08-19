'use strict';

var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');

var MOVES = {
  UP:     0,
  DOWN:   1,
  LEFT:   2,
  RIGHT:  3,
};

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid);

  var app = express();
  app.use(serveStatic(path.resolve(__dirname, 'public')));

  var httpServer = worker.httpServer;
  httpServer.on('request', app);

  var scServer = worker.scServer;
  scServer.on('connection', initSocket);
};

var players = {};
function initSocket(socket) {
  console.log('Player connected!');

  var player = initPlayer();
  players[socket.id] = player;

  socket.emit('position', player.position);
  socket.on('move', function(data) {
    if (data === MOVES.UP) {
      console.log('up');
    } else if (data === MOVES.DOWN) {
      console.log('down');
    } else if (data === MOVES.LEFT) {
      console.log('left');
    } else if (data === MOVES.RIGHT) {
      console.log('right');
    }
  });
}

function initPlayer() {
  return {position: {x: 0, y: 0}};
}