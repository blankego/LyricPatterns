var oop = require('./oop_utils')
	, Class = oop.Class
	, merge = oop.merge
	, mod = require('./model')
	;

var Widget = Class.$ext({
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
});

var Tab = Widget.$ext({
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
	}
});

var Splitter = Widget.$ext({
	init: function (el, opt) {
		if (el.childElementCount !== 2)throw "Invalid splitter!";
		var me = this
			, bar = document.createElement('div')
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

});

var InputWatcher = Widget.$ext({
	init: function (el, opt) {
		InputWatcher.$ctor(this, el, opt);
		var me = merge(this, {
			input: el,
			lastVal: el.value
		});
		el.onfocus = function () { me.watchId = setInterval(function () { me.update() }, 50); };
		el.onblur = function () {
			clearInterval(me.watchId);
			me.update();
			//console.log(el.id + " blurring");
		};
	},
	update: function () {
		var me = this, v = me.input.value.trim();
		if (v !== me.lastVal) {
			me.lastVal = v;
			me.notify(v);
		}
	}

});

function defaultItemRenderer(item) {
	return document.createTextNode(item[0])
}
var List = Widget.$ext({
	init: function (el, arr, renderer) {
		renderer || (renderer = defaultItemRenderer);
		var frag = document.createDocumentFragment()
			, me = merge(this, {
				data: arr,
				ref: arr.map(function (it, idx) {
					var p = document.createElement('p');
					p.appendChild(renderer(it, arr, idx));
					frag.appendChild(p);
					it.push(p);
					return p;
				})
			});
		List.$ctor(this, el);
		el.appendChild(frag);
		el.onclick = function (e) {
			var t = e.target;
			if (t.tagName === 'P')me.notify(t, me.data[me.ref.indexOf(t)]);
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
			for (i = this.ref.length; i--;) {this.ref[i].style.display = 'block';}
		}
	}
});

var KeyList = List.$ext({
	init: function (el, arr, renderer, nFilter, aFilter) {
		this.nFilter = nFilter;
		this.aFilter = aFilter;
		KeyList.$ctor(this, el, arr, renderer);
	},
	filter: function (k) {
		if (k) {
			var filter = (this.aFilter && (k = k.toUpperCase()).match(/^[A-Z]+/)) ?
				this.aFilter : this.nFilter;
			var items = filter.filter(k);
			KeyList.$.filter.call(this, items);
		} else {KeyList.$.filter.call(this)}
	}
});


window.getPage = function getPage(id, cb) {
	var req = new XMLHttpRequest();
	req.open('GET', 'data/a' + id + '.html');
//	req.responseType = 'document';
	req.onreadystatechange = function () {
		if (req.readyState === 4)cb(req.responseText);
	};
	req.send();
};

document.addEventListener("DOMContentLoaded", function () {
	var iframe = document.getElementById('ifrm')
		, pNum = /^\d+/
		, config = window.localStorage || {}
		, cats = {P: '平', Z: '仄', H: '換', X: '協'}
		, content = document.getElementById('contentPane')
		, prolog = document.getElementById('prolog');
	window.splitter = new Splitter(document.getElementById('splitter'));

	//update pattern page
	iframe.onload = function () {
		var iDoc = iframe.contentWindow.document || iframe.contentDocument
			, patternTitle = document.createElement('h2');
		patternTitle.appendChild(document.createTextNode(iDoc.title));
		content.innerHTML = '';
		content.appendChild(patternTitle);
		while (iDoc.body.firstChild) {content.appendChild(iDoc.body.removeChild(iDoc.body.firstChild));}
	};
	var indices = mod.indices
		, titleRenderer = function (it) { //TODO
			var ind = indices[it[1]],
				mNum = ind[1].match(pNum);
			return document.createTextNode(it[0] + "\t" + mNum[0] + cats[ind[1][mNum[0].length]]);

		}
		, toc = new KeyList(document.getElementById('toc'), mod.titles, titleRenderer,
			mod.tFilter, mod.tAFilter
		).addWatcher(function (el, item) {
				prolog.classList.add('hidden');
				iframe.src = 'data/a' + item[1] + '.html';
			})
	//, authors = new List(mod.authors)
	//, categories = {}//TODO:
	//, modes = [toc, categories, authors]
		, lookup = new InputWatcher(document.getElementById('lookup')).addWatcher(function (v) {
			toc.filter(v);
		})
		, tabs = new Tab(document.getElementById('indicesPane')).addWatcher(function (tab, idx) {
			config.lp_tab = idx;

		})

		;
});