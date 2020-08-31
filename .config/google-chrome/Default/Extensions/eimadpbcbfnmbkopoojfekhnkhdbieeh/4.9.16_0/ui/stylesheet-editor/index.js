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
    Object.assign(ColorPicker, {focus: focusColorPicker});

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
    Object.assign(Overlay, {Portal});

    function getUILanguage() {
        const code = chrome.i18n.getUILanguage();
        if (code.endsWith("-mac")) {
            return code.substring(0, code.length - 4);
        }
        return code;
    }

    const is12H = new Date().toLocaleTimeString(getUILanguage()).endsWith("M");

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

    function Body({data, tab, actions}) {
        const host = getURLHost(tab.url);
        const custom = data.settings.customThemes.find(({url}) =>
            isURLInList(tab.url, url)
        );
        let textNode;
        const placeholderText = [
            "* {",
            "    background-color: #234 !important;",
            "    color: #cba !important;",
            "}"
        ].join("\n");
        function onTextRender(node) {
            textNode = node;
            textNode.value =
                (custom
                    ? custom.theme.stylesheet
                    : data.settings.theme.stylesheet) || "";
            if (document.activeElement !== textNode) {
                textNode.focus();
            }
        }
        function applyStyleSheet(css) {
            if (custom) {
                custom.theme = {...custom.theme, ...{stylesheet: css}};
                actions.changeSettings({
                    customThemes: data.settings.customThemes
                });
            } else {
                actions.setTheme({stylesheet: css});
            }
        }
        function reset() {
            applyStyleSheet("");
        }
        function apply() {
            const css = textNode.value;
            applyStyleSheet(css);
        }
        return m(
            "body",
            null,
            m(
                "header",
                null,
                m("img", {
                    id: "logo",
                    src: "../assets/images/darkreader-type.svg",
                    alt: "Dark Reader"
                }),
                m("h1", {id: "title"}, "CSS Editor")
            ),
            m("h3", {id: "sub-title"}, custom ? host : "All websites"),
            m("textarea", {
                id: "editor",
                native: true,
                placeholder: placeholderText,
                onrender: onTextRender
            }),
            m(
                "div",
                {id: "buttons"},
                m(Button, {onclick: reset}, "Reset"),
                m(Button, {onclick: apply}, "Apply")
            )
        );
    }

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

    function renderBody(data, tab, actions) {
        sync(document.body, m(Body, {data: data, tab: tab, actions: actions}));
    }
    async function start() {
        const connector = connect();
        window.addEventListener("unload", () => connector.disconnect());
        const data = await connector.getData();
        const tab = await connector.getActiveTabInfo();
        renderBody(data, tab, connector);
        connector.subscribeToChanges((data) =>
            renderBody(data, tab, connector)
        );
    }
    start();
})();
