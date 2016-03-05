
var Renderer = Events.extend(function(base) {
  return {
    
    init: function(scene, element) {
      this.scene = scene;
      this.game = this.scene.game;

      this.size = [1, 1];
      this.zoom = 1;

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

      cc.scale(this.zoom, this.zoom);

      cc.translate(0, this.m_to_px(target_pos[1]));

      cc.beginPath();
      cc.moveTo(-this.size[0], -this.m_to_px(this.scene.world.get_altitude(0)));
      cc.lineTo(this.size[0], -this.m_to_px(this.scene.world.get_altitude(0)));
      cc.lineTo(this.size[0], this.size[1]);
      cc.lineTo(-this.size[0], this.size[1]);

      cc.fillStyle = '#fa9';
      cc.fill();
      
      
      cc.translate(-this.m_to_px(target_pos[0]), 0);
      
    },

    draw_hud_speed: function(target) {
      var velocity = target.get_velocity();
      var speed = target.get_speed();

      var factor = 0.2;

      this.draw_hud_line([this.m_to_px(velocity[0] * factor), this.m_to_px(velocity[1] * -factor)], clerp(0, speed, 10, 0, 1));
    },
    
    draw_hud_acceleration: function(target) {
      var acceleration = target.get_acceleration();
      var abs_acceleration = distance_2d(acceleration);

      var factor = 0.5;

      var color = 'red';
      var grav = this.scene.world.gravity;

      for(var i=1; i<8; i++) {
        var f2 = 0;
        if(!(i&1)) f2 = 0.3;
        this.draw_hud_circle(this.m_to_px(grav * factor * i), clerp(1, Math.pow(i, 2), 64, 0.05, 0.01) + f2, color);
      }
      
      this.draw_hud_line(
        [this.m_to_px(acceleration[0] * factor), this.m_to_px(acceleration[1] * -factor)],
        clerp(0, abs_acceleration, 10, 0, 1), color);
    },
    
    draw_hud_fuel: function(target) {
      var fuel = target.tank.get_amount_fraction();

      var width = 128;
      var height = 8;
      var padding = 32;
      
      var cc = this.context;
      cc.save();

      cc.translate(rnd(-this.size[0] * 0.5 + width * 0.5 + padding), rnd(-this.size[1] * 0.5 + height * 0.5 + padding));
      
      this.draw_hud_bar([width, height], fuel);
      this.draw_hud_bar_text([width, height], 'FUEL');

      cc.restore();
    },
    
    draw_hud_line: function(vector, alpha, color) {
      if(!alpha) alpha = 1;
      if(!color) color = BLACK;
      
      var cc = this.context;
      cc.lineCap = 'round';
      
      cc.beginPath();

      cc.moveTo(0, 0);
      cc.lineTo(vector[0], vector[1]);

      cc.globalAlpha = clamp(alpha, 1);

      cc.strokeStyle = '#fff';
      cc.lineWidth = 4;
      
      cc.stroke();
      
      cc.strokeStyle = color;
      cc.lineWidth = 2;
      
      cc.stroke();
    },

    draw_hud_circle: function(radius, alpha, color) {
      if(!alpha) alpha = 1;
      if(!color) color = BLACK;
      
      var cc = this.context;
      
      cc.beginPath();

      cc.arc(0, 0, radius, 0, Math.PI * 2);

      cc.globalAlpha = alpha;

      cc.strokeStyle = '#fff';
      cc.lineWidth = 4;
      
      cc.stroke();
      
      cc.strokeStyle = color;
      cc.lineWidth = 2;
      
      cc.stroke();
    },

    draw_hud_bar: function(size, fraction, alpha, color) {
      if(!alpha) alpha = 1;
      if(!color) color = '#fff';

      var width = size[0];
      var height = size[1];
      var padding = 1;
      var cc = this.context;
      
      cc.globalAlpha = alpha;

      cc.fillStyle = 'rgba(0, 0, 0, 0.3)';
      
      cc.fillRect(-width * 0.5, -height * 0.5, width, height);

      cc.fillStyle = color;
      cc.fillRect(-width * 0.5 + padding, -height * 0.5 + padding, (width - padding * 2) * fraction, height - padding * 2);
    },

    draw_hud_bar_text: function(size, text) {
      this.context.fillStyle = BLACK;
      this.context.strokeStyle = '#fff';
      this.context.lineWidth = 2;
      
      this.context.font = "11px monospace";
      this.context.strokeText(text, -size[0] * 0.5, -size[1]);
      this.context.fillText(text, -size[0] * 0.5, -size[1]);
    },
    
    draw_hud_bar_value: function(size, text) {
      this.context.fillStyle = BLACK;
      this.context.strokeStyle = '#fff';
      this.context.lineWidth = 2;
      
      this.context.font = "bold 14px monospace";
      this.context.strokeText(text, -size[0] * 0.5, size[1] * 0.5);
      this.context.fillText(text, -size[0] * 0.5, size[1] * 0.5);
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
        cc.globalAlpha = 1;
        this.draw_hud_acceleration(target);
        cc.globalAlpha = 1;

        var values = [];
        var debug = true;

        values.push([
          'ATM',
          this.scene.world.get_pressure(target.get_position()) / 1.22
        ]);

        values.push([
          'FUEL',
          target.tank.get_amount_fraction()
        ]);

        if(debug) {
          values.push([
            'MASS',
            rnd(target.get_mass()) + 'kg'
          ]);
        }

        values.push([
          'ALTITUDE',
          distance_str(target.get_position()[1])
        ]);

        values.push([
          'RANGE',
          distance_str(target.get_position()[0])
        ]);

        values.push([
          'THROTTLE',
          target.engine.throttle_command
        ]);

        var twr = target.engine.get_thrust() / target.get_mass() / 9.81; 
        var peak_twr = target.engine.get_max_thrust() / target.get_mass() / 9.81; 

        values.push([
          'TWR',
          rnd(twr, 2) + ' (' + rnd(peak_twr, 2) + ')'
        ]);

        if(debug) {
          values.push([
            'G-FORCE',
            rnd(distance_2d(target.get_acceleration()) / this.scene.world.gravity, 2) + 'G'
          ]);

          values.push([
            'PEAK G-FORCE',
            rnd(distance_2d(target.get_peak_acceleration()) / this.scene.world.gravity, 2) + 'G'
          ]);
        }

        if(debug) {
          values.push([
            'DRAG',
            rnd(target.drag / 1000, 2) + 'kN'
          ]);

          values.push([
            'VELOCITY',
            rnd(target.get_speed()) + 'm/s'
          ]);
          
          values.push([
            'AUTOPILOT',
            rnd(this.game.autopilot.value, 2) + ''
          ]);
        }

        var size = [128, 12];
        var padding = 24;
        var text_offset = -8;

        cc.save();
        cc.translate(rnd(-this.size[0] * 0.5 + size[0] * 0.5 + padding), rnd(-this.size[1] * 0.5 + size[1] * 0.5 + padding * 2));
        
        for(var i=0; i<values.length; i++) {
          this.draw_hud_bar_text(size, values[i][0]);
          
          if(typeof values[i][1] == typeof '') {
            this.draw_hud_bar_value(size, values[i][1]);
          } else {
            this.draw_hud_bar(size, values[i][1]);
          }
          
          cc.translate(0, size[1] + padding * 2 + text_offset);
          cc.globalAlpha = 1;
        }

        cc.restore();
      }

      cc.restore();
      cc.save();
    }

  };
});
