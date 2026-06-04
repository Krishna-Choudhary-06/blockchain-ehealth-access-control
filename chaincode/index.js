'use strict';

const UserRegistry = require('./lib/userRegistry');
const PrivacyLevel = require('./lib/privacyLevel');
const DataStorage  = require('./lib/dataStorage');
const DataAccess   = require('./lib/dataAccess');

module.exports.UserRegistry = UserRegistry;
module.exports.PrivacyLevel = PrivacyLevel;
module.exports.DataStorage  = DataStorage;
module.exports.DataAccess   = DataAccess;
module.exports.contracts    = [
    UserRegistry,
    PrivacyLevel,
    DataStorage,
    DataAccess
];