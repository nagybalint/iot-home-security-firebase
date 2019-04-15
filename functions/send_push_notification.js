const admin = require('firebase-admin');

module.exports = async (req, res) => {
    // Check if the request is well formatted
    if(!req.body.title || !req.body.body) {
        return res.status(422).send("Incorrectly formatted request!");
    }

    const { title, body } = req.body;
    const device_id = req.user.uid;

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
    
    try {
        // Get the FCM tokens corresponding to the device
        let deviceRecord = await admin.firestore().collection('devices').doc(device_id).get();
        console.log('Device get finished');
        if(!deviceRecord.exists) {
            return res.status(422).send({ 
                error: `Device ${device_id} does not exist`
            });
        }

        console.log("Device get successful");

        let users = deviceRecord.get('users');

        let tokens = new Array();

        for (const user of users) {
            tokens.push(user);
        }

        console.log(`Tokens: ${tokens}`);
        console.log(`Tokens type ${typeof tokens}`);
        console.log(`Token type ${typeof tokens[0]}`);

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