// Speak Gulp File for local development 2018
// Any questions or concerns message Forrest
// Most, if not all, documentation concerning gulp, npm, node can be found at nodejs.org and npmjs.com and gulpjs.com
// Any of the below tasks can be modified, deleted, or new ones created to fit specific needs and team adjustments moving forward

const gulp = require( 'gulp' ), // Task Runner
      ext_replace = require('gulp-ext-replace'), // Replaces extension name
      pug = require('gulp-pug'), // Compiles pug files (I like pugs)
      git = require('gulp-git'), // Runs git commands through tasks
      runSequence = require('run-sequence'), // Runs tasks in sequential order
      sass = require('gulp-sass'), // Compiles SASS/SCSS into CSS
      sassLint = require('gulp-sass-lint'), // Linter for SASS and SCSS
      notify = require('gulp-notify'), // Notification for errors in code
      plumber = require('gulp-plumber'), // Error check without failing stream
      connect = require('gulp-connect'), // Localhost server for active development
      proxy = require('http-proxy-middleware'), // Proxy options to reroute localhost to sitewrench
      cachebust = require('gulp-cache-bust'), // Cache buster for head.inc file
      imagemin = require('gulp-imagemin'), // Image compressor for build task
      autoprefixer = require('autoprefixer'), // Autoprefixer for previous 2 versions of browsers
      csswring = require('csswring'), // CSS minifier
      postcss = require('gulp-postcss'), // CSS processor to allow better efficiency on minificatino and prefixing
      less2sass = require('gulp-less2sass'),
      htmlmin = require('gulp-htmlmin'); // Minify .master and .inc files for faster delivery


/*TODO:
 - add eslint
 - add file concat and minifyJS
 - fix less2sass task
 - add jpg image compression
*/

      
//Replace siteID XXXX with SiteID number for projects
var siteID = XXXX;


// Proxy middleware options
// Replace XXXXXXXX in URL with desired site redirect
var options = {
  target: 'http://XXXXXXX.sitewrench.com', // target host
  changeOrigin: true // needed for virtual hosted sites
};


// Live Development Server at http://localhost:siteID using proxy
// This task allows all changes to be reloaded for local development
// If you need to run multiple gulp servers at the same time switch this port to another such as 8000 or 9000 to run concurrently
//Change port number to SiteID
gulp.task('server', function() {
  connect.server({
    root: ".",
    port: siteID,
    open: true,
    middleware: function() {
      return [
        proxy(options)
      ]
    },
});
});


// Styles compilation error if process fails
var onError = function(err) {
  notify.onError({
    title:    "Gulp",
    subtitle: "Failure!",
    message:  "Error: <%= error.message %>",
    sound:    "Basso"
  })(err);
  this.emit('end');
};


// Options feeding into postcss tasks
const processors = [
  csswring,
  autoprefixer({browsers:['last 2 version']})
]


// Sass/Scss compiler, minify task
// Compiles stylesheets minifies and prefixes while avoiding closing the stream with plumber
gulp.task('styles', function() {
  return gulp.src('css/master.scss')
    .pipe(plumber({errorHandler: onError}))
    .pipe(sass())
    .pipe(postcss(processors))
    .pipe(gulp.dest('css'));
});


// Sass linter
// Linter works constantly to check for errors using the sass-lint.yml config file for specific syntax checking
gulp.task('sass-lint', function() {
  gulp.src('scss/**/*.scss')
    .pipe(sassLint({configFile: 'CSS/sass-lint/sass-lint.yml'}))
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError());
});

// Less to Sass Conversion
gulp.task('less2sass', function() {
  gulp.src('in.less')
      .pipe(less2sass())
      .pipe(gulp.dest('./lesssass-output'));

  // Check ./output/in.scss
});


// Git add, commit, and push tasks
gulp.task('add', function() {
  console.log('adding...');
  return gulp.src('.')
    .pipe(git.add());
});

gulp.task('commit', function() {
  console.log('commiting');
  return gulp.src('.')
    .pipe(git.commit("Update"));
});

gulp.task('push', function(){
  console.log('pushing...');
  git.push('origin', 'master', function (err) {
    if (err) throw err;
  });
});

// Commit and Push changes
// This task can be added to watch task so every save will trigger a commit and push to buddy
// This may require individual set-up so let Forrest know if this is a functionality you would like to have
gulp.task('gitsend', function() {
  runSequence('commit', 'push');
});


// Compile pug to .master files and places them in the masterpages directory
gulp.task('pug-master', function() {
  return gulp.src('masterpages/pug-master/*.pug')
  .pipe(pug())
  .pipe(ext_replace('.master'))
  .pipe(gulp.dest('masterpages'));
});


// Compile pug to .inc files and places them in the masterpages/includes directory
gulp.task('pug-inc', function() {
  return gulp.src('masterpages/includes/pug-inc/*.pug')
  .pipe(pug())
  .pipe(ext_replace('.inc'))
  .pipe(gulp.dest('masterpages/includes'));
});


// Minify .master for faster load times
gulp.task('minifymaster', function() {
  return gulp.src('masterpages/*.master')
    .pipe(htmlmin({collapseWhitespace: true,minifyJS:true}))
    .pipe(gulp.dest('masterpages/'));
});


// Minify .inc for faster load times
gulp.task('minifyinc', function() {
  return gulp.src('masterpages/includes/*.inc')
    .pipe(htmlmin({collapseWhitespace: true,minifyJS:true}))
    .pipe(gulp.dest('masterpages/includes/'));
});

// Streamlining .master and .inc minifification processes
gulp.task('minifysrc', function() {
  runSequence('minifymaster', 'minifyinc');
});

// Cache-buster for head.inc script and stylesheets
gulp.task('cache-bust', function() {
  return gulp.src('./masterpages/includes/head.inc')
    .pipe(cachebust({
        type: 'timestamp'
    }))
    .pipe(gulp.dest('./masterpages/includes/'));
})


// Image compression during build task to optimize and provide faster load times
gulp.task('image-min', function() {
    gulp.src('CSS/images/*')
        .pipe(imagemin([
          imagemin.gifsicle({interlaced: true}),
          imagemin.jpegtran({progressive: true}),
          imagemin.optipng({optimizationLevel: 5}),
          imagemin.svgo({
              plugins: [
                  {removeViewBox: true},
                  {cleanupIDs: false}
              ]
          })
        ]))
        .pipe(gulp.dest('CSS/images'))
});


// Watch task to implement any changes on pug or scss files and compile on save
// Files are automatically loaded to web-server and available for viewing on save
gulp.task('watch', function() {
  
  gulp.watch('masterpages/pug-master/*.pug', ['pug-master']);
  gulp.watch('masterpages/includes/pug-inc/*.pug', ['pug-inc']);
  gulp.watch('css/**/*.scss', ['styles']);  

});

// Default task runs server for active development, web-server for file hosting, and watch task to save, compile, and load file changes
gulp.task('start', function() {
  gulp.start('server', 'watch');
});