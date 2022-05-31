'use strict'

const APP_PORT = process.env.APP_PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_password'
const SALT_ROUNDS = process.env.SALT_ROUNDS || 10

module.exports = {
    APP_PORT,
    JWT_SECRET,
    SALT_ROUNDS,

}