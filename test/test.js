var colors = require('colors');
process.on('uncaughtException', function(err) {
	console.log('ERROR!!!', err);
	console.log(err.stack);
	process.exit();
});


/********************** Require tests *****************************************/
// Require LJM Versioning tests
// var load_specific_ljm_version = require('./load_specific_ljm_version');
// exports.load_specific_ljm_version = load_specific_ljm_version.tests;
// var get_ljm_version = require('./get_ljm_version');
// exports.get_ljm_version = get_ljm_version.tests;

// Require generic tests on mock devices
// var mock_device_test = require('./mock_device_test');
// var mock_device_defaults_cache_test = require('./mock_device_defaults_cache_test');
// var mock_device_attrs_test = require('./mock_device_attrs_test');
// var mock_device_upgrade_test = require('./mock_device_upgrade_test');
// var multiple_mock_device_upgrade_test = require('./multiple_mock_device_upgrade_test');

// Require T7 related tests
// var t7_basic_test = require('./t7_basic_test');
// var t7_array_test = require('./t7_array_test');
// var t7_check_calibration_test = require('./t7_check_calibration_test');
// var t7_read_recovery_fw_version_test = require('./t7_read_recovery_fw_version_test');
// var t7_upgrade_recovery_image_test = require('./t7_upgrade_recovery_image_test');
// var t7_upgrade_test = require('./t7_upgrade_test');
// var t7_error_test = require('./t7_error_test');
// var t7_open_close_test = require('./t7_open_close_test');
// var t7_basic_stream_test = require('./t7_basic_stream_test');
// var t7_single_channel_speed_test = require('./t7_single_channel_speed_test');
// var t7_multiple_device_upgrade_test = require('./t7_multiple_device_upgrade_test');

// Require ljm raw-handle usage tests (with ljm-ffi)
// var external_handle_test = require('./external_handle_test');

// Raw test of some labjack-nodejs stuff
// var t7_raw_test = require('./t7_raw_test');

// Thermocouple Tests
// var t7_thermocouple_speed_test = require('./t7_thermocouple_speed_test');

// Require Digit related tests
// var digit_basic_test = require('./digit_basic_test');
// var digit_variance_testing = require('./digit_variance_testing');

// Require Register Watcher tests
// var basic_watcher_test = require('./basic_watcher_test');
// 



/********************** Perform tests *****************************************/
// Perform Generic tests on mock devices
// exports.mock_device_test = mock_device_test.tests;								// Passing
// exports.mock_device_defaults_cache_test = mock_device_defaults_cache_test.tests;// Passing
// exports.mock_device_attrs_test = mock_device_attrs_test.tests;
// exports.mock_device_upgrade_test = mock_device_upgrade_test.tests;
// exports.multiple_mock_device_upgrade_test = multiple_mock_device_upgrade_test.tests;

// Perform T7 related tests
// exports.t7_basic_test = t7_basic_test.tests;									// Passing
// exports.t7_array_test = t7_array_test.tests;
// exports.t7_check_calibration_test = t7_check_calibration_test.tests;			// Passing
// exports.t7_read_recovery_fw_version_test = t7_read_recovery_fw_version_test.tests;
// exports.t7_upgrade_recovery_image_test = t7_upgrade_recovery_image_test;
// exports.t7_upgrade_test = t7_upgrade_test.tests;								// Passing
// exports.t7_multiple_device_upgrade_test = t7_multiple_device_upgrade_test.tests;
// exports.t7_error_test = t7_error_test.tests;									// Passing
// exports.t7_open_close_test = t7_open_close_test.tests;						// Passing - This one takes a LONG time.  Opens and closes a device 310x.

// Tests for integrating externally with ljm-ffi.
// exports.external_handle_test = external_handle_test.tests;

// Tests for streaming
// exports.t7_basic_stream_test = t7_basic_stream_test.tests;						// Passing
// exports.t7_single_channel_speed_test = t7_single_channel_speed_test.tests;		// Passing
// exports.t7_single_channel_speed_testA = t7_single_channel_speed_test.tests;
// exports.t7_single_channel_speed_testB = t7_single_channel_speed_test.tests;
// exports.t7_single_channel_speed_testC = t7_single_channel_speed_test.tests;
// exports.t7_single_channel_speed_testD = t7_single_channel_speed_test.tests;
// exports.t7_single_channel_speed_testE = t7_single_channel_speed_test.tests;
// exports.t7_single_channel_speed_testF = t7_single_channel_speed_test.tests;
// exports.t7_single_channel_speed_testG = t7_single_channel_speed_test.tests;

// Raw tests
// exports.t7_raw_test = t7_raw_test.tests;

// Thermocouple Tests
// exports.t7_thermocouple_speed_test = t7_thermocouple_speed_test.tests;

// Perform Digit related tests
// exports.digit_basic_test = digit_basic_test.tests;
// exports.digit_variance_testing = digit_variance_testing.tests;

// Register Watcher tests
// exports.basic_watcher_test = basic_watcher_test.tests;


// var device_curator = require('../../lib/device_curator');
// var utils = require('../utils/utils');

var testGroups = {
	/* START defining tests that are based off of mock-devices */
	'get_ljm_version': true,
	'mock_device': {
		'mock_device_test': true,
		'mock_device_defaults_cache_test': true,
		'mock_device_attrs_test': true,
		'mock_device_upgrade_test': false,
		'mock_t8_upgrade_test': false,
		'multiple_mock_device_upgrade_test': true,
		'basic_watcher_test': false, // Failing...
	},
	't4_mock_tests': {
		't4_basic_mock': true,
	},
	't5_mock_tests': {
		't5_basic_mock': true,
	},
	't8_mock_tests': {
		't8_basic_mock': false,
	},

	/* END defining tests that use mock-devices */

	/* START defining tests that use live devices. */
	'digit': {
		'digit_basic_test': false,
		'digit_variance_testing': false,
	},

	// These are T7 specific tests.
	't7': {
		't7_basic_test': false,
		't7_multiple_dev_any_test': false,
		't7_array_test': false,
		't7_check_calibration_test': false,
		't7_read_recovery_fw_version_test': false,
		't7_upgrade_recovery_image_test': false,
		't7_upgrade_test': true,
		
		// These two tests should be enabled and disabled together.  The first
		// test loads and runs a lua script that creates a file.  The second
		// test verifies that the file was created and then deletes it.  They
		// are used together to test uSD card compatibility with the T7/T7-Pro.
		't7_load_and_run_lua_script': false, // Runs script & creates test file "log1.csv"
		't7_verify_lua_script_created_file': false, // Checks for and deletes file.
		
		// This test prints out what files are on the uSD card.
		't7_file_system_basic': false,

		// This test performs multiple readdir commands and two read file
		// commands to test file I/O commands.  Requires there to be a folder
		// called 'testDir' and a file '/testDir/txtFile.txt'.
		't7_file_system_mult_readdir': false, // ONLY ENABLE WHEN FOLDER/FILE EXISTS ON uSD CARD!

		// This test requires special files to be on the uSD card.
		// Folder named "Test Folder" in the root directory.
		// "Test Folder/JP2 period 2.txt"
		't7_file_system_verification': false, // ONLY ENABLE WHEN FOLDER/FILE EXISTS ON uSD CARD!

		// This test checks the ability to read the T7's manufacturing info 
		// saved in flash.
		't7_manufacturing_info_test': false,

		// This test checks the ability to save and restore T7's power-up default
		// settings saved in flash.
		't7_startup_configs_save_and_restore': false, // Requires 2x T7s w/ specific SNs.  Same FW version.

		// Test cached reading functions. Requires one T7 via USB.
		't7_cached_values_test': false,

		// get available connections. Requires one T7 via USB.
		't7_available_connections_test': false,
	},
	// T7 over-ride tests...
	// 't7': {
	// 	't7_startup_configs_save_and_restore': false,
	// },

	// These are production-line tests.
	'production_line': {
		'check_t7_pro_versions': false,
		'check_t7_pro_versions_flex_fw': false,
		'mult_upgrade_recovery_firmware': false,
		'mult_upgrade_primary_firmware': false,
		'mult_install_calibration_firmware': false,
	},

	// These are T4 specific tests.
	't4': {
		't4_basic_test': false,
		't4_upgrade_test': false,
		't4_dac_and_ain_test': false,
		't4_flash_based_data_test': false,
		't4_is_auth_test': false,
		't4_check_auth_and_upgrade_test': false,
		't4_check_calibration_test': false,

		// This is a windows only test as LJLogM is required.
		't4_check_calibration_while_disconnected_test': false,

		't4_read_recovery_fw_version_test': false,
	},
	't8': {
		't8_basic_test': false,
		't8_read_flash_data': false,
		't8_upgrade_test': false,
	},
	'dashboard': {
		'basic_test': false,
	},
	'external_app_tests': {
		'basic_test': false, // Opens device and shares it with LJLogM and LJStreamM. (Starts and stops the apps to verify functionality)
		'check_connection_types': false, // This test checks the available connection types of the first found LJ USB device.
	},
};

if (process.platform !== 'win32') {
	console.warn('LJLogM-based test not supported on non-Windows platforms');
	testGroups.external_app_tests.basic_test = false;
}


var fileNameBase = './';

function requireTest(groupName, fileNamePartials, isEnabled, destObj) {
	var filePath = '';
	var i;
	var testName = '';
	filePath += fileNameBase;
	if(groupName) {
		if(groupName !== '') {
			filePath += groupName + '/';
		}
	}

	testName += fileNamePartials[0];
	for(i = 1; i < fileNamePartials.length; i ++) {
		testName += '_' + fileNamePartials[i];
	}
	filePath += testName;

	if(isEnabled) {
		console.log(' - Requiring test file', filePath, groupName, testName);

		var basicGroupName = 'test';
		if(groupName) {
			if(groupName !== '') {
				basicGroupName = groupName;
			}
		}
		if(typeof(exports[basicGroupName]) === 'undefined') {
			exports[basicGroupName] = {};
		}
		exports[basicGroupName][testName] = require(filePath);
		// if(groupName !== '') {
		// 	exports[groupName] = require(filePath);
		// } else {
		// 	exports[testName] = require(filePath);
		// }
	} else {
		console.log(' - Skipping Test:', filePath);
	}
}

var groupKeys = Object.keys(testGroups);
groupKeys.forEach(function(groupKey) {
	var testGroup = testGroups[groupKey];

	// For each test group check to see if they are a test or loop through their
	// group contents.
	if(typeof(testGroup) === 'boolean') {
		requireTest('', [groupKey], testGroup, exports);
	} else {
		var testKeys = Object.keys(testGroup);
		testKeys.forEach(function(testKey) {
			// For each test in a group, require enabled tests.
			var test = testGroup[testKey];
			requireTest(groupKey, [testKey], test, exports);
		});
	}
});
