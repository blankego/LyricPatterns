var oop = require('./oop_utils')
	, Class = oop.Class
	, merge = oop.merge
	, mod = require('./model')
	, ui = require('./stuffUI')
	, Tab = ui.Tab
	, Splitter = ui.Splitter
	, KeyList = ui.KeyList
	, InputWatcher = ui.InputWatcher
	, j2h = ui.j2h
	;

//this is a special widget that uses a tabs widget as its list group container
var ListGroup = Class.$ext({
	init: function (tabs, list, renderer) {}
});
//-----------------------
function compose(pat) {   //TODO

}

/*-------HELPERS-------*/
function $$(id) {return document.getElementById(id);}
function $T(s) {return document.createTextNode(s);}
function $E(t) {return document.createElement(t);}
function hide(el) {el.classList.add('hidden');}
function show(el) {el.classList.remove('hidden');}
function getMainTitle(item) {return item[0].match(/^[^A-Z]+/)[0];}
function showContent() { hide($$('prolog')) || show($$('contentPane'));}
function forEach(o, func) {Array.prototype.forEach.call(o, func)}

///////////////////MAIN///////////////////////////
document.addEventListener("DOMContentLoaded", function () {
	var iframe = $$('ifrm')
		, mTitle = '欽定詞譜 － '
		, pNum = /^\d+/
		, config = window.localStorage || {}
		, cats = {P: '平', Z: '仄', H: '換', X: '協'}
		, content = $$('contentPane')
		, prolog = $$('prolog')
		, patBtn = j2h({p: {klass: 'patBtn', _: '依律填詞'}})
		, onLoad = [
			function () {
				forEach(content.querySelectorAll('pre'), function (pre) {
					var title = pre.previousElementSibling
						, btn = patBtn.cloneNode(true)
						;
					btn.onclick = function () {compose(pre)};
					content.insertBefore(btn, title);
					//author link
					title.onclick = function (e) {
						var tStr = title.innerHTML.trim(), i, it;
						for (i = -1; (it = authors.data[++i]) && it[0] !== tStr;) {}
						authors.select(i);
					};
				});
			}
		]

	/* ---- category switch ---- */
		, catSwitch = $$('catSwitch')
		, catsCn = '平仄協換'
		, catsEn = 'PZXH'
		, catSelected = ''
		, switchCat = function (cat) {
			if (cat) {
				var id = catsCn.indexOf(cat), span = catSwitch.children[id];

				if (span.classList.contains('selected')) {
					span.classList.remove('selected');
					config.lp_cat = '';
					catSelected = '';
				} else {
					forEach(catSwitch.children, function (el) {el.classList.remove('selected')});
					span.classList.add('selected');
					config.lp_cat = cat;
					catSelected = catsEn[id];
				}
				toc.filter(toc.lastKey);
			}
		}
		;
	forEach(catSwitch.children, function (span) {
		span.onclick = function () { switchCat(span.innerHTML);}
	});
	window.splitter = new Splitter($$('splitter'));

	function getPage(id) {
		showContent();
		iframe.src = 'data/a' + id + '.html';
	}

	//update pattern page
	iframe.onload = function () {
		var iDoc = iframe.contentWindow.document || iframe.contentDocument;
		content.innerHTML = '';
		content.appendChild(j2h({h2: iDoc.title}));
		while (iDoc.body.firstChild) {
			content.appendChild(iDoc.body.removeChild(iDoc.body.firstChild));
		}
		document.title = mTitle + iDoc.title;
		onLoad.forEach(function (f) {f()});
	};


	var pLet = /[A-Z]/g
		, getCatTags = function (s) {
			var r = s.match(pLet).sort();
			return r.reduce(function (pre, cur) {
				if (pre[0] !== cur)pre.unshift(cur);
				return pre
			}, []).map(function (it) {return cats[it]});
		}
		, indices = mod.indices

	/* ---- Titles ---- */
		, titleRenderer = function (it, arr, idx) { //TODO
			var ind = indices[it[1]]
				, mNum = ind[1].match(pNum)
				, isMain = idx === 0 || it[1] !== arr[idx - 1][1];
			return j2h([(isMain ? '' : '　') + it[0]]
				.concat(isMain ? {div: getCatTags(ind[1]) + ' ' + mNum } : [])
			);
		}
		, titles = $$('toc')
		, toc = new KeyList(titles, mod.titles, titleRenderer,
			mod.tFilter, mod.tAFilter,function(it){ //cat filter
				return indices[it[1]][1].indexOf(catSelected) >= 0;
			}
		).addWatcher(function (el, item) { getPage(item[1]);})


	/*----Authors----*/
		, authorRenderer = function (it) {
			return $T(it[0]);
		}
		, authors = new KeyList($$('authors'), mod.authors, authorRenderer,
			mod.aFilter, mod.aAFilter
		).addWatcher(function (el, item, idx, noState) {
				showContent();
				var author = item[0];
				document.title = mTitle + author;
				!noState && history.pushState({author_idx: idx}, document.title, null);
				content.innerHTML = '';
				content.appendChild(j2h([
					{h2: author},
					{ul: item.slice(1, -1).map(function (id) {
						var li = j2h({li: getMainTitle(mod.indices[id])});
						li.onclick = function (e) {getPage(id);};
						return li;
					})}
				]));
			})


		, modes = [toc, null, authors]
		, list = modes[config.lp_tab || (config.lp_tab = 0)]
		, lookup = new InputWatcher($$('lookup')).addWatcher(function (v) {
			list.filter(v);
		})
		, tabs = new Tab($$('indicesPane')).addWatcher(function (tab, idx) {
			config.lp_tab = idx;
			list = modes[idx];

			if (idx === 0) {
				show(catSwitch);
			} else {
				hide(catSwitch);
			}
		}).select(parseInt(config.lp_tab, 10) || 0)
		;
	//TODO: the history thing is still problematic
	window.onpopstate = function (e) {
		if (e.state && e.state.author_idx) {authors.select(e.state.author_idx, true);}
	};
	//DEBUG
	window.cat = mod.cat;
});
///////////////////END MAIN///////////////////////