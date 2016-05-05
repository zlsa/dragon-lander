
// fuel tanks have one input
// add_fuel_flow(flow)

var FuelTank = Events.extend(function(base) {
  return {

    init: function(game) {
      this.game = game;

      this.dry_mass = this.dry_mass || 0;
      this.capacity = this.capacity || 0;
      this.amount = this.amount || 0;

      this.reset();

      this.flow = 0;
      this.last_flow = 0;

      base.init.apply(this, arguments);
    },

    reset: function() {
      this.flow = 0;
    },

    is_empty: function() {
      return this.amount < 0.01;
    },

    get_mass: function() {
      return this.amount + this.dry_mass;
    },

    get_amount: function() {
      return this.amount;
    },

    get_amount_fraction: function() {
      return this.amount / this.capacity;
    },

    add_fuel_flow: function(flow) {
      this.flow += flow;
    },

    get_fuel_time_left: function() {
      var l = Math.abs(this.get_amount() / this.get_fuel_flow());
      if(this.get_amount() == 0) return 0;
      return l;
    },

    get_fuel_flow: function() {
      return (Math.abs(this.last_flow) < 1 ? 0 : this.last_flow);
    },

    tick: function(elapsed) {
      this.amount += this.flow * elapsed;

      this.amount = clamp(0, this.amount, this.capacity);
      
      this.last_flow = this.flow;
      this.flow = 0;
    }

  };
});

var CrewDragonFuelTank = FuelTank.extend(function(base) {
  return {

    reset: function() {
      this.capacity = 1700;
      this.amount = 1700;
      
      base.reset.apply(this, arguments);
    }

  };
});

var Falcon9FuelTank = FuelTank.extend(function(base) {
  return {

    reset: function() {
      this.capacity = 409000;
      this.amount = 6000;
      
      base.reset.apply(this, arguments);
    }

  };
});
