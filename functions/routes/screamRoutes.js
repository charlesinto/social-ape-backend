const express = require('express')
const authMiddleWare = require('../middleware/authMiddleware');
const screamController = require('../controller/screamController')
const screamMiddleware = require('../middleware/screamMiddleware');
const router = express.Router()

router.get('/', screamController.getScreams)
router.post('/', authMiddleWare.isAuthenticated, screamController.createScream)

router.post('/:screamId/comment', authMiddleWare.isAuthenticated, 
            screamMiddleware.validateComment, screamController.commentOnScream)
router.get('/:screamId', screamController.getScreamById)

//action=like to like a scream
//action=unlike to unlike a scream

router.post('/:screamId', authMiddleWare.isAuthenticated,
            screamController.likeUnlikeScream)

router.delete('/:screamId', authMiddleWare.isAuthenticated, screamController.deleteScream)


module.exports = router;