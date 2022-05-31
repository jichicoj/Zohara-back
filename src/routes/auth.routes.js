'use strict'

const express = require('express')
const userRoutes = require('../controllers/user.controller')
const api = express.Router()

api.post('/signup', userRoutes.signUp)
api.post('/signin', userRoutes.signIn)
api.get('/get/:userId', userRoutes.getById)

module.exports = api
