
function time() {
  return Date.now() * 0.001;
}

function clamp(a, n, b) {
  if(!b) b = Infinity;
  if(a > b) {
    var temp = a;
    a = b;
    b = temp;
  }
  if(n < a) return a;
  if(n > b) return b;
  return n;
}

function radians(deg) {
  return deg * Math.PI / 180;
}

function degrees(rad) {
  return rad / Math.PI * 180;
}

function lerp(il, i, ih, ol, oh) {
  return ol + (oh - ol) * (i - il) / (ih - il);
}

function clerp(il, i, ih, ol, oh) {
  return clamp(ol,  lerp(il, i, ih, ol, oh), oh);
}

function distance_2d(d) {
  return Math.sqrt(Math.pow(d[0], 2) + Math.pow(d[1], 2));
}

function elapsed(now, start) {
  return (now - start);
}

function with_scope(context, func) {
  return function() {
    if(func)
      func.apply(context, arguments);
  };
}

function log_array(a) {
  console.log(a.join(' '));
}

function count_object(obj) {
  var c = 0;
  for(var p in obj) c++;
  return c;
}

function get_object(obj, key, def) {
  if(key in obj) return obj[key];
  return def;
}

function create_canvas(w, h) {
  if(h == 0) h = w;
  var c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function rnd(n) {
  return Math.round(n);
}

function draw_image_centered(cc, img, size, scale) {
  if(typeof scale == 'undefined') scale = 1;
  if(typeof size == typeof 1) size = [size, size];

  cc.drawImage(img, -(size[0] * 0.5), -(size[1] * 0.5), size[0] / scale, size[1] / scale);
}

function draw_image(cc, img, size, scale) {
  if(typeof scale == 'undefined') scale = 1;
  if(typeof size == typeof 1) size = [size, size];

  cc.drawImage(img, 0, 0, size[0] / scale, size[1] / scale);
}

function canvas_clear(cc, size) {
  if(typeof size == typeof 1) size = [size, size];
  cc.clearRect(0, 0, size[0], size[1]);
}

var BLACK = 'rgb(64, 64, 64)';
