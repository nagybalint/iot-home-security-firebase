const functions = require('firebase-functions');
const admin = require('firebase-admin');

const register_mobile_user = require('./register_mobile_user');
const register_device = require('./register_device');
const send_push_notification = require('./send_push_notification');
const fetch_device_id = require('./fetch_device_id');
const add_device = require('./add_device');
const update_device_status = require('./update_device_status');
const send_command = require('./send_command');

admin.initializeApp(functions.config().firebase);

// Unauthenticated endpoints
exports.register_mobile_user = functions.https.onRequest(register_mobile_user);
exports.register_device = functions.https.onRequest(register_device);

// Authenticated callable endpoints
exports.fetch_device_id = functions.https.onCall(fetch_device_id);
exports.add_device = functions.https.onCall(add_device);
exports.send_command = functions.https.onCall(send_command);

// Pub/sub triggered endpoints
exports.onDeviceStateUpdate = functions.pubsub.topic('state').onPublish(update_device_status);
exports.onDeviceAlert = functions.pubsub.topic('alerts').onPublish(send_push_notification);
