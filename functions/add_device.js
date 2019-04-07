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
        let userRef = await admin.firestore().collection('users').doc(uid);
        // TODO
        // Functionality comes here

    } catch (error) {
        throw new functions.https.HttpsError(
            'internal',
            'Something bad has happened :( Please try again!'
        );
    }
}