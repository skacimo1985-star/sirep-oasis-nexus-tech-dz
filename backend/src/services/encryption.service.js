'use strict';

const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const config = require('../config/env');

const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, config.ENCRYPTION_KEY).toString();
};

const decrypt = (encryptedText) => {
  return CryptoJS.AES.decrypt(encryptedText, config.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
};

const hashData = (data) => {
  return CryptoJS.SHA256(String(data)).toString();
};

const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = { encrypt, decrypt, hashData, generateSecureToken };
