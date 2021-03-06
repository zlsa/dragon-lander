
var AutopilotInput = Input.extend(function(base) {
  return {

    init: function(game, vehicle) {
      this.vehicle = vehicle;

      this.value = 'DEAD';

      setTimeout(with_scope(this, this.reset), 0);
      
      base.init.apply(this, arguments);
    },

    new_pid: function(name, p, i, d, max) {
      var pid = new Controller(p, i, d, max);
      this.pids[name] = pid;
    },

    reset: function() {
      this.pids = {};
      
      this.states = [];
      this.state = 0;
      
      this.target = {
        altitude: 10
      };

      this.state_time = this.vehicle.game.get_time();

      base.reset.apply(this, arguments);
    },

    state_elapsed: function() {
      return this.vehicle.game.get_time() - this.state_time;
    },

    has_state: function(s) {
      return this.states.indexOf(s) >= 0;
    },
    
    get_state: function(s) {
      return this.states.indexOf(s);
    },

    between_states: function(a, b) {
      if(this.get_state(a) < this.state && this.state < this.get_state(b)) return true;
      return false;
    },
    
    between_states_i: function(a, b) {
      if(this.get_state(a) <= this.state && this.state <= this.get_state(b)) return true;
      return false;
    },

    is_state: function(s) {
      return this.state == this.get_state(s);
    },
    
    add_state: function(s) {
      if(this.has_state(s)) {
        console.log('already have state ' + s);
        return;
      }
      this.states.push(s);
    },

    next_state: function() {
      this.state_time = this.vehicle.game.get_time();
      this.state += 1;
    },

    tick: function(elapsed) {
      for(var i in this.pids) {
        this.pids[i].update(elapsed);
      }
    }

  };
});

var HopAutopilotInput = AutopilotInput.extend(function(base) {
  return {

    init: function() {
      base.init.apply(this, arguments);
    },

    reset: function() {
      base.reset.call(this);
      
      this.add_state('coast');
    },

    tick: function(elapsed) {
      this.throttle = 0;
      this.gimbal = 0;
    }

  };
});

var Falcon9HoverslamAutopilotInput = AutopilotInput.extend(function(base) {
  return {

    reset: function() {
      base.reset.call(this);

      this.new_pid('vspeed', 0.15, 0.03, 0, 0.5);
      this.pids.vspeed.limits = [0, 1];
      
      this.new_pid('hoverslam', 0.4, 0.1, 0.5);
      this.pids.hoverslam.limits = [0, 1];

      this.new_pid('hspeed', 1 / 90, 0, 1 / 8000);
      var limit = radians(15);
      this.pids.hspeed.limits = [-limit, limit];
      
      this.new_pid('angle', 0.5, 0.01, 0.05, radians(30));
      limit = radians(20);
      this.pids.angle.limits = [-limit, limit];
      
      this.new_pid('gimbal', 3, 0.02);
      this.pids.gimbal.limits = [-1, 1];
      
      this.add_state('coast');
      this.add_state('hoverslam');
      this.add_state('landing');
      this.add_state('shutdown');

      this.hover = {
        altitude: 0,
        engine_single: 1.5
      };

      this.hoverslam = {
        altitude: 0,
        distance: 1,
        time: 0
      };
      
    },

    calc_hoverslam: function() {
      var twr = (this.vehicle.get_twr(true, this.vehicle.engines[0].get_thrust(true)) || 1000);

      if(this.vehicle.get_velocity()[1] > 0) return;

      var vspeed = this.vehicle.get_velocity()[1] || 0;
      var alt = -this.hover.altitude * 0.3;

      var step = 0.01;
      
      this.hoverslam.time = 0;

      var dragf;
      
      var i=0, t;
      while(vspeed < 0) {
        t = twr;
        
        if(this.hoverslam.time > this.hover.engine_single && this.vehicle.engine_number >= 1) t = twr * this.vehicle.engine_number;
        
        t *= 0.9;
        
        vspeed += ((t - 1) * 9.81) * step;
        
        // dragf = this.vehicle.get_drag(0, [0, vspeed]);
        // vspeed += dragf / this.vehicle.get_mass();
        
        alt += vspeed * step;
        this.hoverslam.time += step;
        if(++i > 10000)
          break;
      }

      var v = this.vehicle.get_velocity();
      var angle = Math.atan2(-v[0], -v[1]);
      alt *= 1 + Math.abs(Math.sin(angle));

      this.hoverslam.distance = this.vehicle.get_altitude() - this.vehicle.get_rest_altitude() + alt;
      this.hoverslam.altitude = -alt;

      this.hoverslam.twr = twr;
      
    },

    tick: function(elapsed) {
      var altitude = this.vehicle.get_altitude();
      var rest_altitude = this.vehicle.get_rest_altitude();
      var twr = this.vehicle.get_twr(true);
      var landing_vspeed = lerp(rest_altitude + 1, altitude, rest_altitude, lerp(1, twr - 1, 5, -0.5, -0.51), 0.1);
      altitude -= rest_altitude;

      var throttle = 0;

      this.calc_hoverslam();
        
      this.pids.vspeed.set_measure(this.vehicle.get_velocity()[1]);
      this.pids.vspeed.set_target(landing_vspeed);
      
      if(this.is_state('landing')) {
        throttle = this.pids.vspeed.get();
      } else if(this.is_state('hoverslam')) {
      
        this.pids.hoverslam.set_measure(-clerp(0, this.vehicle.get_speed(), 1000, 0, 30));
        
        var factor = 1;
        factor *= clerp(0, Math.abs(this.hoverslam.altitude), 500, 0.7, 0.2);
        
        this.pids.hoverslam.set_target(-this.hoverslam.distance * factor);
        
        throttle = this.pids.hoverslam.get();
      }

      var vel = this.vehicle.get_velocity();
      var retrograde = Math.atan2(-vel[0], -vel[1]);
      
      this.pids.hspeed.set_measure(this.vehicle.get_velocity()[0]);
      this.pids.hspeed.set_target(0);

      var hspeed = this.pids.hspeed.get();

      this.pids.angle.set_measure(0);

      angle_target = clerp(3000, altitude, 5000, hspeed, retrograde)
      angle_target = hspeed;
      
      this.pids.angle.set_target(angle_between(angle_target, -this.vehicle.body.angle));
      
      this.pids.gimbal.set_measure(-this.vehicle.body.angularVelocity);

      var en = clerp(1, this.vehicle.engine_number, 9, 1, 0.1);
      
      this.pids.gimbal.set_target(this.pids.angle.get() * clerp(0, altitude, 300, 2, 1) / en);
      
      if(this.is_state('coast')) {
        this.pids.vspeed.ignore = true;
        this.pids.hoverslam.ignore = true;
      } else {
        this.pids.vspeed.ignore = false;
        this.pids.hoverslam.ignore = false;
      }
      
      base.tick.apply(this, arguments);

      this.gimbal = this.pids.gimbal.get();

      this.fin_gimbal = this.gimbal * 50;
      
      //if(this.throttle == 0)
        //this.fin_gimbal *= -1;
      
      if(this.hoverslam.distance < 10 && this.is_state('coast') && (this.vehicle.get_velocity()[1] < 0)) {
        this.next_state();
        console.log('landing time: ' + rnd(this.hoverslam.time, 2));
      }
      
      if(altitude < this.hover.altitude + 1 && this.is_state('hoverslam')) {
        this.next_state();
      }

      if(this.vehicle.get_velocity()[1] > -1 && this.is_state('hoverslam')) {
        this.next_state();
      }

      if(this.vehicle.engine_number >= 1 && this.hoverslam.time < this.hover.engine_single && this.is_state('hoverslam')) {
        this.vehicle.engine_number = 1;
      }

      if((altitude < 0.01 || this.vehicle.get_velocity()[1] > -0.5) && this.is_state('landing')) {
        this.next_state();
      }

      this.throttle += (throttle - this.throttle) / (0.5 / elapsed);

      if(this.is_state('coast')) {
        this.throttle = 0;
      }

      if(this.is_state('hoverslam') || this.is_state('landing')) {
        this.throttle = Math.max(0.01, this.throttle);
      }

      if(this.is_state('shutdown')) {
        this.gimbal = 0;
        this.throttle = 0;
      }

      if(this.is_state('shutdown') && this.state_elapsed() > 1) {
        this.fin_gimbal = 0;
      }

      if(this.hoverslam.time < this.vehicle.gear.duration * 1.2 && !this.gear && !this.is_state('coast')) {
        this.gear = true;
      }

      if(this.is_state('shutdown') && this.state_elapsed() > 2) {
        this.fins = false;
      } else {
        this.fins = true;
      }
      
      var time_until_start = this.hoverslam.distance/this.vehicle.get_speed();

      if(!this.is_state('coast'))
        time_until_start = this.hoverslam.time;
      
      this.value = time_str(time_until_start, true) + ' (' + distance_str(this.hoverslam.distance) + ')';
      
      // this.value = this.gimbal.toFixed(2);
      
      var time_scale = clerp(0, this.vehicle.get_altitude(), 15000, 1, 15);

      if(altitude < 100) time_scale = 1;
      
      // this.game.time_scale = Math.pow(2, Math.round(time_scale));

    }

  };
});


