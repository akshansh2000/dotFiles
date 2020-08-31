(function () {
    "use strict";

    /* malevic@0.18.6 - Jul 15, 2020 */
    function m(tagOrComponent, props, ...children) {
        props = props || {};
        if (typeof tagOrComponent === "string") {
            const tag = tagOrComponent;
            return {type: tag, props, children};
        }
        if (typeof tagOrComponent === "function") {
            const component = tagOrComponent;
            return {type: component, props, children};
        }
        throw new Error("Unsupported spec type");
    }

    /* malevic@0.18.6 - Jul 15, 2020 */
    function createPluginsStore() {
        const plugins = [];
        return {
            add(plugin) {
                plugins.push(plugin);
                return this;
            },
            apply(props) {
                let result;
                let plugin;
                const usedPlugins = new Set();
                for (let i = plugins.length - 1; i >= 0; i--) {
                    plugin = plugins[i];
                    if (usedPlugins.has(plugin)) {
                        continue;
                    }
                    result = plugin(props);
                    if (result != null) {
                        return result;
                    }
                    usedPlugins.add(plugin);
                }
                return null;
            },
            delete(plugin) {
                for (let i = plugins.length - 1; i >= 0; i--) {
                    if (plugins[i] === plugin) {
                        plugins.splice(i, 1);
                        break;
                    }
                }
                return this;
            },
            empty() {
                return plugins.length === 0;
            }
        };
    }
    function iterateComponentPlugins(type, pairs, iterator) {
        pairs
            .filter(([key]) => type[key])
            .forEach(([key, plugins]) => {
                return type[key].forEach((plugin) => iterator(plugins, plugin));
            });
    }
    function addComponentPlugins(type, pairs) {
        iterateComponentPlugins(type, pairs, (plugins, plugin) =>
            plugins.add(plugin)
        );
    }
    function deleteComponentPlugins(type, pairs) {
        iterateComponentPlugins(type, pairs, (plugins, plugin) =>
            plugins.delete(plugin)
        );
    }
    function createPluginsAPI(key) {
        const api = {
            add(type, plugin) {
                if (!type[key]) {
                    type[key] = [];
                }
                type[key].push(plugin);
                return api;
            }
        };
        return api;
    }

    const XHTML_NS = "http://www.w3.org/1999/xhtml";
    const SVG_NS = "http://www.w3.org/2000/svg";
    const PLUGINS_CREATE_ELEMENT = Symbol();
    const pluginsCreateElement = createPluginsStore();
    function createElement(spec, parent) {
        const result = pluginsCreateElement.apply({spec, parent});
        if (result) {
            return result;
        }
        const tag = spec.type;
        if (tag === "svg") {
            return document.createElementNS(SVG_NS, "svg");
        }
        const namespace = parent.namespaceURI;
        if (namespace === XHTML_NS || namespace == null) {
            return document.createElement(tag);
        }
        return document.createElementNS(namespace, tag);
    }

    function classes(...args) {
        const classes = [];
        args.filter((c) => Boolean(c)).forEach((c) => {
            if (typeof c === "string") {
                classes.push(c);
            } else if (typeof c === "object") {
                classes.push(
                    ...Object.keys(c).filter((key) => Boolean(c[key]))
                );
            }
        });
        return classes.join(" ");
    }
    function setInlineCSSPropertyValue(element, prop, $value) {
        if ($value != null && $value !== "") {
            let value = String($value);
            let important = "";
            if (value.endsWith("!important")) {
                value = value.substring(0, value.length - 10);
                important = "important";
            }
            element.style.setProperty(prop, value, important);
        } else {
            element.style.removeProperty(prop);
        }
    }

    function isObject(value) {
        return value != null && typeof value === "object";
    }

    const eventListeners = new WeakMap();
    function addEventListener(element, event, listener) {
        let listeners;
        if (eventListeners.has(element)) {
            listeners = eventListeners.get(element);
        } else {
            listeners = new Map();
            eventListeners.set(element, listeners);
        }
        if (listeners.get(event) !== listener) {
            if (listeners.has(event)) {
                element.removeEventListener(event, listeners.get(event));
            }
            element.addEventListener(event, listener);
            listeners.set(event, listener);
        }
    }
    function removeEventListener(element, event) {
        if (!eventListeners.has(element)) {
            return;
        }
        const listeners = eventListeners.get(element);
        element.removeEventListener(event, listeners.get(event));
        listeners.delete(event);
    }

    function setClassObject(element, classObj) {
        const cls = Array.isArray(classObj)
            ? classes(...classObj)
            : classes(classObj);
        if (cls) {
            element.setAttribute("class", cls);
        } else {
            element.removeAttribute("class");
        }
    }
    function mergeValues(obj, old) {
        const values = new Map();
        const newProps = new Set(Object.keys(obj));
        const oldProps = Object.keys(old);
        oldProps
            .filter((prop) => !newProps.has(prop))
            .forEach((prop) => values.set(prop, null));
        newProps.forEach((prop) => values.set(prop, obj[prop]));
        return values;
    }
    function setStyleObject(element, styleObj, prev) {
        let prevObj;
        if (isObject(prev)) {
            prevObj = prev;
        } else {
            prevObj = {};
            element.removeAttribute("style");
        }
        const declarations = mergeValues(styleObj, prevObj);
        declarations.forEach(($value, prop) =>
            setInlineCSSPropertyValue(element, prop, $value)
        );
    }
    function setEventListener(element, event, listener) {
        if (typeof listener === "function") {
            addEventListener(element, event, listener);
        } else {
            removeEventListener(element, event);
        }
    }
    const specialAttrs = new Set([
        "key",
        "oncreate",
        "onupdate",
        "onrender",
        "onremove"
    ]);
    const PLUGINS_SET_ATTRIBUTE = Symbol();
    const pluginsSetAttribute = createPluginsStore();
    function getPropertyValue(obj, prop) {
        return obj && obj.hasOwnProperty(prop) ? obj[prop] : null;
    }
    function syncAttrs(element, attrs, prev) {
        const values = mergeValues(attrs, prev || {});
        values.forEach((value, attr) => {
            if (!pluginsSetAttribute.empty()) {
                const result = pluginsSetAttribute.apply({
                    element,
                    attr,
                    value,
                    get prev() {
                        return getPropertyValue(prev, attr);
                    }
                });
                if (result != null) {
                    return;
                }
            }
            if (attr === "class" && isObject(value)) {
                setClassObject(element, value);
            } else if (attr === "style" && isObject(value)) {
                const prevValue = getPropertyValue(prev, attr);
                setStyleObject(element, value, prevValue);
            } else if (attr.startsWith("on")) {
                const event = attr.substring(2);
                setEventListener(element, event, value);
            } else if (specialAttrs.has(attr));
            else if (value == null || value === false) {
                element.removeAttribute(attr);
            } else {
                element.setAttribute(attr, value === true ? "" : String(value));
            }
        });
    }

    class LinkedList {
        constructor(...items) {
            this.nexts = new WeakMap();
            this.prevs = new WeakMap();
            this.first = null;
            this.last = null;
            items.forEach((item) => this.push(item));
        }
        empty() {
            return this.first == null;
        }
        push(item) {
            if (this.empty()) {
                this.first = item;
                this.last = item;
            } else {
                this.nexts.set(this.last, item);
                this.prevs.set(item, this.last);
                this.last = item;
            }
        }
        insertBefore(newItem, refItem) {
            const prev = this.before(refItem);
            this.prevs.set(newItem, prev);
            this.nexts.set(newItem, refItem);
            this.prevs.set(refItem, newItem);
            prev && this.nexts.set(prev, newItem);
            refItem === this.first && (this.first = newItem);
        }
        delete(item) {
            const prev = this.before(item);
            const next = this.after(item);
            prev && this.nexts.set(prev, next);
            next && this.prevs.set(next, prev);
            item === this.first && (this.first = next);
            item === this.last && (this.last = prev);
        }
        before(item) {
            return this.prevs.get(item) || null;
        }
        after(item) {
            return this.nexts.get(item) || null;
        }
        loop(iterator) {
            if (this.empty()) {
                return;
            }
            let current = this.first;
            do {
                if (iterator(current)) {
                    break;
                }
            } while ((current = this.after(current)));
        }
        copy() {
            const list = new LinkedList();
            this.loop((item) => {
                list.push(item);
                return false;
            });
            return list;
        }
        forEach(iterator) {
            this.loop((item) => {
                iterator(item);
                return false;
            });
        }
        find(iterator) {
            let result = null;
            this.loop((item) => {
                if (iterator(item)) {
                    result = item;
                    return true;
                }
                return false;
            });
            return result;
        }
        map(iterator) {
            const results = [];
            this.loop((item) => {
                results.push(iterator(item));
                return false;
            });
            return results;
        }
    }

    function matchChildren(vnode, old) {
        const oldChildren = old.children();
        const oldChildrenByKey = new Map();
        const oldChildrenWithoutKey = [];
        oldChildren.forEach((v) => {
            const key = v.key();
            if (key == null) {
                oldChildrenWithoutKey.push(v);
            } else {
                oldChildrenByKey.set(key, v);
            }
        });
        const children = vnode.children();
        const matches = [];
        const unmatched = new Set(oldChildren);
        const keys = new Set();
        children.forEach((v) => {
            let match = null;
            let guess = null;
            const key = v.key();
            if (key != null) {
                if (keys.has(key)) {
                    throw new Error("Duplicate key");
                }
                keys.add(key);
                if (oldChildrenByKey.has(key)) {
                    guess = oldChildrenByKey.get(key);
                }
            } else if (oldChildrenWithoutKey.length > 0) {
                guess = oldChildrenWithoutKey.shift();
            }
            if (v.matches(guess)) {
                match = guess;
            }
            matches.push([v, match]);
            if (match) {
                unmatched.delete(match);
            }
        });
        return {matches, unmatched};
    }

    function execute(vnode, old, vdom) {
        const didMatch = vnode && old && vnode.matches(old);
        if (didMatch && vnode.parent() === old.parent()) {
            vdom.replaceVNode(old, vnode);
        } else if (vnode) {
            vdom.addVNode(vnode);
        }
        const context = vdom.getVNodeContext(vnode);
        const oldContext = vdom.getVNodeContext(old);
        if (old && !didMatch) {
            old.detach(oldContext);
            old.children().forEach((v) => execute(null, v, vdom));
            old.detached(oldContext);
        }
        if (vnode && !didMatch) {
            vnode.attach(context);
            vnode.children().forEach((v) => execute(v, null, vdom));
            vnode.attached(context);
        }
        if (didMatch) {
            const result = vnode.update(old, context);
            if (result !== vdom.LEAVE) {
                const {matches, unmatched} = matchChildren(vnode, old);
                unmatched.forEach((v) => execute(null, v, vdom));
                matches.forEach(([v, o]) => execute(v, o, vdom));
                vnode.updated(context);
            }
        }
    }

    function isSpec(x) {
        return isObject(x) && x.type != null && x.nodeType == null;
    }
    function isNodeSpec(x) {
        return isSpec(x) && typeof x.type === "string";
    }
    function isComponentSpec(x) {
        return isSpec(x) && typeof x.type === "function";
    }

    class VNodeBase {
        constructor(parent) {
            this.parentVNode = parent;
        }
        key() {
            return null;
        }
        parent(vnode) {
            if (vnode) {
                this.parentVNode = vnode;
                return;
            }
            return this.parentVNode;
        }
        children() {
            return [];
        }
        attach(context) {}
        detach(context) {}
        update(old, context) {
            return null;
        }
        attached(context) {}
        detached(context) {}
        updated(context) {}
    }
    function nodeMatchesSpec(node, spec) {
        return (
            node instanceof Element && spec.type === node.tagName.toLowerCase()
        );
    }
    const refinedElements = new WeakMap();
    function markElementAsRefined(element, vdom) {
        let refined;
        if (refinedElements.has(vdom)) {
            refined = refinedElements.get(vdom);
        } else {
            refined = new WeakSet();
            refinedElements.set(vdom, refined);
        }
        refined.add(element);
    }
    function isElementRefined(element, vdom) {
        return (
            refinedElements.has(vdom) && refinedElements.get(vdom).has(element)
        );
    }
    class ElementVNode extends VNodeBase {
        constructor(spec, parent) {
            super(parent);
            this.spec = spec;
        }
        matches(other) {
            return (
                other instanceof ElementVNode &&
                this.spec.type === other.spec.type
            );
        }
        key() {
            return this.spec.props.key;
        }
        children() {
            return [this.child];
        }
        getExistingElement(context) {
            const parent = context.parent;
            const existing = context.node;
            let element;
            if (nodeMatchesSpec(existing, this.spec)) {
                element = existing;
            } else if (
                !isElementRefined(parent, context.vdom) &&
                context.vdom.isDOMNodeCaptured(parent)
            ) {
                const sibling = context.sibling;
                const guess = sibling
                    ? sibling.nextElementSibling
                    : parent.firstElementChild;
                if (guess && !context.vdom.isDOMNodeCaptured(guess)) {
                    if (nodeMatchesSpec(guess, this.spec)) {
                        element = guess;
                    } else {
                        parent.removeChild(guess);
                    }
                }
            }
            return element;
        }
        attach(context) {
            let element;
            const existing = this.getExistingElement(context);
            if (existing) {
                element = existing;
            } else {
                element = createElement(this.spec, context.parent);
                markElementAsRefined(element, context.vdom);
            }
            syncAttrs(element, this.spec.props, null);
            this.child = createDOMVNode(
                element,
                this.spec.children,
                this,
                false
            );
        }
        update(prev, context) {
            const prevContext = context.vdom.getVNodeContext(prev);
            const element = prevContext.node;
            syncAttrs(element, this.spec.props, prev.spec.props);
            this.child = createDOMVNode(
                element,
                this.spec.children,
                this,
                false
            );
        }
        attached(context) {
            const {oncreate, onrender} = this.spec.props;
            if (oncreate) {
                oncreate(context.node);
            }
            if (onrender) {
                onrender(context.node);
            }
        }
        detached(context) {
            const {onremove} = this.spec.props;
            if (onremove) {
                onremove(context.node);
            }
        }
        updated(context) {
            const {onupdate, onrender} = this.spec.props;
            if (onupdate) {
                onupdate(context.node);
            }
            if (onrender) {
                onrender(context.node);
            }
        }
    }
    const symbols = {
        CREATED: Symbol(),
        REMOVED: Symbol(),
        UPDATED: Symbol(),
        RENDERED: Symbol(),
        ACTIVE: Symbol(),
        DEFAULTS_ASSIGNED: Symbol()
    };
    const domPlugins = [
        [PLUGINS_CREATE_ELEMENT, pluginsCreateElement],
        [PLUGINS_SET_ATTRIBUTE, pluginsSetAttribute]
    ];
    class ComponentVNode extends VNodeBase {
        constructor(spec, parent) {
            super(parent);
            this.lock = false;
            this.spec = spec;
            this.prev = null;
            this.store = {};
            this.store[symbols.ACTIVE] = this;
        }
        matches(other) {
            return (
                other instanceof ComponentVNode &&
                this.spec.type === other.spec.type
            );
        }
        key() {
            return this.spec.props.key;
        }
        children() {
            return [this.child];
        }
        createContext(context) {
            const {parent} = context;
            const {spec, prev, store} = this;
            return {
                spec,
                prev,
                store,
                get node() {
                    return context.node;
                },
                get nodes() {
                    return context.nodes;
                },
                parent,
                onCreate: (fn) => (store[symbols.CREATED] = fn),
                onUpdate: (fn) => (store[symbols.UPDATED] = fn),
                onRemove: (fn) => (store[symbols.REMOVED] = fn),
                onRender: (fn) => (store[symbols.RENDERED] = fn),
                refresh: () => {
                    const activeVNode = store[symbols.ACTIVE];
                    activeVNode.refresh(context);
                },
                leave: () => context.vdom.LEAVE,
                getStore: (defaults) => {
                    if (defaults && !store[symbols.DEFAULTS_ASSIGNED]) {
                        Object.entries(defaults).forEach(([prop, value]) => {
                            store[prop] = value;
                        });
                        store[symbols.DEFAULTS_ASSIGNED] = true;
                    }
                    return store;
                }
            };
        }
        unbox(context) {
            const Component = this.spec.type;
            const props = this.spec.props;
            const children = this.spec.children;
            this.lock = true;
            const prevContext = ComponentVNode.context;
            ComponentVNode.context = this.createContext(context);
            let unboxed = null;
            try {
                unboxed = Component(props, ...children);
            } finally {
                ComponentVNode.context = prevContext;
                this.lock = false;
            }
            return unboxed;
        }
        refresh(context) {
            if (this.lock) {
                throw new Error(
                    "Calling refresh during unboxing causes infinite loop"
                );
            }
            this.prev = this.spec;
            const latestContext = context.vdom.getVNodeContext(this);
            const unboxed = this.unbox(latestContext);
            if (unboxed === context.vdom.LEAVE) {
                return;
            }
            const prevChild = this.child;
            this.child = createVNode(unboxed, this);
            context.vdom.execute(this.child, prevChild);
            this.updated(context);
        }
        addPlugins() {
            addComponentPlugins(this.spec.type, domPlugins);
        }
        deletePlugins() {
            deleteComponentPlugins(this.spec.type, domPlugins);
        }
        attach(context) {
            this.addPlugins();
            const unboxed = this.unbox(context);
            const childSpec = unboxed === context.vdom.LEAVE ? null : unboxed;
            this.child = createVNode(childSpec, this);
        }
        update(prev, context) {
            this.store = prev.store;
            this.prev = prev.spec;
            this.store[symbols.ACTIVE] = this;
            const prevContext = context.vdom.getVNodeContext(prev);
            this.addPlugins();
            const unboxed = this.unbox(prevContext);
            let result = null;
            if (unboxed === context.vdom.LEAVE) {
                result = unboxed;
                this.child = prev.child;
                context.vdom.adoptVNode(this.child, this);
            } else {
                this.child = createVNode(unboxed, this);
            }
            return result;
        }
        handle(event, context) {
            const fn = this.store[event];
            if (fn) {
                const nodes =
                    context.nodes.length === 0 ? [null] : context.nodes;
                fn(...nodes);
            }
        }
        attached(context) {
            this.deletePlugins();
            this.handle(symbols.CREATED, context);
            this.handle(symbols.RENDERED, context);
        }
        detached(context) {
            this.handle(symbols.REMOVED, context);
        }
        updated(context) {
            this.deletePlugins();
            this.handle(symbols.UPDATED, context);
            this.handle(symbols.RENDERED, context);
        }
    }
    ComponentVNode.context = null;
    function getComponentContext() {
        return ComponentVNode.context;
    }
    class TextVNode extends VNodeBase {
        constructor(text, parent) {
            super(parent);
            this.text = text;
        }
        matches(other) {
            return other instanceof TextVNode;
        }
        children() {
            return [this.child];
        }
        getExistingNode(context) {
            const {parent} = context;
            let node;
            if (context.node instanceof Text) {
                node = context.node;
            } else if (
                !isElementRefined(parent, context.vdom) &&
                context.vdom.isDOMNodeCaptured(parent)
            ) {
                const sibling = context.sibling;
                const guess = sibling ? sibling.nextSibling : parent.firstChild;
                if (
                    guess &&
                    !context.vdom.isDOMNodeCaptured(guess) &&
                    guess instanceof Text
                ) {
                    node = guess;
                }
            }
            return node;
        }
        attach(context) {
            const existing = this.getExistingNode(context);
            let node;
            if (existing) {
                node = existing;
                node.textContent = this.text;
            } else {
                node = document.createTextNode(this.text);
            }
            this.child = createVNode(node, this);
        }
        update(prev, context) {
            const prevContext = context.vdom.getVNodeContext(prev);
            const {node} = prevContext;
            if (this.text !== prev.text) {
                node.textContent = this.text;
            }
            this.child = createVNode(node, this);
        }
    }
    class InlineFunctionVNode extends VNodeBase {
        constructor(fn, parent) {
            super(parent);
            this.fn = fn;
        }
        matches(other) {
            return other instanceof InlineFunctionVNode;
        }
        children() {
            return [this.child];
        }
        call(context) {
            const fn = this.fn;
            const inlineFnContext = {
                parent: context.parent,
                get node() {
                    return context.node;
                },
                get nodes() {
                    return context.nodes;
                }
            };
            const result = fn(inlineFnContext);
            this.child = createVNode(result, this);
        }
        attach(context) {
            this.call(context);
        }
        update(prev, context) {
            const prevContext = context.vdom.getVNodeContext(prev);
            this.call(prevContext);
        }
    }
    class NullVNode extends VNodeBase {
        matches(other) {
            return other instanceof NullVNode;
        }
    }
    class DOMVNode extends VNodeBase {
        constructor(node, childSpecs, parent, isNative) {
            super(parent);
            this.node = node;
            this.childSpecs = childSpecs;
            this.isNative = isNative;
        }
        matches(other) {
            return other instanceof DOMVNode && this.node === other.node;
        }
        wrap() {
            this.childVNodes = this.childSpecs.map((spec) =>
                createVNode(spec, this)
            );
        }
        insertNode(context) {
            const {parent, sibling} = context;
            const shouldInsert = !(
                parent === this.node.parentElement &&
                sibling === this.node.previousSibling
            );
            if (shouldInsert) {
                const target = sibling
                    ? sibling.nextSibling
                    : parent.firstChild;
                parent.insertBefore(this.node, target);
            }
        }
        attach(context) {
            this.wrap();
            this.insertNode(context);
        }
        detach(context) {
            context.parent.removeChild(this.node);
        }
        update(prev, context) {
            this.wrap();
            this.insertNode(context);
        }
        cleanupDOMChildren(context) {
            const element = this.node;
            for (let current = element.lastChild; current != null; ) {
                if (context.vdom.isDOMNodeCaptured(current)) {
                    current = current.previousSibling;
                } else {
                    const prev = current.previousSibling;
                    element.removeChild(current);
                    current = prev;
                }
            }
        }
        refine(context) {
            if (!this.isNative) {
                this.cleanupDOMChildren(context);
            }
            const element = this.node;
            markElementAsRefined(element, context.vdom);
        }
        attached(context) {
            const {node} = this;
            if (
                node instanceof Element &&
                !isElementRefined(node, context.vdom) &&
                context.vdom.isDOMNodeCaptured(node)
            ) {
                this.refine(context);
            }
        }
        children() {
            return this.childVNodes;
        }
    }
    function isDOMVNode(v) {
        return v instanceof DOMVNode;
    }
    function createDOMVNode(node, childSpecs, parent, isNative) {
        return new DOMVNode(node, childSpecs, parent, isNative);
    }
    class ArrayVNode extends VNodeBase {
        constructor(items, key, parent) {
            super(parent);
            this.items = items;
            this.id = key;
        }
        matches(other) {
            return other instanceof ArrayVNode;
        }
        key() {
            return this.id;
        }
        children() {
            return this.childVNodes;
        }
        wrap() {
            this.childVNodes = this.items.map((spec) =>
                createVNode(spec, this)
            );
        }
        attach() {
            this.wrap();
        }
        update() {
            this.wrap();
        }
    }
    function createVNode(spec, parent) {
        if (isNodeSpec(spec)) {
            return new ElementVNode(spec, parent);
        }
        if (isComponentSpec(spec)) {
            if (spec.type === Array) {
                return new ArrayVNode(spec.children, spec.props.key, parent);
            }
            return new ComponentVNode(spec, parent);
        }
        if (typeof spec === "string") {
            return new TextVNode(spec, parent);
        }
        if (spec == null) {
            return new NullVNode(parent);
        }
        if (typeof spec === "function") {
            return new InlineFunctionVNode(spec, parent);
        }
        if (spec instanceof Node) {
            return createDOMVNode(spec, [], parent, true);
        }
        if (Array.isArray(spec)) {
            return new ArrayVNode(spec, null, parent);
        }
        throw new Error("Unable to create virtual node for spec");
    }

    function createVDOM(rootNode) {
        const contexts = new WeakMap();
        const hubs = new WeakMap();
        const parentNodes = new WeakMap();
        const passingLinks = new WeakMap();
        const linkedParents = new WeakSet();
        const LEAVE = Symbol();
        function execute$1(vnode, old) {
            execute(vnode, old, vdom);
        }
        function creatVNodeContext(vnode) {
            const parentNode = parentNodes.get(vnode);
            contexts.set(vnode, {
                parent: parentNode,
                get node() {
                    const linked = passingLinks
                        .get(vnode)
                        .find((link) => link.node != null);
                    return linked ? linked.node : null;
                },
                get nodes() {
                    return passingLinks
                        .get(vnode)
                        .map((link) => link.node)
                        .filter((node) => node);
                },
                get sibling() {
                    if (parentNode === rootNode.parentElement) {
                        return passingLinks.get(vnode).first.node
                            .previousSibling;
                    }
                    const hub = hubs.get(parentNode);
                    let current = passingLinks.get(vnode).first;
                    while ((current = hub.links.before(current))) {
                        if (current.node) {
                            return current.node;
                        }
                    }
                    return null;
                },
                vdom
            });
        }
        function createRootVNodeLinks(vnode) {
            const parentNode =
                rootNode.parentElement || document.createDocumentFragment();
            const node = rootNode;
            const links = new LinkedList({
                parentNode,
                node
            });
            passingLinks.set(vnode, links.copy());
            parentNodes.set(vnode, parentNode);
            hubs.set(parentNode, {
                node: parentNode,
                links
            });
        }
        function createVNodeLinks(vnode) {
            const parent = vnode.parent();
            const isBranch = linkedParents.has(parent);
            const parentNode = isDOMVNode(parent)
                ? parent.node
                : parentNodes.get(parent);
            parentNodes.set(vnode, parentNode);
            const vnodeLinks = new LinkedList();
            passingLinks.set(vnode, vnodeLinks);
            if (isBranch) {
                const newLink = {
                    parentNode,
                    node: null
                };
                let current = vnode;
                do {
                    passingLinks.get(current).push(newLink);
                    current = current.parent();
                } while (current && !isDOMVNode(current));
                hubs.get(parentNode).links.push(newLink);
            } else {
                linkedParents.add(parent);
                const links = isDOMVNode(parent)
                    ? hubs.get(parentNode).links
                    : passingLinks.get(parent);
                links.forEach((link) => vnodeLinks.push(link));
            }
        }
        function connectDOMVNode(vnode) {
            if (isDOMVNode(vnode)) {
                const {node} = vnode;
                hubs.set(node, {
                    node,
                    links: new LinkedList({
                        parentNode: node,
                        node: null
                    })
                });
                passingLinks.get(vnode).forEach((link) => (link.node = node));
            }
        }
        function addVNode(vnode) {
            const parent = vnode.parent();
            if (parent == null) {
                createRootVNodeLinks(vnode);
            } else {
                createVNodeLinks(vnode);
            }
            connectDOMVNode(vnode);
            creatVNodeContext(vnode);
        }
        function getVNodeContext(vnode) {
            return contexts.get(vnode);
        }
        function getAncestorsLinks(vnode) {
            const parentNode = parentNodes.get(vnode);
            const hub = hubs.get(parentNode);
            const allLinks = [];
            let current = vnode;
            while ((current = current.parent()) && !isDOMVNode(current)) {
                allLinks.push(passingLinks.get(current));
            }
            allLinks.push(hub.links);
            return allLinks;
        }
        function replaceVNode(old, vnode) {
            if (vnode.parent() == null) {
                addVNode(vnode);
                return;
            }
            const oldContext = contexts.get(old);
            const {parent: parentNode} = oldContext;
            parentNodes.set(vnode, parentNode);
            const oldLinks = passingLinks.get(old);
            const newLink = {
                parentNode,
                node: null
            };
            getAncestorsLinks(vnode).forEach((links) => {
                const nextLink = links.after(oldLinks.last);
                oldLinks.forEach((link) => links.delete(link));
                if (nextLink) {
                    links.insertBefore(newLink, nextLink);
                } else {
                    links.push(newLink);
                }
            });
            const vnodeLinks = new LinkedList(newLink);
            passingLinks.set(vnode, vnodeLinks);
            creatVNodeContext(vnode);
        }
        function adoptVNode(vnode, parent) {
            const vnodeLinks = passingLinks.get(vnode);
            const parentLinks = passingLinks.get(parent).copy();
            vnode.parent(parent);
            getAncestorsLinks(vnode).forEach((links) => {
                vnodeLinks.forEach((link) =>
                    links.insertBefore(link, parentLinks.first)
                );
                parentLinks.forEach((link) => links.delete(link));
            });
        }
        function isDOMNodeCaptured(node) {
            return hubs.has(node) && node !== rootNode.parentElement;
        }
        const vdom = {
            execute: execute$1,
            addVNode,
            getVNodeContext,
            replaceVNode,
            adoptVNode,
            isDOMNodeCaptured,
            LEAVE
        };
        return vdom;
    }

    const roots = new WeakMap();
    const vdoms = new WeakMap();
    function realize(node, vnode) {
        const old = roots.get(node) || null;
        roots.set(node, vnode);
        let vdom;
        if (vdoms.has(node)) {
            vdom = vdoms.get(node);
        } else {
            vdom = createVDOM(node);
            vdoms.set(node, vdom);
        }
        vdom.execute(vnode, old);
        return vdom.getVNodeContext(vnode);
    }
    function render(element, spec) {
        const vnode = createDOMVNode(
            element,
            Array.isArray(spec) ? spec : [spec],
            null,
            false
        );
        realize(element, vnode);
        return element;
    }
    function sync(node, spec) {
        const vnode = createVNode(spec, null);
        const context = realize(node, vnode);
        const {nodes} = context;
        if (nodes.length !== 1 || nodes[0] !== node) {
            throw new Error("Spec does not match the node");
        }
        return nodes[0];
    }

    const plugins = {
        createElement: createPluginsAPI(PLUGINS_CREATE_ELEMENT),
        setAttribute: createPluginsAPI(PLUGINS_SET_ATTRIBUTE)
    };

    class Connector {
        constructor() {
            this.counter = 0;
            this.port = chrome.runtime.connect({name: "ui"});
        }
        getRequestId() {
            return ++this.counter;
        }
        sendRequest(request, executor) {
            const id = this.getRequestId();
            return new Promise((resolve, reject) => {
                const listener = ({id: responseId, ...response}) => {
                    if (responseId === id) {
                        executor(response, resolve, reject);
                        this.port.onMessage.removeListener(listener);
                    }
                };
                this.port.onMessage.addListener(listener);
                this.port.postMessage({...request, id});
            });
        }
        getData() {
            return this.sendRequest({type: "get-data"}, ({data}, resolve) =>
                resolve(data)
            );
        }
        getActiveTabInfo() {
            return this.sendRequest(
                {type: "get-active-tab-info"},
                ({data}, resolve) => resolve(data)
            );
        }
        subscribeToChanges(callback) {
            const id = this.getRequestId();
            this.port.onMessage.addListener(({id: responseId, data}) => {
                if (responseId === id) {
                    callback(data);
                }
            });
            this.port.postMessage({type: "subscribe-to-changes", id});
        }
        enable() {
            this.port.postMessage({type: "enable"});
        }
        disable() {
            this.port.postMessage({type: "disable"});
        }
        setShortcut(command, shortcut) {
            this.port.postMessage({
                type: "set-shortcut",
                data: {command, shortcut}
            });
        }
        changeSettings(settings) {
            this.port.postMessage({type: "change-settings", data: settings});
        }
        setTheme(theme) {
            this.port.postMessage({type: "set-theme", data: theme});
        }
        toggleURL(url) {
            this.port.postMessage({type: "toggle-url", data: url});
        }
        markNewsAsRead(ids) {
            this.port.postMessage({type: "mark-news-as-read", data: ids});
        }
        loadConfig(options) {
            this.port.postMessage({type: "load-config", data: options});
        }
        applyDevDynamicThemeFixes(text) {
            return this.sendRequest(
                {type: "apply-dev-dynamic-theme-fixes", data: text},
                ({error}, resolve, reject) =>
                    error ? reject(error) : resolve()
            );
        }
        resetDevDynamicThemeFixes() {
            this.port.postMessage({type: "reset-dev-dynamic-theme-fixes"});
        }
        applyDevInversionFixes(text) {
            return this.sendRequest(
                {type: "apply-dev-inversion-fixes", data: text},
                ({error}, resolve, reject) =>
                    error ? reject(error) : resolve()
            );
        }
        resetDevInversionFixes() {
            this.port.postMessage({type: "reset-dev-inversion-fixes"});
        }
        applyDevStaticThemes(text) {
            return this.sendRequest(
                {type: "apply-dev-static-themes", data: text},
                ({error}, resolve, reject) =>
                    error ? reject(error) : resolve()
            );
        }
        resetDevStaticThemes() {
            this.port.postMessage({type: "reset-dev-static-themes"});
        }
        disconnect() {
            this.port.disconnect();
        }
    }

    function isIPV6(url) {
        const openingBracketIndex = url.indexOf("[");
        if (openingBracketIndex < 0) {
            return false;
        }
        const queryIndex = url.indexOf("?");
        if (queryIndex >= 0 && openingBracketIndex > queryIndex) {
            return false;
        }
        return true;
    }
    const ipV6HostRegex = /\[.*?\](\:\d+)?/;
    function compareIPV6(firstURL, secondURL) {
        const firstHost = firstURL.match(ipV6HostRegex)[0];
        const secondHost = secondURL.match(ipV6HostRegex)[0];
        return firstHost === secondHost;
    }

    function getURLHost(url) {
        return url.match(/^(.*?\/{2,3})?(.+?)(\/|$)/)[2];
    }
    function isURLInList(url, list) {
        for (let i = 0; i < list.length; i++) {
            if (isURLMatched(url, list[i])) {
                return true;
            }
        }
        return false;
    }
    function isURLMatched(url, urlTemplate) {
        const isFirstIPV6 = isIPV6(url);
        const isSecondIPV6 = isIPV6(urlTemplate);
        if (isFirstIPV6 && isSecondIPV6) {
            return compareIPV6(url, urlTemplate);
        } else if (!isSecondIPV6 && !isSecondIPV6) {
            const regex = createUrlRegex(urlTemplate);
            return Boolean(url.match(regex));
        } else {
            return false;
        }
    }
    function createUrlRegex(urlTemplate) {
        urlTemplate = urlTemplate.trim();
        const exactBeginning = urlTemplate[0] === "^";
        const exactEnding = urlTemplate[urlTemplate.length - 1] === "$";
        urlTemplate = urlTemplate
            .replace(/^\^/, "")
            .replace(/\$$/, "")
            .replace(/^.*?\/{2,3}/, "")
            .replace(/\?.*$/, "")
            .replace(/\/$/, "");
        let slashIndex;
        let beforeSlash;
        let afterSlash;
        if ((slashIndex = urlTemplate.indexOf("/")) >= 0) {
            beforeSlash = urlTemplate.substring(0, slashIndex);
            afterSlash = urlTemplate.replace("$", "").substring(slashIndex);
        } else {
            beforeSlash = urlTemplate.replace("$", "");
        }
        let result = exactBeginning
            ? "^(.*?\\:\\/{2,3})?"
            : "^(.*?\\:\\/{2,3})?([^/]*?\\.)?";
        const hostParts = beforeSlash.split(".");
        result += "(";
        for (let i = 0; i < hostParts.length; i++) {
            if (hostParts[i] === "*") {
                hostParts[i] = "[^\\.\\/]+?";
            }
        }
        result += hostParts.join("\\.");
        result += ")";
        if (afterSlash) {
            result += "(";
            result += afterSlash.replace("/", "\\/");
            result += ")";
        }
        result += exactEnding ? "(\\/?(\\?[^/]*?)?)$" : "(\\/?.*?)$";
        return new RegExp(result, "i");
    }
    function isPDF(url) {
        if (url.includes(".pdf")) {
            if (url.includes("?")) {
                url = url.substring(0, url.lastIndexOf("?"));
            }
            if (url.includes("#")) {
                url = url.substring(0, url.lastIndexOf("#"));
            }
            if (
                url.match(/(wikipedia|wikimedia).org/i) &&
                url.match(
                    /(wikipedia|wikimedia)\.org\/.*\/[a-z]+\:[^\:\/]+\.pdf/i
                )
            ) {
                return false;
            }
            if (url.endsWith(".pdf")) {
                for (let i = url.length; 0 < i; i--) {
                    if (url[i] === "=") {
                        return false;
                    } else if (url[i] === "/") {
                        return true;
                    }
                }
            } else {
                return false;
            }
        }
        return false;
    }
    function isURLEnabled(url, userSettings, {isProtected, isInDarkList}) {
        if (isProtected) {
            return false;
        }
        if (isPDF(url) && userSettings.enableForPDF) {
            return userSettings.enableForPDF;
        }
        const isURLInUserList = isURLInList(url, userSettings.siteList);
        if (userSettings.applyToListedOnly) {
            return isURLInUserList;
        }
        const isURLInEnabledList = isURLInList(
            url,
            userSettings.siteListEnabled
        );
        if (isURLInEnabledList && isInDarkList) {
            return true;
        }
        return !isInDarkList && !isURLInUserList;
    }

    function getMockData(override = {}) {
        return Object.assign(
            {
                isEnabled: true,
                isReady: true,
                settings: {
                    enabled: true,
                    theme: {
                        mode: 1,
                        brightness: 110,
                        contrast: 90,
                        grayscale: 20,
                        sepia: 10,
                        useFont: false,
                        fontFamily: "Segoe UI",
                        textStroke: 0,
                        engine: "cssFilter",
                        stylesheet: "",
                        scrollbarColor: "auto"
                    },
                    customThemes: [],
                    siteList: [],
                    siteListEnabled: [],
                    applyToListedOnly: false,
                    changeBrowserTheme: false,
                    enableForPDF: true,
                    notifyOfNews: false,
                    syncSettings: true,
                    automation: "",
                    time: {
                        activation: "18:00",
                        deactivation: "9:00"
                    },
                    location: {
                        latitude: 52.4237178,
                        longitude: 31.021786
                    }
                },
                fonts: [
                    "serif",
                    "sans-serif",
                    "monospace",
                    "cursive",
                    "fantasy",
                    "system-ui"
                ],
                news: [],
                shortcuts: {
                    addSite: "Alt+Shift+A",
                    toggle: "Alt+Shift+D"
                },
                devtools: {
                    dynamicFixesText: "",
                    filterFixesText: "",
                    staticThemesText: "",
                    hasCustomDynamicFixes: false,
                    hasCustomFilterFixes: false,
                    hasCustomStaticFixes: false
                }
            },
            override
        );
    }
    function getMockActiveTabInfo() {
        return {
            url: "https://darkreader.org/",
            isProtected: false,
            isInDarkList: false
        };
    }
    function createConnectorMock() {
        let listener = null;
        const data = getMockData();
        const tab = getMockActiveTabInfo();
        const connector = {
            getData() {
                return Promise.resolve(data);
            },
            getActiveTabInfo() {
                return Promise.resolve(tab);
            },
            subscribeToChanges(callback) {
                listener = callback;
            },
            changeSettings(settings) {
                Object.assign(data.settings, settings);
                listener(data);
            },
            setTheme(theme) {
                Object.assign(data.settings.theme, theme);
                listener(data);
            },
            setShortcut(command, shortcut) {
                Object.assign(data.shortcuts, {[command]: shortcut});
                listener(data);
            },
            toggleURL(url) {
                const pattern = getURLHost(url);
                const index = data.settings.siteList.indexOf(pattern);
                if (index >= 0) {
                    data.settings.siteList.splice(index, 1, pattern);
                } else {
                    data.settings.siteList.push(pattern);
                }
                listener(data);
            },
            markNewsAsRead(ids) {
                data.news
                    .filter(({id}) => ids.includes(id))
                    .forEach((news) => (news.read = true));
                listener(data);
            },
            disconnect() {}
        };
        return connector;
    }

    function connect() {
        if (typeof chrome === "undefined" || !chrome.extension) {
            return createConnectorMock();
        }
        return new Connector();
    }

    /* malevic@0.18.6 - Jul 15, 2020 */

    function withForms(type) {
        plugins.setAttribute.add(type, ({element, attr, value}) => {
            if (attr === "value" && element instanceof HTMLInputElement) {
                const text = (element.value = value == null ? "" : value);
                element.value = text;
                return true;
            }
            return null;
        });
        return type;
    }

    /* malevic@0.18.6 - Jul 15, 2020 */

    let currentUseStateFn = null;
    function useState(initialState) {
        if (!currentUseStateFn) {
            throw new Error("`useState()` should be called inside a component");
        }
        return currentUseStateFn(initialState);
    }
    function withState(type) {
        const Stateful = (props, ...children) => {
            const context = getComponentContext();
            const useState = (initial) => {
                if (!context) {
                    return {state: initial, setState: null};
                }
                const {store, refresh} = context;
                store.state = store.state || initial;
                const setState = (newState) => {
                    if (lock) {
                        throw new Error(
                            "Setting state during unboxing causes infinite loop"
                        );
                    }
                    store.state = Object.assign(
                        Object.assign({}, store.state),
                        newState
                    );
                    refresh();
                };
                return {
                    state: store.state,
                    setState
                };
            };
            let lock = true;
            const prevUseStateFn = currentUseStateFn;
            currentUseStateFn = useState;
            let result;
            try {
                result = type(props, ...children);
            } finally {
                currentUseStateFn = prevUseStateFn;
                lock = false;
            }
            return result;
        };
        return Stateful;
    }

    function isFirefox() {
        return navigator.userAgent.includes("Firefox");
    }
    function isVivaldi() {
        return navigator.userAgent.toLowerCase().includes("vivaldi");
    }
    function isYaBrowser() {
        return navigator.userAgent.toLowerCase().includes("yabrowser");
    }
    function isOpera() {
        const agent = navigator.userAgent.toLowerCase();
        return agent.includes("opr") || agent.includes("opera");
    }
    function isEdge() {
        return navigator.userAgent.includes("Edg");
    }
    function isWindows() {
        if (typeof navigator === "undefined") {
            return null;
        }
        return navigator.platform.toLowerCase().startsWith("win");
    }
    function isMacOS() {
        if (typeof navigator === "undefined") {
            return null;
        }
        return navigator.platform.toLowerCase().startsWith("mac");
    }
    function isMobile() {
        if (typeof navigator === "undefined") {
            return null;
        }
        return navigator.userAgent.toLowerCase().includes("mobile");
    }
    function getChromeVersion() {
        const agent = navigator.userAgent.toLowerCase();
        const m = agent.match(/chrom[e|ium]\/([^ ]+)/);
        if (m && m[1]) {
            return m[1];
        }
        return null;
    }
    function compareChromeVersions($a, $b) {
        const a = $a.split(".").map((x) => parseInt(x));
        const b = $b.split(".").map((x) => parseInt(x));
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return a[i] < b[i] ? -1 : 1;
            }
        }
        return 0;
    }

    function classes$1(...args) {
        const classes = [];
        args.filter((c) => Boolean(c)).forEach((c) => {
            if (typeof c === "string") {
                classes.push(c);
            } else if (typeof c === "object") {
                classes.push(
                    ...Object.keys(c).filter((key) => Boolean(c[key]))
                );
            }
        });
        return classes.join(" ");
    }
    function compose(type, ...wrappers) {
        return wrappers.reduce((t, w) => w(t), type);
    }
    function openFile(options, callback) {
        const input = document.createElement("input");
        input.type = "file";
        input.style.display = "none";
        if (options.extensions && options.extensions.length > 0) {
            input.accept = options.extensions.map((ext) => `.${ext}`).join(",");
        }
        const reader = new FileReader();
        reader.onloadend = () => callback(reader.result);
        input.onchange = () => {
            if (input.files[0]) {
                reader.readAsText(input.files[0]);
                document.body.removeChild(input);
            }
        };
        document.body.appendChild(input);
        input.click();
    }
    function saveFile(name, content) {
        if (isFirefox()) {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([content]));
            a.download = name;
            a.click();
        } else {
            chrome.runtime.sendMessage({
                type: "save-file",
                data: {name, content}
            });
        }
    }
    function throttle(callback) {
        let frameId = null;
        return (...args) => {
            if (!frameId) {
                callback(...args);
                frameId = requestAnimationFrame(() => (frameId = null));
            }
        };
    }
    function onSwipeStart(startEventObj, startHandler) {
        const isTouchEvent =
            typeof TouchEvent !== "undefined" &&
            startEventObj instanceof TouchEvent;
        const touchId = isTouchEvent
            ? startEventObj.changedTouches[0].identifier
            : null;
        const pointerMoveEvent = isTouchEvent ? "touchmove" : "mousemove";
        const pointerUpEvent = isTouchEvent ? "touchend" : "mouseup";
        if (!isTouchEvent) {
            startEventObj.preventDefault();
        }
        function getSwipeEventObject(e) {
            const {clientX, clientY} = isTouchEvent ? getTouch(e) : e;
            return {clientX, clientY};
        }
        const startSE = getSwipeEventObject(startEventObj);
        const {move: moveHandler, up: upHandler} = startHandler(
            startSE,
            startEventObj
        );
        function getTouch(e) {
            return Array.from(e.changedTouches).find(
                ({identifier: id}) => id === touchId
            );
        }
        const onPointerMove = throttle((e) => {
            const se = getSwipeEventObject(e);
            moveHandler(se, e);
        });
        function onPointerUp(e) {
            unsubscribe();
            const se = getSwipeEventObject(e);
            upHandler(se, e);
        }
        function unsubscribe() {
            window.removeEventListener(pointerMoveEvent, onPointerMove);
            window.removeEventListener(pointerUpEvent, onPointerUp);
        }
        window.addEventListener(pointerMoveEvent, onPointerMove, {
            passive: true
        });
        window.addEventListener(pointerUpEvent, onPointerUp, {passive: true});
    }
    function createSwipeHandler(startHandler) {
        return (e) => onSwipeStart(e, startHandler);
    }

    function toArray(x) {
        return Array.isArray(x) ? x : [x];
    }
    function mergeClass(cls, propsCls) {
        const normalized = toArray(cls).concat(toArray(propsCls));
        return classes$1(...normalized);
    }
    function omitAttrs(omit, attrs) {
        const result = {};
        Object.keys(attrs).forEach((key) => {
            if (omit.indexOf(key) < 0) {
                result[key] = attrs[key];
            }
        });
        return result;
    }

    function Button(props, ...children) {
        const cls = mergeClass("button", props.class);
        const attrs = omitAttrs(["class"], props);
        return m(
            "button",
            Object.assign({class: cls}, attrs),
            m("span", {class: "button__wrapper"}, children)
        );
    }

    function CheckBox(props, ...children) {
        const cls = mergeClass("checkbox", props.class);
        const attrs = omitAttrs(["class", "checked", "onchange"], props);
        const check = (domNode) => (domNode.checked = Boolean(props.checked));
        return m(
            "label",
            Object.assign({class: cls}, attrs),
            m("input", {
                class: "checkbox__input",
                type: "checkbox",
                checked: props.checked,
                onchange: props.onchange,
                onrender: check
            }),
            m("span", {class: "checkbox__checkmark"}),
            m("span", {class: "checkbox__content"}, children)
        );
    }

    function hslToRGB({h, s, l, a = 1}) {
        if (s === 0) {
            const [r, b, g] = [l, l, l].map((x) => Math.round(x * 255));
            return {r, g, b, a};
        }
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        const [r, g, b] = (h < 60
            ? [c, x, 0]
            : h < 120
            ? [x, c, 0]
            : h < 180
            ? [0, c, x]
            : h < 240
            ? [0, x, c]
            : h < 300
            ? [x, 0, c]
            : [c, 0, x]
        ).map((n) => Math.round((n + m) * 255));
        return {r, g, b, a};
    }
    function rgbToHSL({r: r255, g: g255, b: b255, a = 1}) {
        const r = r255 / 255;
        const g = g255 / 255;
        const b = b255 / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const c = max - min;
        const l = (max + min) / 2;
        if (c === 0) {
            return {h: 0, s: 0, l, a};
        }
        let h =
            (max === r
                ? ((g - b) / c) % 6
                : max === g
                ? (b - r) / c + 2
                : (r - g) / c + 4) * 60;
        if (h < 0) {
            h += 360;
        }
        const s = c / (1 - Math.abs(2 * l - 1));
        return {h, s, l, a};
    }
    function toFixed(n, digits = 0) {
        const fixed = n.toFixed(digits);
        if (digits === 0) {
            return fixed;
        }
        const dot = fixed.indexOf(".");
        if (dot >= 0) {
            const zerosMatch = fixed.match(/0+$/);
            if (zerosMatch) {
                if (zerosMatch.index === dot + 1) {
                    return fixed.substring(0, dot);
                }
                return fixed.substring(0, zerosMatch.index);
            }
        }
        return fixed;
    }
    function rgbToHexString({r, g, b, a}) {
        return `#${(a != null && a < 1
            ? [r, g, b, Math.round(a * 255)]
            : [r, g, b]
        )
            .map((x) => {
                return `${x < 16 ? "0" : ""}${x.toString(16)}`;
            })
            .join("")}`;
    }
    function hslToString(hsl) {
        const {h, s, l, a} = hsl;
        if (a != null && a < 1) {
            return `hsla(${toFixed(h)}, ${toFixed(s * 100)}%, ${toFixed(
                l * 100
            )}%, ${toFixed(a, 2)})`;
        }
        return `hsl(${toFixed(h)}, ${toFixed(s * 100)}%, ${toFixed(l * 100)}%)`;
    }
    const rgbMatch = /^rgba?\([^\(\)]+\)$/;
    const hslMatch = /^hsla?\([^\(\)]+\)$/;
    const hexMatch = /^#[0-9a-f]+$/i;
    function parse($color) {
        const c = $color.trim().toLowerCase();
        if (c.match(rgbMatch)) {
            return parseRGB(c);
        }
        if (c.match(hslMatch)) {
            return parseHSL(c);
        }
        if (c.match(hexMatch)) {
            return parseHex(c);
        }
        if (knownColors.has(c)) {
            return getColorByName(c);
        }
        if (systemColors.has(c)) {
            return getSystemColor(c);
        }
        if ($color === "transparent") {
            return {r: 0, g: 0, b: 0, a: 0};
        }
        throw new Error(`Unable to parse ${$color}`);
    }
    function getNumbersFromString(str, splitter, range, units) {
        const raw = str.split(splitter).filter((x) => x);
        const unitsList = Object.entries(units);
        const numbers = raw
            .map((r) => r.trim())
            .map((r, i) => {
                let n;
                const unit = unitsList.find(([u]) => r.endsWith(u));
                if (unit) {
                    n =
                        (parseFloat(r.substring(0, r.length - unit[0].length)) /
                            unit[1]) *
                        range[i];
                } else {
                    n = parseFloat(r);
                }
                if (range[i] > 1) {
                    return Math.round(n);
                }
                return n;
            });
        return numbers;
    }
    const rgbSplitter = /rgba?|\(|\)|\/|,|\s/gi;
    const rgbRange = [255, 255, 255, 1];
    const rgbUnits = {"%": 100};
    function parseRGB($rgb) {
        const [r, g, b, a = 1] = getNumbersFromString(
            $rgb,
            rgbSplitter,
            rgbRange,
            rgbUnits
        );
        return {r, g, b, a};
    }
    const hslSplitter = /hsla?|\(|\)|\/|,|\s/gi;
    const hslRange = [360, 1, 1, 1];
    const hslUnits = {"%": 100, "deg": 360, "rad": 2 * Math.PI, "turn": 1};
    function parseHSL($hsl) {
        const [h, s, l, a = 1] = getNumbersFromString(
            $hsl,
            hslSplitter,
            hslRange,
            hslUnits
        );
        return hslToRGB({h, s, l, a});
    }
    function parseHex($hex) {
        const h = $hex.substring(1);
        switch (h.length) {
            case 3:
            case 4: {
                const [r, g, b] = [0, 1, 2].map((i) =>
                    parseInt(`${h[i]}${h[i]}`, 16)
                );
                const a =
                    h.length === 3 ? 1 : parseInt(`${h[3]}${h[3]}`, 16) / 255;
                return {r, g, b, a};
            }
            case 6:
            case 8: {
                const [r, g, b] = [0, 2, 4].map((i) =>
                    parseInt(h.substring(i, i + 2), 16)
                );
                const a =
                    h.length === 6 ? 1 : parseInt(h.substring(6, 8), 16) / 255;
                return {r, g, b, a};
            }
        }
        throw new Error(`Unable to parse ${$hex}`);
    }
    function getColorByName($color) {
        const n = knownColors.get($color);
        return {
            r: (n >> 16) & 255,
            g: (n >> 8) & 255,
            b: (n >> 0) & 255,
            a: 1
        };
    }
    function getSystemColor($color) {
        const n = systemColors.get($color);
        return {
            r: (n >> 16) & 255,
            g: (n >> 8) & 255,
            b: (n >> 0) & 255,
            a: 1
        };
    }
    const knownColors = new Map(
        Object.entries({
            aliceblue: 0xf0f8ff,
            antiquewhite: 0xfaebd7,
            aqua: 0x00ffff,
            aquamarine: 0x7fffd4,
            azure: 0xf0ffff,
            beige: 0xf5f5dc,
            bisque: 0xffe4c4,
            black: 0x000000,
            blanchedalmond: 0xffebcd,
            blue: 0x0000ff,
            blueviolet: 0x8a2be2,
            brown: 0xa52a2a,
            burlywood: 0xdeb887,
            cadetblue: 0x5f9ea0,
            chartreuse: 0x7fff00,
            chocolate: 0xd2691e,
            coral: 0xff7f50,
            cornflowerblue: 0x6495ed,
            cornsilk: 0xfff8dc,
            crimson: 0xdc143c,
            cyan: 0x00ffff,
            darkblue: 0x00008b,
            darkcyan: 0x008b8b,
            darkgoldenrod: 0xb8860b,
            darkgray: 0xa9a9a9,
            darkgrey: 0xa9a9a9,
            darkgreen: 0x006400,
            darkkhaki: 0xbdb76b,
            darkmagenta: 0x8b008b,
            darkolivegreen: 0x556b2f,
            darkorange: 0xff8c00,
            darkorchid: 0x9932cc,
            darkred: 0x8b0000,
            darksalmon: 0xe9967a,
            darkseagreen: 0x8fbc8f,
            darkslateblue: 0x483d8b,
            darkslategray: 0x2f4f4f,
            darkslategrey: 0x2f4f4f,
            darkturquoise: 0x00ced1,
            darkviolet: 0x9400d3,
            deeppink: 0xff1493,
            deepskyblue: 0x00bfff,
            dimgray: 0x696969,
            dimgrey: 0x696969,
            dodgerblue: 0x1e90ff,
            firebrick: 0xb22222,
            floralwhite: 0xfffaf0,
            forestgreen: 0x228b22,
            fuchsia: 0xff00ff,
            gainsboro: 0xdcdcdc,
            ghostwhite: 0xf8f8ff,
            gold: 0xffd700,
            goldenrod: 0xdaa520,
            gray: 0x808080,
            grey: 0x808080,
            green: 0x008000,
            greenyellow: 0xadff2f,
            honeydew: 0xf0fff0,
            hotpink: 0xff69b4,
            indianred: 0xcd5c5c,
            indigo: 0x4b0082,
            ivory: 0xfffff0,
            khaki: 0xf0e68c,
            lavender: 0xe6e6fa,
            lavenderblush: 0xfff0f5,
            lawngreen: 0x7cfc00,
            lemonchiffon: 0xfffacd,
            lightblue: 0xadd8e6,
            lightcoral: 0xf08080,
            lightcyan: 0xe0ffff,
            lightgoldenrodyellow: 0xfafad2,
            lightgray: 0xd3d3d3,
            lightgrey: 0xd3d3d3,
            lightgreen: 0x90ee90,
            lightpink: 0xffb6c1,
            lightsalmon: 0xffa07a,
            lightseagreen: 0x20b2aa,
            lightskyblue: 0x87cefa,
            lightslategray: 0x778899,
            lightslategrey: 0x778899,
            lightsteelblue: 0xb0c4de,
            lightyellow: 0xffffe0,
            lime: 0x00ff00,
            limegreen: 0x32cd32,
            linen: 0xfaf0e6,
            magenta: 0xff00ff,
            maroon: 0x800000,
            mediumaquamarine: 0x66cdaa,
            mediumblue: 0x0000cd,
            mediumorchid: 0xba55d3,
            mediumpurple: 0x9370db,
            mediumseagreen: 0x3cb371,
            mediumslateblue: 0x7b68ee,
            mediumspringgreen: 0x00fa9a,
            mediumturquoise: 0x48d1cc,
            mediumvioletred: 0xc71585,
            midnightblue: 0x191970,
            mintcream: 0xf5fffa,
            mistyrose: 0xffe4e1,
            moccasin: 0xffe4b5,
            navajowhite: 0xffdead,
            navy: 0x000080,
            oldlace: 0xfdf5e6,
            olive: 0x808000,
            olivedrab: 0x6b8e23,
            orange: 0xffa500,
            orangered: 0xff4500,
            orchid: 0xda70d6,
            palegoldenrod: 0xeee8aa,
            palegreen: 0x98fb98,
            paleturquoise: 0xafeeee,
            palevioletred: 0xdb7093,
            papayawhip: 0xffefd5,
            peachpuff: 0xffdab9,
            peru: 0xcd853f,
            pink: 0xffc0cb,
            plum: 0xdda0dd,
            powderblue: 0xb0e0e6,
            purple: 0x800080,
            rebeccapurple: 0x663399,
            red: 0xff0000,
            rosybrown: 0xbc8f8f,
            royalblue: 0x4169e1,
            saddlebrown: 0x8b4513,
            salmon: 0xfa8072,
            sandybrown: 0xf4a460,
            seagreen: 0x2e8b57,
            seashell: 0xfff5ee,
            sienna: 0xa0522d,
            silver: 0xc0c0c0,
            skyblue: 0x87ceeb,
            slateblue: 0x6a5acd,
            slategray: 0x708090,
            slategrey: 0x708090,
            snow: 0xfffafa,
            springgreen: 0x00ff7f,
            steelblue: 0x4682b4,
            tan: 0xd2b48c,
            teal: 0x008080,
            thistle: 0xd8bfd8,
            tomato: 0xff6347,
            turquoise: 0x40e0d0,
            violet: 0xee82ee,
            wheat: 0xf5deb3,
            white: 0xffffff,
            whitesmoke: 0xf5f5f5,
            yellow: 0xffff00,
            yellowgreen: 0x9acd32
        })
    );
    const systemColors = new Map(
        Object.entries({
            "ActiveBorder": 0x3b99fc,
            "ActiveCaption": 0x000000,
            "AppWorkspace": 0xaaaaaa,
            "Background": 0x6363ce,
            "ButtonFace": 0xffffff,
            "ButtonHighlight": 0xe9e9e9,
            "ButtonShadow": 0x9fa09f,
            "ButtonText": 0x000000,
            "CaptionText": 0x000000,
            "GrayText": 0x7f7f7f,
            "Highlight": 0xb2d7ff,
            "HighlightText": 0x000000,
            "InactiveBorder": 0xffffff,
            "InactiveCaption": 0xffffff,
            "InactiveCaptionText": 0x000000,
            "InfoBackground": 0xfbfcc5,
            "InfoText": 0x000000,
            "Menu": 0xf6f6f6,
            "MenuText": 0xffffff,
            "Scrollbar": 0xaaaaaa,
            "ThreeDDarkShadow": 0x000000,
            "ThreeDFace": 0xc0c0c0,
            "ThreeDHighlight": 0xffffff,
            "ThreeDLightShadow": 0xffffff,
            "ThreeDShadow": 0x000000,
            "Window": 0xececec,
            "WindowFrame": 0xaaaaaa,
            "WindowText": 0x000000,
            "-webkit-focus-ring-color": 0xe59700
        }).map(([key, value]) => [key.toLowerCase(), value])
    );

    function TextBox(props) {
        const cls = mergeClass("textbox", props.class);
        const attrs = omitAttrs(["class", "type"], props);
        return m("input", Object.assign({class: cls, type: "text"}, attrs));
    }

    function scale(x, inLow, inHigh, outLow, outHigh) {
        return ((x - inLow) * (outHigh - outLow)) / (inHigh - inLow) + outLow;
    }
    function clamp(x, min, max) {
        return Math.min(max, Math.max(min, x));
    }

    function rgbToHSB({r, g, b}) {
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        return {
            h: rgbToHSL({r, g, b}).h,
            s: max === 0 ? 0 : 1 - min / max,
            b: max / 255
        };
    }
    function hsbToRGB({h: hue, s: sat, b: br}) {
        let c;
        if (hue < 60) {
            c = [1, hue / 60, 0];
        } else if (hue < 120) {
            c = [(120 - hue) / 60, 1, 0];
        } else if (hue < 180) {
            c = [0, 1, (hue - 120) / 60];
        } else if (hue < 240) {
            c = [0, (240 - hue) / 60, 1];
        } else if (hue < 300) {
            c = [(hue - 240) / 60, 0, 1];
        } else {
            c = [1, 0, (360 - hue) / 60];
        }
        const max = Math.max(...c);
        const [r, g, b] = c
            .map((v) => v + (max - v) * (1 - sat))
            .map((v) => v * br)
            .map((v) => Math.round(v * 255));
        return {r, g, b, a: 1};
    }
    function hsbToString(hsb) {
        const rgb = hsbToRGB(hsb);
        return rgbToHexString(rgb);
    }
    function render$1(canvas, getPixel) {
        const {width, height} = canvas;
        const context = canvas.getContext("2d");
        const imageData = context.getImageData(0, 0, width, height);
        const d = imageData.data;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = 4 * (y * width + x);
                const c = getPixel(x, y);
                for (let j = 0; j < 4; j++) {
                    d[i + j] = c[j];
                }
            }
        }
        context.putImageData(imageData, 0, 0);
    }
    function renderHue(canvas) {
        const {height} = canvas;
        render$1(canvas, (_, y) => {
            const hue = scale(y, 0, height, 0, 360);
            const {r, g, b} = hsbToRGB({h: hue, s: 1, b: 1});
            return new Uint8ClampedArray([r, g, b, 255]);
        });
    }
    function renderSB(hue, canvas) {
        const {width, height} = canvas;
        render$1(canvas, (x, y) => {
            const sat = scale(x, 0, width - 1, 0, 1);
            const br = scale(y, 0, height - 1, 1, 0);
            const {r, g, b} = hsbToRGB({h: hue, s: sat, b: br});
            return new Uint8ClampedArray([r, g, b, 255]);
        });
    }
    function HSBPicker(props) {
        const context = getComponentContext();
        const store = context.store;
        store.activeChangeHandler = props.onChange;
        const prevColor = context.prev && context.prev.props.color;
        const prevActiveColor = store.activeHSB
            ? hsbToString(store.activeHSB)
            : null;
        const didColorChange =
            props.color !== prevColor && props.color !== prevActiveColor;
        let activeHSB;
        if (didColorChange) {
            const rgb = parse(props.color);
            activeHSB = rgbToHSB(rgb);
            store.activeHSB = activeHSB;
        } else {
            activeHSB = store.activeHSB;
        }
        function onSBCanvasRender(canvas) {
            const hue = activeHSB.h;
            const prevHue = prevColor && rgbToHSB(parse(prevColor)).h;
            if (hue === prevHue) {
                return;
            }
            renderSB(hue, canvas);
        }
        function onHueCanvasCreate(canvas) {
            renderHue(canvas);
        }
        function createHSBSwipeHandler(getEventHSB) {
            return createSwipeHandler((startEvt, startNativeEvt) => {
                const rect = startNativeEvt.currentTarget.getBoundingClientRect();
                function onPointerMove(e) {
                    store.activeHSB = getEventHSB({...e, rect});
                    props.onColorPreview(hsbToString(store.activeHSB));
                    context.refresh();
                }
                function onPointerUp(e) {
                    const hsb = getEventHSB({...e, rect});
                    store.activeHSB = hsb;
                    props.onChange(hsbToString(hsb));
                }
                store.activeHSB = getEventHSB({...startEvt, rect});
                context.refresh();
                return {
                    move: onPointerMove,
                    up: onPointerUp
                };
            });
        }
        const onSBPointerDown = createHSBSwipeHandler(
            ({clientX, clientY, rect}) => {
                const sat = clamp((clientX - rect.left) / rect.width, 0, 1);
                const br = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
                return {...activeHSB, s: sat, b: br};
            }
        );
        const onHuePointerDown = createHSBSwipeHandler(({clientY, rect}) => {
            const hue = clamp((clientY - rect.top) / rect.height, 0, 1) * 360;
            return {...activeHSB, h: hue};
        });
        const hueCursorStyle = {
            "background-color": hslToString({
                h: activeHSB.h,
                s: 1,
                l: 0.5,
                a: 1
            }),
            "left": "0%",
            "top": `${(activeHSB.h / 360) * 100}%`
        };
        const sbCursorStyle = {
            "background-color": rgbToHexString(hsbToRGB(activeHSB)),
            "left": `${activeHSB.s * 100}%`,
            "top": `${(1 - activeHSB.b) * 100}%`
        };
        return m(
            "span",
            {class: "hsb-picker"},
            m(
                "span",
                {
                    class: "hsb-picker__sb-container",
                    onmousedown: onSBPointerDown,
                    onupdate: (el) => {
                        if (store.sbTouchStartHandler) {
                            el.removeEventListener(
                                "touchstart",
                                store.sbTouchStartHandler
                            );
                        }
                        el.addEventListener("touchstart", onSBPointerDown, {
                            passive: true
                        });
                        store.sbTouchStartHandler = onSBPointerDown;
                    }
                },
                m("canvas", {
                    class: "hsb-picker__sb-canvas",
                    onrender: onSBCanvasRender
                }),
                m("span", {
                    class: "hsb-picker__sb-cursor",
                    style: sbCursorStyle
                })
            ),
            m(
                "span",
                {
                    class: "hsb-picker__hue-container",
                    onmousedown: onHuePointerDown,
                    onupdate: (el) => {
                        if (store.hueTouchStartHandler) {
                            el.removeEventListener(
                                "touchstart",
                                store.hueTouchStartHandler
                            );
                        }
                        el.addEventListener("touchstart", onHuePointerDown, {
                            passive: true
                        });
                        store.hueTouchStartHandler = onHuePointerDown;
                    }
                },
                m("canvas", {
                    class: "hsb-picker__hue-canvas",
                    oncreate: onHueCanvasCreate
                }),
                m("span", {
                    class: "hsb-picker__hue-cursor",
                    style: hueCursorStyle
                })
            )
        );
    }

    function isValidColor(color) {
        try {
            parse(color);
            return true;
        } catch (err) {
            return false;
        }
    }
    const colorPickerFocuses = new WeakMap();
    function focusColorPicker(node) {
        const focus = colorPickerFocuses.get(node);
        focus();
    }
    function ColorPicker(props) {
        const context = getComponentContext();
        context.onRender((node) => colorPickerFocuses.set(node, focus));
        const store = context.store;
        const isColorValid = isValidColor(props.color);
        function onColorPreview(previewColor) {
            store.previewNode.style.backgroundColor = previewColor;
            store.textBoxNode.value = previewColor;
            store.textBoxNode.blur();
        }
        function onColorChange(rawValue) {
            const value = rawValue.trim();
            if (isValidColor(value)) {
                props.onChange(value);
            } else {
                props.onChange(props.color);
            }
        }
        function focus() {
            if (store.isFocused) {
                return;
            }
            store.isFocused = true;
            context.refresh();
            window.addEventListener("mousedown", onOuterClick);
        }
        function blur() {
            if (!store.isFocused) {
                return;
            }
            window.removeEventListener("mousedown", onOuterClick);
            store.isFocused = false;
            context.refresh();
        }
        function toggleFocus() {
            if (store.isFocused) {
                blur();
            } else {
                focus();
            }
        }
        function onOuterClick(e) {
            if (!e.composedPath().some((el) => el === context.node)) {
                blur();
            }
        }
        const textBox = m(TextBox, {
            class: "color-picker__input",
            onrender: (el) => {
                store.textBoxNode = el;
                store.textBoxNode.value = isColorValid ? props.color : "";
            },
            onkeypress: (e) => {
                const input = e.target;
                if (e.key === "Enter") {
                    const {value} = input;
                    onColorChange(value);
                    blur();
                    onColorPreview(value);
                }
            },
            onfocus: focus
        });
        const previewElement = m("span", {
            class: "color-picker__preview",
            onclick: toggleFocus,
            onrender: (el) => {
                store.previewNode = el;
                el.style.backgroundColor = isColorValid
                    ? props.color
                    : "transparent";
            }
        });
        const resetButton = props.canReset
            ? m("span", {
                  role: "button",
                  class: "color-picker__reset",
                  onclick: () => {
                      props.onReset();
                      blur();
                  }
              })
            : null;
        const textBoxLine = m(
            "span",
            {class: "color-picker__textbox-line"},
            textBox,
            previewElement,
            resetButton
        );
        const hsbLine = isColorValid
            ? m(
                  "span",
                  {class: "color-picker__hsb-line"},
                  m(HSBPicker, {
                      color: props.color,
                      onChange: onColorChange,
                      onColorPreview: onColorPreview
                  })
              )
            : null;
        return m(
            "span",
            {
                class: [
                    "color-picker",
                    store.isFocused && "color-picker--focused",
                    props.class
                ]
            },
            m("span", {class: "color-picker__wrapper"}, textBoxLine, hsbLine)
        );
    }
    var ColorPicker$1 = Object.assign(ColorPicker, {focus: focusColorPicker});

    function DropDown(props) {
        const context = getComponentContext();
        const store = context.store;
        if (context.prev) {
            const currOptions = props.options.map((o) => o.id);
            const prevOptions = context.prev.props.options.map((o) => o.id);
            if (
                currOptions.length !== prevOptions.length ||
                currOptions.some((o, i) => o !== prevOptions[i])
            ) {
                store.isOpen = false;
            }
        }
        function saveListNode(el) {
            store.listNode = el;
        }
        function saveSelectedNode(el) {
            store.selectedNode = el;
        }
        function onSelectedClick() {
            store.isOpen = !store.isOpen;
            context.refresh();
            if (store.isOpen) {
                const onOuterClick = (e) => {
                    window.removeEventListener(
                        "mousedown",
                        onOuterClick,
                        false
                    );
                    const listRect = store.listNode.getBoundingClientRect();
                    const ex = e.clientX;
                    const ey = e.clientY;
                    if (
                        ex < listRect.left ||
                        ex > listRect.right ||
                        ey < listRect.top ||
                        ey > listRect.bottom
                    ) {
                        store.isOpen = false;
                        context.refresh();
                    }
                };
                window.addEventListener("mousedown", onOuterClick, false);
            }
        }
        function createListItem(value) {
            return m(
                "span",
                {
                    class: {
                        "dropdown__list__item": true,
                        "dropdown__list__item--selected":
                            value.id === props.selected,
                        [props.class]: props.class != null
                    },
                    onclick: () => {
                        store.isOpen = false;
                        context.refresh();
                        props.onChange(value.id);
                    }
                },
                value.content
            );
        }
        const selectedContent = props.options.find(
            (value) => value.id === props.selected
        ).content;
        return m(
            "span",
            {
                class: {
                    "dropdown": true,
                    "dropdown--open": store.isOpen,
                    [props.class]: Boolean(props.class)
                }
            },
            m(
                "span",
                {class: "dropdown__list", oncreate: saveListNode},
                props.options
                    .slice()
                    .sort((a, b) =>
                        a.id === props.selected
                            ? -1
                            : b.id === props.selected
                            ? 1
                            : 0
                    )
                    .map(createListItem)
            ),
            m(
                "span",
                {
                    class: "dropdown__selected",
                    oncreate: saveSelectedNode,
                    onclick: onSelectedClick
                },
                m("span", {class: "dropdown__selected__text"}, selectedContent)
            )
        );
    }

    function ColorDropDown(props) {
        const context = getComponentContext();
        const store = context.store;
        const labels = {
            DEFAULT: "Default",
            AUTO: "Auto",
            CUSTOM: "Custom"
        };
        const dropDownOptions = [
            props.hasDefaultOption
                ? {id: "default", content: labels.DEFAULT}
                : null,
            props.hasAutoOption ? {id: "auto", content: labels.AUTO} : null,
            {id: "custom", content: labels.CUSTOM}
        ].filter((v) => v);
        const selectedDropDownValue =
            props.value === ""
                ? "default"
                : props.value === "auto"
                ? "auto"
                : "custom";
        function onDropDownChange(value) {
            const result = {
                default: "",
                auto: "auto",
                custom: props.colorSuggestion
            }[value];
            props.onChange(result);
        }
        let isPickerVisible;
        try {
            parse(props.value);
            isPickerVisible = true;
        } catch (err) {
            isPickerVisible = false;
        }
        const prevValue = context.prev ? context.prev.props.value : null;
        const shouldFocusOnPicker =
            props.value !== "" &&
            props.value !== "auto" &&
            prevValue != null &&
            (prevValue === "" || prevValue === "auto");
        function onRootRender(root) {
            if (shouldFocusOnPicker) {
                const pickerNode = root.querySelector(
                    ".color-dropdown__picker"
                );
                ColorPicker$1.focus(pickerNode);
            }
        }
        return m(
            "span",
            {
                class: {
                    "color-dropdown": true,
                    "color-dropdown--open": store.isOpen,
                    [props.class]: Boolean(props.class)
                },
                onrender: onRootRender
            },
            m(DropDown, {
                class: "color-dropdown__options",
                options: dropDownOptions,
                selected: selectedDropDownValue,
                onChange: onDropDownChange
            }),
            m(ColorPicker$1, {
                class: {
                    "color-dropdown__picker": true,
                    "color-dropdown__picker--hidden": !isPickerVisible
                },
                color: props.value,
                onChange: props.onChange,
                canReset: true,
                onReset: props.onReset
            })
        );
    }

    const DEFAULT_OVERLAY_KEY = Symbol();
    const overlayNodes = new Map();
    const clickListeners = new WeakMap();
    function getOverlayDOMNode(key) {
        if (key == null) {
            key = DEFAULT_OVERLAY_KEY;
        }
        if (!overlayNodes.has(key)) {
            const node = document.createElement("div");
            node.classList.add("overlay");
            node.addEventListener("click", (e) => {
                if (clickListeners.has(node) && e.currentTarget === node) {
                    const listener = clickListeners.get(node);
                    listener();
                }
            });
            overlayNodes.set(key, node);
        }
        return overlayNodes.get(key);
    }
    function Overlay(props) {
        return getOverlayDOMNode(props.key);
    }
    function Portal(props, ...content) {
        const context = getComponentContext();
        context.onRender(() => {
            const node = getOverlayDOMNode(props.key);
            if (props.onOuterClick) {
                clickListeners.set(node, props.onOuterClick);
            } else {
                clickListeners.delete(node);
            }
            render(node, content);
        });
        context.onRemove(() => {
            const container = getOverlayDOMNode(props.key);
            render(container, null);
        });
        return context.leave();
    }
    var Overlay$1 = Object.assign(Overlay, {Portal});

    function MessageBox(props) {
        return m(
            Overlay$1.Portal,
            {key: props.portalKey, onOuterClick: props.onCancel},
            m(
                "div",
                {class: "message-box"},
                m("label", {class: "message-box__caption"}, props.caption),
                m(
                    "div",
                    {class: "message-box__buttons"},
                    m(
                        Button,
                        {
                            class: "message-box__button message-box__button-ok",
                            onclick: props.onOK
                        },
                        "OK"
                    ),
                    m(
                        Button,
                        {
                            class:
                                "message-box__button message-box__button-cancel",
                            onclick: props.onCancel
                        },
                        "Cancel"
                    )
                )
            )
        );
    }

    function MultiSwitch(props, ...children) {
        return m(
            "span",
            {class: ["multi-switch", props.class]},
            m("span", {
                class: "multi-switch__highlight",
                style: {
                    left: `${
                        (props.options.indexOf(props.value) /
                            props.options.length) *
                        100
                    }%`,
                    width: `${(1 / props.options.length) * 100}%`
                }
            }),
            props.options.map((option) =>
                m(
                    "span",
                    {
                        class: {
                            "multi-switch__option": true,
                            "multi-switch__option--selected":
                                option === props.value
                        },
                        onclick: () =>
                            option !== props.value && props.onChange(option)
                    },
                    option
                )
            ),
            children
        );
    }

    function ResetButton(props, ...content) {
        return m(
            Button,
            {class: ["nav-button", props.class], onclick: props.onClick},
            m("span", {class: "nav-button__content"}, content)
        );
    }

    function ResetButton$1(props, ...content) {
        return m(
            Button,
            {class: "reset-button", onclick: props.onClick},
            m(
                "span",
                {class: "reset-button__content"},
                m("span", {class: "reset-button__icon"}),
                content
            )
        );
    }

    function VirtualScroll(props) {
        if (props.items.length === 0) {
            return props.root;
        }
        const {store} = getComponentContext();
        function renderContent(root, scrollToIndex) {
            if (store.itemHeight == null) {
                const tempItem = {
                    ...props.items[0],
                    props: {
                        ...props.items[0].props,
                        oncreate: null,
                        onupdate: null,
                        onrender: null
                    }
                };
                const tempNode = render(root, tempItem).firstElementChild;
                store.itemHeight = tempNode.getBoundingClientRect().height;
            }
            const {itemHeight} = store;
            const wrapper = render(
                root,
                m("div", {
                    style: {
                        flex: "none",
                        height: `${props.items.length * itemHeight}px`,
                        overflow: "hidden",
                        position: "relative"
                    }
                })
            ).firstElementChild;
            if (scrollToIndex >= 0) {
                root.scrollTop = scrollToIndex * itemHeight;
            }
            const containerHeight =
                document.documentElement.clientHeight -
                root.getBoundingClientRect().top;
            let focusedIndex = -1;
            if (document.activeElement) {
                let current = document.activeElement;
                while (current && current.parentElement !== wrapper) {
                    current = current.parentElement;
                }
                if (current) {
                    focusedIndex = store.nodesIndices.get(current);
                }
            }
            store.nodesIndices = store.nodesIndices || new WeakMap();
            const saveNodeIndex = (node, index) =>
                store.nodesIndices.set(node, index);
            const items = props.items
                .map((item, index) => {
                    return {item, index};
                })
                .filter(({index}) => {
                    const eTop = index * itemHeight;
                    const eBottom = (index + 1) * itemHeight;
                    const rTop = root.scrollTop;
                    const rBottom = root.scrollTop + containerHeight;
                    const isTopBoundVisible = eTop >= rTop && eTop <= rBottom;
                    const isBottomBoundVisible =
                        eBottom >= rTop && eBottom <= rBottom;
                    return (
                        isTopBoundVisible ||
                        isBottomBoundVisible ||
                        focusedIndex === index
                    );
                })
                .map(({item, index}) =>
                    m(
                        "div",
                        {
                            key: index,
                            onrender: (node) => saveNodeIndex(node, index),
                            style: {
                                left: "0",
                                position: "absolute",
                                top: `${index * itemHeight}px`,
                                width: "100%"
                            }
                        },
                        item
                    )
                );
            render(wrapper, items);
        }
        let rootNode;
        let prevScrollTop;
        const rootDidMount = props.root.props.oncreate;
        const rootDidUpdate = props.root.props.onupdate;
        const rootDidRender = props.root.props.onrender;
        return {
            ...props.root,
            props: {
                ...props.root.props,
                oncreate: rootDidMount,
                onupdate: rootDidUpdate,
                onrender: (node) => {
                    rootNode = node;
                    rootDidRender && rootDidRender(rootNode);
                    renderContent(
                        rootNode,
                        isNaN(props.scrollToIndex) ? -1 : props.scrollToIndex
                    );
                },
                onscroll: () => {
                    if (rootNode.scrollTop === prevScrollTop) {
                        return;
                    }
                    prevScrollTop = rootNode.scrollTop;
                    renderContent(rootNode, -1);
                }
            },
            children: []
        };
    }

    function Select(props) {
        const {state, setState} = useState({
            isExpanded: false,
            focusedIndex: null
        });
        const values = Object.keys(props.options);
        const {store} = getComponentContext();
        const valueNodes = store.valueNodes || (store.valueNodes = new Map());
        const nodesValues =
            store.nodesValues || (store.nodesValues = new WeakMap());
        function onRender(node) {
            store.rootNode = node;
        }
        function onOuterClick(e) {
            const r = store.rootNode.getBoundingClientRect();
            if (
                e.clientX < r.left ||
                e.clientX > r.right ||
                e.clientY < r.top ||
                e.clientY > r.bottom
            ) {
                window.removeEventListener("click", onOuterClick);
                collapseList();
            }
        }
        function onTextInput(e) {
            const text = e.target.value.toLowerCase().trim();
            expandList();
            values.some((value) => {
                if (value.toLowerCase().indexOf(text) === 0) {
                    scrollToValue(value);
                    return true;
                }
            });
        }
        function onKeyPress(e) {
            const input = e.target;
            if (e.key === "Enter") {
                const value = input.value;
                input.blur();
                collapseList();
                props.onChange(value);
            }
        }
        function scrollToValue(value) {
            setState({focusedIndex: values.indexOf(value)});
        }
        function onExpandClick() {
            if (state.isExpanded) {
                collapseList();
            } else {
                expandList();
            }
        }
        function expandList() {
            setState({isExpanded: true});
            scrollToValue(props.value);
            window.addEventListener("click", onOuterClick);
        }
        function collapseList() {
            setState({isExpanded: false});
        }
        function onSelectOption(e) {
            let current = e.target;
            while (current && !nodesValues.has(current)) {
                current = current.parentElement;
            }
            if (current) {
                const value = nodesValues.get(current);
                props.onChange(value);
            }
            collapseList();
        }
        function saveValueNode(value, domNode) {
            valueNodes.set(value, domNode);
            nodesValues.set(domNode, value);
        }
        function removeValueNode(value) {
            const el = valueNodes.get(value);
            valueNodes.delete(value);
            nodesValues.delete(el);
        }
        return m(
            "span",
            {
                class: [
                    "select",
                    state.isExpanded && "select--expanded",
                    props.class
                ],
                onrender: onRender
            },
            m(
                "span",
                {class: "select__line"},
                m(TextBox, {
                    class: "select__textbox",
                    value: props.value,
                    oninput: onTextInput,
                    onkeypress: onKeyPress
                }),
                m(
                    Button,
                    {class: "select__expand", onclick: onExpandClick},
                    m("span", {class: "select__expand__icon"})
                )
            ),
            m(VirtualScroll, {
                root: m("span", {
                    class: {
                        "select__list": true,
                        "select__list--expanded": state.isExpanded,
                        "select__list--short":
                            Object.keys(props.options).length <= 7
                    },
                    onclick: onSelectOption
                }),
                items: Object.entries(props.options).map(([value, content]) =>
                    m(
                        "span",
                        {
                            class: "select__option",
                            data: value,
                            onrender: (domNode) =>
                                saveValueNode(value, domNode),
                            onremove: () => removeValueNode(value)
                        },
                        content
                    )
                ),
                scrollToIndex: state.focusedIndex
            })
        );
    }
    var Select$1 = withState(Select);

    function ShortcutLink(props) {
        const cls = mergeClass("shortcut", props.class);
        const shortcut = props.shortcuts[props.commandName];
        const shortcutMessage = props.textTemplate(shortcut);
        let enteringShortcutInProgress = false;
        function startEnteringShortcut(node) {
            if (enteringShortcutInProgress) {
                return;
            }
            enteringShortcutInProgress = true;
            const initialText = node.textContent;
            node.textContent = "...⌨";
            function onKeyDown(e) {
                e.preventDefault();
                const ctrl = e.ctrlKey;
                const alt = e.altKey;
                const command = e.metaKey;
                const shift = e.shiftKey;
                let key = null;
                if (e.code.startsWith("Key")) {
                    key = e.code.substring(3);
                } else if (e.code.startsWith("Digit")) {
                    key = e.code.substring(5);
                }
                const shortcut = `${
                    ctrl ? "Ctrl+" : alt ? "Alt+" : command ? "Command+" : ""
                }${shift ? "Shift+" : ""}${key ? key : ""}`;
                node.textContent = shortcut;
                if ((ctrl || alt || command || shift) && key) {
                    removeListeners();
                    props.onSetShortcut(shortcut);
                    node.blur();
                    setTimeout(() => {
                        enteringShortcutInProgress = false;
                        node.classList.remove("shortcut--edit");
                        node.textContent = props.textTemplate(shortcut);
                    }, 500);
                }
            }
            function onBlur() {
                removeListeners();
                node.classList.remove("shortcut--edit");
                node.textContent = initialText;
                enteringShortcutInProgress = false;
            }
            function removeListeners() {
                window.removeEventListener("keydown", onKeyDown, true);
                window.removeEventListener("blur", onBlur, true);
            }
            window.addEventListener("keydown", onKeyDown, true);
            window.addEventListener("blur", onBlur, true);
            node.classList.add("shortcut--edit");
        }
        function onClick(e) {
            e.preventDefault();
            if (isFirefox()) {
                startEnteringShortcut(e.target);
                return;
            }
            chrome.tabs.create({
                url: `chrome://extensions/configureCommands#command-${chrome.runtime.id}-${props.commandName}`,
                active: true
            });
        }
        function onRender(node) {
            node.textContent = shortcutMessage;
        }
        return m("a", {
            class: cls,
            href: "#",
            onclick: onClick,
            oncreate: onRender
        });
    }

    function clamp$1(x, min, max) {
        return Math.min(max, Math.max(min, x));
    }
    function scale$1(x, inLow, inHigh, outLow, outHigh) {
        return ((x - inLow) / (inHigh - inLow)) * (outHigh - outLow) + outLow;
    }
    function stickToStep(x, step) {
        const s = Math.round(x / step) * step;
        const exp = Math.floor(Math.log10(step));
        if (exp >= 0) {
            const m = Math.pow(10, exp);
            return Math.round(s / m) * m;
        } else {
            const m = Math.pow(10, -exp);
            return Math.round(s * m) / m;
        }
    }
    function Slider(props) {
        const context = getComponentContext();
        const store = context.store;
        store.activeProps = props;
        function onRootCreate(rootNode) {
            rootNode.addEventListener("touchstart", onPointerDown, {
                passive: true
            });
        }
        function saveTrackNode(el) {
            store.trackNode = el;
        }
        function getTrackNode() {
            return store.trackNode;
        }
        function saveThumbNode(el) {
            store.thumbNode = el;
        }
        function getThumbNode() {
            return store.thumbNode;
        }
        function onPointerDown(startEvt) {
            if (store.isActive) {
                return;
            }
            const {getClientX, pointerMoveEvent, pointerUpEvent} = (() => {
                const isTouchEvent =
                    typeof TouchEvent !== "undefined" &&
                    startEvt instanceof TouchEvent;
                const touchId = isTouchEvent
                    ? startEvt.changedTouches[0].identifier
                    : null;
                function getTouch(e) {
                    const find = (touches) =>
                        Array.from(touches).find(
                            (t) => t.identifier === touchId
                        );
                    return find(e.changedTouches) || find(e.touches);
                }
                function getClientX(e) {
                    const {clientX} = isTouchEvent ? getTouch(e) : e;
                    return clientX;
                }
                const pointerMoveEvent = isTouchEvent
                    ? "touchmove"
                    : "mousemove";
                const pointerUpEvent = isTouchEvent ? "touchend" : "mouseup";
                return {getClientX, pointerMoveEvent, pointerUpEvent};
            })();
            const dx = (() => {
                const thumbRect = getThumbNode().getBoundingClientRect();
                const startClientX = getClientX(startEvt);
                const isThumbPressed =
                    startClientX >= thumbRect.left &&
                    startClientX <= thumbRect.right;
                return isThumbPressed
                    ? thumbRect.left + thumbRect.width / 2 - startClientX
                    : 0;
            })();
            function getEventValue(e) {
                const {min, max} = store.activeProps;
                const clientX = getClientX(e);
                const rect = getTrackNode().getBoundingClientRect();
                const scaled = scale$1(
                    clientX + dx,
                    rect.left,
                    rect.right,
                    min,
                    max
                );
                const clamped = clamp$1(scaled, min, max);
                return clamped;
            }
            function onPointerMove(e) {
                const value = getEventValue(e);
                store.activeValue = value;
                context.refresh();
            }
            function onPointerUp(e) {
                unsubscribe();
                const value = getEventValue(e);
                store.isActive = false;
                context.refresh();
                store.activeValue = null;
                const {onChange, step} = store.activeProps;
                onChange(stickToStep(value, step));
            }
            function onKeyPress(e) {
                if (e.key === "Escape") {
                    unsubscribe();
                    store.isActive = false;
                    store.activeValue = null;
                    context.refresh();
                }
            }
            function subscribe() {
                window.addEventListener(pointerMoveEvent, onPointerMove, {
                    passive: true
                });
                window.addEventListener(pointerUpEvent, onPointerUp, {
                    passive: true
                });
                window.addEventListener("keypress", onKeyPress);
            }
            function unsubscribe() {
                window.removeEventListener(pointerMoveEvent, onPointerMove);
                window.removeEventListener(pointerUpEvent, onPointerUp);
                window.removeEventListener("keypress", onKeyPress);
            }
            subscribe();
            store.isActive = true;
            store.activeValue = getEventValue(startEvt);
            context.refresh();
        }
        function getValue() {
            return store.activeValue == null ? props.value : store.activeValue;
        }
        const percent = scale$1(getValue(), props.min, props.max, 0, 100);
        const thumbPositionStyleValue = `${percent}%`;
        const shouldFlipText = percent > 75;
        const formattedValue = props.formatValue(
            stickToStep(getValue(), props.step)
        );
        return m(
            "span",
            {
                class: {"slider": true, "slider--active": store.isActive},
                oncreate: onRootCreate,
                onmousedown: onPointerDown
            },
            m(
                "span",
                {class: "slider__track", oncreate: saveTrackNode},
                m("span", {
                    class: "slider__track__fill",
                    style: {width: thumbPositionStyleValue}
                })
            ),
            m(
                "span",
                {class: "slider__thumb-wrapper"},
                m(
                    "span",
                    {
                        class: "slider__thumb",
                        oncreate: saveThumbNode,
                        style: {left: thumbPositionStyleValue}
                    },
                    m(
                        "span",
                        {
                            class: {
                                "slider__thumb__value": true,
                                "slider__thumb__value--flip": shouldFlipText
                            }
                        },
                        formattedValue
                    )
                )
            )
        );
    }

    function Tab({isActive}, ...children) {
        const tabCls = {
            "tab-panel__tab": true,
            "tab-panel__tab--active": isActive
        };
        return m("div", {class: tabCls}, children);
    }

    function TabPanel(props) {
        const tabsNames = Object.keys(props.tabs);
        function isActiveTab(name, index) {
            return name == null ? index === 0 : name === props.activeTab;
        }
        const buttons = tabsNames.map((name, i) => {
            const btnCls = {
                "tab-panel__button": true,
                "tab-panel__button--active": isActiveTab(name, i)
            };
            return m(
                Button,
                {class: btnCls, onclick: () => props.onSwitchTab(name)},
                props.tabLabels[name]
            );
        });
        const tabs = tabsNames.map((name, i) =>
            m(Tab, {isActive: isActiveTab(name, i)}, props.tabs[name])
        );
        return m(
            "div",
            {class: "tab-panel"},
            m("div", {class: "tab-panel__buttons"}, buttons),
            m("div", {class: "tab-panel__tabs"}, tabs)
        );
    }

    function TextList(props) {
        const context = getComponentContext();
        context.store.indices = context.store.indices || new WeakMap();
        function onTextChange(e) {
            const index = context.store.indices.get(e.target);
            const values = props.values.slice();
            const value = e.target.value.trim();
            if (values.indexOf(value) >= 0) {
                return;
            }
            if (!value) {
                values.splice(index, 1);
            } else if (index === values.length) {
                values.push(value);
            } else {
                values.splice(index, 1, value);
            }
            props.onChange(values);
        }
        function createTextBox(text, index) {
            const saveIndex = (node) => context.store.indices.set(node, index);
            return m(TextBox, {
                class: "text-list__textbox",
                value: text,
                onrender: saveIndex,
                placeholder: props.placeholder
            });
        }
        let shouldFocus = false;
        const node = context.node;
        const prevProps = context.prev ? context.prev.props : null;
        if (
            node &&
            props.isFocused &&
            (!prevProps ||
                !prevProps.isFocused ||
                prevProps.values.length < props.values.length)
        ) {
            focusLastNode();
        }
        function didMount(node) {
            context.store.node = node;
            if (props.isFocused) {
                focusLastNode();
            }
        }
        function focusLastNode() {
            const node = context.store.node;
            shouldFocus = true;
            requestAnimationFrame(() => {
                const inputs = node.querySelectorAll(".text-list__textbox");
                const last = inputs.item(inputs.length - 1);
                last.focus();
            });
        }
        return m(VirtualScroll, {
            root: m("div", {
                class: ["text-list", props.class],
                onchange: onTextChange,
                oncreate: didMount
            }),
            items: props.values
                .map(createTextBox)
                .concat(createTextBox("", props.values.length)),
            scrollToIndex: shouldFocus ? props.values.length : -1
        });
    }

    function getLocalMessage(messageName) {
        return chrome.i18n.getMessage(messageName);
    }
    function getUILanguage() {
        const code = chrome.i18n.getUILanguage();
        if (code.endsWith("-mac")) {
            return code.substring(0, code.length - 4);
        }
        return code;
    }

    function parseTime($time) {
        const parts = $time.split(":").slice(0, 2);
        const lowercased = $time.trim().toLowerCase();
        const isAM = lowercased.endsWith("am") || lowercased.endsWith("a.m.");
        const isPM = lowercased.endsWith("pm") || lowercased.endsWith("p.m.");
        let hours = parts.length > 0 ? parseInt(parts[0]) : 0;
        if (isNaN(hours) || hours > 23) {
            hours = 0;
        }
        if (isAM && hours === 12) {
            hours = 0;
        }
        if (isPM && hours < 12) {
            hours += 12;
        }
        let minutes = parts.length > 1 ? parseInt(parts[1]) : 0;
        if (isNaN(minutes) || minutes > 59) {
            minutes = 0;
        }
        return [hours, minutes];
    }
    function getDuration(time) {
        let duration = 0;
        if (time.seconds) {
            duration += time.seconds * 1000;
        }
        if (time.minutes) {
            duration += time.minutes * 60 * 1000;
        }
        if (time.hours) {
            duration += time.hours * 60 * 60 * 1000;
        }
        if (time.days) {
            duration += time.days * 24 * 60 * 60 * 1000;
        }
        return duration;
    }
    function getSunsetSunriseUTCTime(date, latitude, longitude) {
        const dec31 = new Date(date.getUTCFullYear(), 0, 0);
        const oneDay = getDuration({days: 1});
        const dayOfYear = Math.floor((Number(date) - Number(dec31)) / oneDay);
        const zenith = 90.83333333333333;
        const D2R = Math.PI / 180;
        const R2D = 180 / Math.PI;
        const lnHour = longitude / 15;
        function getTime(isSunrise) {
            const t = dayOfYear + ((isSunrise ? 6 : 18) - lnHour) / 24;
            const M = 0.9856 * t - 3.289;
            let L =
                M +
                1.916 * Math.sin(M * D2R) +
                0.02 * Math.sin(2 * M * D2R) +
                282.634;
            if (L > 360) {
                L = L - 360;
            } else if (L < 0) {
                L = L + 360;
            }
            let RA = R2D * Math.atan(0.91764 * Math.tan(L * D2R));
            if (RA > 360) {
                RA = RA - 360;
            } else if (RA < 0) {
                RA = RA + 360;
            }
            const Lquadrant = Math.floor(L / 90) * 90;
            const RAquadrant = Math.floor(RA / 90) * 90;
            RA = RA + (Lquadrant - RAquadrant);
            RA = RA / 15;
            const sinDec = 0.39782 * Math.sin(L * D2R);
            const cosDec = Math.cos(Math.asin(sinDec));
            const cosH =
                (Math.cos(zenith * D2R) - sinDec * Math.sin(latitude * D2R)) /
                (cosDec * Math.cos(latitude * D2R));
            if (cosH > 1) {
                return {
                    alwaysDay: false,
                    alwaysNight: true,
                    time: 0
                };
            } else if (cosH < -1) {
                return {
                    alwaysDay: true,
                    alwaysNight: false,
                    time: 0
                };
            }
            const H =
                (isSunrise
                    ? 360 - R2D * Math.acos(cosH)
                    : R2D * Math.acos(cosH)) / 15;
            const T = H + RA - 0.06571 * t - 6.622;
            let UT = T - lnHour;
            if (UT > 24) {
                UT = UT - 24;
            } else if (UT < 0) {
                UT = UT + 24;
            }
            return {
                alwaysDay: false,
                alwaysNight: false,
                time: UT * getDuration({hours: 1})
            };
        }
        const sunriseTime = getTime(true);
        const sunsetTime = getTime(false);
        if (sunriseTime.alwaysDay || sunsetTime.alwaysDay) {
            return {
                alwaysDay: true
            };
        } else if (sunriseTime.alwaysNight || sunsetTime.alwaysNight) {
            return {
                alwaysNight: true
            };
        }
        return {
            sunriseTime: sunriseTime.time,
            sunsetTime: sunsetTime.time
        };
    }
    function isNightAtLocation(date, latitude, longitude) {
        const time = getSunsetSunriseUTCTime(date, latitude, longitude);
        if (time.alwaysDay) {
            return false;
        } else if (time.alwaysNight) {
            return true;
        }
        const sunriseTime = time.sunriseTime;
        const sunsetTime = time.sunsetTime;
        const currentTime =
            date.getUTCHours() * getDuration({hours: 1}) +
            date.getUTCMinutes() * getDuration({minutes: 1}) +
            date.getUTCSeconds() * getDuration({seconds: 1});
        if (sunsetTime > sunriseTime) {
            return currentTime > sunsetTime || currentTime < sunriseTime;
        } else {
            return currentTime > sunsetTime && currentTime < sunriseTime;
        }
    }

    const is12H = new Date().toLocaleTimeString(getUILanguage()).endsWith("M");
    function toLocaleTime($time) {
        const [hours, minutes] = parseTime($time);
        const mm = `${minutes < 10 ? "0" : ""}${minutes}`;
        if (is12H) {
            const h = hours === 0 ? "12" : hours > 12 ? hours - 12 : hours;
            return `${h}:${mm}${hours < 12 ? "AM" : "PM"}`;
        }
        return `${hours}:${mm}`;
    }
    function to24HTime($time) {
        const [hours, minutes] = parseTime($time);
        const mm = `${minutes < 10 ? "0" : ""}${minutes}`;
        return `${hours}:${mm}`;
    }
    function TimeRangePicker(props) {
        function onStartTimeChange($startTime) {
            props.onChange([to24HTime($startTime), props.endTime]);
        }
        function onEndTimeChange($endTime) {
            props.onChange([props.startTime, to24HTime($endTime)]);
        }
        function setStartTime(node) {
            node.value = toLocaleTime(props.startTime);
        }
        function setEndTime(node) {
            node.value = toLocaleTime(props.endTime);
        }
        return m(
            "span",
            {class: "time-range-picker"},
            m(TextBox, {
                class:
                    "time-range-picker__input time-range-picker__input--start",
                placeholder: toLocaleTime("18:00"),
                onrender: setStartTime,
                onchange: (e) => onStartTimeChange(e.target.value),
                onkeypress: (e) => {
                    if (e.key === "Enter") {
                        const input = e.target;
                        input.blur();
                        onStartTimeChange(input.value);
                    }
                }
            }),
            m(TextBox, {
                class: "time-range-picker__input time-range-picker__input--end",
                placeholder: toLocaleTime("9:00"),
                onrender: setEndTime,
                onchange: (e) => onEndTimeChange(e.target.value),
                onkeypress: (e) => {
                    if (e.key === "Enter") {
                        const input = e.target;
                        input.blur();
                        onEndTimeChange(input.value);
                    }
                }
            })
        );
    }

    function Toggle(props) {
        const {checked, onChange} = props;
        const cls = ["toggle", checked ? "toggle--checked" : null, props.class];
        const clsOn = {
            "toggle__btn": true,
            "toggle__on": true,
            "toggle__btn--active": checked
        };
        const clsOff = {
            "toggle__btn": true,
            "toggle__off": true,
            "toggle__btn--active": !checked
        };
        return m(
            "span",
            {class: cls},
            m(
                "span",
                {
                    class: clsOn,
                    onclick: onChange ? () => !checked && onChange(true) : null
                },
                props.labelOn
            ),
            m(
                "span",
                {
                    class: clsOff,
                    onclick: onChange ? () => checked && onChange(false) : null
                },
                props.labelOff
            )
        );
    }

    function Track(props) {
        const valueStyle = {width: `${props.value * 100}%`};
        const isClickable = props.onChange != null;
        function onMouseDown(e) {
            const targetNode = e.currentTarget;
            const valueNode = targetNode.firstElementChild;
            targetNode.classList.add("track--active");
            function getValue(clientX) {
                const rect = targetNode.getBoundingClientRect();
                return (clientX - rect.left) / rect.width;
            }
            function setWidth(value) {
                valueNode.style.width = `${value * 100}%`;
            }
            function onMouseMove(e) {
                const value = getValue(e.clientX);
                setWidth(value);
            }
            function onMouseUp(e) {
                const value = getValue(e.clientX);
                props.onChange(value);
                cleanup();
            }
            function onKeyPress(e) {
                if (e.key === "Escape") {
                    setWidth(props.value);
                    cleanup();
                }
            }
            function cleanup() {
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
                window.removeEventListener("keypress", onKeyPress);
                targetNode.classList.remove("track--active");
            }
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
            window.addEventListener("keypress", onKeyPress);
            const value = getValue(e.clientX);
            setWidth(value);
        }
        return m(
            "span",
            {
                class: {
                    "track": true,
                    "track--clickable": Boolean(props.onChange)
                },
                onmousedown: isClickable ? onMouseDown : null
            },
            m("span", {class: "track__value", style: valueStyle}),
            m("label", {class: "track__label"}, props.label)
        );
    }

    function UpDown(props) {
        const buttonDownCls = {
            "updown__button": true,
            "updown__button--disabled": props.value === props.min
        };
        const buttonUpCls = {
            "updown__button": true,
            "updown__button--disabled": props.value === props.max
        };
        function normalize(x) {
            const s = Math.round(x / props.step) * props.step;
            const exp = Math.floor(Math.log10(props.step));
            if (exp >= 0) {
                const m = Math.pow(10, exp);
                return Math.round(s / m) * m;
            } else {
                const m = Math.pow(10, -exp);
                return Math.round(s * m) / m;
            }
        }
        function clamp(x) {
            return Math.max(props.min, Math.min(props.max, x));
        }
        function onButtonDownClick() {
            props.onChange(clamp(normalize(props.value - props.step)));
        }
        function onButtonUpClick() {
            props.onChange(clamp(normalize(props.value + props.step)));
        }
        function onTrackValueChange(trackValue) {
            props.onChange(
                clamp(
                    normalize(trackValue * (props.max - props.min) + props.min)
                )
            );
        }
        const trackValue = (props.value - props.min) / (props.max - props.min);
        const valueText =
            props.value === props.default
                ? getLocalMessage("off").toLocaleLowerCase()
                : props.value > props.default
                ? `+${normalize(props.value - props.default)}`
                : `-${normalize(props.default - props.value)}`;
        return m(
            "div",
            {class: "updown"},
            m(
                "div",
                {class: "updown__line"},
                m(
                    Button,
                    {class: buttonDownCls, onclick: onButtonDownClick},
                    m("span", {class: "updown__icon updown__icon-down"})
                ),
                m(Track, {
                    value: trackValue,
                    label: props.name,
                    onChange: onTrackValueChange
                }),
                m(
                    Button,
                    {class: buttonUpCls, onclick: onButtonUpClick},
                    m("span", {class: "updown__icon updown__icon-up"})
                )
            ),
            m("label", {class: "updown__value-text"}, valueText)
        );
    }

    function CustomSettingsToggle({data, tab, actions}) {
        const host = getURLHost(tab.url || "");
        const isCustom = data.settings.customThemes.some(({url}) =>
            isURLInList(tab.url, url)
        );
        const urlText = host
            ? host
                  .split(".")
                  .reduce(
                      (elements, part, i) =>
                          elements.concat(
                              m("wbr", null),
                              `${i > 0 ? "." : ""}${part}`
                          ),
                      []
                  )
            : "current site";
        return m(
            Button,
            {
                class: {
                    "custom-settings-toggle": true,
                    "custom-settings-toggle--checked": isCustom,
                    "custom-settings-toggle--disabled": tab.isProtected
                },
                onclick: (e) => {
                    if (isCustom) {
                        const filtered = data.settings.customThemes.filter(
                            ({url}) => !isURLInList(tab.url, url)
                        );
                        actions.changeSettings({customThemes: filtered});
                    } else {
                        const extended = data.settings.customThemes.concat({
                            url: [host],
                            theme: {...data.settings.theme}
                        });
                        actions.changeSettings({customThemes: extended});
                        e.currentTarget.classList.add(
                            "custom-settings-toggle--checked"
                        );
                    }
                }
            },
            m(
                "span",
                {class: "custom-settings-toggle__wrapper"},
                getLocalMessage("only_for"),
                " ",
                m("span", {class: "custom-settings-toggle__url"}, urlText)
            )
        );
    }

    function ModeToggle({mode, onChange}) {
        return m(
            "div",
            {class: "mode-toggle"},
            m(
                "div",
                {class: "mode-toggle__line"},
                m(
                    Button,
                    {
                        class: {"mode-toggle__button--active": mode === 1},
                        onclick: () => onChange(1)
                    },
                    m("span", {class: "icon icon--dark-mode"})
                ),
                m(Toggle, {
                    checked: mode === 1,
                    labelOn: getLocalMessage("dark"),
                    labelOff: getLocalMessage("light"),
                    onChange: (checked) => onChange(checked ? 1 : 0)
                }),
                m(
                    Button,
                    {
                        class: {"mode-toggle__button--active": mode === 0},
                        onclick: () => onChange(0)
                    },
                    m("span", {class: "icon icon--light-mode"})
                )
            ),
            m("label", {class: "mode-toggle__label"}, getLocalMessage("mode"))
        );
    }

    function FilterSettings({data, actions, tab}) {
        const custom = data.settings.customThemes.find(({url}) =>
            isURLInList(tab.url, url)
        );
        const filterConfig = custom ? custom.theme : data.settings.theme;
        function setConfig(config) {
            if (custom) {
                custom.theme = {...custom.theme, ...config};
                actions.changeSettings({
                    customThemes: data.settings.customThemes
                });
            } else {
                actions.setTheme(config);
            }
        }
        const brightness = m(UpDown, {
            value: filterConfig.brightness,
            min: 50,
            max: 150,
            step: 5,
            default: 100,
            name: getLocalMessage("brightness"),
            onChange: (value) => setConfig({brightness: value})
        });
        const contrast = m(UpDown, {
            value: filterConfig.contrast,
            min: 50,
            max: 150,
            step: 5,
            default: 100,
            name: getLocalMessage("contrast"),
            onChange: (value) => setConfig({contrast: value})
        });
        const grayscale = m(UpDown, {
            value: filterConfig.grayscale,
            min: 0,
            max: 100,
            step: 5,
            default: 0,
            name: getLocalMessage("grayscale"),
            onChange: (value) => setConfig({grayscale: value})
        });
        const sepia = m(UpDown, {
            value: filterConfig.sepia,
            min: 0,
            max: 100,
            step: 5,
            default: 0,
            name: getLocalMessage("sepia"),
            onChange: (value) => setConfig({sepia: value})
        });
        return m(
            "section",
            {class: "filter-settings"},
            m(ModeToggle, {
                mode: filterConfig.mode,
                onChange: (mode) => setConfig({mode})
            }),
            brightness,
            contrast,
            sepia,
            grayscale,
            m(CustomSettingsToggle, {data: data, tab: tab, actions: actions})
        );
    }

    function SunMoonIcon({date, latitude, longitude}) {
        if (latitude == null || longitude == null) {
            return m(
                "svg",
                {viewBox: "0 0 16 16"},
                m(
                    "text",
                    {
                        "fill": "white",
                        "font-size": "16",
                        "font-weight": "bold",
                        "text-anchor": "middle",
                        "x": "8",
                        "y": "14"
                    },
                    "?"
                )
            );
        }
        if (isNightAtLocation(date, latitude, longitude)) {
            return m(
                "svg",
                {viewBox: "0 0 16 16"},
                m("path", {
                    fill: "white",
                    stroke: "none",
                    d: "M 6 3 Q 10 8 6 13 Q 12 13 12 8 Q 12 3 6 3"
                })
            );
        }
        return m(
            "svg",
            {viewBox: "0 0 16 16"},
            m("circle", {
                fill: "white",
                stroke: "none",
                cx: "8",
                cy: "8",
                r: "3"
            }),
            m(
                "g",
                {
                    "fill": "none",
                    "stroke": "white",
                    "stroke-linecap": "round",
                    "stroke-width": "1.5"
                },
                Array.from({length: 8}).map((_, i) => {
                    const cx = 8;
                    const cy = 8;
                    const angle = (i * Math.PI) / 4 + Math.PI / 8;
                    const pt = [5, 6].map((l) => [
                        cx + l * Math.cos(angle),
                        cy + l * Math.sin(angle)
                    ]);
                    return m("line", {
                        x1: pt[0][0],
                        y1: pt[0][1],
                        x2: pt[1][0],
                        y2: pt[1][1]
                    });
                })
            )
        );
    }

    function SystemIcon() {
        return m(
            "svg",
            {viewBox: "0 0 16 16"},
            m("path", {
                fill: "white",
                stroke: "none",
                d:
                    "M3,3 h10 v7 h-3 v2 h1 v1 h-6 v-1 h1 v-2 h-3 z M4.5,4.5 v4 h7 v-4 z"
            })
        );
    }

    function WatchIcon({hours, minutes}) {
        const cx = 8;
        const cy = 8.5;
        const lenHour = 3;
        const lenMinute = 4;
        const clockR = 5.5;
        const btnSize = 2;
        const btnPad = 1.5;
        const ah =
            (((hours > 11 ? hours - 12 : hours) + minutes / 60) / 12) *
            Math.PI *
            2;
        const am = (minutes / 60) * Math.PI * 2;
        const hx = cx + lenHour * Math.sin(ah);
        const hy = cy - lenHour * Math.cos(ah);
        const mx = cx + lenMinute * Math.sin(am);
        const my = cy - lenMinute * Math.cos(am);
        return m(
            "svg",
            {viewBox: "0 0 16 16"},
            m("circle", {
                "fill": "none",
                "stroke": "white",
                "stroke-width": "1.5",
                "cx": cx,
                "cy": cy,
                "r": clockR
            }),
            m("line", {
                "stroke": "white",
                "stroke-width": "1.5",
                "x1": cx,
                "y1": cy,
                "x2": hx,
                "y2": hy
            }),
            m("line", {
                "stroke": "white",
                "stroke-width": "1.5",
                "opacity": "0.67",
                "x1": cx,
                "y1": cy,
                "x2": mx,
                "y2": my
            }),
            [30, -30].map((angle) => {
                return m("path", {
                    "fill": "white",
                    "transform": `rotate(${angle})`,
                    "transform-origin": `${cx} ${cy}`,
                    "d": `M${cx - btnSize},${
                        cy - clockR - btnPad
                    } a${btnSize},${btnSize} 0 0 1 ${2 * btnSize},0 z`
                });
            })
        );
    }

    function CheckmarkIcon({isEnabled}) {
        return m(
            "svg",
            {viewBox: "0 0 8 8"},
            m("path", {
                d: isEnabled
                    ? "M1,4 l2,2 l4,-4 v1 l-4,4 l-2,-2 Z"
                    : "M2,2 l4,4 v1 l-4,-4 Z M2,6 l4,-4 v1 l-4,4 Z"
            })
        );
    }

    function SiteToggleButton({data, tab, actions}) {
        function onSiteToggleClick() {
            if (pdf) {
                actions.changeSettings({
                    enableForPDF: !data.settings.enableForPDF
                });
            } else {
                actions.toggleURL(tab.url);
            }
        }
        const toggleHasEffect = data.isEnabled && !tab.isProtected;
        const pdf = isPDF(tab.url);
        const isSiteEnabled = isURLEnabled(tab.url, data.settings, tab);
        const host = getURLHost(tab.url || "");
        const urlText = host
            ? host
                  .split(".")
                  .reduce(
                      (elements, part, i) =>
                          elements.concat(
                              m("wbr", null),
                              `${i > 0 ? "." : ""}${part}`
                          ),
                      []
                  )
            : "current site";
        return m(
            Button,
            {
                class: {
                    "site-toggle": true,
                    "site-toggle--active": pdf
                        ? data.settings.enableForPDF
                        : isSiteEnabled,
                    "site-toggle--disabled": !toggleHasEffect
                },
                onclick: onSiteToggleClick
            },
            m(
                "span",
                {class: "site-toggle__mark"},
                m(CheckmarkIcon, {isEnabled: isSiteEnabled})
            ),
            " ",
            m("span", {class: "site-toggle__url"}, pdf ? "PDF" : urlText)
        );
    }

    function MoreToggleSettings({data, actions, isExpanded, onClose}) {
        const isSystemAutomation = data.settings.automation === "system";
        const locationSettings = data.settings.location;
        const values = {
            latitude: {
                min: -90,
                max: 90
            },
            longitude: {
                min: -180,
                max: 180
            }
        };
        function getLocationString(location) {
            if (location == null) {
                return "";
            }
            return `${location}°`;
        }
        function locationChanged(inputElement, newValue, type) {
            if (newValue.trim() === "") {
                inputElement.value = "";
                actions.changeSettings({
                    location: {
                        ...locationSettings,
                        [type]: null
                    }
                });
                return;
            }
            const min = values[type].min;
            const max = values[type].max;
            newValue = newValue.replace(",", ".").replace("°", "");
            let num = Number(newValue);
            if (isNaN(num)) {
                num = 0;
            } else if (num > max) {
                num = max;
            } else if (num < min) {
                num = min;
            }
            inputElement.value = getLocationString(num);
            actions.changeSettings({
                location: {
                    ...locationSettings,
                    [type]: num
                }
            });
        }
        return m(
            "div",
            {
                class: {
                    "header__app-toggle__more-settings": true,
                    "header__app-toggle__more-settings--expanded": isExpanded
                }
            },
            m(
                "div",
                {class: "header__app-toggle__more-settings__top"},
                m(
                    "span",
                    {class: "header__app-toggle__more-settings__top__text"},
                    getLocalMessage("automation")
                ),
                m(
                    "span",
                    {
                        class: "header__app-toggle__more-settings__top__close",
                        role: "button",
                        onclick: onClose
                    },
                    "\u2715"
                )
            ),
            m(
                "div",
                {class: "header__app-toggle__more-settings__content"},
                m(
                    "div",
                    {class: "header__app-toggle__more-settings__line"},
                    m(CheckBox, {
                        checked: data.settings.automation === "time",
                        onchange: (e) =>
                            actions.changeSettings({
                                automation: e.target.checked ? "time" : ""
                            })
                    }),
                    m(TimeRangePicker, {
                        startTime: data.settings.time.activation,
                        endTime: data.settings.time.deactivation,
                        onChange: ([start, end]) =>
                            actions.changeSettings({
                                time: {activation: start, deactivation: end}
                            })
                    })
                ),
                m(
                    "p",
                    {class: "header__app-toggle__more-settings__description"},
                    getLocalMessage("set_active_hours")
                ),
                m(
                    "div",
                    {
                        class:
                            "header__app-toggle__more-settings__line header__app-toggle__more-settings__location"
                    },
                    m(CheckBox, {
                        checked: data.settings.automation === "location",
                        onchange: (e) =>
                            actions.changeSettings({
                                automation: e.target.checked ? "location" : ""
                            })
                    }),
                    m(TextBox, {
                        class:
                            "header__app-toggle__more-settings__location__latitude",
                        placeholder: getLocalMessage("latitude"),
                        onchange: (e) =>
                            locationChanged(
                                e.target,
                                e.target.value,
                                "latitude"
                            ),
                        oncreate: (node) =>
                            (node.value = getLocationString(
                                locationSettings.latitude
                            )),
                        onkeypress: (e) => {
                            if (e.key === "Enter") {
                                e.target.blur();
                            }
                        }
                    }),
                    m(TextBox, {
                        class:
                            "header__app-toggle__more-settings__location__longitude",
                        placeholder: getLocalMessage("longitude"),
                        onchange: (e) =>
                            locationChanged(
                                e.target,
                                e.target.value,
                                "longitude"
                            ),
                        oncreate: (node) =>
                            (node.value = getLocationString(
                                locationSettings.longitude
                            )),
                        onkeypress: (e) => {
                            if (e.key === "Enter") {
                                e.target.blur();
                            }
                        }
                    })
                ),
                m(
                    "p",
                    {
                        class:
                            "header__app-toggle__more-settings__location-description"
                    },
                    getLocalMessage("set_location")
                ),
                m(
                    "div",
                    {
                        class: [
                            "header__app-toggle__more-settings__line",
                            "header__app-toggle__more-settings__system-dark-mode"
                        ]
                    },
                    m(CheckBox, {
                        class:
                            "header__app-toggle__more-settings__system-dark-mode__checkbox",
                        checked: isSystemAutomation,
                        onchange: (e) =>
                            actions.changeSettings({
                                automation: e.target.checked ? "system" : ""
                            })
                    }),
                    m(
                        Button,
                        {
                            class: {
                                "header__app-toggle__more-settings__system-dark-mode__button": true,
                                "header__app-toggle__more-settings__system-dark-mode__button--active": isSystemAutomation
                            },
                            onclick: () =>
                                actions.changeSettings({
                                    automation: isSystemAutomation
                                        ? ""
                                        : "system"
                                })
                        },
                        getLocalMessage("system_dark_mode")
                    )
                ),
                m(
                    "p",
                    {class: "header__app-toggle__more-settings__description"},
                    getLocalMessage("system_dark_mode_description")
                )
            )
        );
    }

    function multiline(...lines) {
        return lines.join("\n");
    }
    function Header({data, actions, tab, onMoreToggleSettingsClick}) {
        function toggleExtension(enabled) {
            actions.changeSettings({
                enabled,
                automation: ""
            });
        }
        const isAutomation = Boolean(data.settings.automation);
        const isTimeAutomation = data.settings.automation === "time";
        const isLocationAutomation = data.settings.automation === "location";
        const now = new Date();
        return m(
            "header",
            {class: "header"},
            m(
                "a",
                {
                    class: "header__logo",
                    href: "https://darkreader.org/",
                    target: "_blank",
                    rel: "noopener noreferrer"
                },
                "Dark Reader"
            ),
            m(
                "div",
                {class: "header__control header__site-toggle"},
                m(SiteToggleButton, {data: data, tab: tab, actions: actions}),
                tab.isProtected
                    ? m(
                          "span",
                          {class: "header__site-toggle__unable-text"},
                          getLocalMessage("page_protected")
                      )
                    : tab.isInDarkList
                    ? m(
                          "span",
                          {class: "header__site-toggle__unable-text"},
                          getLocalMessage("page_in_dark_list")
                      )
                    : m(ShortcutLink, {
                          commandName: "addSite",
                          shortcuts: data.shortcuts,
                          textTemplate: (hotkey) =>
                              hotkey
                                  ? multiline(
                                        getLocalMessage("toggle_current_site"),
                                        hotkey
                                    )
                                  : getLocalMessage("setup_hotkey_toggle_site"),
                          onSetShortcut: (shortcut) =>
                              actions.setShortcut("addSite", shortcut)
                      })
            ),
            m(
                "div",
                {class: "header__control header__app-toggle"},
                m(Toggle, {
                    checked: data.isEnabled,
                    labelOn: getLocalMessage("on"),
                    labelOff: getLocalMessage("off"),
                    onChange: toggleExtension
                }),
                m(ShortcutLink, {
                    commandName: "toggle",
                    shortcuts: data.shortcuts,
                    textTemplate: (hotkey) =>
                        hotkey
                            ? multiline(
                                  getLocalMessage("toggle_extension"),
                                  hotkey
                              )
                            : getLocalMessage("setup_hotkey_toggle_extension"),
                    onSetShortcut: (shortcut) =>
                        actions.setShortcut("toggle", shortcut)
                }),
                m("span", {
                    class: "header__app-toggle__more-button",
                    onclick: onMoreToggleSettingsClick
                }),
                m(
                    "span",
                    {
                        class: {
                            "header__app-toggle__time": true,
                            "header__app-toggle__time--active": isAutomation
                        }
                    },
                    isTimeAutomation
                        ? m(WatchIcon, {
                              hours: now.getHours(),
                              minutes: now.getMinutes()
                          })
                        : isLocationAutomation
                        ? m(SunMoonIcon, {
                              date: now,
                              latitude: data.settings.location.latitude,
                              longitude: data.settings.location.longitude
                          })
                        : m(SystemIcon, null)
                )
            )
        );
    }

    function Loader({complete = false}) {
        const {state, setState} = useState({finished: false});
        return m(
            "div",
            {
                class: {
                    "loader": true,
                    "loader--complete": complete,
                    "loader--transition-end": state.finished
                },
                ontransitionend: () => setState({finished: true})
            },
            m(
                "label",
                {class: "loader__message"},
                getLocalMessage("loading_please_wait")
            )
        );
    }
    var Loader$1 = withState(Loader);

    const BLOG_URL = "https://darkreader.org/blog/";
    const DONATE_URL = "https://opencollective.com/darkreader";
    const GITHUB_URL = "https://github.com/darkreader/darkreader";
    const PRIVACY_URL = "https://darkreader.org/privacy/";
    const TWITTER_URL = "https://twitter.com/darkreaderapp";
    const helpLocales = [
        "be",
        "cs",
        "de",
        "en",
        "es",
        "fr",
        "nl",
        "it",
        "pt",
        "ru",
        "zh-CN",
        "zh-TW"
    ];
    function getHelpURL() {
        const locale = getUILanguage();
        const matchLocale =
            helpLocales.find((hl) => hl === locale) ||
            helpLocales.find((hl) => locale.startsWith(hl)) ||
            "en";
        return `https://darkreader.org/help/${matchLocale}/`;
    }

    function AutomationPage(props) {
        const isSystemAutomation = props.data.settings.automation === "system";
        const locationSettings = props.data.settings.location;
        const values = {
            latitude: {
                min: -90,
                max: 90
            },
            longitude: {
                min: -180,
                max: 180
            }
        };
        function getLocationString(location) {
            if (location == null) {
                return "";
            }
            return `${location}°`;
        }
        function locationChanged(inputElement, newValue, type) {
            if (newValue.trim() === "") {
                inputElement.value = "";
                props.actions.changeSettings({
                    location: {
                        ...locationSettings,
                        [type]: null
                    }
                });
                return;
            }
            const min = values[type].min;
            const max = values[type].max;
            newValue = newValue.replace(",", ".").replace("°", "");
            let num = Number(newValue);
            if (isNaN(num)) {
                num = 0;
            } else if (num > max) {
                num = max;
            } else if (num < min) {
                num = min;
            }
            inputElement.value = getLocationString(num);
            props.actions.changeSettings({
                location: {
                    ...locationSettings,
                    [type]: num
                }
            });
        }
        return m(
            "div",
            {class: "automation-page"},
            m(
                "div",
                {class: "automation-page__line"},
                m(CheckBox, {
                    checked: props.data.settings.automation === "time",
                    onchange: (e) =>
                        props.actions.changeSettings({
                            automation: e.target.checked ? "time" : ""
                        })
                }),
                m(TimeRangePicker, {
                    startTime: props.data.settings.time.activation,
                    endTime: props.data.settings.time.deactivation,
                    onChange: ([start, end]) =>
                        props.actions.changeSettings({
                            time: {activation: start, deactivation: end}
                        })
                })
            ),
            m(
                "p",
                {class: "automation-page__description"},
                getLocalMessage("set_active_hours")
            ),
            m(
                "div",
                {class: "automation-page__line automation-page__location"},
                m(CheckBox, {
                    checked: props.data.settings.automation === "location",
                    onchange: (e) =>
                        props.actions.changeSettings({
                            automation: e.target.checked ? "location" : ""
                        })
                }),
                m(TextBox, {
                    class: "automation-page__location__latitude",
                    placeholder: getLocalMessage("latitude"),
                    onchange: (e) =>
                        locationChanged(e.target, e.target.value, "latitude"),
                    oncreate: (node) =>
                        (node.value = getLocationString(
                            locationSettings.latitude
                        )),
                    onkeypress: (e) => {
                        if (e.key === "Enter") {
                            e.target.blur();
                        }
                    }
                }),
                m(TextBox, {
                    class: "automation-page__location__longitude",
                    placeholder: getLocalMessage("longitude"),
                    onchange: (e) =>
                        locationChanged(e.target, e.target.value, "longitude"),
                    oncreate: (node) =>
                        (node.value = getLocationString(
                            locationSettings.longitude
                        )),
                    onkeypress: (e) => {
                        if (e.key === "Enter") {
                            e.target.blur();
                        }
                    }
                })
            ),
            m(
                "p",
                {class: "automation-page__location-description"},
                getLocalMessage("set_location")
            ),
            m(
                "div",
                {
                    class: [
                        "automation-page__line",
                        "automation-page__system-dark-mode"
                    ]
                },
                m(CheckBox, {
                    class: "automation-page__system-dark-mode__checkbox",
                    checked: isSystemAutomation,
                    onchange: (e) =>
                        props.actions.changeSettings({
                            automation: e.target.checked ? "system" : ""
                        })
                }),
                m(
                    Button,
                    {
                        class: {
                            "automation-page__system-dark-mode__button": true,
                            "automation-page__system-dark-mode__button--active": isSystemAutomation
                        },
                        onclick: () =>
                            props.actions.changeSettings({
                                automation: isSystemAutomation ? "" : "system"
                            })
                    },
                    getLocalMessage("system_dark_mode")
                )
            ),
            m(
                "p",
                {class: "automation-page__description"},
                getLocalMessage("system_dark_mode_description")
            )
        );
    }

    function ControlGroup(props, control, description) {
        return m(
            "span",
            {class: ["control-group", props.class]},
            control,
            description
        );
    }
    function Control(props, control) {
        return m(
            "span",
            {class: ["control-group__control", props.class]},
            control
        );
    }
    function Description(props, description) {
        return m(
            "span",
            {class: ["control-group__description", props.class]},
            description
        );
    }
    var ControlGroup$1 = Object.assign(ControlGroup, {Control, Description});

    function AppSwitch(props) {
        const isOn =
            props.data.settings.enabled === true &&
            !props.data.settings.automation;
        const isOff =
            props.data.settings.enabled === false &&
            !props.data.settings.automation;
        const isAutomation = Boolean(props.data.settings.automation);
        const isTimeAutomation = props.data.settings.automation === "time";
        const isLocationAutomation =
            props.data.settings.automation === "location";
        const now = new Date();
        const values = [getLocalMessage("on"), "Auto", getLocalMessage("off")];
        const value = isOn ? values[0] : isOff ? values[2] : values[1];
        function onSwitchChange(v) {
            const index = values.indexOf(v);
            if (index === 0) {
                props.actions.changeSettings({
                    enabled: true,
                    automation: ""
                });
            } else if (index === 2) {
                props.actions.changeSettings({
                    enabled: false,
                    automation: ""
                });
            } else if (index === 1) {
                props.actions.changeSettings({
                    automation: "system"
                });
            }
        }
        const descriptionText = isOn
            ? "Extension is enabled"
            : isOff
            ? "Extension is disabled"
            : isTimeAutomation
            ? "Switches according to specified time"
            : isLocationAutomation
            ? "Switched according to location"
            : "Switches according to system dark mode";
        const description = m(
            "span",
            {
                class: {
                    "app-switch__description": true,
                    "app-switch__description--on": props.data.isEnabled,
                    "app-switch__description--off": !props.data.isEnabled
                }
            },
            descriptionText
        );
        return m(
            ControlGroup$1,
            {class: "app-switch"},
            m(
                ControlGroup$1.Control,
                null,
                m(
                    MultiSwitch,
                    {
                        class: "app-switch__control",
                        options: values,
                        value: value,
                        onChange: onSwitchChange
                    },
                    m(
                        "span",
                        {
                            class: {
                                "app-switch__time": true,
                                "app-switch__time--active": isAutomation
                            }
                        },
                        isTimeAutomation
                            ? m(WatchIcon, {
                                  hours: now.getHours(),
                                  minutes: now.getMinutes()
                              })
                            : isLocationAutomation
                            ? m(SunMoonIcon, {
                                  date: now,
                                  latitude:
                                      props.data.settings.location.latitude,
                                  longitude:
                                      props.data.settings.location.longitude
                              })
                            : m(SystemIcon, null)
                    )
                )
            ),
            m(ControlGroup$1.Description, null, description)
        );
    }

    function HelpGroup() {
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(
                    "a",
                    {
                        class: "m-help-button",
                        href: getHelpURL(),
                        target: "_blank",
                        rel: "noopener noreferrer"
                    },
                    m(
                        "span",
                        {class: "m-help-button__text"},
                        getLocalMessage("help")
                    )
                )
            )
        );
    }

    function SiteToggleGroup(props) {
        const isPageEnabled = isURLEnabled(
            props.tab.url,
            props.data.settings,
            props.tab
        );
        const descriptionText = isPDF(props.tab.url)
            ? isPageEnabled
                ? "Enabled for PDF files"
                : "Disabled for PDF files"
            : isPageEnabled
            ? "Enabled for current website"
            : "Disabled for current website";
        const description = m(
            "span",
            {
                class: {
                    "site-toggle-group__description": true,
                    "site-toggle-group__description--on": isPageEnabled,
                    "site-toggle-group__description--off": !isPageEnabled
                }
            },
            descriptionText
        );
        return m(
            ControlGroup$1,
            {class: "site-toggle-group"},
            m(
                ControlGroup$1.Control,
                {class: "site-toggle-group__control"},
                m(SiteToggleButton, Object.assign({}, props))
            ),
            m(ControlGroup$1.Description, null, description)
        );
    }

    function ThemeControl(props, controls) {
        return m(
            "span",
            {class: "theme-control"},
            m("label", {class: "theme-control__label"}, props.label),
            controls
        );
    }

    function BackgroundColorEditor(props) {
        return m(
            ThemeControl,
            {label: "Background"},
            m(ColorPicker$1, {
                color: props.value,
                onChange: props.onChange,
                canReset: props.canReset,
                onReset: props.onReset
            })
        );
    }

    function formatPercent(v) {
        return `${v}%`;
    }

    function Brightness(props) {
        return m(
            ThemeControl,
            {label: getLocalMessage("brightness")},
            m(Slider, {
                value: props.value,
                min: 50,
                max: 150,
                step: 1,
                formatValue: formatPercent,
                onChange: props.onChange
            })
        );
    }

    function Contrast(props) {
        return m(
            ThemeControl,
            {label: getLocalMessage("contrast")},
            m(Slider, {
                value: props.value,
                min: 50,
                max: 150,
                step: 1,
                formatValue: formatPercent,
                onChange: props.onChange
            })
        );
    }

    function FontPicker(props) {
        return m(
            ThemeControl,
            {label: "Font name"},
            m(Select$1, {
                class: {
                    "font-picker": true,
                    "font-picker--disabled": !props.theme.useFont
                },
                value: props.theme.fontFamily,
                onChange: props.onChange,
                options: props.fonts.reduce((map, font) => {
                    map[font] = m("div", {style: {"font-family": font}}, font);
                    return map;
                }, {})
            })
        );
    }

    function Grayscale(props) {
        return m(
            ThemeControl,
            {label: getLocalMessage("grayscale")},
            m(Slider, {
                value: props.value,
                min: 0,
                max: 100,
                step: 1,
                formatValue: formatPercent,
                onChange: props.onChange
            })
        );
    }

    var ThemeEngines = {
        cssFilter: "cssFilter",
        svgFilter: "svgFilter",
        staticTheme: "staticTheme",
        dynamicTheme: "dynamicTheme"
    };

    function Mode(props) {
        function openCSSEditor() {
            chrome.windows.create({
                type: "panel",
                url: isFirefox()
                    ? "../stylesheet-editor/index.html"
                    : "ui/stylesheet-editor/index.html",
                width: 600,
                height: 600
            });
        }
        const modes = [
            {
                id: ThemeEngines.dynamicTheme,
                content: getLocalMessage("engine_dynamic")
            },
            {
                id: ThemeEngines.cssFilter,
                content: getLocalMessage("engine_filter")
            },
            {
                id: ThemeEngines.svgFilter,
                content: getLocalMessage("engine_filter_plus")
            },
            {
                id: ThemeEngines.staticTheme,
                content: getLocalMessage("engine_static")
            }
        ];
        return m(
            ThemeControl,
            {label: "Mode"},
            m(
                "div",
                {class: "mode-control-container"},
                m(DropDown, {
                    selected: modes.find((m) => m.id === props.mode).id,
                    options: modes,
                    onChange: props.onChange
                }),
                m("span", {
                    class: {
                        "static-edit-button": true,
                        "static-edit-button--hidden":
                            props.mode !== ThemeEngines.staticTheme
                    },
                    onclick: openCSSEditor
                })
            )
        );
    }

    const DEFAULT_COLORS = {
        darkScheme: {
            background: "#181a1b",
            text: "#e8e6e3"
        },
        lightScheme: {
            background: "#dcdad7",
            text: "#181a1b"
        }
    };
    const DEFAULT_THEME = {
        mode: 1,
        brightness: 100,
        contrast: 100,
        grayscale: 0,
        sepia: 0,
        useFont: false,
        fontFamily: isMacOS()
            ? "Helvetica Neue"
            : isWindows()
            ? "Segoe UI"
            : "Open Sans",
        textStroke: 0,
        engine: ThemeEngines.dynamicTheme,
        stylesheet: "",
        darkSchemeBackgroundColor: DEFAULT_COLORS.darkScheme.background,
        darkSchemeTextColor: DEFAULT_COLORS.darkScheme.text,
        lightSchemeBackgroundColor: DEFAULT_COLORS.lightScheme.background,
        lightSchemeTextColor: DEFAULT_COLORS.lightScheme.text,
        scrollbarColor: isMacOS() ? "" : "auto",
        selectionColor: "auto"
    };
    const DEFAULT_SETTINGS = {
        enabled: true,
        theme: DEFAULT_THEME,
        presets: [],
        customThemes: [],
        siteList: [],
        siteListEnabled: [],
        applyToListedOnly: false,
        changeBrowserTheme: false,
        notifyOfNews: false,
        syncSettings: true,
        syncSitesFixes: false,
        automation: "",
        time: {
            activation: "18:00",
            deactivation: "9:00"
        },
        location: {
            latitude: null,
            longitude: null
        },
        previewNewDesign: false,
        enableForPDF: true
    };

    function ResetButtonGroup(props) {
        function reset() {
            props.actions.setTheme(DEFAULT_SETTINGS.theme);
        }
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(ResetButton$1, {onClick: reset}, "Reset to defaults")
            ),
            m(
                ControlGroup$1.Description,
                null,
                "Restore current theme values to defaults"
            )
        );
    }

    function Scheme(props) {
        return m(
            ThemeControl,
            {label: "Scheme"},
            m(DropDown, {
                selected: props.isDark,
                options: [
                    {id: true, content: getLocalMessage("dark")},
                    {id: false, content: getLocalMessage("light")}
                ],
                onChange: props.onChange
            })
        );
    }

    function ScrollbarEditor(props) {
        return m(
            ThemeControl,
            {label: "Scrollbar"},
            m(ColorDropDown, {
                value: props.value,
                colorSuggestion: "#959799",
                onChange: props.onChange,
                onReset: props.onReset,
                hasAutoOption: true,
                hasDefaultOption: true
            })
        );
    }

    function SelectionColorEditor(props) {
        return m(
            ThemeControl,
            {label: "Selection"},
            m(ColorDropDown, {
                value: props.value,
                colorSuggestion: "#005ccc",
                onChange: props.onChange,
                onReset: props.onReset,
                hasAutoOption: true,
                hasDefaultOption: true
            })
        );
    }

    function Sepia(props) {
        return m(
            ThemeControl,
            {label: getLocalMessage("sepia")},
            m(Slider, {
                value: props.value,
                min: 0,
                max: 100,
                step: 1,
                formatValue: formatPercent,
                onChange: props.onChange
            })
        );
    }

    function TextColorEditor(props) {
        return m(
            ThemeControl,
            {label: "Text"},
            m(ColorPicker$1, {
                color: props.value,
                onChange: props.onChange,
                canReset: props.canReset,
                onReset: props.onReset
            })
        );
    }

    function TextStroke(props) {
        return m(
            ThemeControl,
            {label: "Text stroke"},
            m(Slider, {
                value: props.value,
                min: 0,
                max: 1,
                step: 0.1,
                formatValue: String,
                onChange: props.onChange
            })
        );
    }

    function UseFont(props) {
        const options = [
            {id: true, content: "Yes"},
            {id: false, content: "No"}
        ];
        return m(
            ThemeControl,
            {label: "Change font"},
            m(DropDown, {
                options: options,
                onChange: props.onChange,
                selected: props.value
            })
        );
    }

    function hexify(number) {
        return (number < 16 ? "0" : "") + number.toString(16);
    }
    function generateUID() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map((x) => hexify(x))
            .join("");
    }

    function PresetItem(props) {
        const context = getComponentContext();
        const store = context.store;
        function onRemoveClick(e) {
            e.stopPropagation();
            store.isConfirmationVisible = true;
            context.refresh();
        }
        function onConfirmRemoveClick() {
            const filtered = props.data.settings.presets.filter(
                (p) => p.id !== props.preset.id
            );
            props.actions.changeSettings({presets: filtered});
        }
        function onCancelRemoveClick() {
            store.isConfirmationVisible = false;
            context.refresh();
        }
        const confirmation = store.isConfirmationVisible
            ? m(MessageBox, {
                  caption: `Are you sure you want to remove ${props.preset.name}?`,
                  onOK: onConfirmRemoveClick,
                  onCancel: onCancelRemoveClick
              })
            : null;
        return m(
            "span",
            {class: "theme-preset-picker__preset"},
            m(
                "span",
                {class: "theme-preset-picker__preset__name"},
                props.preset.name
            ),
            m("span", {
                class: "theme-preset-picker__preset__remove-button",
                onclick: onRemoveClick
            }),
            confirmation
        );
    }
    const MAX_ALLOWED_PRESETS = 3;
    function PresetPicker(props) {
        const host = getURLHost(props.tab.url || "");
        const preset = props.data.settings.presets.find(({urls}) =>
            isURLInList(props.tab.url, urls)
        );
        const custom = props.data.settings.customThemes.find(({url}) =>
            isURLInList(props.tab.url, url)
        );
        const selectedPresetId = custom
            ? "custom"
            : preset
            ? preset.id
            : "default";
        const defaultOption = {id: "default", content: "Default theme"};
        const addNewPresetOption =
            props.data.settings.presets.length < MAX_ALLOWED_PRESETS
                ? {id: "add-preset", content: "\uff0b Create new theme"}
                : null;
        const userPresetsOptions = props.data.settings.presets.map((preset) => {
            if (preset.id === selectedPresetId) {
                return {id: preset.id, content: preset.name};
            }
            return {
                id: preset.id,
                content: m(
                    PresetItem,
                    Object.assign({}, props, {preset: preset})
                )
            };
        });
        const customSitePresetOption = {
            id: "custom",
            content: `${
                selectedPresetId === "custom" ? "\u2605" : "\u2606"
            } Custom for ${host}`
        };
        const dropdownOptions = [
            defaultOption,
            ...userPresetsOptions,
            addNewPresetOption,
            customSitePresetOption
        ].filter(Boolean);
        function onPresetChange(id) {
            const filteredCustomThemes = props.data.settings.customThemes.filter(
                ({url}) => !isURLInList(props.tab.url, url)
            );
            const filteredPresets = props.data.settings.presets.map(
                (preset) => {
                    return {
                        ...preset,
                        urls: preset.urls.filter(
                            (template) => !isURLMatched(props.tab.url, template)
                        )
                    };
                }
            );
            if (id === "default") {
                props.actions.changeSettings({
                    customThemes: filteredCustomThemes,
                    presets: filteredPresets
                });
            } else if (id === "custom") {
                const extended = filteredCustomThemes.concat({
                    url: [host],
                    theme: {...props.data.settings.theme}
                });
                props.actions.changeSettings({
                    customThemes: extended,
                    presets: filteredPresets
                });
            } else if (id === "add-preset") {
                let newPresetName;
                for (let i = 0; i <= props.data.settings.presets.length; i++) {
                    newPresetName = `Theme ${i + 1}`;
                    if (
                        props.data.settings.presets.every(
                            (p) => p.name !== newPresetName
                        )
                    ) {
                        break;
                    }
                }
                const extended = filteredPresets.concat({
                    id: `preset-${generateUID()}`,
                    name: newPresetName,
                    urls: [host],
                    theme: {...props.data.settings.theme}
                });
                props.actions.changeSettings({
                    customThemes: filteredCustomThemes,
                    presets: extended
                });
            } else {
                const chosenPresetId = id;
                const extended = filteredPresets.map((preset) => {
                    if (preset.id === chosenPresetId) {
                        return {
                            ...preset,
                            urls: preset.urls.concat(host)
                        };
                    }
                    return preset;
                });
                props.actions.changeSettings({
                    customThemes: filteredCustomThemes,
                    presets: extended
                });
            }
        }
        return m(DropDown, {
            class: "theme-preset-picker",
            selected: selectedPresetId,
            options: dropdownOptions,
            onChange: onPresetChange
        });
    }

    function getCurrentThemePreset(props) {
        const custom = props.data.settings.customThemes.find(({url}) =>
            isURLInList(props.tab.url, url)
        );
        const preset = custom
            ? null
            : props.data.settings.presets.find(({urls}) =>
                  isURLInList(props.tab.url, urls)
              );
        const theme = custom
            ? custom.theme
            : preset
            ? preset.theme
            : props.data.settings.theme;
        function setTheme(config) {
            if (custom) {
                custom.theme = {...custom.theme, ...config};
                props.actions.changeSettings({
                    customThemes: props.data.settings.customThemes
                });
            } else if (preset) {
                preset.theme = {...preset.theme, ...config};
                props.actions.changeSettings({
                    presets: props.data.settings.presets
                });
            } else {
                props.actions.setTheme(config);
            }
        }
        return {
            theme,
            change: setTheme
        };
    }

    function ThemeControls(props) {
        const {theme, onChange} = props;
        return m(
            "section",
            {class: "m-section m-theme-controls"},
            m(Brightness, {
                value: theme.brightness,
                onChange: (v) => onChange({brightness: v})
            }),
            m(Contrast, {
                value: theme.contrast,
                onChange: (v) => onChange({contrast: v})
            }),
            m(Scheme, {
                isDark: theme.mode === 1,
                onChange: (isDark) => onChange({mode: isDark ? 1 : 0})
            }),
            m(Mode, {
                mode: theme.engine,
                onChange: (mode) => onChange({engine: mode})
            })
        );
    }
    function ThemeGroup(props) {
        const preset = getCurrentThemePreset(props);
        return m(
            "div",
            {class: "theme-group"},
            m(
                "div",
                {class: "theme-group__presets-wrapper"},
                m(PresetPicker, Object.assign({}, props))
            ),
            m(
                "div",
                {class: "theme-group__controls-wrapper"},
                m(ThemeControls, {
                    theme: preset.theme,
                    onChange: preset.change
                }),
                m(
                    Button,
                    {
                        class: "theme-group__more-button",
                        onclick: props.onThemeNavClick
                    },
                    "See all options"
                )
            ),
            m("label", {class: "theme-group__description"}, "Configure theme")
        );
    }

    function SwitchGroup(props) {
        return m(
            Array,
            null,
            m(AppSwitch, Object.assign({}, props)),
            m(SiteToggleGroup, Object.assign({}, props))
        );
    }
    function SettingsNavButton(props) {
        return m(
            ResetButton,
            {onClick: props.onClick},
            m("span", {class: "settings-button-icon"}),
            "Settings"
        );
    }
    function MainPage(props) {
        return m(
            Array,
            null,
            m(
                "section",
                {class: "m-section"},
                m(SwitchGroup, Object.assign({}, props))
            ),
            m(
                "section",
                {class: "m-section"},
                m(ThemeGroup, Object.assign({}, props))
            ),
            m(
                "section",
                {class: "m-section"},
                m(SettingsNavButton, {onClick: props.onSettingsNavClick}),
                m(HelpGroup, null)
            )
        );
    }

    function Page(props, content) {
        return m(
            "div",
            {class: {"page": true, "page--active": props.active}},
            m("div", {class: "page__content"}, content),
            props.first
                ? null
                : m(
                      Button,
                      {
                          class: "page__back-button",
                          onclick: props.onBackButtonClick
                      },
                      "Back"
                  )
        );
    }
    function PageViewer(props, ...pages) {
        return m(
            "div",
            {class: "page-viewer"},
            pages.map((pageSpec, i) => {
                return {
                    ...pageSpec,
                    props: {
                        ...pageSpec.props,
                        active: props.activePage === pageSpec.props.id,
                        first: i === 0,
                        onBackButtonClick: props.onBackButtonClick
                    }
                };
            })
        );
    }

    function AutomationButton(props) {
        const now = new Date();
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(
                    ResetButton,
                    {onClick: props.onClick},
                    m(
                        "span",
                        {class: "automation-button-icon"},
                        m(WatchIcon, {
                            hours: now.getHours(),
                            minutes: now.getMinutes()
                        })
                    ),
                    "Automation"
                )
            ),
            m(ControlGroup$1.Description, null, "Configure when app is enabled")
        );
    }

    function getExistingDevToolsObject() {
        if (isMobile()) {
            return new Promise((resolve) => {
                chrome.tabs.query({}, (t) => {
                    for (const tab of t) {
                        if (tab.url.endsWith("ui/devtools/index.html")) {
                            resolve(tab);
                            return;
                        }
                    }
                    resolve(null);
                });
            });
        }
        return new Promise((resolve) => {
            chrome.windows.getAll(
                {
                    populate: true,
                    windowTypes: ["popup"]
                },
                (w) => {
                    for (const window of w) {
                        if (
                            window.tabs[0].url.endsWith(
                                "ui/devtools/index.html"
                            )
                        ) {
                            resolve(window);
                            return;
                        }
                    }
                    resolve(null);
                }
            );
        });
    }
    async function openDevTools() {
        const devToolsObject = await getExistingDevToolsObject();
        if (isMobile()) {
            if (devToolsObject) {
                chrome.tabs.update(devToolsObject.id, {active: true});
                window.close();
            } else {
                chrome.tabs.create({
                    url: "../devtools/index.html"
                });
                window.close();
            }
        } else {
            if (devToolsObject) {
                chrome.windows.update(devToolsObject.id, {focused: true});
            } else {
                chrome.windows.create({
                    type: "popup",
                    url: isFirefox()
                        ? "../devtools/index.html"
                        : "ui/devtools/index.html",
                    width: 600,
                    height: 600
                });
            }
        }
    }
    function DevToolsGroup(props) {
        const globalThemeEngine = props.data.settings.theme.engine;
        const devtoolsData = props.data.devtools;
        const hasCustomFixes =
            (globalThemeEngine === ThemeEngines.dynamicTheme &&
                devtoolsData.hasCustomDynamicFixes) ||
            ([ThemeEngines.cssFilter, ThemeEngines.svgFilter].includes(
                globalThemeEngine
            ) &&
                devtoolsData.hasCustomFilterFixes) ||
            (globalThemeEngine === ThemeEngines.staticTheme &&
                devtoolsData.hasCustomStaticFixes);
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(
                    ResetButton,
                    {
                        onClick: openDevTools,
                        class: {
                            "dev-tools-button": true,
                            "dev-tools-button--has-custom-fixes": hasCustomFixes
                        }
                    },
                    "\uD83D\uDEE0 ",
                    getLocalMessage("open_dev_tools")
                )
            ),
            m(ControlGroup$1.Description, null, "Make a fix for a website")
        );
    }

    function ManageSettingsButton(props) {
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(ResetButton, {onClick: props.onClick}, "Manage settings")
            ),
            m(
                ControlGroup$1.Description,
                null,
                "Reset, export or import settings"
            )
        );
    }

    function SiteListButton(props) {
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(ResetButton, {onClick: props.onClick}, "Site list")
            ),
            m(
                ControlGroup$1.Description,
                null,
                "Enable or disable on listed websites"
            )
        );
    }

    function CheckButton(props) {
        return m(
            ControlGroup$1,
            {class: "check-button"},
            m(
                ControlGroup$1.Control,
                null,
                m(
                    CheckBox,
                    {
                        class: "check-button__checkbox",
                        checked: props.checked,
                        onchange: (e) => props.onChange(e.target.checked)
                    },
                    props.label
                )
            ),
            m(
                ControlGroup$1.Description,
                {class: "check-button__description"},
                props.description
            )
        );
    }

    function EnabledByDefaultGroup(props) {
        function onEnabledByDefaultChange(checked) {
            props.actions.changeSettings({applyToListedOnly: !checked});
        }
        return m(CheckButton, {
            checked: !props.data.settings.applyToListedOnly,
            label: "Enable by default",
            description: props.data.settings.applyToListedOnly
                ? "Disabled on all websites by default"
                : "Enabled on all websites by default",
            onChange: onEnabledByDefaultChange
        });
    }

    function InvertPDF(props) {
        function onInvertPDFChange(checked) {
            props.actions.changeSettings({enableForPDF: checked});
        }
        return m(CheckButton, {
            checked: props.data.settings.enableForPDF,
            label: "Enable for PDF files",
            description: props.data.settings.enableForPDF
                ? "Enabled for PDF documents"
                : "Disabled for PDF documents",
            onChange: onInvertPDFChange
        });
    }

    function SettingsPage(props) {
        return m(
            "section",
            {class: "m-section"},
            m(EnabledByDefaultGroup, Object.assign({}, props)),
            isFirefox() ? null : m(InvertPDF, Object.assign({}, props)),
            m(SiteListButton, {onClick: props.onSiteListNavClick}),
            m(DevToolsGroup, Object.assign({}, props)),
            m(AutomationButton, {onClick: props.onAutomationNavClick}),
            m(ManageSettingsButton, {onClick: props.onManageSettingsClick})
        );
    }

    function SiteList(props) {
        const context = getComponentContext();
        const store = context.store;
        store.prevSiteList = store.prevSiteList || [];
        store.wasVisible = store.wasVisible || false;
        const {siteList} = props;
        const didSiteListChange =
            store.prevSiteList.length !== siteList.length ||
            store.prevSiteList.some((s, i) => s !== siteList[i]);
        store.prevSiteList = siteList;
        function setEditorText() {
            store.editorNode.value = siteList.join("\n") + "\n";
        }
        function onEditorRender(el) {
            store.editorNode = el;
            const isVisible = el.clientHeight > 0;
            const becameVisible = !store.wasVisible && isVisible;
            if (becameVisible || didSiteListChange) {
                setEditorText();
            }
            if (props.autoFocus && becameVisible) {
                el.selectionStart = el.value.length;
                el.selectionEnd = el.value.length;
                el.focus();
            }
            store.wasVisible = isVisible;
        }
        const placeholder = "www.google.com/maps\nmail.google.com\n";
        function isSiteURLValid(value) {
            return /^([^\.\s]+?\.?)+$/.test(value);
        }
        function onApplyClick() {
            let sites = store.editorNode.value
                .split("\n")
                .map((site) => site.trim())
                .filter(isSiteURLValid);
            sites = Array.from(new Set(sites));
            props.onChange(sites);
        }
        function onCancelClick() {
            setEditorText();
        }
        return m(
            "div",
            {class: "site-list"},
            m("textarea", {
                class: "site-list__editor",
                placeholder: placeholder,
                onrender: onEditorRender,
                autocomplete: "off",
                spellcheck: "false"
            }),
            m(
                "div",
                {class: "site-list__buttons"},
                m(
                    Button,
                    {
                        class: "site-list__button site-list__button-cancel",
                        onclick: onCancelClick
                    },
                    "Cancel"
                ),
                m(
                    Button,
                    {
                        class: "site-list__button site-list__button-apply",
                        onclick: onApplyClick
                    },
                    m(
                        "span",
                        {class: "site-list__button-apply__content"},
                        m("span", {class: "site-list__button-apply__icon"}),
                        "Apply"
                    )
                )
            )
        );
    }

    function SiteListPage(props) {
        function onSiteListChange(sites) {
            props.actions.changeSettings({siteList: sites});
        }
        const label = props.data.settings.applyToListedOnly
            ? "Enable on these websites"
            : "Disable on these websites";
        return m(
            "div",
            {class: "site-list-page"},
            m("label", {class: "site-list-page__label"}, label),
            m(SiteList, {
                siteList: props.data.settings.siteList,
                onChange: onSiteListChange,
                autoFocus: true
            })
        );
    }

    function CollapsiblePanel({}, ...groups) {
        const context = getComponentContext();
        const store = context.store;
        if (store.activeGroup == null) {
            store.activeGroup = groups[0].props.id;
        }
        return m(
            "div",
            {class: "collapsible-panel"},
            groups.map((spec, i) => {
                const activeIndex = groups.findIndex(
                    (g) => store.activeGroup === g.props.id
                );
                const collapsed = i !== activeIndex;
                const collapseTop = i < activeIndex;
                const collapseBottom = i > activeIndex;
                const onExpand = () => {
                    store.activeGroup = spec.props.id;
                    context.refresh();
                };
                return {
                    ...spec,
                    props: {
                        ...spec.props,
                        collapsed,
                        collapseBottom,
                        collapseTop,
                        onExpand
                    }
                };
            })
        );
    }
    function Group(props, content) {
        return m(
            "div",
            {
                class: {
                    "collapsible-panel__group": true,
                    "collapsible-panel__group--collapsed": props.collapsed,
                    "collapsible-panel__group--collapse-top": props.collapseTop,
                    "collapsible-panel__group--collapse-bottom":
                        props.collapseBottom
                }
            },
            m("div", {class: "collapsible-panel__group__content"}, content),
            m(
                "span",
                {
                    role: "button",
                    class: "collapsible-panel__group__expand-button",
                    onclick: props.onExpand
                },
                props.label
            )
        );
    }
    var Collapsible = Object.assign(CollapsiblePanel, {Group});

    function MainGroup({theme, change}) {
        return m(
            Array,
            null,
            m(Brightness, {
                value: theme.brightness,
                onChange: (v) => change({brightness: v})
            }),
            m(Contrast, {
                value: theme.contrast,
                onChange: (v) => change({contrast: v})
            }),
            m(Sepia, {value: theme.sepia, onChange: (v) => change({sepia: v})}),
            m(Grayscale, {
                value: theme.grayscale,
                onChange: (v) => change({grayscale: v})
            }),
            m(Scheme, {
                isDark: theme.mode === 1,
                onChange: (isDark) => change({mode: isDark ? 1 : 0})
            }),
            m(Mode, {
                mode: theme.engine,
                onChange: (mode) => change({engine: mode})
            })
        );
    }
    function ColorsGroup({theme, change}) {
        const isDarkScheme = theme.mode === 1;
        const bgProp = isDarkScheme
            ? "darkSchemeBackgroundColor"
            : "lightSchemeBackgroundColor";
        const fgProp = isDarkScheme
            ? "darkSchemeTextColor"
            : "lightSchemeTextColor";
        const defaultSchemeColors = isDarkScheme
            ? DEFAULT_COLORS.darkScheme
            : DEFAULT_COLORS.lightScheme;
        const defaultMatrixValues = {
            brightness: DEFAULT_THEME.brightness,
            contrast: DEFAULT_THEME.contrast,
            sepia: DEFAULT_THEME.sepia,
            grayscale: DEFAULT_THEME.grayscale
        };
        return m(
            Array,
            null,
            m(BackgroundColorEditor, {
                value:
                    theme[bgProp] === "auto"
                        ? defaultSchemeColors.background
                        : theme[bgProp],
                onChange: (v) => change({[bgProp]: v, ...defaultMatrixValues}),
                canReset: theme[bgProp] !== defaultSchemeColors.background,
                onReset: () =>
                    change({[bgProp]: DEFAULT_SETTINGS.theme[bgProp]})
            }),
            m(TextColorEditor, {
                value:
                    theme[fgProp] === "auto"
                        ? defaultSchemeColors.text
                        : theme[fgProp],
                onChange: (v) => change({[fgProp]: v, ...defaultMatrixValues}),
                canReset: theme[fgProp] !== defaultSchemeColors.text,
                onReset: () =>
                    change({[fgProp]: DEFAULT_SETTINGS.theme[fgProp]})
            }),
            m(ScrollbarEditor, {
                value: theme.scrollbarColor,
                onChange: (v) => change({scrollbarColor: v}),
                onReset: () =>
                    change({
                        scrollbarColor: DEFAULT_SETTINGS.theme.scrollbarColor
                    })
            }),
            m(SelectionColorEditor, {
                value: theme.selectionColor,
                onChange: (v) => change({selectionColor: v}),
                onReset: () =>
                    change({
                        selectionColor: DEFAULT_SETTINGS.theme.selectionColor
                    })
            })
        );
    }
    function FontGroup({theme, fonts, change}) {
        return m(
            Array,
            null,
            m(UseFont, {
                value: theme.useFont,
                onChange: (useFont) => change({useFont})
            }),
            m(FontPicker, {
                theme: theme,
                fonts: fonts,
                onChange: (fontFamily) => change({fontFamily})
            }),
            m(TextStroke, {
                value: theme.textStroke,
                onChange: (textStroke) => change({textStroke})
            })
        );
    }
    function ThemePage(props) {
        const {theme, change} = getCurrentThemePreset(props);
        return m(
            "section",
            {class: "m-section theme-page"},
            m(PresetPicker, Object.assign({}, props)),
            m(
                Collapsible,
                null,
                m(
                    Collapsible.Group,
                    {id: "main", label: "Brightness, contrast, mode"},
                    m(MainGroup, {theme: theme, change: change})
                ),
                m(
                    Collapsible.Group,
                    {id: "colors", label: "Colors"},
                    m(ColorsGroup, {theme: theme, change: change})
                ),
                m(
                    Collapsible.Group,
                    {id: "font", label: "Font, text stroke"},
                    m(FontGroup, {
                        theme: theme,
                        fonts: props.data.fonts,
                        change: change
                    })
                )
            ),
            m(ResetButtonGroup, Object.assign({}, props))
        );
    }

    function ResetButtonGroup$1(props) {
        const context = getComponentContext();
        function showDialog() {
            context.store.isDialogVisible = true;
            context.refresh();
        }
        function hideDialog() {
            context.store.isDialogVisible = false;
            context.refresh();
        }
        function reset() {
            context.store.isDialogVisible = false;
            props.actions.changeSettings(DEFAULT_SETTINGS);
        }
        const dialog = context.store.isDialogVisible
            ? m(MessageBox, {
                  caption:
                      "Are you sure you want to remove all your settings? You cannot restore them later",
                  onOK: reset,
                  onCancel: hideDialog
              })
            : null;
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(
                    ResetButton$1,
                    {onClick: showDialog},
                    "Reset settings",
                    dialog
                )
            ),
            m(ControlGroup$1.Description, null, "Restore settings to defaults")
        );
    }

    function ImportButton(props) {
        function getValidatedObject(source, compare) {
            const result = {};
            if (
                source == null ||
                typeof source !== "object" ||
                Array.isArray(source)
            ) {
                return null;
            }
            Object.keys(source).forEach((key) => {
                const value = source[key];
                if (value == null || compare[key] == null) {
                    return;
                }
                const array1 = Array.isArray(value);
                const array2 = Array.isArray(compare[key]);
                if (array1 || array2) {
                    if (array1 && array2) {
                        result[key] = value;
                    }
                } else if (
                    typeof value === "object" &&
                    typeof compare[key] === "object"
                ) {
                    result[key] = getValidatedObject(value, compare[key]);
                } else if (typeof value === typeof compare[key]) {
                    result[key] = value;
                }
            });
            return result;
        }
        function importSettings() {
            openFile({extensions: ["json"]}, (result) => {
                try {
                    const content = JSON.parse(result);
                    const result2 = getValidatedObject(
                        content,
                        DEFAULT_SETTINGS
                    );
                    props.actions.changeSettings({...result2});
                } catch (err) {
                    console.error(err);
                }
            });
        }
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(
                    Button,
                    {onclick: importSettings, class: "settings-button"},
                    "Import Settings"
                )
            ),
            m(
                ControlGroup$1.Description,
                null,
                "Open settings from a JSON file"
            )
        );
    }

    function ExportButton(props) {
        function exportSettings() {
            saveFile(
                "Dark-Reader-Settings.json",
                JSON.stringify(props.data.settings, null, 4)
            );
        }
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(
                    Button,
                    {onclick: exportSettings, class: "settings-button"},
                    "Export Settings"
                )
            ),
            m(ControlGroup$1.Description, null, "Save settings to a JSON file")
        );
    }

    function SyncSettings(props) {
        function onSyncSettingsChange(checked) {
            props.actions.changeSettings({syncSettings: checked});
        }
        return m(CheckButton, {
            checked: props.data.settings.syncSettings,
            label: "Enable settings sync",
            description: props.data.settings.syncSettings
                ? "Synchronized across devices"
                : "Not synchronized across devices",
            onChange: onSyncSettingsChange
        });
    }

    function ExportTheme() {
        const listener = ({type, data}, sender) => {
            if (type === "export-css-response") {
                const url = getURLHost(sender.tab.url).replace(
                    /[^a-z0-1\-]/g,
                    "-"
                );
                saveFile(`DarkReader-${url}.css`, data);
                chrome.runtime.onMessage.removeListener(listener);
            }
        };
        function exportCSS() {
            chrome.runtime.onMessage.addListener(listener);
            chrome.runtime.sendMessage({type: "request-export-css"});
        }
        return m(
            ControlGroup$1,
            null,
            m(
                ControlGroup$1.Control,
                null,
                m(
                    Button,
                    {onclick: exportCSS, class: "settings-button"},
                    "Export Dynamic Theme"
                )
            ),
            m(ControlGroup$1.Description, null, "Save generated CSS to a file")
        );
    }

    function SyncConfigButton(props) {
        function syncConfig(syncSitesFixes) {
            props.actions.changeSettings({syncSitesFixes});
            props.actions.loadConfig({local: !syncSitesFixes});
        }
        return m(CheckButton, {
            checked: props.data.settings.syncSitesFixes,
            label: "Synchronize sites fixes",
            description: "Load the latest sites fixes from a remote server",
            onChange: syncConfig
        });
    }

    function ManageSettingsPage(props) {
        const custom = props.data.settings.customThemes.find(({url}) =>
            isURLInList(props.tab.url, url)
        );
        const engine = custom
            ? custom.theme.engine
            : props.data.settings.theme.engine;
        return m(
            "section",
            {class: "m-section"},
            m(SyncSettings, Object.assign({}, props)),
            m(SyncConfigButton, Object.assign({}, props)),
            m(ImportButton, Object.assign({}, props)),
            m(ExportButton, Object.assign({}, props)),
            engine === ThemeEngines.dynamicTheme ? m(ExportTheme, null) : null,
            m(ResetButtonGroup$1, Object.assign({}, props))
        );
    }

    function Logo() {
        return m(
            "a",
            {
                class: "m-logo",
                href: "https://darkreader.org/",
                target: "_blank",
                rel: "noopener noreferrer"
            },
            "Dark Reader"
        );
    }
    function Pages(props) {
        const context = getComponentContext();
        const store = context.store;
        if (store.activePage == null) {
            store.activePage = "main";
        }
        function onThemeNavClick() {
            store.activePage = "theme";
            context.refresh();
        }
        function onSettingsNavClick() {
            store.activePage = "settings";
            context.refresh();
        }
        function onAutomationNavClick() {
            store.activePage = "automation";
            context.refresh();
        }
        function onManageSettingsClick() {
            store.activePage = "manage-settings";
            context.refresh();
        }
        function onSiteListNavClick() {
            store.activePage = "site-list";
            context.refresh();
        }
        function onBackClick() {
            const activePage = store.activePage;
            const settingsPageSubpages = [
                "automation",
                "manage-settings",
                "site-list"
            ];
            if (settingsPageSubpages.includes(activePage)) {
                store.activePage = "settings";
            } else {
                store.activePage = "main";
            }
            context.refresh();
        }
        return m(
            PageViewer,
            {activePage: store.activePage, onBackButtonClick: onBackClick},
            m(
                Page,
                {id: "main"},
                m(
                    MainPage,
                    Object.assign({}, props, {
                        onThemeNavClick: onThemeNavClick,
                        onSettingsNavClick: onSettingsNavClick
                    })
                )
            ),
            m(Page, {id: "theme"}, m(ThemePage, Object.assign({}, props))),
            m(
                Page,
                {id: "settings"},
                m(
                    SettingsPage,
                    Object.assign({}, props, {
                        onAutomationNavClick: onAutomationNavClick,
                        onManageSettingsClick: onManageSettingsClick,
                        onSiteListNavClick: onSiteListNavClick
                    })
                )
            ),
            m(
                Page,
                {id: "site-list"},
                m(SiteListPage, Object.assign({}, props))
            ),
            m(
                Page,
                {id: "automation"},
                m(AutomationPage, Object.assign({}, props))
            ),
            m(
                Page,
                {id: "manage-settings"},
                m(ManageSettingsPage, Object.assign({}, props))
            )
        );
    }
    function DonateGroup() {
        return m(
            "div",
            {class: "m-donate-group"},
            m(
                "a",
                {
                    class: "m-donate-button",
                    href: DONATE_URL,
                    target: "_blank",
                    rel: "noopener noreferrer"
                },
                m(
                    "span",
                    {class: "m-donate-button__text"},
                    getLocalMessage("donate")
                )
            ),
            m(
                "label",
                {class: "m-donate-description"},
                "This project is sponsored by you"
            )
        );
    }
    let appVersion;
    function AppVersion() {
        if (!appVersion) {
            appVersion = chrome.runtime.getManifest().version;
        }
        return m(
            "label",
            {class: "darkreader-version"},
            "Version 5 Preview (",
            appVersion,
            ")"
        );
    }
    function Body(props) {
        const context = getComponentContext();
        context.onCreate(() => {
            document.documentElement.classList.add("preview");
            if (isMobile()) {
                window.addEventListener("contextmenu", (e) =>
                    e.preventDefault()
                );
            }
        });
        context.onRemove(() => {
            document.documentElement.classList.remove("preview");
        });
        return m(
            "body",
            null,
            m("section", {class: "m-section"}, m(Logo, null)),
            m(
                "section",
                {class: "m-section pages-section"},
                m(Pages, Object.assign({}, props))
            ),
            m("section", {class: "m-section"}, m(DonateGroup, null)),
            m(AppVersion, null),
            m(Overlay$1, null)
        );
    }

    const engineNames = [
        [ThemeEngines.cssFilter, getLocalMessage("engine_filter")],
        [ThemeEngines.svgFilter, getLocalMessage("engine_filter_plus")],
        [ThemeEngines.staticTheme, getLocalMessage("engine_static")],
        [ThemeEngines.dynamicTheme, getLocalMessage("engine_dynamic")]
    ];
    function openCSSEditor() {
        chrome.windows.create({
            type: "panel",
            url: isFirefox()
                ? "../stylesheet-editor/index.html"
                : "ui/stylesheet-editor/index.html",
            width: 600,
            height: 600
        });
    }
    function EngineSwitch({engine, onChange}) {
        return m(
            "div",
            {class: "engine-switch"},
            m(MultiSwitch, {
                value: engineNames.find(([code]) => code === engine)[1],
                options: engineNames.map(([, name]) => name),
                onChange: (value) =>
                    onChange(engineNames.find(([, name]) => name === value)[0])
            }),
            m("span", {
                class: {
                    "engine-switch__css-edit-button": true,
                    "engine-switch__css-edit-button_active":
                        engine === ThemeEngines.staticTheme
                },
                onclick: openCSSEditor
            }),
            m(
                "label",
                {class: "engine-switch__description"},
                getLocalMessage("theme_generation_mode")
            )
        );
    }

    function FontSettings({config, fonts, onChange}) {
        return m(
            "section",
            {class: "font-settings"},
            m(
                "div",
                {class: "font-settings__font-select-container"},
                m(
                    "div",
                    {class: "font-settings__font-select-container__line"},
                    m(CheckBox, {
                        checked: config.useFont,
                        onchange: (e) => onChange({useFont: e.target.checked})
                    }),
                    m(Select$1, {
                        value: config.fontFamily,
                        onChange: (value) => onChange({fontFamily: value}),
                        options: fonts.reduce((map, font) => {
                            map[font] = m(
                                "div",
                                {style: {"font-family": font}},
                                font
                            );
                            return map;
                        }, {})
                    })
                ),
                m(
                    "label",
                    {class: "font-settings__font-select-container__label"},
                    getLocalMessage("select_font")
                )
            ),
            m(UpDown, {
                value: config.textStroke,
                min: 0,
                max: 1,
                step: 0.1,
                default: 0,
                name: getLocalMessage("text_stroke"),
                onChange: (value) => onChange({textStroke: value})
            })
        );
    }

    function compileMarkdown(markdown) {
        return markdown
            .split("**")
            .map((text, i) => (i % 2 ? m("strong", null, text) : text));
    }

    function MoreSettings({data, actions, tab}) {
        const custom = data.settings.customThemes.find(({url}) =>
            isURLInList(tab.url, url)
        );
        const filterConfig = custom ? custom.theme : data.settings.theme;
        function setConfig(config) {
            if (custom) {
                custom.theme = {...custom.theme, ...config};
                actions.changeSettings({
                    customThemes: data.settings.customThemes
                });
            } else {
                actions.setTheme(config);
            }
        }
        return m(
            "section",
            {class: "more-settings"},
            m(
                "div",
                {class: "more-settings__section"},
                m(FontSettings, {
                    config: filterConfig,
                    fonts: data.fonts,
                    onChange: setConfig
                })
            ),
            m(
                "div",
                {class: "more-settings__section"},
                isFirefox()
                    ? null
                    : m(
                          "p",
                          {class: "more-settings__description"},
                          compileMarkdown(
                              getLocalMessage("try_experimental_theme_engines")
                          )
                      ),
                m(EngineSwitch, {
                    engine: filterConfig.engine,
                    onChange: (engine) => setConfig({engine})
                })
            ),
            m(
                "div",
                {class: "more-settings__section"},
                m(CustomSettingsToggle, {
                    data: data,
                    tab: tab,
                    actions: actions
                }),
                tab.isProtected
                    ? m(
                          "p",
                          {
                              class:
                                  "more-settings__description more-settings__description--warning"
                          },
                          getLocalMessage("page_protected").replace("\n", " ")
                      )
                    : tab.isInDarkList
                    ? m(
                          "p",
                          {
                              class:
                                  "more-settings__description more-settings__description--warning"
                          },
                          getLocalMessage("page_in_dark_list").replace(
                              "\n",
                              " "
                          )
                      )
                    : m(
                          "p",
                          {class: "more-settings__description"},
                          getLocalMessage("only_for_description")
                      )
            ),
            isFirefox()
                ? m(
                      "div",
                      {class: "more-settings__section"},
                      m(Toggle, {
                          checked: data.settings.changeBrowserTheme,
                          labelOn: getLocalMessage("custom_browser_theme_on"),
                          labelOff: getLocalMessage("custom_browser_theme_off"),
                          onChange: (checked) =>
                              actions.changeSettings({
                                  changeBrowserTheme: checked
                              })
                      }),
                      m(
                          "p",
                          {class: "more-settings__description"},
                          getLocalMessage("change_browser_theme")
                      )
                  )
                : null
        );
    }

    const NEWS_COUNT = 2;
    function News({news, expanded, onNewsOpen, onClose}) {
        return m(
            "div",
            {class: {"news": true, "news--expanded": expanded}},
            m(
                "div",
                {class: "news__header"},
                m(
                    "span",
                    {class: "news__header__text"},
                    getLocalMessage("news")
                ),
                m(
                    "span",
                    {class: "news__close", role: "button", onclick: onClose},
                    "\u2715"
                )
            ),
            m(
                "div",
                {class: "news__list"},
                news.slice(0, NEWS_COUNT).map((event) => {
                    const date = new Date(event.date);
                    let formattedDate;
                    try {
                        const locale = getUILanguage();
                        formattedDate = date.toLocaleDateString(locale, {
                            month: "short",
                            day: "numeric"
                        });
                    } catch (err) {
                        formattedDate = date.toISOString().substring(0, 10);
                    }
                    return m(
                        "div",
                        {
                            class: {
                                "news__event": true,
                                "news__event--unread": !event.read,
                                "news__event--important": event.important
                            }
                        },
                        m(
                            "a",
                            {
                                class: "news__event__link",
                                onclick: () => onNewsOpen(event),
                                href: event.url,
                                target: "_blank",
                                rel: "noopener noreferrer"
                            },
                            m(
                                "span",
                                {class: "news__event__date"},
                                formattedDate
                            ),
                            event.headline
                        )
                    );
                }),
                news.length <= NEWS_COUNT
                    ? null
                    : m(
                          "a",
                          {
                              class: {
                                  "news__read-more": true,
                                  "news__read-more--unread": news
                                      .slice(NEWS_COUNT)
                                      .find(({read}) => !read)
                              },
                              href: BLOG_URL,
                              target: "_blank",
                              onclick: () => onNewsOpen(...news),
                              rel: "noopener noreferrer"
                          },
                          getLocalMessage("read_more")
                      )
            )
        );
    }
    function NewsButton({active, count, onClick}) {
        return m(
            Button,
            {
                "class": {"news-button": true, "news-button--active": active},
                "href": "#news",
                "data-count": count > 0 && !active ? count : null,
                "onclick": (e) => {
                    e.currentTarget.blur();
                    onClick();
                }
            },
            getLocalMessage("news")
        );
    }

    function SiteListSettings({data, actions, isFocused}) {
        function isSiteUrlValid(value) {
            return /^([^\.\s]+?\.?)+$/.test(value);
        }
        return m(
            "section",
            {class: "site-list-settings"},
            m(Toggle, {
                class: "site-list-settings__toggle",
                checked: data.settings.applyToListedOnly,
                labelOn: getLocalMessage("invert_listed_only"),
                labelOff: getLocalMessage("not_invert_listed"),
                onChange: (value) =>
                    actions.changeSettings({applyToListedOnly: value})
            }),
            m(TextList, {
                class: "site-list-settings__text-list",
                placeholder: "google.com/maps",
                values: data.settings.siteList,
                isFocused: isFocused,
                onChange: (values) => {
                    if (values.every(isSiteUrlValid)) {
                        actions.changeSettings({siteList: values});
                    }
                }
            }),
            m(ShortcutLink, {
                class: "site-list-settings__shortcut",
                commandName: "addSite",
                shortcuts: data.shortcuts,
                textTemplate: (hotkey) =>
                    hotkey
                        ? `${getLocalMessage("add_site_to_list")}: ${hotkey}`
                        : getLocalMessage("setup_add_site_hotkey"),
                onSetShortcut: (shortcut) =>
                    actions.setShortcut("addSite", shortcut)
            })
        );
    }

    function openDevTools$1() {
        chrome.windows.create({
            type: "panel",
            url: isFirefox()
                ? "../devtools/index.html"
                : "ui/devtools/index.html",
            width: 600,
            height: 600
        });
    }
    function Body$1(props) {
        const context = getComponentContext();
        const {state, setState} = useState({
            activeTab: "Filter",
            newsOpen: false,
            didNewsSlideIn: false,
            moreToggleSettingsOpen: false
        });
        if (!props.data.isReady) {
            return m("body", null, m(Loader$1, {complete: false}));
        }
        if (isMobile() || props.data.settings.previewNewDesign) {
            return m(Body, Object.assign({}, props));
        }
        const unreadNews = props.data.news.filter(({read}) => !read);
        const latestNews =
            props.data.news.length > 0 ? props.data.news[0] : null;
        const isFirstNewsUnread = latestNews && !latestNews.read;
        context.onRender(() => {
            if (isFirstNewsUnread && !state.newsOpen && !state.didNewsSlideIn) {
                setTimeout(toggleNews, 750);
            }
        });
        function toggleNews() {
            if (state.newsOpen && unreadNews.length > 0) {
                props.actions.markNewsAsRead(unreadNews.map(({id}) => id));
            }
            setState({
                newsOpen: !state.newsOpen,
                didNewsSlideIn: state.didNewsSlideIn || !state.newsOpen
            });
        }
        function onNewsOpen(...news) {
            const unread = news.filter(({read}) => !read);
            if (unread.length > 0) {
                props.actions.markNewsAsRead(unread.map(({id}) => id));
            }
        }
        let displayedNewsCount = unreadNews.length;
        if (unreadNews.length > 0 && !props.data.settings.notifyOfNews) {
            const latest = new Date(unreadNews[0].date);
            const today = new Date();
            const newsWereLongTimeAgo =
                latest.getTime() < today.getTime() - getDuration({days: 14});
            if (newsWereLongTimeAgo) {
                displayedNewsCount = 0;
            }
        }
        const globalThemeEngine = props.data.settings.theme.engine;
        const devtoolsData = props.data.devtools;
        const hasCustomFixes =
            (globalThemeEngine === ThemeEngines.dynamicTheme &&
                devtoolsData.hasCustomDynamicFixes) ||
            ([ThemeEngines.cssFilter, ThemeEngines.svgFilter].includes(
                globalThemeEngine
            ) &&
                devtoolsData.hasCustomFilterFixes) ||
            (globalThemeEngine === ThemeEngines.staticTheme &&
                devtoolsData.hasCustomStaticFixes);
        function toggleMoreToggleSettings() {
            setState({moreToggleSettingsOpen: !state.moreToggleSettingsOpen});
        }
        return m(
            "body",
            {class: {"ext-disabled": !props.data.isEnabled}},
            m(Loader$1, {complete: true}),
            m(Header, {
                data: props.data,
                tab: props.tab,
                actions: props.actions,
                onMoreToggleSettingsClick: toggleMoreToggleSettings
            }),
            m(TabPanel, {
                activeTab: state.activeTab,
                onSwitchTab: (tab) => setState({activeTab: tab}),
                tabs: {
                    "Filter": m(FilterSettings, {
                        data: props.data,
                        actions: props.actions,
                        tab: props.tab
                    }),
                    "Site list": m(SiteListSettings, {
                        data: props.data,
                        actions: props.actions,
                        isFocused: state.activeTab === "Site list"
                    }),
                    "More": m(MoreSettings, {
                        data: props.data,
                        actions: props.actions,
                        tab: props.tab
                    })
                },
                tabLabels: {
                    "Filter": getLocalMessage("filter"),
                    "Site list": getLocalMessage("site_list"),
                    "More": getLocalMessage("more")
                }
            }),
            m(
                "footer",
                null,
                m(
                    "div",
                    {class: "footer-links"},
                    m(
                        "a",
                        {
                            class: "footer-links__link",
                            href: PRIVACY_URL,
                            target: "_blank",
                            rel: "noopener noreferrer"
                        },
                        getLocalMessage("privacy")
                    ),
                    m(
                        "a",
                        {
                            class: "footer-links__link",
                            href: TWITTER_URL,
                            target: "_blank",
                            rel: "noopener noreferrer"
                        },
                        "Twitter"
                    ),
                    m(
                        "a",
                        {
                            class: "footer-links__link",
                            href: GITHUB_URL,
                            target: "_blank",
                            rel: "noopener noreferrer"
                        },
                        "GitHub"
                    ),
                    m(
                        "a",
                        {
                            class: "footer-links__link",
                            href: getHelpURL(),
                            target: "_blank",
                            rel: "noopener noreferrer"
                        },
                        getLocalMessage("help")
                    )
                ),
                m(
                    "div",
                    {class: "footer-buttons"},
                    m(
                        "a",
                        {
                            class: "donate-link",
                            href: DONATE_URL,
                            target: "_blank",
                            rel: "noopener noreferrer"
                        },
                        m(
                            "span",
                            {class: "donate-link__text"},
                            getLocalMessage("donate")
                        )
                    ),
                    m(NewsButton, {
                        active: state.newsOpen,
                        count: displayedNewsCount,
                        onClick: toggleNews
                    }),
                    m(
                        Button,
                        {
                            onclick: openDevTools$1,
                            class: {
                                "dev-tools-button": true,
                                "dev-tools-button--has-custom-fixes": hasCustomFixes
                            }
                        },
                        "\uD83D\uDEE0 ",
                        getLocalMessage("open_dev_tools")
                    )
                )
            ),
            m(News, {
                news: props.data.news,
                expanded: state.newsOpen,
                onNewsOpen: onNewsOpen,
                onClose: toggleNews
            }),
            m(MoreToggleSettings, {
                data: props.data,
                actions: props.actions,
                isExpanded: state.moreToggleSettingsOpen,
                onClose: toggleMoreToggleSettings
            })
        );
    }
    var Body$2 = compose(Body$1, withState, withForms);

    function popupHasBuiltInBorders() {
        const chromeVersion = getChromeVersion();
        return Boolean(
            chromeVersion &&
                !isVivaldi() &&
                !isYaBrowser() &&
                !isOpera() &&
                isWindows() &&
                compareChromeVersions(chromeVersion, "62.0.3167.0") < 0
        );
    }
    function popupHasBuiltInHorizontalBorders() {
        const chromeVersion = getChromeVersion();
        return Boolean(
            chromeVersion &&
                !isVivaldi() &&
                !isYaBrowser() &&
                !isEdge() &&
                !isOpera() &&
                ((isWindows() &&
                    compareChromeVersions(chromeVersion, "62.0.3167.0") >= 0 &&
                    compareChromeVersions(chromeVersion, "74.0.0.0") < 0) ||
                    (isMacOS() &&
                        compareChromeVersions(chromeVersion, "67.0.3373.0") >=
                            0 &&
                        compareChromeVersions(chromeVersion, "73.0.3661.0") <
                            0))
        );
    }
    function fixNotClosingPopupOnNavigation() {
        document.addEventListener("click", (e) => {
            if (e.defaultPrevented || e.button === 2) {
                return;
            }
            let target = e.target;
            while (target && !(target instanceof HTMLAnchorElement)) {
                target = target.parentElement;
            }
            if (target && target.hasAttribute("href")) {
                chrome.tabs.create({url: target.getAttribute("href")});
                e.preventDefault();
                window.close();
            }
        });
    }

    function renderBody(data, tab, actions) {
        sync(
            document.body,
            m(Body$2, {data: data, tab: tab, actions: actions})
        );
    }
    async function start() {
        const connector = connect();
        window.addEventListener("unload", () => connector.disconnect());
        const [data, tab] = await Promise.all([
            connector.getData(),
            connector.getActiveTabInfo()
        ]);
        renderBody(data, tab, connector);
        connector.subscribeToChanges((data) =>
            renderBody(data, tab, connector)
        );
    }
    start();
    document.documentElement.classList.toggle("mobile", isMobile());
    document.documentElement.classList.toggle("firefox", isFirefox());
    document.documentElement.classList.toggle(
        "built-in-borders",
        popupHasBuiltInBorders()
    );
    document.documentElement.classList.toggle(
        "built-in-horizontal-borders",
        popupHasBuiltInHorizontalBorders()
    );
    if (isFirefox()) {
        fixNotClosingPopupOnNavigation();
    }
})();
