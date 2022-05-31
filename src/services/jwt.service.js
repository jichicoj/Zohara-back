'use strict'

const jwt = require('jwt-simple')
const pass = require('../constants').JWT_SECRET

exports.createToken = function (user) {
    let payload = {
        id: user.userId,
        username: user.username,
        email: user.email
    };

    return jwt.encode(payload, pass)
}
