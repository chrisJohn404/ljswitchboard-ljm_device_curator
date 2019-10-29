
var q = require('q');
var device_curator = require('../../lib/device_curator');
var utils = require('../utils/utils');
var qExec = utils.qExec;


var device;

var criticalError = false;
var stopTest = function(test, err) {
	test.ok(false, err);
	criticalError = true;
	test.done();
};

var deviceInfo = {
	'serialNumber': -2,
	'DEVICE_NAME_DEFAULT': 'My Test Device',
	'ipAddress': '0.0.0.0',
	'ETHERNET_IP': '0.0.0.0',
};
var infoMapping = {
	'SERIAL_NUMBER': 'serialNumber',
};
var appropriateResultMap = {
	'AIN0': function(test, res) {
		if(res.res < -100) {
			test.ok(false, 'AIN value out of reasonable range (-)');
		}
		if(res.res > 100) {
			test.ok(false, 'AIN value out of reasonable range (+)')
		}
	},
	'FIO0': function(test, res) {
		if(res.res === 0 || res.res == 1) {
			test.ok(true);
		} else {
			test.ok(false, 'FIO0 value not 1 or 0. ' + res.res.toString());
		}
	}
};
deviceFound = false;

exports.tests = {
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
	'createDevice': function(test) {
		console.log('');
		console.log('**** LJM Demo Mode Test ****');
		try {
			device = new device_curator.device(true);
		} catch(err) {
			stopTest(test, err);
		}
		test.done();
	},
	// 'configure mock device': function(test) {
	// 	device.configureMockDevice(deviceInfo)
	// 	.then(function(res) {
	// 		test.done();
	// 	});
	// },
	'openDevice - ctANY device': function(test) {
		var td = {
			'dt': 'LJM_dtANY',
			'ct': 'LJM_ctANY',
			'id': 'LJM_DEMO_MODE'
		};

		device.open(td.dt, td.ct, td.id)
		.then(function(res) {
			deviceFound = true;
			test.done();
		}, function(err) {
			test.done();
		});
	},
	'checkDeviceInfo': function(test) {
		device.getDeviceAttributes()
		.then(function(res) {
			var keys = Object.keys(res);
			test.strictEqual(res.deviceType, -4);
			test.strictEqual(res.deviceTypeName, 'T7');
			test.strictEqual(res.deviceTypeString, 'LJM_dtT7');
			test.strictEqual(res.connectionType, 1);
			test.strictEqual(res.connectionTypeString, 'LJM_ctUSB');
			test.strictEqual(res.serialNumber, deviceInfo.serialNumber);
			test.strictEqual(res.ip, '0.0.0.0');
			test.strictEqual(res.ipAddress, '0.0.0.0');
			test.done();
		});
	},
	'Read Device Attributes': function(test) {
		var results = [];
		// Setup and call functions
		qExec(device, 'iRead', 'ETHERNET_IP')(results)
		.then(qExec(device, 'iRead', 'SERIAL_NUMBER'))
		.then(function(res) {
			// console.log('Res', res);
			res.forEach(function(readRes) {
				var readData = readRes.retData;
				var name = readData.name;
				var resData;
				if(appropriateResultMap[name]) {
					if(typeof(appropriateResultMap[name]) == 'function') {
						appropriateResultMap[name](test, readData);
					} else {
						resData = readData[appropriateResultMap[name]];
					}
				} else {
					resData = readData.val;
				}

				if(deviceInfo[name]) {
					test.strictEqual(resData, deviceInfo[name]);
				} else if(infoMapping[name]) {
					test.strictEqual(resData, deviceInfo[infoMapping[name]]);
				}
				// console.log(name, resData);
			});
			test.done();
		});
	},
	'Read Registers': function(test) {
		var results = [];
		qExec(device, 'iRead', 'AIN0')(results)
		.then(qExec(device, 'iRead', 'FIO0'))
		.then(function(res) {
			// console.log('Res', res);
			res.forEach(function(readRes) {
				var readData = readRes.retData;
				var name = readData.name;
				var resData;
				if(appropriateResultMap[name]) {
					if(typeof(appropriateResultMap[name]) == 'function') {
						appropriateResultMap[name](test, readData);
					} else {
						resData = readData[appropriateResultMap[name]];
					}
				} else {
					resData = readData.val;
				}

				if(deviceInfo[name]) {
					test.strictEqual(resData, deviceInfo[name]);
				} else if(infoMapping[name]) {
					test.strictEqual(resData, deviceInfo[infoMapping[name]]);
				}
				// console.log(name, resData);
			});
			test.done();
		});
	},
	'closeDevice': function(test) {
		device.close()
		.then(function() {
			test.done();
		});
	},
};