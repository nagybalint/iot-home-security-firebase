const admin = require('firebase-admin');

module.exports = async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(422).send({ 
            error: "User Email and Password must be provided" 
        });
    }

    email = String(req.body.email);
    password = String(req.body.password);

    console.log(`Request submitted with ${email}`)

    try {
        let userRecord = await admin.auth().createUser({
            email: email,
            password: password
        });
        const { uid } = userRecord;
        console.log(`User created successfully with uid ${uid}`);

        const data = !req.body.fcm_token ? { } : 
            { fcm_token: String(req.body.fcm_token) };

        let ref = await admin.firestore().collection('users').doc(uid).set(data);
        return res.status(201).send('Mobile user registered successfully');
        
    } catch (error) {
        console.log(error);
        if(error.code) {
            switch (error.code) {
                case 'auth/email-already-exists':
                    return res.status(409).send({ 
                        error: "Email address already in use! Try logging in!" 
                    });
                case 'auth/invalid-password':
                    return res.status(403).send({
                        error: "Invalid Password!"
                    });
                default:
                    break;
            }
        }
        return res.status(500).send({ 
            error: "Registration failed! Please try again!" 
        });
    }
}

