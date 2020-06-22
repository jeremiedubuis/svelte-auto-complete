
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
        console.log(e.target);
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

    /* src\AutoCompleteOptions.svelte generated by Svelte v3.21.0 */
    const file = "src\\AutoCompleteOptions.svelte";

    const get_option_slot_changes = dirty => ({
    	option: dirty & /*filteredOptions*/ 1,
    	text: dirty & /*getOptionText, filteredOptions*/ 3
    });

    const get_option_slot_context = ctx => ({
    	option: /*o*/ ctx[14],
    	text: /*getOptionText*/ ctx[1](/*o*/ ctx[14])
    });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (41:75)                          
    function fallback_block(ctx) {
    	let t_value = /*getOptionText*/ ctx[1](/*o*/ ctx[14]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*getOptionText, filteredOptions*/ 3 && t_value !== (t_value = /*getOptionText*/ ctx[1](/*o*/ ctx[14]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(41:75)                          ",
    		ctx
    	});

    	return block;
    }

    // (38:8) {#each filteredOptions as o}
    function create_each_block(ctx) {
    	let li;
    	let button;
    	let t;
    	let current;
    	let dispose;
    	const option_slot_template = /*$$slots*/ ctx[11].option;
    	const option_slot = create_slot(option_slot_template, ctx, /*$$scope*/ ctx[10], get_option_slot_context);
    	const option_slot_or_fallback = option_slot || fallback_block(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[12](/*o*/ ctx[14], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			if (option_slot_or_fallback) option_slot_or_fallback.c();
    			t = space();
    			add_location(button, file, 39, 16, 1172);
    			add_location(li, file, 38, 12, 1151);
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
    				if (option_slot.p && dirty & /*$$scope, filteredOptions, getOptionText*/ 1027) {
    					option_slot.p(get_slot_context(option_slot_template, ctx, /*$$scope*/ ctx[10], get_option_slot_context), get_slot_changes(option_slot_template, /*$$scope*/ ctx[10], dirty, get_option_slot_changes));
    				}
    			} else {
    				if (option_slot_or_fallback && option_slot_or_fallback.p && dirty & /*getOptionText, filteredOptions*/ 3) {
    					option_slot_or_fallback.p(ctx, dirty);
    				}
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
    		source: "(38:8) {#each filteredOptions as o}",
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

    			add_location(ul, file, 36, 4, 1097);
    			attr_dev(div, "class", div_class_value = "" + (libClassName + "-options"));
    			attr_dev(div, "style", div_style_value = /*getOptionsStyle*/ ctx[3]());
    			add_location(div, file, 35, 0, 1010);
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

    			/*div_binding*/ ctx[13](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*onClick, filteredOptions, getOptionText, $$scope*/ 1043) {
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

    			if (!current || dirty & /*getOptionsStyle*/ 8 && div_style_value !== (div_style_value = /*getOptionsStyle*/ ctx[3]())) {
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
    			/*div_binding*/ ctx[13](null);
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

    	onMount(() => {
    		document.body.appendChild(options);
    		return onClickOutside(options, close, [libClassName]);
    	});

    	const onClick = o => {
    		setValue(getOptionValue(o));
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
    		if ("direction" in $$props) $$invalidate(5, direction = $$props.direction);
    		if ("filteredOptions" in $$props) $$invalidate(0, filteredOptions = $$props.filteredOptions);
    		if ("getOptionText" in $$props) $$invalidate(1, getOptionText = $$props.getOptionText);
    		if ("input" in $$props) $$invalidate(6, input = $$props.input);
    		if ("setValue" in $$props) $$invalidate(7, setValue = $$props.setValue);
    		if ("getOptionValue" in $$props) $$invalidate(8, getOptionValue = $$props.getOptionValue);
    		if ("close" in $$props) $$invalidate(9, close = $$props.close);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		libClassName,
    		DIRECTION,
    		onClickOutside,
    		direction,
    		filteredOptions,
    		getOptionText,
    		input,
    		setValue,
    		getOptionValue,
    		close,
    		options,
    		onClick,
    		getOptionsStyle
    	});

    	$$self.$inject_state = $$props => {
    		if ("direction" in $$props) $$invalidate(5, direction = $$props.direction);
    		if ("filteredOptions" in $$props) $$invalidate(0, filteredOptions = $$props.filteredOptions);
    		if ("getOptionText" in $$props) $$invalidate(1, getOptionText = $$props.getOptionText);
    		if ("input" in $$props) $$invalidate(6, input = $$props.input);
    		if ("setValue" in $$props) $$invalidate(7, setValue = $$props.setValue);
    		if ("getOptionValue" in $$props) $$invalidate(8, getOptionValue = $$props.getOptionValue);
    		if ("close" in $$props) $$invalidate(9, close = $$props.close);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    		if ("getOptionsStyle" in $$props) $$invalidate(3, getOptionsStyle = $$props.getOptionsStyle);
    	};

    	let getOptionsStyle;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*input, direction, options*/ 100) {
    			 $$invalidate(3, getOptionsStyle = () => {
    				const rect = input.getBoundingClientRect();
    				const left = rect.left + (direction[0] === DIRECTION.RIGHT ? rect.width : 0);

    				const top = rect.top + (direction[1] === DIRECTION.TOP
    				? -options.offsetHeight
    				: rect.height);

    				return `position: absolute; left=${left}px; top:${top}px;`;
    			});
    		}
    	};

    	return [
    		filteredOptions,
    		getOptionText,
    		options,
    		getOptionsStyle,
    		onClick,
    		direction,
    		input,
    		setValue,
    		getOptionValue,
    		close,
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
    			direction: 5,
    			filteredOptions: 0,
    			getOptionText: 1,
    			input: 6,
    			setValue: 7,
    			getOptionValue: 8,
    			close: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoCompleteOptions",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*direction*/ ctx[5] === undefined && !("direction" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'direction'");
    		}

    		if (/*filteredOptions*/ ctx[0] === undefined && !("filteredOptions" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'filteredOptions'");
    		}

    		if (/*getOptionText*/ ctx[1] === undefined && !("getOptionText" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'getOptionText'");
    		}

    		if (/*input*/ ctx[6] === undefined && !("input" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'input'");
    		}

    		if (/*setValue*/ ctx[7] === undefined && !("setValue" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'setValue'");
    		}

    		if (/*getOptionValue*/ ctx[8] === undefined && !("getOptionValue" in props)) {
    			console.warn("<AutoCompleteOptions> was created without expected prop 'getOptionValue'");
    		}

    		if (/*close*/ ctx[9] === undefined && !("close" in props)) {
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

    /* src\AutoComplete.svelte generated by Svelte v3.21.0 */
    const file$1 = "src\\AutoComplete.svelte";
    const get_noResults_slot_changes = dirty => ({ value: dirty & /*value*/ 4 });
    const get_noResults_slot_context = ctx => ({ value: /*value*/ ctx[2] });
    const get_option_slot_changes$1 = dirty => ({});
    const get_option_slot_context$1 = ctx => ({});

    // (52:0) {#if isToggled}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*filteredOptions*/ ctx[4].length) return 0;
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
    		source: "(52:0) {#if isToggled}",
    		ctx
    	});

    	return block;
    }

    // (57:4) {:else}
    function create_else_block(ctx) {
    	let current;
    	const noResults_slot_template = /*$$slots*/ ctx[15].noResults;
    	const noResults_slot = create_slot(noResults_slot_template, ctx, /*$$scope*/ ctx[22], get_noResults_slot_context);

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
    				if (noResults_slot.p && dirty & /*$$scope, value*/ 4194308) {
    					noResults_slot.p(get_slot_context(noResults_slot_template, ctx, /*$$scope*/ ctx[22], get_noResults_slot_context), get_slot_changes(noResults_slot_template, /*$$scope*/ ctx[22], dirty, get_noResults_slot_changes));
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
    		source: "(57:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (53:4) {#if filteredOptions.length}
    function create_if_block_1(ctx) {
    	let updating_filteredOptions;
    	let updating_getOptionText;
    	let updating_input;
    	let updating_direction;
    	let current;

    	function autocompleteoptions_filteredOptions_binding(value) {
    		/*autocompleteoptions_filteredOptions_binding*/ ctx[18].call(null, value);
    	}

    	function autocompleteoptions_getOptionText_binding(value) {
    		/*autocompleteoptions_getOptionText_binding*/ ctx[19].call(null, value);
    	}

    	function autocompleteoptions_input_binding(value) {
    		/*autocompleteoptions_input_binding*/ ctx[20].call(null, value);
    	}

    	function autocompleteoptions_direction_binding(value) {
    		/*autocompleteoptions_direction_binding*/ ctx[21].call(null, value);
    	}

    	let autocompleteoptions_props = {
    		setValue: /*setValue*/ ctx[9],
    		getOptionValue: /*getOptionValue*/ ctx[3],
    		close: /*close*/ ctx[7],
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*filteredOptions*/ ctx[4] !== void 0) {
    		autocompleteoptions_props.filteredOptions = /*filteredOptions*/ ctx[4];
    	}

    	if (/*getOptionText*/ ctx[1] !== void 0) {
    		autocompleteoptions_props.getOptionText = /*getOptionText*/ ctx[1];
    	}

    	if (/*input*/ ctx[6] !== void 0) {
    		autocompleteoptions_props.input = /*input*/ ctx[6];
    	}

    	if (/*direction*/ ctx[0] !== void 0) {
    		autocompleteoptions_props.direction = /*direction*/ ctx[0];
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
    			if (dirty & /*getOptionValue*/ 8) autocompleteoptions_changes.getOptionValue = /*getOptionValue*/ ctx[3];

    			if (dirty & /*$$scope*/ 4194304) {
    				autocompleteoptions_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_filteredOptions && dirty & /*filteredOptions*/ 16) {
    				updating_filteredOptions = true;
    				autocompleteoptions_changes.filteredOptions = /*filteredOptions*/ ctx[4];
    				add_flush_callback(() => updating_filteredOptions = false);
    			}

    			if (!updating_getOptionText && dirty & /*getOptionText*/ 2) {
    				updating_getOptionText = true;
    				autocompleteoptions_changes.getOptionText = /*getOptionText*/ ctx[1];
    				add_flush_callback(() => updating_getOptionText = false);
    			}

    			if (!updating_input && dirty & /*input*/ 64) {
    				updating_input = true;
    				autocompleteoptions_changes.input = /*input*/ ctx[6];
    				add_flush_callback(() => updating_input = false);
    			}

    			if (!updating_direction && dirty & /*direction*/ 1) {
    				updating_direction = true;
    				autocompleteoptions_changes.direction = /*direction*/ ctx[0];
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
    		source: "(53:4) {#if filteredOptions.length}",
    		ctx
    	});

    	return block;
    }

    // (54:4) <AutoCompleteOptions bind:filteredOptions bind:getOptionText bind:input bind:direction setValue={setValue} getOptionValue={getOptionValue} close={close}>
    function create_default_slot(ctx) {
    	let current;
    	const option_slot_template = /*$$slots*/ ctx[15].option;
    	const option_slot = create_slot(option_slot_template, ctx, /*$$scope*/ ctx[22], get_option_slot_context$1);

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
    				if (option_slot.p && dirty & /*$$scope*/ 4194304) {
    					option_slot.p(get_slot_context(option_slot_template, ctx, /*$$scope*/ ctx[22], get_option_slot_context$1), get_slot_changes(option_slot_template, /*$$scope*/ ctx[22], dirty, get_option_slot_changes$1));
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
    		source: "(54:4) <AutoCompleteOptions bind:filteredOptions bind:getOptionText bind:input bind:direction setValue={setValue} getOptionValue={getOptionValue} close={close}>",
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
    	let if_block = /*isToggled*/ ctx[5] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			input_1 = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(input_1, "class", libClassName);
    			attr_dev(input_1, "type", "text");
    			add_location(input_1, file$1, 44, 0, 1092);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, input_1, anchor);
    			/*input_1_binding*/ ctx[16](input_1);
    			set_input_value(input_1, /*value*/ ctx[2]);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input_1, "focus", /*onFocus*/ ctx[8], false, false, false),
    				listen_dev(input_1, "input", /*onInput*/ ctx[10], false, false, false),
    				listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[17])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 4 && input_1.value !== /*value*/ ctx[2]) {
    				set_input_value(input_1, /*value*/ ctx[2]);
    			}

    			if (/*isToggled*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isToggled*/ 32) {
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
    			/*input_1_binding*/ ctx[16](null);
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
    	let { direction = [DIRECTION.LEFT, DIRECTION.BOTTOM] } = $$props;
    	let { getOptionText = o => o } = $$props;
    	let { getOptionValue = o => o } = $$props;
    	let { matchingFunction = (value, optionValue) => optionValue.toLowerCase().startsWith(value.toLowerCase()) } = $$props;
    	let { options } = $$props;
    	let { value = "" } = $$props;
    	let { minLength = 0 } = $$props;
    	let filteredOptions = [];
    	let isToggled = false;
    	let input;
    	filter();

    	const close = e => {
    		$$invalidate(5, isToggled = false);
    	};

    	const onFocus = e => {
    		$$invalidate(5, isToggled = true);
    	};

    	const setValue = _value => {
    		$$invalidate(2, value = _value);
    		filter();
    	};

    	function filter() {
    		if (value.length < minLength) $$invalidate(4, filteredOptions = []); else $$invalidate(4, filteredOptions = options.filter(o => matchingFunction(value, getOptionValue(o))));
    	}

    	const onInput = e => {
    		setValue(e.target.value);
    	};

    	const writable_props = [
    		"direction",
    		"getOptionText",
    		"getOptionValue",
    		"matchingFunction",
    		"options",
    		"value",
    		"minLength"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AutoComplete> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AutoComplete", $$slots, ['option','noResults']);

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(6, input = $$value);
    		});
    	}

    	function input_1_input_handler() {
    		value = this.value;
    		$$invalidate(2, value);
    	}

    	function autocompleteoptions_filteredOptions_binding(value) {
    		filteredOptions = value;
    		$$invalidate(4, filteredOptions);
    	}

    	function autocompleteoptions_getOptionText_binding(value) {
    		getOptionText = value;
    		$$invalidate(1, getOptionText);
    	}

    	function autocompleteoptions_input_binding(value) {
    		input = value;
    		$$invalidate(6, input);
    	}

    	function autocompleteoptions_direction_binding(value) {
    		direction = value;
    		$$invalidate(0, direction);
    	}

    	$$self.$set = $$props => {
    		if ("direction" in $$props) $$invalidate(0, direction = $$props.direction);
    		if ("getOptionText" in $$props) $$invalidate(1, getOptionText = $$props.getOptionText);
    		if ("getOptionValue" in $$props) $$invalidate(3, getOptionValue = $$props.getOptionValue);
    		if ("matchingFunction" in $$props) $$invalidate(11, matchingFunction = $$props.matchingFunction);
    		if ("options" in $$props) $$invalidate(12, options = $$props.options);
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("minLength" in $$props) $$invalidate(13, minLength = $$props.minLength);
    		if ("$$scope" in $$props) $$invalidate(22, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		libClassName,
    		AutoCompleteOptions,
    		DIRECTION,
    		direction,
    		getOptionText,
    		getOptionValue,
    		matchingFunction,
    		options,
    		value,
    		minLength,
    		filteredOptions,
    		isToggled,
    		input,
    		close,
    		onFocus,
    		setValue,
    		filter,
    		onInput
    	});

    	$$self.$inject_state = $$props => {
    		if ("direction" in $$props) $$invalidate(0, direction = $$props.direction);
    		if ("getOptionText" in $$props) $$invalidate(1, getOptionText = $$props.getOptionText);
    		if ("getOptionValue" in $$props) $$invalidate(3, getOptionValue = $$props.getOptionValue);
    		if ("matchingFunction" in $$props) $$invalidate(11, matchingFunction = $$props.matchingFunction);
    		if ("options" in $$props) $$invalidate(12, options = $$props.options);
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("minLength" in $$props) $$invalidate(13, minLength = $$props.minLength);
    		if ("filteredOptions" in $$props) $$invalidate(4, filteredOptions = $$props.filteredOptions);
    		if ("isToggled" in $$props) $$invalidate(5, isToggled = $$props.isToggled);
    		if ("input" in $$props) $$invalidate(6, input = $$props.input);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		direction,
    		getOptionText,
    		value,
    		getOptionValue,
    		filteredOptions,
    		isToggled,
    		input,
    		close,
    		onFocus,
    		setValue,
    		onInput,
    		matchingFunction,
    		options,
    		minLength,
    		filter,
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

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			direction: 0,
    			getOptionText: 1,
    			getOptionValue: 3,
    			matchingFunction: 11,
    			options: 12,
    			value: 2,
    			minLength: 13
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoComplete",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*options*/ ctx[12] === undefined && !("options" in props)) {
    			console.warn("<AutoComplete> was created without expected prop 'options'");
    		}
    	}

    	get direction() {
    		throw new Error("<AutoComplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<AutoComplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getOptionText() {
    		throw new Error("<AutoComplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getOptionText(value) {
    		throw new Error("<AutoComplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getOptionValue() {
    		throw new Error("<AutoComplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getOptionValue(value) {
    		throw new Error("<AutoComplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get matchingFunction() {
    		throw new Error("<AutoComplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set matchingFunction(value) {
    		throw new Error("<AutoComplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<AutoComplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<AutoComplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<AutoComplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<AutoComplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minLength() {
    		throw new Error("<AutoComplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minLength(value) {
    		throw new Error("<AutoComplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* example\App.svelte generated by Svelte v3.21.0 */
    const file$2 = "example\\App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let current;

    	const autocomplete = new AutoComplete({
    			props: { options: ["albert", "bernard"] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(autocomplete.$$.fragment);
    			add_location(main, file$2, 5, 0, 80);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(autocomplete, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autocomplete.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autocomplete.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(autocomplete);
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

    function instance$2($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ AutoComplete });
    	return [];
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
