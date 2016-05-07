
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
              autopilot: 'hop',
              position: [0, 0]
            }
            
          ]
        },
        
        'f9-landed-1-engine': {
          name: 'Falcon 9 (1 engine)',
          vehicles: [
            
            {
              type: 'falcon-9',
              autopilot: 'hop',
              fuel: 40000,
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
              autopilot: 'hop',
              position: [0, 3000],
              angle: radians(-5)
            }
            
          ]
        },
        
        /*
        'red-dragon-entry': {
          name: 'Red Dragon entry',
          planet: 'mars',
          vehicles: [
            
            {
              type: 'red-dragon',
              position: [0, 15000],
              angle: radians(-82),
              speed: -7000
            }
            
          ]
        },
        */
       
        'red-dragon-hoverslam': {
          name: 'Red Dragon Hoverslam',
          planet: 'mars',
          vehicles: [
            
            {
              type: 'red-dragon',
              autopilot: 'hop',
              position: [0, 3000],
              angle: radians(-60)
            }
            
          ]
        },
       
        'f9-hoverslam-1-engine': {
          name: 'Falcon 9 Hoverslam (1 engine)',
          vehicles: [
            
            {
              type: 'falcon-9',
              fuel: 6000,
              engines: 1,
              autopilot: 'f9-hoverslam',
              position: [0, 6000],
              angle: radians(-20)
            }
            
          ]
        },
        
        'f9-hoverslam-3-engine': {
          name: 'Falcon 9 Hoverslam (3 engine)',
          vehicles: [
            
            {
              type: 'falcon-9',
              engines: 3,
              autopilot: 'f9-hoverslam',
              position: [0, 2000],
              angle: radians(-5)
            }
            
          ]
        },
        
        'f9-hoverslam-5-engine': {
          name: 'Falcon 9 Hoverslam (5 engine)',
          vehicles: [
            
            {
              type: 'falcon-9',
              engines: 5,
              autopilot: 'f9-hoverslam',
              position: [0, 2000],
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
      
      if(location.hash) {
        scenario = location.hash.substr(1);
      }
      
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
      if(!(s in this.scenarios)) s = 'crew-dragon-hoverslam';
      
      location.hash = '#' + s;
      
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
      
      // this.time_scale = 1;
      
      for(var i=0; i<this.vehicles.length; i++) {
        this.vehicles[i].destroy();
      }
      
      this.vehicles = [];

      this.scene.set_planet(this.scenario.planet);

      for(i=0; i<this.scenario.vehicles.length; i++) {
        var v = this.scenario.vehicles[i];

        var vehicle = null;
        var autopilot;

        if(v.autopilot == 'f9-hoverslam')
          autopilot = new Falcon9HoverslamAutopilotInput(this);
        else
          autopilot = new HopAutopilotInput(this);
        
        if(v.type == 'falcon-9')
          vehicle = new Falcon9Vehicle(this, autopilot);
        else if(v.type == 'crew-dragon')
          vehicle = new CrewDragonVehicle(this, autopilot);
        else if(v.type == 'red-dragon')
          vehicle = new RedDragonVehicle(this, autopilot);
        
        vehicle.reset({
          position: v.position,
          angle: v.angle || 0,
          speed: v.speed || null,
          fuel: v.fuel || 0,
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
