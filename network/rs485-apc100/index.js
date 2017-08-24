'use strict';

var sensorDriver = require('../../index'),
    Network = sensorDriver.Network,
    util = require('util');

// 1. Rename the network name 'RS485APC100'
function RS485APC100(options) {
  Network.call(this, 'rs485-apc100', options);
}

util.inherits(RS485APC100, Network);

RS485APC100.prototype.discover = function(networkName, options, cb) {
  return cb && cb(new Error('Not supported'));
};

module.exports = new RS485APC100();
