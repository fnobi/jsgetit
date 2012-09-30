var request   = require("request"),
    commander = require("commander"),
    JSGetIt   = require(__dirname + "/lib/JSGetIt");

// コマンドライン引数読み込み
commander
	.version('0.0.1')
	.option('-p, --peppers', 'Add peppers')
	.option('-P, --pineapple', 'Add pineapple')
	.option('-b, --bbq', 'Add bbq sauce')
	.option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
	.parse(process.argv);

var jsGetIt;
var args = commander.args;

if (!args[0]) {
	console.error("enter username and codename.");
	process.exit(1);
}

if (args[0].match(/^([^\/]+)\/+([^\/]+)$/)) {
	jsGetIt = new JSGetIt(RegExp.$1, RegExp.$2);
	args.shift();
} else if (args.length >= 2) {
	jsGetIt = new JSGetIt(args.shift(), args.shift());
}

jsGetIt.download(args.shift());