

var q = require('q');
var util = require('util');

var qRunner = function(test, func) {
	var defered = q.defer();
	try {
		func()
		.then(function(res) {
			defered.resolve(res);
		}, function(err) {
			console.log('qRunner defered error err', err);
			test.ok(false, err);
			test.done();
		}, function(err) {
			console.log('qRunner syntax error err', err);
			test.ok(false, err);
			test.done();
		});
	} catch(err) {
			console.log('qRunner critical error err', err);
			test.ok(false, err);
			test.done();
		}
	return defered.promise;
};
exports.qRunner = qRunner;

// define a q function that calls an object's function and saves data into an 
// array
var qExec = function(obj, func, argA, argB, argC) {
	return function(bundle) {
		var defered = q.defer();
		try {
			obj[func](argA, argB, argC)
			.then(function(data) {
				bundle.push({'functionCall':func, 'retData': data});
				defered.resolve(bundle);
			}, function(err) {
				bundle.push({'functionCall':func, 'errData': err});
				defered.resolve(bundle);
			});
		} catch(err) {
			console.error('Error calling', func, argA, argB, argC, err);
			console.error(err.stack);
		}
		return defered.promise;
	};
};
exports.qExec = qExec;

var pResults = function(results, pIndividual, expectedErrorsList) {
	var defered = q.defer();
	var numSuccess = 0;
	var numFail = 0;
	if(pIndividual) {
		console.log(' - Num Results', results.length);
	}
	results.forEach(function(result) {
		var message = '   - ';
		var data;
		var keys = Object.keys(result);
		if(keys.indexOf('retData') >= 0) {
			message += 'Success: ';
			data = result.retData;
			numSuccess += 1;
		} else {
			if(expectedErrorsList.indexOf(result.functionCall) < 0) {
				message += 'Error: ';
				data = result.errData;
				numFail += 1;
			} else {
				message += 'Expected Error: ';
				data = result.errData;
				numSuccess += 1;
			}
			
		}
		message += result.functionCall;
		if(pIndividual) {
			console.log(message + util.format(', %j',data));
		}
	});

	if(!pIndividual) {
		var num = results.length;
		var ratio = (numSuccess/num*100).toFixed(3);
		console.log(' - Num Results %d, %d% successful', num, ratio);
	}
	
	defered.resolve(results);
	return defered.promise;
};
exports.pResults = pResults;

var testResults = function(test, expectedResults, results, resultKey) {
	if(results.length !== expectedResults.length) {
		test.ok(false, 'num results does not match');
	}
	var i = 0;
	for(i = 0; i < results.length; i++) {
		var expectedResult = expectedResults[i];
		var result = results[i];
		var fCall = 'proper function not called';
		test.strictEqual(expectedResult.functionCall, result.functionCall, fCall);
		var type = 'value';
		if(expectedResult.type) {
			type = expectedResult.type;
		}
		if(type === 'value') {
			var datamsg = 'bad value detected';
			if(resultKey) {
				test.strictEqual(expectedResult.retData, result.retData[resultKey], datamsg);
			} else {
				test.strictEqual(expectedResult.retData, result.retData, datamsg);
			}
		} else if (type === 'range') {
			var rangemsg = 'value out of range';
			var valueInRange = true;
			if(resultKey) {
				if(result.retData[resultKey] < expectedResult.min) {
					valueInRange = false;
					rangemsg += ': value to low, val: ' + result.retData[resultKey].toString();
					rangemsg += ', minVal: ' + expectedResult.min.toString();
				}
				if(result.retData[resultKey] > expectedResult.max) {
					valueInRange = false;
					rangemsg += ': value to high, val: ' + result.retData[resultKey].toString();
					rangemsg += ', maxVal: ' + expectedResult.max.toString();
				}
				test.ok(valueInRange, rangemsg);
			} else {
				if(result.retData < expectedResult.min) {
					valueInRange = false;
					rangemsg += ': value to low, val: ' + result.retData.toString();
					rangemsg += ', minVal: ' + expectedResult.min.toString();
				}
				if(result.retData > expectedResult.max) {
					valueInRange = false;
					rangemsg += ': value to high, val: ' + result.retData.toString();
					rangemsg += ', maxVal: ' + expectedResult.max.toString();
				}
				test.ok(valueInRange, rangemsg);
			}
		}
	}
};
exports.testResults = testResults;

var testResultsArray = function(test, expectedResults, results, resultKey) {
	if(results.length !== expectedResults.length) {
		test.ok(false, 'num results does not match');
	}
	var i = 0;
	var j = 0;
	for(i = 0; i < results.length; i++) {
		var expectedResult = expectedResults[i];
		var result = results[i];
		var fCall = 'proper function not called';
		test.strictEqual(expectedResult.functionCall, result.functionCall, fCall);
		
		if(result.retData.length !== expectedResult.retData.length) {
			test.ok(false, 'length of retData does not match');
		}
		for(j = 0; j < result.retData.length; j++) {
			var res = result.retData[j];
			var expectedRes = expectedResult.retData[j];
			var addrmsg = 'Wrong address read';
			// Perform switch to compensate for iRead commands
			if(isNaN(res.address)) {
				test.strictEqual(expectedRes.address, res.address, addrmsg);
			} else {
				test.strictEqual(expectedRes.address, res.name, addrmsg);
			}
			
			if(res.isErr) {
				var errmsg = 'wrong error boolean result';
				test.strictEqual(expectedRes.isErr, res.isErr, errmsg);
			}
			

			var type = 'value';
			if(expectedRes.type) {
				type = expectedRes.type;
			}
			if(type === 'value') {
				var datamsg = 'bad value detected';
				if(resultKey) {
					test.strictEqual(expectedRes.data, res.data[resultKey], datamsg);
				} else {
					test.strictEqual(expectedRes.data, res.data, datamsg);
				}
			} else if (type === 'range') {
				var rangemsg = 'value out of range';
				var valueInRange = true;
				var testVal = res;
				if(res.data) {
					testVal = res.data;
				}
				if(resultKey) {
					if(testVal[resultKey] < expectedRes.min) {
						valueInRange = false;
						rangemsg += ': value to low, val: ' + testVal[resultKey].toString();
						rangemsg += ', minVal: ' + expectedRes.min.toString();
					}
					if(testVal[resultKey] > expectedRes.max) {
						valueInRange = false;
						rangemsg += ': value to high, val: ' + testVal[resultKey].toString();
						rangemsg += ', maxVal: ' + expectedRes.max.toString();
					}
				} else {
					if(testVal < expectedRes.min) {
						valueInRange = false;
						rangemsg += ': value to low, val: ' + testVal.toString();
						rangemsg += ', minVal: ' + expectedRes.min.toString();
					}
					if(testVal > expectedRes.max) {
						valueInRange = false;
						rangemsg += ': value to high, val: ' + testVal.toString();
						rangemsg += ', maxVal: ' + expectedRes.max.toString();
					}
				}
				test.ok(valueInRange, rangemsg);
			}
		}
	}
};
exports.testResultsArray = testResultsArray;