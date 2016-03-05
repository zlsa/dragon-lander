
// fuel tanks have one input
// add_fuel_flow(flow)

var FuelTank = Events.extend(function(base) {
  return {

    init: function(game) {
      this.game = game;

      this.dry_mass = this.dry_mass || 0;
      this.capacity = this.capacity || 0;
      this.amount = this.amount || 0;

      this.flow = 0;

      base.init.apply(this, arguments);
    },

    reset: function() {
      this.flow = 0;
      this.amount = this.capacity;
    },

    is_empty: function() {
      return this.amount < 0.01;
    },

    get_mass: function() {
      return this.amount + this.dry_mass;
    },

    get_amount_fraction: function() {
      return this.amount / this.capacity;
    },

    add_fuel_flow: function(flow) {
      this.flow += flow;
    },

    tick: function(elapsed) {
      this.amount += this.flow * elapsed;

      this.amount = clamp(0, this.amount, this.capacity);
      this.flow = 0;
    }

  };
});

var CrewDragonFuelTank = FuelTank.extend(function(base) {
  return {

    init: function(game) {
      this.capacity = 1700;
      this.amount = 1700;
      
      base.init.apply(this, arguments);
    }

  };
});
