'use strict';

const gulp = require('gulp');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass')(require('sass'));
const cleanCss  = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
require('gulp-watch');
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();
const versionFormat = require('gulp-package-version-format');
const eslint = require('gulp-eslint');

// browser sync
gulp.task('browser-sync', function() {
    browserSync.init({
        proxy: 'http://localhost/regexp',
        port: 3000,
    });
});

// sassコンパイル
gulp.task('sass', () => {
    return gulp.src('./app/css/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(rename({extname: '.min.css'}))
        .pipe(cleanCss({advanced:false}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./app/css'))
        .pipe(browserSync.stream());
});

// js minify
gulp.task('js-minify', () => {
    return gulp.src(['./app/js/*.js', '!./app/js/*.min.js'])
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({extname: '.min.js'}))
        .pipe(gulp.dest('./app/js/'))
        .pipe(browserSync.stream());
});

// eslintのでチェックする
gulp.task('lint', () => {
    return gulp.src(['**/*.js'])
        .pipe(eslint({ useEslintrc: true })) // .eslintrc を参照
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// package.jsonをフォーマットする
gulp.task('packagejson', (done) => {
    //バージョン表記を簡略化する
    const packageVersionFormat = (src,dest) => {
        gulp.src(src)
            .pipe(versionFormat())
            .pipe(gulp.dest(dest));
    };
    packageVersionFormat('./package.json','./');
    packageVersionFormat('./app/package.json','./app/');
    done();
});

// ファイル監視
gulp.task('watch', () => {
    gulp.watch('./app/css/*.scss', gulp.task('sass'));
    gulp.watch(['./app/js/*.js', '!./app/js/*.min.js'], gulp.task('js-minify'));
});

// デフォルト処理
gulp.task('default', gulp.series(gulp.parallel('browser-sync','watch'), () => {
    browserSync.reload;
}));