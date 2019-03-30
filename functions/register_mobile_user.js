const admin = require('firebase-admin');

module.exports = async (req, res) => {
    if (!req.body.user || !req.body.fcm_token) {
        return res.status(422).send({ error: "User and fcm token must be provided" });
    }

    user = String(req.body.user);
    device_id = String(req.body.device_id);
    fcm_token = String(req.body.fcm_token);

    const data = {
        device_id,
        fcm_token
    }
    
    try {
        let { uid } = await admin.auth().getUserByEmail(user);
        let ref = await admin.firestore().collection('users').doc(uid).set(data);
        return res.status(200).send('Mobile user registered successfully');
    } catch (error) {
        return res.status(422).send({ error });
    }
}

