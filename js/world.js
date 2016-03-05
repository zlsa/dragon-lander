
var World = Events.extend(function(base) {
  return {
    
    init: function(scene) {
      this.scene = scene;

      this.gravity = 9.81;

      this.world = new p2.World({
        gravity: [0, -this.gravity],
        broadphase: new p2.SAPBroadphase()
      });

      this.init_ground();
      
      base.init.apply(this, arguments);
    },

    get_altitude: function(x) {
      return -5;
    },

    init_ground: function() {
      this.ground = new p2.Body({
        position: [0, this.get_altitude(0)]
      });

      this.ground.addShape(new p2.Plane({

      }));

      this.world.addBody(this.ground);
    },

    add_vehicle: function(v) {
      this.world.addBody(v.body);
    },

    tick: function(elapsed) {
      this.world.step(elapsed);
    }
    
  };
});
