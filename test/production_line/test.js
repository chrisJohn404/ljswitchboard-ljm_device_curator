process.on('uncaughtException', function(err) {
	console.log('ERROR!!!', err);
	console.log(err.stack);
	process.exit();
});


/********************** Require tests *****************************************/
var t7_upgrade_recovery_image_test = require('./upgrade_recovery_firmware');
var t7_upgrade_test = require('./upgrade_primary_firmware');


/********************** Perform tests *****************************************/
exports.t7_upgrade_recovery_image_test = t7_upgrade_recovery_image_test;
exports.t7_upgrade_test = t7_upgrade_test.tests;								// Passing
