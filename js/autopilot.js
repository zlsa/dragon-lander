
var AutopilotInput = Input.extend(function(base) {
  return {

    init: function(game, vehicle) {
      this.vehicle = vehicle;

      this.value = 'foo';

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

var HoverAutopilotInput = AutopilotInput.extend(function(base) {
  return {

    init: function() {
      base.init.apply(this, arguments);
    },

    reset: function() {
      base.reset.call(this);

      this.new_pid('altitude', 0.5, 0.1, 0.01, 20);
      this.new_pid('vspeed', 0.5, 0.1, 0, 0.5);
      
      this.new_pid('range', 0.3, 0.01, 0, 1);
      this.new_pid('hspeed', 0.2, 0.03, 0, radians(10));
      var limit = radians(40);
      this.pids.hspeed.limits = [-limit, limit];
      
      this.new_pid('angle', 4, 0.2, 0.1, radians(5));
      limit = radians(40);
      this.pids.angle.limits = [-limit, limit];
      this.new_pid('gimbal', 0.6, 0.2);
      
      this.target = {
        altitude: 50,
        range: -1000
      };

      this.add_state('preidle');
      this.add_state('liftoff');
      this.add_state('hover');
      this.add_state('translate');
      this.add_state('descend');
      this.add_state('landing');
      this.add_state('shutdown');

      if(this.vehicle) {
        this.target.altitude = lerp(0, this.vehicle.extra, 5, 10, 20);
        this.target.range = this.vehicle.extra * 12;
      }
      
    },

    tick: function(elapsed) {
      var target_altitude = 0;
      var target_range = this.vehicle.get_range();
      var target_hspeed = 0;
      
      if(this.between_states_i('liftoff', 'translate')) {
        target_altitude = this.target.altitude;
      }

      if(this.is_state('translate')) {
        target_range = this.target.range;
      }
      
      this.pids.altitude.set_measure(this.vehicle.get_altitude());
      this.pids.altitude.set_target(target_altitude);
      
      this.pids.vspeed.set_measure(this.vehicle.get_velocity()[1]);
      this.pids.vspeed.set_target(this.pids.altitude.get());

      if(this.is_state('landing')) {
        this.pids.vspeed.set_target(clerp(10, this.vehicle.get_altitude(), 2, -5, 0));
      }
      
      this.pids.range.set_measure(this.vehicle.get_range());
      this.pids.range.set_target(target_range);
      
      this.pids.hspeed.set_measure(this.vehicle.get_velocity()[0]);
      this.pids.hspeed.set_target(this.pids.range.get());
      
      if(this.between_states_i('descend', 'landing')) {
        this.pids.hspeed.set_target(0);
      }
      
      this.pids.angle.set_measure(-this.vehicle.body.angle);
      this.pids.angle.set_target(this.pids.hspeed.get());
      
      this.pids.gimbal.set_measure(-this.vehicle.body.angularVelocity);
      this.pids.gimbal.set_target(this.pids.angle.get());
      
      base.tick.apply(this, arguments);

      if(this.vehicle.time > 0.1 && this.is_state('preidle')) {
        this.next_state();
      }
      
      if(this.vehicle.get_altitude() > 2 && this.is_state('liftoff')) {
        this.next_state();
      }
      
      if(this.vehicle.get_altitude() > this.target.altitude && this.is_state('hover')) {
        this.next_state();
      }
      
      if(Math.abs(this.vehicle.get_range() - this.target.range) < 1.5 && 
         Math.abs(this.vehicle.get_speed()) < 0.8 &&
         this.is_state('translate')) {
        this.next_state();
      }
      
      if(this.vehicle.get_altitude() < 10 && this.is_state('descend')) {
        this.next_state();
      }
      
      if(this.vehicle.get_altitude() < 2.25 && this.is_state('landing')) {
        this.next_state();
      }
      
      if(this.between_states_i('liftoff', 'landing')) {
        this.throttle = clamp(0, this.pids.vspeed.get(), 0.5);
        this.gimbal = this.pids.gimbal.get();
      } else {
        this.throttle = 0;
        this.gimbal = 0;
      }

      this.value = this.states[this.state];
    }

  };
});

var HoverslamAutopilotInput = AutopilotInput.extend(function(base) {
  return {

    reset: function() {
      base.reset.call(this);

      this.new_pid('vspeed', 0.15, 0.03, 0, 0.5);
      this.pids.vspeed.limits = [0, 1];
      
      this.new_pid('hoverslam', 0.1, 0.3);
      this.pids.hoverslam.limits = [0, 1];
      
      this.new_pid('hspeed', 0.4);
      var limit = radians(20);
      this.pids.hspeed.limits = [-limit, limit];
      
      this.new_pid('angle', 1, 0.05, 0.05, radians(15));
      limit = radians(20);
      this.pids.angle.limits = [-limit, limit];
      
      this.new_pid('gimbal', 0.05, 0.1);
      this.pids.gimbal.limits = [-1, 1];
      
      this.add_state('coast');
      this.add_state('hoverslam');
      this.add_state('landing');
      this.add_state('shutdown');

      this.hover = {
        altitude: 0,
      };

      if(this.vehicle.vehicle_type == 'crew-dragon') 
        this.hover.altitude = 100;
      else if(this.vehicle.vehicle_type == 'red-dragon')
        this.hover.altitude = 50;

      this.hoverslam = {
        altitude: 0,
        distance: 1,
        time: 0
      };
      
    },

    calc_hoverslam: function() {
      var twr = (this.vehicle.get_twr(true) || 1000) * 0.9;

      if(this.vehicle.vehicle_type == 'crew-dragon') twr = Math.min(2.5, twr); // don't want to smush the delicate people

      if(this.vehicle.get_velocity()[1] > 0) return;

      var vspeed = this.vehicle.get_velocity()[1] || 100;
      var alt = -this.hover.altitude * 0.2;

      var step = 0.01;
      
      this.hoverslam.time = 0;

      var dragf;
      
      var i=0;
      while(vspeed < 0) {
        vspeed += ((twr - 1) * 9.81) * step;
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
      var landing_vspeed = lerp(rest_altitude + 1, altitude, rest_altitude, lerp(1, twr - 1, 5, -0.5, -0.7), 0.1);
      altitude -= rest_altitude;

      this.calc_hoverslam();
        
      this.pids.vspeed.set_measure(this.vehicle.get_velocity()[1]);
      this.pids.vspeed.set_target(landing_vspeed);
      
      if(this.is_state('landing')) {
        this.throttle = this.pids.vspeed.get();
      } else if(this.is_state('hoverslam')) {
      
        this.pids.hoverslam.set_measure(-clerp(0, this.vehicle.get_speed(), 1000, 0, 30));
        
        var factor = 1;
        factor *= clerp(0, Math.abs(this.hoverslam.altitude), 500, 0.7, 0.2);
        
        this.pids.hoverslam.set_target(-this.hoverslam.distance * factor);
        
        this.throttle = this.pids.hoverslam.get();
      }

      var vel = this.vehicle.get_velocity();
      var retrograde = Math.atan2(-vel[0], -vel[1]);
      
      this.pids.hspeed.set_measure(this.vehicle.get_velocity()[0]);
      this.pids.hspeed.set_target(0);

      this.pids.angle.set_measure(-this.vehicle.body.angle);

      this.pids.angle.set_target(clerp(0.1, this.hoverslam.time, 0.2, 0, retrograde));

      this.pids.gimbal.set_measure(-this.vehicle.body.angularVelocity);
      
      var ang_vel_fac = 1;
      // if(this.vehicle.vehicle_type == 'crew-dragon') ang_vel_fac *= 50;
      // if(this.vehicle.vehicle_type == 'red-dragon') ang_vel_fac *= 50;

      ang_vel_fac *= clerp(0, distance_2d(this.vehicle.get_velocity()), 300, 1, 15);
      
      this.pids.gimbal.set_target(this.pids.angle.get() * ang_vel_fac);

      if(this.is_state('coast')) {
        this.pids.vspeed.ignore = true;
        this.pids.hoverslam.ignore = true;
      } else {
        this.pids.vspeed.ignore = false;
        this.pids.hoverslam.ignore = false;
      }
      
      base.tick.apply(this, arguments);

      this.gimbal = this.pids.gimbal.get();
      
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

      if((altitude < 0.01 || this.vehicle.get_velocity()[1] > -0.5) && this.is_state('landing')) {
        this.next_state();
      }

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

      if(this.hoverslam.time < this.vehicle.gear.duration * 1.2 && !this.gear && !this.is_state('coast')) {
        this.gear = true;
      }
      
      this.value = distance_str(this.hoverslam.distance);

      var time_until_start = this.hoverslam.distance/this.vehicle.get_speed();

      if(!this.is_state('coast'))
        time_until_start = this.hoverslam.time;
      
      this.value = time_str(time_until_start, true) + ' (' + distance_str(this.hoverslam.distance) + ')';
    }

  };
});


