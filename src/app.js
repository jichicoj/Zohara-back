'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors');
const dotenv = require('dotenv')
const neo4j = require('./neo4j')

dotenv.config()

const accountRoutes = require('./routes/account.routes')
const authRoutes = require('./routes/auth.routes')
const genresRoutes = require('./routes/genres.routes')
const movieRoutes = require('./routes/movie.routes')
const peopleRoutes = require('./routes/people.routes')
const statusRoutes = require('./routes/status.routes')
const errorMiddleware = require('./middlewares/error.middleware');

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const {
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD,
} = process.env

neo4j.initDriver(NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD)

app.use('/api/account', accountRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/genres', genresRoutes)
app.use('/api/movie', movieRoutes)
app.use('/api/people', peopleRoutes)
app.use('/api/status', statusRoutes)

app.use(errorMiddleware.errorMiddleware)

module.exports = app