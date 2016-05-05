
var World = Events.extend(function(base) {
  return {
    
    init: function(scene) {
      this.scene = scene;

      this.gravity = this.gravity || 9.81;

      this.world = new p2.World({
        gravity: [0, -this.gravity],
        broadphase: new p2.SAPBroadphase()
      });

      this.world.solver.iterations = 300;

      this.init_ground();

      this.world.setGlobalStiffness(1e15);
      this.world.setGlobalRelaxation(30);

      this.material = new p2.Material();
      
      base.init.apply(this, arguments);
    },

    get_altitude: function(x) {
      return 0;
    },

    get_pressure: function(pos) {
      return 0;
    },

    get_sky_color: function(pos) {
      return [0, 0, 0];
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
      v.add_to_world(this);
    },

    tick: function(elapsed) {
      this.world.step(elapsed);
    }
    
  };
});

var Earth = World.extend(function(base) {
  return {
    
    init: function(scene) {
      this.name = 'earth';
      
      this.gravity = 9.81;

      base.init.apply(this, arguments);
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
    }

  };
});

var Mars = World.extend(function(base) {
  return {
    
    init: function(scene) {
      this.name = 'mars';
      
      this.gravity = 3.7;

      base.init.apply(this, arguments);
    },

    get_pressure: function(pos) {
      var scale_height = 11000;
      var sea_level_pressure = 0.02;

      return Math.pow(sea_level_pressure, -(pos[1] / scale_height)) * sea_level_pressure;
    },

    get_sky_color: function(pos) {
      var p = clerp(0, pos[1], 30000, 1, 0);
      
      return [
        clerp(0, p, 1, 0, 255),
        clerp(0, p, 1, 0, 230),
        clerp(0, p, 1, 0, 210)
      ];
    }

  };
});

var Moon = World.extend(function(base) {
  return {
    
    init: function(scene) {
      this.name = 'moon';
      
      this.gravity = 1.62;

      base.init.apply(this, arguments);
    },

    get_pressure: function(pos) {
      return 0;
    },

  };
});

