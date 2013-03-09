var oop = require('./oop_utils')
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