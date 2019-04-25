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

// 
// Unauthenticated https endpoints
//

/**
 * Endpoint for registering a new mobile user in firebase auth and firestore
 * @name Register mobile user
 * @route {POST} /register_mobile_user
 * @bodyparam {String} email Must be a valid email address
 * @bodyparam {String} password Must be at least 6 characters long
 * @code {201} If the request is successful
 * @code {422} If the request body is incorrect or incomplete
 * @code {409} If the email address is already in use
 * @code {403} If the password is not valid
 * @code {500} On internal errors
 * @response {String} status Status message
 */
exports.register_mobile_user = functions.https.onRequest(register_mobile_user);

/**
 * Endpoint for registering a new IoT device in firestore
 * @name Register IoT device
 * @route {POST} /register_device
 * @bodyparam {String} device_id The id of the IoT device in Google Cloud IoT Core and firestore
 * @bodyparam {String} verification_code Verification code which the mobile user has to enter when adding the device
 * @bodyparam {String} registry The Google Cloud IoT Core registry the device is registered in
 * @code {201} If the request is successful
 * @code {409} If the device already exists in firestore
 * @code {422} If the request body is incorrect or incomplete
 * @code {500} On internal errors
 * @response {String} status Status message
 */
exports.register_device = functions.https.onRequest(register_device);

//
// Authenticated callable endpoints
// 

/**
 * Endpoint for fetching the device id registered for a user
 * Authenticated callable endpoint
 * @name Fetch device id
 * @function fetch_device_id
 * @async
 * @return {firebase.functions.HttpsCallableResult} result The device id can be extacted from the .data.device_id property of the response
 * @throws {firebase.https.HttpsError} error Possible error codes: not-found, internal
 * @example
 * // Example for calling the endpoint from a react native app
 * // A USER MUST BE LOGGED IN BEFORE CALLING THE ENDPOINT
 * import firebase from 'react-native-firebase';
 * let fetchDeviceId = firebase.functions().httpsCallable('fetch_device_id');
 * try {
 *     let result = await fetchDeviceId.call({ });
 *     const { device_id } = result.data;
 * } catch (error) {
 *     const { code, message } = error;
 *     console.log(code, message);
 * }
 */
exports.fetch_device_id = functions.https.onCall(fetch_device_id);

/**
 * Endpoint for registering an IoT device for a mobile user
 * Authenticated callable endpoint
 * @name Add device
 * @function add_device
 * @async
 * @param {Object} data 
 * @param {String} data.device_id The id of the IoT device the user wants to add
 * @param {String} data.verification_code The verification code of the IoT device
 * @return {firebase.functions.HttpsCallableResult} result The result.data object contains the .success <bool> property, which is always true
 * @throws {firebase.https.HttpsError} error Possible error codes: unauthenticated, invalid-argument, internal, not-found
 * @example
 * // Example for calling the endpoint from a react native app
 * // A USER MUST BE LOGGED IN BEFORE CALLING THE ENDPOINT
 * import firebase from 'react-native-firebase';
 * const device_id = "test_id";
 * const verification_code = "123456".
 * let addDevice = firebase.functions().httpsCallable('add_device');
 * try {
 *     let result = await addDevice.call({ device_id, verification_code });
 *     const { success } = result.data;
 * } catch (error) {
 *     const { code, message } = error;
 *     console.log(code, message);
 * }
 */
exports.add_device = functions.https.onCall(add_device);

/**
 * Endpoint for sending a command to the IoT device registered for a user
 * @name Send command
 */
exports.send_command = functions.https.onCall(send_command);

// 
// Pub/sub triggered endpoints
//

/**
 * Endpoint for saving the status sent by the IoT device to firebase
 * @name Update device status
 */
exports.on_device_state_update = functions.pubsub.topic('state').onPublish(update_device_status);
/**
 * Endpoint for forwarding the alert sent by the IoT device as push notifications 
 * to the users who have this device registered
 * @name Send push notifications
 */
exports.on_device_alert = functions.pubsub.topic('alerts').onPublish(send_push_notification);
