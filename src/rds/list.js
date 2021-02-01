'use strict';

const mysql = require('mysql2');
const AWS = require('aws-sdk');

const logger = require('../utils/logger')

function getToken(dbConfig, cb) {
  var signer = new AWS.RDS.Signer();
  signer.getAuthToken({
    region: dbConfig.region,
    hostname: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.dbuser
  }, (err, token) => {
    if (err) {
      logger.error(`Error getting token ${err.code}`)
      cb(err, null)
    } else {
      dbConfig.token = token
      cb(null, dbConfig)
    }
  })
}

function getDbConnection(dbConfig, cb) {
  var conn = mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.dbuser,
    password: dbConfig.token,
    database: dbConfig.db,
    ssl: 'Amazon RDS',
    authPlugins: {
      mysql_clear_password: () => () => Buffer.from(dbConfig.token + '\0')
    }
  });

  conn.connect((err) => {
    if (err) {
      logger.error(`Database connection failed - ${err.code} ${err.message}`)
      cb(err, null)
    } else {
      logger.info(`Database connected.`)
      cb(null, conn)
    }
  })
}

function getResultsArray(results) {
  if (results.length === 0) {
    return []
  } else {
    let ra = []
    for (var i = 0; i < results.length; i++) {
      let r = results[i]
      ra.push({
        us: r.saga_us,
        status: r.saga_us_status,
        message: r.saga_us_msg,
        ts: r.trail_timestamp
      })
    }
    return ra
  }
}

function orderTrail(req, cb) {
  let dbConfig = req.rdsConfig

  getToken(dbConfig, (iamErr, dbToken) => {
    if (iamErr) {
      logger.error(`Error obtaining token - ${iamErr.code} ${iamErr.message}`)
      cb({ type: 'iam', msg: `Error obtaining token - ${iamErr.code}` }, null)
    } else {
      getDbConnection(dbToken, (dbErr, conn) => {
        if (dbErr) {
          cb({ type: 'rds', msg: `Database connection failed - ${dbErr.code} - ${dbErr.message}` }, null)
        } else {
          let q = `SELECT * FROM ${dbToken.db}.order_trail where order_id = ${req.orderId};`
          conn.query(q, (qryErr, results) => {
            conn.end()
            if (qryErr) {
              logger.error(`Error running query - ${qryErr.code} - ${qryErr.message}`)
              cb({ type: 'rds', msg: `Error running query - ${qryErr.code} - ${qryErr.message}` }, null)
            } else {
              logger.info(`Trail returned - ${req.orderId}`)
              cb(null, {
                orderTrail: {
                  orderId: parseInt(req.orderId),
                  trail: getResultsArray(results)
                }
              })
            }
          })
        }
      })
    }
  })
}

module.exports = {
  orderTrail: orderTrail
}