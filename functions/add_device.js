const admin = require('firebase-admin');
const functions = require('firebase-functions');

verify_device = async (device_id, verification_code) => {
    console.log(`Verify device started with ${device_id}, ${verification_code}`);
    let deviceRecord = await admin.firestore().collection('devices').doc(device_id).get();
    if (!deviceRecord.exists) {
        console.log('Device not found');
        return {
            verified: false,
            error: `Device Id ${device_id} does not exist!`
        };
    }

    if(deviceRecord.get('verification_code') !== verification_code) {
        console.log('Code incorrect');
        return {
            verified: false,
            error: 'Incorrect Verification Code!'
        };
    }

    console.log('Device verification successful');

    return {
        verified: true,
        error: null
    };
}

registerDevice = async (uid, device_id) => {
    console.log(`Registering device started with ${uid}, ${device_id}`);
    let userRef = await admin.firestore().collection('users').doc(uid);
    await userRef.update({
        device_id: device_id
    });
    console.log('user.device_id set');
    
    let userRecord = await userRef.get();
    const fcm_token = userRecord.get('fcm_token');
    console.log(`fcm token read ${fcm_token}`);
    if (fcm_token) {
        let deviceRef = await admin.firestore().collection('devices').doc(device_id);
        deviceRef.update({
            users: admin.firestore.FieldValue.arrayUnion(fcm_token)
        });
        console.log('Device\'s user array updated');
    }

    console.log('Successful registration');
    return {
        success: true
    };
}

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
            'internal', // TODO get a better error code
            'A device id and verification code must be sent with the request!'
        );
    }

    const { device_id, verification_code } = data;

    console.log(`Correct request with ${device_id}, ${verification_code}`);

    try {
        let { verified, error } = await verify_device(device_id, verification_code);
        if(!verified) {
            console.log('Verification failed - outside');
            throw new functions.https.HttpsError(
                'internal',
                error
            );
        }

        console.log('Verification successful, registering device - outside');
        await registerDevice(uid, device_id);

        console.log('Registration successful, returning with success - outside');
        return {
            success: true
        };

    } catch (err) {
        console.log(`error ${err}`);

        if (err instanceof functions.https.HttpsError) {
            throw err;
        } else {
            throw new functions.https.HttpsError(
                'internal',
                'Something bad has happened :( Please try again!'
            );
        }
    }
}