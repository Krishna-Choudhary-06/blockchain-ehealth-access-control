'use strict';

const bgw = require('./broadcast');
const fabricService = require('./fabricService');

async function getRecord(dataId) {
  const record = await fabricService.getData(dataId);

  if (!record) {
    throw new Error(`Record ${dataId} not found`);
  }

  return record;
}

module.exports = {
  getRecord
};