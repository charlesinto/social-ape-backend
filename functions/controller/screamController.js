
const admin = require('firebase-admin');
const db = admin.firestore();

class ScreamController {
    getScreams(req, res) {
        db.collection('screams')
            .orderBy('createdAt', 'desc')
            .get().then(snapshot => {
                let screams = [];
                snapshot.forEach(doc => {
                    screams.push({ id: doc.id, ...doc.data() })
                })

                return res.send({ screams })
            })
            .catch(err => {
                console.log(err)
                return res.status(500).send({ err })
            })
    }
    createScream(req, res) {
        const { body: {body }, user: { imageUrl } } = req;
        const newScream = {
            userHandle: req.user.handle,
            body,
            userImage: imageUrl,
            likeCount: 0,
            commentCount: 0,
            createdAt: new Date().toISOString()
        }
        db.collection('screams')
            .add(newScream)
            .then(doc => {
                newScream.screamId = doc.id
                res.status(200).send({
                    message: `document ${doc.id} created succesfully`,
                    scream: newScream
                })

            })
            .catch(err => {
                res.status(500).send({
                    error: 'something went wrong'

                })
                console.error(err)
            })
    }
    getScreamById(req, res) {
        const data = {};
        db.doc(`/screams/${req.params.screamId}`).get()
            .then(doc => {

                if (!doc.exists)
                    return res.status(404).send({ message: 'Scream Not Found' })
                data.scream = { id: doc.id, ...doc.data() }
                return db.collection('comments').where('screamId', '==', req.params.screamId)
                    .orderBy('createdAt', 'desc').get()
            })
            .then(docs => {
                data.comments = [];
                docs.forEach(doc => {
                    data.comments.push({ id: doc.id, ...doc.data() })
                })
                return res.status(200).send({
                    message: 'Action successful',
                    data
                })
            })
            .catch(err => {
                console.error(err);
                return res.status(500).send({
                    message: err.code,
                    err
                })
            })
    }
    commentOnScream(req, res) {
        const { comment } = req.body;
        const newComment = {
            userHandle: req.user.handle,
            screamId: req.params.screamId,
            comment,
            createdAt: new Date().toISOString(),
            userAvatar: req.user.imageUrl
        }
        db.doc(`/screams/${req.params.screamId}`).get()
            .then(doc => {
                if (!doc.exists)
                    return res.status(404).send({ message: 'Scream not found' })
                return doc.ref.update({commentCount: doc.data().commentCount + 1})
               
            })
            .then(() => {
                return db.collection('comments').add(newComment)
            })
            .then((doc) => {
                newComment.id = doc.id;
                return res.status(200).send({
                    message: 'Comment Posted Succesfully',
                    comment: newComment
                })
            })
            .catch(err => {
                console.error(err)
                return res.status(500).send({
                    message: err.code
                })
            })
    }
    likeUnlikeScream(req, res) {
        const action = req.query['action'];
        
        if (action === 'like') {
            let screamData = {};
            const likes = []
            //get the likes documents
            const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
                .where('screamId', '==', req.params.screamId).limit(1)
            //get the screams documents
            const screamDocument = db.doc(`/screams/${req.params.screamId}`)
            screamDocument.get().then(doc => {

                if (doc.exists) {
                    screamData = doc.data()
                    screamData.id = doc.id;
                    return likeDocument.get()
                } else {
                    return res.status(404).send({
                        message: 'Scream not found'
                    })
                }
            })
                .then(data => {
                    //get the likes
                    data.forEach(doc => {
                        likes.push(doc.data())
                    })
                    //checks if there is a like existing for the scream
                    if (likes.length > 0) {
                        return res.status(403).send({ message: 'scream already liked' })
                    }
                    //if there is no likes existing, then like the scream by increment likes by one
                    else {
                        if (!screamData.likeCount)
                            screamData.likeCount = 0;
                        screamData.likeCount++;
                        return screamDocument.update({ likeCount: screamData.likeCount })
                    }
                })
                .then(doc => {
                    //only output  if there was no likes found for the scream and the scream has been liked now
                    if (likes.length <= 0) {
                        const newLike = {
                            userHandle: req.user.handle,
                            screamId: req.params.screamId,
                            createdAt: new Date().toISOString()
                        }
                        return db.collection('likes').add(newLike)
                    }

                })
                .then(doc => {
                    //only output  if there was no likes found for the scream and the scream has been liked now
                    if(likes.length <= 0 ){
                        console.log('Scream Liked')
                        return res.status(200).send({
                            message: 'Scream Like',
                            scream: screamData
                        })
                    }
                    
                })
                .catch(err => {
                    // catch error
                    console.error(err);
                    return res.status(500).send({
                        message: 'some error were encountered',
                        error: err.code
                    })
                })
        }
        else if (action === 'unlike') {
            let sD = {}, likes = []
            const likesDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
                .where('screamId', '==', req.params.screamId).limit(1)

            const screamsDocument = db.doc(`/screams/${req.params.screamId}`)
            screamsDocument.get().then(doc => {

                if (doc.exists) {
                    sD = doc.data()
                    sD.id = doc.id;

                    return likesDocument.get()
                } else {
                    return res.status(404).send({
                        message: 'Scream not found'
                    })
                }
            })
                .then(data => {
                    likes = [];
                    data.forEach(doc => {
                        likes.push(doc.id)
                    })
                    //if there is no like for the scream
                    if (!(likes.length > 0))
                        return res.status(403).send({ message: 'no likes found' })
                    sD.likeCount = parseInt(sD.likeCount) > 0 ? --sD.likeCount : 0;
                    return screamsDocument.update({ likeCount: sD.likeCount })
                })
                .then(doc => {
                    //if there is a like for the document, delete it
                    return db.doc(`likes/${likes[0]}`).delete()
                })
                .then(doc => {
                    //print output the document has been liked
                    console.log('Scream UnLiked')
                    return res.status(200).send({
                        message: 'Scream unLike',
                        scream: sD
                    })
                })
                .catch(err => {
                    //catch errors
                    console.error(err);
                    return res.status(500).send({
                        message: 'some error were encountered',
                        error: err.code
                    })
                })
        }

    }
    deleteScream(req, res){
        const screamDocument = db.doc(`/screams/${req.params.id}`);
        screamDocument.get()
            .then(doc => {
                if(!doc.exists)
                    return res.status(404).send('scream not found')
                if(doc.data().userHandle !== req.user.handle)
                    return res.status(400).send({
                        message:'Unauthorized user'
                    })
                return screamDocument.delete()
            })
            .then(() => {
                res.status(200).send({
                    message:'scream deleted successfully'
                })
            })
            .catch(err => {
                console.error(err)
                res.status(500).send({
                    message:'some errors were encounterd',
                    error:err.code
                })
            })
    }
}

module.exports = new ScreamController()