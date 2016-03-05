
var Shader = Events.extend(function(base) {
  return {
    
    init: function(scene) {
      this.scene = scene;
      this.renderer = this.scene.renderer;
      this.game = this.scene.game;

      this.gl = this.renderer.gl;
      
      base.init.apply(this, arguments);

      this.game.bind('done', func_context(this, this.done));

      this.source = {};
    },

    done: function() {
      this.init_sources();
      this.program_info = twgl.createProgramInfo(this.gl, [this.source.vertex, this.source.fragment]);
    }

  };
});

var LowPolyShader = Shader.extend(function(base) {
  return {
    
    init_sources: function(scene) {
      this.source.vertex = this.renderer.shader_sources.vertex.mesh.data;
      this.source.fragment = this.renderer.shader_sources.fragment.mesh.data;
    }

  };
});
