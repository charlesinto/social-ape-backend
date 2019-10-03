const functions = require('firebase-functions');
const express = require('express')
const bodyParser = require('body-parser');
require('./config/firebaseSetup')
const fileupload = require('express-fileupload');
var busboy = require('connect-busboy');
const screamRoutes = require('./routes/screamRoutes')
const authRoute = require('./routes/authRoute')
const userRoute = require('./routes/userRoute');
const admin = require('firebase-admin')
const app = express();

const db = admin.firestore()

app.use(busboy())
app.use(fileupload())
app.use(bodyParser.urlencoded({extended: true}))

//Scream Routes
app.use('/v1/scream',screamRoutes)

// Authentication Routes
app.use('/v1/auth',authRoute)

app.use('/v1/user', userRoute);

exports.api = functions.https.onRequest(app)

exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
                                        .onCreate(snapshot => {
                                           return db.doc(`/screams/${snapshot.data().screamId}`).get()
                                             .then(doc => {
                                                 if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                                                     return db.doc(`/notifications/${snapshot.id}`)
                                                        .set({
                                                            createdAt: new Date().toISOString(),
                                                            sender:snapshot.data().userHandle,
                                                            recipient:doc.data().userHandle,
                                                            read:false,
                                                            screamId:doc.id,
                                                            type: 'like'
                                                        })
                                                        .catch(err => 
                                                            console.error(err)
                                                        )
                                                 }
                                             })
                                        })

exports.createNotificationsOnComment = functions.firestore.document('comments/{id}')
                                            .onCreate(snapshot => {
                                                return db.doc(`/screams/${snapshot.data().screamId}`).get()
                                                    .then(doc => {
                                                        if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                                                            return db.doc(`/notifications/${snapshot.id}`).set({
                                                                createdAt: new Date().toISOString(),
                                                                type:'comment',
                                                                read: false,
                                                                sender: snapshot.data().userHandle,
                                                                recipient: doc.data().userHandle,
                                                                screamId: doc.id
                                                            })
                                                            .catch(err => 
                                                                console.log(err)
                                                            )
                                                        }
                                                    })
                                            })

exports.delteNotificationOnUnlike = functions.firestore.document('likes/{id}')
                                        .onDelete(snapshot => {
                                            return db.doc(`/notifications/${snapshot.id}`)
                                                .delete()
                                                .catch(err => 
                                                    console.error(err)
                                                )
                                        })

exports.userImageChangeNotification = functions.firestore.document('users/{id}')
    .onUpdate(change => {
        console.log('previous data', change.before.data())
        console.log('current data', change.after.data())
        //verify that image has changed
        if (change.before.data().imageUrl !== change.after.data.imageUrl) {
            db.collection('screams').where('userHandle', '==', change.before.data().handle)
                .get().then(data => {
                    let batch = db.batch()
                    data.forEach(doc => {
                        let scream = db.doc(`screams/${doc.id}`)
                        batch.update(scream, { userImage: change.after.data().imageUrl })
                    })
                    return batch.commit()
                })
                .catch(err => console.log(err))
        }
    })

exports.screamDeleteNotification = functions.firestore.document('/screams/{id}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.id;
        let batch = db.batch();
        return db.collection('comments').where('screamId', '==', screamId)
            .get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`))
                })
                return db.collection('likes').where('screamId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`))
                })
                return db.collection('notifications').where('screamId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`))
                })
                return batch.commit()
            })
            .catch(err => console.error(err))
    })
                                            