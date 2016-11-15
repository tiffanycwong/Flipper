'use strict';

var Submission = require("../../models/submission.js");
var MCQ = require("../../models/mcq.js");
var Course = require("../../models/course.js");
var Minilesson = require("../../models/minilesson.js");

module.exports = function (scope) {
	return function ( done ) {
	  // Make sure minilesson is set up
	  (require( './mcq.js' )(scope))( function () {
      MCQ.add({
        user_id: String(scope.teacher._id),
        page_id: String(scope.pageYesterday._id),
        question: scope.question,
        answers: scope.manyChoiceList,
        answer: scope.answer
      }, function (err, _mcqYesterday) {
        if (err) {
          throw err;
        }
        scope.mcqYesterday = _mcqYesterday;
        MCQ.add({
            user_id: String(scope.teacher._id),
            page_id: String(scope.pageMonth._id),
            question: scope.question,
            answers: scope.manyChoiceList,
            answer: scope.answer
          }, function(err, _mcqMonth) {
          if (err) {
            throw err;
          }
          scope.mcqMonth = _mcqMonth;
            Course.join({
              _id: String(scope.course._id),
              student_id: String(scope.student._id)
            }, function(err, _course) {
              if(err) {
                throw err;
              }
              Course.acceptStudent({
                _id: String(scope.course._id),
                teacher_id: String(scope.teacher._id),
                student_id: String(scope.student._id)
              }, function(err, _course ) {
                if (err) {
                  throw err;
                }
                Minilesson.publish({
                  user_id: String(scope.teacher._id),
                  course_id: String(scope.course._id),
                  minilesson_id: String(scope.minilessonYesterday._id)
                }, function(err) {
                  if (err) {
                    throw err;
                  }
                  Minilesson.publish({
                    user_id: String(scope.teacher._id),
                    course_id: String(scope.course._id),
                    minilesson_id: String(scope.minilesson._id)
                  }, function(err) {
                    if (err) {
                      throw err;
                    }
                      scope.submissionData = {
  	                    user_id: String(scope.student._id),
  	                    mcq_id: String(scope.mcqMonth._id),
  	                    answer: scope.answer
  	                    };
                      done();

                    });
                });
                
              });
              
            });

        });
    });


	  } );

	};
}
