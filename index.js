'use strict';

function initDrivers() {
  var apc100Sensor;

  try {
    apc100Sensor = require('./driver/apc100Sensor');
  } catch(e) {
    this.Sensor.getLogger().error('Cannot load ./driver/apc100Sensor', e);
  }

  return {
    apc100Sensor: apc100Sensor
  };
}

function initNetworks() {
  var rs485APC100;

  try {
    rs485APC100 = require('./network/rs485-apc100');
  } catch (e) {
    this.Sensor.getLogger().error('Cannot load ./network/rs485-apc100', e);
  }

  return {
    'rs485-apc100': rs485APC100
  };
}

module.exports = {
  networks: ['rs485-apc100'],
  drivers: {
    apc100Sensor: ['apc100CountEvent']
  },
  initNetworks: initNetworks,
  initDrivers: initDrivers
};
