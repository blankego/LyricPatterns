//var d = require('jsdom').jsdom('')
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
				if (t.tagName === 'P')me.notify(t, me.data[idx], idx);
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