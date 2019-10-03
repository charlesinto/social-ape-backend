const express = require('express')
const authMiddleWare = require('../middleware/authMiddleware');
const authController = require('../controller/authController')
const router = express.Router()

router.post('/login',  authMiddleWare.isEmailAndPasswordEmtpy, 
authMiddleWare.isEmailValid, authController.login)
router.post('/signup', authMiddleWare.isEmailAndPasswordEmtpy,
authMiddleWare.isEmailValid, authMiddleWare.isPasswordEqualsConfirmPassword,
  authMiddleWare.isPasswordLengthValid, authController.signup)

module.exports = router;