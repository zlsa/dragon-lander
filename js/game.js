
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

      this.init_scenarios();

      this.reset();
    },

    init_scenarios: function() {
      this.scenarios = {
        'f9-hoverslam-1-engine': {
          name: 'Falcon 9 Hoverslam (1 engine)',
          vehicles: [
            
            {
              type: 'falcon-9',
              engines: 1,
              position: [0, 2000],
              speed: null
            }
            
          ]
        },
        'f9-hoverslam-3-engine': {
          name: 'Falcon 9 Hoverslam (3 engine)',
          vehicles: [
            
            {
              type: 'falcon-9',
              engines: 3,
              position: [0, 2000],
              speed: null
            }
            
          ]
        }
      };

      var scope = this;

      for(var i in this.scenarios) {
        var s = this.scenarios[i];
        var el = $('<li>');
        
        el.text(s.name);
        
        el.attr('data-scenario', i);
        el.click(function() {
          scope.switch_scenario.call(scope, $(this).attr('data-scenario'));
        });
        
        $('#scenarios ul').append(el);
      }

      this.switch_scenario('f9-hoverslam-1-engine');
    },

    switch_scenario: function(s) {
      this.scenario = this.scenarios[s];

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

      for(i=0; i<this.scenario.vehicles.length; i++) {
        var v = this.scenario.vehicles[i];

        var vehicle = null;
        
        if(v.type == 'falcon-9')
          vehicle = new Falcon9Vehicle(this, new HoverslamAutopilotInput(this));
        
        vehicle.reset({
          position: v.position,
          angle: v.angle || 0,
          speed: v.speed || null,
          engines: v.engines || 1
        });
        
        this.add_vehicle(vehicle);
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
