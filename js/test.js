var model = require('./model');
module.exports = {
	testNameFilter: function(test){
		var data = [['BJ',1,2],['TKX',3],['TK',4]];
		var af = new model.NameFilter(data);
		var res = af.filter('');
		test.equal(res,data);
		res = af.filter('T');
		test.deepEqual(res, data.slice(1));
		res = af.filter('TK');
		test.deepEqual(res, data.slice(1));
		res = af.filter('TKX');
		test.deepEqual(res, [data[1]]);
		var f = model.aFilter;
		test.ok(f.filter('柳').some(function(ent){return ent[0]=== '柳永'}));
		f = model.tFilter;
		test.ok(f.filter('江神').some(function(ent){return ent[0]==='江神子'}));
		test.done();
	} ,
	testAcronymFilter: function(test){
		var f = model.aAFilter,res;
		res = f.filter('ly');
		test.ok(res.some(function(ent){return ent[0] === '劉禹錫'}));
		f = model.tAFilter;
		console.log(res = f.filter('yll'));
		test.ok(res.some(function(ent){return ent[0] === '雨霖鈴'}));
		test.done();
	}

};