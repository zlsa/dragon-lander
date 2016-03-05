
var AutopilotInput = Input.extend(function(base) {
  return {

    init: function(game, vehicle) {
      this.vehicle = vehicle;

      this.value = 0;
      
      this.reset();
      base.init.apply(this, arguments);
    },

    new_pid: function(name, p, i, d, max) {
      var pid = new Controller(p, i, d, max);
      this.pids[name] = pid;
    },

    reset: function() {
      this.pids = {};
      
      this.target = {
        altitude: 10
      };
      
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

      this.new_pid('altitude', 0.4, 0.1, 0.1, 20);
      this.new_pid('vspeed', 0.6, 0.5, 0, 0.5);
      
      this.new_pid('range', 0.3, 0.3, 0, 1);
      this.new_pid('hspeed', 0.3, 0.0, 0, radians(20));
      
      this.new_pid('angle', 0.7, 0.6, 0.3, radians(5));
      limit = radians(60);
      this.pids.angle.limits = [-limit, limit];
      this.new_pid('gimbal', 0.6, 0.4);
      
      this.target = {
        altitude: 100,
        range: 50
      };
    },

    tick: function(elapsed) {
      this.pids.altitude.set_measure(this.vehicle.get_altitude());
      this.pids.altitude.set_target(this.target.altitude);
      
      this.pids.vspeed.set_measure(this.vehicle.get_velocity()[1]);
      this.pids.vspeed.set_target(this.pids.altitude.get());

      this.pids.range.set_measure(this.vehicle.get_position()[0]);
      this.pids.range.set_target(this.target.range);
      
      this.pids.hspeed.set_measure(this.vehicle.get_velocity()[0]);
      this.pids.hspeed.set_target(this.pids.range.get());
      
      this.pids.angle.set_measure(-this.vehicle.body.angle);
      this.pids.angle.set_target(this.pids.hspeed.get());
      
      this.pids.gimbal.set_measure(-this.vehicle.body.angularVelocity);
      this.pids.gimbal.set_target(this.pids.angle.get());
      
      base.tick.apply(this, arguments);

      if(Math.abs(this.vehicle.get_position()[0] - this.target.range) < 0.5) this.target.altitude = 2.2;
      
      this.throttle = clamp(0, this.pids.vspeed.get(), 0.5);
      this.gimbal = this.pids.gimbal.get();

      this.value = degrees(this.vehicle.body.angle);
    }

  };
});

