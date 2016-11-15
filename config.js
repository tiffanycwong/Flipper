/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

/**
 * Gets a config value from package.json; if it does not exist, it gets it from the environment variables; if that
 * doesn't exist, this function returns the specified default value.
 *
 * @param {string} k - name of config variable
 * @param {*} d - default value to return if config value not found
 * @return {*} - config value
 */
var v = function ( k, d ) {
  if ( k in process.env ) {
    return process.env[ k ];
  } else if ( ( 'npm_package_config_' + k ) in process.env ) {
    var v = process.env[ 'npm_package_config_' + k ];
    try {
      return JSON.parse( v );
    } catch ( err ) {
      return v;
    }
  } else {
    return d;
  }
};

module.exports = {
  verbose: v( 'verbose', true ),
  web: {
    name: 'Flipper',
    version: '1.0.0',
    cookie: {
      name: 'apikey'
    },
    protocol: 'http',
    hostname: v( 'host', 'localhost' ),
    http_port: parseInt( v( 'http_port', 80 ), 10 ),
    https_port: parseInt( v( 'https_port', 443 ), 10 )
  },
  services: {
    db: {
      mongodb: {
        db: 'flipper_' + v( 'branch', 'master' ),
        uri: v( 'mongo', 'localhost' ) + '/flipper_' + v( 'branch', 'master' )
      }
    }
  },
  registration: {
    name: {
      length: {
        min: 3,
        max: 100
      }
    },
    username: {
      length: {
        min: 4,
        max: 15
      },
      regex: {
        valid: '^[A-Za-z0-9_]*$'
      }
    },
    password: {
      length: {
        min: 8,
        max: 32
      },
      regex: {
        hasNumeral: '[0-9]',
        hasUpper: '[A-Z]',
        hasLower: '[a-z]'
      }
    }
  }
};
