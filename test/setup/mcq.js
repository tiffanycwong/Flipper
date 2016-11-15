'use strict';

var Page = require("../../models/page.js");
var Minilesson = require("../../models/minilesson.js");

module.exports = function (scope) {
	return function ( done ) {
	  // Make sure minilesson is set up
	  (require( './page.js' )(scope))( function () {
			scope.question = "What is the difference between a hot tub and jacuzzi?";
			scope.emptyString = "";
			scope.oneChoiceList = ["nothing"];
			scope.manyChoiceList = ["size", "everything", "nothing"];
			scope.emptyList =[];
			scope.answer = "nothing";

			scope.yesterday = new Date();
			scope.yesterday.setDate(scope.yesterday.getDate() - 1);

	        Minilesson.add({ // add "past due" minilesson
                user_id: scope.teacher._id,
                course_id: String(scope.course._id),
                due_date: scope.yesterday,
                title: 'Due Yesterday'
            }, function (err, _minilessonYesterday) {
                if (err) {
                    throw err;
                }
                scope.minilessonYesterday = _minilessonYesterday;
                Page.add( { // adding pageYesterday
                    user_id: String(scope.teacher._id),
                    minilesson_id: String(scope.minilessonYesterday._id),
                    title: scope.pageTitle,
                    resource: scope.pageResource
                  }, function(err, _pageYesterday) {
                    if (err) {
                      throw err;
                    }
                    scope.pageYesterday = _pageYesterday;
                    Page.add( { //adding pageMonth
                      user_id: String(scope.teacher._id),
                      minilesson_id: String(scope.minilesson._id),
                      title: scope.pageTitle,
                      resource: scope.pageResource
                    }, function (err, _pageMonth) {
                      if (err) {
                        throw err;
                      }
                      scope.pageMonth = _pageMonth;
                      scope.mcqData = {
                        user_id: String(scope.teacher._id),
                        page_id: String(scope.pageMonth._id),
                        question: scope.question,
                        answers: scope.manyChoiceList,
                        answer: scope.answer
                      }
                      done();

                    });
                  });
                  
            });


	  } );

	};
}
