var oop = require('./oop_utils')
	,Class = oop.Class
	, Ind = require('./init_indices')
	, aAcronyms = Ind.aAcronyms
	, tAcronyms = Ind.tAcronyms
	, authors = Ind.authors
	, titles = Ind.titles
	, cat = Ind.cat
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
		if(!kw)return this.tbl;
		var res = [], i, j, ent;
		AcronymFilter.$.filter.call(this,kw);
		for (i = 0; ent = this.cache[i++];) {
			for (j = ent.length; --j;) {
				res.unshift(this.refTbl[ent[j]]);
			}
		}
		return res;
	}
});

var catFilters = {};
Object.keys(cat).forEach(function(k){
	catFilters[k] = {
		nFilter:new NameFilter(cat[k].list),
		aFilter:new AcronymFilter(cat[k].acronyms, cat[k].list)
	}
});

module.exports = {
	NameFilter: NameFilter,
	AcronymFilter: AcronymFilter,
	aFilter: new NameFilter(authors),
	tFilter: new NameFilter(titles),
	aAFilter: new AcronymFilter(aAcronyms,authors),
	tAFilter: new AcronymFilter(tAcronyms,titles),
	cat:catFilters
};


oop.merge(module.exports,Ind);