const admin = require('firebase-admin');
const functions = require('firebase-functions');

module.exports = async (message) => {
    console.log('Endpoint called');

    const { data, attributes } = message;

    if (!data || !attributes) {
        console.log('Incorrect request - missing attributes');
        console.log(message);
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Request body incorrect or incomplete'
        );
    }

    const { deviceId } = attributes;

    if (!deviceId) {
        console.log('Incorrect request - device Id not provided');
        console.log(message);
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Request body does not contain a device id'
        );
    }

    console.log('Correct request body');

    console.log('Decoding message data');
    decodedData = Buffer.from(data, 'base64').toString();
    status = JSON.parse(decodedData);

    try {
        // Update device status in firestore and storage
        await updateStatus(deviceId, status);
    } catch (error) {
        console.log(error);
        throw error;
    }
}

updateStatus = async (device_id, status) => {
    const { camera_image, motion_sensor_status } = status;

    let newState = {
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    if(!camera_image) {
        console.log('Camera image not sent'); 
    } else {
        console.log('Converting camera image to jpg');
        // Convert camera image from b64 to jpeg
        jpegImg = Buffer.from(camera_image, 'base64');

        console.log('Saving image to storage');
        // Save image to firebase storage
        const bucket = admin.storage().bucket();

        const filename = `${device_id}.jpg`;

        const file = bucket.file(filename);
        await file.save(jpegImg);
        newState.camera_image = filename;
    }

    if(typeof motion_sensor_status === 'undefined') {
        console.log('Motion status not sent');
    } else {
        newState.motion_status  = motion_sensor_status ? true : false;
    }

    console.log('Updating device state in firestore');
    // Update firestore data for the device
    let deviceRef = await admin.firestore().collection('devices').doc(device_id);
    await deviceRef.update({
        state: newState
    });
    
}