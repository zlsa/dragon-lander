
var K = {
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SHIFT: 16,
  CONTROL: 17
};

var Input = Events.extend(function(base) {
  return {

    init: function(game, position) {
      this.game = game;

      this.throttle = 0;
      this.gimbal = 0;

      this.gear = null;

      base.init.apply(this, arguments);
    },

    apply_vehicle: function(vehicle) {
      
      if(this.gear == null) {
        this.gear = vehicle.gear_get();
      }
      
      vehicle.gear_set(this.gear);
      vehicle.set_throttle(this.throttle);
      vehicle.set_gimbal(this.gimbal);
    }

  };
});

var UserInput = Input.extend(function(base) {
  return {

    init: function(game, position) {
      base.init.apply(this, arguments);

      this.keys = {};

      this.autopilot = false;

      this.reset = false;

      $(window).keydown(with_scope(this, this.keydown));
      $(window).keyup(with_scope(this, this.keyup));
    },

    apply_vehicle: function(vehicle) {
      base.apply_vehicle.apply(this, arguments);
      
      vehicle.set_gimbal(this.gimbal * 0.1);
    },

    keydown: function(e) {
      if(!(e.which in this.keys)) this.keys[e.which] = 0;
      this.keys[e.which] += 1;
    },

    keyup: function(e) {
      this.keys[e.which] = 0;
    },

    get_key: function(k) {
      if(typeof k == typeof 0) k = [k];

      for(var i=0; i<k.length; i++) {
        if(!(k[i] in this.keys)) continue;
        if(this.keys[k[i]]) return this.keys[k[i]];
      }
      
      return false;
    },

    tick: function(elapsed) {
      var throttle = [0.8, 1.2];
      var gimbal = 0.3;

      if(this.get_key(K.G) == 1) {
        this.gear = !this.gear;
      }
         
      if(this.get_key(K.R) == 1) {
        this.reset = true;
      }

      if(this.get_key(K.A) == 1) {
        this.autopilot = !this.autopilot;
      }

      if(this.get_key([K.UP, K.SHIFT])) {
        this.throttle += elapsed * (1 / throttle[0]);
      } else if(this.get_key([K.DOWN, K.CONTROL])) {
        this.throttle -= elapsed * (1 / throttle[1]);
      }

      if(this.get_key(K.LEFT)) {
        this.gimbal -= elapsed * (1 / gimbal);
      } else if(this.get_key(K.RIGHT)) {
        this.gimbal += elapsed * (1 / gimbal);
      } else {
        this.gimbal *= clerp(0, elapsed, 1, 1, 0) * 0.3;
      }

      if(this.get_key(K.X)) {
        this.throttle = 0;
      }
        
      if(this.get_key(K.Z)) {
        this.throttle = 1;
      }
        
      this.throttle = clamp(0, this.throttle, 1);
      this.gimbal = clamp(-1, this.gimbal, 1);
      
      for(var i in this.keys) {
        if(this.keys[i])
          this.keys[i] += 1;
      }

      if(this.reset) {
        this.game.reset();
        this.reset = false;

        this.throttle = 0;
        this.gimbal = 0;
        this.gear = null;
      }
      
    }

  };
});

