'use strict';

var Minilesson = require("../../models/minilesson.js");

module.exports = function (scope) {
	return function ( done ) {
	  // Make sure minilesson is set up
	  (require( './minilesson.js' )(scope))( function () {

		scope.pageTitle = "Page Title";
		scope.pageResource = "www.flipperSwag.com";

        Minilesson.add({
            user_id: scope.teacher._id,
            course_id: String(scope.course._id),
            due_date: scope.nextMonth,
            title: 'Title'
        }, function (err, _minilesson) {
            if (err) {
                throw err;
            }
            scope.minilesson = _minilesson;
            scope.pageData = {
                user_id: String(scope.teacher._id),
                minilesson_id: String(scope.minilesson._id),
                title: scope.pageTitle,
                resource: scope.pageResource
            };
            done();
        });

	  } );

	};
}
