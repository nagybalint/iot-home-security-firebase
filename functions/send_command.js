// https callable endpoint

const { google } = require('googleapis');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

const DISCOVERY_API = 'https://cloudiot.googleapis.com/$discovery/rest';
const API_VERSION = 'v1';
const PROJECT_ID = process.env.GCLOUD_PROJECT;
const CLOUD_REGION = 'us-central1';

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

    try {
        let result = sendStatusUpdateCommand(uid);
        const { success, error } = result;
        if(success) {
            return {
                success: true,
                error: null
            };
        }
        
        throw new functions.https.HttpsError(
            'internal',
            'Sending command to device not successful'
        );
        
    } catch (error) {
        throw new functions.https.HttpsError(
            'internal',
            'Something bad has happened :( Please try again!'
        );
    }
}


sendStatusUpdateCommand = async (uid) => {

    console.log('Sending status update request');

    const commandMessage = 'status_update_request';

    try {
        let deviceInfo = await getDeviceInfo(uid);
        const { device_id, registry } = deviceInfo;
        let client = await getClient();
        await sendCommand(client, registry, device_id, commandMessage);
        return {
            success: true,
            error: null
        };
    } catch (error) {
        console.log('Error while sending status update command');
        console.log(error);
        return {
            success: false,
            error: error
        };
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
    const deviceId = userDoc.get('device_id');
    
    console.log(`Device id retrieved - ${deviceId}`);
    console.log('Fetching device');

    let deviceRef = await admin.firestore().collection('devices').doc(deviceId);
    let deviceDoc = await deviceRef.get();

    console.log('Device retrieved');

    const registry = deviceDoc.get('registry');

    console.log(`Device registry - ${registry}`);

    return {
        device_id: deviceId,
        registry
    };
}

sendCommand = async (client, registry, deviceId, commandMessage) => {
    console.log(`Sending command to ${registry}/devices/${deviceId}`);

    const registryName = `projects/${PROJECT_ID}/locations/${CLOUD_REGION}/registries/${registry}`;
    const encodedMessage = Buffer.from(commandMessage).toString('base64');

    const request = {
        name: `${registryName}/devices/${deviceId}`,
        binaryData: encodedMessage
    };

    console.log('Request object');
    console.log(request);

    client.projects.locations.registries.devices.sendCommandToDevice(
        request,
        (err, data) => {
          if (err) {
            console.log('Could not send command:', request);
            console.log('Error: ', err);
          } else {
            console.log('Success:', data.status);
          }
        }
    );
}