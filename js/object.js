
var Obj = Events.extend(function(base) {
  return {
    
    init: function(scene) {
      this.scene = scene;
      this.game = this.scene.game;

      this.mesh = new CubeMesh(this.scene);
      
      this.uniforms = {
        time: 1
      };

      this.position = vec3.create();
      this.quaternion = quat.create();
      
      this.world = mat4.create();

      base.init.apply(this, arguments);
    },

    update_world: function() {
      mat4.fromRotationTranslation(this.world, this.quaternion, this.position);
    },

    draw: function() {
      this.update_world();

      this.mesh.draw(this);
    }

  };
});
