/**
 * Created by medra_000 on 12/4/2015.
 */

'use strict';

var Page = require( '../models/page.js' );
var assert = require( 'assert' );
var Setup = require("./setup/page.js");

var Config = require( '../config.js' );
var util = require( 'util' );
var mongojs = require( 'mongojs' );
var db = mongojs( Config.services.db.mongodb.uri );

describe( 'Page', function() {
    var scope = {};
    before(Setup(scope));

    after(function (done) {
        db.dropDatabase(done);
      });

    describe('#add', function () {
        context('all valid entries', function () {
            it('should add a page to database', function (done) {
                Page.add(scope.pageData, function (err, _page) {
                    if (err) {
                        throw err;
                    }
                    scope.page = _page;
                    done();
                })
            });
            it('should return page with correct data', function () {
                assert.equal( scope.page.minilesson_id, scope.pageData.minilesson_id);
                assert.equal( scope.page.title, scope.pageData.title);
                assert.equal( scope.page.resource, scope.pageData.resource);
            });
        });

        context('all valid entries (no resource)', function () {
            it('should add a page to database', function (done) {

                delete scope.pageData.resource;
                Page.add( scope.pageData, function(err, _page) {
                    scope.pageData.resource = scope.pageResource;
                    if(err) {
                        throw err;
                    }
                    scope.page = _page;
                    done();
                });
            });
            it('should return page with correct data', function () {
                assert.equal( scope.page.minilesson_id, scope.pageData.minilesson_id);
                assert.equal( scope.page.title, scope.pageData.title);
                assert.equal( scope.page.resource, undefined);
            });
        });

        context('no user_id', function () {
            it('should throw an error', function (done) {
                 assert.throws(function() {
                    delete scope.pageData.user_id;
                    Page.add(scope.pageData, function (err) {
                        scope.pageData.user_id = scope.teacher._id;
                        if (err) {
                            throw err
                        }
                    });
                 });
                 done();
            })
        });

        context('no minilesson_id', function () {
            it('should throw an error', function (done) {
                assert.throws(function() {
                    delete scope.pageData.minilesson_id;
                    Page.add(scope.pageData, function (err) {
                        scope.pageData.minilesson_id = String(scope.minilesson._id);
                        if (err) {
                            throw err
                        }
                    });
                });
                done();
            })
        });

        context('no title', function () {
            it('should throw an error', function (done) {
                assert.throws(function() {
                    delete scope.pageData.title;
                    Page.add(scope.pageData, function (err) {
                        scope.pageData.title = scope.pageTitle;
                        if (err) {
                            throw err
                        }
                    });
                });
                done();
            })
        });
    });

    describe('#get', function () {
        context('single page _id argument', function() {
            it('should get a page without error', function(done){
                Page.get({_id: scope.page._id}, done);
            });
            it('should get a page with correct data', function(done){
                Page.get({_id: scope.page._id}, function(err, _page){
                    if(err){
                        done(err);
                    } else {
                        assert.equal(scope.page.minilesson_id, _page.minilesson_id);
                        assert.equal(scope.page.title, _page.title);
                        assert.equal(scope.page.resource, _page.resource);
                        done();
                    }
                });
            });
        });
        context("page_id and user_id arguments", function(){
            it('should get a page without error', function(done){
                Page.get({_id: scope.page._id, user_id: scope.teacher._id}, done);
            })
        })
    });

    describe('#list', function () {
        context('user_id and minilesson_id arguments', function(){
            it('should return list of pages without error', function(done){
                Page.list({user_id: scope.teacher._id,
                    minilesson_id: String(scope.minilesson._id)}, done);
            });
        });
        context('user_id missing', function(){
            it('should throw an error', function(done){
                assert.throws(function() {
                    Page.list({minilesson_id: String(scope.minilesson._id)}, function (err) {
                        if (err) {
                            throw err;
                        }
                    });
                }, Error, 'Error Thrown');
                done();
            });
        });
        context('minilesson_id missing', function(){
            it('should throw an error', function(done){
                assert.throws(function(){
                    Page.list({user_id: scope.teacher._id}, function(err){
                        if(err){
                            throw err;
                        }
                    });
                }, Error, 'Error Thrown');
                done();
            })
        });
    });

    describe('#remove', function () {
        context('valid page_id', function(){
            it('should remove page without error', function(done){
                Page.add(scope.pageData, function(err, _page){
                    if(err){
                        throw err;
                    } else {
                        Page.remove({_id:_page._id, user_id: scope.pageData.user_id}, done);
                    }
                });
            });
        });
    });
});