
var Vehicle = Events.extend(function(base) {
  return {

    init: function(game, autopilot) {
      this.game = game;

      this.scene = game.scene;
      
      this.autopilot = autopilot;

      if(autopilot) autopilot.vehicle = this;

      this.image_size = this.image_size || [128, 128];
      this.image_center = this.image_center || [64, 64];
      this.image_factor = this.game.scene.renderer.zoom * 2;
      
      this.time = 0;

      this.canvas = create_canvas(this.image_size[0] * this.image_factor, this.image_size[1] * this.image_factor);
      this.context = this.canvas.getContext('2d');

      this.acceleration = [0, 0];
      this.peak_acceleration = [0, 0];

      this.init_images();
      
      this.init_body();
      this.init_shapes();

      this.throttle = 0;
      this.gimbal = 0;

      this.velocity = [0, 0];
      this.last_velocity = [0, 0];

      this.track = [];
      
      this.last_track = 0;

      this.gear = new Animation({
        duration: 1
      });

      this.gear_deploy();
      
      base.init.apply(this, arguments);

      this.reset();
    },

    add_to_world: function(world) {
      world.world.addBody(this.body);
    },

    destroy: function() {
      delete this.autopilot;
      this.game.scene.world.world.removeBody(this.body);
    },

    reset: function(options) {
      if(!options) options = {};
      
      this.time = 0;

      var position = get_object(options, 'position', [0, 0]);
      
      this.body.position[0] = position[0];
      this.body.position[1] = Math.max(this.get_rest_altitude() + 0.001, position[1]);

      var angle = get_object(options, 'angle', 0);
      var speed = get_object(options, 'speed', null);
      
      if(speed == null) {
        if(position[1] != 0)
          speed = -this.get_terminal_velocity(position[1]);
        else
          speed = 0;
      }

      this.body.velocity[0] = Math.sin(angle) * speed;
      this.body.velocity[1] = Math.cos(angle) * speed;

      this.body.angle = -angle;
      this.body.angularVelocity = 0;

      this.peak_acceleration = [0, 0];

      this.tank.reset(get_object(options, 'fuel', null));
      
      this.track = [];
      
      this.last_track = 0;

      if(this.autopilot)
        this.autopilot.reset();

      var gear = false;
      if(speed > -10 || position[1] < 100) gear = true;
      
      this.gear_set(get_object(options, 'gear', gear));
    },

    get_twr: function(max) {
      var thrust = this.get_thrust(max);
      return thrust / this.get_mass() / 9.81;
    },
    
    init_body: function() {
      this.material = new p2.Material();
      
      var altitude = 0;
      
      this.body = new p2.Body({
        mass: this.mass,
        damping: 0.0
      });
      
      this.scene.world.world.addContactMaterial(new p2.ContactMaterial(this.material, this.scene.world.material, {
        friction: 1,
        restitution: 0,
        stiffness: 10e5
      }));
      
    },

    get_terminal_velocity: function(altitude) {
      var terminal_velocity = Math.sqrt(
        (2 * this.get_mass() * this.scene.world.gravity) /
        (this.scene.world.get_pressure([0, altitude]) * this.aero.area * this.aero.cd.bottom)
      );
      if(terminal_velocity > 10000) return 10000;
      return terminal_velocity;
    },

    get_thrust: function(max) {
      return this.engine.get_thrust(max);
    },

    get_mass: function() {
      return this.body.mass;
    },

    get_throttle: function() {
      if(this.input)
        return this.input.throttle;
      return 0;
    },

    get_position: function() {
      return this.body.position;
    },

    get_range: function() {
      return this.get_position()[0];
    },

    get_altitude: function() {
      return this.get_position()[1];
    },

    get_velocity: function() {
      return [this.body.velocity[0], this.body.velocity[1]];
    },

    get_acceleration: function() {
      return this.acceleration;
    },
    
    get_peak_acceleration: function() {
      return this.peak_acceleration;
    },

    get_speed: function() {
      return distance_2d(this.get_velocity());
    },

    set_gimbal: function(gimbal) {
      this.gimbal = clamp(-1, gimbal, 1);
    },

    set_throttle: function(throttle) {
      this.throttle = clamp(0, throttle, 1);
    },

    init_images: function(images) {
      var loader = this.game.get_loader();
      var i, url;
      
      this.images = {};

      for(i=0; i<images.length; i++) {
        url = 'images/' + this.vehicle_type + '/' + images[i] + '.png';
        this.images[images[i]] = loader.get_file(url, ImageFile);
      }
      
    },

    gear_get: function() {
      if(this.gear.value == 0) return false;
      return true;
    },
    
    gear_set: function(state) {
      if(state) state = 1;
      else state = 0;

      this.gear.set(state, this.time);
    },

    gear_toggle: function() {
      this.gear_set(!this.gear.end_value);
    },
    
    gear_deploy: function() {
      this.gear_set(1);
    },
    
    gear_retract: function() {
      this.gear_set(0);
    },

    get_drag: function(angle, velocity) {
      if(density < 0.001) return 0;
      
      var density = this.scene.world.get_pressure(this.get_position());
      var dynf = (density * 0.5) * Math.pow(distance_2d(velocity), 2);

      var v_rot = Math.atan2(velocity[0], velocity[1]);
      var v_vec = angle_between(v_rot, angle);

      this.v_vec = v_vec;

      var area = this.aero.area;

      var leg_cd = this.aero.cd.legs || 0;
      leg_cd *= this.gear.get(this.time);
      var cd = clerp(0, Math.abs(v_vec), Math.PI, this.aero.cd.top, this.aero.cd.bottom + leg_cd);
      cd = clerp(0, Math.PI * 0.5 + Math.abs(v_vec), Math.PI * 0.5, this.aero.cd.side, cd);

      return dynf * area * cd;
    },
    
    update_drag: function(elapsed) {
      var drag_s = this.get_drag(-this.body.angle, this.get_velocity());

      if(drag_s == 0) return;

      var leg_cop = this.aero.leg_cop;
      leg_cop *= this.gear.get(this.time);

      var cop = this.aero.cop + leg_cop;

      this.drag = drag_s * elapsed;

      var drag = [
        this.drag * -this.get_velocity()[0],
        this.drag * -this.get_velocity()[1]
      ];
      
      this.body.applyForce(drag, [
        cop * -Math.sin(this.body.angle),
        cop * Math.cos(this.body.angle),
      ]);
      
      this.body.angularDamping = clerp(0, Math.abs(this.body.angularVelocity), radians(60), 0.1, 1);
    },
    
    pre_physics: function(elapsed) {

      this.update_drag(elapsed);

      this.last_velocity = [this.body.velocity[0], this.body.velocity[1]];
      
      if(this.autopilot == this.input) {
        this.autopilot.tick(elapsed);
      }
      
      this.input.apply_vehicle(this);
      
      this.body.mass = this.mass + this.tank.get_mass();
      this.body.updateMassProperties();

    },

    post_physics: function(elapsed) {
      this.velocity = [this.body.velocity[0], this.body.velocity[1]];

      var acceleration = [
        (this.last_velocity[0] - this.velocity[0]) / elapsed,
        (this.last_velocity[1] - this.velocity[1]) / elapsed - this.scene.world.gravity
      ];

      if(this.get_speed() < 0.04) acceleration = [0, -this.scene.world.gravity];

      var damp = 0.1;
      
      this.acceleration[0] += (acceleration[0] - this.acceleration[0]) / (damp / elapsed);
      this.acceleration[1] += (acceleration[1] - this.acceleration[1]) / (damp / elapsed);
      
      if(distance_2d(this.acceleration) > distance_2d(this.peak_acceleration) && this.time > 1) {
        this.peak_acceleration = [this.acceleration[0], this.acceleration[1]];
      }

      if(time_difference(this.time, this.last_track) > 0) {
        var p = this.get_position();

        var ltd = 10000;
        
        if(this.track.length) {
          ltd = distance_2d([
            this.track[this.track.length-1][0] - p[0],
            this.track[this.track.length-1][1] - p[1]
          ]);
        }

        if(ltd > 0.2) {
          this.track.push([
            p[0],
            p[1]
          ]);
          this.last_track = this.time;
        }
      }
    }
  };
});

var CrewDragonVehicle = Vehicle.extend(function(base) {
  return {

    init: function() {
      this.vehicle_type = 'crew-dragon';

      this.image_size = [128, 256];

      this.image_center = [64, 61];
      
      this.mass = 7200;

      this.aero = {
        area: 11,
        cop: 2,
        leg_cop: 0,
        cd: {
          top: 0.8,
          side: 100,
          bottom: 0.8,
          leg: 0
        }
      };

      this.tank = new CrewDragonFuelTank(this);
      this.engine = new CrewDragonEngine(this, this.tank);
      
      base.init.apply(this, arguments);
    },

    get_rest_altitude: function() {
      return 2.25;
    },

    init_shapes: function() {
      var vertices = [
        [0, 2.4],
        [-0.5, 2.3],
        [-1, 1.7],
        [-1.7, 0.1],
        [-2.0, -1.3],
        [-1.3, -1.6],
        [-1.2, -2.5],
        [ 1.2, -2.5],
        [ 1.3, -1.6],
        [ 2.0, -1.3],
        [ 1.7, 0.1],
        [ 1, 1.7],
        [ 0.5, 2.3],
      ];
      
      this.body.fromPolygon(vertices);

      for(var i=0; i<this.body.shapes.length; i++) {
        this.body.shapes[i].material = this.material;
      }
      
    },

    init_images: function() {
      base.init_images.call(this, [
        'capsule',
        'landing-legs',
        'flame',
        'flame-diamonds'
      ]);
    },

    draw_track: function(scene) {
      if(this.game.get_target() != this) return;
      var r = scene.renderer;
      var cc = scene.renderer.context;
      
      cc.beginPath();
      
      for(var i=0; i<this.track.length; i++) {
        var p = [
          r.m_to_px(this.track[i][0]),
          -r.m_to_px(this.track[i][1]),
        ];

        if(i == 0)
          cc.moveTo(p[0], p[1]);
        else
          cc.lineTo(p[0], p[1]);
      }

      cc.strokeStyle = '#fff';
      cc.lineWidth = 4;
      cc.stroke();
      
      cc.strokeStyle = 'rgba(0, 128, 128, 0.5)';
      cc.lineWidth = 2;
      cc.stroke();
    },
    
    draw: function(scene) {
      var r = scene.renderer;
      var rcc = scene.renderer.context;

      this.draw_track(scene);

      rcc.save();

      rcc.translate(
        r.m_to_px(this.body.position[0]),
        r.m_to_px(-this.body.position[1])
      );

      this.draw_vehicle(r);
      
      rcc.rotate(-this.body.angle);
      rcc.translate(-this.image_center[0], -this.image_center[1]);
      
      draw_image(rcc, this.canvas, this.image_size);

      rcc.restore();
    },

    ////////////////////////

    draw_vehicle: function(r) {
      var cc = this.context;
      canvas_clear(cc, this.image_size, this.image_factor);

      cc.save();
      
      this.draw_capsule();

      this.draw_flames();
      
      cc.restore();
    },

    draw_capsule: function() {
      var gear_offset = clerp(0, this.gear.get(this.time), 1, -6, 0);
      
      this.context.translate(0, gear_offset);
      draw_image(this.context, this.images['landing-legs'].data, this.image_size, this.image_factor);
      this.context.translate(0, -gear_offset);
      draw_image(this.context, this.images['capsule'].data, this.image_size, this.image_factor);
    },
    
    draw_flames: function() {
      var cc = this.context;
      this.draw_flame(this.engine.pods[0].throttle);
      cc.scale(-1, 1);
      cc.translate(-this.image_size[0] * this.image_factor, 0);
      this.draw_flame(this.engine.pods[1].throttle);
    },

    draw_flame: function(throttle) {
      this.context.globalAlpha = throttle;
      
      this.context.globalCompositeOperation = 'lighter';
      
      draw_image(this.context, this.images['flame'].data, this.image_size, this.image_factor);
      draw_image(this.context, this.images['flame-diamonds'].data, this.image_size, this.image_factor);
    },

    ////////////////////////

    pre_physics: function(elapsed) {
      this.time += elapsed;
      
      var forces = this.engine.get_forces();

      this.engine.set_throttle(this.throttle);
      this.engine.set_gimbal(this.gimbal);
      this.engine.tick(elapsed);

      this.tank.tick(elapsed);

      for(var i=0; i<forces.length; i++) {
        var ef = forces[i];
        window.f = ef;
        this.body.applyForceLocal(ef[0], ef[1]);
      }

      base.pre_physics.apply(this, arguments);
    },

    post_physics: function() {
      base.post_physics.apply(this, arguments);
    }

  };
});

var RedDragonVehicle = CrewDragonVehicle.extend(function(base) {
  return {

    init: function() {
      base.init.apply(this, arguments);
      
      this.vehicle_type = 'red-dragon';

      this.mass = 6500;
    },

  };
});

var Falcon9Vehicle = Vehicle.extend(function(base) {
  return {

    init: function() {
      this.vehicle_type = 'falcon-9';

      this.image_size = [128, 1024];

      this.image_center = [64, 200];
      
      this.mass = 24000;

      this.aero = {
        area: 11,
        cop: 30,
        leg_cop: -50,
        cd: {
          top: 0.8,
          side: 2,
          bottom: 0.4,
          leg: 0.5
        }
      };

      this.tank = new Falcon9FuelTank(this);
      this.engines = [];

      this.engines.push(new Merlin1DEngine(this, this.tank, [-1.3, -18]));
      this.engines.push(new Merlin1DEngine(this, this.tank, [0, -18]));
      this.engines.push(new Merlin1DEngine(this, this.tank, [1.3, -18]));

      base.init.apply(this, arguments);

      this.gear.duration = 2;
    },

    reset: function(options) {
      options = options || {};
      
      if('engines' in options){
        if(options.engines == 1) {
          this.engines[0].disabled = true;
          this.engines[2].disabled = true;
        } else if(options.engines == 2) {
          this.engines[1].disabled = true;
        }
      }
      
      base.reset.apply(this, arguments);
    },

    destroy: function() {
      var w = this.game.scene.world.world;
      base.destroy.apply(this, arguments);
    },

    get_thrust: function(max) {
      var thrust = 0;
      for(var i=0; i<this.engines.length; i++)
        thrust += this.engines[i].get_thrust(max);
      return thrust;
    },

    get_rest_altitude: function() {
      return 21.9;
    },

    init_body: function() {
      base.init_body.apply(this, arguments);
    },

    init_shapes: function() {
      var size = 3.62;
      var height = 42;
      var gear_span = 10;
      var gear_height = 6;

      size *= 0.5;
      height *= 0.5;
      gear_span *= 0.5;
      
      var vertices = [
        [-size, height],
        [-size, -height],
        [-gear_span, -height - gear_height],
        [gear_span, -height - gear_height],
        [size, -height],
        [size, height]
      ];
      
      this.body.fromPolygon(vertices);
      
      for(var i=0; i<this.body.shapes.length; i++) {
        this.body.shapes[i].material = this.material;
      }
    },

    init_images: function() {
      var images = [
        'vehicle',
        'flame',
        'flame-core',
        'engine'
      ];

      for(var i=0; i<=60; i++){
        images.push('leg-' + lpad(i, 4));
      }
      
      base.init_images.call(this, images);
    },

    draw_track: function(scene) {
      if(this.game.get_target() != this) return;
      var r = scene.renderer;
      var cc = scene.renderer.context;
      
      cc.beginPath();
      
      for(var i=0; i<this.track.length; i++) {
        var p = [
          r.m_to_px(this.track[i][0]),
          -r.m_to_px(this.track[i][1]),
        ];

        if(i == 0)
          cc.moveTo(p[0], p[1]);
        else
          cc.lineTo(p[0], p[1]);
      }

      cc.strokeStyle = '#fff';
      cc.lineWidth = 4;
      cc.stroke();
      
      cc.strokeStyle = 'rgba(0, 128, 128, 0.5)';
      cc.lineWidth = 2;
      cc.stroke();
    },
    
    draw: function(scene) {
      var r = scene.renderer;
      var rcc = scene.renderer.context;

      this.draw_track(scene);

      rcc.save();

      rcc.translate(
        r.m_to_px(this.body.position[0]),
        r.m_to_px(-this.body.position[1])
      );

      this.draw_vehicle(r);
      this.draw_engines(r);

      rcc.rotate(-this.body.angle);
      rcc.translate(-this.image_center[0], -this.image_center[1]);
      
      draw_image(rcc, this.canvas, this.image_size);

      rcc.restore();
    },

    ////////////////////////

    draw_vehicle: function(renderer) {
      var cc = this.context;
      canvas_clear(cc, this.image_size, this.image_factor);

      cc.save();
      
      draw_image(this.context, this.images['vehicle'].data, this.image_size, this.image_factor);

      this.draw_leg(this.gear.get(this.time));
      cc.scale(-1, 1);
      cc.translate(-this.image_size[0] * this.image_factor, 0);
      this.draw_leg(this.gear.get(this.time));
      
      cc.restore();
    },

    draw_leg: function(fraction) {
      var frame = lpad(rnd(clerp(0, fraction, 1, 0, 60)), 4);
      draw_image(this.context, this.images['leg-' + frame].data, this.image_size, this.image_factor);
    },
    
    ////////////////////////

    draw_engines: function(renderer) {
      this.draw_engine(renderer, this.engines[1], true);
      this.draw_engine(renderer, this.engines[0]);
      this.draw_engine(renderer, this.engines[2]);
    },
    
    draw_engine: function(renderer, engine, center) {
      var cc = this.context;

      cc.save();
      
      cc.translate(0, 156);// bottom of engines
      var offset = 100;
      cc.translate(this.image_size[0]/2 * this.image_factor, 466 + offset);
      
      cc.translate(renderer.m_to_px(engine.position[0]), 0);
      cc.rotate(-engine.get_gimbal_angle());
      cc.translate(-this.image_size[0]/2 * this.image_factor, 0 - offset);
      
      if(center)
        cc.translate(0, 2);
      draw_image(cc, this.images['engine'].data, this.image_size, this.image_factor);

      cc.globalAlpha = engine.throttle * clerp(0, Math.random(), 1, 0.7, 1);
      cc.globalCompositeOperation = 'lighter';
      draw_image(cc, this.images['flame'].data, this.image_size, this.image_factor);
      draw_image(cc, this.images['flame-core'].data, this.image_size, this.image_factor);

      cc.restore();
    },
    ////////////////////////

    pre_physics: function(elapsed) {
      this.time += elapsed;
      
      var forces = [];

      for(var i=0; i<this.engines.length; i++) {
        forces.push(this.engines[i].get_force());
      }

      for(i=0; i<this.engines.length; i++) {
        this.engines[i].set_throttle(this.throttle);
        this.engines[i].set_gimbal(this.gimbal);
        this.engines[i].tick(elapsed);
      }

      this.tank.tick(elapsed);

      for(i=0; i<forces.length; i++) {
        var ef = forces[i];
        this.body.applyForceLocal(ef[0], ef[1]);
      }
      
      base.pre_physics.apply(this, arguments);
    },

    post_physics: function() {
      base.post_physics.apply(this, arguments);
    }

  };
});
