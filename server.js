'use strict';

console.log( '-------------\nInitializing.' );

// Imports
var Config = require( './config.js' );
var Log = require( './models/log.js' );
var session = require( './middleware/session.js' );
var domain = require( 'domain' );
var fs = require( 'fs' );
var express = require( 'express' );
var compression = require( 'compression' );
var cookieParser = require( 'cookie-parser' );
var bodyParser = require( 'body-parser' );
var path = require( 'path' );

// Use domain to catch runtime errors and prevent termination of application

var d = domain.create();

d.on( 'error', function ( err ) {
  Log.error( err );
} );

d.run( function () {

  // Structure the HTTPS server
  var app = express();
  var server = require( 'http' ).createServer(app );

  // Configure Express
  app.engine( '.ejs', require( 'ejs' ).renderFile );
  app.set( 'view engine', 'ejs' );
  app.set( 'views', path.join( __dirname, '/source/templates' ) );
  app.use( compression( { level: 9, memLevel: 9 } ) );
  app.use( cookieParser() );
  app.use( bodyParser.json() );
  app.use( express.static( path.join( __dirname, '/public' ) ) );
  app.use( express.static( path.join( __dirname, '/source/bower_components' ) ) );
  app.use( session( Config.web.cookie.name ) );

  console.log( 'READY: Express' );

  // Set up handlers
  require( './routes' )( app );

  console.log( 'READY: Request Handlers' );

  // Start the server
  server.listen('5000', function () {
    console.log( 'Listening on port ' + 5000 + '.' );
  } );

} );