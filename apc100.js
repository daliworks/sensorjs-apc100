'use strict';

var util = require('util');
var SerialPort = require('serialport');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;

var logger = require('./index').Sensor.getLogger('Sensor');

var serialOpts = {
  baudRate: 9600,
  parity: 'none',
  parser: SerialPort.parsers.byteDelimiter(']'.charCodeAt(0))
};

//var SERIAL_PORT_FILE = '/dev/ttyUSB0';
var SERIAL_PORT_FILE = '/dev/ttyS1';
var POLLING_INTERVAL = 1000;    // 1 sec
var DEVICE_ID = '0000';         // Only one device can be connected because polling
                                // interval should not be shorter than 1 sec.
var POLLING_MSG = '[' + DEVICE_ID + 'BTR]';
var RETRY_OPEN_INTERVAL = 3000; // 3sec

function isInvalid() {
  return false;
}

function parseMessage(data) {
  var result = {};
  var dataArray = new Buffer(data).toString().split(',');

  result.totalIn = parseInt(dataArray[1]);
  result.totalOut = parseInt(dataArray[2]);
  result.current = parseInt(dataArray[3]);

  return result;
}

function openSerialPort(apc100, cb) {
  var self;

  if (_.isFunction(apc100)) {
    self = module.exports;
    cb = apc100;
  } else {
    self = apc100;
  }

  self.port = new SerialPort(SERIAL_PORT_FILE, serialOpts, function onOpen(err) {
    logger.info('[APC100] Connected');

    if (err) {
      logger.error('Serial port error during opening:', err);

      return cb;
    } else {
      logger.info('[APC100] No err, Connected');
    }

    self.port.on('error', function onError(err) {
      logger.error('Serial port error:', err);

      return;
    });

    self.port.on('close', function onError(err) {
      if (err) {
        logger.error('Serial port error during closing:', err);
        // TODO: if error, isn't this closed?
      } else {
        logger.info('Serial port is closed');
      }

      return;
    });

    self.port.on('disconnect', function onError(err) {
      logger.error('Serial port is disconnected:', err);

      return;
    });

    self.isOpen = true;

    self.port.on('data', function onData(data) {
      var values;

      logger.trace('[APC100] onData():', new Buffer(data).toString());

      if (isInvalid(data)) {
        logger.error('Invalid message:', new Buffer(data).toString());

        return;
      }

      values = parseMessage(data);

      self.emit('data', values);
    });
  });
}

function openSerialCallback(err) {
  setTimeout(function () {
    openSerialPort(openSerialCallback);
  }, RETRY_OPEN_INTERVAL);
}

// TODO: Find serial port file. ttyUSB0 or ttyS1(E220)
// TODO: If opening port takes long time, async function cannot be finished.
function APC100 () {
  var self = this;

  EventEmitter.call(self);

  self.timer = null;
  self.deviceId = DEVICE_ID;
  self.registeredSensors = [];

  openSerialPort(self, openSerialCallback);

  /*
  self.port = new SerialPort(SERIAL_PORT_FILE, serialOpts, function onOpen(err) {
    if (err) {
      logger.error('Serial port error during opening:', err);

      return;
    } else {
      logger.info('[APC100] Connected');
    }

    self.port.on('error', function onError(err) {
      logger.error('Serial port error:', err);

      return;
    });

    self.port.on('close', function onError(err) {
      if (err) {
        logger.error('Serial port error during closing:', err);
        // TODO: if error, isn't this closed?
      } else {
        logger.info('Serial port is closed');
      }

      return;
    });

    self.port.on('disconnect', function onError(err) {
      logger.error('Serial port is disconnected:', err);

      return;
    });

    self.isOpen = true;

    self.port.on('data', function onData(data) {
      var values;

      logger.trace('[APC100] onData():', new Buffer(data).toString());

      if (isInvalid(data)) {
        logger.error('Invalid message:', new Buffer(data).toString());

        return;
      }

      values = parseMessage(data);

      self.emit('data', values);
    });
  });
  */
}

util.inherits(APC100, EventEmitter);

APC100.prototype.startPolling = function() {
  var self = this;

  if (!self.timer) {
    self.timer = setInterval(function () {
      logger.trace(POLLING_MSG, self.port.isOpen());
      self.port.write(POLLING_MSG);
    }, POLLING_INTERVAL);
  }
};

APC100.prototype.stopPolling = function() {
  if (this.registeredSensors.length && this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
};

APC100.prototype.registerSensor = function(id) {
  this.registeredSensors.push(id);
  this.registeredSensors = _.uniq(this.registeredSensors);
};

APC100.prototype.deregisterSensor = function(id) {
  _.pull(this.registeredSensors, id);
};

APC100.prototype.close = function() {
  logger.info('Closing serial port');
  this.port.close();
};

module.exports = new APC100();
