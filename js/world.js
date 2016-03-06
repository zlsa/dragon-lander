
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

      this.world.setGlobalStiffness(1000000000);
      this.world.setGlobalRelaxation(5);
      
      base.init.apply(this, arguments);
    },

    get_altitude: function(x) {
      return 0;
    },

    get_pressure: function(pos) {
      var scale_height = 7000;
      var sea_level_pressure = 1.22;

      return Math.pow(sea_level_pressure, -(pos[1] / scale_height)) * 1.22;
    },

    get_sky_color: function(pos) {
      var p = this.get_pressure(pos) / 1.22;
      
      return [
        clerp(0.5, p, 1, 0, 230),
        clerp(0, p, 1, 0, 240),
        clerp(0, p, 1, 0, 255)
      ];
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
