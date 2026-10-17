'use strict';

const { src, dest, watch, series, parallel } = require('gulp');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass')(require('sass'));
const cleanCss  = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();

// browser sync
function browserSyncTask() {
    browserSync.init({
        server: {
            baseDir: './app',
        },
        port: 3000,
        listen: 'localhost',
        ui: false,
        // 開発時のみ、browser-syncのインラインスクリプトとWebSocketをCSPで許可
        rewriteRules: [{
            match: /script-src 'self'/,
            replace: "script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:",
        }],
    });
}

// sassコンパイル
function sassTask() {
    return src('./app/css/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(rename({extname: '.min.css'}))
        .pipe(cleanCss({advanced:false}))
        .pipe(sourcemaps.write('./'))
        .pipe(dest('./app/css'))
        .pipe(browserSync.stream());
}

// js minify
function jsMinifyTask() {
    return src(['./app/js/*.js', '!./app/js/*.min.js'])
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({extname: '.min.js'}))
        .pipe(dest('./app/js/'));
}

// ブラウザリロード
function reloadTask(done) {
    browserSync.reload();
    done();
}

// ファイル監視
function watchTask() {
    watch('./app/css/*.scss', sassTask);
    watch(['./app/js/*.js', '!./app/js/*.min.js'], series(jsMinifyTask, reloadTask));
    watch('./app/*.html', reloadTask);
}

// ビルド処理
const buildTask = parallel(sassTask, jsMinifyTask);

// デフォルト処理
const defaultTask = series(buildTask, parallel(browserSyncTask, watchTask), () => {
    browserSync.reload();
});

exports.sass = sassTask;
exports.jsminify = jsMinifyTask;
exports.build = buildTask;
exports.default = defaultTask;
