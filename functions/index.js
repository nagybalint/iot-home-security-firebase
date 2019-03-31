const functions = require('firebase-functions');
const admin = require('firebase-admin');

const register_mobile_user = require('./register_mobile_user');
const send_push_notification = require('./send_push_notification');

admin.initializeApp(functions.config().firebase);

exports.register_mobile_user = functions.https.onRequest(register_mobile_user);
exports.send_push_notification = functions.https.onRequest(send_push_notification);

