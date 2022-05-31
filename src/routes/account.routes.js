'use strict'

const express = require('express')
const ratingController = require('../controllers/rating.controller')
const userController = require('../controllers/user.controller')
const api = express.Router()

api.post('/rate/:movieId/:userId', ratingController.addRating)
api.get('/ratings/:movieId', ratingController.getRatings)
api.post('/favorite/add/:movieId/:userId', userController.addFavorite)
api.delete('/favorite/remove/:movieId/:userId', userController.removeFavorite)
api.get('/favorite/get/:userId', userController.getFavorites)

module.exports = api
