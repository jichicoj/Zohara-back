'use strict'

const app = require('./app')
const consts = require('./constants')
const port = consts.APP_PORT

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}/`)
})
