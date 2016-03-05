
var game;
var last_tick = 0;
var fps = 20;

$(document).ready(function() {
  init();
});

function init() {
  game = new Game();

  $(window).resize(resize);

  resize();
}

function resize() {
  var size = [
    $(window).width(),
    $(window).height()
  ];
  
  game.fire('resize', size);
}

function done() {
  game.fire('done', null);

  setTimeout(function() {
    tick();
  }, 0);
  
}

function tick() {
  var now = time();
  var elapsed = 0;
  
  if(last_tick != 0)
    elapsed = now - last_tick;
  
  elapsed = clamp(0, elapsed, 0.03);
  
  game.tick(elapsed);

  requestAnimationFrame(tick);

  elapsed = clamp(0.001, elapsed);
  var current_fps = 1 / elapsed;
  fps += (current_fps - fps) / (0.2 / elapsed);

  last_tick = now;
}
