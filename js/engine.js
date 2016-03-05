
// engines have two inputs:
// set_throttle(<0..1>)
// set_gimbal(<-1..1>)
// ... and one output:
// get_force() [[x, y], [x, y]]

var Engine = Events.extend(function(base) {
  return {

    init: function(game, position) {
      this.game = game;

      this.position = this.position || position || [0, 0];
      this.throttle = 0;
      this.gimbal = 0;

      base.init.apply(this, arguments);
    },

    set_gimbal: function(gimbal) {
      this.gimbal = clamp(-1, gimbal, 1);
    },

    set_throttle: function(throttle) {
      this.throttle = clamp(0, throttle, 1);
    },

    get_force: function() {
      return [[0, this.throttle * this.performance.thrust], this.position];
    }

  };
});

var SuperDracoPod = Engine.extend(function(base) {
  return {

    init: function(game, position) {
      base.init.apply(this, arguments);

      this.performance = {
        thrust: 68170 * 2,
        isp: 240
      };
    }

  };
});

var CrewDragonEngine = Engine.extend(function(base) {
  return {

    init: function(vehicle) {
      base.init.apply(this, arguments);

      this.pods = [
        new SuperDracoPod(vehicle, [-1.5, 0]),
        new SuperDracoPod(vehicle, [1.5, 0])
      ];
      
    },

    update_pods: function() {
      var throttle = [0, 0];

      throttle[0] = this.throttle;
      throttle[1] = this.throttle;

      throttle[0] += this.gimbal;
      throttle[1] -= this.gimbal;
      
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
    }
    
  };
});
