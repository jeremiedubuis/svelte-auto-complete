
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value' || descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    let libClassName = 'svelte-auto-complete';

    const DIRECTION = {
        BOTTOM: 'BOTTOM',
        LEFT: 'LEFT',
        RIGHT: 'RIGHT',
        TOP: 'TOP'
    };

    const _parentHasClass = (element, classname) => {
        if (element.className && element.className.split && element.className.split(' ').indexOf(classname)>=0) return true;
        return element.parentNode && parentHasClass(element.parentNode, classname);
    };

    const parentHasClass = (element, ...classNames) => {
        for (let i = 0, iLength = classNames.length; i<iLength; i++) {
            if (_parentHasClass(element, classNames[i])) return true;
        }
        return false;
    };

    const targetHasExcludedClass = (target, excludedClasses) => {
        if (!excludedClasses || !excludedClasses.length) return false;
        return parentHasClass(target, ...excludedClasses);
    };


    const onClickFactory = (parent, callback, excludedClasses) => e => {
        if (!parent || !parent.contains(e.target) && !targetHasExcludedClass(e.target, excludedClasses)) {
            if (typeof callback === 'function') {
                callback(e);
            }
        }
    };

    const onClickOutside = (parent, callback, excludedClasses) => {
        const func = onClickFactory(parent, callback, excludedClasses);
        window.addEventListener('click', func);

        return () => window.removeEventListener('click', func);
    };

    const onKeyDown = (key, callback) => {
        const func = (e) => {
            if (e.key === key) callback(e);
        };
        window.addEventListener('keydown', func);

        return () => window.removeEventListener('keydown', func)
    };

    /* src/AutoCompleteOptions.svelte generated by Svelte v3.21.0 */
    const file = "src/AutoCompleteOptions.svelte";

    const get_option_slot_changes = dirty => ({
    	option: dirty & /*filteredOptions*/ 1,
    	text: dirty & /*getOptionText, filteredOptions*/ 3
    });

    const get_option_slot_context = ctx => ({
    	option: /*o*/ ctx[19],
    	text: /*getOptionText*/ ctx[1](/*o*/ ctx[19])
    });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (55:75)                          
    function fallback_block(ctx) {
    	let t_value = /*getOptionText*/ ctx[1](/*o*/ ctx[19]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getOptionText, filteredOptions*/ 3 && t_value !== (t_value = /*getOptionText*/ ctx[1](/*o*/ ctx[19]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(55:75)                          ",
    		ctx
    	});

    	return block;
    }

    // (52:8) {#each filteredOptions as o, i}
    function create_each_block(ctx) {
    	let li;
    	let button;
    	let t;
    	let current;
    	let dispose;
    	const option_slot_template = /*$$slots*/ ctx[16].option;
    	const option_slot = create_slot(option_slot_template, ctx, /*$$scope*/ ctx[15], get_option_slot_context);
    	const option_slot_or_fallback = option_slot || fallback_block(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[17](/*o*/ ctx[19], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			if (option_slot_or_fallback) option_slot_or_fallback.c();
    			t = space();
    			toggle_class(button, "is-focused", /*focused*/ ctx[3] === /*i*/ ctx[21]);
    			add_location(button, file, 53, 16, 1804);
    			add_location(li, file, 52, 12, 1783);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);

    			if (option_slot_or_fallback) {
    				option_slot_or_fallback.m(button, null);
    			}

    			append_dev(li, t);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (option_slot) {
    				if (option_slot.p && dirty & /*$$scope, filteredOptions, getOptionText*/ 32771) {
    					option_slot.p(get_slot_context(option_slot_template, ctx, /*$$scope*/ ctx[15], get_option_slot_context), get_slot_changes(option_slot_template, /*$$scope*/ ctx[15], dirty, get_option_slot_changes));
    				}
    			} else {
    				if (option_slot_or_fallback && option_slot_or_fallback.p && dirty & /*getOptionText, filteredOptions*/ 3) {
    					option_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (dirty & /*focused*/ 8) {
    				toggle_class(button, "is-focused", /*focused*/ ctx[3] === /*i*/ ctx[21]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(option_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(option_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (option_slot_or_fallback) option_slot_or_fallback.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(52:8) {#each filteredOptions as o, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let ul;
    	let div_class_value;
    	let div_style_value;
    	let current;
    	let each_value = /*filteredOptions*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ul, file, 50, 4, 1726);
    			attr_dev(div, "class", div_class_value = "" + (libClassName + "-options"));
    			attr_dev(div, "style", div_style_value = /*getOptionsStyle*/ ctx[4]());
    			add_location(div, file, 49, 0, 1639);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			/*div_binding*/ ctx[18](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*focused, onClick, filteredOptions, getOptionText, $$scope*/ 32811) {
    				each_value = /*filteredOptions*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*getOptionsStyle*/ 16 && div_style_value !== (div_style_value = /*getOptionsStyle*/ ctx[4]())) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			/*div_binding*/ ctx[18](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { direction } = $$props;
    	let { filteredOptions } = $$props;
    	let { getOptionText } = $$props;
    	let { input } = $$props;
    	let { setValue } = $$props;
    	let { getOptionValue } = $$props;
    	let { close } = $$props;
    	let options;
    	let focused = 0;
    	const focus = i => $$invalidate(3, focused = Math.min(Math.max(i, 0), filteredOptions.length - 1));
    	const onArrowUp = () => focus(focused - 1);
    	const onArrowDown = () => focus(focused + 1);
    	const onEnter = () => setValue(getOptionText(filteredOptions[focused]));

    	onMount(() => {
    		if (typeof document !== "undefined") document.body.appendChild(options);
    		const removeListeners = [onClickOutside(options, close, [libClassName])];
    		removeListeners.push(onKeyDown("ArrowUp", onArrowUp));
    		removeListeners.push(onKeyDown("ArrowDown", onArrowDown));
    		removeListeners.push(onKeyDown("Enter", onEnter));
    		return () => removeListeners.forEach(rm => rm());
    	});

    	const onClick = o => {
    		setValue(getOptionText(o));
    		close();
    	};

    	const writable_props = [
    		"direction",
    		"filteredOptions",
    		"getOptionText",
    		"input",
    		"setValue",
    		"getOptionValue",
    		"close"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AutoCompleteOptions> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AutoCompleteOptions", $$slots, ['option']);
    	const click_handler = o => onClick(o);

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, options = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("direction" in $$props) $$invalidate(6, direction = $$props.direction);
    		if ("filteredOptions" in $$props) $$invalidate(0, filteredOptions = $$props.filteredOptions);
    		if ("getOptionText" in $$props) $$invalidate(1, getOptionText = $$props.getOptionText);
    		if ("input" in $$props) $$invalidate(7, input = $$props.input);
    		if ("setValue" in $$props) $$invalidate(8, setValue = $$props.setValue);
    		if ("getOptionValue" in $$props) $$invalidate(9, getOptionValue = $$props.getOptionValue);
    		if ("close" in $$props) $$invalidate(10, close = $$props.close);
    		if ("$$scope" in $$props) $$invalidate(15, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		libClassName,
    		DIRECTION,
    		onClickOutside,
    		onKeyDown,
    		direction,
    		filteredOptions,
    		getOptionText,
    		input,
    		setValue,
    		getOptionValue,
    		close,
    		options,
    		focused,
    		focus,
    		onArrowUp,
    		onArrowDown,
    		onEnter,
    		onClick,
    		getOptionsStyle
    	});

    	$$self.$inject_state = $$props => {
    		if ("direction" in $$props) $$invalidate(6, direction = $$props.direction);
    		if ("filteredOptions" in $$props) $$invalidate(0, filteredOptions = $$props.filteredOptions);
    		if ("getOptionText" in $$props) $$invalidate(1, getOptionText = $$props.getOptionText);
    		if ("input" in $$props) $$invalidate(7, input = $$props.input);
    		if ("setValue" in $$props) $$invalidate(8, setValue = $$props.setValue);
    		if ("getOptionValue" in $$props) $$invalidate(9, getOptionValue = $$props.getOptionValue);
    		if ("close" in $$props) $$invalidate(10, close = $$props.close);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    		if ("focused" in $$props) $$invalidate(3, focused = $$props.focused);
    		if ("getOptionsStyle" in $$props) $$invalidate(4, getOptionsStyle = $$props.getOptionsStyle);
    	};

    	let getOptionsStyle;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*input, direction, options*/ 196) {
    			 $$invalidate(4, getOptionsStyle = () => {
    				const rect = input.getBoundingClientRect();
    				const left = rect.left + (direction[0] === DIRECTION.RIGHT ? rect.width : 0);

    				const top = rect.top + (direction[1] === DIRECTION.TOP
    				? -options.offsetHeight
    				: rect.height);

    				return `position: absolute; left:${left}px; top:${top}px;`;
    			});
    		}
    	};

    	return [
    		filteredOptions,
    		getOptionText,
    		options,
    		focused,
    		getOptionsStyle,
    		onClick,
    		direction,
    		input,
    		setValue,
    		getOptionValue,
    		close,
    		focus,
    		onArrowUp,
    		onArrowDown,
    		onEnter,
    		$$scope,
    		$$slots,
    		click_handler,
    		div_binding
    	];
    }

    class AutoCompleteOptions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			direction: 6,
    			filteredOptions: 0,
    			getOptionText: 1,
    			input: 7,
    			setValue: 8,
    			getOptionValue: 9,
    			close: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoCompleteOptions",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*direction*/ ctx[6] === undefined && !("direction" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'direction'");
    		}

    		if (/*filteredOptions*/ ctx[0] === undefined && !("filteredOptions" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'filteredOptions'");
    		}

    		if (/*getOptionText*/ ctx[1] === undefined && !("getOptionText" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'getOptionText'");
    		}

    		if (/*input*/ ctx[7] === undefined && !("input" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'input'");
    		}

    		if (/*setValue*/ ctx[8] === undefined && !("setValue" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'setValue'");
    		}

    		if (/*getOptionValue*/ ctx[9] === undefined && !("getOptionValue" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'getOptionValue'");
    		}

    		if (/*close*/ ctx[10] === undefined && !("close" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'close'");
    		}
    	}

    	get direction() {
    		throw new Error("<AutoCompleteOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<AutoCompleteOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filteredOptions() {
    		throw new Error("<AutoCompleteOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filteredOptions(value) {
    		throw new Error("<AutoCompleteOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getOptionText() {
    		throw new Error("<AutoCompleteOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getOptionText(value) {
    		throw new Error("<AutoCompleteOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get input() {
    		throw new Error("<AutoCompleteOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set input(value) {
    		throw new Error("<AutoCompleteOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setValue() {
    		throw new Error("<AutoCompleteOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set setValue(value) {
    		throw new Error("<AutoCompleteOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getOptionValue() {
    		throw new Error("<AutoCompleteOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getOptionValue(value) {
    		throw new Error("<AutoCompleteOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		throw new Error("<AutoCompleteOptions>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set close(value) {
    		throw new Error("<AutoCompleteOptions>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/AutoComplete.svelte generated by Svelte v3.21.0 */
    const file$1 = "src/AutoComplete.svelte";
    const get_noResults_slot_changes = dirty => ({ value: dirty & /*value*/ 1 });
    const get_noResults_slot_context = ctx => ({ value: /*value*/ ctx[0] });
    const get_option_slot_changes$1 = dirty => ({});
    const get_option_slot_context$1 = ctx => ({});

    // (68:0) {#if isToggled}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*filteredOptions*/ ctx[1].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(68:0) {#if isToggled}",
    		ctx
    	});

    	return block;
    }

    // (73:4) {:else}
    function create_else_block(ctx) {
    	let current;
    	const noResults_slot_template = /*$$slots*/ ctx[22].noResults;
    	const noResults_slot = create_slot(noResults_slot_template, ctx, /*$$scope*/ ctx[29], get_noResults_slot_context);

    	const block = {
    		c: function create() {
    			if (noResults_slot) noResults_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (noResults_slot) {
    				noResults_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (noResults_slot) {
    				if (noResults_slot.p && dirty & /*$$scope, value*/ 536870913) {
    					noResults_slot.p(get_slot_context(noResults_slot_template, ctx, /*$$scope*/ ctx[29], get_noResults_slot_context), get_slot_changes(noResults_slot_template, /*$$scope*/ ctx[29], dirty, get_noResults_slot_changes));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(noResults_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(noResults_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (noResults_slot) noResults_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(73:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (69:4) {#if filteredOptions.length}
    function create_if_block_1(ctx) {
    	let updating_filteredOptions;
    	let updating_getOptionText;
    	let updating_input;
    	let updating_direction;
    	let current;

    	function autocompleteoptions_filteredOptions_binding(value) {
    		/*autocompleteoptions_filteredOptions_binding*/ ctx[25].call(null, value);
    	}

    	function autocompleteoptions_getOptionText_binding(value) {
    		/*autocompleteoptions_getOptionText_binding*/ ctx[26].call(null, value);
    	}

    	function autocompleteoptions_input_binding(value) {
    		/*autocompleteoptions_input_binding*/ ctx[27].call(null, value);
    	}

    	function autocompleteoptions_direction_binding(value) {
    		/*autocompleteoptions_direction_binding*/ ctx[28].call(null, value);
    	}

    	let autocompleteoptions_props = {
    		setValue: /*setValue*/ ctx[11],
    		getOptionValue: /*getOptionValue*/ ctx[6],
    		close: /*close*/ ctx[8],
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*filteredOptions*/ ctx[1] !== void 0) {
    		autocompleteoptions_props.filteredOptions = /*filteredOptions*/ ctx[1];
    	}

    	if (/*getOptionText*/ ctx[5] !== void 0) {
    		autocompleteoptions_props.getOptionText = /*getOptionText*/ ctx[5];
    	}

    	if (/*input*/ ctx[3] !== void 0) {
    		autocompleteoptions_props.input = /*input*/ ctx[3];
    	}

    	if (/*direction*/ ctx[4] !== void 0) {
    		autocompleteoptions_props.direction = /*direction*/ ctx[4];
    	}

    	const autocompleteoptions = new AutoCompleteOptions({
    			props: autocompleteoptions_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocompleteoptions, "filteredOptions", autocompleteoptions_filteredOptions_binding));
    	binding_callbacks.push(() => bind(autocompleteoptions, "getOptionText", autocompleteoptions_getOptionText_binding));
    	binding_callbacks.push(() => bind(autocompleteoptions, "input", autocompleteoptions_input_binding));
    	binding_callbacks.push(() => bind(autocompleteoptions, "direction", autocompleteoptions_direction_binding));

    	const block = {
    		c: function create() {
    			create_component(autocompleteoptions.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(autocompleteoptions, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const autocompleteoptions_changes = {};
    			if (dirty & /*getOptionValue*/ 64) autocompleteoptions_changes.getOptionValue = /*getOptionValue*/ ctx[6];

    			if (dirty & /*$$scope*/ 536870912) {
    				autocompleteoptions_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_filteredOptions && dirty & /*filteredOptions*/ 2) {
    				updating_filteredOptions = true;
    				autocompleteoptions_changes.filteredOptions = /*filteredOptions*/ ctx[1];
    				add_flush_callback(() => updating_filteredOptions = false);
    			}

    			if (!updating_getOptionText && dirty & /*getOptionText*/ 32) {
    				updating_getOptionText = true;
    				autocompleteoptions_changes.getOptionText = /*getOptionText*/ ctx[5];
    				add_flush_callback(() => updating_getOptionText = false);
    			}

    			if (!updating_input && dirty & /*input*/ 8) {
    				updating_input = true;
    				autocompleteoptions_changes.input = /*input*/ ctx[3];
    				add_flush_callback(() => updating_input = false);
    			}

    			if (!updating_direction && dirty & /*direction*/ 16) {
    				updating_direction = true;
    				autocompleteoptions_changes.direction = /*direction*/ ctx[4];
    				add_flush_callback(() => updating_direction = false);
    			}

    			autocompleteoptions.$set(autocompleteoptions_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autocompleteoptions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autocompleteoptions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(autocompleteoptions, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(69:4) {#if filteredOptions.length}",
    		ctx
    	});

    	return block;
    }

    // (70:4) <AutoCompleteOptions bind:filteredOptions bind:getOptionText bind:input bind:direction setValue={setValue} getOptionValue={getOptionValue} close={close}>
    function create_default_slot(ctx) {
    	let current;
    	const option_slot_template = /*$$slots*/ ctx[22].option;
    	const option_slot = create_slot(option_slot_template, ctx, /*$$scope*/ ctx[29], get_option_slot_context$1);

    	const block = {
    		c: function create() {
    			if (option_slot) option_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (option_slot) {
    				option_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (option_slot) {
    				if (option_slot.p && dirty & /*$$scope*/ 536870912) {
    					option_slot.p(get_slot_context(option_slot_template, ctx, /*$$scope*/ ctx[29], get_option_slot_context$1), get_slot_changes(option_slot_template, /*$$scope*/ ctx[29], dirty, get_option_slot_changes$1));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(option_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(option_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (option_slot) option_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(70:4) <AutoCompleteOptions bind:filteredOptions bind:getOptionText bind:input bind:direction setValue={setValue} getOptionValue={getOptionValue} close={close}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let input_1;
    	let t;
    	let if_block_anchor;
    	let current;
    	let dispose;
    	let input_1_levels = [{ class: libClassName }, { type: "text" }, /*nativeProps*/ ctx[7]];
    	let input_1_data = {};

    	for (let i = 0; i < input_1_levels.length; i += 1) {
    		input_1_data = assign(input_1_data, input_1_levels[i]);
    	}

    	let if_block = /*isToggled*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			input_1 = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			set_attributes(input_1, input_1_data);
    			add_location(input_1, file$1, 58, 0, 1464);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, input_1, anchor);
    			/*input_1_binding*/ ctx[23](input_1);
    			set_input_value(input_1, /*value*/ ctx[0]);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input_1, "focus", /*_onFocus*/ ctx[9], false, false, false),
    				listen_dev(input_1, "input", /*_onInput*/ ctx[12], false, false, false),
    				listen_dev(input_1, "blur", /*_onBlur*/ ctx[10], false, false, false),
    				listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[24])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			set_attributes(input_1, get_spread_update(input_1_levels, [
    				dirty & /*libClassName*/ 0 && { class: libClassName },
    				{ type: "text" },
    				dirty & /*nativeProps*/ 128 && /*nativeProps*/ ctx[7]
    			]));

    			if (dirty & /*value*/ 1 && input_1.value !== /*value*/ ctx[0]) {
    				set_input_value(input_1, /*value*/ ctx[0]);
    			}

    			if (/*isToggled*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isToggled*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input_1);
    			/*input_1_binding*/ ctx[23](null);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { value = "" } = $$props;
    	let filteredOptions = [];
    	let isToggled = false;
    	let input;

    	const close = e => {
    		$$invalidate(2, isToggled = false);
    	};

    	const _onFocus = e => {
    		$$invalidate(2, isToggled = true);
    		if (typeof onFocus === "function") onFocus(e);
    	};

    	const _onBlur = e => {
    		if (typeof onBlur === "function") onBlur(e);
    	};

    	const setValue = _value => {
    		$$invalidate(0, value = _value);
    		filter();
    	};

    	function filter() {
    		if (value.length < minLength) $$invalidate(1, filteredOptions = []); else $$invalidate(1, filteredOptions = options.filter(o => matchingFunction(value, getOptionText(o)) && value !== getOptionValue(o)));
    	}

    	const _onInput = e => {
    		setValue(e.target.value);
    		if (typeof onInput === "function") onInput(e);
    	};

    	onMount(() => filter());
    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AutoComplete", $$slots, ['option','noResults']);

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, input = $$value);
    		});
    	}

    	function input_1_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function autocompleteoptions_filteredOptions_binding(value) {
    		filteredOptions = value;
    		$$invalidate(1, filteredOptions);
    	}

    	function autocompleteoptions_getOptionText_binding(value) {
    		getOptionText = value;
    		($$invalidate(5, getOptionText), $$invalidate(21, $$props));
    	}

    	function autocompleteoptions_input_binding(value) {
    		input = value;
    		$$invalidate(3, input);
    	}

    	function autocompleteoptions_direction_binding(value) {
    		direction = value;
    		($$invalidate(4, direction), $$invalidate(21, $$props));
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(21, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("$$scope" in $$new_props) $$invalidate(29, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		libClassName,
    		AutoCompleteOptions,
    		DIRECTION,
    		value,
    		filteredOptions,
    		isToggled,
    		input,
    		close,
    		_onFocus,
    		_onBlur,
    		setValue,
    		filter,
    		_onInput,
    		direction,
    		getOptionText,
    		getOptionValue,
    		matchingFunction,
    		options,
    		providedValue,
    		minLength,
    		onBlur,
    		onFocus,
    		onInput,
    		nativeProps
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(21, $$props = assign(assign({}, $$props), $$new_props));
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("filteredOptions" in $$props) $$invalidate(1, filteredOptions = $$new_props.filteredOptions);
    		if ("isToggled" in $$props) $$invalidate(2, isToggled = $$new_props.isToggled);
    		if ("input" in $$props) $$invalidate(3, input = $$new_props.input);
    		if ("direction" in $$props) $$invalidate(4, direction = $$new_props.direction);
    		if ("getOptionText" in $$props) $$invalidate(5, getOptionText = $$new_props.getOptionText);
    		if ("getOptionValue" in $$props) $$invalidate(6, getOptionValue = $$new_props.getOptionValue);
    		if ("matchingFunction" in $$props) matchingFunction = $$new_props.matchingFunction;
    		if ("options" in $$props) options = $$new_props.options;
    		if ("providedValue" in $$props) providedValue = $$new_props.providedValue;
    		if ("minLength" in $$props) minLength = $$new_props.minLength;
    		if ("onBlur" in $$props) onBlur = $$new_props.onBlur;
    		if ("onFocus" in $$props) onFocus = $$new_props.onFocus;
    		if ("onInput" in $$props) onInput = $$new_props.onInput;
    		if ("nativeProps" in $$props) $$invalidate(7, nativeProps = $$new_props.nativeProps);
    	};

    	let direction;
    	let getOptionText;
    	let getOptionValue;
    	let matchingFunction;
    	let options;
    	let providedValue;
    	let minLength;
    	let onBlur;
    	let onFocus;
    	let onInput;
    	let nativeProps;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(4, { direction = [DIRECTION.LEFT, DIRECTION.BOTTOM], getOptionText = o => o, getOptionValue = o => o, matchingFunction = (value, optionValue) => optionValue.toLowerCase().startsWith(value.toLowerCase()), options, value: providedValue, minLength = 0, onBlur, onFocus, onInput, ...nativeProps } = $$props, direction, ($$invalidate(5, getOptionText), $$invalidate(21, $$props)), ($$invalidate(6, getOptionValue), $$invalidate(21, $$props)), ($$invalidate(7, nativeProps), $$invalidate(21, $$props)));
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		filteredOptions,
    		isToggled,
    		input,
    		direction,
    		getOptionText,
    		getOptionValue,
    		nativeProps,
    		close,
    		_onFocus,
    		_onBlur,
    		setValue,
    		_onInput,
    		matchingFunction,
    		options,
    		providedValue,
    		minLength,
    		onBlur,
    		onFocus,
    		onInput,
    		filter,
    		$$props,
    		$$slots,
    		input_1_binding,
    		input_1_input_handler,
    		autocompleteoptions_filteredOptions_binding,
    		autocompleteoptions_getOptionText_binding,
    		autocompleteoptions_input_binding,
    		autocompleteoptions_direction_binding,
    		$$scope
    	];
    }

    class AutoComplete extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoComplete",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get value() {
    		throw new Error("<AutoComplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<AutoComplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* example/App.svelte generated by Svelte v3.21.0 */
    const file$2 = "example/App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let updating_value;
    	let t;
    	let updating_value_1;
    	let current;

    	function autocomplete0_value_binding(value) {
    		/*autocomplete0_value_binding*/ ctx[2].call(null, value);
    	}

    	let autocomplete0_props = {
    		options: ["albert", "bernard"],
    		style: "border: 1px solid red;"
    	};

    	if (/*v*/ ctx[0] !== void 0) {
    		autocomplete0_props.value = /*v*/ ctx[0];
    	}

    	const autocomplete0 = new AutoComplete({
    			props: autocomplete0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocomplete0, "value", autocomplete0_value_binding));

    	function autocomplete1_value_binding(value) {
    		/*autocomplete1_value_binding*/ ctx[3].call(null, value);
    	}

    	let autocomplete1_props = {
    		getOptionText: func,
    		getOptionValue: func_1,
    		options: [{ label: "Albert", value: "albert" }, { label: "Bernard", value: "bernard" }],
    		style: "border: 1px solid red;"
    	};

    	if (/*v2*/ ctx[1] !== void 0) {
    		autocomplete1_props.value = /*v2*/ ctx[1];
    	}

    	const autocomplete1 = new AutoComplete({
    			props: autocomplete1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocomplete1, "value", autocomplete1_value_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(autocomplete0.$$.fragment);
    			t = space();
    			create_component(autocomplete1.$$.fragment);
    			add_location(main, file$2, 12, 0, 203);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(autocomplete0, main, null);
    			append_dev(main, t);
    			mount_component(autocomplete1, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const autocomplete0_changes = {};

    			if (!updating_value && dirty & /*v*/ 1) {
    				updating_value = true;
    				autocomplete0_changes.value = /*v*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			autocomplete0.$set(autocomplete0_changes);
    			const autocomplete1_changes = {};

    			if (!updating_value_1 && dirty & /*v2*/ 2) {
    				updating_value_1 = true;
    				autocomplete1_changes.value = /*v2*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			autocomplete1.$set(autocomplete1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autocomplete0.$$.fragment, local);
    			transition_in(autocomplete1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autocomplete0.$$.fragment, local);
    			transition_out(autocomplete1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(autocomplete0);
    			destroy_component(autocomplete1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = ({ label }) => label;
    const func_1 = ({ value }) => value;

    function instance$2($$self, $$props, $$invalidate) {
    	let v = "albert";
    	let v2 = "Albert";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function autocomplete0_value_binding(value) {
    		v = value;
    		$$invalidate(0, v);
    	}

    	function autocomplete1_value_binding(value) {
    		v2 = value;
    		$$invalidate(1, v2);
    	}

    	$$self.$capture_state = () => ({ AutoComplete, v, v2 });

    	$$self.$inject_state = $$props => {
    		if ("v" in $$props) $$invalidate(0, v = $$props.v);
    		if ("v2" in $$props) $$invalidate(1, v2 = $$props.v2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [v, v2, autocomplete0_value_binding, autocomplete1_value_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=index.js.map
