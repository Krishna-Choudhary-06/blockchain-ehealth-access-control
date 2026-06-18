'use strict';

const UserRegistry = require('./lib/userRegistry');
const PrivacyLevel = require('./lib/privacyLevel');
const DataStorage  = require('./lib/dataStorage');
const DataAccess   = require('./lib/dataAccess');

module.exports.contracts = [
    UserRegistry,
    PrivacyLevel,
    DataStorage,
    DataAccess
];
