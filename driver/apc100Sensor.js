'use strict';

var util = require('util');

var SensorLib = require('../index');
var Sensor = SensorLib.Sensor;
var logger = Sensor.getLogger('Sensor');
var apc100 = require('../apc100');

function APC100Sensor(sensorInfo, options) {
  var self = this;

  Sensor.call(self, sensorInfo, options);

  self.sequence = self.id.split('-')[2];
  self.prevValue = 0;
  self.prevTime = new Date().getTime();

  if (sensorInfo.model) {
    self.model = sensorInfo.model;
  }

  self.dataType = APC100Sensor.properties.dataTypes[self.model][0];

  apc100.on('data', function onData(data) {
    var result = {
      status: 'on',
      id: self.id,
      result: {},
      time: {}
    };

    result.result[self.dataType] = data[self.sequence];
    result.time[self.dataType] = self.prevTime = new Date().getTime();

    if (data[self.sequence] !== self.prevValue) {
      self.emit('change', result);
      self.prevValue = data[self.sequence];
    }
  });
}

APC100Sensor.properties = {
  supportedNetworks: ['rs485-apc100'],
  dataTypes: {
    apc100CountEvent: ['countEvent']
  },
  onChange: {
    apc100CountEvent: true
  },
  discoverable: false,
  addressable: true,
  recommendedInterval: 60000,
  maxInstances: 1,
  maxRetries: 8,
  idTemplate: '{gatewayId}-{deviceAddress}-{sequence}',
  models: ['apc100CountEvent'],
  category: 'sensor'
};

util.inherits(APC100Sensor, Sensor);

APC100Sensor.prototype._get = function (cb) {
  var self = this;
  var result = {
    status: 'on',
    id: self.id,
    result: {},
    time: {}
  };

  result.result[self.dataType] = self.prevValue;
  result.time[self.dataType] = self.prevTime;

  if (cb) {
    return cb(null, result);
  } else {
    self.emit('data', result);
  }
};

APC100Sensor.prototype._enableChange = function () {
  apc100.registerSensor(this.id);
  apc100.startPolling();
};

APC100Sensor.prototype._clear = function () {
  apc100.deregisterSensor(this.id);
  apc100.stopPolling();
};

module.exports = APC100Sensor;
