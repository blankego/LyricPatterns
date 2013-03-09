;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){var oop = require('./oop_utils')
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
},{"./oop_utils":2,"./model":3,"./stuffUI":4}],2:[function(require,module,exports){function merge(r){
	for(var i = 1, o, k; o = arguments[i]; ++i){
		for(k in o){if(o.hasOwnProperty(k)){r[k] = o[k];}}
	}
	return r;
}

function nameOfFunc(func){
	var fn = func.name;
	return typeof fn === 'undefined' ? (fn = func.toString(), func.name = fn.substring(9, fn.indexOf('('))) : fn;
}

var fnCall = Function.call;

function Class(){}
Class.$def = function(def){
	{function Px(){}}
	var base = this, ctr = def.constructor = merge(def.init || function(){ctr.$ctor(this,arguments)},base);
	delete ctr.init;
	ctr.$ = Px.prototype = base.prototype;
	ctr.$ctor = function(){return fnCall.apply(base, arguments)};
	var pt = ctr.prototype = new Px;
	Object.keys(def).forEach(function(k){
		var mem = def[k];
		mem instanceof Function ? (pt[k] = mem) : (ctr[k] = mem);
	});
	return ctr;
};
Class.$ext = Class.$def;


module.exports = {
	Class: Class,
	merge: merge,
	getFuncName: nameOfFunc
};
},{}],3:[function(require,module,exports){var oop = require('./oop_utils')
	, Class = oop.Class
	, Ind = require('./init_indices')
	, aAcronyms = Ind.aAcronyms
	, tAcronyms = Ind.tAcronyms
	, authors = Ind.authors
	, titles = Ind.titles
	, cat = Ind.cat
	, rb = require("./rime_book")
	, rimeBook = rb.rimeBook
	, rimeNames = rb.rimeNames
	, j2h = require('./stuffUI').j2h;
	;


var NameFilter = Class.$ext({
	init: function (tbl) {
		this.tbl = tbl;
		this.cache = null;
		this.kw = '';
	},
	filter: function (kw) {
		var me = this;
		return (!kw || typeof kw !== 'string') ?
			me.tbl :
			(me.cache = ((kw = kw.toUpperCase()).indexOf(me.kw) === 0 && me.cache || me.tbl)
				.filter(function (ent) {
					return ent[0].indexOf(me.kw = kw) === 0;
				}));
	}

});
var AcronymFilter = NameFilter.$ext({
	init: function (aTbl, refTbl) {
		AcronymFilter.$ctor(this, aTbl);
		this.refTbl = refTbl;
	},
	filter: function (kw) {
		if (!kw)return this.tbl;
		var res = [], i, j, ent;
		AcronymFilter.$.filter.call(this, kw);
		for (i = 0; ent = this.cache[i++];) {
			for (j = ent.length; --j;) {
				res.unshift(this.refTbl[ent[j]]);
			}
		}
		return res;
	}
});

var RimeBook = Class.$ext({
	init: function (book, hPat) {
		this.book = book;
		this.reGrp = hPat;
		this.groups = [];
		for (var i = 0, h; h = hPat.exec(book); i = hPat.lastIndex + 1) {
			//[id, heading, start, end]
			this.groups.push([parseInt((h[0]), 10), h[0].slice(-1), i, h.index]);
		}
	},
	getRimeByIdx: function (i) {
		return this.book.slice(this.groups[i][2], this.groups[i][3]);
	},
	getRimesOfChar: function (ch, ignoreTone) {
		var g, r = [], i = -1;
		while (!r && (i = this.book.indexOf(ch, ++i)) >= 0) {
			g = this.getGrp(i);
			r.push(ignoreTone ? parseInt(g, 10) : g);
		}
		return r;
	},
	isLevel: function (ch, oblique) {//true,false or undefined for unknown char
		var r, i = -1;
		while (!r && (i = this.book.indexOf(ch, ++i)) >= 0) {
			r = !!((this.getGrp(i).lastIndexOf('P') > 0) ^ oblique);
		}
		return r;
	},
	isOblique: function (ch) {return this.isLevel(ch, true);},
	getGrp: function (idx) {
		this.reGrp.lastIndex = idx;
		return this.reGrp.exec(this.book)[0];
	}
});

function toCharArray(s){
	var r = [], i, c, code;
	for(i = 0; c = s.charCodeAt(i);i++){ r.push(s[i] + (0xD800 <= c && c < 0xDC00)? s[++i]:'');}
	return r;
}
rimeBook = new RimeBook(rimeBook, /\d+[PZR]/g);

var pSymbols = /[○●◎⊙□■◇◆]+/g
	;
function intersect(a) {
	if (arguments.length >= 2) {
		for (var i = 1, b; b = arguments[i++];) {
			for (var j = a.length; j--;) {if (b.indexOf(a[j]) < 0)a.splice(j, 1);}
		}
	}
	return a || []
}
var pPunt = /[^。，？！、 　]+/g;
function splitLine(l){
	return l.match(pPunt);
}
var Pattern = Class.$ext({
	init: function (pre) {
		var me = this;
		me.raw = [];
		me.pattern = [];
		(typeof pre === 'string' ? pre : pre.textContent).trim().split('\n')
			.forEach(function (stanza) {
				var m = stanza.match(pSymbols);
				if (m){
					me.pattern.push(m);
					me.raw.push(stanza);
				}
			});
	},
	getLinePresentation: function(idx){
		return j2h({p:{
			klass:'patternRepresentation',
			_: toCharArray(this.raw[idx]).map(function(ch){	return {tt: ch};})}
		});
	},
	getPresentation: function(){
		var me = this;
		return j2h(me.raw.map(function(stanza,i){return me.getLinePresentation(i)}));
	},
	check: function (stanzaId, lines) {
		if(!Array.isArray(lines))lines = splitLine(lines);
  	    var stanza = this.pattern[stanzaId], res = [];
		for (var i = -1, l; l = lines[++i];) {
			if(!stanza[i] || stanza[i].length !== l.length)return 'wrong structure';
			res.push([]);
			for (var j = -1, ch; ch = l[++j];) {
				res[i].push(this.checkChar(stanza[i][j],ch));
			}
		}
		return res;
	},
	checkRime: function (rhymingChars) {

	},
	checkChar: function (sym, ch) {
		//level of oblique
		var toneOk;
		switch (sym) {
			case '□':
			case '◇':
			case '○':
				toneOk = rimeBook.isLevel(ch);
				break;
			case '■':
			case '◆':
			case '●':
				toneOk = rimeBook.isOblique(ch);
				break;
			case '◎':
			case '⊙':
				toneOk = true;
				break;
			default :
				toneOk = false;
		}
		return toneOk
	}

});

module.exports = {
	NameFilter: NameFilter,
	AcronymFilter: AcronymFilter,
	aFilter: new NameFilter(authors),
	tFilter: new NameFilter(titles),
	aAFilter: new AcronymFilter(aAcronyms, authors),
	tAFilter: new AcronymFilter(tAcronyms, titles),
	rimeBook: rimeBook,
	rimeNames: rimeNames,
	Pattern: Pattern
};


oop.merge(module.exports, Ind);
},{"./oop_utils":2,"./init_indices":5,"./rime_book":6,"./stuffUI":4}],5:[function(require,module,exports){module.exports = (function () {
	var raw = require("./indices")
		, pLetter = /[A-Z]/g
		, pNumber = /\d+/g
		, authors = []
		, titles = []
		, aAcronyms = {}
		, tAcronyms = {}
		, charCounts = {}
		, categories = {P: [], Z: [], H: [], X: []}
		, catAcronyms = {P: {}, Z: {}, H: {}, X: {}}
		, res = {
			indices: raw.indices,
			titles: titles, tAcronyms: [],
			cCounts: [], categories: categories,
			authors: authors, aAcronyms: []
		}
		, ent, i, k;

	function countChar(s, start, end) {
		var count = 0;
		for (start = start || 0, end = end || s.length - start; start < end; ++start, ++count) {
			if ((s.charCodeAt(start) & 0xfc00) == 0xd800)++start;
		}
		return count;
	}

	function splitAcronyms(s) {
		var idx = s.search(pLetter)
			, count = countChar(s, 0, idx)
			, res = [s.substr(0, idx)]
			, len = s.length;
		for (; idx < len; idx += count) {
			res.push(s.substr(idx, count));
		}
		return res;
	}

	for (i = 0; i < raw.indices.length; ++i) {
		ent = raw.indices[i];

		var ts = ent[0].split('|').map(splitAcronyms);
		ts.forEach(function (arr) {
			//title acronyms as obj in place of a SET, should be converted to arr later
			for (var j = 1; j < arr.length; ++j) {
				(tAcronyms[arr[j]] || (tAcronyms[arr[j]] = {}))[titles.length] = true;
			}
			//title
			titles.push([arr[0], i]);
		});

		//counts
		ent[1].match(pNumber).forEach(function (cnt, sub) {
			(charCounts[cnt] || (charCounts[cnt] = [])).push(i * 1000 + sub);
		});

		//categories
		ent[1].match(pLetter).forEach(function (cat, sub) {
			for(var j = 1; j < ts[0].length; ++j){
				(catAcronyms[cat][ts[0][j]]||(catAcronyms[cat][ts[0][j]]={}))[categories[cat].length] =
					true;
			}
			categories[cat].push(i * 1000 + sub)
		});
	}

	for (i = 0; i < raw.authors.length; ++i) {
		ent = raw.authors[i];
		var first = splitAcronyms(ent[0]);
		first.slice(1).forEach(function (acronym) {
			(aAcronyms[acronym] || (aAcronyms[acronym] = {}))[authors.length] = true;
		});
		authors.push([first[0]].concat(ent.slice(1)));
	}

	//obj to arr conversions
	for (k in tAcronyms) {
		res.tAcronyms.push([k].concat(Object.keys(tAcronyms[k])));
	}
	var cat = {};
	//category data conversions
	for(k in catAcronyms){
		cat[k] = {list:categories[k].map(function(i){return [i];}),acronyms:[]};
		for(var k2 in catAcronyms[k]){
			cat[k].acronyms.push([k2].concat(Object.keys(catAcronyms[k][k2])));
		}
	}
	res.cat = cat;

	for (k in charCounts) {
		res.cCounts.push([parseInt(k, 10), charCounts[k]]);
	}

	for (k in aAcronyms) {
		res.aAcronyms.push([k].concat(Object.keys(aAcronyms[k])));
	}

	return res;
})();


//if (require.main === module)!function () {
//    console.log(module.exports.cCounts);
//}();
},{"./indices":7}],7:[function(require,module,exports){module.exports={"authors":[["皇甫松HFSHPSWFSWPS",0,20,35,36,48,60,80],["孫光憲SGXXGX",0,22,38,55,61,64,73,75,79,81,86,96,107,113,128,210,260,325],["張孝祥ZXX",1,124,364,516,566,802],["顧況GK",2],["段成式DCS",3],["鄭符ZF",3],["劉禹錫LYXLYT",4,24,48],["李端LD",5],["呂岩LY",6],["劉采春LCC",7],["王衍WYYY",8,42],["張可久ZKJ",9,21,32,53,92,100,101,244],["溫庭筠WTYWTJ",10,11,37,50,55,58,64,68,79,86,87,93,128,175,260],["張泌ZMZB",10,79,81,82,175,185,246,260],["毛熙震MXZMXSMYZMYS",10,70,107,262],["辛棄疾XQJ",10,74,86,102,158,166,183,234,252,260,275,315,400,410,422,430,444,446,478,494,658,728,782,783,796,813],["《花草粹編》無名氏WMS",10,87,110,217,321,444,478,531,708,744,813],["周邦彥ZBY",10,61,103,122,152,157,174,184,215,219,228,230,242,243,265,288,313,351,356,361,384,398,404,411,412,420,437,439,444,457,463,485,487,496,517,518,539,550,564,572,588,593,594,595,596,616,617,643,655,662,663,664,665,666,667,668,669,670,677,679,680,706,707,708,724,727,728,736,738,748,769,770,777,796,797,799,800,804],["顧敻GX",11,22,42,58,79,83,84,96,184,246,260,271,273,335],["韋莊WZHZ",11,58,60,64,65,68,75,79,93,113,128,138,184,260,261,262],["李景伯LJBLYB",12],["《本事詩》無名氏WMS",12],["張說ZSZYZT",13],["王建WJYJ",14,54],["無名氏WMS",15,16,45,52,472,821],["李霜崖LSY",17],["邵亨貞SHZSXZSPZ",18],["倪瓚NZ",18,101,127,244],["白居易BJY",19,23,67,259],["吳西逸WXY",21],["張雨ZY",21,45,73,172,181,474,658,660,673,769],["張志和ZZH",22],["南唐李煜NTLY",22,138,139,141,246,247,271,273,288],["蘇軾SS",22,65,91,110,117,131,186,190,212,279,310,325,348,355,415,429,446,455,468,483,488,494,516,545,566,588,614,658,697,759,776,783,813,814],["歐陽修OYX",23,28,62,67,108,109,111,144,154,158,159,189,193,214,265,266,275,372,394,437,611,782],["馮延巳FYSPYS",23,28,29,48,77,79,90,91,127,138,142,184,187,246,248,271,272,304,305],["韓翃HH",25],["唐妓柳氏TJLSTJLZTJLJ",25],["和凝HN",26,60,70,73,78,106,246,334],["歐陽炯OYJ",27,28,65,78,128,149,190,320,325,335,409],["李珣LX",28,79,88,260,261],["王之道WZDYZD",28,61,201,494,516,568,571,613,660,695],["黃機HJ",28,102,658],["趙長卿ZCQZZQTCQTZQDCQDZQ",28,102,126,138,145,158,161,211,214,228,266,294,313,317,330,333,339,344,348,355,356,433,440,446,460,481,518,590,614,658,667,708,808],["李石LSLD",29],["朱敦儒ZDRZTRSDRSTR",30,83,99,105,167,198,250,252,449,456,469,581,599],["張元幹ZYGZYH",30,78,108,123,138,260,284,481,494,552,602,614,660,697,808],["向子諲XZY",31,149,186,246],["王維WWWYYWYY",33],["元結YJ",34],["閻選YXYS",38,260],["王麗貞WLZYLZ",39],["李彌遜LMX",40,355,748,808],["喬吉QJ",41],["馬致遠MZY",41],["姜夔JK",43,138,168,186,343,354,366,412,437,459,471,475,485,494,495,553,562,578,594,601,604,614,622,649,650,658,668,687,688,755,765,781],["劉秉忠LBZ",44],["周德清ZDQ",45],["司馬九皋SMJGSMJH",45],["崔液CYCS",46],["李白LB",47,105,126,127,365,821],["寇準KZ",47,143,414],["劉長卿LCQLZQ",47],["柳永LY",48,86,87,143,176,177,184,186,189,190,193,213,219,229,247,260,261,272,274,275,277,300,306,327,360,361,363,369,370,371,378,385,386,392,393,396,404,406,416,418,423,425,427,428,435,436,442,443,444,446,450,451,452,461,462,465,473,481,482,485,494,499,502,503,504,505,512,515,527,528,543,544,545,564,565,566,612,633,634,635,636,655,676,677,678,694,695,696,697,698,699,721,722,723,724,735,736,737,742,748,749,768,772,773,775,780,787,788,792,795,798,800,803,807,814],["陳與義CYYZYY",49],["後唐莊宗HTZZ",51,57],["秦觀QG",52,111,127,145,164,181,182,219,348,372,444,476,566,589,615,658,677,742,744,776,786,796],["白樸BP",52,218,627,653,667,756,782],["徐失名XSM",53],["王惲WYYY",56,92,359],["趙孟頫ZMFZMTTMFTMTDMFDMT",56,567,629,701],["《梅苑》無名氏WMS",57,78,111,134,135,136,138,156,163,196,228,235,254,255,260,261,272,286,290,294,299,312,319,338,339,347,366,372,391,405,427,430,439,446,448,449,481,486,502,504,525,528,531,542,565,566,602,612,618,621,624,634,638,680,724,734,745,749,763,769,779,782,791,808],["《鳴鶴餘音》無名氏WMS",57,142,211,701,748,759,779,810],["吳文英WWY",57,61,69,102,138,184,190,297,313,316,351,358,384,389,398,404,405,446,466,471,479,498,501,507,508,529,539,554,555,556,580,588,590,605,606,607,621,624,658,662,664,665,666,668,679,687,690,691,702,708,715,731,754,762,767,769,777,789,799,804,816],["魏泰WT",57],["毛文錫MWXMWT",58,59,79,88,89,90,94,95,114,129,138,174,184,271,300,324,332],["魏承班WCBWZB",58,262,336],["牛嶠NJNQ",59,65,66,76,79,273],["張先ZX",60,64,97,107,110,111,127,156,179,196,214,220,221,222,223,260,265,288,302,307,323,347,379,383,388,406,408,413,453,468,473,477,530,531,568,639,640,656,699,751,798],["張耒ZL",61],["王千秋WQQYQQ",61],["賀鑄HZ",61,83,118,127,128,161,181,214,219,246,272,289,290,346,355,356,397,422,437,454,505,516,529,567,590,641,642,660,724,743,752,776,806],["吳激WJ",61,718],["曹勳CX",63,313,353,398,444,469,481,486,506,513,514,546,547,549,560,561,590,603,609,613,614,619,620,634,644,645,662,682,686,698,708,713,748,753,769,772,802],["尹鶚YE",65,70,84,115,185,321,450,526],["晏幾道YJD",67,78,119,121,153,160,163,180,186,192,193,195,211,224,246,268,350,363,379,387,389,446,518,739],["劉光祖LGZLGJ",67],["薛昭蘊XZYXZW",69,96,138,294,465],["楊無咎YWJYWGYMJYMG",69,162,188,211,214,219,232,233,249,251,266,282,301,351,362,363,398,402,431,517,519,596,643,648,658,667,710,736,754,805],["蔡伸CSSS",69,78,85,134,138,158,181,195,312,325,328,339,361,371,446,478,681,746,769],["張鎡ZZ",69],["毛滂MP",70,111,120,127,157,165,196,214,225,241,266,278,289,312,355,356,362,379,381,392,430,516,529,570,817],["歐良OL",71,242],["《明道雜誌》無名氏WMS",72],["蒲宗孟PZMBZM",73],["劉過LGLH",74,202,316,410,497,543,658,730,806],["《太平樂府》無名氏WMS",74],["司空圖SKT",79],["《樂府詩集》無名氏WMS",80],["韓偓HW",81,96],["劉侍讀LSD",81],["牛希濟NXJNXQ",81,88,246],["史達祖SDZSDJSTZSTJ",84,138,213,253,266,350,355,367,373,410,479,541,547,549,563,567,580,594,605,623,624,651,652,667,681,689,690,708,710,716,727,731,783],["萬俟詠WSYWQY",85,165,282,290,357,421,437,575,576,672,681,682,724,812],["周紫芝ZZZ",85,99,214,228,328,356,372,446,516,783],["李之儀LZY",86,192,199,439,658],["張炎ZYZT",86,236,271,313,343,355,410,446,459,471,495,510,511,520,543,553,562,593,594,596,607,609,614,625,637,647,660,664,679,687,716,718,727,765,766,770,782],["康與之KYZ",87,138,184,291,389,446,531,579,600,766,808],["李邴LB",87,446],["蔣捷JJJQ",87,102,138,216,301,313,327,350,466,501,502,621,625,626,634,667,669,690,792,793],["韓琦HQ",91],["顏奎YK",93,127],["李煜LY",96],["黃庭堅HTJ",98,121,141,142,145,192,195,226,228,260,269,275,301,311,321,341,361,363,378,380,397,437,446,566,569,705],["葛立方GLFGLPGLWGWFGWPGWW",99,566,638,658,802],["趙彥端ZYDTYDDYD",99,142,181,280,361,384,389,401,440,576,621,701,771],["林逋LB",102],["趙師俠ZSXTSXDSX",102,142,166,169,170,285,360,399,444,567],["葛長庚GCGGZG",102,776,779,795],["程垓CG",102,139,214,227,253,330,342,349,387,422,424,430,437,466,474,501,518,592,634,658,662,727,776],["晏殊YS",103,108,130,140,152,153,155,186,188,213,214,219,240,264,274,295,322,326,328,362,395,417,434],["沈會宗CHZCKZCGZSHZSKZSGZTHZTKZTGZ",103,281,304,314,456,531],["王安石WASWADYASYAD",104,377,438,637],["樓扶LFLP",105],["李清照LQZ",106,165,228,260,348,355,546,549,590],["朱淑真ZSZZCZSSZSCZ",106],["石孝友SXYDXY",110,127,134,280,304,372,437,590],["徐俯XF",110],["黃公度HGD",110,518],["杜安世DAS",110,128,142,153,186,189,191,222,247,249,274,276,308,328,348,363,392,417,425,452,548,721,750,758],["呂渭老LWL",111,231,253,260,338,444,456,469,493,494,634,668,684,685,698,700,761,769,783],["嚴仁YR",111,634],["陳鳳儀CFYZFY",111],["唐明皇TMHTMW",112],["周必大ZBDZBT",113],["程過CGCH",113],["宋祁SQSZ",116,247,345,501],["陸游LYLL",116,256,260,352,384,425,437,577,647,668,680,769],["《高麗史‧樂志》無名氏WMS",125,147,148,156,207,219,237,238,239,245,293,352,373,438,566,567,607,632,658,685,690,720],["晁補之CBZ",127,132,133,186,193,194,195,229,267,271,348,372,373,396,397,423,425,428,446,476,486,502,528,546,547,567,590,591,613,639,655,659,661,697,724,782,802],["《天機餘錦》無名氏WMS",128],["唐昭宗TZZ",129],["曹組CZCQ",133,228,355,399,400,405,658,681,744],["袁去華YQH",135,166,327,351,374,425,444,458,533,662,667,677,806],["《古今詞話》無名氏WMS",135,142,181,184,208,253,376,406,443,518,697],["《冷齋夜話》無名氏WMS",137],["江漢JHJT",138],["趙令畤ZLZTLZDLZ",139],["葉清臣YQCXQCSQC",142,360],["謝懋XM",145],["王勝之WSZYSZ",146],["南唐李璟NTLJ",150,261],["潘閬PLPDFLFDBLBD",151],["趙以夫ZYFTYFDYF",152,492,509,520,521,581,633,690,691,698,738,747,754],["王庭珪WTGYTG",154,350,362,467,678],["王詵WSYS",157,162,380,455,725,745],["左譽ZY",161],["吳潛WQ",164,355],["馬莊父MZF",164,581,698,783],["曹冠CG",166,200,325,381,568,813],["丘崇QC",171,399],["唐莊宗TZZ",173,801],["解昉JFXF",173],["《墨客揮犀》無名氏WMS",178],["劉鎮LZLT",181,621,625],["吳瓘WG",181],["高觀國GGG",183,406,422,547,566,590,594,781],["葉夢得YMDXMDSMD",184,372,494,614,676,783],["王沂孫WYSWYXYYSYYX",184,343,476,491,517,590,663,688],["陳允平CYPZYP",184,228,265,325,366,404,410,411,412,505,614,617,621,627,655,662,666,669,670,679,687,697,706,707,724,728,731,765,769,796,799,800,808],["李甲LJ",186,447,456,551,657,749,760,764,768,785],["周密ZM",186,252,266,316,466,522,558,559,562,590,594,615,628,637,647,650,664,665,673,675,687,706,741,766,797],["韓淲HP",186,252,303,410,712],["楊億YY",186],["李遵勖LZX",188,189],["孫道絢SDXXDX",188],["趙以仁ZYRTYRDYR",190],["沈端節CDJSDJTDJ",192,752],["《樂府雅詞》無名氏WMS",195,261,282,382,531,586,602,755,758,771,818],["劉弇LY",196],["權無染QWRQMR",197],["馬天驥MTJ",203],["侯寘HZ",204,250,480],["姚燧YS",205],["馬鈺MY",206],["《宋史‧樂志》無名氏WMS",209,794,795],["《金史‧樂志》無名氏WMS",209],["宋徽宗SHZ",211,263,500],["蘇易簡SYJ",212],["王觀WGYG",214,246,419,466,484,529,549],["王行WXWHYXYH",228,732],["曾紆CYCOZYZO",228,731],["卓田ZT",228],["王灼WZYZ",235],["白無咎BWJBWGBMJBMG",244,258],["徐昌圖XCT",246,260],["葉李YLXLSL",248],["盧炳LB",250,275,303,313],["趙汝茪ZRGTRGDRG",252,466],["宋媛唐氏SYTSSYTZSYTJ",253],["虞集YJ",257,769],["韋式WSHS",259],["張南史ZNS",259],["黃昇HS",260],["王嵎WYYY",266],["孫浩然SHRSGRXHRXGR",266],["王安中WAZYAZ",270,813],["方嶽FYPYWY",275,430,667],["李元膺LYY",280,446],["蘇庠SX",283],["朱雍ZYSY",285,515,544,655,788,795,803],["蜀妓SJ",287],["《湘山野錄》無名氏WMS",292],["黃子行HZXHZH",294,719],["曾覿CDCJZDZJ",295,390,598,634,667],["陳亮CLZL",295,430,432,534,637,714],["范成大FCDFCT",296,375,456],["韋彥溫WYWHYW",298],["汪存WCHC",301],["《全芳備祖》無名氏WMS",301,345,430],["舒亶SDYD",309],["程珌CB",315,699,806],["戴復古DFG",315,494],["邱崇QC",315],["《庚溪詩話》無名氏WMS",318],["劉儗LN",323,529],["宋媛魏氏SYWSSYWZSYWJ",323],["李泳LY",325],["京鏜JT",325,446,531,566,621],["范仲淹FZY",329,392,406],["李持正LCZ",331],["趙德仁ZDRTDRDDR",337],["梁寅LY",340],["江衍JY",345],["韓玉HY",348,368,403,648],["許沖元XCYHCY",350,367],["劉因LY",352,516],["俞克成YKCSKC",353],["胡銓HQ",355],["晁沖之CCZ",356,390,531],["汪莘WSWXHSHX",356,813],["張智宗ZZZ",362],["邵叔齊SSQSSJSSZ",365,399],["段克己DKJ",366],["羅子衎LZK",375],["彭元遜PYX",384,520,524,531,593,784],["袁祹YT",390],["衷長吉ZCJZZJ",392],["方千里FQLPQLWQL",398,404,412,539,588,655,668,679,770],["楊澤民YZMYDMYSMYYM",404,411,539,655,679],["李俊民LJM",405],["程大昌CDCCTC",407,567],["程核CH",410],["嶽珂YK",410],["張昇ZS",413],["蕭回XH",426],["元好問YHW",430,518,523,590],["司馬昂父SMAF",430],["柳富LF",430],["張震ZZZS",437],["易祓YF",437],["晁端禮CDL",437,573,574,658,802],["李冠LG",438,806],["《翰墨全書》無名氏WMS",438,537,538,587],["黃裳HCHS",440,446,568,637,638,678,703,770],["趙抃ZBZPTBTPDBDP",440],["汪梅溪WMXWMQHMXHMQ",441],["廖行之LXZLHZ",444],["牛真人NZR",444],["《泊宅編》方失名FSMPSMWSM",445],["葛郯GT",446],["汪元量WYLHYL",446,535,806,816],["劉一止LYZ",446,667,728,729,740],["阮閱RYJYYY",446],["劉子寰LZH",446],["盧祖皋LZGLZHLJGLJH",446,497,634,662],["林外LW",446],["潘牥PFFFBF",446],["陳濟翁CJWCQWZJWZQW",455],["《能改齋漫錄》無名氏WMS",455],["江致和JZH",464],["李獻能LXNLXTLXXLSNLSTLSX",466],["孫道恂SDXXDX",469],["楊炎昶YYCYTC",470],["李萊老LLL",471],["趙聞禮ZWLTWLDWL",472],["杜牧DM",476],["楊纘YZ",476,510,557],["李演LY",476,782],["吳禮之WLZ",478,566],["潘元質PYZFYZBYZ",478,532],["李彭老LPL",485,755],["胡浩然HHRHGR",489,711],["趙耆孫ZQSZQXZSSZSXZZSZZXTQSTQXTSSTSXTZSTZXDQSDQXDSSDSXDZSDZX",490],["趙鼎ZDZZTDTZDDDZ",494],["杜衍DY",494],["張翥ZZ",501,546,584,590,612,688,718,765,777,802],["滕賓TB",501],["傅公謀FGM",516],["景覃JTJQJYYTYQYY",529],["王雱WPYP",532],["《高麗史樂志》無名氏WMS",536],["趙可ZKTKDK",540],["施嶽SYYY",541,615,675],["湯恢THSHYH",543,698],["蕭列XL",543],["姚雲文YYW",543,583,778],["鄭子玉ZZY",543],["張台卿ZTQZYQ",546],["吳元可WYK",546,578],["孫惟信SWXSWSXWXXWS",547,669],["趙與御ZYYTYYDYY",552],["劉褒LB",566,806],["《玉照新志》無名氏WMS",566],["王安禮WALYAL",567,704],["鄭覺齋ZJZ",578],["張矩ZJ",581,621,746],["馮偉壽FWSPWS",582],["盧摯LZ",585,806],["趙必象ZBXTBXDBX",586],["陳合CHCGZHZG",590,808],["何夢桂HMG",590],["曾允元CYYZYY",593],["曹邍CY",594],["程先CX",596],["潘希白PXBFXBBXB",597],["薛夢桂XMG",605],["洪瑹HT",608,667],["宋媛蘇氏SYSSSYSZSYSJ",610],["韓縝HCHZ",613],["奚淢XYXX",613],["張輯ZJ",614,637],["吳師益WSY",618],["虛靖真人XJZR",630],["《復雅歌詞》無名氏WMS",631],["李芸子LYZ",634],["劉應雄LYX",634],["李劉LL",636,776],["司馬光SMG",638],["王夢應WMYYMY",638],["李致遠LZY",640],["元載YZYD",646],["尹煥YH",650],["郭子正GZZ",654],["蔡松年CSNSSN",660,761],["何籀HZ",662],["劉將孫LJSLJXLQSLQX",664],["毛開MK",667],["趙文ZWTWDW",667,675,816],["張樞ZS",667],["張肯ZK",667,733,769],["宋自遜SZX",669],["劉幾LJ",671,819],["黃孝邁HXM",674],["沈公述CGSSGSTGS",683],["《雅詞拾遺》無名氏WMS",689],["馮艾子FAZFYZPAZPYZ",692,717,790],["吳奕WY",693],["王十朋WSPYSP",698],["張安國ZAG",698],["徐伸XS",698],["錢應金QYJJYJ",704],["彭泰翁PTW",706],["鞠華翁JHWQHW",707],["劉燾LDLTLC",708],["謝逸XY",708],["江緯JW",709],["周伯陽ZBY",718],["劉圻父LQFLYF",725],["曾鞏CGZG",726],["魯逸仲LYZ",727,769],["王彧WYYY",728],["僧揮SH",741,786],["鄧千江DQJ",742],["韓元吉HYJ",752,806],["劉天迪LTD",755],["張埜ZY",756],["滕應賓TYB",756],["羅志仁LZR",757],["仇遠CYQY",764],["張景修ZJXZYX",769],["沈唐CTSTTT",770],["查荎CCZC",772],["劉濬LJ",774],["林正大LZDLZT",776],["趙從橐ZCTZCDZCLZZTZZDZZLTCTTCDTCLTZTTZDTZLDCTDCDDCLDZTDZDDZL",782],["徐一初XYC",782],["《豹隱紀談》平江妓PJJ",783],["李南金LNJ",783],["翁元龍WYLWYM",799],["李漳LZ",802],["傅按察FAC",802],["聶冠卿NGQZGQSGQYGQ",802],["詹正ZZSZDZ",804],["劉辰翁LCW",808],["廖瑩中LYZ",809],["宋褧SJ",811],["劉克莊LKZ",813],["丘處機QCJ",814],["鄭意娘ZYN",815],["黃公紹HGSHGC",816],["董穎DYZY",820]],"indices":[["竹枝ZZZQ","22P22Z46P"],["歸字謠GZYKZY|蒼梧謠CWYCYY|十六字令SLZL","16P"],["漁父引YFY","18P"],["閑中好XZH","18P18Z"],["紇那曲HNQGNQJNQ","20P"],["拜新月BXY","20Z"],["梧桐影WTYYTY|明月斜MYXMYY","20Z"],["囉嗊曲LHQLGQ|望夫歌WFG","20P20P28P"],["醉妝詞ZZC","22Z"],["慶宣和QXH","22X"],["南歌子NGZ|春宵曲CXQ|水晶簾SJL|碧窗夢BCM|十愛詞SAC|南柯子NKZ|望秦川WQC|風蝶令FDLFTL","23P26P52P52P53P54P"],["荷葉杯HYBHXBHSBKYBKXBKSB","23H26H50H"],["回波樂HBLHBY","24P24Z"],["舞馬詞WMC","24P24P"],["三台STSY|開元樂KYLKYY|翠華引CHY","24P24P"],["柘枝引ZZYZQY","24P"],["塞姑SG","24Z"],["晴偏好QPH","24Z"],["憑欄人PLR","24P25P"],["花非花HFH","26Z"],["摘得新ZDX","26P"],["梧葉兒WYEWXEWSEYYEYXEYSE","26X27P32P33P37X"],["漁歌子YGZ|漁父YF|漁父樂YFLYFY","27P27P27P25Z50Z50Z"],["憶江南YJN|謝秋娘XQN|江南好JNH|春去也CQY|望江南WJN|夢江南MJN|夢江口MJK|望江梅WJM|安陽好AYH|夢仙遊MXY|步虛聲BXS|壺山好HSH|望蓬萊WPL|歸塞北GSBKSB","27P54P59H"],["瀟湘神XXS","27P"],["章台柳ZTLZYL","27Z27Z"],["解紅JHJGJJXHXGXJ","27P"],["赤棗子CZZ","27P"],["南鄉子NXZ","27H28H28H30H54P56P56P58P58P"],["搗練子DLZ|搗練子令DLZL|深院月SYY","27P38P"],["春曉曲CXQ|西樓月XLY","27Z27Z"],["桂殿秋GDQ","27P"],["壽陽曲SYQ|落梅風LMF","27X28Z32X"],["陽關曲YGQ","28P"],["欸乃曲ANQENQ","28P"],["採蓮子CLZ","36P"],["浪淘沙LTS","28P"],["楊柳枝YLZYLQ","28P"],["八拍蠻BPMBBM","28P28P"],["字字雙ZZS","28P"],["十樣花SYHSXH","28Z28Z"],["天淨沙TJS|塞上秋SSQ","28P28P"],["甘州曲GZQ|甘州子GZZ","29P33P"],["醉吟商ZYS","29Z"],["乾荷葉GHYGHXGHSGKYGKXGKSQHYQHXQHSQKYQKXQKS","29X30X"],["喜春來XCL|陽春曲YCQ","29P29P30P31P"],["踏歌詞TGC","30P"],["秋風清QFQ|秋風引QFY|江南路JNL|新安路XAL","30P30P30Z"],["拋球樂PQLPQY|莫思歸MSGMSK","30P33P40P187Z"],["法駕道引FJDY","30P"],["蕃女怨FNYFRYBNYBRYPNYPRY","31H"],["一葉落YYLYXLYSL","31Z"],["憶王孫YWSYWXYYSYYX|獨腳令DJL|憶君王YJWYJY|豆葉黃DYHDXHDSH|畫娥眉HEM|欄杆萬里心LGWLX|怨王孫YWSYWXYYSYYX","31P31X54Z"],["金字經JZJ","31P32P34P"],["古調笑GDXGTXGZX|宮中調笑GZDXGZTXGZZX|轉應曲ZYQ|三台令STLSYL","32H"],["遐方怨XFYXPYXWY","32P60P"],["後庭花破子HTHPZ","32P33P"],["如夢令RML|憶仙姿YXZ|宴桃源YTY|不見BJBXFJFX|比梅BMPM|古記GJ|無夢令WMLMML|如意令RYL","33Z33Z33Z33Z33P66Z"],["訴衷情SZQ|桃花水THS","34H33H37H41P41P"],["西溪子XXZXQZ","33H35H"],["天仙子TXZ|萬斯年WSN","34Z34Z34H34P68Z"],["風流子FLZ","34Z110P110P111P110P109P109P108P111P"],["歸自謠GZYKZY|風光子FGZ|思佳客SJK","34Z"],["飲馬歌YMG","34Z"],["定西番DXFDXPDXB","35H35H35H35P41P"],["江城子JCZ|江神子JSZ|村意遠CYY","35P36P37P36P70P"],["望江怨WJY","35Z"],["長相思CXSZXS|吳山青WSQWSJ|山漸青SJQSJJSCQSCJSQQSQJ|青山相送迎QSXSYJSXSY|長相思令CXSLZXSL|相思令XSL","36P36P36P36P36P"],["思帝鄉SDX","36P34P33P"],["相見歡XJHXXH|秋夜月QYY|上西樓SXL|西樓子XLZ|憶真妃YZFYZP|月上瓜州YSGZ|烏夜啼WYT","36H36P36P36P36P"],["河滿子HMZ|何滿子HMZ","36P37P73P74P74Z"],["風光好FGH","36H"],["誤桃源WTY","36P"],["望梅花WMH|望梅花令WMHL","38Z38P70Z72Z82Z"],["醉太平ZTP|淩波曲LBQ|醉思凡ZSF|四字令SZL","38P45Z46P"],["上行杯SXBSHB","38H39Z41Z"],["感恩多GED","39H40H"],["長命女CMNCMRZMNZMR|薄命女BMNBMR","39Z"],["春光好CGH|愁倚闌令CYLL|愁倚闌CYL|倚闌令YLL","40P41P41P41P42P42P43P48P"],["酒泉子JQZ","40H40H40H41H43H40H41H43H42H44H42H42H45H43H42P43H43P45P43P42P43P42P"],["怨回紇YHHYHGYHJ","40P40P"],["生查子SCZSZZ|楚雲深CYS|梅和柳MHL|晴色入青山QSRQSQSRJS","40Z40Z41Z42Z42Z"],["蝴蝶兒HDEHTE","40P"],["添聲楊柳枝TSYLZTSYLQ|賀聖朝影HSZYHSCY|太平時TPS","40H40P44P"],["醉公子ZGZ|四換頭SHT","40H40H40X106Z"],["昭君怨ZJY|洛妃怨LFYLPY|宴西園YXY","40H39H40H"],["玉蝴蝶YHDYHT|玉蝴蝶慢YHDMYHTM","41P42H99P99P98P99P99P"],["女冠子NGZRGZ|女冠子慢NGZMRGZM","41H107Z110Z111Z112Z113Z114X"],["中興樂ZXLZXY|濕羅衣SLYQLYTLYXLY","41H42P84P"],["紗窗恨SCHMCH","41H42H"],["醉花間ZHJ","41Z41Z50Z"],["點絳唇DJCZJC|點櫻桃DYTZYT|十八香SBX|南浦月NPY|沙頭雨STY|尋瑤草XYCXYZ","41Z41Z43Z"],["平湖樂PHLPHY|小桃紅XTHXTGXTJ|採蓮詞CLC","42P42P43P"],["歸國遙GGYKGY|歸平遙GPYKPY","42Z43Z42Z"],["戀情深LQS","42H42H"],["贊浦子ZPZ|贊普子ZPZ","42P"],["浣溪沙WXSWQSGXSGQSHXSHQS|小庭花XTH|減字浣溪沙JZWXSJZWQSJZGXSJZGQSJZHXSJZHQS|滿院春MYC|東風寒DFH|醉木犀ZMX|霜菊花SJH|廣寒枝GHZGHQ|試香羅SXL|清和風QHF|怨啼鵑YTJ","42P42P44P46P42Z"],["醉垂鞭ZCB","42H"],["雪花飛XHF","42P"],["沙塞子SSZ|沙磧子SQZ","42P49P50P49Z"],["殿前歡DQH|鳳將雅FJYFQY","42P44P"],["水仙子SXZ","42P44P"],["霜天曉角STXJSTXGSTXL|月當窗YDC|踏月TY|長橋月CQYZQY","43Z43Z43Z43Z44Z44Z43P43P44P"],["清商怨QSY|關河令GHL|傷情怨SQY","43Z42Z43Z"],["傷春怨SCY","43Z"],["菩薩蠻PSMBSM|重疊金ZDJCDJTDJ|子夜歌ZYG|菩薩鬘PSMBSM|花間意HJY|梅花句MHJMHG|花溪碧HXBHQB|晚雲烘日WYHRWYHM","44H44H44P"],["採桑子CSZ|醜奴兒令CNEL|羅敷媚歌LFMG|醜奴兒CNE|羅敷媚LFM","44P48P54P"],["後庭花HTH|玉樹後庭花YSHTH","44Z46Z46Z44Z"],["訴衷情令SZQL|漁父家風YFJFYFGF|一絲風YSF","44P45P45P"],["減字木蘭花JZMLH|減蘭JL|木蘭香MLX|天下樂令TXLLTXYL","44H"],["卜算子BSZ|缺月掛疏桐QYGST|百尺樓BCLMCL|楚天謠CTY|眉峰碧MFB","44Z44Z45Z45Z46Z46Z46Z"],["一落索YLS|洛陽春LYC|玉連環YLH|一絡索YLS","44Z45Z46Z47Z48Z48Z49Z50Z"],["好時光HSG","45P"],["謁金門YJM|空相憶KXY|花自落HZL|垂楊碧CYB|楊花落YHL|出塞CS|東風吹酒面DFCJM|不怕醉BPZFPZ|醉花春ZHC|春早湖山CZHS","45Z45Z45Z46Z"],["柳含煙LHY","45H"],["杏園春XYC","46P"],["好事近HSJ|釣船笛DCD|翠圓枝CYZCYQ","45Z45Z"],["華清引HQY","45P"],["天門謠TMY","45Z"],["憶悶令YML","45Z"],["散餘霞SYX","45Z"],["好女兒HNEHRE|繡帶兒XDE","45P45P62P"],["萬里春WLC","45Z"],["彩鸞歸令CLGLCLKL|青山遠QSYJSY","45P"],["錦園春JYC","45Z"],["太平年TPN","45Z"],["清平樂QPLQPY|清平樂令QPLLQPYL|憶蘿月YLY|醉東風ZDF","46H46H46Z"],["憶秦娥YQE|秦樓月QLY|雙荷葉SHYSHXSHSSKYSKXSKS|蓬萊閣PLG|碧雲深BYS|花深深HSS","46Z46Z46Z76Z40Z38Z41Z37H46P76P40P"],["更漏子GLZ","46H46H46H45H46H45H49P104P"],["巫山一段雲WSYDY","46H46H44P"],["望仙門WXM","46P"],["占春芳ZCF","46P"],["朝天子ZTZCTZ|思越人SYRSHR","46Z"],["憶少年YSN|隴首山LSS|十二時SES|桃花曲THQ","46Z47Z"],["西地錦XDJ","46Z48Z47Z"],["相思引XSY|玉交枝YJZYJQ|定風波令DFBL|琴調相思引QDXSYQTXSYQZXSY|鏡中人JZR","46P49Z48Z"],["落梅風LMF","46P"],["江亭怨JTY|清平樂令QPLLQPYL|荊州亭JZT","46Z"],["喜遷鶯XQY|鶴沖天HCT|萬年枝WNZWNQ|春光好CGH|喜遷鶯令XQYL|燕歸來YGLYKL|早梅芳ZMF|烘春桃李HCTL","47H47H47H47H47H46P103Z103Z103Z103Z103Z105Z103Z103Z103Z102Z103Z"],["烏夜啼WYT|聖無憂SWYSMY|錦堂春JTC","47P48P50P"],["相思兒令XSEL|相思令XSL","47P"],["阮郎歸RLGRLKJLGJLKYLGYLK|碧桃春BTC|醉桃源ZTY|宴桃源YTY|濯纓曲ZYQSYQ","47P47P"],["賀聖朝HSZHSC|轉調賀聖朝ZDHSZZDHSCZTHSZZTHSCZZHSZZZHSC","47Z47Z49Z49Z48Z48Z47Z47Z49P50P50P"],["甘草子GCZGZZ","47Z47Z"],["珠簾捲ZLJZLQ","47P"],["畫堂春HTC","47P46P48P49P49P"],["喜長新XCXXZX","47P"],["金盞子JZZ","47P"],["獻天壽XTSSTS","47P"],["三字令SZL","48P54H"],["山花子SHZ|南唐浣溪沙NTWXSNTWQSNTGXSNTGQSNTHXSNTHQS|添字浣溪沙TZWXSTZWQSTZGXSTZGQSTZHXSTZHQS|攤破浣溪沙TPWXSTPWQSTPGXSTPGQSTPHXSTPHQS|感恩多令GEDL","48P"],["憶餘杭YYHYYK","48H49H"],["秋蕊香QRXQJX","48Z48Z97P"],["胡搗練HDL|望仙樓WXL","48Z48Z50Z"],["桃源憶故人TYYGR|虞美人影YMRY|胡搗練HDL|桃園憶故人TYYGR|醉桃園ZTY|杏花風XHF","48Z49Z"],["撼庭秋HTQ|感庭秋GTQ","48Z"],["慶金枝QJZQJQ|慶金枝令QJZLQJQL","48P50P50P"],["燭影搖紅ZYYHZYYGZYYJ|憶故人YGR|歸去曲GQQKQQ|玉珥墜金環YEZJH|秋色橫空QSHK","48Z50Z96Z"],["朝中措ZZCZZZCZCCZZ|照江梅ZJM|芙蓉曲FRQ|梅月圓MYY","48P48P48P49P"],["洞天春DTCTTC","48Z"],["慶春時QCS","48P"],["眼兒媚YEMWEM|小欄杆XLG|東風寒DFH|秋波媚QBM","48P48P48P"],["人月圓RYY|青衫濕QSSQSQQSTQSXJSSJSQJSTJSX","48P48P48Z"],["喜團圓XTY|與團圓YTY","48P48P"],["海棠春HTC|海棠花HTH|海棠春令HTCL","48Z48Z46Z"],["武陵春WLC|武林春WLC","48P49P54P"],["東坡引DPY","48Z49Z58Z59Z59Z"],["雙鸂鶒SQCSXC","48Z"],["鬲溪梅令LXMLLQMLGXMLGQMLEXMLEQML|高溪梅令GXMLGQML","48P"],["伊州三台YZSTYZSY","48P"],["雙頭蓮令STLL","48P"],["梅弄影MNYMLY","48Z"],["茅山逢故人MSFGRMSPGR","48Z"],["陽臺夢YTMYYM","49Z57H"],["月宮春YGC|月中行YZXYZH","49P50P"],["河瀆神HDS","49H49P"],["歸去來GQLKQL","49Z52Z"],["惜春郎XCL","49Z"],["極相思JXS|極相思令JXSL","49P"],["雙韻子SYZ","49Z"],["鳳孤飛FGF","49Z"],["柳梢青LSQLSJLXQLXJ|雲淡秋空YDQKYTQKYYQK|雨洗元宵YXYX|玉水明沙YSMS|早春怨ZCY|隴頭月LTY","49P49P50P49Z49Z49Z50Z50Z"],["醉鄉春ZXC|添春色TCS","49Z"],["太常引TCY|太清引TQY|臘前梅LQM","49P50P"],["應天長YTCYTZ|應天長令YTCLYTZL|應天長慢YTCMYTZM","50Z49Z49Z50Z94Z94Z94Z98Z98Z98Z98Z98Z"],["滿宮花MGH","50Z51Z"],["少年遊SNY|玉臘梅枝YLMZYLMQ|小欄杆XLG","50P50P51P52P48P50P50P51P52P52P51P51P51P52P49Z"],["偷聲木蘭花TSMLH","50H"],["滴滴金DDJ","50Z50Z50Z51Z"],["憶漢月YHYYTY|望漢月WHYWTY","50Z50Z52Z52Z"],["西江月XJY|白蘋香BPX|步虛詞BXC|江月令JYL","50X50X50X51H56P"],["惜春令XCL","50P50P"],["留春令LCL","50Z50Z52Z54Z"],["梁州令LZL|涼州令LZL|梁州令疊韻LZLDY","50Z52Z55Z104Z"],["鹽角兒YJEYGEYLE","50Z"],["歸田樂GTLGTYKTLKTY|歸田樂引GTLYGTYYKTLYKTYY","50Z50Z71Z71Z70Z"],["惜分飛XFF|惜雙雙XSS|惜雙雙令XSSL|惜芳菲XFF","50Z52Z54Z56Z56Z"],["孤館深沉GGSC","50P"],["促拍採桑子CPCSZCBCSZ|促拍醜奴兒CPCNECBCNE","50P"],["怨三三YSS","50P"],["使牛子SNZ","50Z"],["折丹桂ZDGSDG","50Z"],["竹香子ZXZ","50Z"],["城頭月CTY","50Z"],["四犯令SFL|四和香SHX|桂華明GHM","50Z"],["醉高歌ZGG","50X"],["黃鶴洞仙HHDXHHTX","50Z"],["破字令PZL","50Z"],["花前飲HQY","50Z"],["導引DY","50P50P100P100P100P"],["思越人SYRSHR","51H"],["探春令TCL|景龍燈JLDJMDYLDYMD","51Z52Z52Z52Z52Z52Z52Z53Z52Z52Z52Z52Z52Z"],["越江吟YJYHJY|宴瑤池YYCYYT|瑤池宴YCYYTY|瑤池宴令YCYLYTYL","51Z51Z"],["燕歸樑YGLYKL","51P51P50P52P"],["雨中花令YZHL|送將歸SJGSJKSQGSQK","51Z51Z52Z52Z52Z54Z55Z54Z53Z56Z85Z70P"],["鳳來朝FLZFLC","59Z"],["秋夜雨QYY","51Z"],["伊州令YZL|伊川令YCL","51Z"],["木笪MD","51Z"],["迎春樂YCLYCY","52Z53Z51Z51Z51Z51Z52Z"],["夢仙郎MXL","52H"],["青門引QMYJMY","52Z"],["菊花新JHX","52Z52Z"],["醉紅妝ZHZZGZZJZ","52P"],["思遠人SYR","52Z"],["醉花陰ZHYZHA","52Z"],["望江東WJD","52Z"],["入塞RS","52P"],["品令PL","52Z51Z55Z55Z55Z64Z64Z63Z60Z65Z66Z65Z"],["引駕行YJXYJH|長春CCZC","52Z100Z100Z125P"],["玉團兒YTE","52Z"],["傾杯令QBL","52Z"],["鋸解令JJLJXL","52Z"],["雙雁兒SYE|雙燕子SYZ","52P"],["尋芳草XFCXFZ|王孫信WSXWSSWXXWXSYSXYSSYXXYXS","52Z"],["恨來遲HLCHLZHLX|恨歡遲HHCHHZHHX","52P53P"],["珍珠令ZZL","52Z"],["壽延長破字令SYCPZLSYZPZL","52Z"],["獻天壽令XTSLSTSL","52P"],["折花令ZHLSHL","52Z"],["紅窗聽HCTGCTJCT|紅窗睡HCSGCSJCS","53Z"],["上林春令SLCL","53Z"],["紅窗迥HCJGCJJCJ","53Z53Z"],["紅羅襖HLAGLAJLA","53P"],["折桂令ZGLSGL|秋風第一枝QFDYZQFDYQ|天香引TXY|蟾宮曲CGQ","53P50P63P100P"],["荔子丹LZD","53P"],["臨江仙LJX|謝新恩XXE|雁後歸YHGYHK|畫屏春HPCHBC|庭院深深TYSS","54P58P58P58P60P58P56P60P62P59P59P"],["浪淘沙令LTSL|曲入冥QRM|賣花聲MHS|過龍門GLMGMMHLMHMM|煉丹砂LDS","54P53P55P52P54Z55Z"],["金錯刀JCDJXD|醉瑤瑟ZYS|君來路JLL","54P54P54Z"],["端正好DZH|於中好YZHWZH","54Z54Z"],["杏花天XHT|杏花風XHF","54Z55Z56Z"],["天下樂TXLTXY","54Z"],["戀繡衾LXQ|淚珠彈LZDLZT","54P54P55P55P56P"],["擷芳詞XFC|折紅英ZHYZGYZJYSHYSGYSJY|清商怨QSY|惜分釵XFC|釵頭鳳CTF|玉瓏璁YLC","54Z58Z58H60Z60H"],["鬢邊華BBH","54Z"],["玉樓人YLR","54Z"],["江月晃重山JYHZSJYHCSJYHTS","54P"],["南鄉一剪梅NXYJM","54P"],["鸚鵡曲YWQ|黑漆弩HQN|學士吟XSY","54Z"],["一七令YQL","55P55Z56P56Z"],["河傳HCHZ|怨王孫YWSYWXYYSYYX|慶同天QTT|月照梨花YZLH|秋光滿目QGMM","55H54H54H54H53H53H53H53X53X53H54H54H54H55H55H55H53H54H54H53H51Z57Z57Z60Z61Z61Z59Z"],["望遠行WYXWYH","55P53P60P78P107Z106Z106Z"],["木蘭花令MLHL","55Z52Z54Z"],["金蓮繞鳳樓JLRFL","55Z"],["睿恩新REX","55Z"],["芳草渡FCDFZD","55H57P57P89Z87Z"],["夜行船YXCYHC|明月棹孤舟MYZGZ","55Z55Z56Z56Z56Z58Z56Z58Z55Z55Z56Z"],["金鳳鉤JFGJFQ","55Z54Z"],["鷓鴣天ZGT|思越人SYRSHR|思佳客SJK|剪朝霞JZXJCX|驪歌一疊LGYDCGYD|醉梅花ZMH","55P"],["鼓笛令GDL","55Z"],["徵召調中腔ZZDZQZZDZKZZTZQZZTZKZZZZQZZZZKZSDZQZSDZKZSTZQZSTZKZSZZQZSZZK","55Z"],["虞美人YMR|虞美人令YMRL|玉壺冰YHBYHN|憶柳曲YLQ|一江春水YJCS","56H56H56H58H58H58P58H"],["瑞鷓鴣RZG|舞春風WCF|桃花落THL|鷓鴣詞ZGC|拾菜娘SCNJCN|天下樂TXLTXY|太平樂TPLTPY|五拍WPWB","56P56P64P64P88P86P"],["玉樓春YLC|惜春容XCR|西湖曲XHQ|玉樓春令YLCL|歸朝歡令GZHLGCHLKZHLKCHL","56Z56Z56Z56Z"],["鳳銜杯FXB","56Z63Z56P57P"],["鵲橋仙QQX|鵲橋仙令QQXL|憶人人YRR|金風玉露相逢曲JFYLXFQJFYLXPQ|廣寒秋GHQ","56Z56Z56Z58Z57Z58Z88Z"],["玉欄杆YLG","56Z"],["思歸樂SGLSGYSKLSKY","56Z"],["遍地錦BDJ","56Z"],["翻香令FXL","56P"],["茶瓶兒CPE","56Z54Z54Z"],["柳搖金LYJ","56Z"],["卓牌子ZPZ|卓牌子令ZPZL|卓牌子慢ZPZM","56Z97Z93Z"],["清江曲QJQ","56H"],["樓上曲LSQ","56H"],["廳前柳TQL|亭前柳TQL","56P55P54P"],["二色宮桃ESGT","56Z"],["市橋柳SQL","56Z"],["一斛珠YHZ|一斛夜明珠YHYMZ|醉落魄ZLPZLBZLT|怨春風YCF|醉落拓ZLTZLZ","57Z57Z57Z"],["夜遊宮YYG|新念別XNB","57Z57Z"],["梅花引MHY|貧也樂PYLPYY|小梅花XMH","57H57H114H115H"],["荷葉鋪水面HYPSMHXPSMHSPSMKYPSMKXPSMKSPSM","57P"],["家山好JSHGSH","57P"],["步虛子令BXZL","57P"],["小重山XZSXCSXTS|小沖山XCS|小重山令XZSLXCSLXTSL|柳色新LSX","58P60P57P58Z"],["踏莎行TSXTSH|喜朝天XZTXCT|柳長春LCCLZC|踏雪行TXXTXH|轉調踏莎行ZDTSXZDTSHZTTSXZTTSHZZTSXZZTSH","58Z66Z64Z"],["宜男草YNCYNZ","58Z60Z"],["花上月令HSYL","58P"],["倚西樓YXL","58Z"],["掃地舞SDW|掃市舞SSW","58Z"],["接賢賓JXB|集賢賓JXB","59P117P"],["步蟾宮BCG|釣臺詞DTCDYC|折丹桂ZDGSDG","59Z58Z56Z55Z57Z"],["恨春遲HCCHCZHCX","59P"],["冉冉雲RRY|弄花雨NHYLHY","59Z59Z"],["蝶戀花DLHTLH|鵲踏枝QTZQTQ|黃金縷HJL|捲珠簾JZLQZL|明月生南浦MYSNP|細雨吹池沼XYCCZXYCTZ|鳳棲梧FQWFQYFXWFXY|一籮金YLJ|魚水同歡YSTH|轉調蝶戀花ZDDLHZDTLHZTDLHZTTLHZZDLHZZTLH","60Z60Z60Z"],["壽山曲SSQ","60P"],["秋蕊香QRXQJX","60Z"],["惜瓊花XQHXXH","60Z"],["朝玉階ZYJCYJ","60P"],["散天花STH","60P"],["荷華媚HHMKHM","60Z"],["少年心SNX|添字少年心TZSNX","60X"],["七娘子QNZ","60Z58Z60Z"],["一翦梅YJM|臘梅香LMX|玉簟秋YDQ","60P60P60P60P60P58P59P"],["尋梅XM","60Z60Z"],["錦帳春JZC","60Z60Z58Z56Z"],["唐多令TDL|糖多令TDL|南樓令NLL|箜篌曲KHQ","60P61P62P"],["攤破採桑子TPCSZ","60P"],["後庭宴HTY","60Z"],["綎紅THTGTJ","60Z"],["賀熙朝HXZHXCHYZHYC","61Z61Z"],["撥棹子BZZFZZ","61Z61X62Z"],["玉堂春YTC","61H"],["繫裙腰XQYJQY|芳草渡FCDFZD","61P59P58P"],["贊成功ZCG","62P"],["定風波DFB|定風流DFL|定風波令DFBL","62H63H62H60H60H62P62P60P"],["破陣子PZZ|十拍子SPZSBZ","62P"],["金蕉葉JJYJJXJJSJQYJQXJQS","62Z48Z46Z46Z"],["漁家傲YJAYGA","62Z62Z62X66Z"],["蘇幕遮SMZ|鬢雲松令BYSL","62Z"],["攤破南鄉子TPNXZ|青杏兒QXEJXE|似娘兒SNE|慶靈椿QLC|閑閑令XXL","62P62P"],["明月逐人來MYZRLMYDRLMYTRL","62Z"],["甘州遍GZB","63P"],["別怨BY","63P"],["麥秀兩岐MXLQ","64Z"],["獻衷心XZXSZX","64P69P"],["黃鐘樂HZLHZY","64P"],["醉春風ZCF|怨東風YDF","64Z"],["握金釵WJC|戛金釵JJC","64Z64Z"],["侍香金童SXJTSXJZ","64Z64Z65Z"],["緱山月GSY","64P"],["喝火令HHL","65P"],["芭蕉雨BJYBQYPJYPQY","65Z"],["淡黃柳DHLTHLYHL","65Z65Z65Z"],["滾繡球GXQ","65Z"],["錦纏道JCD|錦纏頭JCT|錦纏絆JCB","66Z67Z66Z"],["厭金杯YJB|獻金杯XJBSJB","66Z"],["慶春澤QCZQCDQCSQCY","66Z66Z98Z"],["行香子XXZHXZ","66P66P66P66P66P68P64P69P"],["酷相思KXS","66Z"],["解佩令JPLXPL","66Z66Z66Z65Z65Z"],["垂絲釣CSD","66Z66Z66Z67Z"],["謝池春XCCXTC|風中柳FZL|風中柳令FZLL|玉蓮花YLH|賣花聲MHS","66Z64Z64Z"],["勝勝令SSL|聲聲令SSL","66P66P"],["玉梅令YML","66Z"],["青玉案QYAJYA|西湖路XHL","67Z67Z68Z66Z66Z66Z68Z69Z67Z68Z68Z66Z68Z"],["感皇恩GHEGWE","67Z67Z67Z68Z68Z65Z66Z"],["鈿帶長中腔DDCZQDDCZKDDZZQDDZZKTDCZQTDCZKTDZZQTDZZK","67P"],["夢行雲MXYMHY|六么花十八LYHSBLMHSB","67Z"],["三奠子SDZ","67P"],["鳳凰閣FHG|數花風SHFCHF","68Z67Z67Z"],["看花回KHH","66P67P101Z101Z101Z103Z104Z104Z"],["殢人嬌TRJNRJ","68Z68Z67Z66Z64Z"],["兩同心LTX","68Z68Z68Z68P68P72X"],["拾翠羽SCYSCHJCYJCH","68Z"],["連理枝LLZLLQ|紅娘子HNZGNZJNZ|小桃紅XTHXTGXTJ|灼灼花ZZH","70Z72Z"],["月上海棠YSHT|玉關遙YGY|月上海棠慢YSHTM","70Z72Z70Z91Z91Z"],["惜黃花XHH","70Z70Z"],["且坐令QZLJZL","70Z"],["佳人醉JRZ","71Z"],["西施XSXY","71P73P"],["小鎮西犯XZXFXTXF|小鎮西XZXXTX|鎮西ZXTX","71Z79Z79Z"],["千秋歲QQS|千秋節QQJ","71Z71Z71Z71Z71Z72Z72Z72Z"],["惜奴嬌XNJ","71Z72Z71Z80Z102Z"],["卓牌子近ZPZJ","71Z"],["三登樂SDLSDY","71Z72Z"],["簷前鐵YQTYQD","71Z"],["甘露歌GLG|祝英台ZYTZYYCYTCYY","72H"],["憶帝京YDJ","71Z76Z"],["于飛樂YFLYFYXFLXFY|鴛鴦怨曲YYYQ","72P73P76P"],["撼庭竹HTZ","72P72Z"],["粉蝶兒FDEFTE","72Z72Z"],["繞池遊RCYRTY","72Z"],["師師令SSL","73Z"],["隔浦蓮近拍GPLJPGPLJBRPLJPRPLJBJPLJPJPLJB|隔浦蓮GPLRPLJPL|隔浦蓮近GPLJRPLJJPLJ","73Z73Z73Z73Z73Z"],["郭郎兒近拍GLEJPGLEJB","73Z"],["臨江仙引LJXY","74P74H"],["碧牡丹BMD","74Z75Z"],["百媚娘BMNMMN","74Z"],["風入松FRS|風入松慢FRSM|遠山橫YSH","74P72P73P76P"],["傳言玉女CYYNCYYRZYYNZYYR","74Z74Z73Z"],["枕屏兒ZPEZBE","74Z"],["剔銀燈TYD|剔銀燈引TYDY","75Z74Z76Z78Z78Z"],["隔簾聽GLTRLTJLT","75Z"],["越溪春YXCYQCHXCHQC","75P"],["長生樂CSLCSYZSLZSY","75P75P"],["訴衷情近SZQJ","75Z75Z75Z"],["下水船XSC","75Z75Z75Z76Z"],["解蹀躞JDXXDX|玉蹀躞YDX","75Z75Z75Z75Z75Z75Z"],["撲蝴蝶PHDPHT|撲蝴蝶近PHDJPHTJ","75Z75Z77Z77Z"],["千年調QNDQNTQNZ|相思會XSHXSKXSG","75Z77Z"],["蕊珠閑RZXJZX","75Z"],["瑞雲濃RYN","75Z"],["番槍子FQZFCZPQZPCZBQZBCZ|春草碧CCBCZB","75Z"],["荔枝香LZXLQX|荔枝香近LZXJLQXJ","76Z75Z76Z76Z76Z76Z76Z73Z73Z73Z"],["婆羅門引PLMY|婆羅門PLM|望月婆羅門引WYPLMY","76P76P76P76P"],["御街行YJXYJH|孤雁兒GYE","76Z76Z77Z78Z81Z80Z"],["韻令YL","76P"],["春聲碎CSS","76Z"],["鳳樓春FLC","77P"],["祝英台近ZYTJZYYJCYTJCYYJ|寶釵分BCF|月底修簫譜YDXXP|燕鶯語YYY|寒食詞HSCHYC","77Z77Z77Z77Z77Z77Z77Z77P"],["四園竹SYZ","77P77P77P"],["側犯CFZF","77Z77Z77Z76Z"],["離亭宴LTYCTYGTY","77Z72Z"],["陽關引YGY|古陽關GYG","78Z"],["一叢花YCH","78P"],["甘州令GZL","78Z"],["山亭柳STL","79P79Z"],["夢還京MHJMXJ","79Z"],["憶黃梅YHM","79Z"],["紅林檎近HLQJGLQJJLQJ","79P"],["快活年近拍KHNJPKHNJBKGNJPKGNJB","79Z"],["金人捧露盤JRPLPJRPLX|銅人捧露盤TRPLPTRPLX|上平西SPX|上西平SXP|西平曲XPQ|上平南SPN","79P79P78P78P81P"],["過澗歇GJXGJYHJXHJY","80Z80Z80Z"],["瑤階草YJCYJZ","80Z"],["安公子AGZ","80Z106Z106Z104Z106Z102Z"],["應景樂YJLYJYYYLYYY","80Z"],["柳初新LCX","81Z82Z"],["鬥百花DBHDMH|夏州XZJZ","81Z81Z81Z"],["皂羅特髻ZLTJ","81Z"],["最高樓ZGL|醉高春ZGC","81H85H80H83H82H82P82P83H83P78P82Z"],["倒垂柳DCL","81Z81Z"],["彩鳳飛CFF|彩鳳舞CFW","81Z"],["有有令YYL","81Z"],["拂霓裳FNCFNSBNCBNS","82P83P"],["柳腰輕LYQ","82Z"],["爪茉莉ZMLZMC","82Z"],["驀山溪MSXMSQ|上陽春SYC","82Z81Z82Z82Z82Z82Z82Z82Z82Z82Z82Z82Z83Z"],["千秋歲引QQSY|千秋歲令QQSL|千秋萬歲QQWS","82Z84Z85Z87Z"],["早梅芳ZMF|早梅芳近ZMFJ","82Z82Z80Z"],["新荷葉XHYXHXXHSXKYXKXXKS|折新荷引ZXHYZXKYSXHYSXKY|泛蘭舟FLZ","82P82P82P82P"],["南州春色NZCS","82P"],["長壽樂CSLCSYZSLZSY","83Z113Z"],["迷仙引MXY","83Z122Z"],["促拍花滿路CPHMLCBHML","83P81P83P86P86P87P83Z83Z86Z90Z88Z"],["黃鶴引HHY","83Z"],["洞仙歌DXGTXG|洞仙歌令DXGLTXGL|羽仙歌YXGHXG|洞仙詞DXCTXC|洞中仙DZXTZX|洞仙歌慢DXGMTXGM","83Z83Z83Z83Z83Z83Z83Z82Z82Z84Z84Z84Z84Z84Z84Z84Z85Z85Z85Z85Z85Z85Z85Z85Z85Z85Z86Z86Z86Z86Z86Z87Z88Z88Z93Z118Z123Z126Z123Z124Z"],["望雲涯引WYYY","83Z"],["泛蘭舟FLZ","83Z"],["踏歌TG","83Z84Z"],["秋夜月QYY","84Z83Z"],["祭天神JTSZTS","84Z85Z"],["鶴沖天HCT","84Z86Z88Z"],["少年遊慢SNYM","84Z"],["兀令WL","84Z"],["踏青遊TQYTJY","84Z84Z84Z83Z"],["夢玉人引MYRY","84Z84Z84Z85Z82P"],["蕙蘭芳引HLFY|蕙蘭芳HLF","84Z"],["傾杯近QBJ","84Z"],["清波引QBY","84Z83Z"],["簇水CS","85Z"],["受恩深SES|愛恩深AES","86Z"],["婆羅門令PLML","86Z"],["華胥引HXY","86Z"],["五福降中天WFJZTWFXZT|五福降中天慢WFJZTMWFXZTM","86P"],["離別難LBNCBNGBN","87H112P"],["江城梅花引JCMHY|攤破江城子TPJCZ|四笑江梅引SXJMY|梅花引MHY|明月引MYY|西湖明月引XHMYY","87P87P88P87P87P87P87P85P"],["寰海清HHQ","87P"],["勸金船QJC","88Z92Z"],["醉思仙ZSX","88P89P91P91P"],["玉人歌YRG","88Z"],["惜紅衣XHYXGYXJY","88Z89Z88Z88Z"],["魚游春水YYCSYLCS","89Z89Z"],["卜算子慢BSZM","89Z93Z"],["雪獅兒XSE","89Z92Z"],["石湖仙SHXDHX","89Z"],["八六子BLZ|感黃鸝GHL","90P91P89P88P88P88P"],["謝池春慢XCCMXTCM","90Z"],["採桑子慢CSZM|醜奴兒慢CNEM|愁春未醒CCWXCCWCCCWJ|醜奴兒近CNEJ|疊青錢DQQDQJDJQDJJ","90P90X90P90Z89P"],["探芳信TFXTFS|西湖春XHC","90Z90Z90Z89Z"],["遙天奉翠華引YTFCHY","90P"],["夏雲峰XYFJYF","91P91P91P91P91P"],["採蓮令CLL","91Z"],["醉翁操ZWC","91P"],["紅芍藥HSYHSSHSLHXYHXSHXLHQYHQSHQLHDYHDSHDLGSYGSSGSLGXYGXSGXLGQYGQSGQLGDYGDSGDLJSYJSSJSLJXYJXSJXLJQYJQSJQLJDYJDSJDL","91Z"],["法曲獻仙音FQXXYFQSXY|獻仙音XXYSXY|越女鏡心YNJXYRJXHNJXHRJX","92Z92Z92Z92Z91Z87Z"],["金盞倒垂蓮JZDCL","92P92P92Z"],["塞翁吟SWY","92P"],["意難忘YNW","92P"],["東風齊著力DFQZLDFQCLDFJZLDFJCLDFZZLDFZCL","92P"],["遠朝歸YZGYZKYCGYCK","92Z"],["露華LH|露華慢LHM","92Z94P"],["薄媚摘遍BMZB","92Z"],["戀香衾LXQ","92P"],["滿江紅MJHMJGMJJ","93Z93Z93Z91Z89Z94Z94Z94Z97Z94Z91Z91Z92Z93P"],["淒涼犯QLF|瑞鶴仙影RHXY","93Z93Z94Z"],["浣溪沙慢WXSMWQSMGXSMGQSMHXSMHQSM|浣溪紗慢WXSMWXMMWQSMWQMMGXSMGXMMGQSMGQMMHXSMHXMMHQSMHQMM","93Z"],["四犯剪梅花SFJMH|轆轤金井LLJJ|三犯錦園春SFJYC|月城春YCC|錦園春JYC","93Z93Z92Z"],["高平探芳新GPTFX","93Z"],["臨江仙慢LJXM","93P"],["雪明鳷鵲夜XMZQY","94Z"],["玉漏遲YLCYLZYLX","94Z94Z94Z94Z96Z93Z90Z"],["尾犯WFYF|碧芙蓉BFR","94Z94Z98Z99Z100Z"],["駐馬聽ZMT","94P"],["雪梅香XMX","94P94P"],["六么令LYLLML|綠腰LY|樂世LSYS|錄要LY","94Z94Z94Z"],["保壽樂BSLBSY","94Z"],["惜秋華XQH","94Z93Z93Z93Z93Z"],["古香慢GXM","94Z"],["芙蓉月FRY","94Z"],["一枝春YZCYQC","94Z94Z"],["梅子黃時雨MZHSY","94Z"],["如魚水RYS","94P"],["賞松菊SSJ","94Z"],["二色蓮ESL","95Z"],["塞孤SG","95Z93Z"],["水調歌頭SDGTSTGTSZGT|元會曲YHQYKQYGQ|凱歌KG","95P95P95H95P97P97P96P94P"],["掃地遊SDY|掃花遊SHY","95Z95Z94Z"],["滿庭芳MTF|鎖陽臺SYTSYY|滿庭霜MTS|瀟湘夜雨XXYY|話桐鄉HTX|江南好JNH|滿庭花MTH|轉調滿庭芳ZDMTFZTMTFZZMTF","95P95P93P96P96P97P96Z"],["白雪BX","95P"],["徵招ZZZQZS","95Z95Z95Z"],["雙瑞蓮SRL","95Z"],["玉京秋YJQ","95Z"],["小聖樂XSLXSY|驟雨打新荷ZYDXHZYDXK","95P"],["玉女迎春慢YNYCMYRYCM","95Z"],["玉梅香慢YMXM","95Z"],["金浮圖JFT","96Z"],["陽臺路YTLYYL","96Z"],["黃鶯兒HYE","96Z97Z95Z"],["天香TX","96Z96Z96Z96Z95Z96Z96Z96Z"],["熙州慢XZMYZM","96Z"],["漢宮春HGCTGC|漢宮春慢HGCMTGCM","96P96P96P97P94P96P96P96P96Z94Z"],["倦尋芳JXF|倦尋芳慢JXFM","96Z97Z"],["劍器近JQJ","96Z"],["秋蘭香QLX","96P"],["鳳鸞雙舞FLSW","96Z"],["行香子慢XXZMHXZM","96P"],["甘露滴喬松GLDQS","96Z"],["慶千秋QQQ","96P"],["塞垣春SYC","96Z95Z95Z98Z"],["望雲間WYJ","96P"],["步月BY","96P94Z"],["早梅香ZMX","96Z"],["八聲甘州BSGZ|甘州GZ|蕭蕭雨XXY|宴瑤池YYCYYT","97P97P95P95P95P98P96P"],["迷神引MSY","97Z97Z"],["醉蓬萊ZPL|雪月交光XYJG|冰玉風月BYFYNYFY","97Z97Z"],["鳳凰臺上憶吹簫FHTSYCXFHYSYCX|憶吹簫YCX","97P97P97P96P95P95P"],["夜合花YHHYGH","97P100P100P100P99P"],["採明珠CMZ","97Z"],["慶清朝QQZQQC|慶清朝慢QQZMQQCM","97P97P97P97P"],["黃鸝繞碧樹HLRBS","97Z"],["帝台春DTCDYC","97Z"],["瑤台第一層YTDYCYYDYC","97P98P98P"],["暗香AX","97Z97Z"],["夢芙蓉MFR","97Z"],["西子妝XZZ","97Z"],["玉京謠YJY","97Z"],["被花惱BHNPHN","97Z"],["綠蓋舞風輕LGWFQLHWFQ","97Z"],["月邊嬌YBJ","97Z"],["松梢月SSYSXY","97P"],["四檻花SJHSKHSXH","97P"],["長亭怨慢CTYMZTYM","97Z97Z97Z97Z"],["玉簟涼YDL","97P"],["留客住LKZ","98Z94Z"],["晝夜樂ZYLZYY","98Z98Z"],["雨中花慢YZHM","98P98P99P100P97P96P98P97P96P98Z98Z97Z97Z"],["萬年歡WNH","98P100P101P102P100Z100Z100Z101Z99Z100Z100X"],["燕春台YCTYCY|夏初臨XCLJCL","98P98P97P97P"],["逍遙樂XYLXYY","98Z"],["八節長歡BJCHBJZH","98P99P"],["憶東坡YDP","98Z"],["粉蝶兒慢FDEMFTEM","98Z"],["並蒂芙蓉BDFR","98Z"],["黃河清慢HHQM","98Z"],["春草碧CCBCZB","98Z"],["芰荷香JHXJKX","98P97P"],["繡停針XTZ","98Z"],["揚州慢YZM","98P98P98P"],["舞楊花WYH","98P"],["雙雙燕SSY","98Z98Z"],["孤鸞GL","98Z98Z98Z98Z"],["雲仙引YXY","98P"],["玲瓏玉LLY","98P"],["陌上花MSH","98Z"],["福壽千春FSQC","98Z"],["夏日燕黌堂XRYHTXMYHTJRYHTJMYHT","98P99P"],["水晶簾SJL","98Z"],["三部樂SBLSBYSPLSPY","99Z99Z99Z100Z"],["夢揚州MYZ","99P"],["聲聲慢SSM|勝勝慢SSM|人在樓上RZLS","99P97P97P97P97P98P96P96P97Z99Z97Z97Z97Z95Z"],["紫玉簫ZYX","99P"],["無悶WMMM","99Z"],["月下笛YXD","99Z99Z100Z99Z97Z"],["玲瓏四犯LLSF","99Z101Z101Z100Z100Z99Z99Z"],["丁香結DXJZXJ","99Z"],["瑣寒窗SHC","99Z99Z100Z100Z98Z"],["大有DYTY","99Z"],["燕山亭YST","99Z"],["聒龍謠GLYGMY","99Z99Z"],["金菊對芙蓉JJDFR","99P"],["催雪CX","99Z"],["十月桃SYT|十月梅SYM","99P99P98P"],["蜀溪春SXCSQC","99P"],["秋宵吟QXY","99Z"],["三姝媚SSM","99Z101Z99Z"],["鳳池吟FCYFTY","99P"],["新雁過妝樓XYGZLXYHZL|雁過妝樓YGZLYHZL|瑤台聚八仙YTJBXYYJBX|八寶妝BBZ|百寶妝BBZMBZ","99P99P99P106P"],["月華清YHQ","99Z"],["國香GX|國香慢GXM","99P99P"],["飛龍宴FLYFMY","99Z"],["御帶花YDH","100Z"],["定風波DFB|定風流DFL|定風波令DFBL","100Z99Z101Z105Z"],["芳草FCFZ|鳳簫吟FXY","100P100P101P101P100P"],["念奴嬌NNJ|大江東去DJDQTJDQ|酹江月LJY|赤壁詞CBC|酹月LY|壺中天慢HZTM|大江西上曲DJXSQTJXSQ|太平歡TPH|壽南枝SNZSNQ|古梅曲GMQ|湘月XY|淮甸春HDCHSCHTCHYC|白雪詞BXC|百字令BZLMZL|百字謠BZYMZY|無俗念WSNMSN|千秋歲QQS|慶長春QCCQZC|杏花天XHT","100Z100Z100Z100Z100Z100Z101Z102Z100P100P100P100P"],["解語花JYHXYH","100Z98Z101Z"],["繞佛閣RFG","100Z"],["渡江雲DJY|三兒犯渡江雲SEFDJY","100P100P100Z"],["臘梅香LMX","100Z101P"],["大椿DCTC","100Z"],["八音諧BYX","100Z"],["絳都春JDC","100Z100Z100Z100Z100Z98Z98Z98P"],["琵琶仙PPX","100Z"],["換巢鸞鳳HCLF","100X"],["東風第一枝DFDYZDFDYQ","100Z100Z100Z100Z"],["高陽臺GYTGYY|慶春澤慢QCZMQCDMQCSMQCYM|慶宮春QGC","100P100P100P"],["春夏兩相期CXLXQCXLXJCJLXQCJLXJ","100Z"],["垂楊CY","100Z98Z"],["採綠吟CLY","100X"],["長壽仙CSXZSX","100P"],["雪夜漁舟XYYZ","100Z"],["惜寒梅XHM","100Z"],["惜花春起早慢XHCQZM","100Z"],["鳳歸雲FGYFKY","101P101P107Z"],["木蘭花慢MLHM","101P101P101P101P101P101P101P101P102P101P100P103P"],["彩雲歸CYGCYK","101P"],["滿朝歡MZHMCH","101Z100Z"],["桂枝香GZXGQX|疏簾淡月SLDYSLTYSLYY","101Z101Z101Z101Z100Z101Z"],["錦堂春慢JTCM|錦堂春JTC","101P100P101P99P98P"],["喜朝天XZTXCT","101P103P"],["剪牡丹JMD","101Z98Z"],["馬家春慢MJCMMGCM","101Z"],["梅香慢MXM","101Z"],["玉燭新YZX","101Z101Z"],["六花飛LHF","101Z"],["清風滿桂樓QFMGL","101Z"],["映山紅慢YSHMYSGMYSJM","101Z"],["真珠簾ZZL","101Z101Z101Z101Z"],["曲江秋QJQ","101Z103Z"],["翠樓吟CLY","101Z"],["霓裳中序第一NCZXDYNSZXDY","101Z102Z103Z"],["月當廳YDT","101P"],["壽樓春SLC","101P"],["秋色橫空QSHK","101P"],["舜韶新SSX","101Z"],["西平樂XPLXPY|西平樂慢XPLMXPYM","102Z102Z103Z137P135P135P136P"],["山亭宴STY","102Z"],["望春回WCH","102Z"],["水龍吟SLYSMY|豐年瑞FNR|鼓笛慢GDM|龍吟曲LYQMYQ|小樓連苑XLLY|莊椿歲ZCS","102Z102Z102Z101Z102Z102Z102Z104Z106Z102Z102Z102Z102Z102Z102Z102Z104Z106Z102Z102Z101Z102Z102Z102P102Z"],["鬥百草DBCDBZDMCDMZ","102Z101Z"],["石州慢SZMDZM|柳色黃LSH|石州引SZYDZY","102Z102Z102Z102Z102Z102Z"],["上林春慢SLCM","102Z102Z"],["宴清都YQD|四代好SDH","102Z102Z102Z102Z99Z101Z102Z102Z102Z"],["慶春宮QCG|慶宮春QGC","102P102Z"],["憶舊遊YJY|憶舊遊慢YJYM","102P102P102P102P104P103P"],["花犯HF|繡鸞鳳花犯XLFHF","102Z102Z102Z101Z"],["倒犯DF|吉了犯JLF","102Z102Z102Z"],["瑞鶴仙RHX|一撚紅YNHYNGYNJ","102Z102Z102Z102Z100Z103Z102Z102Z102Z102Z103Z101Z100Z90Z102X100Z"],["齊天樂QTLQTYJTLJTYZTLZTY|台城路TCLYCL|五福降中天WFJZTWFXZT|如此江山RCJS","102Z102Z102Z103Z102Z103Z102Z104Z"],["晝錦堂ZJT","102P102P102P102P102Z"],["氐州第一DZDYZZDY|熙州摘遍XZZBYZZB","103Z102Z"],["花發狀元紅慢HFZYHMHFZYGMHFZYJMHBZYHMHBZYGMHBZYJM","102Z"],["戀芳春慢LFCM","102P"],["瑤華YH|瑤花慢YHM","102Z102Z"],["湘春夜月XCYY","102P"],["曲遊春QYC","102Z103Z101Z"],["竹馬兒ZME|竹馬子ZMZ","103Z103Z"],["長相思慢CXSMZXSM","103P103P104P104P"],["雨霖鈴YLL","103Z103Z103Z"],["還京樂HJLHJYXJLXJY","103Z103Z103Z103Z103Z103Z"],["雙頭蓮STL","103Z100Z100Z100Z"],["憶瑤姬YYJ|別素質BSZ|別瑤姬慢BYJM","103Z105P105P110P"],["安平樂慢APLMAPYM","103P104P"],["望南雲慢WNYM","103P"],["情久長QJCQJZ","103Z"],["西江月慢XJYM","103Z106Z"],["杏花天慢XHTM","103Z"],["探春慢TCM|探春TC","103Z103Z103Z103Z94Z"],["眉嫵MW|百宜嬌BYJMYJ","103Z103Z103Z"],["湘江靜XJJ|瀟湘靜XXJ","103Z103Z"],["金盞子JZZ","103Z103Z101Z101Z102P"],["龍山會LSHLSKLSGMSHMSKMSG","103Z103Z"],["春雲怨CYY","103Z"],["升平樂SPLSPY","103P"],["迎新春YXC","104Z"],["歸朝歡GZHGCHKZHKCH|菖蒲綠CPLCBL","104Z104Z"],["雙聲子SSZ","104P"],["永遇樂YYLYYY|消息XX","104Z104Z104Z104Z104Z104Z104P"],["二郎神ELS|轉調二郎神ZDELSZTELSZZELS|十二郎SEL","104Z104Z105Z105Z105Z103Z103Z105Z100Z"],["傾杯樂QBLQBY|古傾杯GQB|傾杯QB","104Z104Z106Z106Z107Z109Z108Z108Z108Z116Z"],["百宜嬌BYJMYJ","104Z"],["月中桂YZG|月中仙YZX","104Z104Z102X"],["澡蘭香ZLXCLX","104Z"],["宴瓊林YQLYXL","104Z103Z"],["瀟湘逢故人慢XXFGRMXXPGRM","104P104P"],["惜餘歡XYH","104Z"],["拜星月慢BXYM|拜新月BXY","104Z104Z102Z101Z"],["綺寮怨QLYYLY","104P102P103P"],["花心動HXD|好心動HXD|桂香飄GXP|上升花SSH|花心慢動HXMD","104Z104Z104Z104Z104Z104Z100Z105Z101Z"],["向湖邊XHB","104Z"],["陽春YC|陽春曲YCQ","104Z104Z"],["送入我門來SRWML","104P"],["繞池遊慢RCYMRTYM","104P"],["索酒SJ","104Z"],["瑞雲濃慢RYNM","104Z"],["霜花腴SHY","104P"],["綺羅香QLXYLX","104Z104Z103Z"],["玉連環YLH","104Z"],["春從天上來CCTSLCZTSL","104P104P106P102P"],["西湖月XHY","104Z103Z"],["愛月夜眠遲慢AYYMCMAYYMZMAYYMXM","104P"],["合歡帶HHDGHD","105P105P"],["曲玉管QYG","105X"],["早梅芳慢ZMFM","105Z"],["尉遲杯WCBWZBWXBYCBYZBYXB","105Z105Z105Z105Z106Z104Z106P"],["花發沁園春HFQYCHBQYC","105Z105P"],["賞南枝SNZSNQ","105P"],["南浦NP","105Z105Z105Z105Z102P"],["西河XH|西河慢XHM|西湖XH","105Z105Z105Z105Z111Z104Z"],["夢橫塘MHT","105Z"],["西吳曲XWQ","105Z"],["秋霽QJ|春霽CJ","105Z105Z105Z103Z"],["清風八詠樓QFBYL","104Z"],["暗香疏影AXSY","105Z"],["真珠髻ZZJ","105Z"],["征部樂ZBLZBYZPLZPY","106Z"],["解連環JLHXLH|望梅WM|杏樑燕XLY","106Z106Z106Z"],["內家嬌NJJNGJ","106Z"],["夜飛鵲慢YFQM|夜飛鵲YFQ","106P106P"],["泛清波摘遍FQBZB","106Z"],["望明河WMH","106Z"],["楚宮春慢CGCM","106Z108Z"],["望海潮WHC","107P107P107P"],["望湘人WXR","107Z"],["青門飲QMYJMY","107Z105Z106Z"],["落梅LM|落梅慢LMM","107Z106Z"],["飛雪滿群山FXMQS|遍扁尋舊約BBXJYBBXJDBPXJYBPXJD|飛雪滿堆山FXMDS","107P106P"],["角招JZJQJSGZGQGSLZLQLS","107Z"],["一寸金YCJ","108Z108Z108Z108Z105Z"],["擊梧桐JWTJYTXWTXYT","108Z108Z110Z"],["折紅梅ZHMZGMZJMSHMSGMSJM","108Z108Z"],["泛清苕FQTFQS","108P"],["薄倖BX","108Z108Z107Z"],["倚欄人YLR","108Z"],["惜黃花慢XHHM","108Z108Z108P"],["一萼紅YEHYEGYEJ","108P107P108P108Z"],["奪錦標DJB|清溪怨QXYQQY","108Z108Z106Z"],["菩薩蠻慢PSMMBSMM","108Z"],["杜韋娘DWNDHN","109Z109Z"],["無愁可解WCKJWCKXMCKJMCKX","109Z112Z"],["過秦樓GQLHQL","109P"],["江城子慢JCZM|江神子慢JSZM","109Z110Z"],["江南春慢JNCM","109Z"],["胄馬索ZMS","109Z"],["八寶妝BBZ|八犯玉交枝BFYJZBFYJQ","110Z96Z"],["疏影SY|綠意LY|解佩環JPHXPH","110Z110Z110Z110Z110Z"],["大聖樂DSLDSYTSLTSY","110P108Z110Z"],["高山流水GSLS","110P"],["慢捲紬MJCMQC","111Z110Z"],["選冠子XGZSGZ|選官子XGZSGZ|轉調選冠子ZDXGZZDSGZZTXGZZTSGZZZXGZZZSGZ|惜餘春慢XYCM|蘇武慢SWM|過秦樓GQLHQL","111Z111Z111Z111Z113Z113Z113Z113Z113Z113Z113Z114Z113Z107Z109Z113Z"],["霜葉飛SYFSXFSSF|半嬋娟BCJ","111Z109Z111Z110Z111Z111Z112Z"],["五彩結同心WCJTX","111P111Z"],["透碧霄TBXSBX","112P112P117P"],["玉山枕YSZ","113Z"],["期夜月QYYJYY","113Z"],["輪臺子LTZLYZ","114Z140Z"],["沁園春QYC|東仙DX|壽星明SXM|洞庭春色DTCSTTCS","114P114P116P116P112P115P113P"],["丹鳳引DFY","114Z114Z100Z"],["紫萸香慢ZYXM","114P"],["瑤台月YTYYYY|瑤池月YCYYTY","114Z120Z118Z"],["宣清XQ","115Z"],["八歸BGBK","115Z113P"],["摸魚兒MYE|買陂塘MBTMPT|陂塘柳BTLPTL|邁陂塘MBTMPT|山鬼謠SGY|雙蕖怨SQY","116Z116Z116Z117Z116Z114Z114Z117Z116X"],["賀新郎HXL|金縷歌JLG|金縷曲JLQ|金縷詞JLC|乳燕飛RYF|賀新涼HXL|風敲竹FQZ|貂裘換酒DQHJ","116Z116Z115Z117Z117Z116Z116Z116Z115Z113Z115Z"],["子夜歌ZYG","117Z"],["弔嚴陵DYL|暮雲碧MYB","119Z"],["金明池JMCJMT|昆明池KMCKMTHMCHMT|夏雲峰XYFJYF","120Z120Z"],["送征衣SZY","121P"],["笛家DJDG|笛家弄慢DJNMDJLMDGNMDGLM","121Z121Z"],["秋思耗QSHQSM|畫屏秋色HPQSHBQS","123Z"],["春風嫋娜CFNN","125P"],["春雪間早梅CXJZM","124P"],["白苧BZBN","125Z121Z"],["翠羽吟CYYCHY","126P"],["六州LZ","129P"],["十二時慢SESM","130Z91Z141Z125P"],["蘭陵王LLWLLY","131Z130Z130Z130Z"],["大酺DPTP","133Z133Z"],["破陣樂PZLPZY","133Z133Z"],["瑞龍吟RLYRMY","133Z133Z133Z132Z"],["浪淘沙慢LTSM","133Z133Z133Z132Z"],["歌頭GT","136Z"],["多麗DL|鴨頭綠YTL|隴頭泉LTQ","139P139P137P139P139P139P139P140Z140Z"],["玉女搖仙佩YNYXPYRYXP","137Z139Z"],["六醜LC","140Z140Z140Z"],["玉抱肚YBD","141Z"],["六州歌頭LZGT","143X133X143H143H143P143P143P141P144P"],["夜半樂YBLYBY","144Z145Z"],["寶鼎現BDXBZX|三段子SDZ|寶鼎兒BDEBZE","157Z155Z157Z156Z158Z157Z158Z158Z"],["個儂GN","159Z"],["解紅慢JHMJGMJJMXHMXGMXJM","160X"],["穆護砂MHS","169X"],["三台STSY|開元樂KYLKYY|翠華引CHY","171Z"],["哨遍SB|稍遍SB","203Z203X203Z203X204X202X203X199H160X"],["戚氏QSQZQJ|夢遊仙MYX","212X213X210P"],["勝州令SZL","215Z"],["鶯啼序YTX|豐樂樓FLLFYL","240Z240Z240Z240Z236Z"],["調笑令DXLTXLZXL","38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z38Z"],["九張機JZJ","30P30P30P30P30P30P30P30P30P29P29P30P30P30P30P30P30P30P30P"],["梅花曲MHQ","92P100P"],["薄媚BM","95X87X95X88X94X88X82X128X"],["清平調辭QPDCQPTCQPZC","84P28P28P28P28P20P28P28P28P28P28P20P28P28P20P28P28P28P28P20P20P20P28P28P28P20P20P20P20P20P20P20P20P"]]};
},{}],6:[function(require,module,exports){exports.rimeBook="東涷蝀䍶通蓪侗恫狪𣻢𣌾同童僮侗曈瞳銅峒桐橦絧罿𦨴筒筩穜蕫潼烔衕鮦䴀犝𦏆酮氃戙籠櫳聾嚨曨朧襱巃瓏礱瀧蠪龐蓬芃篷韸髼䡫蒙幪濛雺朦矇饛䴌蠓懵𧭊怱聰葱𨍉繱驄㚇騣鬉豵猣鯼蝬椶稯緵嵏嵸鬷朡叢𥵫潨洪葓篊紅鴻魟虹訌渱烘空箜崆倥悾𢃐涳公工功攻釭玒蚣翁螉嗡豐酆灃㒥麷風楓瘋馮渢堸瞢儚嵩崧娀菘充珫㤝䘪㳘終螽𩅧戎駥狨絨茙崇漴中衷忠忡浺盅翀蟲爞沖隆癃窿䃧霳融瀜肜雄熊弓躬匑宮穹芎窮藭\
冬𩂓彤𢥞鼕農噥𩅽憹儂膿蕽鬆宗棕賨悰琮淙鬃\
鍾鐘彸妐忪鈆舂摏蹖憃𪄻衝憧鱅慵茸䇯㲨氄媶蜙淞凇樅鏦瑽摐縱蹤松從䗥丰莑蜂鋒桻烽峯封崶葑逢縫傭𨙦重蝩龍蘢醲濃襛穠鬞容𩮠褣庸鄘鎔鏞槦榕蓉溶墉瑢鱅鰫䗤跫恭龔供共珙匈胷凶詾洶邕廱雝雍噰饔灉癰禺喁鰅蛩蛬邛筇\
1P \
蕫董蝀懂侗桶恫動㗢峒籠攏琫玤𧑑俸唪菶埲蠓曚矇懵幪捅總𩮀偬𥠡翪蓯鬷嵸嗊孔空汞蓊𩄘滃螉塕𩡓䭰𩗴\
腫種踵尰宂𣯏氄竦悚慫聳駷捧冢湩寵隴壠甬埇勇踊慂俑𧗴湧蛹洶詾恐拱珙鞏栱䂬擁壅\
送凇糉偬緵㚇鯼𩋯凍涷棟蝀痛洞峒詷慟恫弄哢齈𠘊哄閧控鞚空貢贛㔶羾戇䔈甕幪霿夢瞢賵諷鳳衆𩅧𥰲嗊中仲\
宋綜統䃧㗢湩\
用俸縫葑縱瘲頌誦訟從種踵重緟恐供拱共雍灉壅\
1Z \
江茳豇扛杠矼釭腔椌跫降缸洚邦梆垹龐𩐨逢尨厖駹蛖䵨哤雙艭䉶䝄𨇯窗摐鏦淙漴樁幢撞瀧\
陽暘煬揚徉佯洋鍚瘍颺楊鴹羊垟禓芳妨方坊肪祊枋鴋蚄房防魴亡忘望杗鋩襄緗纕瓖驤相廂箱蘘瀼湘鑲蠰瑲鏘將槍蹌斨牄搶嗆鶬將漿蔣螀詳祥𦍲庠翔牆檣戕嬙薔商觴傷殤湯𪄲螪昌倡閶猖菖鯧𪂇章彰嫜璋墇漳樟麞獐常裳嘗徜償鱨𪄹穰禳鬤攘懹纕瓤瀼躟勷霜孀驦鸘創瘡愴莊妝裝奘牀張粻漲𦳝倀瞠鼚長腸場萇良量糧粱梁涼凉𩗬𨄈駺娘香薌鄉膷麘羌蜣薑疆姜僵𠘌橿韁䗵强䲔央殃鞅鴦鉠泱秧雵怏王惶餭徨匡筐恇劻眶狂𣴥\
唐餹堂塘溏篖棠𪕹𩹶螗螳碭當襠璫鐺簹艡湯簜鏜郎廊閬哴踉浪㟍硠琅鋃蒗筤稂桹榔狼駺蜋囊𧖒幫㨍彭滂雱磅旁傍䠙芒茫邙忙蘉甿桑喪䮣倉蒼滄鶬艙臧贓牂藏穅(糠)康慷岡剛鋼綱亢犅迒𦱌卬昂䭹㭿航杭行桁𦐄吭頏蚢汪𥆚𣺬荒慌肓衁(𥁃)㡛𦃑光洸胱桄黃皇媓遑徨惶喤鍠瑝璜簧篁餭煌堭隍潢湟艎凰騜鱑蝗鷬\
2P \
講港耩𢴦項缿棒玤蚌\
養癢瀁䑆象像襐潒橡蟓奬蔣槳兩緉裲魎鞅怏䬬柍强鏹仰搶愴想鯗掌爽騻塽敞氅廠僘響嚮享饗蠁繦襁丈杖仗昶壤穰攘賞仿紡鶭罔網惘蝄(魍)輞昉倣瓬枉往暀怳謊長上獷俇迋\
蕩盪崵璗簜黨讜灙曭帑儻倘惝朗硠閬曩灢榜膀蒡莽𩅁漭䥈蟒䒎顙嗓磉褬蒼駔髒沆骯吭慷坱泱盎晃幌滉愰慌恍廣瀇\
絳降洚巷䎫戇䡴幢撞\
漾羕樣恙養眻煬颺訪放舫妄忘望相醬將匠𪀘餉向曏唱障嶂瘴尚上讓壯裝創愴狀帳脹漲粻悵暢鬯韔仗長杖諒亮喨䣼𩗬量兩緉釀鄉旺王迋況貺誑\
宕踼碭儻盪蕩當擋浪㫰埌謗搒傍䠙喪葬藏臟吭行桁亢抗伉閌炕盎醠曠壙纊桄\
2Z \
支枝肢𥾣衼禔梔卮只氏𧹛鳷吱眵䮔施葹絁弛釃籭褷欐吹炊差𪙉嵯衰匙鍉垂陲倕兒唲痿斯廝澌凘虒𪆁螔㯕雌貲訾髭媊觜鮆疵玼骴茈隨隋知蜘腄箠摛螭魑黐痴馳踟篪池褫鬌錘甀離鸝蠡麗縭褵䍦罹蘺籬樆醨灕璃驪孋𧕮𪅆劙𥻿羸披帔陂羆碑錍詖皮疲郫糜醿縻蘼𦗕卑庳裨俾椑萆箄陴埤脾紕彌瀰鸍移栘匜椸𧛖簃扅酏暆蛇迤祇岐歧伎蚑軝芪蠵墮窺規摫羈覉奇畸掎剞犧羲嚱曦巇欹崎觭踦䗁碕奇騎錡埼漪猗椅宜儀鸃㕒涯崖為潙𩻟麾撝虧嬀隗逶委蜲萎危\
脂祗泜砥鴲隹鵻騅錐尸鳲蓍師篩獅鰤螄衰榱鴟推蓷誰蕤緌浽私綏雖濉咨資齎姿粢齍澬𩆂䖪茨瓷胝追絺郗瓻墀坻遲菭蚳椎槌鎚䊚棃(梨)蔾犁黧蜊嫠纍(累)藟蘲樏嫘尼怩呢狔夷姨洟痍彞鮧蛦惟維唯遺濰𧔥帷伊咿蛜飢肌机龜騩耆鰭鬐祁葵馗逵夔騤戣巋丕邳伾岯秠駓魾悲毗比琵枇笓貔魮阰紕睂(眉)嵋湄楣葿篃黴霉麋郿蘪\
之芝菑緇輜錙淄鶅鯔詩邿蚩媸嗤颸時塒蒔鰣漦而髵洏胹陑栭輀鴯鮞思偲罳緦𥯨絲司蕬茲孜孳孖仔滋嵫鼒鎡鰦耔詞辭祠慈磁鶿茲胔癡笞治持釐氂艃貍(狸)梩飴頤宧台眙怡貽詒僖嬉嘻禧熙暿欺僛姬朞(期)基箕其萁醫噫疑嶷觺其期棊(棋)旗琪璂綦萁蘄淇祺麒騏䳢蜞\
微薇溦霏菲馡妃婓裶騑非誹斐扉緋飛肥腓淝𩇯痱機鐖禨幾譏饑璣磯鞿歸希稀俙欷晞桸鵗暉輝揮鶤徽褘翬𤟤鰴衣依譩威葳媁蝛沂凒巍犩祈頎旂畿圻玂韋違幃闈圍䙟\
齊臍蠐櫅西棲粞撕嘶犀妻萋淒凄霋悽齎躋擠齏氐低堤磾鞮羝梯緹鵜題嗁(啼)提媞褆綈㡗蹏(蹄)醍隄稊荑銻鶗騠𧋘鯷𧀠泥臡黎瓈藜雞稽乩笄谿(溪)鸂螇醯兮奚㜎傒蹊鼷榽嵇豀鷖𧫦嫛㙠黳䃜倪齯䘽輗鯢霓蜺麑猊郳圭閨窐邽袿鮭睽奎刲攜巂蠵觿畦酅篦㮰鎞㡙狴椑批鈚砒鼙玭迷麛\
灰豗虺恢詼悝魁盔隈椳㟪煨䋿偎傀瑰櫰回徊洄槐茴桅嵬磓追搥堆䭔鎚𨌴推蓷穨頹雷儡罍𢺢挼毸崔𨻵催摧漼桮(杯)胚坏(坯)醅抔阫裴徘培掊毰紑陪枚梅莓媒禖脢玫鋂煤\
3P \
紙砥坻只咫枳軹疻弛豕侈哆誃恀姼是諟氏舐爾邇躧𩌦屣簁纚蓰釃襹揣捶棰箠錘菙繠蘂蕊徙璽此佌泚紫茈訾呰㧗𩶆(魮)髓瀡靃觜(嘴)惢禠豸廌阤杝邐柅䘦旎馜酏迤企跂跬頍綺觭碕掎踦剞技妓倚旖輢䭲裿蟻錡艤頠姽硊𪀗委崣萎蔿𤾡薳䦱毀燬烜檓䣀頯垝詭祪䤥桅蛫跪俾髀鞞箄庀仳蚍婢庳弭濔敉芈瞇彼被埤靡孊𦗕蘼鮆\
旨恉指厎矢視水死姊秭兕黹雉滍履柅壘累𡾊藟蘽樏漯誄耒唯壝瀢癸揆几机麂跽洧鮪巋軌簋匭晷宄厬氿鄙嚭秠否痞圮美眯匕比妣秕疕\
止趾址沚畤芷祉齒茝始市恃耳駬珥滓笫胏史使駛士仕柹戺俟涘枲葸子仔耔梓似巳祀姒耜汜圯苢徴恥峙跱痔塒里理俚娌悝裏李鯉梩以已苡矣唉喜蟢嬉起屺杞芑己紀巹擬儗薿譩你\
尾娓亹𧄸梶斐䨽悱朏菲誹匪篚棐榧豨唏霼豈䔇蟣幾穖扆顗螘韙偉煒暐韡葦瑋緯䍷虺卉鬼磈\
薺鱭穧洗姺濟泲擠米瀰陛邸氐疷底柢詆抵觝弤砥阺體涕緹醍弟娣悌遞禮醴澧蠡鱧禰嬭泥昵𪏸啓(啟)棨綮堄睨䘽\
賄悔傀㟴塊瘣匯廆猥椳痿琲浼每痗漼璀皠罪㠑腿磊瘰礧櫑蕾儡餒娞\
寘忮觶翅啻施豉鯷惴吹瑞倕睡諉𩌦屣賜刺莿庛蛓積漬胔柴眥智詈離縋槌錘硾甀累嫘易貤施袘椸企跂蚑縊螠恚觖戲寄徛芰騎輢倚踦義議誼為餧委偽譬臂嬖避比帔賁詖陂跛髲被骳\
至摯贄懥礩鷙織嗜視示諡二貳樲出帥率四肆駟泗柶次佽䯸絘恣自邃粹睟誶祟翠醉檇遂燧鐩隧襚旞璲繸檖篲穟穗萃顇悴瘁地致質疐躓輊懫杘緻稺稚治遟雉䉜利莉痢蒞䬆膩墜懟類禷淚蘱肄勩廙棄遺壝蜼悸痵季屭咥器冀覬穊驥洎蔇暨懿饐曀劓位罻喟愧餽騩匱櫃簣蕢饋畀庇鼻庳寐祕秘毖閟䪐泌邲費轡柲濞淠備贔奰糒㣁媚魅䉋\
志誌識痣幟試熾埴饎侍蒔畤餌珥咡刵胾鶅椔駛使廁事笥思伺寺嗣飼字孳置值植吏異食憙亟記忌惎誋意檍薏\
未味費髴靅芾沸炥䛍㵒屝䠊厞費翡狒蜚餼塈愾熂霼摡氣暣既溉衣毅胃謂㥜媦緯渭𩹂彚(彙)猬蝟諱卉泋貴尉慰畏罻蔚瑋霨魏犩\
霽濟擠隮穧細壻婿些切砌妻嚌𨣧懠劑齊薺媲睥閉薜謎帝諦嚏楴蒂螮締替剃揥涕裼屜薙弟第悌娣髢睇遰遞禘棣杕麗隸儷戾悷盭𩗅𩗭沴蛠棙捩䓞茘唳泥䛏系繫係禊盻殢契鍥䁈䏿計繼髻薊檵蛣医翳繄嫕殪曀㙠瞖蘙齸詣栺羿睨堄霓慧惠蕙橞蟪繐熭嘒暳噦桂罣趹\
祭際穄傺歲𦄑脆蕝彗轊蔧世貰勢掣懘制製晣䱥淛誓噬筮逝澨稅說裞帨䬽涚毳竁橇贅惙汭芮枘蜹(蚋)餲瘞鷧憩揭猘罽𦇧瀱偈衛讏躗劌橛蹶鱖滯彘墆例厲礪禲勵犡蠣糲綴餟曳拽袣裔詍㵝枻㵩洩睿銳蓺藝𣡊囈蔽鷩潎敝幣斃弊獙袂\
貝䰽茇梖狽娧蛻駾兌酹霈沛旆眛沬昧𩎟(韎)最會繪璯𧬨翽噦濊儈會襘膾獪廥澮旝檜薈懀𩆁外\
隊䨴薱憝錞逮瑇對碓敦退纇攂耒內背褙輩配妃佩琲背悖焙邶妹痗黴瑁𥞊(秣)碎誶倅淬焠啐晬綷潰嬇䜋繢䔇誨悔晦靧塊憒磑\
廢祓櫠肺吠茷乂刈鴱薉穢饖濊喙\
3Z \
魚漁於箊淤虛驉歔噓㠊墟袪阹胠魼祛居据椐裾琚車腒渠𪆂蕖蘧籧鐻璩磲醵胥湑糈䱬蝑疽蛆雎狙趄沮岨麆苴且罝徐蔬梳䟽(疏)綀書舒紓瑹初菹諸藷櫧䃴蠩鋤耡駔蜍如茹洳鴽豬瀦攄摴樗㻬除儲躇滁篨蒢臚閭廬櫚𤁵驢袽帤余予歟譽妤悇輿旟餘畬藇璵狳䳜雓鱮芧𡁎\
虞禺愚娛澞嵎隅𧍪鰅喁于迂盂釪竽雩玗杅汙訏吁盱昫姁冔紆䩒陓䨕穻區嶇驅摳軀鮬拘𣂏眗跔俱駒岣鮈痀絇劬癯躣衢瞿氍鸜枸敷𧀮莩麩稃桴䑧孚俘紨罦郛蚹枹𩿧琈痡膚趺夫鈇玞柎𩬙扶符苻芙𦽏夫泭鳧蚨䵾無毋蕪巫誣𢃀璑鷡廡𥕻須鬚需繻嬃蕦趨諏輸毹㡏萸樞芻朱邾絑珠侏袾硃䑼殊銖殳洙茱雛儒濡襦繻嚅醹鱬孺株誅跦蛛鴸姝貙踰廚躕幮慺婁蔞鏤漊瘻俞逾渝愉覦窬牏瑜貐榆楰臾腴瘐揄歈諛褕騟羭蝓𤚎\
模摹謨膜嫫獏鋪逋晡餔蒲(葡)蒱酺匍蘇㢝酥麤(粗)租徂殂阼都闍㻌稌徒途塗嵞鍍荼圖屠瘏酴駼鵌鷵菟盧罏鑪爐壚顱矑嚧櫨纑瓐瀘艫轤蘆鱸鸕奴孥帑駑砮笯胡蝴乎壺瓠葫瑚餬糊醐弧湖狐猢鶘孤辜姑酤沽觚柧菰呱橭罛鴣蛄枯刳鮬骷呼謼滹嫭吾吳齬鋘㻍梧鼯蜈䮏烏(於)洿(汙污)圬鎢嗚鄔陓窏浮\
4P \
語齬圄圉禦籞敔許滸去𧉧舉莒筥椐巨拒秬柜距虡鉅詎苣炬䣰稰糈醑湑蝑苴疽敘序緒𨣦漵嶼鱮咀沮跙所阻詛俎楚齼礎齟暑鼠黍𧑓癙鬻煮渚杵處墅紓抒汝籹茹貯著䘢楮褚宁佇苧紵杼羜呂吕膂旅侶女與予藇\
噳麌俁傴噢嫗詡𠳲昫欨煦姁栩訏蛡齲踽矩椇枸豞窶羽禹偊雨宇鄅瑀撫柎拊弣甫府俯腑脯黼簠斧蚥莆𩬙父輔鬴釜腐𥠵武舞侮嫵憮膴廡墲碔甒鵡取聚數籔主炷麈豎裋樹乳醹𪐴拄柱縷褸僂謱嶁漊簍蔞庾斞愈瘉瘐窳楰貐\
姥莽牡普溥浦補譜圃簿部𩍿祖珇組覩(睹)賭堵土吐杜荰肚魯虜鹵櫓艪怒弩砮努孥虎琥滸苦𥯶古詁鼓瞽股賈盬蠱罟牯羖估酤戶怙祜婟扈滬鄠岵簄楛雇隖(塢)鄔溩五伍仵迕午缶否母某畝\
御馭䰻語飫醧棜瘀菸淤去據倨踞鋸鐻据遽醵絮覷狙怚沮䟽(疏)詛俎助麆恕庶處翥署曙薯茹洳著箸除宁慮鑢櫖女豫預譽與轝礜澦蕷鸒\
遇寓禺嫗饇煦昫酗姁呴𤛐屨鞻絇句瞿蒟懼具埧𩜃颶芋雨裕諭(喻)籲覦赴訃仆付傅賦附坿祔跗賻駙鮒蚹柎務婺霧騖鶩娶趣足聚戍輸注註炷鑄䪒蛀疰馵𠰍樹裋澍孺數駐軴𨙔住屢\
暮慕募墓怖鋪布佈步捕哺餔酺素訴愬愫溯塑嗉措厝錯醋作祚阼胙妬(妒)奼斁蠹秅兔吐度渡鍍路輅賂璐露潞簬鷺笯怒護濩頀嫭婟瓠互枑冱涸䨼謼庫袴(絝褲)胯顧雇詁故固錮酤痼汙(污)惡杇誤悟寤晤捂迕忤婦負阜副富\
4Z \
佳街膎鮭鞵(鞋)䙎厓崖涯睚捱牌崖(篺)崽籭簁釵差靫柴祡茅\
皆偕階楷稭湝喈鶛蝔揩𦂄挨諧骸乖懷櫰槐淮齋豺儕排俳埋霾尵\
咍開該賅垓陔峐荄絯豥痎咳孩頦䱺侅哀唉埃㶼皚獃𪒴胎台邰鮐臺儓駘擡苔薹䈚炱能來徠䅘麳萊崍騋鯠鰓䰄顋(腮)毸猜偲哉烖(災)栽裁纔才材財\
5P \
蠏(蟹)解獬澥解矮柺(拐)罫擺罷買嘪鷶灑躧𩌦纚廌豸嬭撮\
駭絯駴豥鍇楷𦂄挨騃\
海醢愷凱塏闓鎧嘅改胲亥閡欸靉僾倍蓓痱采採綵彩寀棌宰載在茝待迨殆駘靆怠紿䈚乃鼐\
太泰汰忲帶大賴賚癩瀨籟柰奈蔡䌨害蓋丐藹馤靄壒𣋞濭噯艾鴱外\
懈廨嶰邂解隘搤嗌派粺稗賣曬攦瘥衩債砦眥眦\
怪蒯蕢簣喟塊壞蘾聵戒誡介价界䯰玠疥衸屆魪芥械薤瀣骱齘欬拜湃憊韛糒肳韎鎩殺瘵祭(蝋)\
夬獪澮快噲駃譮躗餲敗唄邁勱佅寨嘬啐蠆𧀱\
代岱黛袋逮埭曃玳靆貸態戴襶徠睞賚耐鼐褦塞簺賽再載縡菜埰縩在慨愾嘅欬(咳)鎧溉摡槩(概)愛僾薆靉曖璦礙閡\
5Z \
眞禛畛桭甄磌鷆侲振袗稹縝申身娠伸呻紳柛瞋嗔辰晨宸臣神人仁辛新薪莘親津璡秦螓繽賓矉檳濱瀕蠙頻顰𡤉嚬嬪蠙蘋𦇖民份彬玢邠豳貧瑉岷閩旻緡泯珍辴陳塵鄰嶙粼磷潾璘瞵轔麟驎𧲂獜鱗燐紉因姻諲歅禋絪氤緸裀茵陻闉湮駰䃌寅夤螾巾銀珢誾狺垠𪔗\
諄敦肫春純蒓蓴醇錞淳焞鶉脣(唇)䔚漘紃犉撋瞤荀詢恂洵郇峋珣逡踆଍(㕙)皴遵鷷旬巡循馴䋸㵌屯迍窀杶椿輴鶞倫綸掄淪侖棆輪䑳鯩勻畇汮鈞均贇頵蝹筠荺囷菌箘麕\
臻搸榛溱蓁莘姺侁詵甡駪\
文紋玟馼汶鳼聞蚊雯芬雰帉紛棻衯分饙汾枌魵棼賁蕡濆轒羵焚鼖墳幩羒豶頒氛黂馚云云芸耘妘鄖溳澐紜沄員𧥼篔煴氳緼馧蝹輼熏薰纁曛獯醺臐勳(勛)葷焄煇君軍皸羣(群)裠(裙)\
欣炘昕殷慇斤筋勤懃慬芹䖐齗听\
魂餛渾煇𤟤緷昆褌崐琨錕蜫鯤騉鶤溫輼豱緼瘟蕰昏婚惛閽棔涽坤髡奔賁䴅歕噴盆湓門捫𣯩璊樠穈孫猻搎蓀飧村尊罇樽存蹲袸敦墩弴暾燉啍屯沌飩庉豚臀炖燉囤論崙黁\
痕根跟恩吞\
6P \
軫診疹眕鬒黰賑辴袗紾縝畛稹矧哂腎祳蜃忍訒㯸儘盡藎牝臏蠙泯黽笢愍湣慜閔憫敏蠠紖靷緊引縯鈏蚓磒隕殞霣溳愪窘菌箘\
准蠢惷鬊䮞僢盾吮楯輴筍簨隼尹允鈗馻狁\
吻䐇抆刎忞忿魵粉黺憤弅坋鼢惲蘊褞韞緼醞揾\
隱濦磤𨏈䨸櫽謹堇巹槿瑾齓近瘽听\
混渾緷焜棍捆閫壼悃捆綑袞緄輥蓘滾錕鯀穩本畚笨㮥軬懣損忖刌撙噂䔿鱒囤盾沌遯(遁)腯\
很詪懇墾齦\
震賑振侲娠袗鬒愼蜃刃韌㠴仞訒認軔牣儐鬢殯擯信訊卂迅阠汛晉縉搢璡進燼贐藎櫬襯儭齔酳鎮瑱疢趁陣診吝躙(躪)燐藺胤靷𣌾菣印釁僅覲瑾廑墐瘽饉殣憖\
稕諄舜蕣瞬鬊順閏潤峻陖濬浚鵔稄俊懏畯餕晙駿㕙𪕞寯殉徇\
問聞紊絻抆汶忿魵糞拚(拼)瀵僨奮分坋運暈餫緷韗鄆韻鶤訓熏捃皸郡窘醞慍煴緼蕰\
焮靳近隱檼㡥垽\
圂慁溷惛困搵顐諢奔噴歕坌悶巽潠遜寸焌𩯄捘鐏臶頓敦鈍遁褪腯論嫩\
恨艮硍䭡\
6Z \
元原源邍沅嫄㹉騵羱杬榞黿蚖袁爰援媛園垣轅湲猿暄喧諼諠萱壎貆晅咺鴛鵷蜿冤怨眢裷𩌑言攐軒掀鶱鞬犍騝翻旙幡繙番反藩樊蕃轓煩繁緐袢璠礬墦蹯膰燔蠜笲薠蘩樠璊圈\
寒韓邗汗翰犴頇鼾看刊靬干乾肝竿杆(桿)玕榦安鞍豻跚珊姍餐殘單襌殫丹簞癉鄲灘攤嘆嘽幝壇檀彈𤺺癉驙驒鱣闌讕欄蘭襴瀾攔𥽭(糷)難\
桓梡完丸峘洹汍紈綄芄莞萑脘皖歡讙驩貛(獾)寬髋官倌冠觀棺剜岏刓潘𢬵般槃盤般蹣胖媻瘢鞶磐磻蟠瞞漫謾慲顢鬗蹣墁曼䊡饅鏝𩆓鰻酸痠狻𩆑鑽攢欑襸穳耑端褍𥠄鍴𧤗湍煓團剸慱摶漙鷒糰鱄鸞鑾巒欒曫羉圝孌\
刪潸關癏擐彎灣𣡩䘎還環鐶鍰寰闤轘澴鬟𩙽圜姦菅顏豩班斑頒般䰉鳻玢攀眅蠻𪈿鬘\
山疝訕潺虦孱僝斒斕閑𢡿(憪)嫺(嫻)覵癇𩦂鷴掔慳鬜閒艱蕑黰殷鰥綸頑\
先跣千阡芊箋韀(韉)籛濺諓戔前騚邊籩萹編楄鯿蹁褊胼骿軿駢眠顚巓癲𩥄滇天𦧝田佃畋塡(填)闐䡘磌鈿沺年蓮憐零堅肩銒鳽豣鰹菺牽岍汧蚈枅賢弦絃舷礥煙燕咽胭湮姸(妍)硏(研)趼涓蠲鵑䅌睊蜎鞙狷鋗駽弲玄(元)懸蚿淵鼘\
仙鮮鱻𪄷躚秈䉳褼遷韆𣘝䉦煎湔鬋媊涎錢羶(膻)扇煽燀嘽饘旃栴氈鸇單禪嬋蟬然燃邅驙鱣脠鯅梴纏躔廛瀍𧔊連璉謰聯漣鏈槤㜕鰱甄嘕嫣延埏筵綖䘰鋋蜒漹焉焉蔫鄢愆褰騫攓搴乾虔犍騝鍵揵鞭箯篇偏㾫媥扁翩便平㛹楩緜(綿)棉芇緡鸇宣揎詮銓拴痊佺悛駩絟筌縓荃鐫旋還鏇璿璇漩嫙全牷泉穿川專顓鱄甎(磚)篿剸遄篅船壖瓀椽傳攣沿鉛櫞捐鳶緣翾儇蠉嬛娟悁員圓勌卷絭棬權拳𤷄惓顴踡婘犈齤𢑆蜷捲鬈\
7P \
阮沅宛婉睕踠䘼䩩𩎺琬畹苑菀蜿遠咺愃諼晅烜綣裷圈卷幰攇䘆犍揵楗𪗛巘甗寋𠎾(𠐻)匽偃隁堰鄢褗鶠鼴鰋蝘反返䡊飯笲鴘晚挽娩\
旱睅罕厂熯侃衎笴(竿)稈散繖傘饊䰖趲瓚亶𤺺坦但袒誕觛繵蜑嬾(懶)讕\
緩捖澣(浣)綄梡莞盌(碗)捥款窽管琯盥痯逭脘滿懣䬳伴拌算篹纂纘酇穳短裋斷疃縀卵暖餪\
潸㹽䗃撰饌赧戁僩憪撊睆皖綰捾版板蝂鈑阪魬\
產摌㹌嵼汕滻剗鏟丳羼醆琖(盞)棧輚㟞虥限簡𧟉(襉)柬揀眼\
銑洗箲跣毨姺㭠扁匾緶萹辮艑眄典腆靦㥏淟殄餮蜓沴捵顯韅蜆晛繭襺𥀹峴睍犬蜎畎狷羂泫鉉琄鞙駽鋗\
獮鮮燹癬蘚淺翦剪揃戩諓媊鬋籛譾踐俴餞選𦌔雋吮闡幝嘽燀顫饘善嬗膳墠墡鱓蟮鱔舛喘荈膞剸鱄軟碝蝡譔僎褊諞惼楩緬愐勔湎沔辨辯免娩勉冕展襢輾蕆邅輦謰璉轉篆瑑臠孌遣繾演衍縯戭蔩䗺𧍢蠉沇馻兗蹇謇攓搴䙭鍵件嵃𤫣讞卷韏捲\
願愿遠瑗媛楦劵(券)絭綣勸圈怨獻憲建健楗鍵堰𤬝鬳販畈飯萬万曼輓蔓獌\
翰螒駻豻悍汗瀚扞(捍)釬垾閈靬漢暵厈看侃衎旰盰幹𧁀(𦼮)骭榦涆按案岸頇喭犴繖帴散粲璨燦㛑贊讚䰖襸趲瓚酇旦疸觛鴠炭歎(嘆)憚但彈爛斕糷瓓讕難\
換逭喚奐煥渙貫冠觀祼悺痯館瓘爟灌罐盥鏆鸛惋腕婉玩翫半姅絆靽判泮冸沜畔叛伴縵幔䡬漫墁攢筭(算)蒜竄攛爨鑽鍜(鍛)斷碬彖褖段斷縀(緞)亂薍偄\
諫晏䁙騴鷃曣鴈(雁)贗慣(串)丱患宦轘繯槵豢䍺襻眅慢嫚謾訕汕疝鏟棧輚虥綰㝈(孿)篡\
襇間覸繝澗莧幻扮盻(盼)瓣辦袒羼\
霰先蒨茜綪倩篟薦荐洊臶袸殿唸瑱電殿奠甸畋佃鈿淀澱靛闐塡(窴)練鍊湅揀楝萰晛見現韅俔蜆見宴讌醼咽嬿燕硯研趼豣縣眩炫袨衒泫絢眴睊䣺𦊰(罥)鋗徧遍片麫瞑眄衊㴐綻駽\
線箭鬋濺煎餞羡賤選潠縓漩旋鏇縼嫙扇謆煽𧎥戰顫繕禪膳善嬗擅單墠剸釧穿串玔堧饌譔僎撰𦠆纏邅輾碾囀轉傳瑑戀衍延莚涎譴掾緣𢐄蝝絹狷悁彥唁諺甗讞瑗援媛褑院鍰楥眷睠卷韏倦便面偭變卞汴弁抃忭㺹\
7Z \
蕭簫箾櫹彇瀟𩙚蠨𤑳貂雕鵰刁琱彫凋芀𦨣鯛祧庣挑恌朓條迢跳佻髫齠調鞗條苕岧蜩鰷鮡怊聊膋瞭嘹飂僚寮寥遼撩嫽憀料敹廖鐐繚橑簝漻潦熮㙩鷯獠蟟驍梟蟂澆膮嘵憢蹺蹻幺怮𢆷堯嶤(嶢)垚僥藨嬈\
宵消霄颵逍痟綃銷硝翛𤞚揱魈篍幧焦燋蕉膲椒噍𩏶鐎礁蟭醮鷦樵憔譙猋飆(飈)剽標摽杓幖熛蔈篻𣄠贆髟漂嫖僄𪅃飄謤彯螵瓢薸鑣儦瀌穮麃苗描貓燒弨昭招釗韶軺玿饒橈蕘超䫿朝鼂朝潮遙媱傜(徭)繇颻窯鰩銚姚搖謠愮陶鷂褕洮瑤猺筄鮡珧䔄要腰邀䙅喓葽䳩翹荍鴞妖夭囂枵歊獢虈驕憍嬌鷮簥撟矯喬僑嶠橋趫毊轎蕎蟜\
爻肴(餚)姣誵殽筊崤淆交詨教咬膠芁轇郊嘐茭蛟鮫鵁敲磽墝虓哮烋痚䫜窅坳凹聱謷磝包胞苞脬拋泡庖炮咆跑鞄匏刨茅媌罞蝥梢艄捎髾鞘弰旓䘯𡡏宵鮹蛸䜈鈔(抄)訬𦗔罺抓巢轈啁嘲䫸鐃呶譊怓撓猇\
豪毫號嘷(嗥)濠壕蒿薅尻栲高臯(皋)羔膏餻(糕)櫜鼛篙橰䓘鏖敖遨翺(翱)摮慠嗷熬㠂鏊鼇鰲螯驁鷔獒璈褒袍毛髦髳氂旄芼酕騷搔繅臊鱢鰠溞艘颾慅𥰱操糟遭曹嘈褿槽艚漕螬傮刀魛忉舠饕叨慆詜絛韜弢𦩹(䑬)滔𩥅陶燾淘濤䬞掏逃翿鼗𩋃醄䛬(啕)咷萄桃檮綯騊蜪幬勞嘮澇牢簩醪撈蟧癆猱峱\
8P \
篠(筱)䃤謏鳥蔦窵朓窱窕挑掉嬥了繚𧘈瞭憭嫽䑠䩍釕蓼㙩褭裊㜵嫋嬲嬈皛㵿杳窅窈騕葽㝔鷕磽曉膮皎曒璬䘨繳恔僥\
小悄剿勦少沼紹佋袑擾繞遶趙肇晁兆垗旐駣䍮狣鮡絩溔舀夭殀䴠矯撟敿憍譑蹻蟜鱎褾縹醥篻摽𩮳膘鰾眇緲渺淼藐篎秒杪表殍\
巧絞狡攪筊鉸姣佼咬拗䁱齩(咬)飽鮑骲鞄卯泖媌昴茆稍炒訬(吵)爪瑵笊抓獠\
晧翯昊顥皓皥浩灝鎬鄗鰝好考薧拷栲杲縞藳(稿)菒櫜笴槁媼燠襖懊寶葆鴇堡保褓抱蓩媢芼嫂燥埽掃草懆慅早蚤璪澡璅繅繰棗藻皁(皂)梍造倒擣(搗)禱㠀(島)懤討𡘷(套)道稻纛老恅轑橑𧀪(䕩)栳潦澇腦惱瑙\
嘯熽弔釣糶眺覜頫趒調掉銚蓧藋跳嫽璙嘹料鐐廖尿竅叫嘂噭徼窔\
笑肖鞘峭悄哨俏帩醮釂皭僬爝勦噍誚少燒照詔邵劭饒繞召燎療獠鷯燿曜耀鷂要䙅嶠轎勡剽僄漂彯驃票妙裱廟\
效傚斆恔校孝敲磽教覺校較窖珓挍絞靿岰拗袎詏樂豹犦爆儤趵窌炮礮皰鞄鉋(刨)泡貌稍鈔抓笊罩趠踔櫂(棹)橈淖鬧\
号號耗好犒靠誥告郜膏𣝏奧隩燠懊傲奡驁報暴虣䤖帽冒瑁耄眊媢𪃑芼艒噪燥譟懆操造慥糙竈躁漕到倒韜𡘷(套)導翿纛燾盜悼蹈勞嫪潦\
8Z \
歌哥柯牁菏珂軻訶呵阿娿疴(痾)何河荷苛莪𧚄哦娥皒峨鵝俄蛾睋娑挱髿些䓾桫蹉瑳搓磋傞齹醝鹺㽨瘥䴾嵯蒫䰈艖多他拖駝佗䭾(馱)驒狏鮀鼉沱陀迱跎袉酡紽羅蘿籮饠𤄷欏囉邏鑼𧟌𩽰那儺哪臡㔮挪\
戈過鍋緺㗻科窠薖蝌髁倭渦窩和禾吪訛囮波番碆頗坡陂婆鄱皤摩磨麽魔蓑莎𣘡梭莏㛗髿唆趖魦矬痤銼垜𧙤詑㸰堶𩼊騾螺𥡜𨰠挼鞾(靴)𦚢瘸伽茄迦\
9P \
哿舸笴菏𢦪可軻坷荷閜㫊椏婀我硪(峨)騀左嚲哆姼癉拕(拖)爹柁舵砢攞邏娜那𣃽袲橠縒褨娑瑳䰈\
果裹輠蜾顆堁敤火禍夥婐𡜮(㛂)跛駊播簸頗叵麽鎖瑣脞䂳坐朶(朵)𥿰(𦀉)垜(垛)𩊜鬌𧙤埵妥㟎惰嫷墮𥳔䲊裸卵蠃蓏\
箇个個呵呼坷䶗賀餓𪘐些磋蹉左佐作做癉馱大邏那\
過裹貨課髁堁和涴臥(卧)播譒簸嶓破頗磨摩剉莝銼挫侳蓌座坐桗刴(剁)唾蛻惰媠挼懦糯縛\
9Z \
佳涯娃哇洼媧緺騧蝸蛙\
麻蟆葩舥巴蚆豝芭笆鈀疤爬杷琶跁些嗟罝蒫邪斜奢賒車硨遮㸙謶闍佘蛇𦯬沙砂髿紗裟鯊叉杈差靫艖樝䶥皻𥡧渣𣻐髽查槎㢒楂爹吒檛撾侘秅𥥸𡝐茶拏(拿)詉笯摣耶𦽶琊鎁揶䓉椰遐蝦鍜霞赮瑕騢碬䪗蕸煆谺岈呀閕𡤫嘉加家珈袈跏痂瘕枷迦笳葭茄豭犌麚鴉椏丫啞牙齖芽枒衙涯華驊鷨𧑍划譁(嘩)花誇夸荂姱胯瓜抓窊窪汙呱靴\
10P \
馬瑪把笆寫瀉且姐灺捨舍撦者赭社惹若喏灑鮓槎䋏奼野也冶下夏廈閜賈斝假嘏瘕檟椵搲啞婭雅庌踝輠觟鮭髁㡁寡𥦛䈑剮瓦打耍那\
卦挂詿掛罣畫絓\
禡罵𧪨帊(帕)怕霸壩灞靶弝欛耙杷䆉卸瀉蝑借唶謝榭褯躤藉舍厙赦騇柘蔗炙鷓射麝貰嗄詐笮溠乍蜡吒奼詫侘秺夜鵺偌暇下夏罅嚇駕架價假嫁幏稼亞婭啞稏㰳訝迓齖砑庌華摦樺鱯話化跨胯窊䠚搲汊杈衩\
10Z \
庚賡更秔(粳)羹鹒坑砊亨脝行衡珩桁蘅橫黌觥祊騯浜磞泙烹澎彭輣棚膨蟛盲蝱撐瞠棖掁鬡兵平評坪枰苹明盟鳴生甥笙牲狌鼪鎗槍鐺傖京荊驚麖卿擎勍黥檠鯨迎英瑛霙榮嶸瑩禜兄\
耕鏗摼硜牼娙罌罃嚶鸚鶯櫻𧮆莖宏閎紘鈜翃泓訇渹鍧轟琤錚爭箏猙崢鬇丁橙瞪儜薴獰綳怦姘娉伻砰弸甍萌甿氓\
清精晶菁鶄蜻睛旌箐𩛿情晴觪騂并(並)栟名洺聲征正鉦怔鯖成郕城誠盛晟禎貞楨檉偵赬蟶呈程酲裎跉令盈楹嬴㜲瀛贏籝輕鑋𨆪嬰瓔纓攖癭營塋瀠傾瓊煢惸縈滎\
青綪星惺醒篂腥猩竮甹荓𥵪俜瓶軿屏萍箳帡冥暝瞑䫤幎銘溟蓂螟丁釘玎疔仃叮虰聽廳汀綎桯町庭廷亭停渟婷霆莛鼮蜓楟靈零泠伶竛聆鈴玲醽酃齡囹瓴櫺(欞)舲軨苓笭羚鴒翎蛉寧嚀䗿經涇馨蛵形刑硎型鉶陘䣆邢娙熒螢扃坰駉\
蒸烝脀承丞繩憴乘澠塍鱦升昇陞勝稱偁仍礽陾艿冰掤淜砯凭憑馮繒鄫驓橧嶒甑噌徵癥僜澄懲陵淩凌輘㱥綾崚菱鯪庱碐蠅膺應鷹𧕄譍凝興磳兢矜殑\
登燈㲪簦鼟騰滕謄𢟱縢幐藤螣鰧籐棱楞能崩朋鵬堋輣瞢儚蘉僧鬙增曾憎罾矰層曾竲搄縆䱴恒(恆)峘姮薨肱弘(宏)鞃\
11P \
梗哽鯁骾綆埂杏荇礦獷猛艋蜢打炳浜冷丙昺怲蛃邴秉寎皿省眚㾪影璟景璥境儆警㯳永憬暻囧䛭\
耿幸倖悻黽鼆鱦\
靜靖婧阱猙靚省惺渻箵篂請井整逞騁裎悜領嶺袊頸癭郢梬潁穎頃餅鉼併屏\
迥泂炯絅詗褧熲𩚱婞脛涬謦𨆪剄頩竝(並)茗嫇酩溟冥醒頂奵鼎酊珽脡侹頲町鋌挺艇梃娗莛濘䔭\
拯𤸲庱㱡冼\
等肯\
映敬璥曔竟獍鏡更䙬硬行絎橫孟蜢倀偵㡧幀柄怲炳病命㵾慶競儆檠迎詠泳禜醟\
諍迸𠊧(併)\
勁輕敻詗摒併聘娉性姓婧凊倩淨(凈)瀞穽靚請聖正政証盛偵遉鄭令\
徑逕經涇陘剄罄磬𨆪謦脛瑩瀅暝瞑靘矴釘訂飣定顁聽庭定錠奠甯(寧)佞濘\
證烝勝稱秤乘賸剩甸甑䙢凭(凴)瞪淩孕媵興應凝\
隥嶝磴鐙凳墱鄧蹬幐堋懜𡬌蹭贈亘絙\
11Z \
尤疣郵訧休庥咻髹貅鵂烋丘邱蚯惆鳩䡂求裘俅絿仇叴逑毬捄觩頄鼽釚銶球賕艽朹牛懮優憂瀀麀耰怮蚴呦由揄卣遊(游)繇猶猷悠攸滺油櫾槱輶庮鮋蝣蝓鯈峳輈啁譸盩侜鵃抽妯瘳儔躊幬裯紬綢疇稠籌檮畱(留)𨖻(遛)劉憀癅(瘤)鏐旒斿琉裗硫橊(榴)流瀏飅(飀)驑(騮)駵𪕚(䶉)𪅳(鶹)蟉鎏脩修羞滫鱐秋鞦篍楸鶖湫鰍鱃愀揫𩏷啾楢囚泅鮂酋遒蝤收荍犨周賙州洲舟婤喌讎酬詶魗柔揉蹂鶔搜廋蒐鄋叟鎪颼溲搊掫篘謅鄒鄹陬緅菆棷騶媰娵愁不鴀紑浮涪桴芣烰罘蜉謀眸侔牟麰矛鍪蛑蝥\
侯猴鍭喉餱篌謳嘔歐漚區甌鷗彄摳鏂䁱齁鉤句(勾)枸軥冓溝韝褠篝抔瓿棓踣掊裒涑諏㔌鯫兜偷媮頭投骰婁樓廔塿僂髏慺謱褸鞻摟簍蔞䝏螻\
幽泑髟彪瀌滮樛朻糾鬮虯璆繆\
12P \
有右友栯朽糗九久玖韭臼舅䓘咎懮酉牖羑誘卣槱琇莠缶否婦負阜蝜萯滫醙酒愀首手守帚鯞醜受授綬壽蹂揉溲醙獀鯫肘丑杽紂桺(柳)羀(罶)懰綹瀏𪕚(䶉)𨌡(𨋖)紐忸鈕扭狃杻\
厚后後郈㖃吼犼口叩扣敂釦耉詬訽玽垢苟笱狗枸毆嘔偶耦藕掊剖蔀部培瓿䍌母拇𧿹畝某䳇牡莽姆叟瞍嗾廋擻藪籔趣棷走斗抖陡蚪妵黈鋀缿塿嶁嘍𪍣簍㝅\
黝怮眑岰泑蚴糾赳朻鬮蟉\
宥又右佑祐侑酭痏囿齅(嗅)糗救究疚灸廄舊柩鯦狖鼬褎柚𣜃副覆仆富鍑復秀琇繡鏽(銹)宿僦岫袖就鷲狩守獸首臭咒授綬壽售輮蹂肉瘦䔏簉縐甃媰皺驟僽晝咮畜胄宙籀酎澑(溜)𩅸(霤)𢊺(廇)𩞷(餾)㙧(塯)窌癅(瘤)糅狃\
候堠𨜫(鄇)逅後𨩀鱟缿后厚詬吼蔻寇扣釦冓構遘覯媾姤購句彀雊韝鷇搆漚䩽戊茂楙袤懋瞀姆蓩貿雺漱嗽嗾湊輳鏃腠楱蔟奏走鬭鬥𧱓透豆餖脰逗酘竇窬荳讀漏陋鏤嶁耨譳\
幼柚䡂䠗螑謬繆\
12Z \
侵駸浸綅心杺祲梫尋鐔鬵灊潯鄩燖樳鱏深斟鍼(針)箴瑊葴諶忱煁湛壬任妊紝鵀森參槮葠襂棽滲摻嵾參簪岑涔梣𨁊碪砧椹琛賝郴沈霃莐𤘣魫林箖臨琳霖淋痳淫霪蟫愔窨音陰霒瘖喑吟崟歆廞欽衾嶔今金衿襟禁琴擒庈黔芩檎禽\
13P \
寢浸鋟梫㾛罧蕈審諗瞫淰魫沈腍覃嬸瀋枕甚葚訦飪稔恁衽荏棯㾕𠘆稟品踸朕黱螣黮廩懍凜錦噤唫䫴凚飲怎\
沁浸祲䐶枕甚侺姙(妊)任衽紝鵀恁滲槮讖譖揕鴆臨菻賃禁僸㯲𦧈噤凚紟妗蔭廕䤃窨喑飲深𢊖搇吟鐔蕈森\
13Z \
覃譚潭橝蟫𧽼鐔𩡝醰曇壜藫貪探耽酖妉湛眈婪嵐南男楠諵毿鬖犙參驂簪鐕撍蠶㟏𩈣馠唅蜬龕堪戡弇淦含函顄頷涵䤴䈄蜬諳䳺媕韽馣盦庵菴啽\
談郯惔倓痰餤錟舑聃儋擔甔藍籃襤三慙(慚)鏨蚶憨坩甘𤯌泔柑疳姏苷酣邯甝魽笘蚺\
鹽檐𣡞䦲閻阽讇棪厭饜銛纖綅孅襳摻暹𩆷殲瀸籤簽僉憸鋟尖漸熸蔪爓潛灊鬵燂燖苫痁襜幨詹瞻占沾蟾薝𪆻噡棎撏髯𧦦袡柟霑覘廉帘匳(奩)䭑鐮蠊簾黏䬯炎淹閹崦䅖𪙊噞嶮箝拑靲鉗鈐鍼黔黚羬砭\
沾添舚𩬑甜餂恬湉鬑磏鮎拈馦謙兼縑鶼𥻧蒹𦋰鰜嫌\
咸諴鹹函輱鰔𧍧葴瑊椷緘黬嵒碞攕摲讒儳纔饞䪌毚獑詀喃\
銜監㔋礛嵌巖礹衫縿彡髟杉芟欃攙巉嶃鑱劖㺥\
嚴䉷𩏩杴薟忺欦厱嵁醃腌\
凡帆颿䒦\
14P \
感䃭灨鳡坎惂輡轗欿㙳䫲頷顄撼菡蜭晻黭黤唵闇馣糝槮慘憯噆黲寁歜䰼黕眈衴紞襑䏙𥁺嗿禫髧䊤醰嘾窞黮霮萏壈𨎹湳罱\
敢橄喊澉槧鏨嵌膽䃫黵𤲭菼緂毯裧啖澹淡憺覽攬欖灠\
𨁹琰(𤆌)剡燄扊棪黶靨魘擪𥜒檿厭䤘塹憸漸𥕌蔪閃㴸睒覢陝颭冉姌染苒𥬕柟諂斂䌞瀲蘞險嶮譣玁獫𣕎顩隒䭑檢撿臉儉芡奄弇掩揜罨裺閹媕晻渰崦馣貶疺\
忝餂銛點玷簟扂稴溓淰鼸嗛歉慊\
儼曮嬐广噞䲓埯\
豏㺌槏減鹻𦺘黯摻摲斬瀺巉嶄湛\
檻艦轞𨏊㯺闞㺖黤\
范𧍙笵範犯錽\
勘轗憾琀唅䫲𩞿紺黚淦贛暗闇喑謲參馾鴆僋撢探醰\
闞瞰嵌憨三暫鏨蹔擔甔憺啗淡澹賧睒濫懢𨣨纜爁\
豔焰焱鹽灩厭饜嬮𢜰俺壍(塹)槧𡄑漸閃熌掞襜韂䠨占贍髯覘\
㮇(栝)舚忝店坫點痁墊唸玷磹稴念𦁤酓䃸僭䁮\
驗釅噞𪙊窆砭斂殮瀲𣟺𤒦脅欠劒(劍)\
陷臽錎䱤餡韽蘸站賺\
㽉㯺譀鑑(鑒)監㔋懺摲鑱\
梵帆泛汎氾䀀\
14Z \
屋剭𪑱熇𧹲哭㲉穀𣨍榖轂䐨谷𤞞縠斛觳礐槲瀫卜濮轐𡡐樸蹼纀䪁撲扑墣醭穙朴僕暴曝瀑䗱匐木沐霂毣楘鶩蚞速遬餗殐涑蔌樕𧐒觫簌蔟簇瘯䃚鏃嗾族秃䛢𢬳鵚牘讀讟黷嬻犢殰髑匵櫝瀆瓄𨽍獨䮷祿彔漉盝琭碌簏簶䍡麓𥉶娽摝角鱳樚轆鹿騼螰福腹複幅輻復蝠𥳇鍑鶝輹楅覆葍蝮蕧副伏虙服復絥袱茯𨌥𨋩箙栿棴洑菔馥鵩鰒目睦繆牧坶苜穆肅夙宿潚䑿㩋橚蓿䃤鷫䎘驌鱐蹙顣蹴踧噈䙘菽叔翛倏儵鮛俶琡祝喌粥柷孰熟塾淑肉衄縮莤謖蹜珿矗竹竺筑築茿蓄畜滀搐逐妯柚軸舳蓫鱁蚰六陸稑𦸐蓼䡜勠戮𩣱鯥𧌉肭恧育毓昱煜錥鬻䋭棛蜟淯堉畜慉麴匊掬踘鞠䗇鞫𩛺菊㽤鵴䱡彧稶郁澳燠噢薁䳑栯國\
沃鋈鵠翯礐熇𦞦澩歊嗃酷焅硞嚳吿牿梏郜襮犦鏷轐雹鞄洬裻篤督毒𦺇纛碡北\
燭屬囑矚䌵蠾束㑛觸歜臅蜀蠋屬韣鐲㯮贖辱蓐褥縟溽鄏粟㔄促趣數足哫續藚俗幞瘃斸欘孎豖梀亍躅錄籙逯綠淥醁騄菉欲慾浴鋊𤞞鵒旭勗頊曲䒼跫蛐臼挶輂局跼駶侷玉獄\
15R \
覺角捔桷榷較傕玨瑴嗀謞滈嗃㱿(殼)㲉搉慤確礐埆學鷽翯澩嶨确渥媉偓喔齷握幄嶽樂鸑剝駮駁爆𪇰璞樸㩧颮𥐚雹謈懪鰒暴邈貌眊毣藐朔數槊搠揱㮶娖齪擉捉浞灂汋鷟篧斲琢椓㧻卓倬逴諑啄涿濁躅濯擢㪬鐲鸀鸐𩆸搦犖䃕躒\
藥躍䠯礿瀹爚龠籥鑰𢅹蘥濼鸙𧕋䖃縛削揱碏踖皵鵲猎䱜爵雀皭嚼爝鑠爍灼焯勺酌妁彴禚斫犳趵斮綽婥杓仢汋弱嫋鄀蒻若箬渃芍著逴躇婼㚟蠚略掠𧎾謔卻腳屩噱醵蹻臄約葯箹虐瘧籰貜䢲䂄彏戄𧮞躩𢖦矍攫钁𨏹玃𪈴雘彠嬳逽\
鐸度𢜬剫踱喥凙託橐柝拓托跅魄蘀籜馲飥洛酪落絡𩊚珞硌樂挌烙轢駱𪇱鮥雒𠗂諾博簙髆餺襮䙏搏薄鎛鑮爆猼欂膊粕𦢸泊薄簿箔礴鉑亳莫幕漠塻瞙膜摸瘼寞鏌索𢱢𩘝𧛻錯剒作柞昨酢鑿筰䋏怍㸲岝鶴貉涸皬𦞦鰝鄗郝壑嗃謞熇矐恪各閣格惡堊咢噩齶諤顎遌鄂崿𥔲萼㓵鍔鶚鱷穫鑊濩𩟓檴擭䨥𤐰霍藿攉癨廓鞟𠠎擴㗥郭椁(槨)彍蠖鸌艧陌\
16R \
質鑕劕晊桎櫍礩眰郅騭蛭躓失室叱實日衵馹率帥蟀𧜠悉膝蟋𧜝七㯃漆堲㘍蝍唧疾嫉槉蒺𧪠必畢罼饆觱㓖滭珌彃韠蹕覕篳鮅縪蓽匹鵯邲怭佖泌飶苾鉍駜蜜宓謐筆弼佛密沕滵蔤樒窒庢挃銍螲抶咥秩紩帙柣姪(侄)翐栗慄瑮搮溧凓𩘟篥鷅暱昵㥾尼逸詄佚佾軼泆溢鎰䭿妷欯㣟恄咭詰趌劼蛣吉拮郆洁狤一壹肸姞佶鮚乙鳦䫻㧒汩耋垤獝\
術述沭秫出䘏恤賉𧧓戌珬𧊥卒啐崒踤捽誶㤕窋茁逫罬黜詘䟣怵朮律繂嵂膟率壘聿遹𧽻矞霱燏潏繘鴪鷸𧑐驈鱊橘𦺖\
櫛𥣮瀄瑟璱蝨\
陌袹貊貘驀拍魄霸珀百伯迫柏㼣佰白帛舶鮊磔搩坼拆㿭宅澤擇檡蠌蹃搦垎𨍇赫嚇𢅰客喀格假挌骼觡茖鵅蛒啞額頟詻峉謋砉湱剨虢㶁𧭣擭彠嚄濩碧索迮窄岝笮蚱舴唶虩隙卻綌戟𦻝劇𧮭屐逆\
麥霢脈覛薜檗擘疈繴䌟梀摵愬涑策筴𠕋(冊)𣑭(柵)矠責嘖幘簀賾鰿𢷾槭摘謫覈滆翮核隔𥴩膈革鬲槅嗝厄阨𩚚搤扼軛䝈嗌虉鳽䩹畫劃嫿繣澅獲馘漍幗摑嘓蟈劐𥕏\
昔腊焟惜舄磶蕮猎潟皵刺磧踖積襀膌脊蹐嵴迹(跡)鶺𧐐鯽席蓆夕穸汐籍耤藉瘠塉釋適奭襫螫尺赤斥隻摭蹠跖炙石祏碩鼫射擲躑益嗌睪繹𥜃䘸醳掖腋亦奕弈帟懌斁射譯驛嶧埸圛燡液易蜴役疫辟躄襞璧僻癖澼擗辟闢\
錫裼緆唽皙晰析淅蜥戚鏚慼鼜磩績勣寂壁霹劈甓覓𪒄羃(冪)幎鼏幦汨的弔適嫡蹢靮玓甋鏑滴樀菂啇逖逷趯踢倜惕剔𩮜狄敵踧迪頔覿糴滌笛籊荻翟妯歴(歷)㻺靂癧嚦躒𡫯礫瓅皪鬲轢櫪䍥瀝濼𠘟藶櫟惄溺檄薂覡䦧赥喫激擊轚獥鸄噭譤鷁霓艗虉闃狊鼳鶪湨郹殈瞁\
職織膱樴𧄕蟙識飾式軾拭𥿮栻寔湜殖埴植食蝕側仄昃稄㳁色嗇穡濇測惻畟崱息熄鄎即唧稷鯽陟稙敕飭鷘直犆𢃜値(值)力屴匿㥾弋杙翼翊翌廙㚤釴潩黓蛡瀷殛亟㥛襋棘蕀僰赩衋億憶臆繶抑醷薏檍𩍖極嶷薿觺域𦱂淢罭棫蜮𪂉緎閾魊洫侐堛畐稫副愊逼楅幅湢愎𥻅\
德得忒慝特螣勒肋扐仂泐玏北菔匐踣墨默纆䘃艒塞墄則賊鱡蠈𦽒劾黑克剋刻勊或惑國冒\
緝葺咠諿輯霵靸卌鈒㗱潗湒𥠋檝(楫)習謵襲褶漝霫隰𪄶騽鰼𥱵集濕𥌁執汁十什拾入廿澀戢濈𧤏縶蟄立粒鉝笠苙孴㵫籋揖挹熠煜吸𧬈歙翕㩉闟潝嬆噏泣湆急伋給級汲芨跲及笈邑浥悒裛㛕唈厭岌圾\
17R \
勿物岉沕芴拂刜髴𢂀祓艴𧿳茀𩂕弗不韍黻紱綍紼𢘀柫冹𩖼沸佛咈怫岪坲炥屈詘鶌𧌑𤟎𧿺𦁐屈厥𠜾𧱝倔掘䘿㭾崛鬱菀蔚尉熨爩黦灪罻\
迄肸釳汔乞䒗契訖吃扢疙仡圪屹忔\
月刖軏越鉞曰粵䋐樾𧑅泧䬂狘㞽闕厥𥕲瘚劂橛蹶蕨蟨蟩鱖𧤼撅掘蹷䞷䙠噦𡡕钀紇歇蠍猲訐揭鍻羯䔾竭碣楬謁暍髮發颰伐茷罰垡墢閥瞂筏韤(襪)\
沒歿孛侼勃誖悖浡渤𡋯㶿馞餑桲脖鵓𩣡窣猝卒卒倅稡捽崒咄柮㤕𩢎突凸腯葖揬堗𦩤鼵𧛗硉訥吶麧齕扢搰抇鶻核忽惚昒笏窟崫矻堀骨汩愲榾䱻兀扤杌矹屼軏阢卼\
曷褐毼鞨鶡蝎喝渴𤸎磕䳚葛割㵧蓋轕遏閼堨頞嶭蘖(櫱)躠薩摋攃䌨怛妲䵣笪靼狚闥撻達澾獺䲚達剌辢攋瘌𩘊捺\
末𠇱袜韎沫抹秣活豁濊闊括聒銛佸适栝筈葀鴰斡捾撥襏鉢(缽)墢鏺潑鱍跋胈犮魃軷馛坺鈸茇妭撮襊繓掇剟裰脫奪鮵捋脟\
黠䕸劼刮鬝戛楔嘎秸鴶軋揠䝟窫𩾐圠滑磆猾鶻䱻螖婠穵八朳捌汃叭拔殺鎩榝察札紮𣦷𩿤蚻扎茁窡鵽貀𠹗噠\
舝轄瞎𥴭齾刮帓帕刹哳\
屑糏僁㴽切竊節癤楶蝍䲙截鐵餮驖耋絰凸跌迭咥蛭垤軼捩涅捏篞苶纈襭擷頁絜頡𤢺猰挈契鍥結桔袺拮潔蛣噎咽曀𤝱搤齧(嚙)䘽闑臬隉臲蜺(霓)穴鴪血泬闋玦觼觖潏決訣譎憰趹駃鴂鴃抉妜撇𠟈瞥彆蹩批馝蔑懱衊覕幭篾𪇴鱴蠛\
薛紲絏褻暬媟契卨渫(泄)洩齛𨇨楔雪蕝絕設蔎揲掣痸浙晣折舌折碟𤍠(熱)說歠啜拙炪梲蝃爇刷唰哲徹撤硩䚢轍澈列烈咧洌冽裂挒鴷鮤蛚茢栵叕(綴)輟罬餟惙畷醊涰劣鋝埒浖蛶拽曳孑𨥂悅說閱蛻烕缺蒛朅愒偈揭傑杰桀榤碣孽𧕏(蠥)讞糵蘖䡾甈鼈(鱉)鷩䳤潎滅䇷別莂別\
葉偞楪鍱魘厭靨擫曄(煜)饁极笈衱裛妾鯜䌌淁接椄楫睫婕菨疌捷誱崨攝欇懾葉韘歃霎箑萐翣謵喢讋慴襵摺涉拾欇讘囁輒㡇䐑鬣獵犣儠擸躐邋𤁯𩧆𧭞聶㸎籋鑷躡䯀\
帖怗貼鉆䑜喋跕牒諜疊氎堞褋𥷕𠗨蝶䴑鰈艓蹀捻錜敜埝惗協叶勰挾俠裌頰筴鋏莢蛺篋愜㛍岌慊燮屧躞浹\
18R \
合郃盒欱閤合匌㪉頜韐鴿蛤鮯姶媕唈趿靸鈒㚫馺颯卅啑帀(匝)𠯗(咂)𡄋(噆)魳䞙雜雥䕹答搭褡嗒錔𢃕鞜䵬䜚嚃漯鞳沓誻㧺踏遝涾𩣯㭼拉納衲䪏妠軜蒳匼\
盍磕闔蓋嗑𧪞榼搕㕎瞌𨍰溘䫦鎑蓋閘鰪㔩礏囃搨𠞈𠹥榻傝塌遢毾𩥑蹋溻䑜闒塔蹋䈳𡓲臘蠟鑞爉邋擸\
業鄴𢢜嶪驜鸈脅胠嗋愶㩉怯抾劫刦抾衱袷𧉧跲㭘笈腌浥裛\
洽祫峽狹硤蛺恰帢掐夾郟裌筴鵊歃臿鍤插眨𩃹䛽萐濈䮢牐鰈劄\
狎匣䛅柙甲胛押閘壓鴨擪呷翣𧚨唼箑霎霅𤁳喋\
乏法(灋)𦑣䎎\
19R \
";
exports.rimeNames = ["東冬鐘通用","上聲蕫腫　去聲送宋用通用","江陽唐通用","上聲講養蕩　去聲絳漾宕通用","支脂之微齊灰通用","上聲紙旨止尾薺賄　去聲寘至志未霽祭太半隊廢通用","魚虞模通用","上聲語噳姥 去聲禦遇暮通用","佳半皆咍通用","上聲蠏駭海 去聲太半卦半怪夬代通用","眞諄臻文欣魂痕通用","上聲軫准吻隱混狠 去聲震稕問焮圂恨通用","元寒桓刪山先仙通用","上聲阮旱緩潸產銑獮　去聲願翰換諫襉霰線通用","蕭宵爻豪通用","上聲篠小巧晧　去聲嘯笑效号通用","歌戈通用","上聲哿果　去聲箇過通用","佳半麻通用","上聲馬　去聲卦半禡通用","庚耕清青蒸登通用","上聲梗耿靜迥拯等　去聲映諍勁徑證隥通用","尤侯幽通用","上聲有厚黝　去聲宥候幼通用","侵獨用","上聲寢　去聲沁通用","覃談鹽沾咸銜嚴凡通用","上聲感敢𨁹忝儼豏檻范 去聲勘闞豔栝驗陷㽉梵通用","屋沃燭通用","覺藥鐸通用","質術櫛陌麥昔錫職德緝通用","勿迄月沒曷末黠舝屑薛葉帖通用","合盍業洽狎乏通用"]

},{}],4:[function(require,module,exports){//var d = require('jsdom').jsdom('')
var d = document
	, oop = require('./oop_utils')
	, Class = oop.Class
	, merge = oop.merge
	,


	Widget = Class.$ext({
		init: function (el, opt) {
			merge(this, opt);
			this.elem = el;
			this.watchers = this.watchers || [];
		},
		//Main event listeners
		addWatcher: function (cb) {
			this.watchers.indexOf(cb) < 0 && this.watchers.push(cb);
			return this;
		},
		//Notify main event listeners
		notify: function () {
			for (var i = this.watchers.length; i--;) {this.watchers[i].apply(this, arguments);}
		}
	}),

	Tab = Widget.$ext({
		init: function (el, opt) {
			Tab.$ctor(this, el, opt);
			var me = merge(this, {
				tabs: [].map.call(el.querySelector('.tabs').children, function (tab, idx) {
					tab.onclick = function () { me.select(idx); };
					return tab;
				}),
				panes: [].map.call(el.querySelector('.tabContent').children, function (pane) {
					return pane;
				})
			});
			me.select(me.open || (me.open = 0));
		},
		select: function (idx) {
			for (var i = this.tabs.length; i--;) {
				this.panes[i].classList[i !== idx ? 'add' : 'remove']('hidden');
				this.tabs[i].classList[i === idx ? 'add' : 'remove']('selected');
			}
			this.open = idx;
			this.notify(this, idx);
			return this;
		}
	}),

	Splitter = Widget.$ext({
		init: function (el, opt) {
			if (el.childElementCount !== 2)throw "Invalid splitter!";
			var me = this
				, bar = d.createElement('div')
				, btn = bar.cloneNode()
				;
			bar.appendChild(btn);
			bar.className = 'splitterBar';
			btn.className = "splitterToggle";

			Splitter.$ctor(me, el, merge(me, opt || {collapseToLeft: true}, {
				left: el.firstElementChild,
				right: el.lastElementChild,
				bar: bar,
				button: btn
			}));
			el.insertBefore(bar, me.right);
			console.log(me.left.offsetWidth);
			me.defaultPos = me.pos = me.pos || me.left.offsetWidth;
			me.toToggle = me.collapseToLeft ? me.left : me.right;

			//drag event
			bar.onmousedown = function (e) {
				me.oldX = e.clientX;
				//console.log(e.clientX);
				if (!me.collapsed)me.dragId = setInterval(function () {
					if (Math.abs(me.pos - me.oldX) > 2) {me.reposition();}
				}, 10);
				el.classList.add("unselectable");
			};
			el.onmousemove = function (e) {
				if (me.dragId !== undefined) { me.pos = e.clientX; }
			};
			el.onmouseup = function () {
				if (me.dragId !== undefined) {
					clearInterval(me.dragId);
					//console.log('mouse up!');
					delete me.dragId;
					me.oldX = me.pos;
				}
				me.elem.classList.remove("unselectable");
			};

			//toggle event
			bar.ondblclick = btn.onclick = function (e) { me.toggle(); };
			me.updateCursor();
			me.reposition();
			window.onresize = function () {me.reposition()};
		},
		updateCursor: function () {
			this.button.style.cursor = (this.collapseToLeft ^ this.collapsed ? 'w' : 'e') + '-resize';
			this.bar.style.cursor = this.collapsed ? (this.button.style.cursor) : 'col-resize';
		},
		reposition: function () {
			var me = this, cW = me.elem.clientWidth, bW = me.bar.offsetWidth;
			me.left.style.width = me.bar.style.left = me.pos + 'px';
			me.right.style.left = me.left.offsetWidth + bW + 'px';
			me.right.style.width = (cW - me.left.offsetWidth - bW) + 'px';
			me.oldX = me.pos;
		},
		toggle: function () {
			var me = this;
			me.toToggle.classList[(me.collapsed = !me.collapsed) ? "add" : "remove"]("hidden");
			if (me.collapsed) {
				me.savedX = me.pos;
				me.bar.classList.add('collapsed');
				me.pos = me.collapseToLeft ? 0 : me.elem.clientWidth - me.bar.offsetWidth;
			} else {
				me.pos = me.savedX || me.defaultPos;
				me.bar.classList.remove('collapsed');
			}
			me.reposition();
			me.updateCursor();
		}

	}),

	InputWatcher = Widget.$ext({
		init: function (el, opt) {
			InputWatcher.$ctor(this, el, opt);
			var me = this;
			me.lastVal = me.getVal();
			el.onfocus = function () { me.watchId = setInterval(function () { me.update() }, 50); };
			el.onblur = function () {
				clearInterval(me.watchId);
				me.update();
			};
		},
		getVal: function(){return this.elem.value.trim();},
		update: function () {
			var me = this, v = me.getVal();
			if (v !== me.lastVal) {
				me.lastVal = v;
				me.notify(v);
			}
		}

	}),

	defaultItemRenderer = function (item) {
		return d.createTextNode(item[0])
	},
	List = Widget.$ext({
		init: function (el, arr, renderer) {
			renderer || (renderer = defaultItemRenderer);
			var frag = d.createDocumentFragment()
				, me = merge(this, {
					data: arr,
					ref: arr.map(function (it, idx) {
						var p = d.createElement('p');
						p.appendChild(renderer(it, arr, idx));
						frag.appendChild(p);
						it.push(p);
						return p;
					})
				});
			List.$ctor(this, el);
			el.appendChild(frag);
			el.onclick = function (e) {
				var t = e.target, idx = me.ref.indexOf(t);
				if (t.tagName === 'P' && idx >= 0)me.notify(t, me.data[idx], idx);
			}
		},
		filter: function (items) {
			if (items) {
				for (var i = 0, it; it = items[i++];) {it[it.length - 1].dataset.show = 'T';}
				for (i = 0; it = this.ref[i++];) {
					it.style.display = !it.dataset.show ? 'none' : 'block';
					delete it.dataset.show;
				}
			} else { // if the argument is omitted or am empty str, shows all
				for (i = 0; it = this.ref[i++];) {it.style.display = 'block';}
			}
		},
		select: function (id, noState) {
			var el = this.ref[id];
			el.classList.remove('hidden');
			el.scrollIntoView(true);
			this.notify(el, this.data[id], id, noState);
		}
	}),

	KeyList = List.$ext({
		init: function (el, arr, renderer, nFilter, aFilter, oFilter) {
			this.nFilter = nFilter;
			this.aFilter = aFilter;
			this.oFilter = oFilter;
			KeyList.$ctor(this, el, arr, renderer);
		},
		filter: function (k) {
			this.lastKey = k = k || '';
			var items = ((k = k.toUpperCase()).match(/^[A-Z]+/) && this.aFilter || this.nFilter)
				.filter(k);
			if (this.oFilter)items = items.filter(this.oFilter);
			KeyList.$.filter.call(this, items);
		}
	}),

//js object to html elements builder {Tag:{_:[content...],attr1:val1,..}}
	j2h = function (o) {
		var r, t, v;
		if (o.nodeType) {
			r = o;
		} else if (typeof o === 'string') {
			r = d.createTextNode(o);
		} else if (Array.isArray(o)) {
			r = d.createDocumentFragment();
			for (var i = 0, cld; cld = o[i++];) {r.appendChild(j2h(cld))}
		} else {
			t = Object.keys(o)[0];
			r = d.createElement(t);
			if ((v = o[t]) && (v.nodeType || typeof v === 'string' || Array.isArray(v))) {r.appendChild(j2h(v));}
			else if (v) {
				Object.keys(v).forEach(function (k) {
					(k === '_') && r.appendChild(j2h(v[k])) ||
					r.setAttribute(k === 'klass' ? 'class' : k, v[k]);
				});
			}
		}
		return r;
	}
	;


module.exports = {
	Widget: Widget,
	Tab: Tab,
	Splitter: Splitter,
	InputWatcher: InputWatcher,
	List: List,
	KeyList: KeyList,
	j2h: j2h
//	,document:d
};
},{"./oop_utils":2}]},{},[1]);