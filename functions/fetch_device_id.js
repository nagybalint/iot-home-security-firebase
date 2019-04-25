const admin = require('firebase-admin');
const functions = require('firebase-functions');

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
        // Read the device id registered to the user in firestore
        let userRef = await admin.firestore().collection('users').doc(uid);
        return userRef.get().then((doc) => {
            return {
                device_id: doc.get('device_id')
            };
        }).catch((error) => {
            throw new functions.https.HttpsError(
                'not-found',
                'User not found'
            );
        });

    } catch (error) {
        console.log(error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        } else {
            throw new functions.https.HttpsError(
                'internal',
                'Fetching device id not successful! Please try again!'
            );
        }
    }
}