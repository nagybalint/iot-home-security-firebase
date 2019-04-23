const admin = require('firebase-admin');

module.exports = async (message) => {

    console.log(message);

    const { data, attributes } = message;
    if (!data || !attributes) {
        console.log('Incorrect request');
        return;
    }

    const { deviceId } = attributes;

    if (!deviceId) {
        console.log('Device id not specified');
        return;
    }

    const decodedData = Buffer.from(data, 'base64').toString();
    console.log(decodedData);
    try {
        console.log(`Keys of str ${Object.keys(decodedData)}`);
    } catch (e) {
        console.log(e);
    }

    jsonData = JSON.parse(decodedData);

    console.log(jsonData);

    try {
        let result = await sendPushNotifications(deviceId, jsonData);
    } catch (error) {
        console.log('Error in sending push notifications');
        console.log(error);
    }

}

sendPushNotifications = async (device_id, message) => {

    const { title, body } = message;

    if (!title || !body) {
        console.log('Incorrect request body');
        return {
            success: false,
            error: 'Incorrect message body'
        };
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

    console.log(`Incoming request: ${device_id}, ${title}`);
    
    try {
        // Get the FCM tokens corresponding to the device
        let deviceRecord = await admin.firestore().collection('devices').doc(device_id).get();
        if(!deviceRecord.exists) {
            console.log(`The device with id ${device_id} does not exist in firestore`);
            return {
                success: false, 
                error: `Device ${device_id} does not exist`
            };
        }

        console.log("Device found in firestore");

        let users = deviceRecord.get('users');

        let tokens = new Array();

        for (const user of users) {
            tokens.push(user);
        }

        console.log(`Tokens: ${tokens}`);
        console.log(`Tokens type ${typeof tokens}`);
        console.log(`Token type ${typeof tokens[0]}`);

        // Send the notification to the individual apps registered for the device
        let responses = await admin.messaging().sendToDevice(tokens, payload);
        console.log('Responses');
        console.log(responses);
        return {
            success: true,
            error: null
        };

    } catch(error) {
        console.log(error);
        return {
            success: false,
            error: 'Internal error'
        };
    }
}