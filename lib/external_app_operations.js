

    
var q = require('q');
var fs = require('fs');
var path = require('path');
var modbusMap = require('ljswitchboard-modbus_map').getConstants();
var async = require('async');
var lj_apps_win_registry_info = require('lj-apps-win-registry-info');
var driver_const = require('ljswitchboard-ljm_driver_constants');
var getLJAppsRegistryInfo = lj_apps_win_registry_info.getLJAppsRegistryInfo;
var ljAppNames = lj_apps_win_registry_info.ljAppNames;

var events = require('./device_events');

var DEBUG_EXTERNAL_APPLICATION_OPERATIONS = false;
var DEBUG_OPEN_APPLICATION_OPERATION = false;
var ENABLE_ERROR_OUTPUT = false;

function getLogger(bool) {
	return function logger() {
		if(bool) {
			console.log.apply(console, arguments);
		}
	};
}

var debugEAOps = getLogger(DEBUG_EXTERNAL_APPLICATION_OPERATIONS);
var debugOA = getLogger(DEBUG_OPEN_APPLICATION_OPERATION);
var errorLog = getLogger(ENABLE_ERROR_OUTPUT);


var appOpenConfigFiles = {
    'LJLogM': 'LJLogM_open.cfg',
    'LJStreamM': 'LJstreamM_open.cfg',
    'LJLogUD': 'LJlogUD_open.cfg',
    'LJStreamUD': 'LJstreamUD_open.cfg',
};

var ljAppsBasePath = 'C:\\Program Files (x86)\\LabJack\\Applications';
var appExeNames = {
    'LJLogM': 'LJLogM.exe',
    'LJStreamM': 'LJStreamM.exe',
    'LJLogUD': 'LJLogUD.exe',
    'LJStreamUD': 'LJStreamUD.exe',
};
var appExePaths = {};
Object.keys(appExeNames).forEach(function(appExeKey) {
    appExePaths[appExeKey] = path.join(ljAppsBasePath, appExeNames[appExeKey]);
});




/*
 * Most of the documentation on this feature of the T7
 * is available on the webpage:
 * https://labjack.com/support/datasheets/t7/sd-card
*/
function getExternalAppOperations(self) {
	var operationToRegisterNames = {
		'pwd': 'FILE_IO_DIR_CURRENT',
	};

    function createOpenDeviceInExtAppBundle(options) {
        var ctStr;
        var preventCloseAndOpen = false;
        var appName = 'NONE';
        var detached = true;

        // Check "connection type"
        if(options.ct) {
            if(options.ct === 'current') {
                ctStr = self.savedAttributes.connectionType;
            } else {
               ctStr = options.ct; 
            }
        } else {
            ctStr = self.savedAttributes.connectionType;
        }

        // Check "preventCloseAndOpen" flag
        if(typeof(options.preventCloseAndOpen) === 'boolean') {
            preventCloseAndOpen = options.preventCloseAndOpen;
        }

        // Check application name option
        if(options.appName) {
            appName = options.appName;
        }

        if(typeof(options.detached) === 'boolean') {
            detached = options.detached;
        }

        var ct = driver_const.connectionTypes[ctStr];

        var bundle = {
            'appName': appName,
            'appWorkingDir': '',
            'openConfigFilePath': '',
            'appExePath': appExePaths[appName],
            'deviceInfo': {
                'dt': self.savedAttributes.deviceType,
                'ct': ct,
                'id': undefined,
            },
            'curDeviceInfo': {
                'dt': self.savedAttributes.deviceType,
                'ct': self.savedAttributes.connectionType,
                'id': undefined,
            },
            'ctName': driver_const.CONNECTION_TYPE_NAMES[ct],
            'availableConnections': [],
            'closeAndOpenDevice': true,
            'preventCloseAndOpen': preventCloseAndOpen,

            'detached': detached,

            'currentAppOpenCFG': '',
            'appExists': false,
            'registryInfo': {},
            'isError': false,
            'errorStep': '',
            'error': undefined
        };
        return bundle;
    }

    function getAvailableConnectionsAndDetermineSharability(bundle) {
        debugOA('in getAvailableConnectionsAndDetermineSharability');
        var defered = q.defer();
        self.cGetAvailableConnectionTypes()
        .then(function(res) {
            bundle.availableConnections = res.connections;
            defered.resolve(bundle);
        }, function(err) {
            // Not a valid case...
            defered.resolve(bundle);
        });
        return defered.promise;
    }
    function determineConnectionSharability(bundle) {
        
        var defered = q.defer();
        var connections = bundle.availableConnections;
        // If the user is requesting a not-found connection type we don't need to close/open the device.
        // aka default value should be True.

        var desiredCTIsActiveCT = false;

        var isConnectable = true; 
        var deviceID = self.savedAttributes.serialNumber.toString();
        connections.forEach(function(connection) {
            if(connection.type === bundle.ctName) {
                isConnectable = connection.isConnectable;
                deviceID = connection.id;
            }
        });

        // save device identifier string.
        bundle.deviceInfo.id = deviceID;
        
        if(isConnectable) {
            bundle.closeAndOpenDevice = false;
        } else {
            bundle.closeAndOpenDevice = true;
        }

        // Check to see if the desired CT is the same as the current CT to 
        // see if opening and closing the CT is even necessary...
        if(bundle.deviceInfo.ct != bundle.curDeviceInfo.ct) {
            bundle.closeAndOpenDevice = false;
        }

        // If user specified to disable this feature than make sure the active
        // device isn't opened/closed.
        if(bundle.preventCloseAndOpen) {
            bundle.closeAndOpenDevice = false;
        }
        
        defered.resolve(bundle);
        return defered.promise;
    }
    function getApplicationWorkingDirectories(bundle) {
        var defered = q.defer();

        getLJAppsRegistryInfo(ljAppNames, function(err, info) {
            bundle.registryInfo = info;
            var appName = bundle.appName;
            if(info[appName]) {
                bundle.appWorkingDir = info[appName].workdir;
                var cfgFilePath = path.join(bundle.appWorkingDir, appOpenConfigFiles[appName]);
                bundle.openConfigFilePath = cfgFilePath;
            } else {
                bundle.isError = true;
                bundle.errorStep = 'getApplicationWorkingDirectories';
            }
            defered.resolve(bundle);
        });

        return defered.promise;
    }
    function getOpenConfigFileData(bundle) {
        var defered = q.defer();
        
        var filePath = bundle.openConfigFilePath;
        debugOA('in getOpenConfigFileData:', filePath);

        fs.readFile(filePath, function(err, data) {
            if(err) {
                fs.readFile(filePath, function(err, data) {
                    if(err) {
                        fs.readFile(filePath, function(err, data) {
                            if(err) {
                                console.error('Error Reading File', err, filePath);
                                bundle.isError = true;
                                bundle.error = err;
                                bundle.errorStep = 'readOpenConfigFile';
                                defered.resolve(bundle);
                            } else {
                                bundle.currentAppOpenCFG = data.toString();
                                defered.resolve(bundle);
                            }
                        });
                    } else {
                        bundle.currentAppOpenCFG = data.toString();
                        defered.resolve(bundle);
                    }
                });
            } else {
                bundle.currentAppOpenCFG = data.toString();
                defered.resolve(bundle);
            }
        });

        return defered.promise;
    }

    function generateOpenDeviceText (deviceInfo) {
        var str = '[Main]\r\n';
        str += 'DeviceType=' + deviceInfo.dt + '\r\n';
        str += 'ConnectionType=' + deviceInfo.ct + '\r\n';
        str += 'Identifier=' + deviceInfo.id + '\r\n';
        return str;
    }

    function editOpenConfigFile(bundle) {
        var defered = q.defer();
        
        var filePath = bundle.openConfigFilePath;
        var data = generateOpenDeviceText(bundle.deviceInfo);
        debugOA('in editOpenConfigFile:', filePath, data);

        fs.writeFile(filePath, data, function(err) {
			if(err) {
				fs.writeFile(filePath, data, function(err) {
					if(err) {
						fs.writeFile(filePath, data, function(err) {
							if(err) {
								console.error('Error Writing File', err, filePath);
                                bundle.isError = true;
                                bundle.error = err;
                                bundle.errorStep = 'editOpenConfigFile';
								defered.resolve(bundle);
							} else {
								defered.resolve(bundle);
							}
						});
					} else {
						defered.resolve(bundle);
					}
				});
			} else {
				defered.resolve(bundle);
			}
		});

        return defered.promise;
    }
    function restoreOpenConfigFileData(bundle) {
        var defered = q.defer();
        
        var filePath = bundle.openConfigFilePath;
        var data = bundle.currentAppOpenCFG;
        debugOA('in restoreOpenConfigFileData:', filePath, data);

        fs.writeFile(filePath, data, function(err) {
            if(err) {
                fs.writeFile(filePath, data, function(err) {
                    if(err) {
                        fs.writeFile(filePath, data, function(err) {
                            if(err) {
                                console.error('Error Writing File', err, filePath);
                                bundle.isError = true;
                                bundle.error = err;
                                bundle.errorStep = 'restoreOpenConfigFileData';
                                defered.resolve(bundle);
                            } else {
                                defered.resolve(bundle);
                            }
                        });
                    } else {
                        defered.resolve(bundle);
                    }
                });
            } else {
                defered.resolve(bundle);
            }
        });

        return defered.promise;
    }
    function verifyAppexists(bundle) {
        var defered = q.defer();
        var filePath = bundle.appExePath;
        debugOA('in verifyAppexists',filePath);

        fs.access(filePath, fs.constants.F_OK, function(err) {
            if(err) {
                bundle.appExists = false;
                bundle.isError = true;
                bundle.error = 'App does not exist at path: '+filePath;
                bundle.errorStep = 'verifyAppexists';

            } else {
                bundle.appExists = true;
            }
            defered.resolve(bundle);
        });

        return defered.promise;
    }
    function suspendDeviceConnection(bundle) {
        var defered = q.defer();

        debugOA('in suspendDeviceConnection');

        if(bundle.closeAndOpenDevice) {
            self.suspendDeviceConnection()
            .then(function() {
                self.savedAttributes.isShared = true;
                self.savedAttributes.sharedAppName = bundle.appName;
                self.emit(events.DEVICE_RELEASED, {
                    attrs: self.savedAttributes,
                    shared: true,
                    appName: bundle.appName,
                });
                // Also emit new saved attributes event.
                self.updateSavedAttributes()
                .then(function() {
                    defered.resolve(bundle);
                });
            }, function(err) {
                bundle.isError = true;
                bundle.error = err;
                bundle.errorStep = 'suspendDeviceConnection';
                defered.resolve(bundle);
            });
        } else {
            defered.resolve(bundle);
        }
        return defered.promise;
    }

    function openExternalApplication(bundle) {
        var defered = q.defer();
        debugOA('in openExternalApplication', bundle);


        
        // console.log('Exec Path...', bundle.appExePath);
        /*
        // Start program using execFile
        var execFile = require('child_process').execFile;
        var child = execFile(bundle.appExePath, function(error, stdout, stderr) {
            debugOA('Finished executing external application');
            if(error) {
                console.log('ERROR!',error);
            }
            defered.resolve(bundle);
        });
        */
        
        var spawn = require('child_process').spawn;
        var child = spawn(bundle.appExePath, [], {
            detached:bundle.detached,
        });
        child.stdout.on('data', function cpStdout(data) {

        });
        child.stderr.on('data', function cpStdErr(data) {

        });
        child.on('close', function cpClose(code) {
            debugOA('Finished executing external application');
            defered.resolve(bundle);
        });
        child.unref();
        // console.log('App-PID:', child.pid);
        
        return defered.promise;
    }

    function resumeDeviceConnection(bundle) {
        var defered = q.defer();
        debugOA('in resumeDeviceConnection');

        if(bundle.closeAndOpenDevice) {
            self.resumeDeviceConnection()
            .then(function() {
                // console.log('Emitting device acquired event', bundle.appName);
                self.savedAttributes.isShared = false;
                self.savedAttributes.sharedAppName = bundle.appName;
                self.emit(events.DEVICE_ACQUIRED, {
                    attrs: self.savedAttributes,
                    shared: false,
                    appName: bundle.appName,
                });
                // Also emit new saved attributes event.
                self.updateSavedAttributes()
                .then(function() {
                    defered.resolve(bundle);
                });
            }, function(err) {
                bundle.isError = true;
                bundle.error = err;
                bundle.errorStep = 'resumeDeviceConnection';
                defered.resolve(bundle);
            });
        } else {
            defered.resolve(bundle);
        }
        return defered.promise;
    }

    function skipOnError(func) {
        return function checkForError(bundle) {
            if(bundle.isError) {
                var defered = q.defer();
                defered.resolve(bundle);
                return defered.promise;
            } else {
                return func(bundle);
            }
        };
    }
    this.openDeviceInExternalApplicationOptions = function(options) {
        var defered = q.defer();

        var bundle = createOpenDeviceInExtAppBundle(options);

        function onSuccess(successBundle) {
            // debugOA('Success Bundle', successBundle);
            defered.resolve(successBundle);
        }
        function onError(errorBundle) {
            defered.reject(errorBundle);
        }
        getAvailableConnectionsAndDetermineSharability(bundle)
        .then(skipOnError(determineConnectionSharability))
        .then(skipOnError(getApplicationWorkingDirectories))
        .then(skipOnError(getOpenConfigFileData))
        .then(skipOnError(verifyAppexists))
        .then(skipOnError(editOpenConfigFile))
        .then(skipOnError(suspendDeviceConnection))
        .then(skipOnError(openExternalApplication))
        .then(skipOnError(resumeDeviceConnection))
        // .then(skipOnError(restoreOpenConfigFileData))
        .then(onSuccess, onError);

        return defered.promise;
    }
	this.openDeviceInExternalApplication = function(ljmApplicationName,ct, pCO) {
        

        var connectionType = 'current';
        if(ct) {
            if(ct === 'current') {
                connectionType = ct;
            } else {
                try {
                    connectionType = driver_const.connectionTypes[ct];
                } catch(err) {
                    // Do nothing.
                }
            }
        }
        var preventCloseAndOpen = false;
        if(typeof(pCO) === 'boolean') {
            preventCloseAndOpen = pCO;
        }

        var options = {
            'appName': ljmApplicationName,
            'ct': connectionType,
            'preventCloseAndOpen': preventCloseAndOpen,
        };
        return this.openDeviceInExternalApplicationOptions(options);
	};
    this.openDeviceInLJLogM = function(ct, pCO) {
        return self.openDeviceInExternalApplication('LJLogM',ct, pCO);
    }
    this.openDeviceInLJStreamM = function(ct, pCO) {
        return self.openDeviceInExternalApplication('LJStreamM',ct, pCO);
    }
}

module.exports.get = getExternalAppOperations;