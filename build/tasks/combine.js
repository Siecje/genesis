var gulp = require('gulp');
var concat = require('gulp-concat');
var paths = require('../paths');

gulp.task('combine', function() {
  return gulp.src([paths.vendor, paths.js])
    .pipe(concat('combined.js'))
    .pipe(gulp.dest(paths.output));
});
