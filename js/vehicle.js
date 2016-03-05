
var Vehicle = Events.extend(function(base) {
  return {

    init: function(game) {
      this.image_size = this.image_size || [128, 128];
      this.image_center = this.image_center || [64, 64];
      this.game = game;

      this.canvas = create_canvas(this.image_size[0], this.image_size[1]);
      this.context = this.canvas.getContext('2d');

      this.init_images();
      
      this.init_body();
      this.init_shapes();

      this.throttle = 0;
      this.gimbal = 0;
      
      base.init.apply(this, arguments);
    },

    init_body: function() {
      
      this.body = new p2.Body({
        mass: this.mass
      });
      
    },

    get_position: function() {
      return this.body.position;
    },

    get_acceleration: function() {
      return this.body.force;
    },

    get_speed: function() {
      return this.body.velocity;
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

    pre_physics: function() {
      this.body.applyForceLocal([0, 68170 * 0.6]);
    },

    post_physics: function() {

    }
  };
});

var CrewDragonVehicle = Vehicle.extend(function(base) {
  return {

    init: function() {
      this.vehicle_type = 'crew-dragon';

      this.image_size = [128, 256];

      this.image_center = [64, 61];
      
      this.mass = 4200;

      this.engine = new CrewDragonEngine();

      base.init.apply(this, arguments);
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
      
      console.log(this.body.fromPolygon(vertices));
      
    },

    init_images: function() {
      base.init_images.call(this, [
        'capsule',
        'flame',
        'flame-diamonds'
      ]);
    },

    draw: function(scene) {
      var r = scene.renderer;
      var rcc = scene.renderer.context;

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

    ////////////////////////

    draw_vehicle: function() {
      var cc = this.context;
      canvas_clear(cc, this.image_size);

      cc.save();
      
      this.draw_capsule();
      
      this.draw_flame(this.engine.pods[0].throttle);
      cc.scale(-1, 1);
      cc.translate(-this.image_size[0], 0);
      this.draw_flame(this.engine.pods[1].throttle);
      
      cc.restore();
    },

    draw_capsule: function() {
      draw_image(this.context, this.images['capsule'].data, this.image_size);
    },
    
    draw_flame: function(throttle) {
      this.context.globalAlpha = throttle * 1 * clerp(0, Math.random(), 1, 0.7, 1);
      
      this.context.globalCompositeOperation = 'lighter';
      draw_image(this.context, this.images['flame'].data, this.image_size);
      draw_image(this.context, this.images['flame'].data, this.image_size);
      draw_image(this.context, this.images['flame-diamonds'].data, this.image_size);
      draw_image(this.context, this.images['flame-diamonds'].data, this.image_size);
    },
    
    ////////////////////////

    pre_physics: function() {
      var forces = this.engine.get_forces();

      for(var i=0; i<forces.length; i++) {
        var ef = forces[i];
        window.f = ef;
        this.body.applyForceLocal(ef[0], ef[1]);
      }

      this.engine.set_throttle(this.throttle);
      this.engine.set_gimbal(this.gimbal * 0.1);
    },

    post_physics: function() {

    }

  };
});
