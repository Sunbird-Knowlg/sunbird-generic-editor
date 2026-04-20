var gulp = require('gulp');
var inject = require('gulp-inject');
var CacheBuster = require('gulp-cachebust');
var mergeStream = require('merge-stream');
var fs = require('fs');
var zip = require('gulp-zip');
var replace = require('gulp-string-replace');
var packageJson = JSON.parse(fs.readFileSync('./package.json'));
var rename = require("gulp-rename");
var clean = require('gulp-clean');
var gzip = require('gulp-gzip');

var cachebust = new CacheBuster();

// ─── Leaf tasks ───────────────────────────────────────────────────────────────

gulp.task('renameminifiedfiles', function() {
    var js = gulp.src('scripts/*.min.js').pipe(cachebust.resources()).pipe(gulp.dest('scripts/'));
    var css = gulp.src('styles/*.min.css').pipe(cachebust.resources()).pipe(gulp.dest('styles/'));
    return mergeStream(js, css);
});

gulp.task('copystyleImages', function() {
    return gulp.src(['*.svg', '*.png'], {
            base: './'
        })
        .pipe(gulp.dest('styles'));
});

gulp.task('clean', function() {
    return gulp.src(['*.svg', '*.png'], {read: false})
        .pipe(clean());
});

gulp.task('injectrenamedfiles', function() {
    var target = gulp.src('index.html');
    var sources = gulp.src(['scripts/*.min.*.js', 'styles/*.min.*.css'], { read: false });
    return target.pipe(inject(sources, { ignorePath: '/', addRootSlash: false })).pipe(gulp.dest('./'));
});

gulp.task('bower-package', function() {
    return gulp.src(['**', '!node_modules', '!node_modules/**', '!scripts/contenteditor.min.js', '!scripts/plugin-framework.min.js', '!gulpfile.js', '!package.json']).pipe(gulp.dest('build/'));
});

// ─── Composite tasks ──────────────────────────────────────────────────────────

gulp.task('iframe-compress', gulp.series('bower-package', function iframeCompressTask() {
    return gulp.src(['build/**/*.js', 'build/**/*.css', 'build/**/*.html', 'build/**/*.png', 'build/**/*.ttf', 'build/**/*.woff', 'build/**/*.woff2'])
        .pipe(gzip())
        .pipe(gulp.dest('build'));
}));

gulp.task('iframe-package', gulp.series('iframe-compress', function iframePackageTask() {
    var package_id = packageJson['name'] + '-' + 'iframe' + '-' + packageJson['version'];
    return mergeStream(
        gulp.src('build/**').pipe(zip(package_id + '.zip')).pipe(gulp.dest('dist/editor/')),
        gulp.src('build/**').pipe(zip(packageJson['name'] + '-iframe-latest' + '.zip')).pipe(gulp.dest('dist/editor/'))
    );
}));

gulp.task('bower-package-transform', gulp.series('iframe-package', function bowerPackageTransformTask() {
    return mergeStream(
        gulp.src('build/index.html')
            .pipe(replace('href="styles', 'href="content-editor-embed/styles'))
            .pipe(replace('src="scripts', 'src="content-editor-embed/scripts'))
            .pipe(replace("'templates", "'content-editor-embed/templates"))
            .pipe(gulp.dest('build/')),
        gulp.src('build/scripts/script.min.js')
            .pipe(replace("src='scripts", "src='content-editor-embed/scripts"))
            .pipe(gulp.dest('build/scripts/'))
    );
}));

gulp.task('embed-compress', gulp.series('bower-package-transform', function embedCompressTask() {
    return gulp.src(['build/index.html'])
        .pipe(gzip())
        .pipe(gulp.dest('build'));
}));

gulp.task('embed-package', gulp.series('embed-compress', function embedPackageTask() {
    var package_id = packageJson['name'] + '-' + 'embed' + '-' + packageJson['version'];
    return mergeStream(
        gulp.src('build/**').pipe(zip(package_id + '.zip')).pipe(gulp.dest('dist/editor/')),
        gulp.src('build/**').pipe(zip(packageJson['name'] + '-embed-latest' + '.zip')).pipe(gulp.dest('dist/editor/'))
    );
}));

gulp.task('rename-coreplugins', gulp.series('embed-package', function renameCorepluginTask() {
    return gulp.src("build/scripts/coreplugins.js").pipe(rename("index.js")).pipe(gulp.dest("build/coreplugins/"));
}));

gulp.task('coreplugins-package', gulp.series('rename-coreplugins', function corepluginPackageTask() {
    var package_id = packageJson['name'] + '-' + 'coreplugins' + '-' + packageJson['config'].corePluginVersion;
    return gulp.src('build/coreplugins/*').pipe(zip(package_id + '.zip')).pipe(gulp.dest('dist/coreplugins/'));
}));

gulp.task('package', gulp.series(
    gulp.parallel('renameminifiedfiles', 'injectrenamedfiles'),
    'coreplugins-package'
));
