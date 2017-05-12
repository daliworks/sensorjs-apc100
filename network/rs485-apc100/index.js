'use strict';

var sensorDriver = require('../../index'),
    logger = sensorDriver.Sensor.getLogger(),
    Network = sensorDriver.Network,
    Device = sensorDriver.Device,
    util = require('util'),
    fs = require('fs'),
    _ = require('lodash'),
    async = require('async');

var deviceIds;

// 1. Rename the network name 'RS485_APC100'
function RS485_APC100(options) {
  Network.call(this, 'RS485_APC100', options);
}

util.inherits(RS485_APC100, Network);

function template(str, tokens) {
  return str && str.replace(/\{(\w+)\}/g, function(x, key) {
    return tokens[key];
  });
}

// 2. Function to discover sensors (address)
function discoverSensors(model, cb) {
  var error, addresses = [];

  // Place codes here to discover sensors and get array with addresses

  return cb && cb(error, addresses);
}

RS485_APC100.prototype.discover = function(networkName, options, cb) {
  var self = this,
      founds = [],
      models,
      modelCount;

  if (typeof networkName === 'function') {
    cb = networkName;
    options = undefined;
    networkName = undefined;
  } else if (typeof options === 'function') {
    cb = options;
    options = undefined;
  }

  async.eachSeries(models, function(model, done) {
    discoverSensors(model, function(error, addresses) {
      _.forEach(addresses, function(address) {
        var props = sensorDriver.getSensorProperties(model),
            sensorId,
            device;

        sensorId = template(props.idTemplate, { model: model, address: address });

        device = new Device(self, address, [{ id: sensorId, model: model }]);

        founds.push(device);

        self.emit('discovered', device);
      });

      done();
    });
  },
  function(error) {
    if (error) {
      // 4. Do someting to handle error
      logger.error(error);
    }

    return cb && cb(error, founds);
  });
};

module.exports = new RS485_APC100();
