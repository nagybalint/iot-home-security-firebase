const functions = require('firebase-functions');
const admin = require('firebase-admin');

const register_mobile_user = require('./register_mobile_user');
const send_push_notification = require('./send_push_notification');
const fetch_device_id = require('./fetch_device_id');

admin.initializeApp(functions.config().firebase);

// Unauthenticated endpoints
exports.register_mobile_user = functions.https.onRequest(register_mobile_user);
exports.send_push_notification = functions.https.onRequest(send_push_notification);

// Authenticated endpoints
exports.fetch_device_id = functions.https.onCall(fetch_device_id);

