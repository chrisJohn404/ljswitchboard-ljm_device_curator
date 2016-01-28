
var q = require('q');
var device_curator = require('../lib/device_curator');
var utils = require('./utils/utils');
var qExec = utils.qExec;
var async = require('async');
var modbus_map = require('ljswitchboard-modbus_map').getConstants();

// Digit format functions
var digit_format_functions = require('../lib/digit_format_functions');

var devices;

var criticalError = false;
var stopTest = function(test, err) {
	test.ok(false, err);
	criticalError = true;
	test.done();
};

var deviceFound = false;
var performTests = true;

var DEBUG_TEST = false;

var device_tests = {
	'setUp': function(callback) {
		if(criticalError) {
			process.exit(1);
		} else {
			callback();
		}
	},
	'tearDown': function(callback) {
		callback();
	},
	'createDigitDevice': function(test) {
		console.log('');
		console.log('**** digit_basic_test ****');
		try {
			device = new device_curator.device();
		} catch(err) {
			stopTest(test, err);
		}
		test.done();
	},
	'openDigit': function(test) {
		var td = {
			'dt': 'LJM_dtDIGIT',
			'ct': 'LJM_ctUSB',
			'id': 'LJM_idANY'
		};

		device.open(td.dt, td.ct, td.id)
		.then(function(res) {
			if(DEBUG_TEST) {
				console.log(
					"  - Opened Digit:",
					res.productType,
					res.connectionTypeName,
					res.serialNumber
				);
			}
			deviceFound = true;
			test.done();
		}, function(err) {
			performTests = false;
			test.done();
		});
	},
	'checkDigitDeviceInfo': function(test) {
		device.getDeviceAttributes()
		.then(function(res) {
			test.strictEqual(res.deviceType, 200);
			test.strictEqual(res.deviceTypeString, 'LJM_dtDIGIT');
			test.strictEqual(res.connectionType, 1);
			test.strictEqual(res.connectionTypeString, 'LJM_ctUSB');
			test.done();
		});
	},
	
	'averageTLH Readings': function(test) {
		var numReads = 10;
		var operation = 'readTempLightHumidity';

		executeMany(operation, numReads)
		.then(function(averagedData) {
			console.log('Averaged Data', averagedData);
			test.done();
		});
	},
	'closeDigit': function(test) {
		device.close()
		.then(function() {
			test.done();
		});
	},
};

var executeMany = function(operation, numIterations) {
	var defered = q.defer();
	var executions = [];

	var collectedData = [];
	var summedData = {
		'temperature': 0,
		'humidity': 0,
		'light': 0,
	};
	var averagedData = {
		'temperature': 0,
		'humidity': 0,
		'light': 0,
	};

	for(var i = 0; i < numIterations; i++) {
		executions.push(device[operation]);
	}

	async.eachSeries(
		executions,
		function(execution, callback) {
			execution()
			.then(function(data) {
				collectedData.push(data);
				callback();
			}, function(err) {
				console.error('Error collecting data from digit', err);
				callback();
			});
		}, function(err) {
			collectedData.forEach(function(data) {
				summedData.temperature += data.temperature;
				summedData.humidity += data.relativeHumidity;
				summedData.light += data.lux;
			});

			averagedData.temperature = summedData.temperature/collectedData.length;
			averagedData.humidity = summedData.humidity/collectedData.length;
			averagedData.light = summedData.light/collectedData.length;

			defered.resolve(averagedData);
		});

	return defered.promise;
};
var tests = {};
var functionKeys = Object.keys(device_tests);
var getTest = function(testFunc, key) {
	var execTest = function(test) {
		// console.log("  > digit_basic_test - " + key);
		if(performTests) {
			testFunc(test);
		} else {
			console.log("  * Not Executing!!");
			try {
				test.done();
			} catch(err) {
				console.log("HERE", err);
			}
		}
	};
	return execTest;
};
functionKeys.forEach(function(functionKey) {
	if ((functionKey !== 'setUp') && (functionKey !== 'tearDown')) {
		tests[functionKey] = getTest(device_tests[functionKey], functionKey);
	} else {
		tests[functionKey] = device_tests[functionKey];
	}
});
exports.tests = tests;