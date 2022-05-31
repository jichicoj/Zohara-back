'use strict'

const neo4j = require('neo4j-driver')
const utils = require('../utils')
const {toNativeTypes} = require("../utils");
const {NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD} = require("../constants");
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD))

async function findAll (req, res) {
    const session = driver.session()

    try {
        const result = await session.readTransaction(tx =>
            tx.run(`
              MATCH (g:Genre)
              WHERE g.name <> '(no genres listed)'
          
              CALL {
                WITH g
                MATCH (g)<-[:IN_GENRE]-(m:Movie)
                WHERE m.imdbRating IS NOT NULL
                AND m.poster IS NOT NULL
                RETURN m.poster AS poster
                ORDER BY m.imdbRating DESC LIMIT 1
              }
              RETURN g {
                .*,
                movies: size((g)<-[:IN_GENRE]-()),
                poster: poster
              } as genre
              ORDER BY g.name ASC
        `))

        const genres = result.records.map(row => toNativeTypes(row.get('genre')))

        return res.status(200).send(genres)
    } catch (e) {
        console.log(e)
        return res.status(500).send({message: e.message})
    } finally {
        await session.close()
    }
}

module.exports = {
    findAll
}
