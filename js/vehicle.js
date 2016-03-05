
var Vehicle = Events.extend(function(base) {
  return {

    init: function(game) {
      this.game = game;
      this.world = game.scene.world;

      this.image_size = this.image_size || [128, 128];
      this.image_center = this.image_center || [64, 64];
      this.image_factor = this.game.scene.renderer.zoom * 1.5;
      
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

      base.init.apply(this, arguments);

      setTimeout(with_scope(this, this.reset), 0);
    },

    reset: function() {
      this.time = 0;

      var altitude = 1000 * 0;
      
      this.body.position[0] = 0;
      this.body.position[1] = Math.max(2.50001, altitude);
      
      this.body.velocity[0] = 0;
      this.body.velocity[1] = 0;
      
      this.body.angle = 0;
      this.body.angularVelocity = 0;

      this.peak_acceleration = [0, 0];

      this.tank.reset();
      
      this.track = [];
      
      this.last_track = 0;

      if(altitude)
        this.body.velocity[1] = -this.get_terminal_velocity(altitude);

    },

    init_body: function() {

      var altitude = 0;
      
      this.body = new p2.Body({
        mass: this.mass,
        position: [0, altitude],
        velocity: [0, 0],
        damping: 0.0,
        angularDamping: 0.05
      });
    },

    get_terminal_velocity: function(altitude) {
      return Math.sqrt((2 * this.get_mass() * this.world.gravity) /
                       (this.world.get_pressure([0, altitude]) * this.aero.area * this.aero.cd.bottom));
    },

    get_mass: function() {
      return this.body.mass;
    },

    get_position: function() {
      return this.body.position;
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

    pre_physics: function(elapsed) {
      this.last_velocity = [this.body.velocity[0], this.body.velocity[1]];
    },

    post_physics: function(elapsed) {
      this.velocity = [this.body.velocity[0], this.body.velocity[1]];

      this.acceleration = [
        (this.last_velocity[0] - this.velocity[0]) / elapsed,
        (this.last_velocity[1] - this.velocity[1]) / elapsed - this.world.gravity
      ];

      if(distance_2d(this.acceleration) > distance_2d(this.peak_acceleration) && this.time > 1)
        this.peak_acceleration = this.acceleration;

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

      this.gear = new Animation({
        duration: 1
      });

      this.image_size = [128, 256];

      this.image_center = [64, 61];
      
      this.mass = 7200;

      this.aero = {
        area: 11,
        cop: 2,
        cd: {
          top: 0.8,
          bottom: 1.1
        }
      };

      base.init.apply(this, arguments);
      
      this.gear_deploy();
      
      this.tank = new CrewDragonFuelTank(this);
      this.engine = new CrewDragonEngine(this, this.tank);
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
      
      cc.strokeStyle = BLACK;
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

      this.draw_vehicle();
      
      rcc.rotate(-this.body.angle);
      
      rcc.translate(-this.image_center[0], -this.image_center[1]);
      draw_image(rcc, this.canvas, this.image_size);

      rcc.restore();
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

    ////////////////////////

    draw_vehicle: function() {
      var cc = this.context;
      canvas_clear(cc, this.image_size, this.image_factor);

      cc.save();
      
      this.draw_capsule();
      
      this.draw_flame(this.engine.pods[0].throttle);
      cc.scale(-1, 1);
      cc.translate(-this.image_size[0] * this.image_factor, 0);
      this.draw_flame(this.engine.pods[1].throttle);
      
      cc.restore();
    },

    draw_capsule: function() {
      var gear_offset = clerp(0, this.gear.get(this.time), 1, -4, 0);
      
      this.context.translate(0, gear_offset);
      draw_image(this.context, this.images['landing-legs'].data, this.image_size, this.image_factor);
      this.context.translate(0, -gear_offset);
      draw_image(this.context, this.images['capsule'].data, this.image_size, this.image_factor);
    },
    
    draw_flame: function(throttle) {
      this.context.globalAlpha = throttle * 1 * clerp(0, Math.random(), 1, 0.7, 1);
      
      this.context.globalCompositeOperation = 'lighter';
      
      draw_image(this.context, this.images['flame'].data, this.image_size, this.image_factor);
      draw_image(this.context, this.images['flame'].data, this.image_size, this.image_factor);
      draw_image(this.context, this.images['flame-diamonds'].data, this.image_size, this.image_factor);
      draw_image(this.context, this.images['flame-diamonds'].data, this.image_size, this.image_factor);
    },

    update_drag: function() {
      var density = this.world.scene.world.get_pressure(this.get_position());
      var dynf = (density * 0.5) * Math.pow(this.get_speed() / 9.81, 2);

      var v = this.get_velocity();
      var v_rot = Math.atan2(v[0], v[1]);
      var v_vec = angle_between(v_rot, -this.body.angle);

      this.v_vec = v_vec;

      var area = this.aero.area;
      var cd = clerp(0, Math.abs(v_vec), Math.PI, this.aero.cd.top, this.aero.cd.bottom);
      var drag_s = dynf * area * cd;

      var cop = this.aero.cop;

      this.drag = drag_s;

      var drag = [
        drag_s * -v[0],
        drag_s * -v[1]
      ];
      
      this.body.applyForce(drag, [
        cop * -Math.sin(this.body.angle),
        cop * Math.cos(this.body.angle),
      ]);
      
      this.body.angularDamping = clerp(0, Math.abs(this.body.angularVelocity), radians(60), 0.1, 1);
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

      this.body.mass = this.mass + this.tank.get_mass();

      this.update_drag();

      base.pre_physics.apply(this, arguments);
    },

    post_physics: function() {
      base.post_physics.apply(this, arguments);
    }

  };
});
