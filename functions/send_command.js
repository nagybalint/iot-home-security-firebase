const { google } = require('googleapis');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

const DISCOVERY_API = 'https://cloudiot.googleapis.com/$discovery/rest';
const API_VERSION = 'v1';
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const CLOUD_REGION = 'us-central1';

const COMMAND_MESSAGE = 'status_update_request';

module.exports = async (data, context) => {
    // Only authenticated users can user this endpoint
    if(!context.auth) {
        console.log(`Unauthenticated function call`);
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be authenticated to call this endpoint'
        );
    }

    const { uid } = context.auth;

    console.log(`Authenticated call with id ${uid}`);

    let result = await sendStatusUpdateCommand(uid);
    const { success } = result;
    if(success) {
        return {
            success: true
        };
    }
    
    throw new functions.https.HttpsError(
        'internal',
        'Sending command to device not successful'
    );

}


sendStatusUpdateCommand = async (uid) => {

    console.log('Sending status update request');

    try {
        let deviceInfo = await getDeviceInfo(uid);
        const { device_id, registry } = deviceInfo;
        let client = await getClient();
        let response = await sendCommand(client, registry, device_id, COMMAND_MESSAGE);

        console.log('sendCommand returned');
        console.log(response);

        const { status } = response;
        if(status.toString() !== "200") {
            throw new functions.https.HttpsError(
                'internal',
                'Sending status update request failed! Please try again!'
            );
        }

        console.log('Sending status update request successful');

        return {
            success: true
        };

    } catch (error) {
        console.log(error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        } else {
            throw new functions.https.HttpsError(
                'internal',
                'Sending status update request failed! Please try again!'
            );
        }
    }

}

getClient = async () => {
    console.log('Getting client');
    
    let authClient = await google.auth.getClient({
        keyFilename: './service-account-iot-core.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    console.log('Authclient received');

    google.options({
        auth: authClient
    });

    console.log('Auth options set');

    const discoveryURL = `${DISCOVERY_API}?version=${API_VERSION}`;

    console.log(`Discovering ${discoveryURL}`);

    let client = await google.discoverAPI(discoveryURL);

    console.log('Client retrieved');
    return client;
}

getDeviceInfo = async (uid) => {
    console.log(`Fetching device id for user ${uid}`);

    let userRef = await admin.firestore().collection('users').doc(uid);
    let userDoc = await userRef.get();

    if(!userDoc.exists) {
        throw new functions.https.HttpsError(
            'not-found',
            'User not found'
        );
    }

    const deviceId = userDoc.get('device_id');
    
    if(!deviceId) {
        throw new functions.https.HttpsError(
            'not-found',
            'No device id registered for the user'
        );
    }

    let deviceRef = await admin.firestore().collection('devices').doc(deviceId);
    let deviceDoc = await deviceRef.get();

    if(!deviceDoc.exists) {
        throw new functions.https.HttpsError(
            'not-found',
            'Device not found'
        );
    }

    const registry = deviceDoc.get('registry');

    if(!registry) {
        throw new functions.https.HttpsError(
            'internal',
            'No registry information available for the device'
        );
    }

    const deviceInfo = {
        device_id: deviceId,
        registry
    }

    console.log(`Device info fetched successfully - ${deviceInfo}`);

    return deviceInfo;
}

sendCommand = (client, registry, deviceId, commandMessage) => {
    console.log(`Sending command to ${registry}/devices/${deviceId}`);

    const registryName = `projects/${PROJECT_ID}/locations/${CLOUD_REGION}/registries/${registry}`;
    const encodedMessage = Buffer.from(commandMessage).toString('base64');

    const request = {
        name: `${registryName}/devices/${deviceId}`,
        binaryData: encodedMessage
    };

    console.log('Request object');
    console.log(request);

    return new Promise((resolve, reject) => {
        client.projects.locations.registries.devices.sendCommandToDevice(
            request,
            (err, data) => {
                if (err) {
                    console.log('Could not send command');
                    console.log(err);
                    const errorString = err.toString();
                    const notConnectedPattern = /^Error: Device `\d*` is not connected.$/;
                    if(notConnectedPattern.test(errorString)) {
                        reject(new functions.https.HttpsError(
                            'unavailable',
                            'Device not connected'
                        ));
                    } else {
                        reject(err);
                    }
                } else {
                    console.log('Command sent successfully');
                    resolve(data);
                }
            }
        );
    });
}