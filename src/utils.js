'use strict'

const neo4j = require('neo4j-driver')

function toNativeTypes(properties) {
    return Object.fromEntries(Object.keys(properties).map((key) => {
        let value = valueToNativeType(properties[key])

        return [ key, value ]
    }))
}

/**
 * Convert an individual value to its JavaScript equivalent
 *
 * @param {any} value
 * @returns {any}
 */
function valueToNativeType(value) {
    if ( Array.isArray(value) ) {
        value = value.map(innerValue => valueToNativeType(innerValue))
    }
    else if ( neo4j.isInt(value) ) {
        value = value.toNumber()
    }
    else if (
        neo4j.isDate(value) ||
        neo4j.isDateTime(value) ||
        neo4j.isTime(value) ||
        neo4j.isLocalDateTime(value) ||
        neo4j.isLocalTime(value) ||
        neo4j.isDuration(value)
    ) {
        value = value.toString()
    }
    else if (typeof value === 'object' && value !== undefined  && value !== null) {
        value = toNativeTypes(value)
    }

    return value
}

module.exports = {
    toNativeTypes,
    valueToNativeType
}