'use strict';

const gulp = require('gulp');
const { series, parallel } = require('gulp');
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
        proxy: 'http://localhost/regexp',
        port: 3000,
    });
}

// sassコンパイル
function sassTask() {
    return gulp.src('./app/css/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(rename({extname: '.min.css'}))
        .pipe(cleanCss({advanced:false}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./app/css'))
        .pipe(browserSync.stream());
}

// js minify
function jsMinifyTask() {
    return gulp.src(['./app/js/*.js', '!./app/js/*.min.js'])
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({extname: '.min.js'}))
        .pipe(gulp.dest('./app/js/'))
        .pipe(browserSync.stream());
}

// ファイル監視
function watchTask() {
    gulp.watch('./app/css/*.scss', sassTask);
    gulp.watch(['./app/js/*.js', '!./app/js/*.min.js'], jsMinifyTask);
}

// デフォルト処理
const defaultTask = series(parallel(browserSyncTask, watchTask), () => {
    browserSync.reload();
});

exports.sass = sassTask;
exports.jsminify = jsMinifyTask;
exports.default = defaultTask;
