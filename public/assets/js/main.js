/* global PIXI, socketCluster */
'use strict';

(function(){

  var config = {
    display: {
      height: window.innerHeight,
      width:  window.innerWidth,
    },
    grid: {
      interval: 100,
      sideLength: 2000,
    },
    headingStep: Math.PI / 175,
  };

  var player = {
    speed: 7,
    heading: 0,
    position: {x: 0, y: 0}
  };

  var MOVES = {
    UP:     0,
    DOWN:   1,
    LEFT:   2,
    RIGHT:  3,
  };

  var keys = {
    left:  {code: 37, pressed: false},
    right: {code: 39, pressed: false},
    up:    {code: 38, pressed: false},
    down:  {code: 40, pressed: false},

    space: {code: 32, pressed: false},
  };

  function keyboard(keyCode) {
    var key = {};
    key.code = keyCode;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;

    //The `downHandler`
    key.downHandler = function(event) {
      if (event.keyCode === key.code) {
        if (key.isUp && key.press) { key.press(); }
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };

    //The `upHandler`
    key.upHandler = function(event) {
      if (event.keyCode === key.code) {
        if (key.isDown && key.release) { key.release(); }
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };

    //Attach event listeners
    window.addEventListener('keydown', key.downHandler.bind(key), false);
    window.addEventListener('keyup', key.upHandler.bind(key), false);
    return key;
  }

  // Initiate the connection to the server
  var socket = socketCluster.connect();
  socket.on('error', function (err) {
    throw 'Socket error - ' + err;
  });

  // Movement
  socket.on('position', function(data) { console.log(data); });
  keyboard(keys.left.code).press =   function() { keys.left.pressed = true; };
  keyboard(keys.left.code).release = function() { keys.left.pressed = false; };
  keyboard(keys.right.code).press =   function() { keys.right.pressed = true; };
  keyboard(keys.right.code).release = function() { keys.right.pressed = false; };

  keyboard(keys.up.code).press =   function() { player.speed *= 1.5; };
  keyboard(keys.up.code).release = function() { player.speed /= 1.5; };

  // Pew
  keyboard(keys.space.code).press = function() {
    var pew = new PIXI.Text('pew', {fill: '#F7EDCA'});
    pew.x = Math.random() * config.display.width;
    pew.y = Math.random() * config.display.height;
    topContainer.addChild(pew);
    setTimeout(function(){ topContainer.removeChild(pew); }, 1000);
  };

  var renderer = PIXI.autoDetectRenderer(config.display.width, config.display.height);
  document.body.appendChild(renderer.view);

  PIXI.loader
    .add('assets/sprites/ship/on.png')
    .load(onAssetsLoaded);

  var ship, grid, lowerGrid;
  var stage = new PIXI.Container(),
      foreground = new PIXI.Container(),
      background = new PIXI.Container(),
      topContainer = new PIXI.Container();

  function onAssetsLoaded() {
    drawGrid();
    addSprites();
    animate();
  }

  function centerStageOnPlayer() {
    foreground.position.x = player.position.x + (config.display.width / 2);
    foreground.position.y = player.position.y + (config.display.height / 2);
  }

  function addSprites() {
    ship = new PIXI.Sprite.fromImage('assets/sprites/ship/on.png');
    ship.scale.x = ship.scale.y = 0.6;
    ship.position.x = player.position.x - (ship.width  / 2);
    ship.position.y = player.position.y - (ship.height / 2);
    ship.anchor.x = 0.5;
    ship.anchor.y = 0.5;

    foreground.addChild(ship);
    centerStageOnPlayer();
    animate();
  }

  function drawGrid() {
    var _grid = config.grid;

    grid =      new PIXI.Graphics();
    lowerGrid = new PIXI.Graphics();

    grid.lineStyle(1, 0xffffff, 1);
    lowerGrid.lineStyle(1, 0x0000ff, 1);

    var start = -1 * _grid.sideLength,
        end = _grid.sideLength;

    // Draw the top grid
    for (var i = start, interval = _grid.interval; i <= end; i += interval) {
      grid.moveTo(i, start);
      grid.lineTo(i, end);

      grid.moveTo(start, i);
      grid.lineTo(end, i);
    }

    start *= 2;
    end *= 2;

    // Draw the lower grid
    for (i = start, interval /= 2; i <= end; i += interval) {
      lowerGrid.moveTo(i, start);
      lowerGrid.lineTo(i, end);

      lowerGrid.moveTo(start, i);
      lowerGrid.lineTo(end, i);
    }

    background.addChild(lowerGrid);
    foreground.addChild(grid);

    stage.addChild(background);
    stage.addChild(foreground);

    topContainer.addChild(stage);
  }

  function moveComponents() {
    // Calculate x and y change
    var deltaX = player.speed * Math.sin(player.heading),
        deltaY = player.speed * Math.cos(player.heading);

    if (keys.left.pressed)  { player.heading -= config.headingStep; }
    if (keys.right.pressed) { player.heading += config.headingStep; }

    ship.rotation = player.heading;

    // Move the player (and sprite)
    player.position.x += deltaX;
    player.position.y -= deltaY;
    ship.position.x += deltaX;
    ship.position.y -= deltaY;

    // Follow the player
    foreground.position.x -= deltaX;
    foreground.position.y += deltaY;

    // Move the grid back some go create the parallax illusionc
    background.position.x -= 0.1 * deltaX;
    background.position.y += 0.1 * deltaY;
  }

  function animate() {
    moveComponents();
    renderer.render(topContainer);
    requestAnimationFrame(animate);
  }

})();

