var commander = require("commander"),
    JSGetIt   = require(__dirname + "/lib/JSGetIt");

// コマンドライン引数読み込み
commander
	.version('0.0.1')
	.option('-p, --peppers', 'Add peppers')
	.option('-P, --pineapple', 'Add pineapple')
	.option('-b, --bbq', 'Add bbq sauce')
	.option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
	.parse(process.argv);


// 変数宣言
var jsGetIt;
var args = commander.args;

// 引数無しならエラー終了
if (!args[0]) {
	console.error("enter username and codename.");
	process.exit(1);
}

if (args[0].match(/^([^\/]+)\/+([^\/]+)$/)) {
	// 引数1が user/code のカタチになっているなら、そのcodeをとる
	jsGetIt = new JSGetIt(RegExp.$1, RegExp.$2);
} else if (args.length >= 2) {
	// 引数が user code のカタチになっているなら、そのcodeをとる
	jsGetIt = new JSGetIt(args.shift(), args.shift());
}

// ダウンロード
jsGetIt.download();