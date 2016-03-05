
var Scene = Events.extend(function(base) {
  return {
    
    init: function(game) {
      this.game = game;
      
      base.init.apply(this, arguments);

      this.renderer = new Renderer(this, $('#canvas'));
      this.world = new World(this);

      this.game.bind('render', with_scope(this, this.render));
      
      base.init.apply(this, arguments);
    },

    add_vehicle: function(v) {
      this.world.add_vehicle(v);
    },

    render: function() {

    }

  };
});
