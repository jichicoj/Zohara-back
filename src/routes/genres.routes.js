'use strict'

const express = require('express')
const genreController = require('../controllers/genre.controller')
const api = express.Router()

api.get('/all', genreController.findAll)

module.exports = api
