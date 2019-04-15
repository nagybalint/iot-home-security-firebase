const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const express = require('express');

const register_mobile_user = require('./register_mobile_user');
const send_push_notification = require('./send_push_notification');
const fetch_device_id = require('./fetch_device_id');
const add_device = require('./add_device');

admin.initializeApp(functions.config().firebase);

const validateFirebaseIdToken = async (req, res, next) => {
  
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        console.error('No Authorization header provided or header does not start with Bearer');
        res.status(403).send('Unauthorized');
        return;
    }
  
    const idToken = req.headers.authorization.split('Bearer ')[1];
  
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        console.log('ID Token correctly decoded', decodedIdToken);
        req.user = decodedIdToken;
        next();
        return;
    } catch (error) {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(403).send('Unauthorized');
        return;
    }
};

// Unauthenticated endpoints
exports.register_mobile_user = functions.https.onRequest(register_mobile_user);

// Authenticated callable endpoints
exports.fetch_device_id = functions.https.onCall(fetch_device_id);
exports.add_device = functions.https.onCall(add_device);

// Authenticated https endpoints
const app = express();

app.use(cors);
app.use(validateFirebaseIdToken);
app.post('/send_push_notification', send_push_notification);

exports.device_actions = functions.https.onRequest(app);
