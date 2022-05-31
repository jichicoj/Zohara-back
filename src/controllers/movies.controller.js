'use strict'

const neo4j = require('neo4j-driver')
const utils = require('../utils')
const {toNativeTypes} = require("../utils");
const {NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD} = require("../constants");
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD))

async function getAll (req, res) {
    const userId = req.params.userId
    const session = driver.session()

    try {
        const result = await session.readTransaction(async tx => {
            const favorites = await isFavorite(tx, userId)

            return tx.run(`
                MATCH (m:Movie)
                WHERE m.title IS NOT NULL AND m.year IS NOT NULL 
                RETURN m {
                    .*,
                    favorite: m.tmdbId IN $favorites
                } AS movie
                ORDER BY m.year DESC
              `, { favorites })
        })

        const movies = result.records.map(row => utils.toNativeTypes(row.get('movie')))

        return res.status(200).send(movies)
    } catch (e) {
        console.log(e)
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function findById(req, res) {
    const { movieId, userId } = req.params
    const session = driver.session()

    try {
        const result = await session.readTransaction(async tx => {
            const favorites = await isFavorite(tx, userId)

            return tx.run(`
              MATCH (m:Movie {tmdbId: $movieId})
              RETURN m {
                .*,
                actors: [ (a)-[r:ACTED_IN]->(m) | a { .*, role: r.role } ],
                directors: [ (d)-[:DIRECTED]->(m) | d { .* } ],
                genres: [ (m)-[:IN_GENRE]->(g) | g { .name }],
                ratingCount: size((m)<-[:RATED]-()),
                favorite: m.tmdbId IN $favorites
              } AS movie
            `, { movieId, favorites })
        })

        return res.status(200).send({ movie: toNativeTypes(result.records[0].get('movie')) })
    } catch (e) {
        console.log(e)
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function findByName(req, res) {
    const name = req.params.name
    const session = driver.session()

    try {
        const resultM = await session.readTransaction(tx => {
            return tx.run(`
              MATCH (m:Movie)
              WHERE toLower(m.title) contains toLower($name)
              RETURN m { .* } AS movie LIMIT 10
            `, { name })
        })

        const resultP = await session.readTransaction(tx => {
            return tx.run(`
              MATCH (p:Person)
              WHERE toLower(p.name) contains toLower($name)
              RETURN p { .* } AS person LIMIT 10
            `, { name })
        })

        const movies = resultM.records.map(row => toNativeTypes(row.get('movie')))
        const people = resultP.records.map(row => toNativeTypes(row.get('person')))

        return res.status(200).send({ movies: movies, people: people })
    } catch (e) {
        console.log(e)
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function getSimilar(req, res) {
    const { movieId, userId } = req.params
    const session = driver.session()

    try {
        const result = await session.readTransaction(async tx => {
            const favorites = await isFavorite(tx, userId)

            return tx.run(`
              MATCH (:Movie {tmdbId: $movieId})-[:IN_GENRE|ACTED_IN|DIRECTED]->()<-[:IN_GENRE|ACTED_IN|DIRECTED]-(m)
              WHERE m.imdbRating IS NOT NULL
        
              WITH m, count(*) AS inCommon
              WITH m, inCommon, m.imdbRating * inCommon AS score
              ORDER BY score DESC
        
              SKIP $skip
              LIMIT $limit
        
              RETURN m {
                .*,
                score: score,
                favorite: m.tmdbId IN $favorites
              } AS movie
            `, { movieId, skip: neo4j.int(0), limit: neo4j.int(10), favorites })
        })

        const movies = result.records.map(row => toNativeTypes(row.get('movie')))

        return res.status(200).send(movies)
    } catch (e) {
        console.log(e)
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function getByGenre(req, res) {
    const { genre, userId } = req.params
    const { sort, order } = req.query
    const session = driver.session()

    try {
        const result = await session.readTransaction(async tx => {
            const favorites = await isFavorite(tx, userId)

            return tx.run(`
          MATCH (m:Movie)-[:IN_GENRE]->(:Genre {name: $genre})
          WHERE m.\`${sort}\` IS NOT NULL
          RETURN m {
            .*,
            favorite: m.tmdbId IN $favorites
          } AS movie
          ORDER BY m.\`${sort}\` ${order}
        `, { favorites, genre })
        })

        const movies = result.records.map(row => toNativeTypes(row.get('movie')))

        res.status(200).send(movies)
    } catch (e) {
        console.log(e)
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function getForActor(req, res) {
    const { actor, userId } = req.params
    const { sort, order } = req.query
    const session = driver.session()

    try {
        const result = await session.readTransaction(async tx => {
            const favorites = await isFavorite(tx, userId)

            return tx.run(`
              MATCH (:Person {tmdbId: $actor})-[:ACTED_IN]->(m:Movie)
              WHERE m.\`${sort}\` IS NOT NULL
              RETURN m {
                .*,
                favorite: m.tmdbId IN $favorites
              } AS movie
              ORDER BY m.\`${sort}\` ${order}
            `, { favorites, actor })
            })

        const movies = result.records.map(row => toNativeTypes(row.get('movie')))

        res.status(200).send(movies)
    } catch (e) {
        console.log(e)
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function getForDirector(req, res) {
    const { director, userId } = req.params
    const { sort, order } = req.query
    const session = driver.session()

    try {
        const result = await session.readTransaction(async tx => {
            const favorites = await isFavorite(tx, userId)

            return tx.run(`
              MATCH (:Person {tmdbId: $director})-[:DIRECTED]->(m:Movie)
              WHERE m.\`${sort}\` IS NOT NULL
              RETURN m {
                .*,
                favorite: m.tmdbId IN $favorites
              } AS movie
              ORDER BY m.\`${sort}\` ${order}
            `, { favorites, director })
        })

        const movies = result.records.map(row => toNativeTypes(row.get('movie')))

        res.status(200).send(movies)
    } catch (e) {
        console.log(e)
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function isFavorite(tx, userId) {
    const result = await tx.run(`MATCH (u: User {userId: $userId})-[r: HAS_FAVORITE]->(m: Movie)
        RETURN m.tmdbId AS id
    `, { userId })

    if (result.records.length === 0) return []

    return result.records.map(row => row.get('id'))
}

module.exports = {
    getAll,
    getByGenre,
    getForActor,
    getForDirector,
    findById,
    getSimilar,
    findByName
}
