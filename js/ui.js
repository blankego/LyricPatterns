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


/*-------HELPERS-------*/
function $$(id) {return document.getElementById(id);}
function $T(s) {return document.createTextNode(s);}
function $E(t) {return document.createElement(t);}
function hide(el) {el.classList.add('hidden');}
function show(el) {el.classList.remove('hidden');}
function getMainTitle(item) {return item[0].match(/^[^A-Z]+/)[0];}
function showContent() { hide($$('prolog')) || show($$('contentPane'));}
function showEditor() { show($$('composePane')) }
function hideEditor() { hide($$('composePane')) }
function forEach(o, func) {Array.prototype.forEach.call(o, func)}

///////////////////MAIN///////////////////////////
document.addEventListener("DOMContentLoaded", function () {

	var splitter = new Splitter($$('splitter'))
		, mainTitle = '欽定詞譜 － '
		, pNum = /^\d+/
		, config = window.localStorage || {}
		, cats = {P: '平', Z: '仄', H: '換', X: '協', R: '入'}
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
		];

	/* ---- Editor ---- */
	var editor = $$('composePane');
	$$('composeOff').onclick = hideEditor;

	function compose(pat) {   //TODO
		showEditor();
		var p = new mod.Pattern(pat)
			,area = editor.lastElementChild;
		area.innerHTML = '';
		area.appendChild(p.getPresentation());
	}

	function updateContent(con, title, state) {
		content.innerHTML = '';
		content.appendChild(con);
		document.title = mainTitle + title;
		showContent();
		state && history.pushState(state, document.title, null);
	}

	/* ---- category switch ---- */
	var catSelected = '';
	var catSwitch = (function CategorySwitch() {
		var catSwitch = $$('catSwitch')
			, catsCn = '平仄協換'
			, catsEn = 'PZXH'
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
		return catSwitch;
	})();


	var indices = mod.indices;


	/* ---- Titles ---- */
	function loadPatternPage(id, noPush) {
		document.body.removeChild($$('iframe'));
		var iframe = j2h({iframe: {id: 'iframe'}});
		iframe.onload = function () {
			var iDoc = iframe.contentWindow.document || iframe.contentDocument
				, frag = document.createDocumentFragment()
				;

			frag.appendChild(j2h({h2: iDoc.title}));
			while (iDoc.body.firstChild) {
				frag.appendChild(iDoc.body.removeChild(iDoc.body.firstChild));
			}
			updateContent(frag, iDoc.title, noPush ? null : {pattern_idx: id});
			onLoad.forEach(function (f) {f()});
		};
		document.body.appendChild(iframe);
		iframe.src = 'data/a' + id + '.html';
	}

	var toc = (function TITLES() {

		var pLet = /[A-Z]/g;

		function getCatTags(s) {
			var r = s.match(pLet).sort();
			return r.reduce(function (pre, cur) {
				if (pre[0] !== cur)pre.unshift(cur);
				return pre
			}, []).map(function (it) {return cats[it]});
		}

		var titleRenderer = function (it, arr, idx) {
				var ind = indices[it[1]]
					, mNum = ind[1].match(pNum)
					, isMain = idx === 0 || it[1] !== arr[idx - 1][1];
				return j2h([(isMain ? '' : '　') + it[0]]
					.concat(isMain ? {div: getCatTags(ind[1]) + ' ' + mNum } : [])
				);
			}
			, titles = $$('toc')
			, toc = new KeyList(titles, mod.titles, titleRenderer,
				mod.tFilter, mod.tAFilter, function (it) { //cat filter
					return indices[it[1]][1].indexOf(catSelected) >= 0;
				}
			).addWatcher(function (el, item) { loadPatternPage(item[1]);});

		window.addEventListener('popstate', function (e) {
			if (e.state && e.state.pattern_idx)loadPatternPage(e.state.pattern_idx, true);
		});

		return toc;

	})();


	/*----Authors----*/

	var authors = (function () {
		function authorRenderer(it) {return $T(it[0]);}

		window.addEventListener('popstate', function (e) {
			if (e.state && e.state.author_idx) {authors.select(e.state.author_idx, true);}
		});

		return new KeyList($$('authors'), mod.authors, authorRenderer,
			mod.aFilter, mod.aAFilter
		).addWatcher(function (el, item, idx, noState) {
				var author = item[0],
					frag = j2h([
						{h2: author},
						{ul: item.slice(1, -1).map(function (id) {
							var li = j2h({li: getMainTitle(mod.indices[id])});
							li.onclick = function (e) {loadPatternPage(id);};
							return li;
						})}
					]);
				updateContent(frag, author, noState ? null : {author_idx: idx});
			})
	})();

	var modes = [toc, authors]
		, list = modes[config.lp_tab || (config.lp_tab = 0)]
		, lookup = new InputWatcher($$('lookup')).addWatcher(function (v) {
			list && list.filter(v);
		});

	/* ---- Tabs ---- */
	var tabs = new Tab($$('indicesPane')).addWatcher(function (tab, idx) {
		config.lp_tab = idx;
		list = modes[idx];
		if (idx === 0) {
			show(catSwitch);
		} else {
			hide(catSwitch);
		}
	}).select(parseInt(config.lp_tab, 10) || 0);

	/* ---- RimeBook ---- */
	var rimes = (function (rimes) {
		mod.rimeBook.groups.forEach(function (r, i) {
			function getHeading(idx) {
				idx = mod.rimeBook.groups[idx];
				return idx[0] + ' ' + cats[idx[1]];
			}

			function getRimeNames(idx) {return j2h({p: {_: mod.rimeNames[idx], klass: 'rime'}})}

			r = j2h({p: [getHeading(i), getRimeNames(i)]});

			function showRime(idx, noPush) {
				var h = getHeading(idx);
				updateContent(j2h([
					{h2: h},
					getRimeNames(idx),
					{p: {
						_: j2h(mod.rimeBook.getRimeByIdx(idx)),
						klass: 'rhymingChars'
					}}
				]), h, noPush ? null : {rime_idx: idx});
			}

			r.onclick = function () {showRime(i)};
			rimes.appendChild(r);
			window.addEventListener('popstate', function (e) {
				if (e.state && e.state.rime_idx)showRime(e.state.rime_idx, true);
			});

		});
		return rimes;
	})($$('rimes'));

//TODO: the history thing is still problematic

//DEBUG
	window.cat = mod.cat;
	//editor DnD
	!function () {
		var xyOffset; //Global variable as Chrome doesn't allow access to event.dataTransfer in dragover
		function drag_start(e) {
			var style = window.getComputedStyle(e.target, null);
			xyOffset = (parseInt(style.getPropertyValue("left"), 10) - e.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - e.clientY);
			e.dataTransfer.setData("text/plain", xyOffset);
		}

		function updatePos(event) {
			var offset = xyOffset.split(',');

			editor.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
			editor.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';
			event.preventDefault();
			return false;
		}

		editor.addEventListener('dragstart', drag_start, false);
		document.body.addEventListener('dragover', updatePos, false);
		document.body.addEventListener('drop', updatePos, false);
	}();

})
;
///////////////////END MAIN///////////////////////