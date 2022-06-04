'use strict'

const neo4j = require('neo4j-driver')
const {toNativeTypes} = require("../utils");
const jwt = require("../services/jwt.service");
const {NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD} = require("../constants");
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD))

async function getPeople(req, res) {
    const personId = req.params.personId.toString()
    const session = driver.session()

    try {
        const result = await session.readTransaction(tx =>
            tx.run(`
                MATCH (p:Person {tmdbId: $personId}) 
                RETURN p {
                    .*,
                    actedCount: size((p)-[:ACTED_IN]->()),
                    directedCount: size((p)-[:DIRECTED]->())
                } AS person LIMIT 1
            `, { personId })
        )

        const person = result.records[0].get('person')

        return res.status(200).send(toNativeTypes(person))
    } catch (e) {
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function getSimilarPeople(req, res) {
    const personId = req.params.personId
    const session = driver.session()

    try {
        const result = await session.readTransaction(tx =>
            tx.run(`
                MATCH (:Person {tmdbId: $personId})-[:ACTED_IN|DIRECTED]->(m)<-[r:ACTED_IN|DIRECTED]-(p)
                RETURN p {
                  .*,
                  actedCount: size((p)-[:ACTED_IN]->()),
                  directedCount: size((p)-[:DIRECTED]->()),
                  inCommon: collect(m {.tmdbId, .title, type: type(r)})
                } AS person
                ORDER BY size(person.inCommon) DESC
                SKIP $skip
                LIMIT $limit
              `, { personId , skip: neo4j.int(0), limit: neo4j.int(5) })
        )

        const people = result.records.map(row => toNativeTypes(row.get('person')))

        return res.status(200).send(people)
    } catch (e) {
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

module.exports = {
    getPeople,
    getSimilarPeople
}
