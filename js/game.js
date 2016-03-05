
var Game = Events.extend(function(base) {
  return {
    
    init: function() {
      base.init.apply(this, arguments);
      
      this.time = 0;
      
      this.time_scale = 1;

      this.loader = new Loader(this);

      this.scene = new Scene(this);

      this.vehicle = new CrewDragonVehicle(this);
      this.scene.add_vehicle(this.vehicle);

      this.input = new UserInput(this);
      this.autopilot = new HoverAutopilotInput(this, this.vehicle);

      this.bind('resize', with_scope(this, this.resize));
      
      this.loader.bind('finished', done);
    },

    get_time: function() {
      return this.time;
    },

    get_loader: function() {
      return this.loader;
    },

    get_target: function() {
      return this.vehicle;
    },

    reset: function() {
      this.vehicle.reset();
      this.autopilot.reset();
    },

    tick: function(elapsed) {
      elapsed = elapsed * this.time_scale;
      this.time += elapsed;

      this.input.tick(elapsed);
      
      if(!this.input.autopilot) {
        this.input.apply_vehicle(this.vehicle);
      }

      var substeps = 2 * this.time_scale;

      for(var i=0; i<substeps; i++) {

        var el = elapsed / substeps;
        
        if(this.input.autopilot) {
          this.autopilot.tick(el);
          this.autopilot.apply_vehicle(this.vehicle);
        }
        
        this.vehicle.pre_physics(el);
        this.scene.world.tick(el);
        this.vehicle.post_physics(el);
      }

      this.scene.renderer.clear();

      this.vehicle.draw(this.scene);
      
      this.scene.renderer.draw_hud();
    }

  };
});
