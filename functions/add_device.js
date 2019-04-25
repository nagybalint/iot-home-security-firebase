const admin = require('firebase-admin');
const functions = require('firebase-functions');

module.exports = async (data, context) => {
    // Only authenticated users can user this endpoint
    if(!context.auth) {
        console.log(`Unauthenticated function call`);
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be authenticated to call this endpoint!'
        );
    }

    const { uid } = context.auth;

    console.log(`Authenticated call with id ${uid}`);

    if (!data.device_id || !data.verification_code) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'A device id and verification code must be sent with the request!'
        );
    }

    const { device_id, verification_code } = data;

    console.log(`Correct request with ${device_id}, ${verification_code}`);

    try {
        // Check if the verification code is correct
        await verify_device(device_id, verification_code);
        // Register device for the user in firestore
        await registerDevice(uid, device_id);

        console.log('Registration successful');

        return {
            success: true
        };

    } catch (error) {
        console.log(`Error ${error}`);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        } else {
            throw new functions.https.HttpsError(
                'internal',
                'Something bad has happened :( Please try again!'
            );
        }
    }
}

verify_device = async (device_id, verification_code) => {
    console.log(`Verifying registration code ${verification_code} for device ${device_id}`);

    let deviceRecord = await admin.firestore().collection('devices').doc(device_id).get();
    if (!deviceRecord.exists) {
        console.log('Device not found');
        throw new functions.https.HttpsError(
            'not-found',
            `Device Id ${device_id} not found!`
        );
    }

    if(deviceRecord.get('verification_code') !== verification_code) {
        console.log('Incorrect verification code');
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Incorrect Verification Code!'
        );
    }

    console.log('Device verification successful');

    return;
}

registerDevice = async (uid, device_id) => {
    console.log(`Registering device ${device_id} for user ${uid}`);

    let userRef = await admin.firestore().collection('users').doc(uid);
    let userRecord = await userRef.get();

    if(!userRecord.exists) {
        console.log('User record not found in firestore');
        throw new functions.https.HttpsError(
            'not-found',
            'User not found!'
        );
    }

    // Adding the user's fcm token to the device record, if the fcm token is known for the user
    const fcm_token = userRecord.get('fcm_token');
        
    if (fcm_token) {
        let deviceRef = await admin.firestore().collection('devices').doc(device_id);
        deviceRef.update({
            users: admin.firestore.FieldValue.arrayUnion(fcm_token)
        });
        console.log('Device\'s user array updated');
    }

    // Adding the device_id to the user record
    await userRef.update({
        device_id: device_id
    });

    console.log('Device id added to the user record');

    console.log('Successful device registration');

    return;
}
