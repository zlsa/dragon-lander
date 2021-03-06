
function clamp(a, n, b) {
  if(typeof b == 'undefined') b = Infinity;
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

function time_difference(now, start) {
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
  var ma = Math.abs(m);
  if(ma < 12) {
    return rnd(m * 1000) + 'cm';
  } else if(ma < 1200) {
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

var Controller = function(k_p, k_i, k_d, i_max) {
  if (typeof k_p === 'object') {
    var options = k_p;
    k_p = options.k_p;
    k_i = options.k_i;
    k_d = options.k_d;
    i_max = options.i_max;
  }

  // PID constants
  this.k_p = (typeof k_p === 'number') ? k_p : 1;
  this.k_i = k_i || 0;
  this.k_d = k_d || 0;

  // Maximum absolute value of sumError
  this.i_max = i_max || 0;

  this.sumError  = 0;
  this.lastError = 0;
  this.lastTime  = 0;

  this.ignore = false;

  this.limits = [-Infinity, Infinity];

  this.target    = 0; // default value, can be modified with .setTarget
  this.currentValue = 0;
  this.output = 0;
};

Controller.prototype.set_target = function(target) {
  this.target = target;
};

Controller.prototype.set_measure = function(currentValue) {
  this.currentValue = currentValue;
};

Controller.prototype.get = function() {
  return this.output;
};

Controller.prototype.update = function(dt) {
  if(this.ignore) return this.output;

  var error = (this.target - this.currentValue);
  this.sumError = this.sumError + error*dt;
  if (this.i_max > 0 && Math.abs(this.sumError) > this.i_max) {
    var sumSign = (this.sumError > 0) ? 1 : -1;
    this.sumError = sumSign * this.i_max;
  }

  var dError = (error - this.lastError)/dt;
  this.lastError = error;

  this.output = (this.k_p*error) + (this.k_i * this.sumError) + (this.k_d * dError);
  this.output = clamp(this.limits[0], this.output, this.limits[1]);
  return this.output;
};

Controller.prototype.reset = function() {
  this.sumError  = 0;
  this.lastError = 0;
  this.lastTime  = 0;
};

function lpad(num, size) {
  var s = '000000000' + num;
  return s.substr(s.length-size);
}

function time_str(t, show_ms) {
  var seconds = Math.floor(t % 60);
  var minutes = Math.floor(t / 60);
  var ms      = Math.floor(t * 1000);
  if(show_ms)
    return lpad(minutes, 2) + ':' + lpad(seconds, 2) + '.' + lpad(ms, 3);
  return lpad(minutes, 2) + ':' + lpad(seconds, 2);
}
