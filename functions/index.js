const functions = require('firebase-functions');
const admin = require('firebase-admin');

const register_mobile_user = require('./register_mobile_user');

admin.initializeApp(functions.config().firebase);

exports.register_mobile_user = functions.https.onRequest(register_mobile_user);

