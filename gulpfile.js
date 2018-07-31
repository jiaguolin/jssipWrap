const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('babel', function()
{
  return gulp
    .src([ 'lib/**/*.js' ])
    .pipe(babel())
    .pipe(gulp.dest('lib-es5'));
});