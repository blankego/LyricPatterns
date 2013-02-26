function merge(r){
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