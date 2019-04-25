// https onRequest endpoint
const admin = require('firebase-admin');

module.exports = async (req, res) => {
    const { 
        device_id, 
        password,
        verification_code,
        registry
    } = req.body;

    if (!device_id || !password || !verification_code || !registry) {
        return res.status(422).send('Incomplete request body');
    }

    const data = {
        state: {},
        registry: registry,
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

    return res.status(200).send('Device added to firestore succesfully');

}