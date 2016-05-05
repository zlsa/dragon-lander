
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
        'crew-dragon-landed': {
          name: 'Crew Dragon',
          vehicles: [
            
            {
              type: 'crew-dragon',
              position: [0, 0]
            }
            
          ]
        },
        
        'f9-landed-1-engine': {
          name: 'Falcon 9 (1 engine)',
          vehicles: [
            
            {
              type: 'falcon-9',
              engines: 1,
              position: [0, 0]
            }
            
          ]
        },

        'crew-dragon-hoverslam': {
          name: 'Crew Dragon Hoverslam',
          vehicles: [
            
            {
              type: 'crew-dragon',
              position: [0, 1000],
              angle: radians(-20)
            }
            
          ]
        },
       
        'crew-dragon-sightseeing': {
          name: 'Crew Dragon Sightseeing',
          vehicles: [
            
            {
              type: 'crew-dragon',
              position: [0, 1000],
              angle: radians(60)
            }
            
          ]
        },
       
        'f9-hoverslam-1-engine': {
          name: 'Falcon 9 Hoverslam (1 engine)',
          vehicles: [
            
            {
              type: 'falcon-9',
              engines: 1,
              position: [0, 2000],
              speed: null,
              angle: radians(-5)
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
              speed: null,
              angle: radians(-5)
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

      var scenario = this.restore('scenario', 'crew-dragon-hoverslam');
      
      this.switch_scenario(scenario);
    },

    save: function(key, value) {
      localStorage['dragon-lander-' + key] = JSON.stringify(value);
    },

    restore: function(key, def) {
      key = 'dragon-lander-' + key;
      if(!(key in localStorage)) return def;
      return JSON.parse(localStorage[key]);
    },

    switch_scenario: function(s) {
      if(!(s in this.scenarios)) return;
      
      this.scenario = this.scenarios[s];

      this.save('scenario', s);

      $('[data-scenario]').removeClass('active');
      $('[data-scenario=' + s + ']').addClass('active');
      
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
      
      this.time_scale = 1;
      
      for(var i=0; i<this.vehicles.length; i++) {
        this.vehicles[i].destroy();
      }
      
      this.vehicles = [];

      for(i=0; i<this.scenario.vehicles.length; i++) {
        var v = this.scenario.vehicles[i];

        var vehicle = null;
        
        if(v.type == 'falcon-9')
          vehicle = new Falcon9Vehicle(this, new HoverslamAutopilotInput(this));
        else if(v.type == 'crew-dragon')
          vehicle = new CrewDragonVehicle(this, new HoverslamAutopilotInput(this));
        
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
        
        if(i == this.target && !this.input.autopilot) {
          if(this.vehicles[i].input != this.input)
            this.vehicles[i].autopilot.reset();
          this.vehicles[i].input = this.input;
        } else {
          this.vehicles[i].input = this.vehicles[i].autopilot;
        }
        
        this.vehicles[i].pre_physics(elapsed);
      }
      
      this.scene.world.tick(elapsed);
      
      for(i=0; i<this.vehicles.length; i++) {
        this.vehicles[i].post_physics(elapsed);
      }
      
    },

    tick: function(elapsed) {
      elapsed = elapsed * this.time_scale;
      this.time += elapsed;

      this.input.tick(elapsed);

      if(elapsed) {
        var substeps = clamp(2, Math.ceil(3 * this.time_scale), 20);

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
