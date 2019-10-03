const BusBoy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const admin = require('firebase-admin');
const { storageBucket } = require('../config/appSetting')
const db = admin.firestore()
class UserController {
    uploadProfileImage(req, res){
        console.log('here o')
        const busboy = new BusBoy({ headers: req.headers})
        let imageFileName;
        let imageToBeUploaded = {};
        const db = admin.firestore()
        console.log('files', req.files)
        console.log('headers', req.headers['content-type'])
        if(!req.files){
            console.log('no file(s) found')
        }
        // if(req.busboy){
        //     console.log('busboy present')
        // }
        // busboy.on('field',(fieldname,val, fieldnameTruncated,valTruncated, encoding, mimetype) => {
        //     console.log('field', fieldname)
        // })
        busboy.on('file', (fieldname,file,filename, encoding, mimetype) => {
            console.log('caleed')
            console.log('caleed', filename)
            if(mimetype !== 'image/jpeg' && mimetype !== 'image/png'){
                return res.status(400).send({error:'Wrong file type submitted'})
            }
                
            
            console.log(fieldname);
            console.log(filename)
            console.log(mimetype)
            //get the image extension
            const imageExtension = filename.split('.')[filename.split('.').length - 1];
            // generate random number as filename
            imageFileName = `${Math.round(Math.random() * 10000000000)}.${imageExtension}`;
            //get the filepath
            const filepath = path.join(os.tmpdir(), imageFileName);
            console.log(filepath)
            imageToBeUploaded = {filepath, mimetype};
            file.pipe(fs.createWriteStream(filepath))
        })
        busboy.on("finish", () => {
            console.log('image ur; 0>>>',imageToBeUploaded)
            admin.storage().bucket()
                .upload(imageToBeUploaded.filepath, {
                    resumable: false,
                    metadata: {
                        metadata: {
                            contentType: imageToBeUploaded.mimeType
                        }
                    }
                })
                .then(() => {
                    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${imageFileName}?alt=media`
                    console.log('image ur;', imageUrl)
                    return db.doc(`/users/${req.user.handle}`)
                            .update({imageUrl})
                })
                .then(() => {
                    return res.status(201)
                        .send({message: 'image uploaded successfully'})

                })
                .catch(err => {
                    console.log('error o', err);
                    return res.status(500).send({
                        error: err
                    })
                })
        })
        busboy.end(req.rawBody)
    }
    editProfile(req, res){
        db.doc(`/users/${req.user.handle}`).update(req.userDetails)
            .then(() => {
                return res.status(200).send({message:'Profile Updated Successfully'})

            })
            .catch(err => {
                console.error(err)
                return res.status(500).send({message:'some errors were encountered', err})
            })
    }
    getUserDetails(req, res){
        const userData = {}
        db.doc(`/users/${req.user.handle}`)
            .get().then(doc => {
                if(doc.exists)
                    userData.credentials = doc.data()
                return db.collection('likes')
                        .where('userHandle', '==', req.user.handle)
                        .get()
            })
            .then(data => {
                userData.likes = []
                data.forEach(doc => {
                    userData.likes.push({id: doc.id, ...doc.data()})
                })
                return db.collection('notifications').where('recipient', '==', req.user.handle).get()
            })
            .then(data => {
                userData.notifications = [];
                data.forEach(doc => {
                    userData.notifications.push({id: doc.id, ...doc.data()})
                })
                return res.status(200).send({
                    message:'Action successful',
                    userData
                })
            })
            .catch(err => {
                console.error(err);
                return res.status(500).send({
                    message:'some errors were encountered',
                    err
                })
            })
    }
    getUserByHandle(req, res){
        const user = {};
        db.doc(`/users/${req.params.handle}`).get()
            .then(doc => {
                if(!doc.exists)
                    return res.status(404).send({message: 'user not found'})
                user.profile = {
                    email: doc.data().email,
                    imageUrl: doc.data().imageUrl,
                    location: doc.data().location,
                    handle: doc.data().handle
                }
                return db.collection('screams')
                        .where('userHandle','==', doc.data().handle).
                        orderBy('createdAt', 'desc').get()
            })
            .then(data => {
                user.screams = [];
                data.forEach(doc => {
                    user.screams.push({id: doc.id, ...doc.data()})
                })
                return res.status(200).send({
                    message: 'Action successful',
                    user
                })
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({message:'some errors encounterd',error: err.code})
            })

    }
    markNotificationAsRead(req, res){
        let batch = db.batch()
        const { notification } = req.body;
        notification.forEach(notificationId => {
            let notification = db.doc(`/notifications/${notificationId}`)
            batch.update(notification, {read: true})
        })
        batch.commit()
            .then(() => {
                res.status(200).send({
                    message: `notifications marked read`
                })
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({
                    message: 'some errors were encountered',
                    error: err.code
                })
            })
    }
}

module.exports = new UserController()