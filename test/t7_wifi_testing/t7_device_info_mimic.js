
var q = require('q');
var device_curator = require('../../lib/device_curator');
var utils = require('../utils/utils');
var qExec = utils.qExec;
var ljm_ffi = require('ljm-ffi');
var ljm = ljm_ffi.load();
var ljmb = require('ljswitchboard-modbus_map');
var modbus_map = ljmb.getConstants();


var device;
var capturedEvents = [];

var criticalError = false;
var stopTest = function(test, err) {
	test.ok(false, err);
	criticalError = true;
	test.done();
};

var deviceFound = false;
var performTests = true;

var DEBUG_TEST = true;

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
	'createDevice': function(test) {
		console.log('');
		console.log('**** t7_basic_test ****');
		console.log('**** Please connect 1x T7 via WiFi ****');
		try {
			device = new device_curator.device();
		} catch(err) {
			stopTest(test, err);
		}
		test.done();
	},
	'close all open devices': function(test) {
		ljm.LJM_CloseAll();
		test.done();
	},
	'openDevice': function(test) {
		var td = {
			'dt': 'LJM_dtT7',
			// 'ct': 'LJM_ctEthernet_UDP',
			'ct': 'LJM_ctWiFi_TCP',
			// 'ct': 'LJM_ctEthernet',
			'id': '192.168.1.211'
			// 'id': '192.168.1.133',
		};

		device.open(td.dt, td.ct, td.id)
		.then(function(res) {
			if(DEBUG_TEST) {
				console.log(
					"  - Opened T7:",
					res.productType,
					res.connectionTypeName,
					res.serialNumber,
					res.DEVICE_NAME_DEFAULT
				);
			}
			// console.log('in t7_device_info_mimic.js, openDevice', res);
			deviceFound = true;
			test.done();
		}, function(err) {
			console.log('Failed to open device', err);
			var info = modbus_map.getErrorInfo(err);
			console.log('Error Code', err);
			console.log('Error Name', info.string);
			console.log('Error Description', info.description);
			performTests = false;
			device.destroy();
			test.done();
		});
	},
	'get device network settings': function(test) {
		device.iReadMany(['ETHERNET_IP', 'WIFI_IP'])
		.then(function(res) {
			console.log('  - IP Settings:');
			for(var i = 0; i < res.length; i++) {
				console.log('    -',res[i].name, res[i].str);
			}
			// console.log('Results:', res);
			test.done();
		}, function(err) {
			test.done();
		});
	},
	'checkDeviceInfo': function(test) {
		device.getDeviceAttributes()
		.then(function(res) {
			var keys = Object.keys(res);

			test.strictEqual(res.deviceType, 7);
			test.strictEqual(res.deviceTypeString, 'LJM_dtT7');
			test.done();
		});
	},
	'get basic registers': function(test) {
		device.iReadMany([
                'ETHERNET_IP',
                'WIFI_IP',
                'WIFI_RSSI',
                'CURRENT_SOURCE_200UA_CAL_VALUE',
                'CURRENT_SOURCE_10UA_CAL_VALUE',
                'POWER_ETHERNET',
                'POWER_WIFI',
                'POWER_AIN',
                'POWER_LED',
                'WATCHDOG_ENABLE_DEFAULT',
                'RTC_TIME_S',
                'SNTP_UPDATE_INTERVAL',
            ])
		.then(function(res) {
			// console.log('Results:', res);
			test.ok(true);
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get basic registers');
			test.done();
		});
	},
	'get secondary registers': function(test) {
		device.iReadMany([
                'TEMPERATURE_DEVICE_K',
            ])
		.then(function(res) {
			// console.log('Results:', res);
			test.ok(true);
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get secondary registers');
			test.done();
		});
	},
	'get ethernet MAC': function(test) {
		device.iRead( 'ETHERNET_MAC')
		.then(function(res) {
			// console.log('Results:', res);
			test.ok(true);
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get ethernet MAC');
			test.done();
		});
	},
	'get ethernet MAC': function(test) {
		device.iRead( 'WIFI_MAC')
		.then(function(res) {
			// console.log('Results:', res);
			test.ok(true);
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get WiFi MAC');
			test.done();
		});
	},
	'get recovery FW Version': function(test) {
		device.getRecoveryFirmwareVersion()
		.then(function(res) {
			// console.log('Results:', {
            //     'val': res,
            //     'name': 'recoveryFirmwareVersion'
            // });
			test.ok(true);
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get WiFi MAC');
			test.done();
		});
	},
	'perform check for hW issues': function(test) {
		device.checkForHardwareIssues()
        .then(function(res) {
			// console.log('HW Issues Results', res);
			test.ok(true);
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get WiFi MAC');
			test.done();
		});
	},
	'get uSD info': function(test) {
		device.getDiskInfo()
        .then(function(res) {
			console.log('Get Device Recovery Firmware Version Result', {
                'fileSystem': res.fileSystem,
                'freeSpace': res.freeSpace,
                'totalSize': res.totalSize,
                'info': res,
                'name': 'diskInfo',
            });
			test.ok(true);
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get WiFi MAC');
			test.done();
		});
	},
	'get available connection types': function(test) {
		device.getAvailableConnectionTypes()
        .then(function(result) {
			console.log('Available connection types');
            var connections = result.connections;
            var isUSB = false;
            var isEth = false;
            var isWiFi = false;
            connections.forEach(function(connection) {
                if(connection.type === 'USB') {
                    isUSB = connection.isAvailable;
                }
                if(connection.type === 'Ethernet') {
                    isEth = connection.isAvailable;
                }
                if(connection.type === 'WiFi') {
                    isWiFi = connection.isAvailable;
                }
            });
            console.log({
                'val': result,
                'name': 'availableConnections',
                'isUSB': isUSB,
                'isEth': isEth,
                'isWiFi': isWiFi,
            });
			test.ok(true);
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get WiFi MAC');
			test.done();
		});
	},
	// 'open in LJLogM': function(test) {
	// 	device.openDeviceInExternalApplication('LJLogM', device.connectionTypeString)
	// 	.then(function(res) {
	// 		test.ok(true);
	// 		test.done();
	// 	}, function(err) {
	// 		test.ok(false);
	// 		test.done();
	// 	});
	// },
	'closeDevice': function(test) {
		device.close()
		.then(function() {
			test.done();
		});
	},
	'close all devices': function(test) {
		ljm.LJM_CloseAll();
		test.done();
	},
	'close all devices': function(test) {
		ljm.LJM_CloseAll();
		setTimeout(function() {
			test.done();
		}, 100);
	}
};

var tests = {};
var functionKeys = Object.keys(device_tests);
var getTest = function(testFunc, key) {
	var execTest = function(test) {
		// console.log("  > t7_basic_test - " + key);
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