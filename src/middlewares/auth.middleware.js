'use strict'

const jwt = require('jwt-simple')
const moment = require('moment')
const secret_pass = require('./constants').JWT_SECRET

exports.ensureAuth = function (req, res, next) {
    if (!req.headers.authorization) return res.status(403).send({message: 'Request has no authorization header'})

    let token = req.headers.authorization.replace(/['"]+/g);

    try {
        var payload = jwt.decode(token, secret_pass);

        if (payload.exp <= moment().unix()) {
            return res.status(401).send({message: 'Token has expired'})
        }
    } catch (e) {
        return res.status(404).send({message: 'Invalid token'})
    }

    req.user = payload;
}
