'use strict'

const neo4j = require('neo4j-driver')
const {toNativeTypes} = require("../utils");
const {NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD} = require("../constants");
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD))

async function addRating (req, res) {
    const rating = neo4j.int(req.body.rating)
    const userId = req.params.userId
    const movieId = req.params.movieId.toString()
    const session = driver.session()

    if (rating) {
        try {
            const result = await session.writeTransaction(tx =>
                tx.run(`MATCH (u: User {userId: $userId})
                    MATCH (m: Movie {tmdbId: $movieId})
                    
                    MERGE (u)-[r: Rated]->(m)
                    SET r.rating = $rating,
                    r.timestamp = timestamp()
                    
                    RETURN m {
                        .*, rating: r.rating
                    } AS movie
                `, { userId, movieId, rating })
            )

            if (result.records.length === 0) return res.status(404).send({ message: `Could not create rating for movie ${movieId} by user ${userId}` })

            const [first] = result.records
            const movie = first.get('movie')

            return res.status(200).send({ message: 'Rating created successfully', mv: toNativeTypes(movie) })
        } catch (e) {
            console.log(e)
            return res.status(500).send({ message: e.message })
        } finally {
            await session.close()
        }
    } else {
        return res.status(404).send({ message: 'Not enough data' })
    }
}

async function getRatings(req, res) {
    const movieId = req.params.movieId
    const session = driver.session()

    try {
        const result = await session.readTransaction(tx =>
            tx.run(`
                MATCH (u:User)-[r:RATED]->(m:Movie {tmdbId: $movieId})
                RETURN r {
                  .rating,
                  .timestamp,
                  user: u {
                    .id, .name
                  }
                } AS review
                ORDER BY r.timestamp DESC
                SKIP $skip
                LIMIT $limit
            `, { movieId, limit: neo4j.int(10), skip: neo4j.int(0) })
        )

        const reviews = result.records.map(row => toNativeTypes(row.get('review')))

        return res.status(200).send(reviews)
    } catch (e) {
        console.log(e)
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

module.exports = {
    addRating,
    getRatings
}
