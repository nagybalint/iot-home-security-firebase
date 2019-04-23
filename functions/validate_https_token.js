const admin = require('firebase-admin');

module.exports = async (req, res, next) => {
  
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