(function () {
    "use strict";

    function isChromiumBased() {
        return (
            navigator.userAgent.toLowerCase().includes("chrome") ||
            navigator.userAgent.toLowerCase().includes("chromium")
        );
    }
    function isFirefox() {
        return navigator.userAgent.includes("Firefox");
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

    async function getOKResponse(url, mimeType) {
        const response = await fetch(url, {
            cache: "force-cache",
            credentials: "omit"
        });
        if (
            isFirefox() &&
            mimeType === "text/css" &&
            url.startsWith("moz-extension://") &&
            url.endsWith(".css")
        ) {
            return response;
        }
        if (
            mimeType &&
            !response.headers.get("Content-Type").startsWith(mimeType)
        ) {
            throw new Error(`Mime type mismatch when loading ${url}`);
        }
        if (!response.ok) {
            throw new Error(
                `Unable to load ${url} ${response.status} ${response.statusText}`
            );
        }
        return response;
    }
    async function loadAsDataURL(url, mimeType) {
        const response = await getOKResponse(url, mimeType);
        return await readResponseAsDataURL(response);
    }
    async function readResponseAsDataURL(response) {
        const blob = await response.blob();
        const dataURL = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        return dataURL;
    }
    async function loadAsText(url, mimeType) {
        const response = await getOKResponse(url, mimeType);
        return await response.text();
    }

    function parseArray(text) {
        return text
            .replace(/\r/g, "")
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s);
    }
    function formatArray(arr) {
        return arr.concat("").join("\n");
    }
    function getStringSize(value) {
        return value.length * 2;
    }

    function parse24HTime(time) {
        return time.split(":").map((x) => parseInt(x));
    }
    function compareTime(a, b) {
        if (a[0] === b[0] && a[1] === b[1]) {
            return 0;
        }
        if (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) {
            return -1;
        }
        return 1;
    }
    function isInTimeInterval(date, time0, time1) {
        const a = parse24HTime(time0);
        const b = parse24HTime(time1);
        const t = [date.getHours(), date.getMinutes()];
        if (compareTime(a, b) > 0) {
            return compareTime(a, t) <= 0 || compareTime(t, b) < 0;
        }
        return compareTime(a, t) <= 0 && compareTime(t, b) < 0;
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

    function readText(params) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.overrideMimeType("text/plain");
            request.open("GET", params.url, true);
            request.onload = () => {
                if (request.status >= 200 && request.status < 300) {
                    resolve(request.responseText);
                } else {
                    reject(
                        new Error(`${request.status}: ${request.statusText}`)
                    );
                }
            };
            request.onerror = () =>
                reject(new Error(`${request.status}: ${request.statusText}`));
            if (params.timeout) {
                request.timeout = params.timeout;
                request.ontimeout = () =>
                    reject(new Error("File loading stopped due to timeout"));
            }
            request.send();
        });
    }
    class LimitedCacheStorage {
        constructor() {
            this.bytesInUse = 0;
            this.records = new Map();
            setInterval(
                () => this.removeExpiredRecords(),
                getDuration({minutes: 1})
            );
        }
        has(url) {
            return this.records.has(url);
        }
        get(url) {
            if (this.records.has(url)) {
                const record = this.records.get(url);
                record.expires = Date.now() + LimitedCacheStorage.TTL;
                this.records.delete(url);
                this.records.set(url, record);
                return record.value;
            }
            return null;
        }
        set(url, value) {
            const size = getStringSize(value);
            if (size > LimitedCacheStorage.QUOTA_BYTES) {
                return;
            }
            for (const [url, record] of this.records) {
                if (this.bytesInUse + size > LimitedCacheStorage.QUOTA_BYTES) {
                    this.records.delete(url);
                    this.bytesInUse -= record.size;
                } else {
                    break;
                }
            }
            const expires = Date.now() + LimitedCacheStorage.TTL;
            this.records.set(url, {url, value, size, expires});
            this.bytesInUse += size;
        }
        removeExpiredRecords() {
            const now = Date.now();
            for (const [url, record] of this.records) {
                if (record.expires < now) {
                    this.records.delete(url);
                    this.bytesInUse -= record.size;
                } else {
                    break;
                }
            }
        }
    }
    LimitedCacheStorage.QUOTA_BYTES =
        (navigator.deviceMemory || 4) * 16 * 1024 * 1024;
    LimitedCacheStorage.TTL = getDuration({minutes: 10});
    function createFileLoader() {
        const caches = {
            "data-url": new LimitedCacheStorage(),
            "text": new LimitedCacheStorage()
        };
        const loaders = {
            "data-url": loadAsDataURL,
            "text": loadAsText
        };
        async function get({url, responseType, mimeType}) {
            const cache = caches[responseType];
            const load = loaders[responseType];
            if (cache.has(url)) {
                return cache.get(url);
            }
            const data = await load(url, mimeType);
            cache.set(url, data);
            return data;
        }
        return {get};
    }

    function isArrayLike(items) {
        return items.length != null;
    }
    function forEach(items, iterator) {
        if (isArrayLike(items)) {
            for (let i = 0, len = items.length; i < len; i++) {
                iterator(items[i]);
            }
        } else {
            for (const item of items) {
                iterator(item);
            }
        }
    }
    function push(array, addition) {
        forEach(addition, (a) => array.push(a));
    }

    function formatSitesFixesConfig(fixes, options) {
        const lines = [];
        fixes.forEach((fix, i) => {
            push(lines, fix.url);
            options.props.forEach((prop) => {
                const command = options.getPropCommandName(prop);
                const value = fix[prop];
                if (options.shouldIgnoreProp(prop, value)) {
                    return;
                }
                lines.push("");
                lines.push(command);
                const formattedValue = options.formatPropValue(prop, value);
                if (formattedValue) {
                    lines.push(formattedValue);
                }
            });
            if (i < fixes.length - 1) {
                lines.push("");
                lines.push("=".repeat(32));
                lines.push("");
            }
        });
        lines.push("");
        return lines.join("\n");
    }

    function scale(x, inLow, inHigh, outLow, outHigh) {
        return ((x - inLow) * (outHigh - outLow)) / (inHigh - inLow) + outLow;
    }
    function clamp(x, min, max) {
        return Math.min(max, Math.max(min, x));
    }
    function multiplyMatrices(m1, m2) {
        const result = [];
        for (let i = 0; i < m1.length; i++) {
            result[i] = [];
            for (let j = 0; j < m2[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < m1[0].length; k++) {
                    sum += m1[i][k] * m2[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }

    function createFilterMatrix(config) {
        let m = Matrix.identity();
        if (config.sepia !== 0) {
            m = multiplyMatrices(m, Matrix.sepia(config.sepia / 100));
        }
        if (config.grayscale !== 0) {
            m = multiplyMatrices(m, Matrix.grayscale(config.grayscale / 100));
        }
        if (config.contrast !== 100) {
            m = multiplyMatrices(m, Matrix.contrast(config.contrast / 100));
        }
        if (config.brightness !== 100) {
            m = multiplyMatrices(m, Matrix.brightness(config.brightness / 100));
        }
        if (config.mode === 1) {
            m = multiplyMatrices(m, Matrix.invertNHue());
        }
        return m;
    }
    function applyColorMatrix([r, g, b], matrix) {
        const rgb = [[r / 255], [g / 255], [b / 255], [1], [1]];
        const result = multiplyMatrices(matrix, rgb);
        return [0, 1, 2].map((i) =>
            clamp(Math.round(result[i][0] * 255), 0, 255)
        );
    }
    const Matrix = {
        identity() {
            return [
                [1, 0, 0, 0, 0],
                [0, 1, 0, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
            ];
        },
        invertNHue() {
            return [
                [0.333, -0.667, -0.667, 0, 1],
                [-0.667, 0.333, -0.667, 0, 1],
                [-0.667, -0.667, 0.333, 0, 1],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
            ];
        },
        brightness(v) {
            return [
                [v, 0, 0, 0, 0],
                [0, v, 0, 0, 0],
                [0, 0, v, 0, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
            ];
        },
        contrast(v) {
            const t = (1 - v) / 2;
            return [
                [v, 0, 0, 0, t],
                [0, v, 0, 0, t],
                [0, 0, v, 0, t],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
            ];
        },
        sepia(v) {
            return [
                [
                    0.393 + 0.607 * (1 - v),
                    0.769 - 0.769 * (1 - v),
                    0.189 - 0.189 * (1 - v),
                    0,
                    0
                ],
                [
                    0.349 - 0.349 * (1 - v),
                    0.686 + 0.314 * (1 - v),
                    0.168 - 0.168 * (1 - v),
                    0,
                    0
                ],
                [
                    0.272 - 0.272 * (1 - v),
                    0.534 - 0.534 * (1 - v),
                    0.131 + 0.869 * (1 - v),
                    0,
                    0
                ],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
            ];
        },
        grayscale(v) {
            return [
                [
                    0.2126 + 0.7874 * (1 - v),
                    0.7152 - 0.7152 * (1 - v),
                    0.0722 - 0.0722 * (1 - v),
                    0,
                    0
                ],
                [
                    0.2126 - 0.2126 * (1 - v),
                    0.7152 + 0.2848 * (1 - v),
                    0.0722 - 0.0722 * (1 - v),
                    0,
                    0
                ],
                [
                    0.2126 - 0.2126 * (1 - v),
                    0.7152 - 0.7152 * (1 - v),
                    0.0722 + 0.9278 * (1 - v),
                    0,
                    0
                ],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
            ];
        }
    };

    function parseSitesFixesConfig(text, options) {
        const sites = [];
        const blocks = text.replace(/\r/g, "").split(/^\s*={2,}\s*$/gm);
        blocks.forEach((block) => {
            const lines = block.split("\n");
            const commandIndices = [];
            lines.forEach((ln, i) => {
                if (ln.match(/^\s*[A-Z]+(\s[A-Z]+)*\s*$/)) {
                    commandIndices.push(i);
                }
            });
            if (commandIndices.length === 0) {
                return;
            }
            const siteFix = {
                url: parseArray(lines.slice(0, commandIndices[0]).join("\n"))
            };
            commandIndices.forEach((commandIndex, i) => {
                const command = lines[commandIndex].trim();
                const valueText = lines
                    .slice(
                        commandIndex + 1,
                        i === commandIndices.length - 1
                            ? lines.length
                            : commandIndices[i + 1]
                    )
                    .join("\n");
                const prop = options.getCommandPropName(command);
                if (!prop) {
                    return;
                }
                const value = options.parseCommandValue(command, valueText);
                siteFix[prop] = value;
            });
            sites.push(siteFix);
        });
        return sites;
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
    function compareURLPatterns(a, b) {
        return a.localeCompare(b);
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

    function createTextStyle(config) {
        const lines = [];
        lines.push("*:not(pre) {");
        if (config.useFont && config.fontFamily) {
            lines.push(`  font-family: ${config.fontFamily} !important;`);
        }
        if (config.textStroke > 0) {
            lines.push(
                `  -webkit-text-stroke: ${config.textStroke}px !important;`
            );
            lines.push(`  text-stroke: ${config.textStroke}px !important;`);
        }
        lines.push("}");
        return lines.join("\n");
    }

    var FilterMode;
    (function (FilterMode) {
        FilterMode[(FilterMode["light"] = 0)] = "light";
        FilterMode[(FilterMode["dark"] = 1)] = "dark";
    })(FilterMode || (FilterMode = {}));
    function hasChromiumIssue501582() {
        const chromeVersion = getChromeVersion();
        return Boolean(
            isChromiumBased() &&
                compareChromeVersions(chromeVersion, "81.0.4035.0") >= 0
        );
    }
    function createCSSFilterStyleheet(config, url, frameURL, inversionFixes) {
        const filterValue = getCSSFilterValue(config);
        const reverseFilterValue = "invert(100%) hue-rotate(180deg)";
        return cssFilterStyleheetTemplate(
            filterValue,
            reverseFilterValue,
            config,
            url,
            frameURL,
            inversionFixes
        );
    }
    function cssFilterStyleheetTemplate(
        filterValue,
        reverseFilterValue,
        config,
        url,
        frameURL,
        inversionFixes
    ) {
        const fix = getInversionFixesFor(frameURL || url, inversionFixes);
        const lines = [];
        lines.push("@media screen {");
        if (filterValue && !frameURL) {
            lines.push("");
            lines.push("/* Leading rule */");
            lines.push(createLeadingRule(filterValue));
        }
        if (config.mode === FilterMode.dark) {
            lines.push("");
            lines.push("/* Reverse rule */");
            lines.push(createReverseRule(reverseFilterValue, fix));
        }
        if (config.useFont || config.textStroke > 0) {
            lines.push("");
            lines.push("/* Font */");
            lines.push(createTextStyle(config));
        }
        lines.push("");
        lines.push("/* Text contrast */");
        lines.push("html {");
        lines.push("  text-shadow: 0 0 0 !important;");
        lines.push("}");
        lines.push("");
        lines.push("/* Full screen */");
        [":-webkit-full-screen", ":-moz-full-screen", ":fullscreen"].forEach(
            (fullScreen) => {
                lines.push(`${fullScreen}, ${fullScreen} * {`);
                lines.push("  -webkit-filter: none !important;");
                lines.push("  filter: none !important;");
                lines.push("}");
            }
        );
        if (!frameURL) {
            const rootColors =
                hasChromiumIssue501582() && config.mode === FilterMode.dark
                    ? [0, 0, 0]
                    : [255, 255, 255];
            const [r, g, b] = applyColorMatrix(
                rootColors,
                createFilterMatrix(config)
            );
            const bgColor = {
                r: Math.round(r),
                g: Math.round(g),
                b: Math.round(b),
                toString() {
                    return `rgb(${this.r},${this.g},${this.b})`;
                }
            };
            lines.push("");
            lines.push("/* Page background */");
            lines.push("html {");
            lines.push(`  background: ${bgColor} !important;`);
            lines.push("}");
        }
        if (fix.css && fix.css.length > 0 && config.mode === FilterMode.dark) {
            lines.push("");
            lines.push("/* Custom rules */");
            lines.push(fix.css);
        }
        lines.push("");
        lines.push("}");
        return lines.join("\n");
    }
    function getCSSFilterValue(config) {
        const filters = [];
        if (config.mode === FilterMode.dark) {
            filters.push("invert(100%) hue-rotate(180deg)");
        }
        if (config.brightness !== 100) {
            filters.push(`brightness(${config.brightness}%)`);
        }
        if (config.contrast !== 100) {
            filters.push(`contrast(${config.contrast}%)`);
        }
        if (config.grayscale !== 0) {
            filters.push(`grayscale(${config.grayscale}%)`);
        }
        if (config.sepia !== 0) {
            filters.push(`sepia(${config.sepia}%)`);
        }
        if (filters.length === 0) {
            return null;
        }
        return filters.join(" ");
    }
    function createLeadingRule(filterValue) {
        return [
            "html {",
            `  -webkit-filter: ${filterValue} !important;`,
            `  filter: ${filterValue} !important;`,
            "}"
        ].join("\n");
    }
    function joinSelectors(selectors) {
        return selectors.map((s) => s.replace(/\,$/, "")).join(",\n");
    }
    function createReverseRule(reverseFilterValue, fix) {
        const lines = [];
        if (fix.invert.length > 0) {
            lines.push(`${joinSelectors(fix.invert)} {`);
            lines.push(`  -webkit-filter: ${reverseFilterValue} !important;`);
            lines.push(`  filter: ${reverseFilterValue} !important;`);
            lines.push("}");
        }
        if (fix.noinvert.length > 0) {
            lines.push(`${joinSelectors(fix.noinvert)} {`);
            lines.push("  -webkit-filter: none !important;");
            lines.push("  filter: none !important;");
            lines.push("}");
        }
        if (fix.removebg.length > 0) {
            lines.push(`${joinSelectors(fix.removebg)} {`);
            lines.push("  background: white !important;");
            lines.push("}");
        }
        return lines.join("\n");
    }
    function getInversionFixesFor(url, inversionFixes) {
        const common = {
            url: inversionFixes[0].url,
            invert: inversionFixes[0].invert || [],
            noinvert: inversionFixes[0].noinvert || [],
            removebg: inversionFixes[0].removebg || [],
            css: inversionFixes[0].css || ""
        };
        if (url) {
            const matches = inversionFixes
                .slice(1)
                .filter((s) => isURLInList(url, s.url))
                .sort((a, b) => b.url[0].length - a.url[0].length);
            if (matches.length > 0) {
                const found = matches[0];
                return {
                    url: found.url,
                    invert: common.invert.concat(found.invert || []),
                    noinvert: common.noinvert.concat(found.noinvert || []),
                    removebg: common.removebg.concat(found.removebg || []),
                    css: [common.css, found.css].filter((s) => s).join("\n")
                };
            }
        }
        return common;
    }
    const inversionFixesCommands = {
        "INVERT": "invert",
        "NO INVERT": "noinvert",
        "REMOVE BG": "removebg",
        "CSS": "css"
    };
    function parseInversionFixes(text) {
        return parseSitesFixesConfig(text, {
            commands: Object.keys(inversionFixesCommands),
            getCommandPropName: (command) =>
                inversionFixesCommands[command] || null,
            parseCommandValue: (command, value) => {
                if (command === "CSS") {
                    return value.trim();
                }
                return parseArray(value);
            }
        });
    }
    function formatInversionFixes(inversionFixes) {
        const fixes = inversionFixes
            .slice()
            .sort((a, b) => compareURLPatterns(a.url[0], b.url[0]));
        return formatSitesFixesConfig(fixes, {
            props: Object.values(inversionFixesCommands),
            getPropCommandName: (prop) =>
                Object.entries(inversionFixesCommands).find(
                    ([, p]) => p === prop
                )[0],
            formatPropValue: (prop, value) => {
                if (prop === "css") {
                    return value.trim();
                }
                return formatArray(value).trim();
            },
            shouldIgnoreProp: (prop, value) => {
                if (prop === "css") {
                    return !value;
                }
                return !(Array.isArray(value) && value.length > 0);
            }
        });
    }

    const dynamicThemeFixesCommands = {
        "INVERT": "invert",
        "CSS": "css",
        "IGNORE INLINE STYLE": "ignoreInlineStyle",
        "IGNORE IMAGE ANALYSIS": "ignoreImageAnalysis"
    };
    function parseDynamicThemeFixes(text) {
        return parseSitesFixesConfig(text, {
            commands: Object.keys(dynamicThemeFixesCommands),
            getCommandPropName: (command) =>
                dynamicThemeFixesCommands[command] || null,
            parseCommandValue: (command, value) => {
                if (command === "CSS") {
                    return value.trim();
                }
                return parseArray(value);
            }
        });
    }
    function formatDynamicThemeFixes(dynamicThemeFixes) {
        const fixes = dynamicThemeFixes
            .slice()
            .sort((a, b) => compareURLPatterns(a.url[0], b.url[0]));
        return formatSitesFixesConfig(fixes, {
            props: Object.values(dynamicThemeFixesCommands),
            getPropCommandName: (prop) =>
                Object.entries(dynamicThemeFixesCommands).find(
                    ([, p]) => p === prop
                )[0],
            formatPropValue: (prop, value) => {
                if (prop === "css") {
                    return value.trim();
                }
                return formatArray(value).trim();
            },
            shouldIgnoreProp: (prop, value) => {
                if (prop === "css") {
                    return !value;
                }
                return !(Array.isArray(value) && value.length > 0);
            }
        });
    }
    function getDynamicThemeFixesFor(url, frameURL, fixes, enabledForPDF) {
        if (fixes.length === 0 || fixes[0].url[0] !== "*") {
            return null;
        }
        const common = {
            url: fixes[0].url,
            invert: fixes[0].invert || [],
            css: fixes[0].css || [],
            ignoreInlineStyle: fixes[0].ignoreInlineStyle || [],
            ignoreImageAnalysis: fixes[0].ignoreImageAnalysis || []
        };
        if (enabledForPDF) {
            common.invert = common.invert.concat(
                'embed[type="application/pdf"]'
            );
        }
        const sortedBySpecificity = fixes
            .slice(1)
            .map((theme) => {
                return {
                    specificity: isURLInList(frameURL || url, theme.url)
                        ? theme.url[0].length
                        : 0,
                    theme
                };
            })
            .filter(({specificity}) => specificity > 0)
            .sort((a, b) => b.specificity - a.specificity);
        if (sortedBySpecificity.length === 0) {
            return common;
        }
        const match = sortedBySpecificity[0].theme;
        return {
            url: match.url,
            invert: common.invert.concat(match.invert || []),
            css: [common.css, match.css].filter((s) => s).join("\n"),
            ignoreInlineStyle: common.ignoreInlineStyle.concat(
                match.ignoreInlineStyle || []
            ),
            ignoreImageAnalysis: common.ignoreImageAnalysis.concat(
                match.ignoreImageAnalysis || []
            )
        };
    }

    const darkTheme = {
        neutralBg: [16, 20, 23],
        neutralText: [167, 158, 139],
        redBg: [64, 12, 32],
        redText: [247, 142, 102],
        greenBg: [32, 64, 48],
        greenText: [128, 204, 148],
        blueBg: [32, 48, 64],
        blueText: [128, 182, 204],
        fadeBg: [16, 20, 23, 0.5],
        fadeText: [167, 158, 139, 0.5]
    };
    const lightTheme = {
        neutralBg: [255, 242, 228],
        neutralText: [0, 0, 0],
        redBg: [255, 85, 170],
        redText: [140, 14, 48],
        greenBg: [192, 255, 170],
        greenText: [0, 128, 0],
        blueBg: [173, 215, 229],
        blueText: [28, 16, 171],
        fadeBg: [0, 0, 0, 0.5],
        fadeText: [0, 0, 0, 0.5]
    };
    function rgb([r, g, b, a]) {
        if (typeof a === "number") {
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
    }
    function mix(color1, color2, t) {
        return color1.map((c, i) => Math.round(c * (1 - t) + color2[i] * t));
    }
    function createStaticStylesheet(config, url, frameURL, staticThemes) {
        const srcTheme = config.mode === 1 ? darkTheme : lightTheme;
        const theme = Object.entries(srcTheme).reduce((t, [prop, color]) => {
            t[prop] = applyColorMatrix(
                color,
                createFilterMatrix({...config, mode: 0})
            );
            return t;
        }, {});
        const commonTheme = getCommonTheme(staticThemes);
        const siteTheme = getThemeFor(frameURL || url, staticThemes);
        const lines = [];
        if (!siteTheme || !siteTheme.noCommon) {
            lines.push("/* Common theme */");
            lines.push(...ruleGenerators.map((gen) => gen(commonTheme, theme)));
        }
        if (siteTheme) {
            lines.push(`/* Theme for ${siteTheme.url.join(" ")} */`);
            lines.push(...ruleGenerators.map((gen) => gen(siteTheme, theme)));
        }
        if (config.useFont || config.textStroke > 0) {
            lines.push("/* Font */");
            lines.push(createTextStyle(config));
        }
        return lines.filter((ln) => ln).join("\n");
    }
    function createRuleGen(
        getSelectors,
        generateDeclarations,
        modifySelector = (s) => s
    ) {
        return (siteTheme, themeColors) => {
            const selectors = getSelectors(siteTheme);
            if (selectors == null || selectors.length === 0) {
                return null;
            }
            const lines = [];
            selectors.forEach((s, i) => {
                let ln = modifySelector(s);
                if (i < selectors.length - 1) {
                    ln += ",";
                } else {
                    ln += " {";
                }
                lines.push(ln);
            });
            const declarations = generateDeclarations(themeColors);
            declarations.forEach((d) => lines.push(`    ${d} !important;`));
            lines.push("}");
            return lines.join("\n");
        };
    }
    const mx = {
        bg: {
            hover: 0.075,
            active: 0.1
        },
        fg: {
            hover: 0.25,
            active: 0.5
        },
        border: 0.5
    };
    const ruleGenerators = [
        createRuleGen(
            (t) => t.neutralBg,
            (t) => [`background-color: ${rgb(t.neutralBg)}`]
        ),
        createRuleGen(
            (t) => t.neutralBgActive,
            (t) => [`background-color: ${rgb(t.neutralBg)}`]
        ),
        createRuleGen(
            (t) => t.neutralBgActive,
            (t) => [
                `background-color: ${rgb(
                    mix(t.neutralBg, [255, 255, 255], mx.bg.hover)
                )}`
            ],
            (s) => `${s}:hover`
        ),
        createRuleGen(
            (t) => t.neutralBgActive,
            (t) => [
                `background-color: ${rgb(
                    mix(t.neutralBg, [255, 255, 255], mx.bg.active)
                )}`
            ],
            (s) => `${s}:active, ${s}:focus`
        ),
        createRuleGen(
            (t) => t.neutralText,
            (t) => [`color: ${rgb(t.neutralText)}`]
        ),
        createRuleGen(
            (t) => t.neutralTextActive,
            (t) => [`color: ${rgb(t.neutralText)}`]
        ),
        createRuleGen(
            (t) => t.neutralTextActive,
            (t) => [
                `color: ${rgb(
                    mix(t.neutralText, [255, 255, 255], mx.fg.hover)
                )}`
            ],
            (s) => `${s}:hover`
        ),
        createRuleGen(
            (t) => t.neutralTextActive,
            (t) => [
                `color: ${rgb(
                    mix(t.neutralText, [255, 255, 255], mx.fg.active)
                )}`
            ],
            (s) => `${s}:active, ${s}:focus`
        ),
        createRuleGen(
            (t) => t.neutralBorder,
            (t) => [
                `border-color: ${rgb(
                    mix(t.neutralBg, t.neutralText, mx.border)
                )}`
            ]
        ),
        createRuleGen(
            (t) => t.redBg,
            (t) => [`background-color: ${rgb(t.redBg)}`]
        ),
        createRuleGen(
            (t) => t.redBgActive,
            (t) => [`background-color: ${rgb(t.redBg)}`]
        ),
        createRuleGen(
            (t) => t.redBgActive,
            (t) => [
                `background-color: ${rgb(
                    mix(t.redBg, [255, 0, 64], mx.bg.hover)
                )}`
            ],
            (s) => `${s}:hover`
        ),
        createRuleGen(
            (t) => t.redBgActive,
            (t) => [
                `background-color: ${rgb(
                    mix(t.redBg, [255, 0, 64], mx.bg.active)
                )}`
            ],
            (s) => `${s}:active, ${s}:focus`
        ),
        createRuleGen(
            (t) => t.redText,
            (t) => [`color: ${rgb(t.redText)}`]
        ),
        createRuleGen(
            (t) => t.redTextActive,
            (t) => [`color: ${rgb(t.redText)}`]
        ),
        createRuleGen(
            (t) => t.redTextActive,
            (t) => [
                `color: ${rgb(mix(t.redText, [255, 255, 0], mx.fg.hover))}`
            ],
            (s) => `${s}:hover`
        ),
        createRuleGen(
            (t) => t.redTextActive,
            (t) => [
                `color: ${rgb(mix(t.redText, [255, 255, 0], mx.fg.active))}`
            ],
            (s) => `${s}:active, ${s}:focus`
        ),
        createRuleGen(
            (t) => t.redBorder,
            (t) => [`border-color: ${rgb(mix(t.redBg, t.redText, mx.border))}`]
        ),
        createRuleGen(
            (t) => t.greenBg,
            (t) => [`background-color: ${rgb(t.greenBg)}`]
        ),
        createRuleGen(
            (t) => t.greenBgActive,
            (t) => [`background-color: ${rgb(t.greenBg)}`]
        ),
        createRuleGen(
            (t) => t.greenBgActive,
            (t) => [
                `background-color: ${rgb(
                    mix(t.greenBg, [128, 255, 182], mx.bg.hover)
                )}`
            ],
            (s) => `${s}:hover`
        ),
        createRuleGen(
            (t) => t.greenBgActive,
            (t) => [
                `background-color: ${rgb(
                    mix(t.greenBg, [128, 255, 182], mx.bg.active)
                )}`
            ],
            (s) => `${s}:active, ${s}:focus`
        ),
        createRuleGen(
            (t) => t.greenText,
            (t) => [`color: ${rgb(t.greenText)}`]
        ),
        createRuleGen(
            (t) => t.greenTextActive,
            (t) => [`color: ${rgb(t.greenText)}`]
        ),
        createRuleGen(
            (t) => t.greenTextActive,
            (t) => [
                `color: ${rgb(mix(t.greenText, [182, 255, 224], mx.fg.hover))}`
            ],
            (s) => `${s}:hover`
        ),
        createRuleGen(
            (t) => t.greenTextActive,
            (t) => [
                `color: ${rgb(mix(t.greenText, [182, 255, 224], mx.fg.active))}`
            ],
            (s) => `${s}:active, ${s}:focus`
        ),
        createRuleGen(
            (t) => t.greenBorder,
            (t) => [
                `border-color: ${rgb(mix(t.greenBg, t.greenText, mx.border))}`
            ]
        ),
        createRuleGen(
            (t) => t.blueBg,
            (t) => [`background-color: ${rgb(t.blueBg)}`]
        ),
        createRuleGen(
            (t) => t.blueBgActive,
            (t) => [`background-color: ${rgb(t.blueBg)}`]
        ),
        createRuleGen(
            (t) => t.blueBgActive,
            (t) => [
                `background-color: ${rgb(
                    mix(t.blueBg, [0, 128, 255], mx.bg.hover)
                )}`
            ],
            (s) => `${s}:hover`
        ),
        createRuleGen(
            (t) => t.blueBgActive,
            (t) => [
                `background-color: ${rgb(
                    mix(t.blueBg, [0, 128, 255], mx.bg.active)
                )}`
            ],
            (s) => `${s}:active, ${s}:focus`
        ),
        createRuleGen(
            (t) => t.blueText,
            (t) => [`color: ${rgb(t.blueText)}`]
        ),
        createRuleGen(
            (t) => t.blueTextActive,
            (t) => [`color: ${rgb(t.blueText)}`]
        ),
        createRuleGen(
            (t) => t.blueTextActive,
            (t) => [
                `color: ${rgb(mix(t.blueText, [182, 224, 255], mx.fg.hover))}`
            ],
            (s) => `${s}:hover`
        ),
        createRuleGen(
            (t) => t.blueTextActive,
            (t) => [
                `color: ${rgb(mix(t.blueText, [182, 224, 255], mx.fg.active))}`
            ],
            (s) => `${s}:active, ${s}:focus`
        ),
        createRuleGen(
            (t) => t.blueBorder,
            (t) => [
                `border-color: ${rgb(mix(t.blueBg, t.blueText, mx.border))}`
            ]
        ),
        createRuleGen(
            (t) => t.fadeBg,
            (t) => [`background-color: ${rgb(t.fadeBg)}`]
        ),
        createRuleGen(
            (t) => t.fadeText,
            (t) => [`color: ${rgb(t.fadeText)}`]
        ),
        createRuleGen(
            (t) => t.transparentBg,
            () => ["background-color: transparent"]
        ),
        createRuleGen(
            (t) => t.noImage,
            () => ["background-image: none"]
        ),
        createRuleGen(
            (t) => t.invert,
            () => ["filter: invert(100%) hue-rotate(180deg)"]
        )
    ];
    const staticThemeCommands = [
        "NO COMMON",
        "NEUTRAL BG",
        "NEUTRAL BG ACTIVE",
        "NEUTRAL TEXT",
        "NEUTRAL TEXT ACTIVE",
        "NEUTRAL BORDER",
        "RED BG",
        "RED BG ACTIVE",
        "RED TEXT",
        "RED TEXT ACTIVE",
        "RED BORDER",
        "GREEN BG",
        "GREEN BG ACTIVE",
        "GREEN TEXT",
        "GREEN TEXT ACTIVE",
        "GREEN BORDER",
        "BLUE BG",
        "BLUE BG ACTIVE",
        "BLUE TEXT",
        "BLUE TEXT ACTIVE",
        "BLUE BORDER",
        "FADE BG",
        "FADE TEXT",
        "TRANSPARENT BG",
        "NO IMAGE",
        "INVERT"
    ];
    function upperCaseToCamelCase(text) {
        return text
            .split(" ")
            .map((word, i) => {
                return i === 0
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() +
                          word.substr(1).toLowerCase();
            })
            .join("");
    }
    function parseStaticThemes($themes) {
        return parseSitesFixesConfig($themes, {
            commands: staticThemeCommands,
            getCommandPropName: upperCaseToCamelCase,
            parseCommandValue: (command, value) => {
                if (command === "NO COMMON") {
                    return true;
                }
                return parseArray(value);
            }
        });
    }
    function camelCaseToUpperCase(text) {
        return text.replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase();
    }
    function formatStaticThemes(staticThemes) {
        const themes = staticThemes
            .slice()
            .sort((a, b) => compareURLPatterns(a.url[0], b.url[0]));
        return formatSitesFixesConfig(themes, {
            props: staticThemeCommands.map(upperCaseToCamelCase),
            getPropCommandName: camelCaseToUpperCase,
            formatPropValue: (prop, value) => {
                if (prop === "noCommon") {
                    return "";
                }
                return formatArray(value).trim();
            },
            shouldIgnoreProp: (prop, value) => {
                if (prop === "noCommon") {
                    return !value;
                }
                return !(Array.isArray(value) && value.length > 0);
            }
        });
    }
    function getCommonTheme(themes) {
        return themes[0];
    }
    function getThemeFor(url, themes) {
        const sortedBySpecificity = themes
            .slice(1)
            .map((theme) => {
                return {
                    specificity: isURLInList(url, theme.url)
                        ? theme.url[0].length
                        : 0,
                    theme
                };
            })
            .filter(({specificity}) => specificity > 0)
            .sort((a, b) => b.specificity - a.specificity);
        if (sortedBySpecificity.length === 0) {
            return null;
        }
        return sortedBySpecificity[0].theme;
    }

    const CONFIG_URLs = {
        darkSites: {
            remote:
                "https://raw.githubusercontent.com/darkreader/darkreader/master/src/config/dark-sites.config",
            local: "../config/dark-sites.config"
        },
        dynamicThemeFixes: {
            remote:
                "https://raw.githubusercontent.com/darkreader/darkreader/master/src/config/dynamic-theme-fixes.config",
            local: "../config/dynamic-theme-fixes.config"
        },
        inversionFixes: {
            remote:
                "https://raw.githubusercontent.com/darkreader/darkreader/master/src/config/inversion-fixes.config",
            local: "../config/inversion-fixes.config"
        },
        staticThemes: {
            remote:
                "https://raw.githubusercontent.com/darkreader/darkreader/master/src/config/static-themes.config",
            local: "../config/static-themes.config"
        }
    };
    const REMOTE_TIMEOUT_MS = getDuration({seconds: 10});
    class ConfigManager {
        constructor() {
            this.raw = {
                darkSites: null,
                dynamicThemeFixes: null,
                inversionFixes: null,
                staticThemes: null
            };
            this.overrides = {
                darkSites: null,
                dynamicThemeFixes: null,
                inversionFixes: null,
                staticThemes: null
            };
        }
        async loadConfig({name, local, localURL, remoteURL, success}) {
            let $config;
            const loadLocal = async () => await readText({url: localURL});
            if (local) {
                $config = await loadLocal();
            } else {
                try {
                    $config = await readText({
                        url: `${remoteURL}?nocache=${Date.now()}`,
                        timeout: REMOTE_TIMEOUT_MS
                    });
                } catch (err) {
                    console.error(`${name} remote load error`, err);
                    $config = await loadLocal();
                }
            }
            success($config);
        }
        async loadDarkSites({local}) {
            await this.loadConfig({
                name: "Dark Sites",
                local,
                localURL: CONFIG_URLs.darkSites.local,
                remoteURL: CONFIG_URLs.darkSites.remote,
                success: ($sites) => {
                    this.raw.darkSites = $sites;
                    this.handleDarkSites();
                }
            });
        }
        async loadDynamicThemeFixes({local}) {
            await this.loadConfig({
                name: "Dynamic Theme Fixes",
                local,
                localURL: CONFIG_URLs.dynamicThemeFixes.local,
                remoteURL: CONFIG_URLs.dynamicThemeFixes.remote,
                success: ($fixes) => {
                    this.raw.dynamicThemeFixes = $fixes;
                    this.handleDynamicThemeFixes();
                }
            });
        }
        async loadInversionFixes({local}) {
            await this.loadConfig({
                name: "Inversion Fixes",
                local,
                localURL: CONFIG_URLs.inversionFixes.local,
                remoteURL: CONFIG_URLs.inversionFixes.remote,
                success: ($fixes) => {
                    this.raw.inversionFixes = $fixes;
                    this.handleInversionFixes();
                }
            });
        }
        async loadStaticThemes({local}) {
            await this.loadConfig({
                name: "Static Themes",
                local,
                localURL: CONFIG_URLs.staticThemes.local,
                remoteURL: CONFIG_URLs.staticThemes.remote,
                success: ($themes) => {
                    this.raw.staticThemes = $themes;
                    this.handleStaticThemes();
                }
            });
        }
        async load(config) {
            await Promise.all([
                this.loadDarkSites(config),
                this.loadDynamicThemeFixes(config),
                this.loadInversionFixes(config),
                this.loadStaticThemes(config)
            ]).catch((err) => console.error("Fatality", err));
        }
        handleDarkSites() {
            const $sites = this.overrides.darkSites || this.raw.darkSites;
            this.DARK_SITES = parseArray($sites);
        }
        handleDynamicThemeFixes() {
            const $fixes =
                this.overrides.dynamicThemeFixes || this.raw.dynamicThemeFixes;
            this.DYNAMIC_THEME_FIXES = parseDynamicThemeFixes($fixes);
        }
        handleInversionFixes() {
            const $fixes =
                this.overrides.inversionFixes || this.raw.inversionFixes;
            this.INVERSION_FIXES = parseInversionFixes($fixes);
        }
        handleStaticThemes() {
            const $themes =
                this.overrides.staticThemes || this.raw.staticThemes;
            this.STATIC_THEMES = parseStaticThemes($themes);
        }
    }

    class LocalStorageWrapper {
        get(key) {
            try {
                return localStorage.getItem(key);
            } catch (err) {
                console.error(err);
                return null;
            }
        }
        set(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (err) {
                console.error(err);
                return;
            }
        }
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (err) {
                console.error(err);
                return;
            }
        }
        has(key) {
            try {
                return localStorage.getItem(key) != null;
            } catch (err) {
                console.error(err);
                return false;
            }
        }
    }
    class TempStorage {
        constructor() {
            this.map = new Map();
        }
        get(key) {
            return this.map.get(key);
        }
        set(key, value) {
            this.map.set(key, value);
        }
        remove(key) {
            this.map.delete(key);
        }
        has(key) {
            return this.map.has(key);
        }
    }
    class DevTools {
        constructor(config, onChange) {
            this.store =
                typeof localStorage !== "undefined" && localStorage != null
                    ? new LocalStorageWrapper()
                    : new TempStorage();
            this.config = config;
            this.config.overrides.dynamicThemeFixes =
                this.getSavedDynamicThemeFixes() || null;
            this.config.overrides.inversionFixes =
                this.getSavedInversionFixes() || null;
            this.config.overrides.staticThemes =
                this.getSavedStaticThemes() || null;
            this.onChange = onChange;
        }
        getSavedDynamicThemeFixes() {
            return this.store.get(DevTools.KEY_DYNAMIC) || null;
        }
        saveDynamicThemeFixes(text) {
            this.store.set(DevTools.KEY_DYNAMIC, text);
        }
        hasCustomDynamicThemeFixes() {
            return this.store.has(DevTools.KEY_DYNAMIC);
        }
        getDynamicThemeFixesText() {
            const $fixes = this.getSavedDynamicThemeFixes();
            const fixes = $fixes
                ? parseDynamicThemeFixes($fixes)
                : this.config.DYNAMIC_THEME_FIXES;
            return formatDynamicThemeFixes(fixes);
        }
        resetDynamicThemeFixes() {
            this.store.remove(DevTools.KEY_DYNAMIC);
            this.config.overrides.dynamicThemeFixes = null;
            this.config.handleDynamicThemeFixes();
            this.onChange();
        }
        applyDynamicThemeFixes(text) {
            try {
                const formatted = formatDynamicThemeFixes(
                    parseDynamicThemeFixes(text)
                );
                this.config.overrides.dynamicThemeFixes = formatted;
                this.config.handleDynamicThemeFixes();
                this.saveDynamicThemeFixes(formatted);
                this.onChange();
                return null;
            } catch (err) {
                return err;
            }
        }
        getSavedInversionFixes() {
            return this.store.get(DevTools.KEY_FILTER) || null;
        }
        saveInversionFixes(text) {
            this.store.set(DevTools.KEY_FILTER, text);
        }
        hasCustomFilterFixes() {
            return this.store.has(DevTools.KEY_FILTER);
        }
        getInversionFixesText() {
            const $fixes = this.getSavedInversionFixes();
            const fixes = $fixes
                ? parseInversionFixes($fixes)
                : this.config.INVERSION_FIXES;
            return formatInversionFixes(fixes);
        }
        resetInversionFixes() {
            this.store.remove(DevTools.KEY_FILTER);
            this.config.overrides.inversionFixes = null;
            this.config.handleInversionFixes();
            this.onChange();
        }
        applyInversionFixes(text) {
            try {
                const formatted = formatInversionFixes(
                    parseInversionFixes(text)
                );
                this.config.overrides.inversionFixes = formatted;
                this.config.handleInversionFixes();
                this.saveInversionFixes(formatted);
                this.onChange();
                return null;
            } catch (err) {
                return err;
            }
        }
        getSavedStaticThemes() {
            return this.store.get(DevTools.KEY_STATIC) || null;
        }
        saveStaticThemes(text) {
            this.store.set(DevTools.KEY_STATIC, text);
        }
        hasCustomStaticFixes() {
            return this.store.has(DevTools.KEY_STATIC);
        }
        getStaticThemesText() {
            const $themes = this.getSavedStaticThemes();
            const themes = $themes
                ? parseStaticThemes($themes)
                : this.config.STATIC_THEMES;
            return formatStaticThemes(themes);
        }
        resetStaticThemes() {
            this.store.remove(DevTools.KEY_STATIC);
            this.config.overrides.staticThemes = null;
            this.config.handleStaticThemes();
            this.onChange();
        }
        applyStaticThemes(text) {
            try {
                const formatted = formatStaticThemes(parseStaticThemes(text));
                this.config.overrides.staticThemes = formatted;
                this.config.handleStaticThemes();
                this.saveStaticThemes(formatted);
                this.onChange();
                return null;
            } catch (err) {
                return err;
            }
        }
    }
    DevTools.KEY_DYNAMIC = "dev_dynamic_theme_fixes";
    DevTools.KEY_FILTER = "dev_inversion_fixes";
    DevTools.KEY_STATIC = "dev_static_themes";

    const ICON_PATHS = {
        active_19: "../icons/dr_active_19.png",
        active_38: "../icons/dr_active_38.png",
        inactive_19: "../icons/dr_inactive_19.png",
        inactive_38: "../icons/dr_inactive_38.png"
    };
    class IconManager {
        constructor() {
            this.setActive();
        }
        setActive() {
            if (!chrome.browserAction.setIcon) {
                return;
            }
            chrome.browserAction.setIcon({
                path: {
                    "19": ICON_PATHS.active_19,
                    "38": ICON_PATHS.active_38
                }
            });
        }
        setInactive() {
            if (!chrome.browserAction.setIcon) {
                return;
            }
            chrome.browserAction.setIcon({
                path: {
                    "19": ICON_PATHS.inactive_19,
                    "38": ICON_PATHS.inactive_38
                }
            });
        }
        showImportantBadge() {
            chrome.browserAction.setBadgeBackgroundColor({color: "#e96c4c"});
            chrome.browserAction.setBadgeText({text: "!"});
        }
        showUnreadReleaseNotesBadge(count) {
            chrome.browserAction.setBadgeBackgroundColor({color: "#e96c4c"});
            chrome.browserAction.setBadgeText({text: String(count)});
        }
        hideBadge() {
            chrome.browserAction.setBadgeText({text: ""});
        }
    }

    class Messenger {
        constructor(adapter) {
            this.reporters = new Set();
            this.adapter = adapter;
            chrome.runtime.onConnect.addListener((port) => {
                if (port.name === "ui") {
                    port.onMessage.addListener((message) =>
                        this.onUIMessage(port, message)
                    );
                    this.adapter.onPopupOpen();
                }
            });
        }
        async onUIMessage(port, {type, id, data}) {
            switch (type) {
                case "get-data": {
                    const data = await this.adapter.collect();
                    port.postMessage({id, data});
                    break;
                }
                case "get-active-tab-info": {
                    const data = await this.adapter.getActiveTabInfo();
                    port.postMessage({id, data});
                    break;
                }
                case "subscribe-to-changes": {
                    const report = (data) => port.postMessage({id, data});
                    this.reporters.add(report);
                    port.onDisconnect.addListener(() =>
                        this.reporters.delete(report)
                    );
                    break;
                }
                case "change-settings": {
                    this.adapter.changeSettings(data);
                    break;
                }
                case "set-theme": {
                    this.adapter.setTheme(data);
                    break;
                }
                case "set-shortcut": {
                    this.adapter.setShortcut(data);
                    break;
                }
                case "toggle-url": {
                    this.adapter.toggleURL(data);
                    break;
                }
                case "mark-news-as-read": {
                    this.adapter.markNewsAsRead(data);
                    break;
                }
                case "load-config": {
                    await this.adapter.loadConfig(data);
                }
                case "apply-dev-dynamic-theme-fixes": {
                    const error = this.adapter.applyDevDynamicThemeFixes(data);
                    port.postMessage({id, error: error ? error.message : null});
                    break;
                }
                case "reset-dev-dynamic-theme-fixes": {
                    this.adapter.resetDevDynamicThemeFixes();
                    break;
                }
                case "apply-dev-inversion-fixes": {
                    const error = this.adapter.applyDevInversionFixes(data);
                    port.postMessage({id, error: error ? error.message : null});
                    break;
                }
                case "reset-dev-inversion-fixes": {
                    this.adapter.resetDevInversionFixes();
                    break;
                }
                case "apply-dev-static-themes": {
                    const error = this.adapter.applyDevStaticThemes(data);
                    port.postMessage({id, error: error ? error.message : null});
                    break;
                }
                case "reset-dev-static-themes": {
                    this.adapter.resetDevStaticThemes();
                    break;
                }
            }
        }
        reportChanges(data) {
            this.reporters.forEach((report) => report(data));
        }
    }

    function getUILanguage() {
        const code = chrome.i18n.getUILanguage();
        if (code.endsWith("-mac")) {
            return code.substring(0, code.length - 4);
        }
        return code;
    }

    const BLOG_URL = "https://darkreader.org/blog/";
    const UNINSTALL_URL = "https://darkreader.org/goodluck/";
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
    function getBlogPostURL(postId) {
        return `${BLOG_URL}${postId}/`;
    }

    class Newsmaker {
        constructor(onUpdate) {
            this.latest = [];
            this.onUpdate = onUpdate;
        }
        subscribe() {
            this.updateNews();
            setInterval(() => this.updateNews(), Newsmaker.UPDATE_INTERVAL);
        }
        async updateNews() {
            const news = await this.getNews();
            if (Array.isArray(news)) {
                this.latest = news;
                this.onUpdate(this.latest);
            }
        }
        async getNews() {
            try {
                const response = await fetch(
                    `https://darkreader.github.io/blog/posts.json?date=${new Date()
                        .toISOString()
                        .substring(0, 10)}`,
                    {cache: "no-cache"}
                );
                const $news = await response.json();
                return new Promise((resolve, reject) => {
                    chrome.storage.sync.get({readNews: []}, ({readNews}) => {
                        const news = $news.map(
                            ({id, date, headline, important}) => {
                                const url = getBlogPostURL(id);
                                const read = this.isRead(id, readNews);
                                return {
                                    id,
                                    date,
                                    headline,
                                    url,
                                    important,
                                    read
                                };
                            }
                        );
                        for (let i = 0; i < news.length; i++) {
                            const date = new Date(news[i].date);
                            if (isNaN(date.getTime())) {
                                reject(
                                    new Error(`Unable to parse date ${date}`)
                                );
                                return;
                            }
                        }
                        resolve(news);
                    });
                });
            } catch (err) {
                console.error(err);
                return null;
            }
        }
        markAsRead(...ids) {
            return new Promise((resolve) => {
                chrome.storage.sync.get({readNews: []}, ({readNews}) => {
                    const results = readNews.slice();
                    let changed = false;
                    ids.forEach((id) => {
                        if (readNews.indexOf(id) < 0) {
                            results.push(id);
                            changed = true;
                        }
                    });
                    if (changed) {
                        this.latest = this.latest.map(
                            ({id, date, url, headline, important}) => {
                                const read = this.isRead(id, results);
                                return {
                                    id,
                                    date,
                                    url,
                                    headline,
                                    important,
                                    read
                                };
                            }
                        );
                        this.onUpdate(this.latest);
                        chrome.storage.sync.set({readNews: results}, () =>
                            resolve()
                        );
                    } else {
                        resolve();
                    }
                });
            });
        }
        isRead(id, readNews) {
            return readNews.includes(id);
        }
    }
    Newsmaker.UPDATE_INTERVAL = getDuration({hours: 4});

    function canInjectScript(url) {
        if (isFirefox()) {
            return (
                url &&
                !url.startsWith("about:") &&
                !url.startsWith("moz") &&
                !url.startsWith("view-source:") &&
                !url.startsWith("https://addons.mozilla.org") &&
                !isPDF(url)
            );
        }
        if (isEdge()) {
            return (
                url &&
                !url.startsWith("chrome") &&
                !url.startsWith("edge") &&
                !url.startsWith("https://chrome.google.com/webstore") &&
                !url.startsWith("https://microsoftedge.microsoft.com/addons")
            );
        }
        return (
            url &&
            !url.startsWith("chrome") &&
            !url.startsWith("https://chrome.google.com/webstore")
        );
    }
    function getFontList() {
        return new Promise((resolve) => {
            if (!chrome.fontSettings) {
                resolve([
                    "serif",
                    "sans-serif",
                    "monospace",
                    "cursive",
                    "fantasy",
                    "system-ui"
                ]);
                return;
            }
            chrome.fontSettings.getFontList((list) => {
                const fonts = list.map((f) => f.fontId);
                resolve(fonts);
            });
        });
    }
    function getCommands() {
        return new Promise((resolve) => {
            if (!chrome.commands) {
                resolve([]);
                return;
            }
            chrome.commands.getAll((commands) => {
                if (commands) {
                    resolve(commands);
                } else {
                    resolve([]);
                }
            });
        });
    }
    function setShortcut(command, shortcut) {
        if (
            typeof browser !== "undefined" &&
            browser.commands &&
            browser.commands.update
        ) {
            browser.commands.update({name: command, shortcut});
        }
    }

    function queryTabs(query) {
        return new Promise((resolve) => {
            chrome.tabs.query(query, (tabs) => resolve(tabs));
        });
    }
    class TabManager {
        constructor({getConnectionMessage, onColorSchemeChange}) {
            this.ports = new Map();
            chrome.runtime.onConnect.addListener((port) => {
                if (port.name === "tab") {
                    const tabId = port.sender.tab.id;
                    const frameId = port.sender.frameId;
                    const url = port.sender.url;
                    let framesPorts;
                    if (this.ports.has(tabId)) {
                        framesPorts = this.ports.get(tabId);
                    } else {
                        framesPorts = new Map();
                        this.ports.set(tabId, framesPorts);
                    }
                    framesPorts.set(frameId, {url, port});
                    port.onDisconnect.addListener(() => {
                        framesPorts.delete(frameId);
                        if (framesPorts.size === 0) {
                            this.ports.delete(tabId);
                        }
                    });
                    const message = getConnectionMessage(
                        port.sender.tab.url,
                        frameId === 0 ? null : url
                    );
                    if (message instanceof Promise) {
                        message.then(
                            (asyncMessage) =>
                                asyncMessage && port.postMessage(asyncMessage)
                        );
                    } else if (message) {
                        port.postMessage(message);
                    }
                }
            });
            const fileLoader = createFileLoader();
            chrome.runtime.onMessage.addListener(
                async ({type, data, id}, sender) => {
                    if (type === "fetch") {
                        const {url, responseType, mimeType} = data;
                        const sendResponse = (response) =>
                            chrome.tabs.sendMessage(sender.tab.id, {
                                type: "fetch-response",
                                id,
                                ...response
                            });
                        try {
                            const response = await fileLoader.get({
                                url,
                                responseType,
                                mimeType
                            });
                            sendResponse({data: response});
                        } catch (err) {
                            sendResponse({
                                error: err && err.message ? err.message : err
                            });
                        }
                    }
                    if (type === "color-scheme-change") {
                        onColorSchemeChange(data);
                    }
                    if (type === "save-file") {
                        const {content, name} = data;
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(new Blob([content]));
                        a.download = name;
                        a.click();
                    }
                    if (type === "request-export-css") {
                        const activeTab = await this.getActiveTab();
                        this.ports
                            .get(activeTab.id)
                            .get(0)
                            .port.postMessage({type: "export-css"});
                    }
                }
            );
        }
        async updateContentScript() {
            (await queryTabs({}))
                .filter((tab) => canInjectScript(tab.url))
                .filter((tab) => !this.ports.has(tab.id))
                .forEach(
                    (tab) =>
                        !tab.discarded &&
                        chrome.tabs.executeScript(tab.id, {
                            runAt: "document_start",
                            file: "/inject/index.js",
                            allFrames: true,
                            matchAboutBlank: true
                        })
                );
        }
        async sendMessage(getMessage) {
            (await queryTabs({}))
                .filter((tab) => this.ports.has(tab.id))
                .forEach((tab) => {
                    const framesPorts = this.ports.get(tab.id);
                    framesPorts.forEach(({url, port}, frameId) => {
                        const message = getMessage(
                            tab.url,
                            frameId === 0 ? null : url
                        );
                        if (tab.active && frameId === 0) {
                            port.postMessage(message);
                        } else {
                            setTimeout(() => port.postMessage(message));
                        }
                    });
                });
        }
        async getActiveTabURL() {
            return (await this.getActiveTab()).url;
        }
        async getActiveTab() {
            let tab = (
                await queryTabs({
                    active: true,
                    lastFocusedWindow: true
                })
            )[0];
            const isExtensionPage = (url) =>
                url.startsWith("chrome-extension:") ||
                url.startsWith("moz-extension:");
            if (!tab || isExtensionPage(tab.url)) {
                const tabs = await queryTabs({active: true});
                tab = tabs.find((t) => !isExtensionPage(t.url)) || tab;
            }
            return tab;
        }
    }

    var ThemeEngines = {
        cssFilter: "cssFilter",
        svgFilter: "svgFilter",
        staticTheme: "staticTheme",
        dynamicTheme: "dynamicTheme"
    };

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

    const SAVE_TIMEOUT = 1000;
    class UserStorage {
        constructor() {
            this.timeout = null;
            this.settings = null;
        }
        async loadSettings() {
            this.settings = await this.loadSettingsFromStorage();
        }
        cleanup() {
            chrome.storage.local.remove(["activationTime", "deactivationTime"]);
            chrome.storage.sync.remove(["activationTime", "deactivationTime"]);
        }
        loadSettingsFromStorage() {
            return new Promise((resolve) => {
                chrome.storage.local.get(DEFAULT_SETTINGS, (local) => {
                    if (!local.syncSettings) {
                        local.theme = {
                            ...DEFAULT_SETTINGS.theme,
                            ...local.theme
                        };
                        local.time = {...DEFAULT_SETTINGS.time, ...local.time};
                        local.customThemes.forEach((site) => {
                            site.theme = {
                                ...DEFAULT_SETTINGS.theme,
                                ...site.theme
                            };
                        });
                        resolve(local);
                        return;
                    }
                    chrome.storage.sync.get(
                        {...DEFAULT_SETTINGS, config: "empty"},
                        ($sync) => {
                            let sync;
                            if ($sync.config === "empty") {
                                delete $sync.config;
                                sync = $sync;
                            } else {
                                sync = this.migrateSettings_4_6_2($sync);
                            }
                            sync.theme = {
                                ...DEFAULT_SETTINGS.theme,
                                ...sync.theme
                            };
                            sync.time = {
                                ...DEFAULT_SETTINGS.time,
                                ...sync.time
                            };
                            sync.presets.forEach((preset) => {
                                preset.theme = {
                                    ...DEFAULT_SETTINGS.theme,
                                    ...preset.theme
                                };
                            });
                            sync.customThemes.forEach((site) => {
                                site.theme = {
                                    ...DEFAULT_SETTINGS.theme,
                                    ...site.theme
                                };
                            });
                            resolve(sync);
                        }
                    );
                });
            });
        }
        async saveSettings() {
            const saved = await this.saveSettingsIntoStorage(this.settings);
            this.settings = saved;
        }
        saveSyncSetting(sync) {
            chrome.storage.sync.set({syncSettings: sync}, () => {
                if (chrome.runtime.lastError) {
                    console.warn(
                        "Settings synchronization was disabled due to error:",
                        chrome.runtime.lastError
                    );
                }
            });
            chrome.storage.local.set({syncSettings: sync});
        }
        saveSettingsIntoStorage(settings) {
            if (this.timeout) {
                clearInterval(this.timeout);
            }
            return new Promise((resolve) => {
                this.timeout = setTimeout(() => {
                    this.timeout = null;
                    if (settings.syncSettings) {
                        chrome.storage.sync.set(settings, () => {
                            if (chrome.runtime.lastError) {
                                console.warn(
                                    "Settings synchronization was disabled due to error:",
                                    chrome.runtime.lastError
                                );
                                const local = {
                                    ...settings,
                                    syncSettings: false
                                };
                                chrome.storage.local.set(local, () =>
                                    resolve(local)
                                );
                            } else {
                                resolve(settings);
                            }
                        });
                    } else {
                        chrome.storage.local.set(settings, () =>
                            resolve(settings)
                        );
                    }
                }, SAVE_TIMEOUT);
            });
        }
        set($settings) {
            if ($settings.siteList) {
                if (!Array.isArray($settings.siteList)) {
                    const list = [];
                    for (const key in $settings.siteList) {
                        const index = Number(key);
                        if (!isNaN(index)) {
                            list[index] = $settings.siteList[key];
                        }
                    }
                    $settings.siteList = list;
                }
                const siteList = $settings.siteList.filter((pattern) => {
                    let isOK = false;
                    try {
                        isURLMatched("https://google.com/", pattern);
                        isURLMatched("[::1]:1337", pattern);
                        isOK = true;
                    } catch (err) {
                        console.warn(`Pattern "${pattern}" excluded`);
                    }
                    return isOK && pattern !== "/";
                });
                $settings = {...$settings, siteList};
            }
            this.settings = {...this.settings, ...$settings};
        }
        migrateSettings_4_6_2(settings_4_6_2) {
            function migrateTheme(filterConfig_4_6_2) {
                const f = filterConfig_4_6_2;
                return {
                    ...DEFAULT_THEME,
                    mode: f.mode,
                    brightness: f.brightness,
                    contrast: f.contrast,
                    grayscale: f.grayscale,
                    sepia: f.sepia,
                    useFont: f.useFont,
                    fontFamily: f.fontFamily,
                    textStroke: f.textStroke,
                    engine: f.engine,
                    stylesheet: f.stylesheet
                };
            }
            try {
                const s = settings_4_6_2;
                const settings = {
                    ...DEFAULT_SETTINGS,
                    enabled: s.enabled,
                    theme: migrateTheme(s.config),
                    customThemes: s.config.custom
                        ? s.config.custom.map((c) => {
                              return {
                                  url: c.url,
                                  theme: migrateTheme(c.config)
                              };
                          })
                        : [],
                    siteList: s.config.siteList,
                    applyToListedOnly: s.config.invertListed,
                    changeBrowserTheme: s.config.changeBrowserTheme
                };
                chrome.storage.sync.remove("config");
                chrome.storage.sync.set(settings);
                return settings;
            } catch (err) {
                console.error(
                    "Settings migration error:",
                    err,
                    "Loaded settings:",
                    settings_4_6_2
                );
                return DEFAULT_SETTINGS;
            }
        }
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
    function rgbToString(rgb) {
        const {r, g, b, a} = rgb;
        if (a != null && a < 1) {
            return `rgba(${toFixed(r)}, ${toFixed(g)}, ${toFixed(b)}, ${toFixed(
                a,
                2
            )})`;
        }
        return `rgb(${toFixed(r)}, ${toFixed(g)}, ${toFixed(b)})`;
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

    function getBgPole(theme) {
        const isDarkScheme = theme.mode === 1;
        const prop = isDarkScheme
            ? "darkSchemeBackgroundColor"
            : "lightSchemeBackgroundColor";
        return theme[prop];
    }
    function getFgPole(theme) {
        const isDarkScheme = theme.mode === 1;
        const prop = isDarkScheme
            ? "darkSchemeTextColor"
            : "lightSchemeTextColor";
        return theme[prop];
    }
    const colorModificationCache = new Map();
    const colorParseCache = new Map();
    function parseToHSLWithCache(color) {
        if (colorParseCache.has(color)) {
            return colorParseCache.get(color);
        }
        const rgb = parse(color);
        const hsl = rgbToHSL(rgb);
        colorParseCache.set(color, hsl);
        return hsl;
    }
    const rgbCacheKeys = ["r", "g", "b", "a"];
    const themeCacheKeys = [
        "mode",
        "brightness",
        "contrast",
        "grayscale",
        "sepia",
        "darkSchemeBackgroundColor",
        "darkSchemeTextColor",
        "lightSchemeBackgroundColor",
        "lightSchemeTextColor"
    ];
    function getCacheId(rgb, theme) {
        return rgbCacheKeys
            .map((k) => rgb[k])
            .concat(themeCacheKeys.map((k) => theme[k]))
            .join(";");
    }
    function modifyColorWithCache(
        rgb,
        theme,
        modifyHSL,
        poleColor,
        anotherPoleColor
    ) {
        let fnCache;
        if (colorModificationCache.has(modifyHSL)) {
            fnCache = colorModificationCache.get(modifyHSL);
        } else {
            fnCache = new Map();
            colorModificationCache.set(modifyHSL, fnCache);
        }
        const id = getCacheId(rgb, theme);
        if (fnCache.has(id)) {
            return fnCache.get(id);
        }
        const hsl = rgbToHSL(rgb);
        const pole = poleColor == null ? null : parseToHSLWithCache(poleColor);
        const anotherPole =
            anotherPoleColor == null
                ? null
                : parseToHSLWithCache(anotherPoleColor);
        const modified = modifyHSL(hsl, pole, anotherPole);
        const {r, g, b, a} = hslToRGB(modified);
        const matrix = createFilterMatrix(theme);
        const [rf, gf, bf] = applyColorMatrix([r, g, b], matrix);
        const color =
            a === 1
                ? rgbToHexString({r: rf, g: gf, b: bf})
                : rgbToString({r: rf, g: gf, b: bf, a});
        fnCache.set(id, color);
        return color;
    }
    function modifyLightSchemeColor(rgb, theme) {
        const poleBg = getBgPole(theme);
        const poleFg = getFgPole(theme);
        return modifyColorWithCache(
            rgb,
            theme,
            modifyLightModeHSL,
            poleFg,
            poleBg
        );
    }
    function modifyLightModeHSL({h, s, l, a}, poleFg, poleBg) {
        const isDark = l < 0.5;
        let isNeutral;
        if (isDark) {
            isNeutral = l < 0.2 || s < 0.12;
        } else {
            const isBlue = h > 200 && h < 280;
            isNeutral = s < 0.24 || (l > 0.8 && isBlue);
        }
        let hx = h;
        let sx = l;
        if (isNeutral) {
            if (isDark) {
                hx = poleFg.h;
                sx = poleFg.s;
            } else {
                hx = poleBg.h;
                sx = poleBg.s;
            }
        }
        const lx = scale(l, 0, 1, poleFg.l, poleBg.l);
        return {h: hx, s: sx, l: lx, a};
    }
    const MAX_BG_LIGHTNESS = 0.4;
    function modifyBgHSL({h, s, l, a}, pole) {
        const isDark = l < 0.5;
        const isBlue = h > 200 && h < 280;
        const isNeutral = s < 0.12 || (l > 0.8 && isBlue);
        if (isDark) {
            const lx = scale(l, 0, 0.5, 0, MAX_BG_LIGHTNESS);
            if (isNeutral) {
                const hx = pole.h;
                const sx = pole.s;
                return {h: hx, s: sx, l: lx, a};
            }
            return {h, s, l: lx, a};
        }
        const lx = scale(l, 0.5, 1, MAX_BG_LIGHTNESS, pole.l);
        if (isNeutral) {
            const hx = pole.h;
            const sx = pole.s;
            return {h: hx, s: sx, l: lx, a};
        }
        let hx = h;
        const isYellow = h > 60 && h < 180;
        if (isYellow) {
            const isCloserToGreen = h > 120;
            if (isCloserToGreen) {
                hx = scale(h, 120, 180, 135, 180);
            } else {
                hx = scale(h, 60, 120, 60, 105);
            }
        }
        return {h: hx, s, l: lx, a};
    }
    function modifyBackgroundColor(rgb, theme) {
        if (theme.mode === 0) {
            return modifyLightSchemeColor(rgb, theme);
        }
        const pole = getBgPole(theme);
        return modifyColorWithCache(
            rgb,
            {...theme, mode: 0},
            modifyBgHSL,
            pole
        );
    }
    const MIN_FG_LIGHTNESS = 0.55;
    function modifyBlueFgHue(hue) {
        return scale(hue, 205, 245, 205, 220);
    }
    function modifyFgHSL({h, s, l, a}, pole) {
        const isLight = l > 0.5;
        const isNeutral = l < 0.2 || s < 0.24;
        const isBlue = !isNeutral && h > 205 && h < 245;
        if (isLight) {
            const lx = scale(l, 0.5, 1, MIN_FG_LIGHTNESS, pole.l);
            if (isNeutral) {
                const hx = pole.h;
                const sx = pole.s;
                return {h: hx, s: sx, l: lx, a};
            }
            let hx = h;
            if (isBlue) {
                hx = modifyBlueFgHue(h);
            }
            return {h: hx, s, l: lx, a};
        }
        if (isNeutral) {
            const hx = pole.h;
            const sx = pole.s;
            const lx = scale(l, 0, 0.5, pole.l, MIN_FG_LIGHTNESS);
            return {h: hx, s: sx, l: lx, a};
        }
        let hx = h;
        let lx = l;
        if (isBlue) {
            hx = modifyBlueFgHue(h);
            lx = scale(l, 0, 0.5, pole.l, Math.min(1, MIN_FG_LIGHTNESS + 0.05));
        } else {
            lx = scale(l, 0, 0.5, pole.l, MIN_FG_LIGHTNESS);
        }
        return {h: hx, s, l: lx, a};
    }
    function modifyForegroundColor(rgb, theme) {
        if (theme.mode === 0) {
            return modifyLightSchemeColor(rgb, theme);
        }
        const pole = getFgPole(theme);
        return modifyColorWithCache(
            rgb,
            {...theme, mode: 0},
            modifyFgHSL,
            pole
        );
    }
    function modifyBorderHSL({h, s, l, a}, poleFg, poleBg) {
        const isDark = l < 0.5;
        const isNeutral = l < 0.2 || s < 0.24;
        let hx = h;
        let sx = s;
        if (isNeutral) {
            if (isDark) {
                hx = poleFg.h;
                sx = poleFg.s;
            } else {
                hx = poleBg.h;
                sx = poleBg.s;
            }
        }
        const lx = scale(l, 0, 1, 0.5, 0.2);
        return {h: hx, s: sx, l: lx, a};
    }
    function modifyBorderColor(rgb, theme) {
        if (theme.mode === 0) {
            return modifyLightSchemeColor(rgb, theme);
        }
        const poleFg = getFgPole(theme);
        const poleBg = getBgPole(theme);
        return modifyColorWithCache(
            rgb,
            {...theme, mode: 0},
            modifyBorderHSL,
            poleFg,
            poleBg
        );
    }

    const themeColorTypes = {
        accentcolor: "bg",
        button_background_active: "text",
        button_background_hover: "text",
        frame: "bg",
        icons: "text",
        icons_attention: "text",
        popup: "bg",
        popup_border: "bg",
        popup_highlight: "bg",
        popup_highlight_text: "text",
        popup_text: "text",
        tab_background_text: "text",
        tab_line: "bg",
        tab_loading: "bg",
        tab_selected: "bg",
        textcolor: "text",
        toolbar: "bg",
        toolbar_bottom_separator: "border",
        toolbar_field: "bg",
        toolbar_field_border: "border",
        toolbar_field_border_focus: "border",
        toolbar_field_focus: "bg",
        toolbar_field_separator: "border",
        toolbar_field_text: "text",
        toolbar_field_text_focus: "text",
        toolbar_text: "text",
        toolbar_top_separator: "border",
        toolbar_vertical_separator: "border"
    };
    const $colors = {
        accentcolor: "#111111",
        frame: "#111111",
        popup: "#cccccc",
        popup_text: "black",
        tab_background_text: "white",
        tab_line: "#23aeff",
        tab_loading: "#23aeff",
        textcolor: "white",
        toolbar: "#707070",
        toolbar_field: "lightgray",
        toolbar_field_text: "black"
    };
    function setWindowTheme(filter) {
        const colors = Object.entries($colors).reduce((obj, [key, value]) => {
            const type = themeColorTypes[key];
            const modify = {
                bg: modifyBackgroundColor,
                text: modifyForegroundColor,
                border: modifyBorderColor
            }[type];
            const rgb = parse(value);
            const modified = modify(rgb, filter);
            obj[key] = modified;
            return obj;
        }, {});
        if (
            typeof browser !== "undefined" &&
            browser.theme &&
            browser.theme.update
        ) {
            browser.theme.update({colors});
        }
    }
    function resetWindowTheme() {
        if (
            typeof browser !== "undefined" &&
            browser.theme &&
            browser.theme.reset
        ) {
            browser.theme.reset();
        }
    }

    function createSVGFilterStylesheet(config, url, frameURL, inversionFixes) {
        let filterValue;
        let reverseFilterValue;
        if (isFirefox()) {
            filterValue = getEmbeddedSVGFilterValue(
                getSVGFilterMatrixValue(config)
            );
            reverseFilterValue = getEmbeddedSVGFilterValue(
                getSVGReverseFilterMatrixValue()
            );
        } else {
            filterValue = "url(#dark-reader-filter)";
            reverseFilterValue = "url(#dark-reader-reverse-filter)";
        }
        return cssFilterStyleheetTemplate(
            filterValue,
            reverseFilterValue,
            config,
            url,
            frameURL,
            inversionFixes
        );
    }
    function getEmbeddedSVGFilterValue(matrixValue) {
        const id = "dark-reader-filter";
        const svg = [
            '<svg xmlns="http://www.w3.org/2000/svg">',
            `<filter id="${id}" style="color-interpolation-filters: sRGB;">`,
            `<feColorMatrix type="matrix" values="${matrixValue}" />`,
            "</filter>",
            "</svg>"
        ].join("");
        return `url(data:image/svg+xml;base64,${btoa(svg)}#${id})`;
    }
    function toSVGMatrix(matrix) {
        return matrix
            .slice(0, 4)
            .map((m) => m.map((m) => m.toFixed(3)).join(" "))
            .join(" ");
    }
    function getSVGFilterMatrixValue(config) {
        return toSVGMatrix(createFilterMatrix(config));
    }
    function getSVGReverseFilterMatrixValue() {
        return toSVGMatrix(Matrix.invertNHue());
    }

    const matchesMediaQuery = (query) =>
        Boolean(window.matchMedia(query).matches);
    const matchesDarkTheme = () =>
        matchesMediaQuery("(prefers-color-scheme: dark)");
    const matchesLightTheme = () =>
        matchesMediaQuery("(prefers-color-scheme: light)");
    const isColorSchemeSupported = matchesDarkTheme() || matchesLightTheme();
    function isSystemDarkModeEnabled() {
        if (!isColorSchemeSupported) {
            return false;
        }
        return matchesDarkTheme();
    }

    const AUTO_TIME_CHECK_INTERVAL = getDuration({seconds: 10});
    class Extension {
        constructor() {
            this.popupOpeningListener = null;
            this.wasLastColorSchemeDark = null;
            this.onColorSchemeChange = ({isDark}) => {
                this.wasLastColorSchemeDark = isDark;
                if (this.user.settings.automation !== "system") {
                    return;
                }
                this.handleAutoCheck();
            };
            this.handleAutoCheck = () => {
                if (!this.ready) {
                    return;
                }
                const isEnabled = this.isEnabled();
                if (this.wasEnabledOnLastCheck !== isEnabled) {
                    this.wasEnabledOnLastCheck = isEnabled;
                    this.onAppToggle();
                    this.tabs.sendMessage(this.getTabMessage);
                    this.reportChanges();
                }
            };
            this.getTabMessage = (url, frameURL) => {
                const urlInfo = this.getURLInfo(url);
                if (
                    this.isEnabled() &&
                    isURLEnabled(url, this.user.settings, urlInfo)
                ) {
                    const custom = this.user.settings.customThemes.find(
                        ({url: urlList}) => isURLInList(url, urlList)
                    );
                    const preset = custom
                        ? null
                        : this.user.settings.presets.find(({urls}) =>
                              isURLInList(url, urls)
                          );
                    const theme = custom
                        ? custom.theme
                        : preset
                        ? preset.theme
                        : this.user.settings.theme;
                    console.log(`Creating CSS for url: ${url}`);
                    switch (theme.engine) {
                        case ThemeEngines.cssFilter: {
                            return {
                                type: "add-css-filter",
                                data: createCSSFilterStyleheet(
                                    theme,
                                    url,
                                    frameURL,
                                    this.config.INVERSION_FIXES
                                )
                            };
                        }
                        case ThemeEngines.svgFilter: {
                            if (isFirefox()) {
                                return {
                                    type: "add-css-filter",
                                    data: createSVGFilterStylesheet(
                                        theme,
                                        url,
                                        frameURL,
                                        this.config.INVERSION_FIXES
                                    )
                                };
                            }
                            return {
                                type: "add-svg-filter",
                                data: {
                                    css: createSVGFilterStylesheet(
                                        theme,
                                        url,
                                        frameURL,
                                        this.config.INVERSION_FIXES
                                    ),
                                    svgMatrix: getSVGFilterMatrixValue(theme),
                                    svgReverseMatrix: getSVGReverseFilterMatrixValue()
                                }
                            };
                        }
                        case ThemeEngines.staticTheme: {
                            return {
                                type: "add-static-theme",
                                data:
                                    theme.stylesheet && theme.stylesheet.trim()
                                        ? theme.stylesheet
                                        : createStaticStylesheet(
                                              theme,
                                              url,
                                              frameURL,
                                              this.config.STATIC_THEMES
                                          )
                            };
                        }
                        case ThemeEngines.dynamicTheme: {
                            const filter = {...theme};
                            delete filter.engine;
                            const fixes = getDynamicThemeFixesFor(
                                url,
                                frameURL,
                                this.config.DYNAMIC_THEME_FIXES,
                                this.user.settings.enableForPDF
                            );
                            const isIFrame = frameURL != null;
                            return {
                                type: "add-dynamic-theme",
                                data: {filter, fixes, isIFrame}
                            };
                        }
                        default: {
                            throw new Error(`Unknown engine ${theme.engine}`);
                        }
                    }
                } else {
                    console.log(`Site is not inverted: ${url}`);
                }
                return {
                    type: "clean-up"
                };
            };
            this.ready = false;
            this.icon = new IconManager();
            this.config = new ConfigManager();
            this.devtools = new DevTools(this.config, () =>
                this.onSettingsChanged()
            );
            this.messenger = new Messenger(this.getMessengerAdapter());
            this.news = new Newsmaker((news) => this.onNewsUpdate(news));
            this.tabs = new TabManager({
                getConnectionMessage: (url, frameURL) =>
                    this.getConnectionMessage(url, frameURL),
                onColorSchemeChange: this.onColorSchemeChange
            });
            this.user = new UserStorage();
            this.awaiting = [];
        }
        isEnabled() {
            const {automation} = this.user.settings;
            if (automation === "time") {
                const now = new Date();
                return isInTimeInterval(
                    now,
                    this.user.settings.time.activation,
                    this.user.settings.time.deactivation
                );
            } else if (automation === "system") {
                if (isFirefox()) {
                    return this.wasLastColorSchemeDark == null
                        ? isSystemDarkModeEnabled()
                        : this.wasLastColorSchemeDark;
                }
                return isSystemDarkModeEnabled();
            } else if (automation === "location") {
                const latitude = this.user.settings.location.latitude;
                const longitude = this.user.settings.location.longitude;
                if (latitude != null && longitude != null) {
                    const now = new Date();
                    return isNightAtLocation(now, latitude, longitude);
                }
            }
            return this.user.settings.enabled;
        }
        async start() {
            await this.config.load({local: true});
            this.fonts = await getFontList();
            await this.user.loadSettings();
            if (this.user.settings.syncSitesFixes) {
                await this.config.load({local: false});
            }
            this.onAppToggle();
            this.changeSettings(this.user.settings);
            console.log("loaded", this.user.settings);
            this.registerCommands();
            this.ready = true;
            this.tabs.updateContentScript();
            this.awaiting.forEach((ready) => ready());
            this.awaiting = null;
            this.startAutoTimeCheck();
            this.news.subscribe();
            this.user.cleanup();
        }
        getMessengerAdapter() {
            return {
                collect: async () => {
                    if (!this.ready) {
                        await new Promise((resolve) =>
                            this.awaiting.push(resolve)
                        );
                    }
                    return await this.collectData();
                },
                getActiveTabInfo: async () => {
                    if (!this.ready) {
                        await new Promise((resolve) =>
                            this.awaiting.push(resolve)
                        );
                    }
                    const url = await this.tabs.getActiveTabURL();
                    return this.getURLInfo(url);
                },
                changeSettings: (settings) => this.changeSettings(settings),
                setTheme: (theme) => this.setTheme(theme),
                setShortcut: ({command, shortcut}) =>
                    this.setShortcut(command, shortcut),
                toggleURL: (url) => this.toggleURL(url),
                markNewsAsRead: (ids) => this.news.markAsRead(...ids),
                onPopupOpen: () =>
                    this.popupOpeningListener && this.popupOpeningListener(),
                loadConfig: async (options) => await this.config.load(options),
                applyDevDynamicThemeFixes: (text) =>
                    this.devtools.applyDynamicThemeFixes(text),
                resetDevDynamicThemeFixes: () =>
                    this.devtools.resetDynamicThemeFixes(),
                applyDevInversionFixes: (text) =>
                    this.devtools.applyInversionFixes(text),
                resetDevInversionFixes: () =>
                    this.devtools.resetInversionFixes(),
                applyDevStaticThemes: (text) =>
                    this.devtools.applyStaticThemes(text),
                resetDevStaticThemes: () => this.devtools.resetStaticThemes()
            };
        }
        registerCommands() {
            if (!chrome.commands) {
                return;
            }
            chrome.commands.onCommand.addListener((command) => {
                if (command === "toggle") {
                    console.log("Toggle command entered");
                    this.changeSettings({
                        enabled: !this.isEnabled(),
                        automation: ""
                    });
                }
                if (command === "addSite") {
                    console.log("Add Site command entered");
                    this.toggleCurrentSite();
                }
                if (command === "switchEngine") {
                    console.log("Switch Engine command entered");
                    const engines = Object.values(ThemeEngines);
                    const index = engines.indexOf(
                        this.user.settings.theme.engine
                    );
                    const next =
                        index === engines.length - 1
                            ? engines[0]
                            : engines[index + 1];
                    this.setTheme({engine: next});
                }
            });
        }
        async getShortcuts() {
            const commands = await getCommands();
            return commands.reduce(
                (map, cmd) => Object.assign(map, {[cmd.name]: cmd.shortcut}),
                {}
            );
        }
        setShortcut(command, shortcut) {
            setShortcut(command, shortcut);
        }
        async collectData() {
            return {
                isEnabled: this.isEnabled(),
                isReady: this.ready,
                settings: this.user.settings,
                fonts: this.fonts,
                news: this.news.latest,
                shortcuts: await this.getShortcuts(),
                devtools: {
                    dynamicFixesText: this.devtools.getDynamicThemeFixesText(),
                    filterFixesText: this.devtools.getInversionFixesText(),
                    staticThemesText: this.devtools.getStaticThemesText(),
                    hasCustomDynamicFixes: this.devtools.hasCustomDynamicThemeFixes(),
                    hasCustomFilterFixes: this.devtools.hasCustomFilterFixes(),
                    hasCustomStaticFixes: this.devtools.hasCustomStaticFixes()
                }
            };
        }
        onNewsUpdate(news) {
            const latestNews = news.length > 0 && news[0];
            if (latestNews && latestNews.important && !latestNews.read) {
                this.icon.showImportantBadge();
                return;
            }
            const unread = news.filter(({read}) => !read);
            if (unread.length > 0 && this.user.settings.notifyOfNews) {
                this.icon.showUnreadReleaseNotesBadge(unread.length);
                return;
            }
            this.icon.hideBadge();
        }
        getConnectionMessage(url, frameURL) {
            if (this.ready) {
                return this.isEnabled() && this.getTabMessage(url, frameURL);
            } else {
                return new Promise((resolve) => {
                    this.awaiting.push(() => {
                        resolve(
                            this.isEnabled() &&
                                this.getTabMessage(url, frameURL)
                        );
                    });
                });
            }
        }
        startAutoTimeCheck() {
            setInterval(() => {
                if (!this.ready || this.user.settings.automation === "") {
                    return;
                }
                this.handleAutoCheck();
            }, AUTO_TIME_CHECK_INTERVAL);
        }
        changeSettings($settings) {
            const prev = {...this.user.settings};
            this.user.set($settings);
            if (
                prev.enabled !== this.user.settings.enabled ||
                prev.automation !== this.user.settings.automation ||
                prev.time.activation !== this.user.settings.time.activation ||
                prev.time.deactivation !==
                    this.user.settings.time.deactivation ||
                prev.location.latitude !==
                    this.user.settings.location.latitude ||
                prev.location.longitude !==
                    this.user.settings.location.longitude
            ) {
                this.onAppToggle();
            }
            if (prev.syncSettings !== this.user.settings.syncSettings) {
                this.user.saveSyncSetting(this.user.settings.syncSettings);
            }
            if (
                this.isEnabled() &&
                $settings.changeBrowserTheme != null &&
                prev.changeBrowserTheme !== $settings.changeBrowserTheme
            ) {
                if ($settings.changeBrowserTheme) {
                    setWindowTheme(this.user.settings.theme);
                } else {
                    resetWindowTheme();
                }
            }
            this.onSettingsChanged();
        }
        setTheme($theme) {
            this.user.set({theme: {...this.user.settings.theme, ...$theme}});
            if (this.isEnabled() && this.user.settings.changeBrowserTheme) {
                setWindowTheme(this.user.settings.theme);
            }
            this.onSettingsChanged();
        }
        async reportChanges() {
            const info = await this.collectData();
            this.messenger.reportChanges(info);
        }
        toggleURL(url) {
            const isInDarkList = isURLInList(url, this.config.DARK_SITES);
            const siteList = isInDarkList
                ? this.user.settings.siteListEnabled.slice()
                : this.user.settings.siteList.slice();
            const pattern = getURLHost(url);
            const index = siteList.indexOf(pattern);
            if (index < 0) {
                siteList.push(pattern);
            } else {
                siteList.splice(index, 1);
            }
            if (isInDarkList) {
                this.changeSettings({siteListEnabled: siteList});
            } else {
                this.changeSettings({siteList});
            }
        }
        async toggleCurrentSite() {
            const url = await this.tabs.getActiveTabURL();
            this.toggleURL(url);
        }
        onAppToggle() {
            if (this.isEnabled()) {
                this.icon.setActive();
                if (this.user.settings.changeBrowserTheme) {
                    setWindowTheme(this.user.settings.theme);
                }
            } else {
                this.icon.setInactive();
                if (this.user.settings.changeBrowserTheme) {
                    resetWindowTheme();
                }
            }
        }
        onSettingsChanged() {
            if (!this.ready) {
                return;
            }
            this.wasEnabledOnLastCheck = this.isEnabled();
            this.tabs.sendMessage(this.getTabMessage);
            this.saveUserSettings();
            this.reportChanges();
        }
        getURLInfo(url) {
            const {DARK_SITES} = this.config;
            const isInDarkList = isURLInList(url, DARK_SITES);
            const isProtected = !canInjectScript(url);
            return {
                url,
                isInDarkList,
                isProtected
            };
        }
        async saveUserSettings() {
            await this.user.saveSettings();
            console.log("saved", this.user.settings);
        }
    }

    const extension = new Extension();
    extension.start();
    chrome.runtime.onInstalled.addListener(({reason}) => {
        if (reason === "install") {
            chrome.tabs.create({url: getHelpURL()});
        }
    });
    chrome.runtime.setUninstallURL(UNINSTALL_URL);
})();
