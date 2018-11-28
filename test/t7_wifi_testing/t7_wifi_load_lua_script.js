
var q = require('q');
var device_curator = require('../../lib/device_curator');
var utils = require('../utils/utils');
var qExec = utils.qExec;
var ljm_ffi = require('ljm-ffi');
var ljm = ljm_ffi.load();
var ljmb = require('ljswitchboard-modbus_map');
var modbus_map = ljmb.getConstants();
var path = require('path');

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
	'get WiFi MAC': function(test) {
		device.iRead( 'WIFI_MAC')
		.then(function(res) {
			console.log('  - WiFi MAC:', res.val);
			// Test to make sure MAC address isn't all 0s
			var isOk = true;
			var numZeros = 0;
			var macVals = res.val.split(':');
			macVals.forEach(function(macVal){
				if(macVal === '00' || macVal === '0') {
					numZeros+=1;
				}
			});
			if(numZeros == 6) {
				test.ok(false, 'Mac Address should not be all zeros: ' + res.val);
			} else {
				test.ok(true);
			}
			test.done();
		}, function(err) {
			test.ok(false, 'failed to get WiFi MAC');
			test.done();
		});
	},

	'stopping lua script': function(test) {
		console.log('  - Stopping Lua Script.');
		device.stopLuaScript()
		.then(function(res) {
			console.log('  - Lua Script Stopped.');
			test.done();
		}, function(err) {
			test.done();
		});
	},
	'load lua script': function(test) {
		var checkSDCardLuaScriptName = '5_sec_lua_script.lua';
		var luaScriptDirectory = path.join('test', 'lua_scripts');
		var cwd = process.cwd();
		var luaScriptsPath = path.join(cwd,luaScriptDirectory);
		var checkSDCardLuaScriptPath = path.join(luaScriptsPath, checkSDCardLuaScriptName);
		device.loadLuaScript({
			'filePath': checkSDCardLuaScriptPath,
		})
		.then(function(res) {
			// console.log('Finished Loading Script', res);
			test.ok(true, 'Finished loading script');
			test.done();
		}, function(err) {
			console.log('Error loading script', err);
			test.ok(false, 'Error loading script');
			test.done();
		});
	},
	'starting lua script': function(test) {
		console.log('  - Starting Lua Script.');
		device.startLuaScript()
		.then(function(res) {
			console.log('  - Lua Script Started.');
			test.done();
		}, function(err) {
			test.done();
		});
	},
	'wait for script to stop': function(test) {
		console.log('  - Waiting for Lua script to run.');
		var reg = 'LUA_RUN';
		var evalStr = 'x === 0';
		var maxAttempts = 15;
		var delay = 500;
		var readOptions = {
			'register': reg,
			'evalStr': evalStr,
			'maxAttempts': maxAttempts,
			'delay': delay,
			'rejectOnError': true,
		};
		device.readAndEvaluate(readOptions)
		.then(function(res) {
			// console.log('  - Lua Script Finished?', res);
			console.log('  - Lua Script Finished Running.');
			test.ok(true, 'Lua script finished running.');
			luaScriptExecuted = true;
			test.done();
		}, function(err) {
			test.ok(false, 'Lua script failed to execute and finish.');
			luaScriptExecuted = false;
			test.done();
		});
	},
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