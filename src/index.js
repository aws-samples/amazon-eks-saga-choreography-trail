const express = require('express')
const morgan = require('morgan')

const trailSvc = require('./service/trail')
const logger = require('./utils/logger')
const appConfig = require('./utils/config').getAppConfig()

if (Object.keys(appConfig).length === 0) {
  logger.error(`Configuration data was not received.`)
  process.exit(1)
}

const app = express()

app.use(morgan('dev'))

const serverPort = process.env.PORT || 8080;

app.get('/ping', (req, res) => {
  res.status(200).json({
    msg: 'OK'
  })
})

app.get('/eks-saga/trail/:orderId', (req, res) => {
  trailSvc.orderTrail({
    orderId: req.params.orderId,
    rdsConfig: appConfig.rds
  })
    .then((resp) => {
      res.status(resp.code).json(resp.payload)
    })
    .catch((resp) => {
      res.status(resp.code).json(resp.payload)
    })
})

app.use('/', (req, res) => {
  res.status(404).json({
    msg: `${req.path} is not supported.`
  })
})

app.listen(serverPort, () => {
  logger.info(`Trail microservice is up at ${serverPort}`)
})