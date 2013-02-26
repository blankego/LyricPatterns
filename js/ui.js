var oop = require('./oop_utils')
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