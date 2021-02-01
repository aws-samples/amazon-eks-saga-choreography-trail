'use strict';

const dbops = require('../rds/list');

/**
 * Order trail
 *
**/
exports.orderTrail = function (req) {
  return new Promise(function (resolve, reject) {
    dbops.orderTrail(req, (err, res) => {
      if (err) {
        if (err.type === 'rule') {
          reject({
            code: 400,
            payload: { msg: `${err.msg}` }
          })
        } else {
          reject({
            code: 500,
            payload: { msg: `${err.msg}` }
          })
        }
      } else {
        resolve({
          code: 200,
          payload: res.orderTrail
        })
      }
    })
  });
}