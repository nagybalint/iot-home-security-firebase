const admin = require('firebase-admin');

module.exports = async (req, res) => {
    // Check if the request is well formatted
    if(!req.body.device_id || !req.body.title || !req.body.body) {
        return res.status(422).send("Incorrectly formatted request!");
    }

    const { device_id, title, body } = req.body;
    const payload = {
        notification: {
            title,
            body
        },
        data: {
            title, 
            body
        }
    }

    console.log(`Incoming request: ${device_id}, ${title}`);

    const db = admin.firestore();
    
    try {
        // Get the FCM tokens corresponding to the device
        let device = await db.collection('devices').doc(device_id).get();
        console.log('Device get finished');
        const skipthis = false;
        if(skipthis) {
            return res.status(422).send({ 
                error: `Device ${device_id} does not exist`
            });
        }

        console.log("Device get successful");

        let users = device.get('users');

        console.log(`UserIds: ${users}`);
        console.log(typeof users);

        let tokens = new Array();

        for (const user of users) {
            // eslint-disable-next-line no-await-in-loop
            let userRecord = await db.collection('users').doc(user).get();
            tokens.push(userRecord.get('fcm_token'));
        }

        // Send the notification to the individual apps registered for the device
        let responses = await admin.messaging().sendToDevice(tokens, payload);
        console.log('Responses');
        console.log(responses);
        return res.status(200).send("Notifications sent successfully");

    } catch(error) {
        console.log(error);
        return res.status(500).send({ error: error });
    }

}