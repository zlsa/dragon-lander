
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

function slerp(il,i,ih,ol,oh) {
  return lerp(-1,Math.sin(lerp(il,i,ih,-Math.PI/2,Math.PI/2)),1,ol,oh);
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

function rnd(n, p) {
  if(p) {
    return n.toFixed(p);
  }
  return Math.round(n);
}

function draw_image_centered(cc, img, size, scale) {
  if(typeof scale == 'undefined') scale = 1;
  if(typeof size == typeof 1) size = [size, size];

  cc.drawImage(img, -(size[0] * 0.5), -(size[1] * 0.5), size[0] * scale, size[1] * scale);
}

function draw_image(cc, img, size, scale, f) {
  if(typeof scale == 'undefined') scale = 1;
  if(typeof size == typeof 1) size = [size, size];

  cc.drawImage(img, 0, 0, size[0] * scale, size[1] * scale);
}

function canvas_clear(cc, size, f) {
  if(typeof size == typeof 1) size = [size, size];
  cc.clearRect(0, 0, size[0] * f, size[1] * f);
}

var BLACK = 'rgb(64, 64, 64)';

function distance_str(m) {
  if(m < 12) {
    return rnd(m * 1000) + 'cm';
  } else if(m < 1200) {
    return rnd(m) + 'm';
  } else {
    return rnd(m * 0.001, 2) + 'km';
  }
}

function angle_between(a, b) {
  return ((a - b) + Math.PI) % (Math.PI * 2) - Math.PI;
}


var Animation=function(options) {
  this.value=0;
  this.start_value=0;
  this.end_value=0;
  this.progress=0;
  this.easing="smooth";
  this.duration=1;
  this.start=0;
  this.animating=false;
  
  if(options) {
    if("value" in options) this.value=options.value;
    if("start_value" in options) this.start_value=options.start_value;
    if("end_value" in options) this.end_value=options.end_value;
    if("easing" in options) this.easing=options.easing;
    if("duration" in options) this.duration=options.duration;
  }
  
  this.set=function(value, time) {
    if(!time) this.set_now(value);
    else this.animate(value, time);
  };
  
  this.set_now = function(value) {
    this.start_value = value;
    this.value = value;
    this.end_value = value;
    this.start = -100;
    this.animating = false;
  };
  
  this.animate=function(value, time) {
    if(this.end_value == value) return;
    this.animating=true;
    this.progress=0;
    this.start=time;
    this.start_value=this.value+0;
    this.end_value=value;
  };
  this.ease=function() {
    if(this.easing == "linear")
      this.value=clerp(0,this.progress,1,this.start_value,this.end_value);
    else if(this.easing == "smooth")
      this.value=slerp(0,this.progress,1,this.start_value,this.end_value);
    else
      console.log("Unknown easing '"+this.easing+"'");
  };
  this.get=function(time) {
    this.progress=0;
    if(this.animating)
      this.progress=clerp(this.start,time,this.start+this.duration,0,1);
    this.ease();
    return this.value;
  };
  this.get();
};
