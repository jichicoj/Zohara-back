'use strict'

const bcrypt = require('bcrypt-nodejs')
const jwt = require('../services/jwt.service')
const neo4j = require('neo4j-driver')
const {NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD} = require("../constants");
const {toNativeTypes} = require("../utils");
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD))

async function signUp (req, res) {
    const { username, email, password } = req.body

    if (username && password && email) {

        bcrypt.hash(password, null, null, async (err, hash) => {
            if (err != null) return res.status(500).send({message: err})
            const session = driver.session()

            try {
                const result = await session.writeTransaction(tx =>
                    tx.run(`CREATE (u:User {
                    userId: randomUuid(),
                    username: $username,
                    email: $email,
                    password: $hash
                }) RETURN u`, {username, email, hash})
                )

                const node = result.records[0].get('u')

                const { pass, ...safeProperties } = node.properties

                return res.status(200).send({ token: jwt.createToken(safeProperties) })
            } catch (e) {
                if (e.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                    return res.status(422).send({ message: 'Email address taken' })
                }

                return res.stack(500).send({message: e.message})
            } finally {
                await session.close()
            }
        })
    } else {
        return res.status(404).send({ message: 'Not enough data' })
    }
}

async function signIn (req, res) {
    const { email, password } = req.body

    if (email && password) {
        const session = driver.session()

        try {
            const result = await session.readTransaction(tx =>
                tx.run(`MATCH (u:User {email: $email}) RETURN u`, { email })
            )

            if (result.records.length === 0) return res.status(404).send({ message: 'User not found' })

            const user = result.records[0].get('u')

            bcrypt.compare(password, user.properties.password, (err, check) => {
                if (err) return res.status(500).send({ message: 'Error comparing password' })

                const {pass, ...safeProperties} = user.properties

                if (check) {
                    return res.status(200).send({ token: jwt.createToken(safeProperties) })
                }
            })
        } catch (e) {
            return res.status(500).send({ message: e.message })
        } finally {
            await session.close()
        }
    } else {
        return res.status(404).send({ message: 'Not enough data' })
    }
}

async function getById(req, res) {
    const userId = req.params.userId
    const session = driver.session()

    try {
        const result = await session.readTransaction(tx =>
            tx.run(`MATCH (u:User {userId: $userId}) RETURN u SKIP $skip LIMIT $limit`,
                { userId, skip: neo4j.int(0), limit: neo4j.int(1) })
        )

        const user = result.records[0].get('u')

        return res.status(200).send({ token: jwt.createToken(user) })
    } catch (e) {
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function addFavorite(req, res) {
    const { movieId, userId } = req.params
    const session = driver.session()

    try {
        const result = await session.writeTransaction(tx =>
            tx.run(`MATCH (u: User {userId: $userId})
                MATCH (m:Movie {tmdbId: $movieId})
                
                MERGE (u)-[r:HAS_FAVORITE]->(m)
                
                RETURN m {
                    .*,
                    favorite: true
                } AS movie`, { userId, movieId })
        )

        if (result.records.length === 0) return res.status(404).send({ message: `Could not create a relation for movie 
                ${movieId} by user ${userId}` })

        return res.status(200).send({ message: 'Successfully added to favorites', mv: toNativeTypes(result.records[0].get('movie')) })
    } catch (e) {
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function removeFavorite(req, res) {
    const { movieId, userId } = req.params
    const session = driver.session()

    try {
        const result = await session.writeTransaction(tx =>
            tx.run(`MATCH (u: User {userId: $userId})
                MATCH (m:Movie {tmdbId: $movieId})
                
                DELETE r
                
                RETURN m {
                    .*,
                    favorite: false
                } AS movie`, { userId, movieId })
        )

        if (result.records.length === 0) return res.status(404).send({ message: `Could not delete relation for movie 
                ${movieId} by user ${userId}` })

        return res.status(200).send({ message: 'Successfully removed from favorites', mv: toNativeTypes(result.records[0].get('movie')) })
    } catch (e) {
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

async function getFavorites (req, res) {
    const userId = req.params.userId
    const { sort, order, limit, skip } = req.query
    const session = driver.session()

    try {
        const result = await session.readTransaction(tx =>
            tx.run(`MATCH (u: User {userId: $userId})-[r: HAS_FAVORITE]->(m: Movie)
                RETURN m {
                    .*,
                    favorite: true
                } AS movie
                ORDER BY m.\`${sort}\`${order}
                LIMIT $limit SKIP $skip
            `, { userId, limit: neo4j.int(limit), skip: neo4j.int(skip) })
        )

        const favorites = result.records.map(row => toNativeTypes(row.get('movie')))

        return res.status(200).send(favorites)

    } catch (e) {
        return res.status(500).send({ message: e.message })
    } finally {
        await session.close()
    }
}

module.exports = {
    signUp,
    signIn,
    addFavorite,
    removeFavorite,
    getFavorites,
    getById
}
