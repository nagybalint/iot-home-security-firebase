// https onRequest endpoint
const admin = require('firebase-admin');

module.exports = async (req, res) => {
    const { 
        device_id, 
        password,
        verification_code,
        registry,
        public_key,
        type
    } = req.body;

    if (!device_id || !password || !verification_code) {
        return res.status(422).send('Incomplete request body');
    }

    // Register device to auth
    let userRecord;

    try {
        userRecord = await admin.auth().createUser({
            disabled: false,
            displayName: device_id,
            email: `${device_id}@dummydomain.com`,
            emailVerified: false,
            password: password,
            uid: device_id
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send(error);
    }

    const data = {
        verification_code: verification_code
    }

    // Add device data to firestore
    try {
        let deviceRef = admin.firestore().collection('devices').doc(device_id);
        let deviceSnap = await deviceRef.get();
        if(deviceSnap.exists) {
            return res.status(422).send("Device already exists in firestore");
        }
        await deviceRef.set(data);
    } catch (error) {
        res.status(422).send(error)
    }

    return res.status(200).send('Device added succesfully');

    // Add device to Cloud IoT registry

}