
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

      var num = 1;
      for(var i=0; i<num; i++) {
        var v = new CrewDragonVehicle(this, new LandingAutopilotInput(this));
        v.extra = i;
        v.move_to([i * 10, 1000]);
        this.add_vehicle(v);
      }

      this.target = Math.floor(this.vehicles.length/2);

      this.bind('resize', with_scope(this, this.resize));
      
      this.loader.bind('finished', done);
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
        this.vehicles[i].reset();
        this.vehicles[i].move_to([i * 10, 500]);
      }
      this.target = Math.floor(this.vehicles.length/2);
    },

    tick: function(elapsed) {
      elapsed = elapsed * this.time_scale;
      this.time += elapsed;

      this.input.tick(elapsed);

      if(elapsed) {
        var substeps = Math.ceil(3 * this.time_scale);

        for(var i=0; i<substeps; i++) {

          var el = elapsed / substeps;
          
          for(var j=0; j<this.vehicles.length; j++) {
            if(j == this.target && !this.input.autopilot)
              this.vehicles[j].input = this.input;
            else
              this.vehicles[j].input = null;
            this.vehicles[j].pre_physics(el);
          }
          
          this.scene.world.tick(el);
          
          for(j=0; j<this.vehicles.length; j++) {
            this.vehicles[j].post_physics(el);
          }
          
        }
      }

      this.scene.renderer.clear();

      for(j=0; j<this.vehicles.length; j++) {
        this.vehicles[j].draw(this.scene);
      }
      
      this.scene.renderer.draw_hud();
    }

  };
});
