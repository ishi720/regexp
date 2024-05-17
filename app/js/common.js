//materialize-cssでtab切り替え
$(document).ready(function(){
    $('.tabs').tabs();
});

var app = angular.module('myApp', ['ngSanitize']);

app.controller('myController', ['$scope', function ($scope, $sce) {

    //snsリンクにURLをセットする
    var url = location.href;
    var encodeURL = encodeURIComponent(url);
    $scope.encodeURL = encodeURL;

    $scope.$watchGroup([
        'sentence',
        'regexp_text',
        'regexpflg_g',
        'regexpflg_i',
        'regexpflg_m'
    ], function (newVals, oldVals, scope) {

        var sentence = newVals[0];
        var regexp_text = newVals[1];
        var regExp_flags = '';

        if ( newVals[2] ) {
            //グローバルなマッチ
            regExp_flags += 'g';
        }

        if ( newVals[3] ) {
            //大文字・小文字の無視
            regExp_flags += 'i';
        }

        if ( newVals[4] ) {
            //複数行に渡るマッチ
            regExp_flags += 'm';
        }

        // javascriptを生成する
        scope.match_method = matchMethodGenerate(sentence, regexp_text, regExp_flags);

        if ( sentence && regexp_text ) {

            var exec_check = true;
            if ( regexp_text == '^' || regexp_text == '$' ) {
                exec_check = false;
            }
            if( regExp_flags.match(/g/) && exec_check ){

                // フラグにgがついているとき
                var regExp = new RegExp( regexp_text, regExp_flags);

                // 正規表現にマッチした先頭文字の位置を取得する
                var result;
                var exec_arr = [];
                var i = 0;
                while (result = regExp.exec(sentence)) {
                    exec_arr[i] = result.index;
                    i++;
                }

                // 先頭からマッチした文字列の数を取得する
                var match_arr = sentence.match(regExp);

                // マッチ結果作成
                var val = '';
                var end_point = 0;
                $.each(exec_arr, function(key){
                    // 先頭文字を見つける
                    if( exec_arr[key] == end_point ){
                        val += '<span class="matched">';
                    } else {
                        val += escapeHtml( sentence.substring(end_point,exec_arr[key]) );
                        end_point = exec_arr[key];
                        val += '<span class="matched">';
                    }
                    // マッチした箇所を閉じる
                    val += escapeHtml( sentence.substr(end_point,match_arr[key].length) );
                    end_point = end_point + match_arr[key].length;
                    val += '</span>';

                });


                //終了したとき
                val += escapeHtml( sentence.slice(end_point) );
                // カウント表示
                var match_count = matchCount(sentence, regexp_text, regExp_flags);
                scope.match_count = match_count;
                // view表示
                scope.view = lineBreaksConversion(val, '<br>');
                scope.message = '';
                // 配列表示
                scope.result = arrayTable(match_arr);
            } else if ( bracketsCount(regexp_text) > 0){
                // 括弧があるとき

                var regExp_flags_w = regExp_flags + 'g';

                var regExp = new RegExp( regexp_text, regExp_flags);
                var regExp_w = new RegExp( regexp_text, regExp_flags_w);

                // 正規表現にマッチした先頭文字の位置を取得する
                var result;
                var exec_arr = [];
                var i = 0;
                while (result = regExp_w.exec(sentence)) {
                    exec_arr[i] = result.index;
                    i++;
                }

                // 先頭からマッチした文字列の数を取得する
                var match_arr = sentence.match(regExp);

                // マッチ結果作成
                var val = '';
                var end_point = 0;

                // 先頭文字を見つける
                if( exec_arr[0] == end_point ){
                    val += '<span class="matched">';
                } else {
                    val += escapeHtml( sentence.substring(end_point, exec_arr[0]) );
                    end_point = exec_arr[0];
                    val += '<span class="matched">';
                }
                // マッチした箇所を閉じる
                val += escapeHtml(  sentence.substr(end_point, match_arr[0].length) );
                end_point = end_point + match_arr[0].length;
                val += '</span>';

                //終了したとき
                val += escapeHtml(  sentence.slice(end_point) );

                // カウント表示
                var match_count = match_arr.length;
                scope.match_count = match_count;
                // view表示
                scope.view = lineBreaksConversion(val, '<br>');
                scope.message = '※配列の0番目のみ表示しています';
                // 配列表示
                scope.result = arrayTable(match_arr);

            } else {

                if( bracketsCount(regexp_text) > 0 ) {
                    var pattern = regexp_text;
                } else {
                    var pattern = '(' + bracketsEscape(regexp_text) + ')';
                }

                var regExp = new RegExp( pattern, regExp_flags ) ;

                // 先頭からマッチした文字列の数を取得する
                var match_arr = sentence.match(regexp_text, regExp_flags);

                var radStr1 = rndStr();
                var radStr2 = rndStr();

                if( bracketsCount(regexp_text) > 0 ){

                    var split_array = [];
                    split_array = regexp_text.split(/\(.*?\)/);

                    var val = sentence.replace( regExp, split_array[0] + radStr1 + '$1' + radStr2 + split_array[1]);

                } else {
                    var val = sentence.replace( regExp, radStr1 + '$1' + radStr2) ;
                }
                val = escapeHtml(val);
                var regExp_rnd1 = new RegExp( radStr1, 'g' ) ;
                var regExp_rnd2 = new RegExp( radStr2, 'g' ) ;
                val = val.replace(regExp_rnd1,'<span class="matched">');
                val = val.replace(regExp_rnd2,'</span>');
                // カウント表示
                var match_count = matchCount(sentence, regexp_text, regExp_flags);
                scope.match_count = match_count;
                // view表示
                scope.view = lineBreaksConversion(val, '<br>');
                scope.message = '';
                // 配列表示
                scope.result = arrayTable(match_arr);
            }

        } else {
            var val = escapeHtml(sentence);
            scope.match_count = 0;
            scope.view = lineBreaksConversion(val, '<br>');
        }
    });
}]);

//括弧をエスケープする
function bracketsEscape(str) {
    if (!str) {
        return str;
    }
    str = str.replace( /\(/, '\\(');
    str = str.replace( /\)/, '\\)');
    return str;
}

//括弧のペアをカウント
function bracketsCount(str){
    return str.split(/\(.*?\)/).length - 1;
}


//改行コードを<br>に変換する
function lineBreaksConversion(str, break_str) {
    if (!str) {
        return str;
    }
    str = str.replace( /[\r\n|\n|\r]/g, break_str);
    return str;
}

//htmlをエスケープする
function escapeHtml(str) {
    if (!str) {
        return str;
    }
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&#39;');
    return str;
}

//ランダム文字列作成
function rndStr(){
    //使用する文字(正規表現のメタ文字は指定しない)
    var str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    //桁数
    var len = 20;

    //ランダムな文字列の生成
    var res = '';
    for(var i=0;i<len;i++){
        res += str.charAt(Math.floor(Math.random() * str.length));
    }
    return res;
}


//マッチした文字をカウント
function matchCount(str, pattern,regExp_flags) {
    if ( regExp_flags.match(/g/) ) {
        return (str.match(new RegExp(pattern, regExp_flags))||[]).length;
    } else if ( str.match(pattern) ) {
        return 1;
    } else {
        return 0;
    }
}


// matchメソッドを生成する
function matchMethodGenerate(str, regexp_text,regExp_flags){
    if (!str) {
        str = '';
    }
    if (!regexp_text) {
        regexp_text = '';
    }
    var code = 'var str = "'+ lineBreaksConversion(str,'\\n') + '";\n';
    code += 'var regExp = new RegExp("'+ regexp_text + '"';
    if( regExp_flags ){
        code += ', "'+ regExp_flags + '"';
    }
    code += ');\n';
    code += 'var res = str.match(regExp);\n';
    code += 'console.log(res);';

    return code;
}


// matchを配列にする
function arrayTable(arr) {

    var code = '';
    code += '<table class="centered highlight striped">\n';
    code += '   <thead>\n';
    code += '   <tr>\n';
    code += '       <th>key<th>\n';
    code += '       <th>value<th>\n';
    code += '   </tr>\n';
    code += '   </thead>\n';
    code += '   <tbody>\n';

    $.each( arr, function( key, value ) {
        code += '   <tr>\n';
        code += '       <td>'+ key +'<td>\n';
        code += '       <td>'+ value +'<td>\n';
        code += '   </tr>\n';
    });
    code += '   </tbody>\n';
    code += '</table>\n';

    return code;
}