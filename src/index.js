'use strict'

const app = require('./app')

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), () => {
    console.log(`Server listening on http://localhost:${app.get('port')}/`)
})
