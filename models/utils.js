/**
 * AUTHOR: Akash Krishnan <ak@aakay.net>
 */

'use strict';

var util = require( 'util' );
var ObjectId = require( 'mongojs' ).ObjectId;

module.exports = {
  noop: noop,
  safeFn: safeFn,
  validateObject: validateObject,
  regexEscape: regexEscape
};

/**
 * A function that does nothing.
 */
function noop() {
}

/**
 * Returns a function that can be executed if not originally defined. If the first argument is defined and of type
 * error, then its stack property will be printed and it will be replaced with its message property.
 *
 * @param {function|null|undefined} [fn] -
 * @return {function} -
 */
function safeFn( fn ) {
  return function () {
    if ( arguments[ 0 ] ) {
      if ( arguments[ 0 ] instanceof Error ) {
        require( './log.js' ).error( arguments[ 0 ] );
        arguments[ 0 ] = arguments[ 0 ].message;
      } else {
        require( './log.js' ).error( new Error( arguments[ 0 ] ) );
      }
    }
    ( fn || noop ).apply( null, arguments );
  };
}

/**
 * Generates a MongoDB-compatible query object from the given 'data' with the specified 'structure'
 *
 * TODO: 1) add enum support; 2) add array support; 3) add custom validation; 4) validate default values
 *
 * @param {object} data -
 * @param {object} structure -
 * @return {object} - post-validated data object
 */
function validateObject( data, structure ) {

  // Ensure data and structure are objects
  if ( data !== null && structure !== null && typeof data === 'object' && typeof structure === 'object' ) {

    var query = {};

    var validate = function ( p, prop ) {

      // Allow property to be renamed if new name is valid
      var q = p;
      if ( prop.name ) {

        // Check if the new property name isn't already in use
        if ( !( prop.name in query ) ) {
          q = prop.name;
        } else {

          // New property name is in use; let's complain about it
          throw new Error( util.format(
            'Unable to rename property from "%s" to "%s" because it already exists.',
            p, prop.name
          ) );

        }
      }

      // If a property type is defined, ensure the data matches
      if ( !prop.type || typeof data[ p ] === ( typeof prop.type === 'object' ? 'object' : prop.type ) ) {

        // Property exists; let's apply the filter
        if ( typeof prop.filter === 'function' ) {

          // Apply the filter function
          var res = prop.filter( data[ p ] );

          // Don't set property if it is undefined
          if ( typeof res !== 'undefined' ) {
            query[ q ] = res;
          }

        } else if ( typeof prop.filter === 'string' ) {

          // Apply pre-defined filters
          if ( prop.filter === 'string' ) {

            // Convert to string
            query[ q ] = String( data[ p ] );

          } else if ( prop.filter === 'trim' ) {

            if ( data[ p ] && data[ p ].trim() ) {
              query[ q ] = data[ p ].trim();
            }

          } else if ( prop.filter === 'MongoId' ) {

            // Convert to MongoId
            query[ q ] = new ObjectId( ( data[ p ] || '' ).toString() );

          } else if ( prop.filter === 'Date' ) {

            // Convert to Date object
            query[ q ] = new Date( ( data[ p ] || '' ).toString() );

          } else if ( prop.filter === 'regex' ) {

            if ( data[ p ] ) {
              query[ q ] = new RegExp( regexEscape( data[ p ].toString().trim() ), 'i' );
            }

          } else if ( prop.filter === 'projection' ) {

            query[ p ] = validateObject( data[ p ], prop.type );

            // Ensure all property values are false
            var keys = Object.keys( query[ p ] );
            keys.forEach( function ( key ) {
              if ( query[ p ][ key ] !== false ) {
                throw new Error( 'Invalid projection value.' );
              }
            } );

          } else {

            // Invalid filter; let's complain about it
            throw new Error( util.format( 'Invalid filter name: %s, for property: %s.', prop.filter, p ) );

          }

        } else if ( typeof prop.type === 'object' ) {

          // Treat all objects as a mongo query
          query[ q ] = validateObject( data[ p ], prop.type );

        } else {

          // Pass the value through
          query[ q ] = data[ p ];

        }

      } else {

        // Invalid property type, so let's complain about it
        throw new Error( util.format(
          'Received invalid type for property: %s. Expected: %s. Found: %s.',
          p, prop.type, typeof data[ p ]
        ) );

      }

      if ( !( q in query ) && prop.required ) {
        throw new Error( util.format( 'Missing required post-filter property: %s.', p ) );
      }

    };

    // Loop through all base properties in structure
    Object.keys( structure ).forEach( function ( p ) {

      var prop = structure[ p ];

      // Ensure property is defined properly
      if ( prop && typeof prop === 'object' ) {

        // Check if property exists in data
        if ( p in data ) {

          validate( p, prop );

        } else {

          // Check if this is a required property
          if ( prop.required ) {

            // Required property doesn't exist, so let's complain about it
            throw new Error( util.format( 'Missing required property: %s.', p ) );

          }

          // Set default if defined
          if ( 'default' in prop ) {
            query[ p ] = prop.default;
          }

        }

      } else {

        // Invalid property definition; let's complain about it
        throw new Error( util.format( 'Invalid definition for property: %s.', p ) );

      }

    } );

    return query;

  }

  // We shouldn't get here; let's complain about it
  throw new Error( 'Invalid usage. Ensure arguments are objects.' );

}

function regexEscape( str ) {
  return str.replace( /[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&' );
}
