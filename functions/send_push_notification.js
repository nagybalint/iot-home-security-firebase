const admin = require('firebase-admin');
const functions = require('firebase-functions');

module.exports = async (message) => {

    const { data, attributes } = message;
    if (!data || !attributes) {
        console.log('Incorrect request');
        console.log(message);
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Request body incorrect or incomplete'
        );
    }

    const { deviceId } = attributes;

    if (!deviceId) {
        console.log('Device id not specified');
        console.log(message);
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Request body incorrect or incomplete - a device id must be sent with the request'
        );
    }

    console.log('Decoding message data');

    const decodedData = Buffer.from(data, 'base64').toString();
    jsonData = JSON.parse(decodedData);

    console.log(jsonData);

    try {
        // Send push notifications
        let result = await sendPushNotifications(deviceId, jsonData);
    } catch (error) {
        console.log('Error in sending push notifications');
        console.log(error);
        throw error;
    }

}

sendPushNotifications = async (device_id, message) => {

    const { title, body } = message;

    if (!title || !body) {
        console.log('Incorrect request body');
        throw new functions.https.HttpsError(
            'invalid-argument',
            'A notification title and body must be sent with the request'
        );
    }

    const payload = {
        notification: {
            title,
            body
        },
        data: {
            title, 
            body
        }
    }

    console.log(`Incoming request: ${device_id}, ${title}, ${body}`);
    
    // Get the FCM tokens corresponding to the device
    let deviceRecord = await admin.firestore().collection('devices').doc(device_id).get();
    if(!deviceRecord.exists) {
        console.log(`The device with id ${device_id} does not exist in firestore`);
        throw new functions.https.HttpsError(
            'not-found',
            'Device not found!'
        );
    }

    console.log("Device found in firestore");

    let users = deviceRecord.get('users');

    let tokens = new Array();

    for (const user of users) {
        tokens.push(user);
    }

    console.log(`Sending notification to the following tokens: ${tokens}`);
    
    // Send the notification to the individual apps registered for the device
    let responses = await admin.messaging().sendToDevice(tokens, payload);

    console.log('Notifications sent - Responses:');
    console.log(responses);
    
    return;

}