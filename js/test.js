var model = require('./model')
	, jsdom = require('jsdom')
	, sui = require('./stuffUI')
	, j2h = sui.j2h
	, document = sui.document
	;

module.exports = {
	testNameFilter: function (test) {
		var data = [
			['BJ', 1, 2],
			['TKX', 3],
			['TK', 4]
		];
		var af = new model.NameFilter(data);
		var res = af.filter('');
		test.equal(res, data);
		res = af.filter('T');
		test.deepEqual(res, data.slice(1));
		res = af.filter('TK');
		test.deepEqual(res, data.slice(1));
		res = af.filter('TKX');
		test.deepEqual(res, [data[1]]);
		var f = model.aFilter;
		test.ok(f.filter('柳').some(function (ent) {return ent[0] === '柳永'}));
		f = model.tFilter;
		test.ok(f.filter('江神').some(function (ent) {return ent[0] === '江神子'}));
		test.done();
	},
	testAcronymFilter: function (test) {
		var f = model.aAFilter, res;
		res = f.filter('ly');
		test.ok(res.some(function (ent) {return ent[0] === '劉禹錫'}));
		f = model.tAFilter;
		console.log(res = f.filter('yll'));
		test.ok(res.some(function (ent) {return ent[0] === '雨霖鈴'}));
		test.done();
	},
	testJ2H: function (test) {
		var n = j2h("txt");
		test.equal(n.nodeName, "#text");
		test.equal(n.data, 'txt');
		var j = {
			p: {
				klass: 'myClass',
				title: 'p title',
				_: ['text 1',
					{div: ['text 2', {span: 'text 3'}]}]
			}
		};
		n = j2h({p:[document.createElement('div'),'text']});
		test.equal(n.firstChild.nodeName, 'DIV');
		test.equal(n.childNodes[1].data,'text');

		n = j2h(j);
		console.log(n.outerHTML);
		test.equal(n.nodeName, "P");
		test.equal(n.getAttribute('class'), 'myClass');
		test.equal(n.childNodes.length, 2);
		test.equal(n.children[0].children[0].tagName, 'SPAN');
		test.equal(n.children[0].children[0].innerHTML, 'text 3');
		test.done();
	}

};