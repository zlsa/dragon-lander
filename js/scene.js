
var Scene = Events.extend(function(base) {
  return {
    
    init: function(game) {
      this.game = game;
      
      base.init.apply(this, arguments);

      this.renderer = new Renderer(this, $('#canvas'));
      this.world = new Mars(this);

      this.game.bind('render', with_scope(this, this.render));
      
      base.init.apply(this, arguments);
    },

    set_planet: function(planet) {
      
      if(planet == 'mars')
        this.world = new Mars(this);
      else if(planet == 'moon')
        this.world = new Moon(this);
      else
        this.world = new Earth(this);

    },

    add_vehicle: function(v) {
      this.world.add_vehicle(v);
    },

    render: function() {

    }

  };
});
