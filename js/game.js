
var Game = Events.extend(function(base) {
  return {
    
    init: function() {
      base.init.apply(this, arguments);
      
      this.time = 0;
      
      this.time_scale = 1;

      this.loader = new Loader(this);

      this.scene = new Scene(this);

      this.vehicles = [];

      this.input = new UserInput(this);

      this.target = 0;

      this.target = Math.floor(this.vehicles.length/2);

      this.bind('resize', with_scope(this, this.resize));
      
      this.loader.bind('finished', done);

      this.reset();
    },

    add_vehicle: function(v) {
      this.vehicles.push(v);
      
      this.scene.add_vehicle(v);
    },

    get_time: function() {
      return this.time;
    },

    get_loader: function() {
      return this.loader;
    },

    switch_target: function(offset) {
      this.target -= offset || 1;
      this.target = clamp(0, this.target, this.vehicles.length-1);
    },

    get_target: function() {
      return this.vehicles[this.target];
    },

    reset: function() {
      for(var i=0; i<this.vehicles.length; i++) {
        this.vehicles[i].destroy();
      }
      
      this.vehicles = [];
      
      for(i=0; i<1; i++) {
        
        v = new Falcon9Vehicle(this, new HoverslamAutopilotInput(this));
        
        v.reset({
          position: [i * 50, 1500],
          angle: radians(10),
          speed: null
        });
        
        this.add_vehicle(v);
      }

      this.target = Math.floor(this.vehicles.length/2);
    },

    physics_substep: function(elapsed) {
      
      for(var i=0; i<this.vehicles.length; i++) {
        
        if(i == this.target && !this.input.autopilot)
          this.vehicles[i].input = this.input;
        else
          this.vehicles[i].input = this.vehicles[i].autopilot;
        
        this.vehicles[i].pre_physics(elapsed);
      }
      
      this.scene.world.tick(elapsed);
      
      for(i=0; i<this.vehicles.length; i++) {
        this.vehicles[i].post_physics(elapsed);
      }
      
    },

    tick: function(elapsed) {
      if(this.get_target() && this.get_target().get_speed() > 1) {
//        this.time_scale = clerp(0.1, this.get_target().get_throttle(), 0.2, 1, 0.2);
      } else {
        this.time_scale = 1;
      }
      elapsed = elapsed * this.time_scale;
      this.time += elapsed;

      this.input.tick(elapsed);

      if(elapsed) {
        var substeps = Math.ceil(3 * this.time_scale);
        substeps = 1;

        for(var i=0; i<substeps; i++)
          this.physics_substep(elapsed / substeps);
      }

      this.scene.renderer.clear();

      for(j=0; j<this.vehicles.length; j++) {
        this.vehicles[j].draw(this.scene);
      }
      
      this.scene.renderer.draw_hud();
      
    }

  };
});
