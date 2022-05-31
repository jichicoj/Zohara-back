'use strict'

const express = require('express')
const peopleController = require('../controllers/people.controller')
const api = express.Router()

api.get('/find/:personId', peopleController.getPeople)
api.get('/similar/:personId', peopleController.getSimilarPeople)

module.exports = api
