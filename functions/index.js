const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const express = require('express');
const validateFirebaseIdToken = require('./validate_https_token');

const register_mobile_user = require('./register_mobile_user');
const register_device = require('./register_device');
const send_push_notification = require('./send_push_notification');
const fetch_device_id = require('./fetch_device_id');
const add_device = require('./add_device');
const update_device_status = require('./update_device_status');

admin.initializeApp(functions.config().firebase);

// Unauthenticated endpoints
exports.register_mobile_user = functions.https.onRequest(register_mobile_user);
exports.register_device = functions.https.onRequest(register_device);

// Authenticated callable endpoints
exports.fetch_device_id = functions.https.onCall(fetch_device_id);
exports.add_device = functions.https.onCall(add_device);

// Pub/sub triggered endpoints
exports.onDeviceStateUpdate = functions.pubsub.topic('state').onPublish(update_device_status);
exports.onDeviceAlert = functions.pubsub.topic('alerts').onPublish(send_push_notification);

// Authenticated https endpoints
//const app = express();
//
//app.use(cors);
//app.use(validateFirebaseIdToken);
//app.post('/send_push_notification', send_push_notification);
//
//exports.device_actions = functions.https.onRequest(app);
