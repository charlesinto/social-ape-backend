const express = require('express')
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controller/userController');
const userProfileMiddleware = require('../middleware/userProfileMiddleware')
const router = express.Router()


router.get('/', authMiddleware.isAuthenticated, userController.getUserDetails)
router.post('/image/upload',authMiddleware.isAuthenticated, userController.uploadProfileImage)
router.post('/edit_profile', authMiddleware.isAuthenticated, userProfileMiddleware.validateSerialRequest, userController.editProfile)
router.get('/:handle', userController.getUserByHandle)
router.post('/notifications', authMiddleware.isAuthenticated, userController.markNotificationAsRead)

module.exports = router;