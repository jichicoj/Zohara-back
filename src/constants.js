'use strict'

const APP_PORT = process.env.port || 5000
const JWT_SECRET = 'super_secret_password'
const SALT_ROUNDS =  10

const NEO4J_URI = 'bolt://52.90.57.233:7687'
const NEO4J_USERNAME = 'neo4j'
const NEO4J_PASSWORD = 'places-zeros-refrigerators'

module.exports = {
    APP_PORT,
    JWT_SECRET,
    SALT_ROUNDS,
    NEO4J_URI,
    NEO4J_USERNAME,
    NEO4J_PASSWORD
}
