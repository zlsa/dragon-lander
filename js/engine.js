
// engines have two inputs:
// set_throttle(<0..1>)
// set_gimbal(<-1..1>)
// ... and one output:
// get_force() [[x, y], [x, y]]

var Engine = Events.extend(function(base) {
  return {

    init: function(vehicle, tank, position) {
      this.vehicle = vehicle;

      this.position = this.position || position || [0, 0];

      this.tank = tank;
      
      this.throttle_command = 0;
      this.gimbal_command = 0;

      this.throttle = 0;
      this.gimbal = 0;

      base.init.apply(this, arguments);
    },

    set_gimbal: function(gimbal) {
      this.gimbal_command = clamp(-1, gimbal, 1);
    },

    set_throttle: function(throttle) {
      this.throttle_command = clamp(0, throttle, 1);
    },

    get_force: function() {
      return [[0, this.get_thrust()], this.position];
    },

    get_thrust: function() {
      return this.throttle * this.performance.thrust;
    },

    get_max_thrust: function() {
      return this.performance.thrust;
    },

    get_fuel_flow: function() {
      return this.get_thrust() / (9.81 * this.performance.isp) * 2;
    },

    tick: function(elapsed) {
      this.throttle += (this.throttle_command - this.throttle) / (this.performance.throttle_response / elapsed);
      
      if(this.tank.is_empty()) this.throttle = 0;
      
      this.tank.add_fuel_flow(-this.get_fuel_flow());
    }

  };
});

var SuperDracoPod = Engine.extend(function(base) {
  return {

    init: function() {
      base.init.apply(this, arguments);

      this.performance = {
        thrust: 68170 * 4,
        isp: 240,
        throttle_response: 0.01
      };
    }

  };
});

var CrewDragonEngine = Engine.extend(function(base) {
  return {

    init: function(vehicle, tank) {
      base.init.apply(this, arguments);

      this.pods = [
        new SuperDracoPod(vehicle, tank, [-1.5, 0]),
        new SuperDracoPod(vehicle, tank, [1.5, 0])
      ];
      
    },

    update_pods: function() {
      var throttle = [0, 0];

      throttle[0] = this.throttle_command;
      throttle[1] = this.throttle_command;

      throttle[0] += this.gimbal_command;
      throttle[1] -= this.gimbal_command;
      
      this.pods[0].set_throttle(throttle[0]);
      this.pods[1].set_throttle(throttle[1]);
    },
    
    set_gimbal: function(gimbal) {
      base.set_gimbal.apply(this, arguments);
      this.update_pods();
    },

    set_throttle: function(throttle) {
      base.set_throttle.apply(this, arguments);
      this.update_pods();
    },

    get_forces: function() {
      return [this.pods[0].get_force(), this.pods[1].get_force()];
    },
    
    get_thrust: function() {
      return this.pods[0].get_thrust() + this.pods[1].get_thrust();
    },

    get_max_thrust: function() {
      return this.pods[0].get_max_thrust() + this.pods[1].get_max_thrust();
    },

    tick: function(elapsed) {
      this.pods[0].tick(elapsed);
      this.pods[1].tick(elapsed);
    }

  };
});
