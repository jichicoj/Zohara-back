'use strict'

const express = require('express')
const movieController = require('../controllers/movies.controller')
const api = express.Router()

api.get('/all/:userId', movieController.getAll)
api.get('/genre/:genre/:userId', movieController.getByGenre)
api.get('/actor/:actor/:userId', movieController.getForActor)
api.get('/director/:director/:userId', movieController.getForDirector)
api.get('/find/:movieId/:userId', movieController.findById)
api.get('/find/:name', movieController.findByName)
api.get('/similar/:movieId/:userId', movieController.getSimilar)

module.exports = api
