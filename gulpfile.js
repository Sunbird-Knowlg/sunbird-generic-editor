var gulp = require('gulp');
var chug = require('gulp-chug');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var minify = require('gulp-minifier');
var stripDebug = require('gulp-strip-debug');
var mainBowerFiles = require('gulp-main-bower-files');
var gulpFilter = require('gulp-filter');
var inject = require('gulp-inject');
var CacheBuster = require('gulp-cachebust');
var mergeStream = require('merge-stream');
var rename = require("gulp-rename");
var merge = require('merge-stream');
var replace = require('gulp-string-replace');

var cachebust = new CacheBuster();
const zip = require('gulp-zip');

var fs = require('fs');
var json = JSON.parse(fs.readFileSync('package.json'));

var bower_components = [
    "app/libs/please-wait.min.js",
    "app/bower_components/jquery/dist/jquery.js",
    "app/bower_components/async/dist/async.min.js",
    "app/libs/semantic.min.js",
    "app/bower_components/angular/angular.js",
    "app/bower_components/lodash/lodash.js",
    "app/bower_components/x2js/index.js",
    "app/bower_components/eventbus/index.js",
    "app/bower_components/uuid/index.js",
    "app/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js",
    "app/bower_components/ng-dialog/js/ngDialog.js",
    "app/bower_components/ngSafeApply/index.js",
    "app/bower_components/oclazyload/dist/modules/ocLazyLoad.core.js",
    "app/bower_components/oclazyload/dist/modules/ocLazyLoad.directive.js",
    "app/bower_components/oclazyload/dist/modules/ocLazyLoad.loaders.common.js",
    "app/bower_components/oclazyload/dist/modules/ocLazyLoad.loaders.core.js",
    "app/bower_components/oclazyload/dist/modules/ocLazyLoad.loaders.cssLoader.js",
    "app/bower_components/oclazyload/dist/modules/ocLazyLoad.loaders.jsLoader.js",
    "app/bower_components/oclazyload/dist/modules/ocLazyLoad.loaders.templatesLoader.js",
    "app/bower_components/oclazyload/dist/modules/ocLazyLoad.polyfill.ie8.js",
    "app/bower_components/oclazyload/dist/ocLazyLoad.js",
    "app/scripts/genericeditor/md5.js"
];

var bower_css = [
    "app/bower_components/font-awesome/css/font-awesome.css",
    "app/bower_components/ng-dialog/css/ngDialog.min.css",
    "app/bower_components/ng-dialog/css/ngDialog-theme-plain.min.css",
    "app/bower_components/ng-dialog/css/ngDialog-theme-default.min.css",
    "app/libs/spinkit.css",
    "app/libs/please-wait.css"
];

var scriptfiles = [
    "app/bower_components/contenteditor/index.js",
    "app/scripts/genericeditor/bootstrap-editor.js",
    "app/scripts/genericeditor/genericeditor-config.js",
    "app/scripts/genericeditor/genericeditor-api.js",
    "app/scripts/genericeditor/genericeditor-base-plugin.js",
    "app/scripts/genericeditor/manager/container-manager.js",        
    "app/scripts/genericeditor/manager/canvas-manager.js",
    "app/scripts/angular/controller/main.js",
    "app/scripts/angular/directive/template-compiler-directive.js",
];

gulp.task('setup', function() {
    gulp.src('semantic/dist', {
        read: false
    }).pipe(clean())
    gulp.src(['app/config/theme.config']).pipe(gulp.dest('semantic/src/'))
    gulp.src(['app/config/site.variables']).pipe(gulp.dest('semantic/src/site/globals/'))
    gulp.src('semantic/gulpfile.js')
        .pipe(chug({
            tasks: ['build']
        }, function() {
            gulp.src(['semantic/dist/semantic.min.css']).pipe(gulp.dest('app/styles/'));
            gulp.src(['semantic/dist/themes/**/*']).pipe(gulp.dest('app/styles/themes'));
            gulp.src(['semantic/dist/semantic.min.js']).pipe(gulp.dest('app/libs/'));
        }))
});


gulp.task('minifyCE', function() {
    return gulp.src(scriptfiles)
        .pipe(concat('genericeditor.min.js'))
        .pipe(gulp.dest('generic-editor/scripts'));
});


gulp.task('minifyCSS', function() {
    return gulp.src([
            'app/styles/semantic.min.css',
            'app/styles/content-editor.css',
            'app/styles/MyFontsWebfontsKit.css',
            'app/styles/iconfont.css',
            'app/styles/noto.css',
            'app/styles/css/header.css',
            'app/styles/css/container.css',
            'app/styles/css/commonStyles.css'

        ])
        .pipe(concat('style.min.css'))
        .pipe(minify({
            minify: true,
            collapseWhitespace: true,
            conservativeCollapse: true,
            minifyJS: true,
            minifyCSS: true,
            getKeptComment: function(content, filePath) {
                var m = content.match(/\/\*![\s\S]*?\*\//img);
                return m && m.join('\n') + '\n' || '';
            }
        }))
        .pipe(gulp.dest('generic-editor/styles'));
});

gulp.task('minifyJsBower', function() {
    return gulp.src(bower_components)
        .pipe(concat('external.min.js'))
        .pipe(gulp.dest('generic-editor/scripts/'));
});

gulp.task('minifyCssBower', function() {
    return gulp.src(bower_css)
        .pipe(concat('external.min.css'))
        .pipe(gulp.dest('generic-editor/styles'));
});


gulp.task('copyfonts', function() {
    return gulp.src(['app/styles/themes/**/*', 'app/styles/webfonts/**/*', 'app/styles/fonts/*'], {
            base: 'app/styles/'
        })
        .pipe(gulp.dest('generic-editor/styles'));
});
gulp.task('copyfontawsomefonts', function() {
    return gulp.src(['app/bower_components/font-awesome/fonts/fontawesome-webfont.ttf', 'app/bower_components/font-awesome/fonts/fontawesome-webfont.woff'], {
            base: 'app/bower_components/font-awesome/fonts/'
        })
        .pipe(gulp.dest('generic-editor/styles/fonts'));
});
gulp.task('copyFiles', function() {
    return gulp.src(['app/images/editor-frame.png', 'app/config/*.json', 'app/index.html'], {
            base: 'app/'
        })
        .pipe(gulp.dest('generic-editor'));
});

gulp.task('copydeploydependencies', function() {
    return gulp.src(['deploy/gulpfile.js', 'deploy/package.json'], {
            base: ''
        })
        .pipe(gulp.dest('generic-editor'));
});

gulp.task('copyPluginFramework', function() {
    return gulp.src(['app/scripts/plugin-framework.min.js'], {
            base: 'app/scripts'
        })
        .pipe(gulp.dest('generic-editor/scripts'));
});


gulp.task('minify', ['minifyCE', 'minifyCSS', 'minifyJsBower', 'minifyCssBower', 'copyfonts', 'copyfontawsomefonts', 'copyFiles', 'copyPluginFramework','copydeploydependencies']);

gulp.task('inject', ['minify'], function() {
    var target = gulp.src('generic-editor/index.html');
    var sources = gulp.src(['generic-editor/scripts/external.min.js', 'generic-editor/scripts/genericeditor.min.js', 'generic-editor/styles/*.css'], {
        read: false
    });
    return target
        .pipe(inject(sources, {
            ignorePath: 'generic-editor/',
            addRootSlash: false
        }))
        .pipe(gulp.dest('./generic-editor'));
});

gulp.task('replace', ['inject'], function() {
    return mergeStream([
        gulp.src(["generic-editor/styles/external.min.css"]).pipe(replace('../fonts', 'fonts')).pipe(gulp.dest('generic-editor/styles')),
        gulp.src(["generic-editor/scripts/genericeditor.min.js"]).pipe(replace('/plugins', '/content-plugins')).pipe(replace("'https://dev.ekstep.in'", "''")).pipe(replace('dispatcher: "local"', 'dispatcher: "console"')).pipe(gulp.dest('generic-editor/scripts/'))
    ]);
});

gulp.task('zip', ['minify', 'inject', 'replace', 'packageCorePlugins'], function() {
    return gulp.src('generic-editor/**')
        .pipe(zip('generic-editor.zip'))
        .pipe(gulp.dest(''));
});

gulp.task('build', ['minify','inject', 'replace', 'packageCorePlugins', 'zip']);

var corePlugins = [
    "org.ekstep.conceptselector-1.0",
    "org.ekstep.assetbrowser-1.0",
    "org.ekstep.editcontentmeta-1.0",
    "org.ekstep.uploadcontent-1.0",
    "org.ekstep.contenteditorfunctions-1.0"
]

gulp.task('minifyCorePlugins', function() {
    var tasks = [];
    corePlugins.forEach(function(plugin) {
        tasks.push(
            gulp.src('plugins/' + plugin + '/editor/plugin.js')
            .pipe(minify({
                minify: true,
                collapseWhitespace: true,
                conservativeCollapse: true,
                minifyJS: true,
                minifyCSS: true,
                mangle: false
            }))
            .pipe(rename('plugin.min.js'))
            .pipe(gulp.dest('plugins/' + plugin + '/editor'))
        );
    });
    return mergeStream(tasks);
});

gulp.task('packageCorePluginsLocal', ["minifyCorePlugins"], function() {
    var fs = require('fs');
    var _ = require('lodash');
    var jsDependencies = [];
    var cssDependencies = [];
    if (fs.existsSync('app/scripts/coreplugins.js')) {
        fs.unlinkSync('app/scripts/coreplugins.js');
    }
    corePlugins.forEach(function(plugin) {
        var manifest = JSON.parse(fs.readFileSync('plugins/' + plugin + '/manifest.json'));
        if (manifest.editor.dependencies) {
            manifest.editor.dependencies.forEach(function(dependency) {
                var resource = '/plugins/' + plugin + '/' + dependency.src;
                if (dependency.type == 'js') {
                    fs.appendFile('app/scripts/coreplugins.js', 'org.ekstep.contenteditor.jQuery("body").append($("<script type=\'text/javascript\' src=\'' + resource + '\'>"))' + '\n');
                } else if (dependency.type == 'css') {
                    fs.appendFile('app/scripts/coreplugins.js', 'org.ekstep.contenteditor.jQuery("head").append("<link rel=\'stylesheet\' type=\'text/css\' href=\'' + resource + '\'>")' + '\n');
                }
            });
        }
        var plugin = fs.readFileSync('plugins/' + plugin + '/editor/plugin.min.js', 'utf8');
        fs.appendFile('app/scripts/coreplugins.js', 'org.ekstep.pluginframework.pluginManager.registerPlugin(' + JSON.stringify(manifest) + ',eval(\'' + plugin.replace(/'/g, "\\'") + '\'))' + '\n');
    });
    return gulp.src('plugins/**/plugin.min.js', {
        read: false
    }).pipe(clean());
});

gulp.task('packageCorePlugins', ['minify', "minifyCorePlugins"], function() {
    var fs = require('fs');
    var _ = require('lodash');
    var jsDependencies = [];
    var cssDependencies = [];
    if (fs.existsSync('generic-editor/scripts/coreplugins.js')) {
        fs.unlinkSync('generic-editor/scripts/coreplugins.js');
    }
    corePlugins.forEach(function(plugin) {
        var manifest = JSON.parse(fs.readFileSync('plugins/' + plugin + '/manifest.json'));
        if (manifest.editor.dependencies) {
            manifest.editor.dependencies.forEach(function(dependency) {
                var resource = '/content-plugins/' + plugin + '/' + dependency.src;
                if (dependency.type == 'js') {
                    fs.appendFile('generic-editor/scripts/coreplugins.js', 'org.ekstep.contenteditor.jQuery("body").append($("<script type=\'text/javascript\' src=\'' + resource + '\'>"))' + '\n');
                } else if (dependency.type == 'css') {
                    fs.appendFile('generic-editor/scripts/coreplugins.js', 'org.ekstep.contenteditor.jQuery("head").append("<link rel=\'stylesheet\' type=\'text/css\' href=\'' + resource + '\'>")' + '\n');
                }
            });
        }
        var plugin = fs.readFileSync('plugins/' + plugin + '/editor/plugin.min.js', 'utf8');
        fs.appendFile('generic-editor/scripts/coreplugins.js', 'org.ekstep.pluginframework.pluginManager.registerPlugin(' + JSON.stringify(manifest) + ',eval(\'' + plugin.replace(/'/g, "\\'") + '\'))' + '\n');
    });
    return gulp.src('plugins/**/plugin.min.js', {
        read: false
    }).pipe(clean());
});
