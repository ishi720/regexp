//materialize-cssでtab切り替え
$(document).ready(function(){
    $('.tabs').tabs();
});

const app = angular.module('myApp', ['ngSanitize']);

app.controller('myController', ['$scope', function ($scope) {

    $scope.$watchGroup([
        'sentence',
        'regexp_text',
        'regexpflg_g',
        'regexpflg_i',
        'regexpflg_m'
    ], function (newVals, oldVals, scope) {

        const sentence = newVals[0];
        const regexp_text = newVals[1];
        let regExp_flags = '';

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

            let exec_check = true;
            if ( regexp_text == '^' || regexp_text == '$' ) {
                exec_check = false;
            }
            if( regExp_flags.match(/g/) && exec_check ){

                // フラグにgがついているとき
                const regExp = new RegExp( regexp_text, regExp_flags);

                // 正規表現にマッチした先頭文字の位置を取得する
                let result;
                const exec_arr = [];
                let i = 0;
                while (result = regExp.exec(sentence)) {
                    exec_arr[i] = result.index;
                    i++;
                    if (result[0] === '') {
                        regExp.lastIndex++;
                    }
                }

                // 先頭からマッチした文字列の数を取得する
                const match_arr = sentence.match(regExp);

                // マッチ結果作成
                let val = '';
                let end_point = 0;
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
                const match_count = matchCount(sentence, regexp_text, regExp_flags);
                scope.match_count = match_count;
                // view表示
                scope.view = lineBreaksConversion(val, '<br>');
                scope.message = '';
                // 配列表示
                scope.result = arrayTable(match_arr);
            } else if ( bracketsCount(regexp_text) > 0){
                // 括弧があるとき

                const regExp_flags_w = regExp_flags + 'g';

                const regExp = new RegExp( regexp_text, regExp_flags);
                const regExp_w = new RegExp( regexp_text, regExp_flags_w);

                // 正規表現にマッチした先頭文字の位置を取得する
                let result;
                const exec_arr = [];
                let i = 0;
                while (result = regExp_w.exec(sentence)) {
                    exec_arr[i] = result.index;
                    i++;
                    if (result[0] === '') {
                        regExp_w.lastIndex++;
                    }
                }

                // 先頭からマッチした文字列の数を取得する
                const match_arr = sentence.match(regExp);

                // マッチ結果作成
                let val = '';
                let end_point = 0;

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
                const match_count = match_arr.length;
                scope.match_count = match_count;
                // view表示
                scope.view = lineBreaksConversion(val, '<br>');
                scope.message = '※配列の0番目のみ表示しています';
                // 配列表示
                scope.result = arrayTable(match_arr);

            } else {

                const pattern = '(' + bracketsEscape(regexp_text) + ')';

                const regExp = new RegExp( pattern, regExp_flags ) ;

                // 先頭からマッチした文字列の数を取得する
                const match_arr = sentence.match(regexp_text, regExp_flags);

                const radStr1 = rndStr();
                const radStr2 = rndStr();

                let val = sentence.replace( regExp, radStr1 + '$1' + radStr2) ;
                val = escapeHtml(val);
                const regExp_rnd1 = new RegExp( radStr1, 'g' ) ;
                const regExp_rnd2 = new RegExp( radStr2, 'g' ) ;
                val = val.replace(regExp_rnd1,'<span class="matched">');
                val = val.replace(regExp_rnd2,'</span>');
                // カウント表示
                const match_count = matchCount(sentence, regexp_text, regExp_flags);
                scope.match_count = match_count;
                // view表示
                scope.view = lineBreaksConversion(val, '<br>');
                scope.message = '';
                // 配列表示
                scope.result = arrayTable(match_arr);
            }

        } else {
            const val = escapeHtml(sentence);
            scope.match_count = 0;
            scope.view = lineBreaksConversion(val, '<br>');
        }
    });
}]);

/**
 * 正規表現の括弧をエスケープする
 * @param {string} str - エスケープ対象の文字列
 * @returns {string} エスケープされた文字列
 */
function bracketsEscape(str) {
    if (!str || typeof str !== 'string') {
        return str;
    }
    return str.replace(/[()]/g, match => `\\${match}`);
}

/**
 * 文字列内の括弧のペア数をカウントする
 * @param {string} str - カウント対象の文字列
 * @returns {number} 括弧のペア数
 */
function bracketsCount(str) {
    if (!str || typeof str !== 'string') {
        return 0;
    }
    const matches = str.match(/\([^()]*\)/g);
    return matches ? matches.length : 0;
}

/**
 * 改行コードを指定の文字列に変換する
 * @param {string} str - 変換対象の文字列
 * @param {string} breakStr - 変換後の文字列
 * @returns {string} 変換後の文字列
 */
function lineBreaksConversion(str, breakStr) {
    if (!str || typeof str !== 'string') {
        return str;
    }
    if (!breakStr || typeof breakStr !== 'string') {
        breakStr = '<br>';
    }
    return str.replace(/[\r\n]+/g, breakStr);
}

/**
 * HTML特殊文字をエスケープする
 * @param {string} str - エスケープ対象の文字列
 * @returns {string} エスケープされた文字列
 */
function escapeHtml(str) {
    if (!str || typeof str !== 'string') {
        return str;
    }
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, match => escapeMap[match]);
}

/**
 * ランダムな文字列を生成する
 * @param {number} [length=20] - 生成する文字列の長さ
 * @returns {string} 生成されたランダム文字列
 */
function rndStr(length = 20) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charsLength = chars.length;
    let result = '';

    // 安全な乱数生成のためにcrypto APIを使用
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
        result += chars[array[i] % charsLength];
    }
    return result;
}

/**
 * 正規表現にマッチする文字列の数をカウントする
 * @param {string} str - 検索対象の文字列
 * @param {string} pattern - 正規表現パターン
 * @param {string} regExpFlags - 正規表現フラグ
 * @returns {number} マッチした数
 */
function matchCount(str, pattern, regExpFlags) {
    if (!str || !pattern || typeof str !== 'string' || typeof pattern !== 'string') {
        return 0;
    }

    try {
        const regex = new RegExp(pattern, regExpFlags);
        const matches = str.match(regex);
        return matches ? matches.length : 0;
    } catch (e) {
        console.error('Invalid regular expression:', e);
        return 0;
    }
}

/**
 * 正規表現マッチング用のJavaScriptコードを生成する
 * @param {string} str - 検索対象の文字列
 * @param {string} regexpText - 正規表現パターン
 * @param {string} regExpFlags - 正規表現フラグ
 * @returns {string} 生成されたJavaScriptコード
 */
function matchMethodGenerate(str, regexpText, regExpFlags) {
    if (!str || !regexpText || typeof str !== 'string' || typeof regexpText !== 'string') {
        return '';
    }

    let code = `const str = ${JSON.stringify(str)};\n`;
    code += `const regExp = new RegExp(${JSON.stringify(regexpText)}`;

    if (regExpFlags) {
        code += `, ${JSON.stringify(regExpFlags)}`;
    }

    code += ');\n';
    code += 'const res = str.match(regExp);\n';
    code += 'console.log(res);';

    return code;
}

/**
 * 配列の内容をHTMLテーブルとして生成する
 * @param {Array} arr - 表示する配列
 * @returns {string} 生成されたHTMLテーブル
 */
function arrayTable(arr) {
    if (!Array.isArray(arr) || arr.length === 0) {
        return '';
    }

    const tableHeader = `
        <table class="centered highlight striped">
            <thead>
                <tr>
                    <th>key</th>
                    <th>value</th>
                </tr>
            </thead>
            <tbody>
    `;

    const tableRows = arr.map((value, key) => `
                <tr>
                    <td>${escapeHtml(String(key))}</td>
                    <td>${escapeHtml(String(value))}</td>
                </tr>
    `).join('');

    const tableFooter = `
            </tbody>
        </table>
    `;

    return tableHeader + tableRows + tableFooter;
}