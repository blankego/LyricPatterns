;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){var oop = require('./oop_utils')
	, Class = oop.Class
	, merge = oop.merge
	;
var Tab = Class.$ext({
	init: function (el) {
		//el.querySelectorAll('.tabNav>span').for
	}
});

var Splitter = Class.$ext({
	init: function (el, opt) {
		var me = this, width = el.clientWidth,
			bar = document.createElement('div');
		if (el.childElementCount !== 2)throw "Invalid splitter!";
		me.toggleBtn = document.createElement('div');
		me.toggleBtn.className = 'splitterToggle';
		bar.appendChild(me.toggleBtn);
		bar.className = 'splitterBar';


		el.insertBefore(bar, el.lastElementChild);
		merge(this, opt || {collapseToLeft: true}, {
			container: el,
			left: el.firstElementChild,
			right: el.lastElementChild,
			bar: bar
		});
		me.defaultPos =  me.pos = me.pos || me.left.offsetWidth;
		me.toToggle = me.collapseToLeft ? me.left : me.right;

		//drag event
		bar.onmousedown = function (e) {
			me.oldX = e.clientX;
			console.log(e.clientX);
			me.dragId = setInterval(function () {
				if (Math.abs(me.pos - me.oldX) > 3)me.reposition();
			}, 10);
		};
		me.container.onmousemove = function (e) {
			if (me.dragId !== undefined)    me.pos = e.clientX;
		};
		me.container.onmouseup = function () {
			if (me.dragId !== undefined) {
				clearInterval(me.dragId);
				console.log('mouse up!');
				delete me.dragId;
				me.oldX = me.pos;
			}
		};

		//toggle event
		me.bar.ondblclick = me.toggleBtn.onclick = function(){me.toggle()};
		me.reposition();
	},
	reposition: function () {
		var me = this, cW = me.container.clientWidth, bW = me.bar.offsetWidth;
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
			me.pos = me.collapseToLeft ? 0 : me.container.clientWidth - me.bar.offsetWidth;
		} else {
			me.pos = me.savedX || me.defaultPos;
		}
		me.reposition();
	}

});
document.addEventListener("DOMContentLoaded", function () {
	window.sp = new Splitter(document.getElementById('splitter'));
});
},{"./oop_utils":2}],2:[function(require,module,exports){function merge(r){
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
},{}]},{},[1]);