
var Renderer = Events.extend(function(base) {
  return {
    
    init: function(scene, element) {
      this.scene = scene;
      this.game = this.scene.game;

      this.size = [1, 1];

      this.game.bind('resize', with_scope(this, this.resize));

      this.pixels_per_meter = 8;

      this.canvas = $('#canvas').get(0);
      this.context = this.canvas.getContext('2d');

      this.context.save();
      
      base.init.apply(this, arguments);
    },

    m_to_px: function(m) {
      return m * this.pixels_per_meter;
    },

    resize: function(s) {
      this.size = s;
      this.canvas.width = this.size[0];
      this.canvas.height = this.size[1];
    },

    clear: function() {
      var cc = this.context;

      cc.restore();
      cc.save();

      cc.fillStyle = '#fed';
      cc.fillRect(0, 0, this.size[0], this.size[1]);
      
      cc.translate(
        rnd(this.size[0] * 0.5),
        rnd(this.size[1] * 0.5)
      );

      var target_pos = [0, 0];
      if(this.game.get_target()) {
        target_pos = this.game.get_target().get_position();
      }
      
      cc.translate(0, this.m_to_px(target_pos[1]));

      cc.beginPath();
      cc.moveTo(-this.size[0], -this.m_to_px(this.scene.world.get_altitude(0)));
      cc.lineTo(this.size[0], -this.m_to_px(this.scene.world.get_altitude(0)));
      cc.lineTo(this.size[0], this.size[1]);
      cc.lineTo(-this.size[0], this.size[1]);

      cc.fillStyle = '#fa9';
      cc.fill();
      
      
      cc.translate(-this.m_to_px(target_pos[0]), 0);
      
      var size = [50, 10];
      cc.fillRect(-size[0] * 0.5, -size[1] * 0.5, size[0], size[1]);

    },

    draw_hud_speed: function(target) {
      var cc = this.context;
      var speed = target.get_speed();
      var abs_speed = distance_2d(speed);

      cc.lineCap = 'round';
      
      cc.beginPath();

      var factor = 0.2;

      cc.moveTo(0, 0);
      cc.lineTo(this.m_to_px(speed[0] * factor), -this.m_to_px(speed[1] * factor));

      cc.globalAlpha = clerp(0, abs_speed, 10, 0, 1);

      cc.strokeStyle = '#fff';
      cc.lineWidth = 4;
      
      cc.stroke();
      
      cc.strokeStyle = BLACK;
      cc.lineWidth = 2;
      
      cc.stroke();
    },

    draw_hud: function() {
      var cc = this.context;

      cc.restore();
      cc.save();

      cc.translate(
        rnd(this.size[0] * 0.5),
        rnd(this.size[1] * 0.5)
      );

      var target = this.game.get_target();
      
      if(target) {
        this.draw_hud_speed(target);
      }

      cc.restore();
      cc.save();
    }

  };
});
