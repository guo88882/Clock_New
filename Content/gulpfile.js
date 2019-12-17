var /*webserver = require('gulp-webserver')*/
  connect = require('gulp-connect'),
  gulp = require('gulp'), // 載入 gulp
  bourbon = require('node-bourbon').includePaths,
  gulpSass = require('gulp-sass') // 載入 gulp-sass

gulp.task('watch', function() {
  gulp.watch('assets/*.scss', ['sass'])
  gulp.watch('*.html', ['html'])
})

gulp.task('sass', function() {
  gulp
    .src('assets/*.scss') // 指定要處理的 Scss 檔案目錄
    .pipe(
      gulpSass({
        // 編譯 Scss
        includePaths: bourbon,
        outputStyle: 'compressed'
      })
    )
    .pipe(gulp.dest('assets')) // 指定編譯後的 css 檔案目錄
    .pipe(connect.reload()) // 當檔案異動後自動重新載入頁面
})

gulp.task('html', function() {
  gulp.src('*.html').pipe(connect.reload()) // 當檔案異動後自動重新載入頁面
})

gulp.task('webserver', function() {
  connect.server({
    livereload: true
  })
})

gulp.task('default', ['webserver', 'watch', 'html', 'sass'])
