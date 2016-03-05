
var Mesh = Events.extend(function(base) {
  
  return {
    
    init: function(scene) {
      this.scene = scene;
      this.renderer = this.scene.renderer;
      this.game = this.scene.game;

      this.gl = this.renderer.gl;

      this.shader = null;
      this.buffer_info = null;

      this.init_shader();
      this.init_mesh();
      
      base.init.apply(this, arguments);
    },

    draw: function(object) {
      var gl = this.gl;

      var program = this.shader.program_info.program;

      var uniforms = {
        resolution: [this.renderer.size[0], this.renderer.size[1]]
      };

      for(var i in object.uniforms)
        uniforms[i] = object.uniforms[i];

      var matrix_projection = mat4.create();
      var scale = 2;
      var aspect = this.renderer.aspect;
      mat4.ortho(matrix_projection, -scale * aspect, scale * aspect, scale, -scale, -5, 5);
//      mat4.perspective(matrix_projection, radians(140), aspect, 0.1, 100);

      var matrix_world = mat4.create();
      mat4.rotateY(matrix_world, matrix_world, this.game.get_time());

      var matrix_view = mat4.create();
      mat4.translate(matrix_view, matrix_view, [0, 0, 0]);
      mat4.rotateX(matrix_view, matrix_view, radians(10));
      mat4.rotateZ(matrix_view, matrix_view, radians(180));

      var sun_position = vec4.create();
      vec4.set(sun_position, 2, 2, 5, 1);
      vec4.transformMat4(sun_position, sun_position, matrix_world);
      
      var matrix_world_inverse_transpose = mat4.create();
      mat4.invert(matrix_world_inverse_transpose, matrix_world);
      mat4.transpose(matrix_world_inverse_transpose, matrix_world_inverse_transpose);
      
      uniforms.u_world = matrix_world;
      uniforms.u_view = matrix_view;
      uniforms.u_world_inverse_transpose = matrix_world_inverse_transpose;
      uniforms.u_projection = matrix_projection;
      uniforms.u_sun_position = sun_position;

      gl.useProgram(program);
      twgl.setBuffersAndAttributes(gl, this.shader.program_info, this.buffer_info);
      twgl.setUniforms(this.shader.program_info, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, this.buffer_info);
    }

  };
  
});

var CubeMesh = Mesh.extend(function(base) {
  
  return {

    init_shader: function() {
      this.shader = new LowPolyShader(this.scene);
    },

    init_mesh: function() {

      var arrays = {
        a_position: [1,1,-1,1,1,1,1,-1,1,1,-1,-1,-1,1,1,-1,1,-1,-1,-1,-1,-1,-1,1,-1,1,1,1,1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,1,1,1,-1,1,1,-1,-1,1,1,-1,1,-1,1,-1,1,1,-1,1,-1,-1,-1,-1,-1],
        a_normal:   [1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1],
        indices:  [0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]
      };
      //      arrays = {
//        a_position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0],
//      };
      
      this.buffer_info = twgl.createBufferInfoFromArrays(this.gl, arrays);

      window.m = this;
    }

  };
  
});
