"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // ../../node_modules/base64-js/index.js
  var require_base64_js = __commonJS({
    "../../node_modules/base64-js/index.js"(exports) {
      "use strict";
      exports.byteLength = byteLength;
      exports.toByteArray = toByteArray;
      exports.fromByteArray = fromByteArray;
      var lookup = [];
      var revLookup = [];
      var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
      var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      for (i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      }
      var i;
      var len;
      revLookup["-".charCodeAt(0)] = 62;
      revLookup["_".charCodeAt(0)] = 63;
      function getLens(b64) {
        var len2 = b64.length;
        if (len2 % 4 > 0) {
          throw new Error("Invalid string. Length must be a multiple of 4");
        }
        var validLen = b64.indexOf("=");
        if (validLen === -1) validLen = len2;
        var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
        return [validLen, placeHoldersLen];
      }
      function byteLength(b64) {
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function _byteLength(b64, validLen, placeHoldersLen) {
        return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
      }
      function toByteArray(b64) {
        var tmp;
        var lens = getLens(b64);
        var validLen = lens[0];
        var placeHoldersLen = lens[1];
        var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
        var curByte = 0;
        var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
        var i2;
        for (i2 = 0; i2 < len2; i2 += 4) {
          tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
          arr[curByte++] = tmp >> 16 & 255;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 2) {
          tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
          arr[curByte++] = tmp & 255;
        }
        if (placeHoldersLen === 1) {
          tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
          arr[curByte++] = tmp >> 8 & 255;
          arr[curByte++] = tmp & 255;
        }
        return arr;
      }
      function tripletToBase64(num) {
        return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
      }
      function encodeChunk(uint8, start, end) {
        var tmp;
        var output = [];
        for (var i2 = start; i2 < end; i2 += 3) {
          tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
          output.push(tripletToBase64(tmp));
        }
        return output.join("");
      }
      function fromByteArray(uint8) {
        var tmp;
        var len2 = uint8.length;
        var extraBytes = len2 % 3;
        var parts = [];
        var maxChunkLength = 16383;
        for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
          parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
        }
        if (extraBytes === 1) {
          tmp = uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
          );
        } else if (extraBytes === 2) {
          tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
          parts.push(
            lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
          );
        }
        return parts.join("");
      }
    }
  });

  // ../../node_modules/ieee754/index.js
  var require_ieee754 = __commonJS({
    "../../node_modules/ieee754/index.js"(exports) {
      exports.read = function(buffer, offset, isLE, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE ? nBytes - 1 : 0;
        var d = isLE ? -1 : 1;
        var s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
        }
        if (e === 0) {
          e = 1 - eBias;
        } else if (e === eMax) {
          return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
          m = m + Math.pow(2, mLen);
          e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
      };
      exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE ? 0 : nBytes - 1;
        var d = isLE ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || value === Infinity) {
          m = isNaN(value) ? 1 : 0;
          e = eMax;
        } else {
          e = Math.floor(Math.log(value) / Math.LN2);
          if (value * (c = Math.pow(2, -e)) < 1) {
            e--;
            c *= 2;
          }
          if (e + eBias >= 1) {
            value += rt / c;
          } else {
            value += rt * Math.pow(2, 1 - eBias);
          }
          if (value * c >= 2) {
            e++;
            c /= 2;
          }
          if (e + eBias >= eMax) {
            m = 0;
            e = eMax;
          } else if (e + eBias >= 1) {
            m = (value * c - 1) * Math.pow(2, mLen);
            e = e + eBias;
          } else {
            m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
            e = 0;
          }
        }
        for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
        }
        e = e << mLen | m;
        eLen += mLen;
        for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
        }
        buffer[offset + i - d] |= s * 128;
      };
    }
  });

  // ../../node_modules/buffer/index.js
  var require_buffer = __commonJS({
    "../../node_modules/buffer/index.js"(exports) {
      "use strict";
      var base64 = require_base64_js();
      var ieee754 = require_ieee754();
      var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
      exports.Buffer = Buffer4;
      exports.SlowBuffer = SlowBuffer;
      exports.INSPECT_MAX_BYTES = 50;
      var K_MAX_LENGTH = 2147483647;
      exports.kMaxLength = K_MAX_LENGTH;
      Buffer4.TYPED_ARRAY_SUPPORT = typedArraySupport();
      if (!Buffer4.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
        console.error(
          "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
        );
      }
      function typedArraySupport() {
        try {
          const arr = new Uint8Array(1);
          const proto = { foo: function() {
            return 42;
          } };
          Object.setPrototypeOf(proto, Uint8Array.prototype);
          Object.setPrototypeOf(arr, proto);
          return arr.foo() === 42;
        } catch (e) {
          return false;
        }
      }
      Object.defineProperty(Buffer4.prototype, "parent", {
        enumerable: true,
        get: function() {
          if (!Buffer4.isBuffer(this)) return void 0;
          return this.buffer;
        }
      });
      Object.defineProperty(Buffer4.prototype, "offset", {
        enumerable: true,
        get: function() {
          if (!Buffer4.isBuffer(this)) return void 0;
          return this.byteOffset;
        }
      });
      function createBuffer(length) {
        if (length > K_MAX_LENGTH) {
          throw new RangeError('The value "' + length + '" is invalid for option "size"');
        }
        const buf = new Uint8Array(length);
        Object.setPrototypeOf(buf, Buffer4.prototype);
        return buf;
      }
      function Buffer4(arg, encodingOrOffset, length) {
        if (typeof arg === "number") {
          if (typeof encodingOrOffset === "string") {
            throw new TypeError(
              'The "string" argument must be of type string. Received type number'
            );
          }
          return allocUnsafe(arg);
        }
        return from(arg, encodingOrOffset, length);
      }
      Buffer4.poolSize = 8192;
      function from(value, encodingOrOffset, length) {
        if (typeof value === "string") {
          return fromString(value, encodingOrOffset);
        }
        if (ArrayBuffer.isView(value)) {
          return fromArrayView(value);
        }
        if (value == null) {
          throw new TypeError(
            "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
          );
        }
        if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
          return fromArrayBuffer(value, encodingOrOffset, length);
        }
        if (typeof value === "number") {
          throw new TypeError(
            'The "value" argument must not be of type number. Received type number'
          );
        }
        const valueOf = value.valueOf && value.valueOf();
        if (valueOf != null && valueOf !== value) {
          return Buffer4.from(valueOf, encodingOrOffset, length);
        }
        const b = fromObject(value);
        if (b) return b;
        if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
          return Buffer4.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
        }
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      Buffer4.from = function(value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length);
      };
      Object.setPrototypeOf(Buffer4.prototype, Uint8Array.prototype);
      Object.setPrototypeOf(Buffer4, Uint8Array);
      function assertSize(size) {
        if (typeof size !== "number") {
          throw new TypeError('"size" argument must be of type number');
        } else if (size < 0) {
          throw new RangeError('The value "' + size + '" is invalid for option "size"');
        }
      }
      function alloc(size, fill, encoding) {
        assertSize(size);
        if (size <= 0) {
          return createBuffer(size);
        }
        if (fill !== void 0) {
          return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
        }
        return createBuffer(size);
      }
      Buffer4.alloc = function(size, fill, encoding) {
        return alloc(size, fill, encoding);
      };
      function allocUnsafe(size) {
        assertSize(size);
        return createBuffer(size < 0 ? 0 : checked(size) | 0);
      }
      Buffer4.allocUnsafe = function(size) {
        return allocUnsafe(size);
      };
      Buffer4.allocUnsafeSlow = function(size) {
        return allocUnsafe(size);
      };
      function fromString(string, encoding) {
        if (typeof encoding !== "string" || encoding === "") {
          encoding = "utf8";
        }
        if (!Buffer4.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        const length = byteLength(string, encoding) | 0;
        let buf = createBuffer(length);
        const actual = buf.write(string, encoding);
        if (actual !== length) {
          buf = buf.slice(0, actual);
        }
        return buf;
      }
      function fromArrayLike(array) {
        const length = array.length < 0 ? 0 : checked(array.length) | 0;
        const buf = createBuffer(length);
        for (let i = 0; i < length; i += 1) {
          buf[i] = array[i] & 255;
        }
        return buf;
      }
      function fromArrayView(arrayView) {
        if (isInstance(arrayView, Uint8Array)) {
          const copy = new Uint8Array(arrayView);
          return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
        }
        return fromArrayLike(arrayView);
      }
      function fromArrayBuffer(array, byteOffset, length) {
        if (byteOffset < 0 || array.byteLength < byteOffset) {
          throw new RangeError('"offset" is outside of buffer bounds');
        }
        if (array.byteLength < byteOffset + (length || 0)) {
          throw new RangeError('"length" is outside of buffer bounds');
        }
        let buf;
        if (byteOffset === void 0 && length === void 0) {
          buf = new Uint8Array(array);
        } else if (length === void 0) {
          buf = new Uint8Array(array, byteOffset);
        } else {
          buf = new Uint8Array(array, byteOffset, length);
        }
        Object.setPrototypeOf(buf, Buffer4.prototype);
        return buf;
      }
      function fromObject(obj) {
        if (Buffer4.isBuffer(obj)) {
          const len = checked(obj.length) | 0;
          const buf = createBuffer(len);
          if (buf.length === 0) {
            return buf;
          }
          obj.copy(buf, 0, 0, len);
          return buf;
        }
        if (obj.length !== void 0) {
          if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
            return createBuffer(0);
          }
          return fromArrayLike(obj);
        }
        if (obj.type === "Buffer" && Array.isArray(obj.data)) {
          return fromArrayLike(obj.data);
        }
      }
      function checked(length) {
        if (length >= K_MAX_LENGTH) {
          throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
        }
        return length | 0;
      }
      function SlowBuffer(length) {
        if (+length != length) {
          length = 0;
        }
        return Buffer4.alloc(+length);
      }
      Buffer4.isBuffer = function isBuffer(b) {
        return b != null && b._isBuffer === true && b !== Buffer4.prototype;
      };
      Buffer4.compare = function compare(a, b) {
        if (isInstance(a, Uint8Array)) a = Buffer4.from(a, a.offset, a.byteLength);
        if (isInstance(b, Uint8Array)) b = Buffer4.from(b, b.offset, b.byteLength);
        if (!Buffer4.isBuffer(a) || !Buffer4.isBuffer(b)) {
          throw new TypeError(
            'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
          );
        }
        if (a === b) return 0;
        let x = a.length;
        let y = b.length;
        for (let i = 0, len = Math.min(x, y); i < len; ++i) {
          if (a[i] !== b[i]) {
            x = a[i];
            y = b[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      Buffer4.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "latin1":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return true;
          default:
            return false;
        }
      };
      Buffer4.concat = function concat(list, length) {
        if (!Array.isArray(list)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        }
        if (list.length === 0) {
          return Buffer4.alloc(0);
        }
        let i;
        if (length === void 0) {
          length = 0;
          for (i = 0; i < list.length; ++i) {
            length += list[i].length;
          }
        }
        const buffer = Buffer4.allocUnsafe(length);
        let pos = 0;
        for (i = 0; i < list.length; ++i) {
          let buf = list[i];
          if (isInstance(buf, Uint8Array)) {
            if (pos + buf.length > buffer.length) {
              if (!Buffer4.isBuffer(buf)) buf = Buffer4.from(buf);
              buf.copy(buffer, pos);
            } else {
              Uint8Array.prototype.set.call(
                buffer,
                buf,
                pos
              );
            }
          } else if (!Buffer4.isBuffer(buf)) {
            throw new TypeError('"list" argument must be an Array of Buffers');
          } else {
            buf.copy(buffer, pos);
          }
          pos += buf.length;
        }
        return buffer;
      };
      function byteLength(string, encoding) {
        if (Buffer4.isBuffer(string)) {
          return string.length;
        }
        if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
          return string.byteLength;
        }
        if (typeof string !== "string") {
          throw new TypeError(
            'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
          );
        }
        const len = string.length;
        const mustMatch = arguments.length > 2 && arguments[2] === true;
        if (!mustMatch && len === 0) return 0;
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "ascii":
            case "latin1":
            case "binary":
              return len;
            case "utf8":
            case "utf-8":
              return utf8ToBytes(string).length;
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return len * 2;
            case "hex":
              return len >>> 1;
            case "base64":
              return base64ToBytes(string).length;
            default:
              if (loweredCase) {
                return mustMatch ? -1 : utf8ToBytes(string).length;
              }
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer4.byteLength = byteLength;
      function slowToString(encoding, start, end) {
        let loweredCase = false;
        if (start === void 0 || start < 0) {
          start = 0;
        }
        if (start > this.length) {
          return "";
        }
        if (end === void 0 || end > this.length) {
          end = this.length;
        }
        if (end <= 0) {
          return "";
        }
        end >>>= 0;
        start >>>= 0;
        if (end <= start) {
          return "";
        }
        if (!encoding) encoding = "utf8";
        while (true) {
          switch (encoding) {
            case "hex":
              return hexSlice(this, start, end);
            case "utf8":
            case "utf-8":
              return utf8Slice(this, start, end);
            case "ascii":
              return asciiSlice(this, start, end);
            case "latin1":
            case "binary":
              return latin1Slice(this, start, end);
            case "base64":
              return base64Slice(this, start, end);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return utf16leSlice(this, start, end);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = (encoding + "").toLowerCase();
              loweredCase = true;
          }
        }
      }
      Buffer4.prototype._isBuffer = true;
      function swap(b, n, m) {
        const i = b[n];
        b[n] = b[m];
        b[m] = i;
      }
      Buffer4.prototype.swap16 = function swap16() {
        const len = this.length;
        if (len % 2 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 16-bits");
        }
        for (let i = 0; i < len; i += 2) {
          swap(this, i, i + 1);
        }
        return this;
      };
      Buffer4.prototype.swap32 = function swap32() {
        const len = this.length;
        if (len % 4 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 32-bits");
        }
        for (let i = 0; i < len; i += 4) {
          swap(this, i, i + 3);
          swap(this, i + 1, i + 2);
        }
        return this;
      };
      Buffer4.prototype.swap64 = function swap64() {
        const len = this.length;
        if (len % 8 !== 0) {
          throw new RangeError("Buffer size must be a multiple of 64-bits");
        }
        for (let i = 0; i < len; i += 8) {
          swap(this, i, i + 7);
          swap(this, i + 1, i + 6);
          swap(this, i + 2, i + 5);
          swap(this, i + 3, i + 4);
        }
        return this;
      };
      Buffer4.prototype.toString = function toString() {
        const length = this.length;
        if (length === 0) return "";
        if (arguments.length === 0) return utf8Slice(this, 0, length);
        return slowToString.apply(this, arguments);
      };
      Buffer4.prototype.toLocaleString = Buffer4.prototype.toString;
      Buffer4.prototype.equals = function equals(b) {
        if (!Buffer4.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        if (this === b) return true;
        return Buffer4.compare(this, b) === 0;
      };
      Buffer4.prototype.inspect = function inspect() {
        let str = "";
        const max = exports.INSPECT_MAX_BYTES;
        str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
        if (this.length > max) str += " ... ";
        return "<Buffer " + str + ">";
      };
      if (customInspectSymbol) {
        Buffer4.prototype[customInspectSymbol] = Buffer4.prototype.inspect;
      }
      Buffer4.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
        if (isInstance(target, Uint8Array)) {
          target = Buffer4.from(target, target.offset, target.byteLength);
        }
        if (!Buffer4.isBuffer(target)) {
          throw new TypeError(
            'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
          );
        }
        if (start === void 0) {
          start = 0;
        }
        if (end === void 0) {
          end = target ? target.length : 0;
        }
        if (thisStart === void 0) {
          thisStart = 0;
        }
        if (thisEnd === void 0) {
          thisEnd = this.length;
        }
        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
          throw new RangeError("out of range index");
        }
        if (thisStart >= thisEnd && start >= end) {
          return 0;
        }
        if (thisStart >= thisEnd) {
          return -1;
        }
        if (start >= end) {
          return 1;
        }
        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;
        if (this === target) return 0;
        let x = thisEnd - thisStart;
        let y = end - start;
        const len = Math.min(x, y);
        const thisCopy = this.slice(thisStart, thisEnd);
        const targetCopy = target.slice(start, end);
        for (let i = 0; i < len; ++i) {
          if (thisCopy[i] !== targetCopy[i]) {
            x = thisCopy[i];
            y = targetCopy[i];
            break;
          }
        }
        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
      };
      function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        if (buffer.length === 0) return -1;
        if (typeof byteOffset === "string") {
          encoding = byteOffset;
          byteOffset = 0;
        } else if (byteOffset > 2147483647) {
          byteOffset = 2147483647;
        } else if (byteOffset < -2147483648) {
          byteOffset = -2147483648;
        }
        byteOffset = +byteOffset;
        if (numberIsNaN(byteOffset)) {
          byteOffset = dir ? 0 : buffer.length - 1;
        }
        if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
        if (byteOffset >= buffer.length) {
          if (dir) return -1;
          else byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
          if (dir) byteOffset = 0;
          else return -1;
        }
        if (typeof val === "string") {
          val = Buffer4.from(val, encoding);
        }
        if (Buffer4.isBuffer(val)) {
          if (val.length === 0) {
            return -1;
          }
          return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        } else if (typeof val === "number") {
          val = val & 255;
          if (typeof Uint8Array.prototype.indexOf === "function") {
            if (dir) {
              return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
            } else {
              return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
            }
          }
          return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
        }
        throw new TypeError("val must be string, number or Buffer");
      }
      function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        let indexSize = 1;
        let arrLength = arr.length;
        let valLength = val.length;
        if (encoding !== void 0) {
          encoding = String(encoding).toLowerCase();
          if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
            if (arr.length < 2 || val.length < 2) {
              return -1;
            }
            indexSize = 2;
            arrLength /= 2;
            valLength /= 2;
            byteOffset /= 2;
          }
        }
        function read(buf, i2) {
          if (indexSize === 1) {
            return buf[i2];
          } else {
            return buf.readUInt16BE(i2 * indexSize);
          }
        }
        let i;
        if (dir) {
          let foundIndex = -1;
          for (i = byteOffset; i < arrLength; i++) {
            if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
              if (foundIndex === -1) foundIndex = i;
              if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
            } else {
              if (foundIndex !== -1) i -= i - foundIndex;
              foundIndex = -1;
            }
          }
        } else {
          if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
          for (i = byteOffset; i >= 0; i--) {
            let found = true;
            for (let j = 0; j < valLength; j++) {
              if (read(arr, i + j) !== read(val, j)) {
                found = false;
                break;
              }
            }
            if (found) return i;
          }
        }
        return -1;
      }
      Buffer4.prototype.includes = function includes(val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1;
      };
      Buffer4.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
      };
      Buffer4.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
      };
      function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        const remaining = buf.length - offset;
        if (!length) {
          length = remaining;
        } else {
          length = Number(length);
          if (length > remaining) {
            length = remaining;
          }
        }
        const strLen = string.length;
        if (length > strLen / 2) {
          length = strLen / 2;
        }
        let i;
        for (i = 0; i < length; ++i) {
          const parsed = parseInt(string.substr(i * 2, 2), 16);
          if (numberIsNaN(parsed)) return i;
          buf[offset + i] = parsed;
        }
        return i;
      }
      function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
      }
      function asciiWrite(buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length);
      }
      function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
      }
      function ucs2Write(buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
      }
      Buffer4.prototype.write = function write(string, offset, length, encoding) {
        if (offset === void 0) {
          encoding = "utf8";
          length = this.length;
          offset = 0;
        } else if (length === void 0 && typeof offset === "string") {
          encoding = offset;
          length = this.length;
          offset = 0;
        } else if (isFinite(offset)) {
          offset = offset >>> 0;
          if (isFinite(length)) {
            length = length >>> 0;
            if (encoding === void 0) encoding = "utf8";
          } else {
            encoding = length;
            length = void 0;
          }
        } else {
          throw new Error(
            "Buffer.write(string, encoding, offset[, length]) is no longer supported"
          );
        }
        const remaining = this.length - offset;
        if (length === void 0 || length > remaining) length = remaining;
        if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
          throw new RangeError("Attempt to write outside buffer bounds");
        }
        if (!encoding) encoding = "utf8";
        let loweredCase = false;
        for (; ; ) {
          switch (encoding) {
            case "hex":
              return hexWrite(this, string, offset, length);
            case "utf8":
            case "utf-8":
              return utf8Write(this, string, offset, length);
            case "ascii":
            case "latin1":
            case "binary":
              return asciiWrite(this, string, offset, length);
            case "base64":
              return base64Write(this, string, offset, length);
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
              return ucs2Write(this, string, offset, length);
            default:
              if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
              encoding = ("" + encoding).toLowerCase();
              loweredCase = true;
          }
        }
      };
      Buffer4.prototype.toJSON = function toJSON() {
        return {
          type: "Buffer",
          data: Array.prototype.slice.call(this._arr || this, 0)
        };
      };
      function base64Slice(buf, start, end) {
        if (start === 0 && end === buf.length) {
          return base64.fromByteArray(buf);
        } else {
          return base64.fromByteArray(buf.slice(start, end));
        }
      }
      function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        const res = [];
        let i = start;
        while (i < end) {
          const firstByte = buf[i];
          let codePoint = null;
          let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
          if (i + bytesPerSequence <= end) {
            let secondByte, thirdByte, fourthByte, tempCodePoint;
            switch (bytesPerSequence) {
              case 1:
                if (firstByte < 128) {
                  codePoint = firstByte;
                }
                break;
              case 2:
                secondByte = buf[i + 1];
                if ((secondByte & 192) === 128) {
                  tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                  if (tempCodePoint > 127) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 3:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                  if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                    codePoint = tempCodePoint;
                  }
                }
                break;
              case 4:
                secondByte = buf[i + 1];
                thirdByte = buf[i + 2];
                fourthByte = buf[i + 3];
                if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                  tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                  if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                    codePoint = tempCodePoint;
                  }
                }
            }
          }
          if (codePoint === null) {
            codePoint = 65533;
            bytesPerSequence = 1;
          } else if (codePoint > 65535) {
            codePoint -= 65536;
            res.push(codePoint >>> 10 & 1023 | 55296);
            codePoint = 56320 | codePoint & 1023;
          }
          res.push(codePoint);
          i += bytesPerSequence;
        }
        return decodeCodePointsArray(res);
      }
      var MAX_ARGUMENTS_LENGTH = 4096;
      function decodeCodePointsArray(codePoints) {
        const len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) {
          return String.fromCharCode.apply(String, codePoints);
        }
        let res = "";
        let i = 0;
        while (i < len) {
          res += String.fromCharCode.apply(
            String,
            codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
          );
        }
        return res;
      }
      function asciiSlice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i] & 127);
        }
        return ret;
      }
      function latin1Slice(buf, start, end) {
        let ret = "";
        end = Math.min(buf.length, end);
        for (let i = start; i < end; ++i) {
          ret += String.fromCharCode(buf[i]);
        }
        return ret;
      }
      function hexSlice(buf, start, end) {
        const len = buf.length;
        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;
        let out = "";
        for (let i = start; i < end; ++i) {
          out += hexSliceLookupTable[buf[i]];
        }
        return out;
      }
      function utf16leSlice(buf, start, end) {
        const bytes = buf.slice(start, end);
        let res = "";
        for (let i = 0; i < bytes.length - 1; i += 2) {
          res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
        }
        return res;
      }
      Buffer4.prototype.slice = function slice(start, end) {
        const len = this.length;
        start = ~~start;
        end = end === void 0 ? len : ~~end;
        if (start < 0) {
          start += len;
          if (start < 0) start = 0;
        } else if (start > len) {
          start = len;
        }
        if (end < 0) {
          end += len;
          if (end < 0) end = 0;
        } else if (end > len) {
          end = len;
        }
        if (end < start) end = start;
        const newBuf = this.subarray(start, end);
        Object.setPrototypeOf(newBuf, Buffer4.prototype);
        return newBuf;
      };
      function checkOffset(offset, ext, length) {
        if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
      }
      Buffer4.prototype.readUintLE = Buffer4.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        return val;
      };
      Buffer4.prototype.readUintBE = Buffer4.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          checkOffset(offset, byteLength2, this.length);
        }
        let val = this[offset + --byteLength2];
        let mul = 1;
        while (byteLength2 > 0 && (mul *= 256)) {
          val += this[offset + --byteLength2] * mul;
        }
        return val;
      };
      Buffer4.prototype.readUint8 = Buffer4.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        return this[offset];
      };
      Buffer4.prototype.readUint16LE = Buffer4.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] | this[offset + 1] << 8;
      };
      Buffer4.prototype.readUint16BE = Buffer4.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] << 8 | this[offset + 1];
      };
      Buffer4.prototype.readUint32LE = Buffer4.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
      };
      Buffer4.prototype.readUint32BE = Buffer4.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
      };
      Buffer4.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const lo = first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
        const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
        return BigInt(lo) + (BigInt(hi) << BigInt(32));
      });
      Buffer4.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const hi = first * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
        return (BigInt(hi) << BigInt(32)) + BigInt(lo);
      });
      Buffer4.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let val = this[offset];
        let mul = 1;
        let i = 0;
        while (++i < byteLength2 && (mul *= 256)) {
          val += this[offset + i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer4.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) checkOffset(offset, byteLength2, this.length);
        let i = byteLength2;
        let mul = 1;
        let val = this[offset + --i];
        while (i > 0 && (mul *= 256)) {
          val += this[offset + --i] * mul;
        }
        mul *= 128;
        if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
        return val;
      };
      Buffer4.prototype.readInt8 = function readInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        if (!(this[offset] & 128)) return this[offset];
        return (255 - this[offset] + 1) * -1;
      };
      Buffer4.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset] | this[offset + 1] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer4.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        const val = this[offset + 1] | this[offset] << 8;
        return val & 32768 ? val | 4294901760 : val;
      };
      Buffer4.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
      };
      Buffer4.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
      };
      Buffer4.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
        return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
      });
      Buffer4.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, "offset");
        const first = this[offset];
        const last = this[offset + 7];
        if (first === void 0 || last === void 0) {
          boundsError(offset, this.length - 8);
        }
        const val = (first << 24) + // Overflow
        this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
        return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
      });
      Buffer4.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, true, 23, 4);
      };
      Buffer4.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, false, 23, 4);
      };
      Buffer4.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, true, 52, 8);
      };
      Buffer4.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, false, 52, 8);
      };
      function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer4.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
        if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
      }
      Buffer4.prototype.writeUintLE = Buffer4.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let mul = 1;
        let i = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer4.prototype.writeUintBE = Buffer4.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength2 = byteLength2 >>> 0;
        if (!noAssert) {
          const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
          checkInt(this, value, offset, byteLength2, maxBytes, 0);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          this[offset + i] = value / mul & 255;
        }
        return offset + byteLength2;
      };
      Buffer4.prototype.writeUint8 = Buffer4.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer4.prototype.writeUint16LE = Buffer4.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer4.prototype.writeUint16BE = Buffer4.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer4.prototype.writeUint32LE = Buffer4.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset + 3] = value >>> 24;
        this[offset + 2] = value >>> 16;
        this[offset + 1] = value >>> 8;
        this[offset] = value & 255;
        return offset + 4;
      };
      Buffer4.prototype.writeUint32BE = Buffer4.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      function wrtBigUInt64LE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        lo = lo >> 8;
        buf[offset++] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        hi = hi >> 8;
        buf[offset++] = hi;
        return offset;
      }
      function wrtBigUInt64BE(buf, value, offset, min, max) {
        checkIntBI(value, min, max, buf, offset, 7);
        let lo = Number(value & BigInt(4294967295));
        buf[offset + 7] = lo;
        lo = lo >> 8;
        buf[offset + 6] = lo;
        lo = lo >> 8;
        buf[offset + 5] = lo;
        lo = lo >> 8;
        buf[offset + 4] = lo;
        let hi = Number(value >> BigInt(32) & BigInt(4294967295));
        buf[offset + 3] = hi;
        hi = hi >> 8;
        buf[offset + 2] = hi;
        hi = hi >> 8;
        buf[offset + 1] = hi;
        hi = hi >> 8;
        buf[offset] = hi;
        return offset + 8;
      }
      Buffer4.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer4.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
      });
      Buffer4.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = 0;
        let mul = 1;
        let sub = 0;
        this[offset] = value & 255;
        while (++i < byteLength2 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer4.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          const limit = Math.pow(2, 8 * byteLength2 - 1);
          checkInt(this, value, offset, byteLength2, limit - 1, -limit);
        }
        let i = byteLength2 - 1;
        let mul = 1;
        let sub = 0;
        this[offset + i] = value & 255;
        while (--i >= 0 && (mul *= 256)) {
          if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
            sub = 1;
          }
          this[offset + i] = (value / mul >> 0) - sub & 255;
        }
        return offset + byteLength2;
      };
      Buffer4.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
        if (value < 0) value = 255 + value + 1;
        this[offset] = value & 255;
        return offset + 1;
      };
      Buffer4.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        return offset + 2;
      };
      Buffer4.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
        this[offset] = value >>> 8;
        this[offset + 1] = value & 255;
        return offset + 2;
      };
      Buffer4.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        this[offset] = value & 255;
        this[offset + 1] = value >>> 8;
        this[offset + 2] = value >>> 16;
        this[offset + 3] = value >>> 24;
        return offset + 4;
      };
      Buffer4.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
        if (value < 0) value = 4294967295 + value + 1;
        this[offset] = value >>> 24;
        this[offset + 1] = value >>> 16;
        this[offset + 2] = value >>> 8;
        this[offset + 3] = value & 255;
        return offset + 4;
      };
      Buffer4.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      Buffer4.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
      });
      function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
      }
      function writeFloat(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
        }
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
      }
      Buffer4.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
      };
      Buffer4.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
      };
      function writeDouble(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
          checkIEEE754(buf, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
        }
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
      }
      Buffer4.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
      };
      Buffer4.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
      };
      Buffer4.prototype.copy = function copy(target, targetStart, start, end) {
        if (!Buffer4.isBuffer(target)) throw new TypeError("argument should be a Buffer");
        if (!start) start = 0;
        if (!end && end !== 0) end = this.length;
        if (targetStart >= target.length) targetStart = target.length;
        if (!targetStart) targetStart = 0;
        if (end > 0 && end < start) end = start;
        if (end === start) return 0;
        if (target.length === 0 || this.length === 0) return 0;
        if (targetStart < 0) {
          throw new RangeError("targetStart out of bounds");
        }
        if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");
        if (end > this.length) end = this.length;
        if (target.length - targetStart < end - start) {
          end = target.length - targetStart + start;
        }
        const len = end - start;
        if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
          this.copyWithin(targetStart, start, end);
        } else {
          Uint8Array.prototype.set.call(
            target,
            this.subarray(start, end),
            targetStart
          );
        }
        return len;
      };
      Buffer4.prototype.fill = function fill(val, start, end, encoding) {
        if (typeof val === "string") {
          if (typeof start === "string") {
            encoding = start;
            start = 0;
            end = this.length;
          } else if (typeof end === "string") {
            encoding = end;
            end = this.length;
          }
          if (encoding !== void 0 && typeof encoding !== "string") {
            throw new TypeError("encoding must be a string");
          }
          if (typeof encoding === "string" && !Buffer4.isEncoding(encoding)) {
            throw new TypeError("Unknown encoding: " + encoding);
          }
          if (val.length === 1) {
            const code = val.charCodeAt(0);
            if (encoding === "utf8" && code < 128 || encoding === "latin1") {
              val = code;
            }
          }
        } else if (typeof val === "number") {
          val = val & 255;
        } else if (typeof val === "boolean") {
          val = Number(val);
        }
        if (start < 0 || this.length < start || this.length < end) {
          throw new RangeError("Out of range index");
        }
        if (end <= start) {
          return this;
        }
        start = start >>> 0;
        end = end === void 0 ? this.length : end >>> 0;
        if (!val) val = 0;
        let i;
        if (typeof val === "number") {
          for (i = start; i < end; ++i) {
            this[i] = val;
          }
        } else {
          const bytes = Buffer4.isBuffer(val) ? val : Buffer4.from(val, encoding);
          const len = bytes.length;
          if (len === 0) {
            throw new TypeError('The value "' + val + '" is invalid for argument "value"');
          }
          for (i = 0; i < end - start; ++i) {
            this[i + start] = bytes[i % len];
          }
        }
        return this;
      };
      var errors = {};
      function E(sym, getMessage, Base) {
        errors[sym] = class NodeError extends Base {
          constructor() {
            super();
            Object.defineProperty(this, "message", {
              value: getMessage.apply(this, arguments),
              writable: true,
              configurable: true
            });
            this.name = `${this.name} [${sym}]`;
            this.stack;
            delete this.name;
          }
          get code() {
            return sym;
          }
          set code(value) {
            Object.defineProperty(this, "code", {
              configurable: true,
              enumerable: true,
              value,
              writable: true
            });
          }
          toString() {
            return `${this.name} [${sym}]: ${this.message}`;
          }
        };
      }
      E(
        "ERR_BUFFER_OUT_OF_BOUNDS",
        function(name) {
          if (name) {
            return `${name} is outside of buffer bounds`;
          }
          return "Attempt to access memory outside buffer bounds";
        },
        RangeError
      );
      E(
        "ERR_INVALID_ARG_TYPE",
        function(name, actual) {
          return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
        },
        TypeError
      );
      E(
        "ERR_OUT_OF_RANGE",
        function(str, range, input) {
          let msg = `The value of "${str}" is out of range.`;
          let received = input;
          if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
            received = addNumericalSeparator(String(input));
          } else if (typeof input === "bigint") {
            received = String(input);
            if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
              received = addNumericalSeparator(received);
            }
            received += "n";
          }
          msg += ` It must be ${range}. Received ${received}`;
          return msg;
        },
        RangeError
      );
      function addNumericalSeparator(val) {
        let res = "";
        let i = val.length;
        const start = val[0] === "-" ? 1 : 0;
        for (; i >= start + 4; i -= 3) {
          res = `_${val.slice(i - 3, i)}${res}`;
        }
        return `${val.slice(0, i)}${res}`;
      }
      function checkBounds(buf, offset, byteLength2) {
        validateNumber(offset, "offset");
        if (buf[offset] === void 0 || buf[offset + byteLength2] === void 0) {
          boundsError(offset, buf.length - (byteLength2 + 1));
        }
      }
      function checkIntBI(value, min, max, buf, offset, byteLength2) {
        if (value > max || value < min) {
          const n = typeof min === "bigint" ? "n" : "";
          let range;
          if (byteLength2 > 3) {
            if (min === 0 || min === BigInt(0)) {
              range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
            } else {
              range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
            }
          } else {
            range = `>= ${min}${n} and <= ${max}${n}`;
          }
          throw new errors.ERR_OUT_OF_RANGE("value", range, value);
        }
        checkBounds(buf, offset, byteLength2);
      }
      function validateNumber(value, name) {
        if (typeof value !== "number") {
          throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
        }
      }
      function boundsError(value, length, type) {
        if (Math.floor(value) !== value) {
          validateNumber(value, type);
          throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
        }
        if (length < 0) {
          throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
        }
        throw new errors.ERR_OUT_OF_RANGE(
          type || "offset",
          `>= ${type ? 1 : 0} and <= ${length}`,
          value
        );
      }
      var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
      function base64clean(str) {
        str = str.split("=")[0];
        str = str.trim().replace(INVALID_BASE64_RE, "");
        if (str.length < 2) return "";
        while (str.length % 4 !== 0) {
          str = str + "=";
        }
        return str;
      }
      function utf8ToBytes(string, units) {
        units = units || Infinity;
        let codePoint;
        const length = string.length;
        let leadSurrogate = null;
        const bytes = [];
        for (let i = 0; i < length; ++i) {
          codePoint = string.charCodeAt(i);
          if (codePoint > 55295 && codePoint < 57344) {
            if (!leadSurrogate) {
              if (codePoint > 56319) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              } else if (i + 1 === length) {
                if ((units -= 3) > -1) bytes.push(239, 191, 189);
                continue;
              }
              leadSurrogate = codePoint;
              continue;
            }
            if (codePoint < 56320) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              leadSurrogate = codePoint;
              continue;
            }
            codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
          } else if (leadSurrogate) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
          }
          leadSurrogate = null;
          if (codePoint < 128) {
            if ((units -= 1) < 0) break;
            bytes.push(codePoint);
          } else if (codePoint < 2048) {
            if ((units -= 2) < 0) break;
            bytes.push(
              codePoint >> 6 | 192,
              codePoint & 63 | 128
            );
          } else if (codePoint < 65536) {
            if ((units -= 3) < 0) break;
            bytes.push(
              codePoint >> 12 | 224,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else if (codePoint < 1114112) {
            if ((units -= 4) < 0) break;
            bytes.push(
              codePoint >> 18 | 240,
              codePoint >> 12 & 63 | 128,
              codePoint >> 6 & 63 | 128,
              codePoint & 63 | 128
            );
          } else {
            throw new Error("Invalid code point");
          }
        }
        return bytes;
      }
      function asciiToBytes(str) {
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          byteArray.push(str.charCodeAt(i) & 255);
        }
        return byteArray;
      }
      function utf16leToBytes(str, units) {
        let c, hi, lo;
        const byteArray = [];
        for (let i = 0; i < str.length; ++i) {
          if ((units -= 2) < 0) break;
          c = str.charCodeAt(i);
          hi = c >> 8;
          lo = c % 256;
          byteArray.push(lo);
          byteArray.push(hi);
        }
        return byteArray;
      }
      function base64ToBytes(str) {
        return base64.toByteArray(base64clean(str));
      }
      function blitBuffer(src, dst, offset, length) {
        let i;
        for (i = 0; i < length; ++i) {
          if (i + offset >= dst.length || i >= src.length) break;
          dst[i + offset] = src[i];
        }
        return i;
      }
      function isInstance(obj, type) {
        return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
      }
      function numberIsNaN(obj) {
        return obj !== obj;
      }
      var hexSliceLookupTable = function() {
        const alphabet = "0123456789abcdef";
        const table = new Array(256);
        for (let i = 0; i < 16; ++i) {
          const i16 = i * 16;
          for (let j = 0; j < 16; ++j) {
            table[i16 + j] = alphabet[i] + alphabet[j];
          }
        }
        return table;
      }();
      function defineBigIntMethod(fn) {
        return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
      }
      function BufferBigIntNotDefined() {
        throw new Error("BigInt not supported");
      }
    }
  });

  // ../../node_modules/pako/lib/utils/common.js
  var require_common = __commonJS({
    "../../node_modules/pako/lib/utils/common.js"(exports) {
      "use strict";
      var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
      function _has(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
      }
      exports.assign = function(obj) {
        var sources = Array.prototype.slice.call(arguments, 1);
        while (sources.length) {
          var source = sources.shift();
          if (!source) {
            continue;
          }
          if (typeof source !== "object") {
            throw new TypeError(source + "must be non-object");
          }
          for (var p in source) {
            if (_has(source, p)) {
              obj[p] = source[p];
            }
          }
        }
        return obj;
      };
      exports.shrinkBuf = function(buf, size) {
        if (buf.length === size) {
          return buf;
        }
        if (buf.subarray) {
          return buf.subarray(0, size);
        }
        buf.length = size;
        return buf;
      };
      var fnTyped = {
        arraySet: function(dest, src, src_offs, len, dest_offs) {
          if (src.subarray && dest.subarray) {
            dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
            return;
          }
          for (var i = 0; i < len; i++) {
            dest[dest_offs + i] = src[src_offs + i];
          }
        },
        // Join array of chunks to single array.
        flattenChunks: function(chunks) {
          var i, l, len, pos, chunk, result;
          len = 0;
          for (i = 0, l = chunks.length; i < l; i++) {
            len += chunks[i].length;
          }
          result = new Uint8Array(len);
          pos = 0;
          for (i = 0, l = chunks.length; i < l; i++) {
            chunk = chunks[i];
            result.set(chunk, pos);
            pos += chunk.length;
          }
          return result;
        }
      };
      var fnUntyped = {
        arraySet: function(dest, src, src_offs, len, dest_offs) {
          for (var i = 0; i < len; i++) {
            dest[dest_offs + i] = src[src_offs + i];
          }
        },
        // Join array of chunks to single array.
        flattenChunks: function(chunks) {
          return [].concat.apply([], chunks);
        }
      };
      exports.setTyped = function(on) {
        if (on) {
          exports.Buf8 = Uint8Array;
          exports.Buf16 = Uint16Array;
          exports.Buf32 = Int32Array;
          exports.assign(exports, fnTyped);
        } else {
          exports.Buf8 = Array;
          exports.Buf16 = Array;
          exports.Buf32 = Array;
          exports.assign(exports, fnUntyped);
        }
      };
      exports.setTyped(TYPED_OK);
    }
  });

  // ../../node_modules/pako/lib/zlib/trees.js
  var require_trees = __commonJS({
    "../../node_modules/pako/lib/zlib/trees.js"(exports) {
      "use strict";
      var utils = require_common();
      var Z_FIXED = 4;
      var Z_BINARY = 0;
      var Z_TEXT = 1;
      var Z_UNKNOWN = 2;
      function zero(buf) {
        var len = buf.length;
        while (--len >= 0) {
          buf[len] = 0;
        }
      }
      var STORED_BLOCK = 0;
      var STATIC_TREES = 1;
      var DYN_TREES = 2;
      var MIN_MATCH = 3;
      var MAX_MATCH = 258;
      var LENGTH_CODES = 29;
      var LITERALS = 256;
      var L_CODES = LITERALS + 1 + LENGTH_CODES;
      var D_CODES = 30;
      var BL_CODES = 19;
      var HEAP_SIZE = 2 * L_CODES + 1;
      var MAX_BITS = 15;
      var Buf_size = 16;
      var MAX_BL_BITS = 7;
      var END_BLOCK = 256;
      var REP_3_6 = 16;
      var REPZ_3_10 = 17;
      var REPZ_11_138 = 18;
      var extra_lbits = (
        /* extra bits for each length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
      );
      var extra_dbits = (
        /* extra bits for each distance code */
        [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
      );
      var extra_blbits = (
        /* extra bits for each bit length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
      );
      var bl_order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
      var DIST_CODE_LEN = 512;
      var static_ltree = new Array((L_CODES + 2) * 2);
      zero(static_ltree);
      var static_dtree = new Array(D_CODES * 2);
      zero(static_dtree);
      var _dist_code = new Array(DIST_CODE_LEN);
      zero(_dist_code);
      var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
      zero(_length_code);
      var base_length = new Array(LENGTH_CODES);
      zero(base_length);
      var base_dist = new Array(D_CODES);
      zero(base_dist);
      function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
        this.static_tree = static_tree;
        this.extra_bits = extra_bits;
        this.extra_base = extra_base;
        this.elems = elems;
        this.max_length = max_length;
        this.has_stree = static_tree && static_tree.length;
      }
      var static_l_desc;
      var static_d_desc;
      var static_bl_desc;
      function TreeDesc(dyn_tree, stat_desc) {
        this.dyn_tree = dyn_tree;
        this.max_code = 0;
        this.stat_desc = stat_desc;
      }
      function d_code(dist) {
        return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
      }
      function put_short(s, w) {
        s.pending_buf[s.pending++] = w & 255;
        s.pending_buf[s.pending++] = w >>> 8 & 255;
      }
      function send_bits(s, value, length) {
        if (s.bi_valid > Buf_size - length) {
          s.bi_buf |= value << s.bi_valid & 65535;
          put_short(s, s.bi_buf);
          s.bi_buf = value >> Buf_size - s.bi_valid;
          s.bi_valid += length - Buf_size;
        } else {
          s.bi_buf |= value << s.bi_valid & 65535;
          s.bi_valid += length;
        }
      }
      function send_code(s, c, tree) {
        send_bits(
          s,
          tree[c * 2],
          tree[c * 2 + 1]
          /*.Len*/
        );
      }
      function bi_reverse(code, len) {
        var res = 0;
        do {
          res |= code & 1;
          code >>>= 1;
          res <<= 1;
        } while (--len > 0);
        return res >>> 1;
      }
      function bi_flush(s) {
        if (s.bi_valid === 16) {
          put_short(s, s.bi_buf);
          s.bi_buf = 0;
          s.bi_valid = 0;
        } else if (s.bi_valid >= 8) {
          s.pending_buf[s.pending++] = s.bi_buf & 255;
          s.bi_buf >>= 8;
          s.bi_valid -= 8;
        }
      }
      function gen_bitlen(s, desc) {
        var tree = desc.dyn_tree;
        var max_code = desc.max_code;
        var stree = desc.stat_desc.static_tree;
        var has_stree = desc.stat_desc.has_stree;
        var extra = desc.stat_desc.extra_bits;
        var base2 = desc.stat_desc.extra_base;
        var max_length = desc.stat_desc.max_length;
        var h;
        var n, m;
        var bits;
        var xbits;
        var f;
        var overflow = 0;
        for (bits = 0; bits <= MAX_BITS; bits++) {
          s.bl_count[bits] = 0;
        }
        tree[s.heap[s.heap_max] * 2 + 1] = 0;
        for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
          n = s.heap[h];
          bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
          if (bits > max_length) {
            bits = max_length;
            overflow++;
          }
          tree[n * 2 + 1] = bits;
          if (n > max_code) {
            continue;
          }
          s.bl_count[bits]++;
          xbits = 0;
          if (n >= base2) {
            xbits = extra[n - base2];
          }
          f = tree[n * 2];
          s.opt_len += f * (bits + xbits);
          if (has_stree) {
            s.static_len += f * (stree[n * 2 + 1] + xbits);
          }
        }
        if (overflow === 0) {
          return;
        }
        do {
          bits = max_length - 1;
          while (s.bl_count[bits] === 0) {
            bits--;
          }
          s.bl_count[bits]--;
          s.bl_count[bits + 1] += 2;
          s.bl_count[max_length]--;
          overflow -= 2;
        } while (overflow > 0);
        for (bits = max_length; bits !== 0; bits--) {
          n = s.bl_count[bits];
          while (n !== 0) {
            m = s.heap[--h];
            if (m > max_code) {
              continue;
            }
            if (tree[m * 2 + 1] !== bits) {
              s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
              tree[m * 2 + 1] = bits;
            }
            n--;
          }
        }
      }
      function gen_codes(tree, max_code, bl_count) {
        var next_code = new Array(MAX_BITS + 1);
        var code = 0;
        var bits;
        var n;
        for (bits = 1; bits <= MAX_BITS; bits++) {
          next_code[bits] = code = code + bl_count[bits - 1] << 1;
        }
        for (n = 0; n <= max_code; n++) {
          var len = tree[n * 2 + 1];
          if (len === 0) {
            continue;
          }
          tree[n * 2] = bi_reverse(next_code[len]++, len);
        }
      }
      function tr_static_init() {
        var n;
        var bits;
        var length;
        var code;
        var dist;
        var bl_count = new Array(MAX_BITS + 1);
        length = 0;
        for (code = 0; code < LENGTH_CODES - 1; code++) {
          base_length[code] = length;
          for (n = 0; n < 1 << extra_lbits[code]; n++) {
            _length_code[length++] = code;
          }
        }
        _length_code[length - 1] = code;
        dist = 0;
        for (code = 0; code < 16; code++) {
          base_dist[code] = dist;
          for (n = 0; n < 1 << extra_dbits[code]; n++) {
            _dist_code[dist++] = code;
          }
        }
        dist >>= 7;
        for (; code < D_CODES; code++) {
          base_dist[code] = dist << 7;
          for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
            _dist_code[256 + dist++] = code;
          }
        }
        for (bits = 0; bits <= MAX_BITS; bits++) {
          bl_count[bits] = 0;
        }
        n = 0;
        while (n <= 143) {
          static_ltree[n * 2 + 1] = 8;
          n++;
          bl_count[8]++;
        }
        while (n <= 255) {
          static_ltree[n * 2 + 1] = 9;
          n++;
          bl_count[9]++;
        }
        while (n <= 279) {
          static_ltree[n * 2 + 1] = 7;
          n++;
          bl_count[7]++;
        }
        while (n <= 287) {
          static_ltree[n * 2 + 1] = 8;
          n++;
          bl_count[8]++;
        }
        gen_codes(static_ltree, L_CODES + 1, bl_count);
        for (n = 0; n < D_CODES; n++) {
          static_dtree[n * 2 + 1] = 5;
          static_dtree[n * 2] = bi_reverse(n, 5);
        }
        static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
        static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
        static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
      }
      function init_block(s) {
        var n;
        for (n = 0; n < L_CODES; n++) {
          s.dyn_ltree[n * 2] = 0;
        }
        for (n = 0; n < D_CODES; n++) {
          s.dyn_dtree[n * 2] = 0;
        }
        for (n = 0; n < BL_CODES; n++) {
          s.bl_tree[n * 2] = 0;
        }
        s.dyn_ltree[END_BLOCK * 2] = 1;
        s.opt_len = s.static_len = 0;
        s.last_lit = s.matches = 0;
      }
      function bi_windup(s) {
        if (s.bi_valid > 8) {
          put_short(s, s.bi_buf);
        } else if (s.bi_valid > 0) {
          s.pending_buf[s.pending++] = s.bi_buf;
        }
        s.bi_buf = 0;
        s.bi_valid = 0;
      }
      function copy_block(s, buf, len, header) {
        bi_windup(s);
        if (header) {
          put_short(s, len);
          put_short(s, ~len);
        }
        utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
        s.pending += len;
      }
      function smaller(tree, n, m, depth) {
        var _n2 = n * 2;
        var _m2 = m * 2;
        return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
      }
      function pqdownheap(s, tree, k) {
        var v = s.heap[k];
        var j = k << 1;
        while (j <= s.heap_len) {
          if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
            j++;
          }
          if (smaller(tree, v, s.heap[j], s.depth)) {
            break;
          }
          s.heap[k] = s.heap[j];
          k = j;
          j <<= 1;
        }
        s.heap[k] = v;
      }
      function compress_block(s, ltree, dtree) {
        var dist;
        var lc;
        var lx = 0;
        var code;
        var extra;
        if (s.last_lit !== 0) {
          do {
            dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
            lc = s.pending_buf[s.l_buf + lx];
            lx++;
            if (dist === 0) {
              send_code(s, lc, ltree);
            } else {
              code = _length_code[lc];
              send_code(s, code + LITERALS + 1, ltree);
              extra = extra_lbits[code];
              if (extra !== 0) {
                lc -= base_length[code];
                send_bits(s, lc, extra);
              }
              dist--;
              code = d_code(dist);
              send_code(s, code, dtree);
              extra = extra_dbits[code];
              if (extra !== 0) {
                dist -= base_dist[code];
                send_bits(s, dist, extra);
              }
            }
          } while (lx < s.last_lit);
        }
        send_code(s, END_BLOCK, ltree);
      }
      function build_tree(s, desc) {
        var tree = desc.dyn_tree;
        var stree = desc.stat_desc.static_tree;
        var has_stree = desc.stat_desc.has_stree;
        var elems = desc.stat_desc.elems;
        var n, m;
        var max_code = -1;
        var node;
        s.heap_len = 0;
        s.heap_max = HEAP_SIZE;
        for (n = 0; n < elems; n++) {
          if (tree[n * 2] !== 0) {
            s.heap[++s.heap_len] = max_code = n;
            s.depth[n] = 0;
          } else {
            tree[n * 2 + 1] = 0;
          }
        }
        while (s.heap_len < 2) {
          node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
          tree[node * 2] = 1;
          s.depth[node] = 0;
          s.opt_len--;
          if (has_stree) {
            s.static_len -= stree[node * 2 + 1];
          }
        }
        desc.max_code = max_code;
        for (n = s.heap_len >> 1; n >= 1; n--) {
          pqdownheap(s, tree, n);
        }
        node = elems;
        do {
          n = s.heap[
            1
            /*SMALLEST*/
          ];
          s.heap[
            1
            /*SMALLEST*/
          ] = s.heap[s.heap_len--];
          pqdownheap(
            s,
            tree,
            1
            /*SMALLEST*/
          );
          m = s.heap[
            1
            /*SMALLEST*/
          ];
          s.heap[--s.heap_max] = n;
          s.heap[--s.heap_max] = m;
          tree[node * 2] = tree[n * 2] + tree[m * 2];
          s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
          tree[n * 2 + 1] = tree[m * 2 + 1] = node;
          s.heap[
            1
            /*SMALLEST*/
          ] = node++;
          pqdownheap(
            s,
            tree,
            1
            /*SMALLEST*/
          );
        } while (s.heap_len >= 2);
        s.heap[--s.heap_max] = s.heap[
          1
          /*SMALLEST*/
        ];
        gen_bitlen(s, desc);
        gen_codes(tree, max_code, s.bl_count);
      }
      function scan_tree(s, tree, max_code) {
        var n;
        var prevlen = -1;
        var curlen;
        var nextlen = tree[0 * 2 + 1];
        var count = 0;
        var max_count = 7;
        var min_count = 4;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        }
        tree[(max_code + 1) * 2 + 1] = 65535;
        for (n = 0; n <= max_code; n++) {
          curlen = nextlen;
          nextlen = tree[(n + 1) * 2 + 1];
          if (++count < max_count && curlen === nextlen) {
            continue;
          } else if (count < min_count) {
            s.bl_tree[curlen * 2] += count;
          } else if (curlen !== 0) {
            if (curlen !== prevlen) {
              s.bl_tree[curlen * 2]++;
            }
            s.bl_tree[REP_3_6 * 2]++;
          } else if (count <= 10) {
            s.bl_tree[REPZ_3_10 * 2]++;
          } else {
            s.bl_tree[REPZ_11_138 * 2]++;
          }
          count = 0;
          prevlen = curlen;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
          } else {
            max_count = 7;
            min_count = 4;
          }
        }
      }
      function send_tree(s, tree, max_code) {
        var n;
        var prevlen = -1;
        var curlen;
        var nextlen = tree[0 * 2 + 1];
        var count = 0;
        var max_count = 7;
        var min_count = 4;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        }
        for (n = 0; n <= max_code; n++) {
          curlen = nextlen;
          nextlen = tree[(n + 1) * 2 + 1];
          if (++count < max_count && curlen === nextlen) {
            continue;
          } else if (count < min_count) {
            do {
              send_code(s, curlen, s.bl_tree);
            } while (--count !== 0);
          } else if (curlen !== 0) {
            if (curlen !== prevlen) {
              send_code(s, curlen, s.bl_tree);
              count--;
            }
            send_code(s, REP_3_6, s.bl_tree);
            send_bits(s, count - 3, 2);
          } else if (count <= 10) {
            send_code(s, REPZ_3_10, s.bl_tree);
            send_bits(s, count - 3, 3);
          } else {
            send_code(s, REPZ_11_138, s.bl_tree);
            send_bits(s, count - 11, 7);
          }
          count = 0;
          prevlen = curlen;
          if (nextlen === 0) {
            max_count = 138;
            min_count = 3;
          } else if (curlen === nextlen) {
            max_count = 6;
            min_count = 3;
          } else {
            max_count = 7;
            min_count = 4;
          }
        }
      }
      function build_bl_tree(s) {
        var max_blindex;
        scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
        scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
        build_tree(s, s.bl_desc);
        for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {
          if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
            break;
          }
        }
        s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
        return max_blindex;
      }
      function send_all_trees(s, lcodes, dcodes, blcodes) {
        var rank;
        send_bits(s, lcodes - 257, 5);
        send_bits(s, dcodes - 1, 5);
        send_bits(s, blcodes - 4, 4);
        for (rank = 0; rank < blcodes; rank++) {
          send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
        }
        send_tree(s, s.dyn_ltree, lcodes - 1);
        send_tree(s, s.dyn_dtree, dcodes - 1);
      }
      function detect_data_type(s) {
        var black_mask = 4093624447;
        var n;
        for (n = 0; n <= 31; n++, black_mask >>>= 1) {
          if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
            return Z_BINARY;
          }
        }
        if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
          return Z_TEXT;
        }
        for (n = 32; n < LITERALS; n++) {
          if (s.dyn_ltree[n * 2] !== 0) {
            return Z_TEXT;
          }
        }
        return Z_BINARY;
      }
      var static_init_done = false;
      function _tr_init(s) {
        if (!static_init_done) {
          tr_static_init();
          static_init_done = true;
        }
        s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
        s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
        s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
        s.bi_buf = 0;
        s.bi_valid = 0;
        init_block(s);
      }
      function _tr_stored_block(s, buf, stored_len, last) {
        send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
        copy_block(s, buf, stored_len, true);
      }
      function _tr_align(s) {
        send_bits(s, STATIC_TREES << 1, 3);
        send_code(s, END_BLOCK, static_ltree);
        bi_flush(s);
      }
      function _tr_flush_block(s, buf, stored_len, last) {
        var opt_lenb, static_lenb;
        var max_blindex = 0;
        if (s.level > 0) {
          if (s.strm.data_type === Z_UNKNOWN) {
            s.strm.data_type = detect_data_type(s);
          }
          build_tree(s, s.l_desc);
          build_tree(s, s.d_desc);
          max_blindex = build_bl_tree(s);
          opt_lenb = s.opt_len + 3 + 7 >>> 3;
          static_lenb = s.static_len + 3 + 7 >>> 3;
          if (static_lenb <= opt_lenb) {
            opt_lenb = static_lenb;
          }
        } else {
          opt_lenb = static_lenb = stored_len + 5;
        }
        if (stored_len + 4 <= opt_lenb && buf !== -1) {
          _tr_stored_block(s, buf, stored_len, last);
        } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
          send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
          compress_block(s, static_ltree, static_dtree);
        } else {
          send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
          send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
          compress_block(s, s.dyn_ltree, s.dyn_dtree);
        }
        init_block(s);
        if (last) {
          bi_windup(s);
        }
      }
      function _tr_tally(s, dist, lc) {
        s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
        s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
        s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
        s.last_lit++;
        if (dist === 0) {
          s.dyn_ltree[lc * 2]++;
        } else {
          s.matches++;
          dist--;
          s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
          s.dyn_dtree[d_code(dist) * 2]++;
        }
        return s.last_lit === s.lit_bufsize - 1;
      }
      exports._tr_init = _tr_init;
      exports._tr_stored_block = _tr_stored_block;
      exports._tr_flush_block = _tr_flush_block;
      exports._tr_tally = _tr_tally;
      exports._tr_align = _tr_align;
    }
  });

  // ../../node_modules/pako/lib/zlib/adler32.js
  var require_adler32 = __commonJS({
    "../../node_modules/pako/lib/zlib/adler32.js"(exports, module) {
      "use strict";
      function adler32(adler, buf, len, pos) {
        var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
        while (len !== 0) {
          n = len > 2e3 ? 2e3 : len;
          len -= n;
          do {
            s1 = s1 + buf[pos++] | 0;
            s2 = s2 + s1 | 0;
          } while (--n);
          s1 %= 65521;
          s2 %= 65521;
        }
        return s1 | s2 << 16 | 0;
      }
      module.exports = adler32;
    }
  });

  // ../../node_modules/pako/lib/zlib/crc32.js
  var require_crc32 = __commonJS({
    "../../node_modules/pako/lib/zlib/crc32.js"(exports, module) {
      "use strict";
      function makeTable() {
        var c, table = [];
        for (var n = 0; n < 256; n++) {
          c = n;
          for (var k = 0; k < 8; k++) {
            c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
          }
          table[n] = c;
        }
        return table;
      }
      var crcTable = makeTable();
      function crc322(crc, buf, len, pos) {
        var t = crcTable, end = pos + len;
        crc ^= -1;
        for (var i = pos; i < end; i++) {
          crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
        }
        return crc ^ -1;
      }
      module.exports = crc322;
    }
  });

  // ../../node_modules/pako/lib/zlib/messages.js
  var require_messages = __commonJS({
    "../../node_modules/pako/lib/zlib/messages.js"(exports, module) {
      "use strict";
      module.exports = {
        2: "need dictionary",
        /* Z_NEED_DICT       2  */
        1: "stream end",
        /* Z_STREAM_END      1  */
        0: "",
        /* Z_OK              0  */
        "-1": "file error",
        /* Z_ERRNO         (-1) */
        "-2": "stream error",
        /* Z_STREAM_ERROR  (-2) */
        "-3": "data error",
        /* Z_DATA_ERROR    (-3) */
        "-4": "insufficient memory",
        /* Z_MEM_ERROR     (-4) */
        "-5": "buffer error",
        /* Z_BUF_ERROR     (-5) */
        "-6": "incompatible version"
        /* Z_VERSION_ERROR (-6) */
      };
    }
  });

  // ../../node_modules/pako/lib/zlib/deflate.js
  var require_deflate = __commonJS({
    "../../node_modules/pako/lib/zlib/deflate.js"(exports) {
      "use strict";
      var utils = require_common();
      var trees = require_trees();
      var adler32 = require_adler32();
      var crc322 = require_crc32();
      var msg = require_messages();
      var Z_NO_FLUSH = 0;
      var Z_PARTIAL_FLUSH = 1;
      var Z_FULL_FLUSH = 3;
      var Z_FINISH = 4;
      var Z_BLOCK = 5;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_STREAM_ERROR = -2;
      var Z_DATA_ERROR = -3;
      var Z_BUF_ERROR = -5;
      var Z_DEFAULT_COMPRESSION = -1;
      var Z_FILTERED = 1;
      var Z_HUFFMAN_ONLY = 2;
      var Z_RLE = 3;
      var Z_FIXED = 4;
      var Z_DEFAULT_STRATEGY = 0;
      var Z_UNKNOWN = 2;
      var Z_DEFLATED = 8;
      var MAX_MEM_LEVEL = 9;
      var MAX_WBITS = 15;
      var DEF_MEM_LEVEL = 8;
      var LENGTH_CODES = 29;
      var LITERALS = 256;
      var L_CODES = LITERALS + 1 + LENGTH_CODES;
      var D_CODES = 30;
      var BL_CODES = 19;
      var HEAP_SIZE = 2 * L_CODES + 1;
      var MAX_BITS = 15;
      var MIN_MATCH = 3;
      var MAX_MATCH = 258;
      var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
      var PRESET_DICT = 32;
      var INIT_STATE = 42;
      var EXTRA_STATE = 69;
      var NAME_STATE = 73;
      var COMMENT_STATE = 91;
      var HCRC_STATE = 103;
      var BUSY_STATE = 113;
      var FINISH_STATE = 666;
      var BS_NEED_MORE = 1;
      var BS_BLOCK_DONE = 2;
      var BS_FINISH_STARTED = 3;
      var BS_FINISH_DONE = 4;
      var OS_CODE = 3;
      function err(strm, errorCode) {
        strm.msg = msg[errorCode];
        return errorCode;
      }
      function rank(f) {
        return (f << 1) - (f > 4 ? 9 : 0);
      }
      function zero(buf) {
        var len = buf.length;
        while (--len >= 0) {
          buf[len] = 0;
        }
      }
      function flush_pending(strm) {
        var s = strm.state;
        var len = s.pending;
        if (len > strm.avail_out) {
          len = strm.avail_out;
        }
        if (len === 0) {
          return;
        }
        utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
        strm.next_out += len;
        s.pending_out += len;
        strm.total_out += len;
        strm.avail_out -= len;
        s.pending -= len;
        if (s.pending === 0) {
          s.pending_out = 0;
        }
      }
      function flush_block_only(s, last) {
        trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
        s.block_start = s.strstart;
        flush_pending(s.strm);
      }
      function put_byte(s, b) {
        s.pending_buf[s.pending++] = b;
      }
      function putShortMSB(s, b) {
        s.pending_buf[s.pending++] = b >>> 8 & 255;
        s.pending_buf[s.pending++] = b & 255;
      }
      function read_buf(strm, buf, start, size) {
        var len = strm.avail_in;
        if (len > size) {
          len = size;
        }
        if (len === 0) {
          return 0;
        }
        strm.avail_in -= len;
        utils.arraySet(buf, strm.input, strm.next_in, len, start);
        if (strm.state.wrap === 1) {
          strm.adler = adler32(strm.adler, buf, len, start);
        } else if (strm.state.wrap === 2) {
          strm.adler = crc322(strm.adler, buf, len, start);
        }
        strm.next_in += len;
        strm.total_in += len;
        return len;
      }
      function longest_match(s, cur_match) {
        var chain_length = s.max_chain_length;
        var scan = s.strstart;
        var match;
        var len;
        var best_len = s.prev_length;
        var nice_match = s.nice_match;
        var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
        var _win = s.window;
        var wmask = s.w_mask;
        var prev = s.prev;
        var strend = s.strstart + MAX_MATCH;
        var scan_end1 = _win[scan + best_len - 1];
        var scan_end = _win[scan + best_len];
        if (s.prev_length >= s.good_match) {
          chain_length >>= 2;
        }
        if (nice_match > s.lookahead) {
          nice_match = s.lookahead;
        }
        do {
          match = cur_match;
          if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
            continue;
          }
          scan += 2;
          match++;
          do {
          } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
          len = MAX_MATCH - (strend - scan);
          scan = strend - MAX_MATCH;
          if (len > best_len) {
            s.match_start = cur_match;
            best_len = len;
            if (len >= nice_match) {
              break;
            }
            scan_end1 = _win[scan + best_len - 1];
            scan_end = _win[scan + best_len];
          }
        } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
        if (best_len <= s.lookahead) {
          return best_len;
        }
        return s.lookahead;
      }
      function fill_window(s) {
        var _w_size = s.w_size;
        var p, n, m, more, str;
        do {
          more = s.window_size - s.lookahead - s.strstart;
          if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
            utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
            s.match_start -= _w_size;
            s.strstart -= _w_size;
            s.block_start -= _w_size;
            n = s.hash_size;
            p = n;
            do {
              m = s.head[--p];
              s.head[p] = m >= _w_size ? m - _w_size : 0;
            } while (--n);
            n = _w_size;
            p = n;
            do {
              m = s.prev[--p];
              s.prev[p] = m >= _w_size ? m - _w_size : 0;
            } while (--n);
            more += _w_size;
          }
          if (s.strm.avail_in === 0) {
            break;
          }
          n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
          s.lookahead += n;
          if (s.lookahead + s.insert >= MIN_MATCH) {
            str = s.strstart - s.insert;
            s.ins_h = s.window[str];
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
            while (s.insert) {
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
              s.prev[str & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = str;
              str++;
              s.insert--;
              if (s.lookahead + s.insert < MIN_MATCH) {
                break;
              }
            }
          }
        } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
      }
      function deflate_stored(s, flush) {
        var max_block_size = 65535;
        if (max_block_size > s.pending_buf_size - 5) {
          max_block_size = s.pending_buf_size - 5;
        }
        for (; ; ) {
          if (s.lookahead <= 1) {
            fill_window(s);
            if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          s.strstart += s.lookahead;
          s.lookahead = 0;
          var max_start = s.block_start + max_block_size;
          if (s.strstart === 0 || s.strstart >= max_start) {
            s.lookahead = s.strstart - max_start;
            s.strstart = max_start;
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
          if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.strstart > s.block_start) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_NEED_MORE;
      }
      function deflate_fast(s, flush) {
        var hash_head;
        var bflush;
        for (; ; ) {
          if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          hash_head = 0;
          if (s.lookahead >= MIN_MATCH) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
          if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
          }
          if (s.match_length >= MIN_MATCH) {
            bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
              s.match_length--;
              do {
                s.strstart++;
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
              } while (--s.match_length !== 0);
              s.strstart++;
            } else {
              s.strstart += s.match_length;
              s.match_length = 0;
              s.ins_h = s.window[s.strstart];
              s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
            }
          } else {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
          }
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_slow(s, flush) {
        var hash_head;
        var bflush;
        var max_insert;
        for (; ; ) {
          if (s.lookahead < MIN_LOOKAHEAD) {
            fill_window(s);
            if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          hash_head = 0;
          if (s.lookahead >= MIN_MATCH) {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
            hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = s.strstart;
          }
          s.prev_length = s.match_length;
          s.prev_match = s.match_start;
          s.match_length = MIN_MATCH - 1;
          if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
            s.match_length = longest_match(s, hash_head);
            if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
              s.match_length = MIN_MATCH - 1;
            }
          }
          if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
            max_insert = s.strstart + s.lookahead - MIN_MATCH;
            bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
            s.lookahead -= s.prev_length - 1;
            s.prev_length -= 2;
            do {
              if (++s.strstart <= max_insert) {
                s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
                hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
                s.head[s.ins_h] = s.strstart;
              }
            } while (--s.prev_length !== 0);
            s.match_available = 0;
            s.match_length = MIN_MATCH - 1;
            s.strstart++;
            if (bflush) {
              flush_block_only(s, false);
              if (s.strm.avail_out === 0) {
                return BS_NEED_MORE;
              }
            }
          } else if (s.match_available) {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
            if (bflush) {
              flush_block_only(s, false);
            }
            s.strstart++;
            s.lookahead--;
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          } else {
            s.match_available = 1;
            s.strstart++;
            s.lookahead--;
          }
        }
        if (s.match_available) {
          bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
          s.match_available = 0;
        }
        s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_rle(s, flush) {
        var bflush;
        var prev;
        var scan, strend;
        var _win = s.window;
        for (; ; ) {
          if (s.lookahead <= MAX_MATCH) {
            fill_window(s);
            if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
              return BS_NEED_MORE;
            }
            if (s.lookahead === 0) {
              break;
            }
          }
          s.match_length = 0;
          if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
            scan = s.strstart - 1;
            prev = _win[scan];
            if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
              strend = s.strstart + MAX_MATCH;
              do {
              } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
              s.match_length = MAX_MATCH - (strend - scan);
              if (s.match_length > s.lookahead) {
                s.match_length = s.lookahead;
              }
            }
          }
          if (s.match_length >= MIN_MATCH) {
            bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
            s.lookahead -= s.match_length;
            s.strstart += s.match_length;
            s.match_length = 0;
          } else {
            bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
            s.lookahead--;
            s.strstart++;
          }
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function deflate_huff(s, flush) {
        var bflush;
        for (; ; ) {
          if (s.lookahead === 0) {
            fill_window(s);
            if (s.lookahead === 0) {
              if (flush === Z_NO_FLUSH) {
                return BS_NEED_MORE;
              }
              break;
            }
          }
          s.match_length = 0;
          bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        }
        s.insert = 0;
        if (flush === Z_FINISH) {
          flush_block_only(s, true);
          if (s.strm.avail_out === 0) {
            return BS_FINISH_STARTED;
          }
          return BS_FINISH_DONE;
        }
        if (s.last_lit) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
        return BS_BLOCK_DONE;
      }
      function Config(good_length, max_lazy, nice_length, max_chain, func) {
        this.good_length = good_length;
        this.max_lazy = max_lazy;
        this.nice_length = nice_length;
        this.max_chain = max_chain;
        this.func = func;
      }
      var configuration_table;
      configuration_table = [
        /*      good lazy nice chain */
        new Config(0, 0, 0, 0, deflate_stored),
        /* 0 store only */
        new Config(4, 4, 8, 4, deflate_fast),
        /* 1 max speed, no lazy matches */
        new Config(4, 5, 16, 8, deflate_fast),
        /* 2 */
        new Config(4, 6, 32, 32, deflate_fast),
        /* 3 */
        new Config(4, 4, 16, 16, deflate_slow),
        /* 4 lazy matches */
        new Config(8, 16, 32, 32, deflate_slow),
        /* 5 */
        new Config(8, 16, 128, 128, deflate_slow),
        /* 6 */
        new Config(8, 32, 128, 256, deflate_slow),
        /* 7 */
        new Config(32, 128, 258, 1024, deflate_slow),
        /* 8 */
        new Config(32, 258, 258, 4096, deflate_slow)
        /* 9 max compression */
      ];
      function lm_init(s) {
        s.window_size = 2 * s.w_size;
        zero(s.head);
        s.max_lazy_match = configuration_table[s.level].max_lazy;
        s.good_match = configuration_table[s.level].good_length;
        s.nice_match = configuration_table[s.level].nice_length;
        s.max_chain_length = configuration_table[s.level].max_chain;
        s.strstart = 0;
        s.block_start = 0;
        s.lookahead = 0;
        s.insert = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        s.ins_h = 0;
      }
      function DeflateState() {
        this.strm = null;
        this.status = 0;
        this.pending_buf = null;
        this.pending_buf_size = 0;
        this.pending_out = 0;
        this.pending = 0;
        this.wrap = 0;
        this.gzhead = null;
        this.gzindex = 0;
        this.method = Z_DEFLATED;
        this.last_flush = -1;
        this.w_size = 0;
        this.w_bits = 0;
        this.w_mask = 0;
        this.window = null;
        this.window_size = 0;
        this.prev = null;
        this.head = null;
        this.ins_h = 0;
        this.hash_size = 0;
        this.hash_bits = 0;
        this.hash_mask = 0;
        this.hash_shift = 0;
        this.block_start = 0;
        this.match_length = 0;
        this.prev_match = 0;
        this.match_available = 0;
        this.strstart = 0;
        this.match_start = 0;
        this.lookahead = 0;
        this.prev_length = 0;
        this.max_chain_length = 0;
        this.max_lazy_match = 0;
        this.level = 0;
        this.strategy = 0;
        this.good_match = 0;
        this.nice_match = 0;
        this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
        this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
        this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
        zero(this.dyn_ltree);
        zero(this.dyn_dtree);
        zero(this.bl_tree);
        this.l_desc = null;
        this.d_desc = null;
        this.bl_desc = null;
        this.bl_count = new utils.Buf16(MAX_BITS + 1);
        this.heap = new utils.Buf16(2 * L_CODES + 1);
        zero(this.heap);
        this.heap_len = 0;
        this.heap_max = 0;
        this.depth = new utils.Buf16(2 * L_CODES + 1);
        zero(this.depth);
        this.l_buf = 0;
        this.lit_bufsize = 0;
        this.last_lit = 0;
        this.d_buf = 0;
        this.opt_len = 0;
        this.static_len = 0;
        this.matches = 0;
        this.insert = 0;
        this.bi_buf = 0;
        this.bi_valid = 0;
      }
      function deflateResetKeep(strm) {
        var s;
        if (!strm || !strm.state) {
          return err(strm, Z_STREAM_ERROR);
        }
        strm.total_in = strm.total_out = 0;
        strm.data_type = Z_UNKNOWN;
        s = strm.state;
        s.pending = 0;
        s.pending_out = 0;
        if (s.wrap < 0) {
          s.wrap = -s.wrap;
        }
        s.status = s.wrap ? INIT_STATE : BUSY_STATE;
        strm.adler = s.wrap === 2 ? 0 : 1;
        s.last_flush = Z_NO_FLUSH;
        trees._tr_init(s);
        return Z_OK;
      }
      function deflateReset(strm) {
        var ret = deflateResetKeep(strm);
        if (ret === Z_OK) {
          lm_init(strm.state);
        }
        return ret;
      }
      function deflateSetHeader(strm, head) {
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        if (strm.state.wrap !== 2) {
          return Z_STREAM_ERROR;
        }
        strm.state.gzhead = head;
        return Z_OK;
      }
      function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
        if (!strm) {
          return Z_STREAM_ERROR;
        }
        var wrap = 1;
        if (level === Z_DEFAULT_COMPRESSION) {
          level = 6;
        }
        if (windowBits < 0) {
          wrap = 0;
          windowBits = -windowBits;
        } else if (windowBits > 15) {
          wrap = 2;
          windowBits -= 16;
        }
        if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) {
          return err(strm, Z_STREAM_ERROR);
        }
        if (windowBits === 8) {
          windowBits = 9;
        }
        var s = new DeflateState();
        strm.state = s;
        s.strm = strm;
        s.wrap = wrap;
        s.gzhead = null;
        s.w_bits = windowBits;
        s.w_size = 1 << s.w_bits;
        s.w_mask = s.w_size - 1;
        s.hash_bits = memLevel + 7;
        s.hash_size = 1 << s.hash_bits;
        s.hash_mask = s.hash_size - 1;
        s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
        s.window = new utils.Buf8(s.w_size * 2);
        s.head = new utils.Buf16(s.hash_size);
        s.prev = new utils.Buf16(s.w_size);
        s.lit_bufsize = 1 << memLevel + 6;
        s.pending_buf_size = s.lit_bufsize * 4;
        s.pending_buf = new utils.Buf8(s.pending_buf_size);
        s.d_buf = 1 * s.lit_bufsize;
        s.l_buf = (1 + 2) * s.lit_bufsize;
        s.level = level;
        s.strategy = strategy;
        s.method = method;
        return deflateReset(strm);
      }
      function deflateInit(strm, level) {
        return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
      }
      function deflate(strm, flush) {
        var old_flush, s;
        var beg, val;
        if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) {
          return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
        }
        s = strm.state;
        if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) {
          return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
        }
        s.strm = strm;
        old_flush = s.last_flush;
        s.last_flush = flush;
        if (s.status === INIT_STATE) {
          if (s.wrap === 2) {
            strm.adler = 0;
            put_byte(s, 31);
            put_byte(s, 139);
            put_byte(s, 8);
            if (!s.gzhead) {
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, 0);
              put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
              put_byte(s, OS_CODE);
              s.status = BUSY_STATE;
            } else {
              put_byte(
                s,
                (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
              );
              put_byte(s, s.gzhead.time & 255);
              put_byte(s, s.gzhead.time >> 8 & 255);
              put_byte(s, s.gzhead.time >> 16 & 255);
              put_byte(s, s.gzhead.time >> 24 & 255);
              put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
              put_byte(s, s.gzhead.os & 255);
              if (s.gzhead.extra && s.gzhead.extra.length) {
                put_byte(s, s.gzhead.extra.length & 255);
                put_byte(s, s.gzhead.extra.length >> 8 & 255);
              }
              if (s.gzhead.hcrc) {
                strm.adler = crc322(strm.adler, s.pending_buf, s.pending, 0);
              }
              s.gzindex = 0;
              s.status = EXTRA_STATE;
            }
          } else {
            var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
            var level_flags = -1;
            if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
              level_flags = 0;
            } else if (s.level < 6) {
              level_flags = 1;
            } else if (s.level === 6) {
              level_flags = 2;
            } else {
              level_flags = 3;
            }
            header |= level_flags << 6;
            if (s.strstart !== 0) {
              header |= PRESET_DICT;
            }
            header += 31 - header % 31;
            s.status = BUSY_STATE;
            putShortMSB(s, header);
            if (s.strstart !== 0) {
              putShortMSB(s, strm.adler >>> 16);
              putShortMSB(s, strm.adler & 65535);
            }
            strm.adler = 1;
          }
        }
        if (s.status === EXTRA_STATE) {
          if (s.gzhead.extra) {
            beg = s.pending;
            while (s.gzindex < (s.gzhead.extra.length & 65535)) {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  break;
                }
              }
              put_byte(s, s.gzhead.extra[s.gzindex] & 255);
              s.gzindex++;
            }
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (s.gzindex === s.gzhead.extra.length) {
              s.gzindex = 0;
              s.status = NAME_STATE;
            }
          } else {
            s.status = NAME_STATE;
          }
        }
        if (s.status === NAME_STATE) {
          if (s.gzhead.name) {
            beg = s.pending;
            do {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  val = 1;
                  break;
                }
              }
              if (s.gzindex < s.gzhead.name.length) {
                val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
              } else {
                val = 0;
              }
              put_byte(s, val);
            } while (val !== 0);
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (val === 0) {
              s.gzindex = 0;
              s.status = COMMENT_STATE;
            }
          } else {
            s.status = COMMENT_STATE;
          }
        }
        if (s.status === COMMENT_STATE) {
          if (s.gzhead.comment) {
            beg = s.pending;
            do {
              if (s.pending === s.pending_buf_size) {
                if (s.gzhead.hcrc && s.pending > beg) {
                  strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
                }
                flush_pending(strm);
                beg = s.pending;
                if (s.pending === s.pending_buf_size) {
                  val = 1;
                  break;
                }
              }
              if (s.gzindex < s.gzhead.comment.length) {
                val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
              } else {
                val = 0;
              }
              put_byte(s, val);
            } while (val !== 0);
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc322(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            if (val === 0) {
              s.status = HCRC_STATE;
            }
          } else {
            s.status = HCRC_STATE;
          }
        }
        if (s.status === HCRC_STATE) {
          if (s.gzhead.hcrc) {
            if (s.pending + 2 > s.pending_buf_size) {
              flush_pending(strm);
            }
            if (s.pending + 2 <= s.pending_buf_size) {
              put_byte(s, strm.adler & 255);
              put_byte(s, strm.adler >> 8 & 255);
              strm.adler = 0;
              s.status = BUSY_STATE;
            }
          } else {
            s.status = BUSY_STATE;
          }
        }
        if (s.pending !== 0) {
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            return Z_OK;
          }
        } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) {
          return err(strm, Z_BUF_ERROR);
        }
        if (s.status === FINISH_STATE && strm.avail_in !== 0) {
          return err(strm, Z_BUF_ERROR);
        }
        if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
          var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
          if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
            s.status = FINISH_STATE;
          }
          if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
            if (strm.avail_out === 0) {
              s.last_flush = -1;
            }
            return Z_OK;
          }
          if (bstate === BS_BLOCK_DONE) {
            if (flush === Z_PARTIAL_FLUSH) {
              trees._tr_align(s);
            } else if (flush !== Z_BLOCK) {
              trees._tr_stored_block(s, 0, 0, false);
              if (flush === Z_FULL_FLUSH) {
                zero(s.head);
                if (s.lookahead === 0) {
                  s.strstart = 0;
                  s.block_start = 0;
                  s.insert = 0;
                }
              }
            }
            flush_pending(strm);
            if (strm.avail_out === 0) {
              s.last_flush = -1;
              return Z_OK;
            }
          }
        }
        if (flush !== Z_FINISH) {
          return Z_OK;
        }
        if (s.wrap <= 0) {
          return Z_STREAM_END;
        }
        if (s.wrap === 2) {
          put_byte(s, strm.adler & 255);
          put_byte(s, strm.adler >> 8 & 255);
          put_byte(s, strm.adler >> 16 & 255);
          put_byte(s, strm.adler >> 24 & 255);
          put_byte(s, strm.total_in & 255);
          put_byte(s, strm.total_in >> 8 & 255);
          put_byte(s, strm.total_in >> 16 & 255);
          put_byte(s, strm.total_in >> 24 & 255);
        } else {
          putShortMSB(s, strm.adler >>> 16);
          putShortMSB(s, strm.adler & 65535);
        }
        flush_pending(strm);
        if (s.wrap > 0) {
          s.wrap = -s.wrap;
        }
        return s.pending !== 0 ? Z_OK : Z_STREAM_END;
      }
      function deflateEnd(strm) {
        var status;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        status = strm.state.status;
        if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) {
          return err(strm, Z_STREAM_ERROR);
        }
        strm.state = null;
        return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
      }
      function deflateSetDictionary(strm, dictionary) {
        var dictLength = dictionary.length;
        var s;
        var str, n;
        var wrap;
        var avail;
        var next;
        var input;
        var tmpDict;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        s = strm.state;
        wrap = s.wrap;
        if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
          return Z_STREAM_ERROR;
        }
        if (wrap === 1) {
          strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
        }
        s.wrap = 0;
        if (dictLength >= s.w_size) {
          if (wrap === 0) {
            zero(s.head);
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
          tmpDict = new utils.Buf8(s.w_size);
          utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
          dictionary = tmpDict;
          dictLength = s.w_size;
        }
        avail = strm.avail_in;
        next = strm.next_in;
        input = strm.input;
        strm.avail_in = dictLength;
        strm.next_in = 0;
        strm.input = dictionary;
        fill_window(s);
        while (s.lookahead >= MIN_MATCH) {
          str = s.strstart;
          n = s.lookahead - (MIN_MATCH - 1);
          do {
            s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
          } while (--n);
          s.strstart = str;
          s.lookahead = MIN_MATCH - 1;
          fill_window(s);
        }
        s.strstart += s.lookahead;
        s.block_start = s.strstart;
        s.insert = s.lookahead;
        s.lookahead = 0;
        s.match_length = s.prev_length = MIN_MATCH - 1;
        s.match_available = 0;
        strm.next_in = next;
        strm.input = input;
        strm.avail_in = avail;
        s.wrap = wrap;
        return Z_OK;
      }
      exports.deflateInit = deflateInit;
      exports.deflateInit2 = deflateInit2;
      exports.deflateReset = deflateReset;
      exports.deflateResetKeep = deflateResetKeep;
      exports.deflateSetHeader = deflateSetHeader;
      exports.deflate = deflate;
      exports.deflateEnd = deflateEnd;
      exports.deflateSetDictionary = deflateSetDictionary;
      exports.deflateInfo = "pako deflate (from Nodeca project)";
    }
  });

  // ../../node_modules/pako/lib/utils/strings.js
  var require_strings = __commonJS({
    "../../node_modules/pako/lib/utils/strings.js"(exports) {
      "use strict";
      var utils = require_common();
      var STR_APPLY_OK = true;
      var STR_APPLY_UIA_OK = true;
      try {
        String.fromCharCode.apply(null, [0]);
      } catch (__) {
        STR_APPLY_OK = false;
      }
      try {
        String.fromCharCode.apply(null, new Uint8Array(1));
      } catch (__) {
        STR_APPLY_UIA_OK = false;
      }
      var _utf8len = new utils.Buf8(256);
      for (q = 0; q < 256; q++) {
        _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
      }
      var q;
      _utf8len[254] = _utf8len[254] = 1;
      exports.string2buf = function(str) {
        var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
        for (m_pos = 0; m_pos < str_len; m_pos++) {
          c = str.charCodeAt(m_pos);
          if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
            c2 = str.charCodeAt(m_pos + 1);
            if ((c2 & 64512) === 56320) {
              c = 65536 + (c - 55296 << 10) + (c2 - 56320);
              m_pos++;
            }
          }
          buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
        }
        buf = new utils.Buf8(buf_len);
        for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
          c = str.charCodeAt(m_pos);
          if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
            c2 = str.charCodeAt(m_pos + 1);
            if ((c2 & 64512) === 56320) {
              c = 65536 + (c - 55296 << 10) + (c2 - 56320);
              m_pos++;
            }
          }
          if (c < 128) {
            buf[i++] = c;
          } else if (c < 2048) {
            buf[i++] = 192 | c >>> 6;
            buf[i++] = 128 | c & 63;
          } else if (c < 65536) {
            buf[i++] = 224 | c >>> 12;
            buf[i++] = 128 | c >>> 6 & 63;
            buf[i++] = 128 | c & 63;
          } else {
            buf[i++] = 240 | c >>> 18;
            buf[i++] = 128 | c >>> 12 & 63;
            buf[i++] = 128 | c >>> 6 & 63;
            buf[i++] = 128 | c & 63;
          }
        }
        return buf;
      };
      function buf2binstring(buf, len) {
        if (len < 65534) {
          if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) {
            return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
          }
        }
        var result = "";
        for (var i = 0; i < len; i++) {
          result += String.fromCharCode(buf[i]);
        }
        return result;
      }
      exports.buf2binstring = function(buf) {
        return buf2binstring(buf, buf.length);
      };
      exports.binstring2buf = function(str) {
        var buf = new utils.Buf8(str.length);
        for (var i = 0, len = buf.length; i < len; i++) {
          buf[i] = str.charCodeAt(i);
        }
        return buf;
      };
      exports.buf2string = function(buf, max) {
        var i, out, c, c_len;
        var len = max || buf.length;
        var utf16buf = new Array(len * 2);
        for (out = 0, i = 0; i < len; ) {
          c = buf[i++];
          if (c < 128) {
            utf16buf[out++] = c;
            continue;
          }
          c_len = _utf8len[c];
          if (c_len > 4) {
            utf16buf[out++] = 65533;
            i += c_len - 1;
            continue;
          }
          c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
          while (c_len > 1 && i < len) {
            c = c << 6 | buf[i++] & 63;
            c_len--;
          }
          if (c_len > 1) {
            utf16buf[out++] = 65533;
            continue;
          }
          if (c < 65536) {
            utf16buf[out++] = c;
          } else {
            c -= 65536;
            utf16buf[out++] = 55296 | c >> 10 & 1023;
            utf16buf[out++] = 56320 | c & 1023;
          }
        }
        return buf2binstring(utf16buf, out);
      };
      exports.utf8border = function(buf, max) {
        var pos;
        max = max || buf.length;
        if (max > buf.length) {
          max = buf.length;
        }
        pos = max - 1;
        while (pos >= 0 && (buf[pos] & 192) === 128) {
          pos--;
        }
        if (pos < 0) {
          return max;
        }
        if (pos === 0) {
          return max;
        }
        return pos + _utf8len[buf[pos]] > max ? pos : max;
      };
    }
  });

  // ../../node_modules/pako/lib/zlib/zstream.js
  var require_zstream = __commonJS({
    "../../node_modules/pako/lib/zlib/zstream.js"(exports, module) {
      "use strict";
      function ZStream() {
        this.input = null;
        this.next_in = 0;
        this.avail_in = 0;
        this.total_in = 0;
        this.output = null;
        this.next_out = 0;
        this.avail_out = 0;
        this.total_out = 0;
        this.msg = "";
        this.state = null;
        this.data_type = 2;
        this.adler = 0;
      }
      module.exports = ZStream;
    }
  });

  // ../../node_modules/pako/lib/deflate.js
  var require_deflate2 = __commonJS({
    "../../node_modules/pako/lib/deflate.js"(exports) {
      "use strict";
      var zlib_deflate = require_deflate();
      var utils = require_common();
      var strings = require_strings();
      var msg = require_messages();
      var ZStream = require_zstream();
      var toString = Object.prototype.toString;
      var Z_NO_FLUSH = 0;
      var Z_FINISH = 4;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_SYNC_FLUSH = 2;
      var Z_DEFAULT_COMPRESSION = -1;
      var Z_DEFAULT_STRATEGY = 0;
      var Z_DEFLATED = 8;
      function Deflate(options) {
        if (!(this instanceof Deflate)) return new Deflate(options);
        this.options = utils.assign({
          level: Z_DEFAULT_COMPRESSION,
          method: Z_DEFLATED,
          chunkSize: 16384,
          windowBits: 15,
          memLevel: 8,
          strategy: Z_DEFAULT_STRATEGY,
          to: ""
        }, options || {});
        var opt = this.options;
        if (opt.raw && opt.windowBits > 0) {
          opt.windowBits = -opt.windowBits;
        } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
          opt.windowBits += 16;
        }
        this.err = 0;
        this.msg = "";
        this.ended = false;
        this.chunks = [];
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        var status = zlib_deflate.deflateInit2(
          this.strm,
          opt.level,
          opt.method,
          opt.windowBits,
          opt.memLevel,
          opt.strategy
        );
        if (status !== Z_OK) {
          throw new Error(msg[status]);
        }
        if (opt.header) {
          zlib_deflate.deflateSetHeader(this.strm, opt.header);
        }
        if (opt.dictionary) {
          var dict;
          if (typeof opt.dictionary === "string") {
            dict = strings.string2buf(opt.dictionary);
          } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
            dict = new Uint8Array(opt.dictionary);
          } else {
            dict = opt.dictionary;
          }
          status = zlib_deflate.deflateSetDictionary(this.strm, dict);
          if (status !== Z_OK) {
            throw new Error(msg[status]);
          }
          this._dict_set = true;
        }
      }
      Deflate.prototype.push = function(data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var status, _mode;
        if (this.ended) {
          return false;
        }
        _mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
        if (typeof data === "string") {
          strm.input = strings.string2buf(data);
        } else if (toString.call(data) === "[object ArrayBuffer]") {
          strm.input = new Uint8Array(data);
        } else {
          strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        do {
          if (strm.avail_out === 0) {
            strm.output = new utils.Buf8(chunkSize);
            strm.next_out = 0;
            strm.avail_out = chunkSize;
          }
          status = zlib_deflate.deflate(strm, _mode);
          if (status !== Z_STREAM_END && status !== Z_OK) {
            this.onEnd(status);
            this.ended = true;
            return false;
          }
          if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) {
            if (this.options.to === "string") {
              this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
            } else {
              this.onData(utils.shrinkBuf(strm.output, strm.next_out));
            }
          }
        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
        if (_mode === Z_FINISH) {
          status = zlib_deflate.deflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === Z_OK;
        }
        if (_mode === Z_SYNC_FLUSH) {
          this.onEnd(Z_OK);
          strm.avail_out = 0;
          return true;
        }
        return true;
      };
      Deflate.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
      };
      Deflate.prototype.onEnd = function(status) {
        if (status === Z_OK) {
          if (this.options.to === "string") {
            this.result = this.chunks.join("");
          } else {
            this.result = utils.flattenChunks(this.chunks);
          }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
      };
      function deflate(input, options) {
        var deflator = new Deflate(options);
        deflator.push(input, true);
        if (deflator.err) {
          throw deflator.msg || msg[deflator.err];
        }
        return deflator.result;
      }
      function deflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return deflate(input, options);
      }
      function gzip(input, options) {
        options = options || {};
        options.gzip = true;
        return deflate(input, options);
      }
      exports.Deflate = Deflate;
      exports.deflate = deflate;
      exports.deflateRaw = deflateRaw;
      exports.gzip = gzip;
    }
  });

  // ../../node_modules/pako/lib/zlib/inffast.js
  var require_inffast = __commonJS({
    "../../node_modules/pako/lib/zlib/inffast.js"(exports, module) {
      "use strict";
      var BAD = 30;
      var TYPE = 12;
      module.exports = function inflate_fast(strm, start) {
        var state;
        var _in;
        var last;
        var _out;
        var beg;
        var end;
        var dmax;
        var wsize;
        var whave;
        var wnext;
        var s_window;
        var hold;
        var bits;
        var lcode;
        var dcode;
        var lmask;
        var dmask;
        var here;
        var op;
        var len;
        var dist;
        var from;
        var from_source;
        var input, output;
        state = strm.state;
        _in = strm.next_in;
        input = strm.input;
        last = _in + (strm.avail_in - 5);
        _out = strm.next_out;
        output = strm.output;
        beg = _out - (start - strm.avail_out);
        end = _out + (strm.avail_out - 257);
        dmax = state.dmax;
        wsize = state.wsize;
        whave = state.whave;
        wnext = state.wnext;
        s_window = state.window;
        hold = state.hold;
        bits = state.bits;
        lcode = state.lencode;
        dcode = state.distcode;
        lmask = (1 << state.lenbits) - 1;
        dmask = (1 << state.distbits) - 1;
        top:
          do {
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = lcode[hold & lmask];
            dolen:
              for (; ; ) {
                op = here >>> 24;
                hold >>>= op;
                bits -= op;
                op = here >>> 16 & 255;
                if (op === 0) {
                  output[_out++] = here & 65535;
                } else if (op & 16) {
                  len = here & 65535;
                  op &= 15;
                  if (op) {
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                    len += hold & (1 << op) - 1;
                    hold >>>= op;
                    bits -= op;
                  }
                  if (bits < 15) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  here = dcode[hold & dmask];
                  dodist:
                    for (; ; ) {
                      op = here >>> 24;
                      hold >>>= op;
                      bits -= op;
                      op = here >>> 16 & 255;
                      if (op & 16) {
                        dist = here & 65535;
                        op &= 15;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                          if (bits < op) {
                            hold += input[_in++] << bits;
                            bits += 8;
                          }
                        }
                        dist += hold & (1 << op) - 1;
                        if (dist > dmax) {
                          strm.msg = "invalid distance too far back";
                          state.mode = BAD;
                          break top;
                        }
                        hold >>>= op;
                        bits -= op;
                        op = _out - beg;
                        if (dist > op) {
                          op = dist - op;
                          if (op > whave) {
                            if (state.sane) {
                              strm.msg = "invalid distance too far back";
                              state.mode = BAD;
                              break top;
                            }
                          }
                          from = 0;
                          from_source = s_window;
                          if (wnext === 0) {
                            from += wsize - op;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          } else if (wnext < op) {
                            from += wsize + wnext - op;
                            op -= wnext;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = 0;
                              if (wnext < len) {
                                op = wnext;
                                len -= op;
                                do {
                                  output[_out++] = s_window[from++];
                                } while (--op);
                                from = _out - dist;
                                from_source = output;
                              }
                            }
                          } else {
                            from += wnext - op;
                            if (op < len) {
                              len -= op;
                              do {
                                output[_out++] = s_window[from++];
                              } while (--op);
                              from = _out - dist;
                              from_source = output;
                            }
                          }
                          while (len > 2) {
                            output[_out++] = from_source[from++];
                            output[_out++] = from_source[from++];
                            output[_out++] = from_source[from++];
                            len -= 3;
                          }
                          if (len) {
                            output[_out++] = from_source[from++];
                            if (len > 1) {
                              output[_out++] = from_source[from++];
                            }
                          }
                        } else {
                          from = _out - dist;
                          do {
                            output[_out++] = output[from++];
                            output[_out++] = output[from++];
                            output[_out++] = output[from++];
                            len -= 3;
                          } while (len > 2);
                          if (len) {
                            output[_out++] = output[from++];
                            if (len > 1) {
                              output[_out++] = output[from++];
                            }
                          }
                        }
                      } else if ((op & 64) === 0) {
                        here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                        continue dodist;
                      } else {
                        strm.msg = "invalid distance code";
                        state.mode = BAD;
                        break top;
                      }
                      break;
                    }
                } else if ((op & 64) === 0) {
                  here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                  continue dolen;
                } else if (op & 32) {
                  state.mode = TYPE;
                  break top;
                } else {
                  strm.msg = "invalid literal/length code";
                  state.mode = BAD;
                  break top;
                }
                break;
              }
          } while (_in < last && _out < end);
        len = bits >> 3;
        _in -= len;
        bits -= len << 3;
        hold &= (1 << bits) - 1;
        strm.next_in = _in;
        strm.next_out = _out;
        strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
        strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
        state.hold = hold;
        state.bits = bits;
        return;
      };
    }
  });

  // ../../node_modules/pako/lib/zlib/inftrees.js
  var require_inftrees = __commonJS({
    "../../node_modules/pako/lib/zlib/inftrees.js"(exports, module) {
      "use strict";
      var utils = require_common();
      var MAXBITS = 15;
      var ENOUGH_LENS = 852;
      var ENOUGH_DISTS = 592;
      var CODES = 0;
      var LENS = 1;
      var DISTS = 2;
      var lbase = [
        /* Length codes 257..285 base */
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        13,
        15,
        17,
        19,
        23,
        27,
        31,
        35,
        43,
        51,
        59,
        67,
        83,
        99,
        115,
        131,
        163,
        195,
        227,
        258,
        0,
        0
      ];
      var lext = [
        /* Length codes 257..285 extra */
        16,
        16,
        16,
        16,
        16,
        16,
        16,
        16,
        17,
        17,
        17,
        17,
        18,
        18,
        18,
        18,
        19,
        19,
        19,
        19,
        20,
        20,
        20,
        20,
        21,
        21,
        21,
        21,
        16,
        72,
        78
      ];
      var dbase = [
        /* Distance codes 0..29 base */
        1,
        2,
        3,
        4,
        5,
        7,
        9,
        13,
        17,
        25,
        33,
        49,
        65,
        97,
        129,
        193,
        257,
        385,
        513,
        769,
        1025,
        1537,
        2049,
        3073,
        4097,
        6145,
        8193,
        12289,
        16385,
        24577,
        0,
        0
      ];
      var dext = [
        /* Distance codes 0..29 extra */
        16,
        16,
        16,
        16,
        17,
        17,
        18,
        18,
        19,
        19,
        20,
        20,
        21,
        21,
        22,
        22,
        23,
        23,
        24,
        24,
        25,
        25,
        26,
        26,
        27,
        27,
        28,
        28,
        29,
        29,
        64,
        64
      ];
      module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
        var bits = opts.bits;
        var len = 0;
        var sym = 0;
        var min = 0, max = 0;
        var root = 0;
        var curr = 0;
        var drop = 0;
        var left = 0;
        var used = 0;
        var huff = 0;
        var incr;
        var fill;
        var low;
        var mask;
        var next;
        var base2 = null;
        var base_index = 0;
        var end;
        var count = new utils.Buf16(MAXBITS + 1);
        var offs = new utils.Buf16(MAXBITS + 1);
        var extra = null;
        var extra_index = 0;
        var here_bits, here_op, here_val;
        for (len = 0; len <= MAXBITS; len++) {
          count[len] = 0;
        }
        for (sym = 0; sym < codes; sym++) {
          count[lens[lens_index + sym]]++;
        }
        root = bits;
        for (max = MAXBITS; max >= 1; max--) {
          if (count[max] !== 0) {
            break;
          }
        }
        if (root > max) {
          root = max;
        }
        if (max === 0) {
          table[table_index++] = 1 << 24 | 64 << 16 | 0;
          table[table_index++] = 1 << 24 | 64 << 16 | 0;
          opts.bits = 1;
          return 0;
        }
        for (min = 1; min < max; min++) {
          if (count[min] !== 0) {
            break;
          }
        }
        if (root < min) {
          root = min;
        }
        left = 1;
        for (len = 1; len <= MAXBITS; len++) {
          left <<= 1;
          left -= count[len];
          if (left < 0) {
            return -1;
          }
        }
        if (left > 0 && (type === CODES || max !== 1)) {
          return -1;
        }
        offs[1] = 0;
        for (len = 1; len < MAXBITS; len++) {
          offs[len + 1] = offs[len] + count[len];
        }
        for (sym = 0; sym < codes; sym++) {
          if (lens[lens_index + sym] !== 0) {
            work[offs[lens[lens_index + sym]]++] = sym;
          }
        }
        if (type === CODES) {
          base2 = extra = work;
          end = 19;
        } else if (type === LENS) {
          base2 = lbase;
          base_index -= 257;
          extra = lext;
          extra_index -= 257;
          end = 256;
        } else {
          base2 = dbase;
          extra = dext;
          end = -1;
        }
        huff = 0;
        sym = 0;
        len = min;
        next = table_index;
        curr = root;
        drop = 0;
        low = -1;
        used = 1 << root;
        mask = used - 1;
        if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
          return 1;
        }
        for (; ; ) {
          here_bits = len - drop;
          if (work[sym] < end) {
            here_op = 0;
            here_val = work[sym];
          } else if (work[sym] > end) {
            here_op = extra[extra_index + work[sym]];
            here_val = base2[base_index + work[sym]];
          } else {
            here_op = 32 + 64;
            here_val = 0;
          }
          incr = 1 << len - drop;
          fill = 1 << curr;
          min = fill;
          do {
            fill -= incr;
            table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
          } while (fill !== 0);
          incr = 1 << len - 1;
          while (huff & incr) {
            incr >>= 1;
          }
          if (incr !== 0) {
            huff &= incr - 1;
            huff += incr;
          } else {
            huff = 0;
          }
          sym++;
          if (--count[len] === 0) {
            if (len === max) {
              break;
            }
            len = lens[lens_index + work[sym]];
          }
          if (len > root && (huff & mask) !== low) {
            if (drop === 0) {
              drop = root;
            }
            next += min;
            curr = len - drop;
            left = 1 << curr;
            while (curr + drop < max) {
              left -= count[curr + drop];
              if (left <= 0) {
                break;
              }
              curr++;
              left <<= 1;
            }
            used += 1 << curr;
            if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) {
              return 1;
            }
            low = huff & mask;
            table[low] = root << 24 | curr << 16 | next - table_index | 0;
          }
        }
        if (huff !== 0) {
          table[next + huff] = len - drop << 24 | 64 << 16 | 0;
        }
        opts.bits = root;
        return 0;
      };
    }
  });

  // ../../node_modules/pako/lib/zlib/inflate.js
  var require_inflate = __commonJS({
    "../../node_modules/pako/lib/zlib/inflate.js"(exports) {
      "use strict";
      var utils = require_common();
      var adler32 = require_adler32();
      var crc322 = require_crc32();
      var inflate_fast = require_inffast();
      var inflate_table = require_inftrees();
      var CODES = 0;
      var LENS = 1;
      var DISTS = 2;
      var Z_FINISH = 4;
      var Z_BLOCK = 5;
      var Z_TREES = 6;
      var Z_OK = 0;
      var Z_STREAM_END = 1;
      var Z_NEED_DICT = 2;
      var Z_STREAM_ERROR = -2;
      var Z_DATA_ERROR = -3;
      var Z_MEM_ERROR = -4;
      var Z_BUF_ERROR = -5;
      var Z_DEFLATED = 8;
      var HEAD = 1;
      var FLAGS = 2;
      var TIME = 3;
      var OS = 4;
      var EXLEN = 5;
      var EXTRA = 6;
      var NAME = 7;
      var COMMENT = 8;
      var HCRC = 9;
      var DICTID = 10;
      var DICT = 11;
      var TYPE = 12;
      var TYPEDO = 13;
      var STORED = 14;
      var COPY_ = 15;
      var COPY = 16;
      var TABLE = 17;
      var LENLENS = 18;
      var CODELENS = 19;
      var LEN_ = 20;
      var LEN = 21;
      var LENEXT = 22;
      var DIST = 23;
      var DISTEXT = 24;
      var MATCH = 25;
      var LIT = 26;
      var CHECK = 27;
      var LENGTH = 28;
      var DONE = 29;
      var BAD = 30;
      var MEM = 31;
      var SYNC = 32;
      var ENOUGH_LENS = 852;
      var ENOUGH_DISTS = 592;
      var MAX_WBITS = 15;
      var DEF_WBITS = MAX_WBITS;
      function zswap32(q) {
        return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
      }
      function InflateState() {
        this.mode = 0;
        this.last = false;
        this.wrap = 0;
        this.havedict = false;
        this.flags = 0;
        this.dmax = 0;
        this.check = 0;
        this.total = 0;
        this.head = null;
        this.wbits = 0;
        this.wsize = 0;
        this.whave = 0;
        this.wnext = 0;
        this.window = null;
        this.hold = 0;
        this.bits = 0;
        this.length = 0;
        this.offset = 0;
        this.extra = 0;
        this.lencode = null;
        this.distcode = null;
        this.lenbits = 0;
        this.distbits = 0;
        this.ncode = 0;
        this.nlen = 0;
        this.ndist = 0;
        this.have = 0;
        this.next = null;
        this.lens = new utils.Buf16(320);
        this.work = new utils.Buf16(288);
        this.lendyn = null;
        this.distdyn = null;
        this.sane = 0;
        this.back = 0;
        this.was = 0;
      }
      function inflateResetKeep(strm) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        strm.total_in = strm.total_out = state.total = 0;
        strm.msg = "";
        if (state.wrap) {
          strm.adler = state.wrap & 1;
        }
        state.mode = HEAD;
        state.last = 0;
        state.havedict = 0;
        state.dmax = 32768;
        state.head = null;
        state.hold = 0;
        state.bits = 0;
        state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
        state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
        state.sane = 1;
        state.back = -1;
        return Z_OK;
      }
      function inflateReset(strm) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        state.wsize = 0;
        state.whave = 0;
        state.wnext = 0;
        return inflateResetKeep(strm);
      }
      function inflateReset2(strm, windowBits) {
        var wrap;
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (windowBits < 0) {
          wrap = 0;
          windowBits = -windowBits;
        } else {
          wrap = (windowBits >> 4) + 1;
          if (windowBits < 48) {
            windowBits &= 15;
          }
        }
        if (windowBits && (windowBits < 8 || windowBits > 15)) {
          return Z_STREAM_ERROR;
        }
        if (state.window !== null && state.wbits !== windowBits) {
          state.window = null;
        }
        state.wrap = wrap;
        state.wbits = windowBits;
        return inflateReset(strm);
      }
      function inflateInit2(strm, windowBits) {
        var ret;
        var state;
        if (!strm) {
          return Z_STREAM_ERROR;
        }
        state = new InflateState();
        strm.state = state;
        state.window = null;
        ret = inflateReset2(strm, windowBits);
        if (ret !== Z_OK) {
          strm.state = null;
        }
        return ret;
      }
      function inflateInit(strm) {
        return inflateInit2(strm, DEF_WBITS);
      }
      var virgin = true;
      var lenfix;
      var distfix;
      function fixedtables(state) {
        if (virgin) {
          var sym;
          lenfix = new utils.Buf32(512);
          distfix = new utils.Buf32(32);
          sym = 0;
          while (sym < 144) {
            state.lens[sym++] = 8;
          }
          while (sym < 256) {
            state.lens[sym++] = 9;
          }
          while (sym < 280) {
            state.lens[sym++] = 7;
          }
          while (sym < 288) {
            state.lens[sym++] = 8;
          }
          inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
          sym = 0;
          while (sym < 32) {
            state.lens[sym++] = 5;
          }
          inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
          virgin = false;
        }
        state.lencode = lenfix;
        state.lenbits = 9;
        state.distcode = distfix;
        state.distbits = 5;
      }
      function updatewindow(strm, src, end, copy) {
        var dist;
        var state = strm.state;
        if (state.window === null) {
          state.wsize = 1 << state.wbits;
          state.wnext = 0;
          state.whave = 0;
          state.window = new utils.Buf8(state.wsize);
        }
        if (copy >= state.wsize) {
          utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
          state.wnext = 0;
          state.whave = state.wsize;
        } else {
          dist = state.wsize - state.wnext;
          if (dist > copy) {
            dist = copy;
          }
          utils.arraySet(state.window, src, end - copy, dist, state.wnext);
          copy -= dist;
          if (copy) {
            utils.arraySet(state.window, src, end - copy, copy, 0);
            state.wnext = copy;
            state.whave = state.wsize;
          } else {
            state.wnext += dist;
            if (state.wnext === state.wsize) {
              state.wnext = 0;
            }
            if (state.whave < state.wsize) {
              state.whave += dist;
            }
          }
        }
        return 0;
      }
      function inflate(strm, flush) {
        var state;
        var input, output;
        var next;
        var put;
        var have, left;
        var hold;
        var bits;
        var _in, _out;
        var copy;
        var from;
        var from_source;
        var here = 0;
        var here_bits, here_op, here_val;
        var last_bits, last_op, last_val;
        var len;
        var ret;
        var hbuf = new utils.Buf8(4);
        var opts;
        var n;
        var order = (
          /* permutation of code lengths */
          [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
        );
        if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (state.mode === TYPE) {
          state.mode = TYPEDO;
        }
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        _in = have;
        _out = left;
        ret = Z_OK;
        inf_leave:
          for (; ; ) {
            switch (state.mode) {
              case HEAD:
                if (state.wrap === 0) {
                  state.mode = TYPEDO;
                  break;
                }
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.wrap & 2 && hold === 35615) {
                  state.check = 0;
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc322(state.check, hbuf, 2, 0);
                  hold = 0;
                  bits = 0;
                  state.mode = FLAGS;
                  break;
                }
                state.flags = 0;
                if (state.head) {
                  state.head.done = false;
                }
                if (!(state.wrap & 1) || /* check if zlib header allowed */
                (((hold & 255) << 8) + (hold >> 8)) % 31) {
                  strm.msg = "incorrect header check";
                  state.mode = BAD;
                  break;
                }
                if ((hold & 15) !== Z_DEFLATED) {
                  strm.msg = "unknown compression method";
                  state.mode = BAD;
                  break;
                }
                hold >>>= 4;
                bits -= 4;
                len = (hold & 15) + 8;
                if (state.wbits === 0) {
                  state.wbits = len;
                } else if (len > state.wbits) {
                  strm.msg = "invalid window size";
                  state.mode = BAD;
                  break;
                }
                state.dmax = 1 << len;
                strm.adler = state.check = 1;
                state.mode = hold & 512 ? DICTID : TYPE;
                hold = 0;
                bits = 0;
                break;
              case FLAGS:
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.flags = hold;
                if ((state.flags & 255) !== Z_DEFLATED) {
                  strm.msg = "unknown compression method";
                  state.mode = BAD;
                  break;
                }
                if (state.flags & 57344) {
                  strm.msg = "unknown header flags set";
                  state.mode = BAD;
                  break;
                }
                if (state.head) {
                  state.head.text = hold >> 8 & 1;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc322(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = TIME;
              /* falls through */
              case TIME:
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.head) {
                  state.head.time = hold;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  hbuf[2] = hold >>> 16 & 255;
                  hbuf[3] = hold >>> 24 & 255;
                  state.check = crc322(state.check, hbuf, 4, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = OS;
              /* falls through */
              case OS:
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (state.head) {
                  state.head.xflags = hold & 255;
                  state.head.os = hold >> 8;
                }
                if (state.flags & 512) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc322(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
                state.mode = EXLEN;
              /* falls through */
              case EXLEN:
                if (state.flags & 1024) {
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.length = hold;
                  if (state.head) {
                    state.head.extra_len = hold;
                  }
                  if (state.flags & 512) {
                    hbuf[0] = hold & 255;
                    hbuf[1] = hold >>> 8 & 255;
                    state.check = crc322(state.check, hbuf, 2, 0);
                  }
                  hold = 0;
                  bits = 0;
                } else if (state.head) {
                  state.head.extra = null;
                }
                state.mode = EXTRA;
              /* falls through */
              case EXTRA:
                if (state.flags & 1024) {
                  copy = state.length;
                  if (copy > have) {
                    copy = have;
                  }
                  if (copy) {
                    if (state.head) {
                      len = state.head.extra_len - state.length;
                      if (!state.head.extra) {
                        state.head.extra = new Array(state.head.extra_len);
                      }
                      utils.arraySet(
                        state.head.extra,
                        input,
                        next,
                        // extra field is limited to 65536 bytes
                        // - no need for additional size check
                        copy,
                        /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                        len
                      );
                    }
                    if (state.flags & 512) {
                      state.check = crc322(state.check, input, copy, next);
                    }
                    have -= copy;
                    next += copy;
                    state.length -= copy;
                  }
                  if (state.length) {
                    break inf_leave;
                  }
                }
                state.length = 0;
                state.mode = NAME;
              /* falls through */
              case NAME:
                if (state.flags & 2048) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  copy = 0;
                  do {
                    len = input[next + copy++];
                    if (state.head && len && state.length < 65536) {
                      state.head.name += String.fromCharCode(len);
                    }
                  } while (len && copy < have);
                  if (state.flags & 512) {
                    state.check = crc322(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  if (len) {
                    break inf_leave;
                  }
                } else if (state.head) {
                  state.head.name = null;
                }
                state.length = 0;
                state.mode = COMMENT;
              /* falls through */
              case COMMENT:
                if (state.flags & 4096) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  copy = 0;
                  do {
                    len = input[next + copy++];
                    if (state.head && len && state.length < 65536) {
                      state.head.comment += String.fromCharCode(len);
                    }
                  } while (len && copy < have);
                  if (state.flags & 512) {
                    state.check = crc322(state.check, input, copy, next);
                  }
                  have -= copy;
                  next += copy;
                  if (len) {
                    break inf_leave;
                  }
                } else if (state.head) {
                  state.head.comment = null;
                }
                state.mode = HCRC;
              /* falls through */
              case HCRC:
                if (state.flags & 512) {
                  while (bits < 16) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (hold !== (state.check & 65535)) {
                    strm.msg = "header crc mismatch";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                if (state.head) {
                  state.head.hcrc = state.flags >> 9 & 1;
                  state.head.done = true;
                }
                strm.adler = state.check = 0;
                state.mode = TYPE;
                break;
              case DICTID:
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                strm.adler = state.check = zswap32(hold);
                hold = 0;
                bits = 0;
                state.mode = DICT;
              /* falls through */
              case DICT:
                if (state.havedict === 0) {
                  strm.next_out = put;
                  strm.avail_out = left;
                  strm.next_in = next;
                  strm.avail_in = have;
                  state.hold = hold;
                  state.bits = bits;
                  return Z_NEED_DICT;
                }
                strm.adler = state.check = 1;
                state.mode = TYPE;
              /* falls through */
              case TYPE:
                if (flush === Z_BLOCK || flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case TYPEDO:
                if (state.last) {
                  hold >>>= bits & 7;
                  bits -= bits & 7;
                  state.mode = CHECK;
                  break;
                }
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.last = hold & 1;
                hold >>>= 1;
                bits -= 1;
                switch (hold & 3) {
                  case 0:
                    state.mode = STORED;
                    break;
                  case 1:
                    fixedtables(state);
                    state.mode = LEN_;
                    if (flush === Z_TREES) {
                      hold >>>= 2;
                      bits -= 2;
                      break inf_leave;
                    }
                    break;
                  case 2:
                    state.mode = TABLE;
                    break;
                  case 3:
                    strm.msg = "invalid block type";
                    state.mode = BAD;
                }
                hold >>>= 2;
                bits -= 2;
                break;
              case STORED:
                hold >>>= bits & 7;
                bits -= bits & 7;
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                  strm.msg = "invalid stored block lengths";
                  state.mode = BAD;
                  break;
                }
                state.length = hold & 65535;
                hold = 0;
                bits = 0;
                state.mode = COPY_;
                if (flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case COPY_:
                state.mode = COPY;
              /* falls through */
              case COPY:
                copy = state.length;
                if (copy) {
                  if (copy > have) {
                    copy = have;
                  }
                  if (copy > left) {
                    copy = left;
                  }
                  if (copy === 0) {
                    break inf_leave;
                  }
                  utils.arraySet(output, input, next, copy, put);
                  have -= copy;
                  next += copy;
                  left -= copy;
                  put += copy;
                  state.length -= copy;
                  break;
                }
                state.mode = TYPE;
                break;
              case TABLE:
                while (bits < 14) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                state.nlen = (hold & 31) + 257;
                hold >>>= 5;
                bits -= 5;
                state.ndist = (hold & 31) + 1;
                hold >>>= 5;
                bits -= 5;
                state.ncode = (hold & 15) + 4;
                hold >>>= 4;
                bits -= 4;
                if (state.nlen > 286 || state.ndist > 30) {
                  strm.msg = "too many length or distance symbols";
                  state.mode = BAD;
                  break;
                }
                state.have = 0;
                state.mode = LENLENS;
              /* falls through */
              case LENLENS:
                while (state.have < state.ncode) {
                  while (bits < 3) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.lens[order[state.have++]] = hold & 7;
                  hold >>>= 3;
                  bits -= 3;
                }
                while (state.have < 19) {
                  state.lens[order[state.have++]] = 0;
                }
                state.lencode = state.lendyn;
                state.lenbits = 7;
                opts = { bits: state.lenbits };
                ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid code lengths set";
                  state.mode = BAD;
                  break;
                }
                state.have = 0;
                state.mode = CODELENS;
              /* falls through */
              case CODELENS:
                while (state.have < state.nlen + state.ndist) {
                  for (; ; ) {
                    here = state.lencode[hold & (1 << state.lenbits) - 1];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (here_val < 16) {
                    hold >>>= here_bits;
                    bits -= here_bits;
                    state.lens[state.have++] = here_val;
                  } else {
                    if (here_val === 16) {
                      n = here_bits + 2;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      if (state.have === 0) {
                        strm.msg = "invalid bit length repeat";
                        state.mode = BAD;
                        break;
                      }
                      len = state.lens[state.have - 1];
                      copy = 3 + (hold & 3);
                      hold >>>= 2;
                      bits -= 2;
                    } else if (here_val === 17) {
                      n = here_bits + 3;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      len = 0;
                      copy = 3 + (hold & 7);
                      hold >>>= 3;
                      bits -= 3;
                    } else {
                      n = here_bits + 7;
                      while (bits < n) {
                        if (have === 0) {
                          break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                      }
                      hold >>>= here_bits;
                      bits -= here_bits;
                      len = 0;
                      copy = 11 + (hold & 127);
                      hold >>>= 7;
                      bits -= 7;
                    }
                    if (state.have + copy > state.nlen + state.ndist) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    while (copy--) {
                      state.lens[state.have++] = len;
                    }
                  }
                }
                if (state.mode === BAD) {
                  break;
                }
                if (state.lens[256] === 0) {
                  strm.msg = "invalid code -- missing end-of-block";
                  state.mode = BAD;
                  break;
                }
                state.lenbits = 9;
                opts = { bits: state.lenbits };
                ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                state.lenbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid literal/lengths set";
                  state.mode = BAD;
                  break;
                }
                state.distbits = 6;
                state.distcode = state.distdyn;
                opts = { bits: state.distbits };
                ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                state.distbits = opts.bits;
                if (ret) {
                  strm.msg = "invalid distances set";
                  state.mode = BAD;
                  break;
                }
                state.mode = LEN_;
                if (flush === Z_TREES) {
                  break inf_leave;
                }
              /* falls through */
              case LEN_:
                state.mode = LEN;
              /* falls through */
              case LEN:
                if (have >= 6 && left >= 258) {
                  strm.next_out = put;
                  strm.avail_out = left;
                  strm.next_in = next;
                  strm.avail_in = have;
                  state.hold = hold;
                  state.bits = bits;
                  inflate_fast(strm, _out);
                  put = strm.next_out;
                  output = strm.output;
                  left = strm.avail_out;
                  next = strm.next_in;
                  input = strm.input;
                  have = strm.avail_in;
                  hold = state.hold;
                  bits = state.bits;
                  if (state.mode === TYPE) {
                    state.back = -1;
                  }
                  break;
                }
                state.back = 0;
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if (here_op && (here_op & 240) === 0) {
                  last_bits = here_bits;
                  last_op = here_op;
                  last_val = here_val;
                  for (; ; ) {
                    here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (last_bits + here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= last_bits;
                  bits -= last_bits;
                  state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                state.length = here_val;
                if (here_op === 0) {
                  state.mode = LIT;
                  break;
                }
                if (here_op & 32) {
                  state.back = -1;
                  state.mode = TYPE;
                  break;
                }
                if (here_op & 64) {
                  strm.msg = "invalid literal/length code";
                  state.mode = BAD;
                  break;
                }
                state.extra = here_op & 15;
                state.mode = LENEXT;
              /* falls through */
              case LENEXT:
                if (state.extra) {
                  n = state.extra;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.length += hold & (1 << state.extra) - 1;
                  hold >>>= state.extra;
                  bits -= state.extra;
                  state.back += state.extra;
                }
                state.was = state.length;
                state.mode = DIST;
              /* falls through */
              case DIST:
                for (; ; ) {
                  here = state.distcode[hold & (1 << state.distbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                if ((here_op & 240) === 0) {
                  last_bits = here_bits;
                  last_op = here_op;
                  last_val = here_val;
                  for (; ; ) {
                    here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                    here_bits = here >>> 24;
                    here_op = here >>> 16 & 255;
                    here_val = here & 65535;
                    if (last_bits + here_bits <= bits) {
                      break;
                    }
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  hold >>>= last_bits;
                  bits -= last_bits;
                  state.back += last_bits;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                state.back += here_bits;
                if (here_op & 64) {
                  strm.msg = "invalid distance code";
                  state.mode = BAD;
                  break;
                }
                state.offset = here_val;
                state.extra = here_op & 15;
                state.mode = DISTEXT;
              /* falls through */
              case DISTEXT:
                if (state.extra) {
                  n = state.extra;
                  while (bits < n) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  state.offset += hold & (1 << state.extra) - 1;
                  hold >>>= state.extra;
                  bits -= state.extra;
                  state.back += state.extra;
                }
                if (state.offset > state.dmax) {
                  strm.msg = "invalid distance too far back";
                  state.mode = BAD;
                  break;
                }
                state.mode = MATCH;
              /* falls through */
              case MATCH:
                if (left === 0) {
                  break inf_leave;
                }
                copy = _out - left;
                if (state.offset > copy) {
                  copy = state.offset - copy;
                  if (copy > state.whave) {
                    if (state.sane) {
                      strm.msg = "invalid distance too far back";
                      state.mode = BAD;
                      break;
                    }
                  }
                  if (copy > state.wnext) {
                    copy -= state.wnext;
                    from = state.wsize - copy;
                  } else {
                    from = state.wnext - copy;
                  }
                  if (copy > state.length) {
                    copy = state.length;
                  }
                  from_source = state.window;
                } else {
                  from_source = output;
                  from = put - state.offset;
                  copy = state.length;
                }
                if (copy > left) {
                  copy = left;
                }
                left -= copy;
                state.length -= copy;
                do {
                  output[put++] = from_source[from++];
                } while (--copy);
                if (state.length === 0) {
                  state.mode = LEN;
                }
                break;
              case LIT:
                if (left === 0) {
                  break inf_leave;
                }
                output[put++] = state.length;
                left--;
                state.mode = LEN;
                break;
              case CHECK:
                if (state.wrap) {
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold |= input[next++] << bits;
                    bits += 8;
                  }
                  _out -= left;
                  strm.total_out += _out;
                  state.total += _out;
                  if (_out) {
                    strm.adler = state.check = /*UPDATE(state.check, put - _out, _out);*/
                    state.flags ? crc322(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                  }
                  _out = left;
                  if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                    strm.msg = "incorrect data check";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                state.mode = LENGTH;
              /* falls through */
              case LENGTH:
                if (state.wrap && state.flags) {
                  while (bits < 32) {
                    if (have === 0) {
                      break inf_leave;
                    }
                    have--;
                    hold += input[next++] << bits;
                    bits += 8;
                  }
                  if (hold !== (state.total & 4294967295)) {
                    strm.msg = "incorrect length check";
                    state.mode = BAD;
                    break;
                  }
                  hold = 0;
                  bits = 0;
                }
                state.mode = DONE;
              /* falls through */
              case DONE:
                ret = Z_STREAM_END;
                break inf_leave;
              case BAD:
                ret = Z_DATA_ERROR;
                break inf_leave;
              case MEM:
                return Z_MEM_ERROR;
              case SYNC:
              /* falls through */
              default:
                return Z_STREAM_ERROR;
            }
          }
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
          if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
            state.mode = MEM;
            return Z_MEM_ERROR;
          }
        }
        _in -= strm.avail_in;
        _out -= strm.avail_out;
        strm.total_in += _in;
        strm.total_out += _out;
        state.total += _out;
        if (state.wrap && _out) {
          strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
          state.flags ? crc322(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
        }
        strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
        if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
          ret = Z_BUF_ERROR;
        }
        return ret;
      }
      function inflateEnd(strm) {
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        var state = strm.state;
        if (state.window) {
          state.window = null;
        }
        strm.state = null;
        return Z_OK;
      }
      function inflateGetHeader(strm, head) {
        var state;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if ((state.wrap & 2) === 0) {
          return Z_STREAM_ERROR;
        }
        state.head = head;
        head.done = false;
        return Z_OK;
      }
      function inflateSetDictionary(strm, dictionary) {
        var dictLength = dictionary.length;
        var state;
        var dictid;
        var ret;
        if (!strm || !strm.state) {
          return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (state.wrap !== 0 && state.mode !== DICT) {
          return Z_STREAM_ERROR;
        }
        if (state.mode === DICT) {
          dictid = 1;
          dictid = adler32(dictid, dictionary, dictLength, 0);
          if (dictid !== state.check) {
            return Z_DATA_ERROR;
          }
        }
        ret = updatewindow(strm, dictionary, dictLength, dictLength);
        if (ret) {
          state.mode = MEM;
          return Z_MEM_ERROR;
        }
        state.havedict = 1;
        return Z_OK;
      }
      exports.inflateReset = inflateReset;
      exports.inflateReset2 = inflateReset2;
      exports.inflateResetKeep = inflateResetKeep;
      exports.inflateInit = inflateInit;
      exports.inflateInit2 = inflateInit2;
      exports.inflate = inflate;
      exports.inflateEnd = inflateEnd;
      exports.inflateGetHeader = inflateGetHeader;
      exports.inflateSetDictionary = inflateSetDictionary;
      exports.inflateInfo = "pako inflate (from Nodeca project)";
    }
  });

  // ../../node_modules/pako/lib/zlib/constants.js
  var require_constants = __commonJS({
    "../../node_modules/pako/lib/zlib/constants.js"(exports, module) {
      "use strict";
      module.exports = {
        /* Allowed flush values; see deflate() and inflate() below for details */
        Z_NO_FLUSH: 0,
        Z_PARTIAL_FLUSH: 1,
        Z_SYNC_FLUSH: 2,
        Z_FULL_FLUSH: 3,
        Z_FINISH: 4,
        Z_BLOCK: 5,
        Z_TREES: 6,
        /* Return codes for the compression/decompression functions. Negative values
        * are errors, positive values are used for special but normal events.
        */
        Z_OK: 0,
        Z_STREAM_END: 1,
        Z_NEED_DICT: 2,
        Z_ERRNO: -1,
        Z_STREAM_ERROR: -2,
        Z_DATA_ERROR: -3,
        //Z_MEM_ERROR:     -4,
        Z_BUF_ERROR: -5,
        //Z_VERSION_ERROR: -6,
        /* compression levels */
        Z_NO_COMPRESSION: 0,
        Z_BEST_SPEED: 1,
        Z_BEST_COMPRESSION: 9,
        Z_DEFAULT_COMPRESSION: -1,
        Z_FILTERED: 1,
        Z_HUFFMAN_ONLY: 2,
        Z_RLE: 3,
        Z_FIXED: 4,
        Z_DEFAULT_STRATEGY: 0,
        /* Possible values of the data_type field (though see inflate()) */
        Z_BINARY: 0,
        Z_TEXT: 1,
        //Z_ASCII:                1, // = Z_TEXT (deprecated)
        Z_UNKNOWN: 2,
        /* The deflate compression method */
        Z_DEFLATED: 8
        //Z_NULL:                 null // Use -1 or null inline, depending on var type
      };
    }
  });

  // ../../node_modules/pako/lib/zlib/gzheader.js
  var require_gzheader = __commonJS({
    "../../node_modules/pako/lib/zlib/gzheader.js"(exports, module) {
      "use strict";
      function GZheader() {
        this.text = 0;
        this.time = 0;
        this.xflags = 0;
        this.os = 0;
        this.extra = null;
        this.extra_len = 0;
        this.name = "";
        this.comment = "";
        this.hcrc = 0;
        this.done = false;
      }
      module.exports = GZheader;
    }
  });

  // ../../node_modules/pako/lib/inflate.js
  var require_inflate2 = __commonJS({
    "../../node_modules/pako/lib/inflate.js"(exports) {
      "use strict";
      var zlib_inflate = require_inflate();
      var utils = require_common();
      var strings = require_strings();
      var c = require_constants();
      var msg = require_messages();
      var ZStream = require_zstream();
      var GZheader = require_gzheader();
      var toString = Object.prototype.toString;
      function Inflate(options) {
        if (!(this instanceof Inflate)) return new Inflate(options);
        this.options = utils.assign({
          chunkSize: 16384,
          windowBits: 0,
          to: ""
        }, options || {});
        var opt = this.options;
        if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
          opt.windowBits = -opt.windowBits;
          if (opt.windowBits === 0) {
            opt.windowBits = -15;
          }
        }
        if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
          opt.windowBits += 32;
        }
        if (opt.windowBits > 15 && opt.windowBits < 48) {
          if ((opt.windowBits & 15) === 0) {
            opt.windowBits |= 15;
          }
        }
        this.err = 0;
        this.msg = "";
        this.ended = false;
        this.chunks = [];
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        var status = zlib_inflate.inflateInit2(
          this.strm,
          opt.windowBits
        );
        if (status !== c.Z_OK) {
          throw new Error(msg[status]);
        }
        this.header = new GZheader();
        zlib_inflate.inflateGetHeader(this.strm, this.header);
        if (opt.dictionary) {
          if (typeof opt.dictionary === "string") {
            opt.dictionary = strings.string2buf(opt.dictionary);
          } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
            opt.dictionary = new Uint8Array(opt.dictionary);
          }
          if (opt.raw) {
            status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
            if (status !== c.Z_OK) {
              throw new Error(msg[status]);
            }
          }
        }
      }
      Inflate.prototype.push = function(data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var dictionary = this.options.dictionary;
        var status, _mode;
        var next_out_utf8, tail, utf8str;
        var allowBufError = false;
        if (this.ended) {
          return false;
        }
        _mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
        if (typeof data === "string") {
          strm.input = strings.binstring2buf(data);
        } else if (toString.call(data) === "[object ArrayBuffer]") {
          strm.input = new Uint8Array(data);
        } else {
          strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        do {
          if (strm.avail_out === 0) {
            strm.output = new utils.Buf8(chunkSize);
            strm.next_out = 0;
            strm.avail_out = chunkSize;
          }
          status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
          if (status === c.Z_NEED_DICT && dictionary) {
            status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
          }
          if (status === c.Z_BUF_ERROR && allowBufError === true) {
            status = c.Z_OK;
            allowBufError = false;
          }
          if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
            this.onEnd(status);
            this.ended = true;
            return false;
          }
          if (strm.next_out) {
            if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) {
              if (this.options.to === "string") {
                next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
                tail = strm.next_out - next_out_utf8;
                utf8str = strings.buf2string(strm.output, next_out_utf8);
                strm.next_out = tail;
                strm.avail_out = chunkSize - tail;
                if (tail) {
                  utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
                }
                this.onData(utf8str);
              } else {
                this.onData(utils.shrinkBuf(strm.output, strm.next_out));
              }
            }
          }
          if (strm.avail_in === 0 && strm.avail_out === 0) {
            allowBufError = true;
          }
        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
        if (status === c.Z_STREAM_END) {
          _mode = c.Z_FINISH;
        }
        if (_mode === c.Z_FINISH) {
          status = zlib_inflate.inflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === c.Z_OK;
        }
        if (_mode === c.Z_SYNC_FLUSH) {
          this.onEnd(c.Z_OK);
          strm.avail_out = 0;
          return true;
        }
        return true;
      };
      Inflate.prototype.onData = function(chunk) {
        this.chunks.push(chunk);
      };
      Inflate.prototype.onEnd = function(status) {
        if (status === c.Z_OK) {
          if (this.options.to === "string") {
            this.result = this.chunks.join("");
          } else {
            this.result = utils.flattenChunks(this.chunks);
          }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
      };
      function inflate(input, options) {
        var inflator = new Inflate(options);
        inflator.push(input, true);
        if (inflator.err) {
          throw inflator.msg || msg[inflator.err];
        }
        return inflator.result;
      }
      function inflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return inflate(input, options);
      }
      exports.Inflate = Inflate;
      exports.inflate = inflate;
      exports.inflateRaw = inflateRaw;
      exports.ungzip = inflate;
    }
  });

  // ../../node_modules/pako/index.js
  var require_pako = __commonJS({
    "../../node_modules/pako/index.js"(exports, module) {
      "use strict";
      var assign = require_common().assign;
      var deflate = require_deflate2();
      var inflate = require_inflate2();
      var constants = require_constants();
      var pako = {};
      assign(pako, deflate, inflate, constants);
      module.exports = pako;
    }
  });

  // ../../node_modules/upng-js/UPNG.js
  var require_UPNG = __commonJS({
    "../../node_modules/upng-js/UPNG.js"(exports, module) {
      (function() {
        var UPNG3 = {};
        var pako;
        if (typeof module == "object") {
          module.exports = UPNG3;
        } else {
          window.UPNG = UPNG3;
        }
        if (typeof __require == "function") {
          pako = require_pako();
        } else {
          pako = window.pako;
        }
        function log() {
          if (typeof process == "undefined" || true) console.log.apply(console, arguments);
        }
        (function(UPNG4, pako2) {
          UPNG4.toRGBA8 = function(out) {
            var w = out.width, h = out.height;
            if (out.tabs.acTL == null) return [UPNG4.toRGBA8.decodeImage(out.data, w, h, out).buffer];
            var frms = [];
            if (out.frames[0].data == null) out.frames[0].data = out.data;
            var img, empty = new Uint8Array(w * h * 4);
            for (var i = 0; i < out.frames.length; i++) {
              var frm = out.frames[i];
              var fx = frm.rect.x, fy = frm.rect.y, fw = frm.rect.width, fh = frm.rect.height;
              var fdata = UPNG4.toRGBA8.decodeImage(frm.data, fw, fh, out);
              if (i == 0) img = fdata;
              else if (frm.blend == 0) UPNG4._copyTile(fdata, fw, fh, img, w, h, fx, fy, 0);
              else if (frm.blend == 1) UPNG4._copyTile(fdata, fw, fh, img, w, h, fx, fy, 1);
              frms.push(img.buffer);
              img = img.slice(0);
              if (frm.dispose == 0) {
              } else if (frm.dispose == 1) UPNG4._copyTile(empty, fw, fh, img, w, h, fx, fy, 0);
              else if (frm.dispose == 2) {
                var pi = i - 1;
                while (out.frames[pi].dispose == 2) pi--;
                img = new Uint8Array(frms[pi]).slice(0);
              }
            }
            return frms;
          };
          UPNG4.toRGBA8.decodeImage = function(data, w, h, out) {
            var area = w * h, bpp = UPNG4.decode._getBPP(out);
            var bpl = Math.ceil(w * bpp / 8);
            var bf = new Uint8Array(area * 4), bf32 = new Uint32Array(bf.buffer);
            var ctype = out.ctype, depth = out.depth;
            var rs = UPNG4._bin.readUshort;
            if (ctype == 6) {
              var qarea = area << 2;
              if (depth == 8) for (var i = 0; i < qarea; i++) {
                bf[i] = data[i];
              }
              if (depth == 16) for (var i = 0; i < qarea; i++) {
                bf[i] = data[i << 1];
              }
            } else if (ctype == 2) {
              var ts = out.tabs["tRNS"], tr = -1, tg = -1, tb = -1;
              if (ts) {
                tr = ts[0];
                tg = ts[1];
                tb = ts[2];
              }
              if (depth == 8) for (var i = 0; i < area; i++) {
                var qi = i << 2, ti = i * 3;
                bf[qi] = data[ti];
                bf[qi + 1] = data[ti + 1];
                bf[qi + 2] = data[ti + 2];
                bf[qi + 3] = 255;
                if (tr != -1 && data[ti] == tr && data[ti + 1] == tg && data[ti + 2] == tb) bf[qi + 3] = 0;
              }
              if (depth == 16) for (var i = 0; i < area; i++) {
                var qi = i << 2, ti = i * 6;
                bf[qi] = data[ti];
                bf[qi + 1] = data[ti + 2];
                bf[qi + 2] = data[ti + 4];
                bf[qi + 3] = 255;
                if (tr != -1 && rs(data, ti) == tr && rs(data, ti + 2) == tg && rs(data, ti + 4) == tb) bf[qi + 3] = 0;
              }
            } else if (ctype == 3) {
              var p = out.tabs["PLTE"], ap = out.tabs["tRNS"], tl = ap ? ap.length : 0;
              if (depth == 1) for (var y = 0; y < h; y++) {
                var s0 = y * bpl, t0 = y * w;
                for (var i = 0; i < w; i++) {
                  var qi = t0 + i << 2, j = data[s0 + (i >> 3)] >> 7 - ((i & 7) << 0) & 1, cj = 3 * j;
                  bf[qi] = p[cj];
                  bf[qi + 1] = p[cj + 1];
                  bf[qi + 2] = p[cj + 2];
                  bf[qi + 3] = j < tl ? ap[j] : 255;
                }
              }
              if (depth == 2) for (var y = 0; y < h; y++) {
                var s0 = y * bpl, t0 = y * w;
                for (var i = 0; i < w; i++) {
                  var qi = t0 + i << 2, j = data[s0 + (i >> 2)] >> 6 - ((i & 3) << 1) & 3, cj = 3 * j;
                  bf[qi] = p[cj];
                  bf[qi + 1] = p[cj + 1];
                  bf[qi + 2] = p[cj + 2];
                  bf[qi + 3] = j < tl ? ap[j] : 255;
                }
              }
              if (depth == 4) for (var y = 0; y < h; y++) {
                var s0 = y * bpl, t0 = y * w;
                for (var i = 0; i < w; i++) {
                  var qi = t0 + i << 2, j = data[s0 + (i >> 1)] >> 4 - ((i & 1) << 2) & 15, cj = 3 * j;
                  bf[qi] = p[cj];
                  bf[qi + 1] = p[cj + 1];
                  bf[qi + 2] = p[cj + 2];
                  bf[qi + 3] = j < tl ? ap[j] : 255;
                }
              }
              if (depth == 8) for (var i = 0; i < area; i++) {
                var qi = i << 2, j = data[i], cj = 3 * j;
                bf[qi] = p[cj];
                bf[qi + 1] = p[cj + 1];
                bf[qi + 2] = p[cj + 2];
                bf[qi + 3] = j < tl ? ap[j] : 255;
              }
            } else if (ctype == 4) {
              if (depth == 8) for (var i = 0; i < area; i++) {
                var qi = i << 2, di = i << 1, gr = data[di];
                bf[qi] = gr;
                bf[qi + 1] = gr;
                bf[qi + 2] = gr;
                bf[qi + 3] = data[di + 1];
              }
              if (depth == 16) for (var i = 0; i < area; i++) {
                var qi = i << 2, di = i << 2, gr = data[di];
                bf[qi] = gr;
                bf[qi + 1] = gr;
                bf[qi + 2] = gr;
                bf[qi + 3] = data[di + 2];
              }
            } else if (ctype == 0) {
              var tr = out.tabs["tRNS"] ? out.tabs["tRNS"] : -1;
              if (depth == 1) for (var i = 0; i < area; i++) {
                var gr = 255 * (data[i >> 3] >> 7 - (i & 7) & 1), al = gr == tr * 255 ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
              if (depth == 2) for (var i = 0; i < area; i++) {
                var gr = 85 * (data[i >> 2] >> 6 - ((i & 3) << 1) & 3), al = gr == tr * 85 ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
              if (depth == 4) for (var i = 0; i < area; i++) {
                var gr = 17 * (data[i >> 1] >> 4 - ((i & 1) << 2) & 15), al = gr == tr * 17 ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
              if (depth == 8) for (var i = 0; i < area; i++) {
                var gr = data[i], al = gr == tr ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
              if (depth == 16) for (var i = 0; i < area; i++) {
                var gr = data[i << 1], al = rs(data, i << 1) == tr ? 0 : 255;
                bf32[i] = al << 24 | gr << 16 | gr << 8 | gr;
              }
            }
            return bf;
          };
          UPNG4.decode = function(buff) {
            var data = new Uint8Array(buff), offset = 8, bin = UPNG4._bin, rUs = bin.readUshort, rUi = bin.readUint;
            var out = { tabs: {}, frames: [] };
            var dd = new Uint8Array(data.length), doff = 0;
            var fd, foff = 0;
            var mgck = [137, 80, 78, 71, 13, 10, 26, 10];
            for (var i = 0; i < 8; i++) if (data[i] != mgck[i]) throw "The input is not a PNG file!";
            while (offset < data.length) {
              var len = bin.readUint(data, offset);
              offset += 4;
              var type = bin.readASCII(data, offset, 4);
              offset += 4;
              if (type == "IHDR") {
                UPNG4.decode._IHDR(data, offset, out);
              } else if (type == "IDAT") {
                for (var i = 0; i < len; i++) dd[doff + i] = data[offset + i];
                doff += len;
              } else if (type == "acTL") {
                out.tabs[type] = { num_frames: rUi(data, offset), num_plays: rUi(data, offset + 4) };
                fd = new Uint8Array(data.length);
              } else if (type == "fcTL") {
                if (foff != 0) {
                  var fr = out.frames[out.frames.length - 1];
                  fr.data = UPNG4.decode._decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
                  foff = 0;
                }
                var rct = { x: rUi(data, offset + 12), y: rUi(data, offset + 16), width: rUi(data, offset + 4), height: rUi(data, offset + 8) };
                var del = rUs(data, offset + 22);
                del = rUs(data, offset + 20) / (del == 0 ? 100 : del);
                var frm = { rect: rct, delay: Math.round(del * 1e3), dispose: data[offset + 24], blend: data[offset + 25] };
                out.frames.push(frm);
              } else if (type == "fdAT") {
                for (var i = 0; i < len - 4; i++) fd[foff + i] = data[offset + i + 4];
                foff += len - 4;
              } else if (type == "pHYs") {
                out.tabs[type] = [bin.readUint(data, offset), bin.readUint(data, offset + 4), data[offset + 8]];
              } else if (type == "cHRM") {
                out.tabs[type] = [];
                for (var i = 0; i < 8; i++) out.tabs[type].push(bin.readUint(data, offset + i * 4));
              } else if (type == "tEXt") {
                if (out.tabs[type] == null) out.tabs[type] = {};
                var nz = bin.nextZero(data, offset);
                var keyw = bin.readASCII(data, offset, nz - offset);
                var text = bin.readASCII(data, nz + 1, offset + len - nz - 1);
                out.tabs[type][keyw] = text;
              } else if (type == "iTXt") {
                if (out.tabs[type] == null) out.tabs[type] = {};
                var nz = 0, off = offset;
                nz = bin.nextZero(data, off);
                var keyw = bin.readASCII(data, off, nz - off);
                off = nz + 1;
                var cflag = data[off], cmeth = data[off + 1];
                off += 2;
                nz = bin.nextZero(data, off);
                var ltag = bin.readASCII(data, off, nz - off);
                off = nz + 1;
                nz = bin.nextZero(data, off);
                var tkeyw = bin.readUTF8(data, off, nz - off);
                off = nz + 1;
                var text = bin.readUTF8(data, off, len - (off - offset));
                out.tabs[type][keyw] = text;
              } else if (type == "PLTE") {
                out.tabs[type] = bin.readBytes(data, offset, len);
              } else if (type == "hIST") {
                var pl = out.tabs["PLTE"].length / 3;
                out.tabs[type] = [];
                for (var i = 0; i < pl; i++) out.tabs[type].push(rUs(data, offset + i * 2));
              } else if (type == "tRNS") {
                if (out.ctype == 3) out.tabs[type] = bin.readBytes(data, offset, len);
                else if (out.ctype == 0) out.tabs[type] = rUs(data, offset);
                else if (out.ctype == 2) out.tabs[type] = [rUs(data, offset), rUs(data, offset + 2), rUs(data, offset + 4)];
              } else if (type == "gAMA") out.tabs[type] = bin.readUint(data, offset) / 1e5;
              else if (type == "sRGB") out.tabs[type] = data[offset];
              else if (type == "bKGD") {
                if (out.ctype == 0 || out.ctype == 4) out.tabs[type] = [rUs(data, offset)];
                else if (out.ctype == 2 || out.ctype == 6) out.tabs[type] = [rUs(data, offset), rUs(data, offset + 2), rUs(data, offset + 4)];
                else if (out.ctype == 3) out.tabs[type] = data[offset];
              } else if (type == "IEND") {
                if (foff != 0) {
                  var fr = out.frames[out.frames.length - 1];
                  fr.data = UPNG4.decode._decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
                  foff = 0;
                }
                out.data = UPNG4.decode._decompress(out, dd, out.width, out.height);
                break;
              }
              offset += len;
              var crc = bin.readUint(data, offset);
              offset += 4;
            }
            delete out.compress;
            delete out.interlace;
            delete out.filter;
            return out;
          };
          UPNG4.decode._decompress = function(out, dd, w, h) {
            if (out.compress == 0) dd = UPNG4.decode._inflate(dd);
            if (out.interlace == 0) dd = UPNG4.decode._filterZero(dd, out, 0, w, h);
            else if (out.interlace == 1) dd = UPNG4.decode._readInterlace(dd, out);
            return dd;
          };
          UPNG4.decode._inflate = function(data) {
            return pako2["inflate"](data);
          };
          UPNG4.decode._readInterlace = function(data, out) {
            var w = out.width, h = out.height;
            var bpp = UPNG4.decode._getBPP(out), cbpp = bpp >> 3, bpl = Math.ceil(w * bpp / 8);
            var img = new Uint8Array(h * bpl);
            var di = 0;
            var starting_row = [0, 0, 4, 0, 2, 0, 1];
            var starting_col = [0, 4, 0, 2, 0, 1, 0];
            var row_increment = [8, 8, 8, 4, 4, 2, 2];
            var col_increment = [8, 8, 4, 4, 2, 2, 1];
            var pass = 0;
            while (pass < 7) {
              var ri = row_increment[pass], ci = col_increment[pass];
              var sw = 0, sh = 0;
              var cr = starting_row[pass];
              while (cr < h) {
                cr += ri;
                sh++;
              }
              var cc = starting_col[pass];
              while (cc < w) {
                cc += ci;
                sw++;
              }
              var bpll = Math.ceil(sw * bpp / 8);
              UPNG4.decode._filterZero(data, out, di, sw, sh);
              var y = 0, row = starting_row[pass];
              while (row < h) {
                var col = starting_col[pass];
                var cdi = di + y * bpll << 3;
                while (col < w) {
                  if (bpp == 1) {
                    var val = data[cdi >> 3];
                    val = val >> 7 - (cdi & 7) & 1;
                    img[row * bpl + (col >> 3)] |= val << 7 - ((col & 3) << 0);
                  }
                  if (bpp == 2) {
                    var val = data[cdi >> 3];
                    val = val >> 6 - (cdi & 7) & 3;
                    img[row * bpl + (col >> 2)] |= val << 6 - ((col & 3) << 1);
                  }
                  if (bpp == 4) {
                    var val = data[cdi >> 3];
                    val = val >> 4 - (cdi & 7) & 15;
                    img[row * bpl + (col >> 1)] |= val << 4 - ((col & 1) << 2);
                  }
                  if (bpp >= 8) {
                    var ii = row * bpl + col * cbpp;
                    for (var j = 0; j < cbpp; j++) img[ii + j] = data[(cdi >> 3) + j];
                  }
                  cdi += bpp;
                  col += ci;
                }
                y++;
                row += ri;
              }
              if (sw * sh != 0) di += sh * (1 + bpll);
              pass = pass + 1;
            }
            return img;
          };
          UPNG4.decode._getBPP = function(out) {
            var noc = [1, null, 3, 1, 2, null, 4][out.ctype];
            return noc * out.depth;
          };
          UPNG4.decode._filterZero = function(data, out, off, w, h) {
            var bpp = UPNG4.decode._getBPP(out), bpl = Math.ceil(w * bpp / 8), paeth2 = UPNG4.decode._paeth;
            bpp = Math.ceil(bpp / 8);
            for (var y = 0; y < h; y++) {
              var i = off + y * bpl, di = i + y + 1;
              var type = data[di - 1];
              if (type == 0) for (var x = 0; x < bpl; x++) data[i + x] = data[di + x];
              else if (type == 1) {
                for (var x = 0; x < bpp; x++) data[i + x] = data[di + x];
                for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpp] & 255;
              } else if (y == 0) {
                for (var x = 0; x < bpp; x++) data[i + x] = data[di + x];
                if (type == 2) for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] & 255;
                if (type == 3) for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + (data[i + x - bpp] >> 1) & 255;
                if (type == 4) for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + paeth2(data[i + x - bpp], 0, 0) & 255;
              } else {
                if (type == 2) {
                  for (var x = 0; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpl] & 255;
                }
                if (type == 3) {
                  for (var x = 0; x < bpp; x++) data[i + x] = data[di + x] + (data[i + x - bpl] >> 1) & 255;
                  for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + (data[i + x - bpl] + data[i + x - bpp] >> 1) & 255;
                }
                if (type == 4) {
                  for (var x = 0; x < bpp; x++) data[i + x] = data[di + x] + paeth2(0, data[i + x - bpl], 0) & 255;
                  for (var x = bpp; x < bpl; x++) data[i + x] = data[di + x] + paeth2(data[i + x - bpp], data[i + x - bpl], data[i + x - bpp - bpl]) & 255;
                }
              }
            }
            return data;
          };
          UPNG4.decode._paeth = function(a, b, c) {
            var p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
            if (pa <= pb && pa <= pc) return a;
            else if (pb <= pc) return b;
            return c;
          };
          UPNG4.decode._IHDR = function(data, offset, out) {
            var bin = UPNG4._bin;
            out.width = bin.readUint(data, offset);
            offset += 4;
            out.height = bin.readUint(data, offset);
            offset += 4;
            out.depth = data[offset];
            offset++;
            out.ctype = data[offset];
            offset++;
            out.compress = data[offset];
            offset++;
            out.filter = data[offset];
            offset++;
            out.interlace = data[offset];
            offset++;
          };
          UPNG4._bin = {
            nextZero: function(data, p) {
              while (data[p] != 0) p++;
              return p;
            },
            readUshort: function(buff, p) {
              return buff[p] << 8 | buff[p + 1];
            },
            writeUshort: function(buff, p, n) {
              buff[p] = n >> 8 & 255;
              buff[p + 1] = n & 255;
            },
            readUint: function(buff, p) {
              return buff[p] * (256 * 256 * 256) + (buff[p + 1] << 16 | buff[p + 2] << 8 | buff[p + 3]);
            },
            writeUint: function(buff, p, n) {
              buff[p] = n >> 24 & 255;
              buff[p + 1] = n >> 16 & 255;
              buff[p + 2] = n >> 8 & 255;
              buff[p + 3] = n & 255;
            },
            readASCII: function(buff, p, l) {
              var s = "";
              for (var i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
              return s;
            },
            writeASCII: function(data, p, s) {
              for (var i = 0; i < s.length; i++) data[p + i] = s.charCodeAt(i);
            },
            readBytes: function(buff, p, l) {
              var arr = [];
              for (var i = 0; i < l; i++) arr.push(buff[p + i]);
              return arr;
            },
            pad: function(n) {
              return n.length < 2 ? "0" + n : n;
            },
            readUTF8: function(buff, p, l) {
              var s = "", ns;
              for (var i = 0; i < l; i++) s += "%" + UPNG4._bin.pad(buff[p + i].toString(16));
              try {
                ns = decodeURIComponent(s);
              } catch (e) {
                return UPNG4._bin.readASCII(buff, p, l);
              }
              return ns;
            }
          };
          UPNG4._copyTile = function(sb, sw, sh, tb, tw, th, xoff, yoff, mode) {
            var w = Math.min(sw, tw), h = Math.min(sh, th);
            var si = 0, ti = 0;
            for (var y = 0; y < h; y++)
              for (var x = 0; x < w; x++) {
                if (xoff >= 0 && yoff >= 0) {
                  si = y * sw + x << 2;
                  ti = (yoff + y) * tw + xoff + x << 2;
                } else {
                  si = (-yoff + y) * sw - xoff + x << 2;
                  ti = y * tw + x << 2;
                }
                if (mode == 0) {
                  tb[ti] = sb[si];
                  tb[ti + 1] = sb[si + 1];
                  tb[ti + 2] = sb[si + 2];
                  tb[ti + 3] = sb[si + 3];
                } else if (mode == 1) {
                  var fa = sb[si + 3] * (1 / 255), fr = sb[si] * fa, fg = sb[si + 1] * fa, fb = sb[si + 2] * fa;
                  var ba = tb[ti + 3] * (1 / 255), br = tb[ti] * ba, bg = tb[ti + 1] * ba, bb = tb[ti + 2] * ba;
                  var ifa = 1 - fa, oa = fa + ba * ifa, ioa = oa == 0 ? 0 : 1 / oa;
                  tb[ti + 3] = 255 * oa;
                  tb[ti + 0] = (fr + br * ifa) * ioa;
                  tb[ti + 1] = (fg + bg * ifa) * ioa;
                  tb[ti + 2] = (fb + bb * ifa) * ioa;
                } else if (mode == 2) {
                  var fa = sb[si + 3], fr = sb[si], fg = sb[si + 1], fb = sb[si + 2];
                  var ba = tb[ti + 3], br = tb[ti], bg = tb[ti + 1], bb = tb[ti + 2];
                  if (fa == ba && fr == br && fg == bg && fb == bb) {
                    tb[ti] = 0;
                    tb[ti + 1] = 0;
                    tb[ti + 2] = 0;
                    tb[ti + 3] = 0;
                  } else {
                    tb[ti] = fr;
                    tb[ti + 1] = fg;
                    tb[ti + 2] = fb;
                    tb[ti + 3] = fa;
                  }
                } else if (mode == 3) {
                  var fa = sb[si + 3], fr = sb[si], fg = sb[si + 1], fb = sb[si + 2];
                  var ba = tb[ti + 3], br = tb[ti], bg = tb[ti + 1], bb = tb[ti + 2];
                  if (fa == ba && fr == br && fg == bg && fb == bb) continue;
                  if (fa < 220 && ba > 20) return false;
                }
              }
            return true;
          };
          UPNG4.encode = function(bufs, w, h, ps, dels, forbidPlte) {
            if (ps == null) ps = 0;
            if (forbidPlte == null) forbidPlte = false;
            var data = new Uint8Array(bufs[0].byteLength * bufs.length + 100);
            var wr = [137, 80, 78, 71, 13, 10, 26, 10];
            for (var i = 0; i < 8; i++) data[i] = wr[i];
            var offset = 8, bin = UPNG4._bin, crc = UPNG4.crc.crc, wUi = bin.writeUint, wUs = bin.writeUshort, wAs = bin.writeASCII;
            var nimg = UPNG4.encode.compressPNG(bufs, w, h, ps, forbidPlte);
            wUi(data, offset, 13);
            offset += 4;
            wAs(data, offset, "IHDR");
            offset += 4;
            wUi(data, offset, w);
            offset += 4;
            wUi(data, offset, h);
            offset += 4;
            data[offset] = nimg.depth;
            offset++;
            data[offset] = nimg.ctype;
            offset++;
            data[offset] = 0;
            offset++;
            data[offset] = 0;
            offset++;
            data[offset] = 0;
            offset++;
            wUi(data, offset, crc(data, offset - 17, 17));
            offset += 4;
            wUi(data, offset, 1);
            offset += 4;
            wAs(data, offset, "sRGB");
            offset += 4;
            data[offset] = 1;
            offset++;
            wUi(data, offset, crc(data, offset - 5, 5));
            offset += 4;
            var anim = bufs.length > 1;
            if (anim) {
              wUi(data, offset, 8);
              offset += 4;
              wAs(data, offset, "acTL");
              offset += 4;
              wUi(data, offset, bufs.length);
              offset += 4;
              wUi(data, offset, 0);
              offset += 4;
              wUi(data, offset, crc(data, offset - 12, 12));
              offset += 4;
            }
            if (nimg.ctype == 3) {
              var dl = nimg.plte.length;
              wUi(data, offset, dl * 3);
              offset += 4;
              wAs(data, offset, "PLTE");
              offset += 4;
              for (var i = 0; i < dl; i++) {
                var ti = i * 3, c = nimg.plte[i], r = c & 255, g2 = c >> 8 & 255, b = c >> 16 & 255;
                data[offset + ti + 0] = r;
                data[offset + ti + 1] = g2;
                data[offset + ti + 2] = b;
              }
              offset += dl * 3;
              wUi(data, offset, crc(data, offset - dl * 3 - 4, dl * 3 + 4));
              offset += 4;
              if (nimg.gotAlpha) {
                wUi(data, offset, dl);
                offset += 4;
                wAs(data, offset, "tRNS");
                offset += 4;
                for (var i = 0; i < dl; i++) data[offset + i] = nimg.plte[i] >> 24 & 255;
                offset += dl;
                wUi(data, offset, crc(data, offset - dl - 4, dl + 4));
                offset += 4;
              }
            }
            var fi = 0;
            for (var j = 0; j < nimg.frames.length; j++) {
              var fr = nimg.frames[j];
              if (anim) {
                wUi(data, offset, 26);
                offset += 4;
                wAs(data, offset, "fcTL");
                offset += 4;
                wUi(data, offset, fi++);
                offset += 4;
                wUi(data, offset, fr.rect.width);
                offset += 4;
                wUi(data, offset, fr.rect.height);
                offset += 4;
                wUi(data, offset, fr.rect.x);
                offset += 4;
                wUi(data, offset, fr.rect.y);
                offset += 4;
                wUs(data, offset, dels[j]);
                offset += 2;
                wUs(data, offset, 1e3);
                offset += 2;
                data[offset] = fr.dispose;
                offset++;
                data[offset] = fr.blend;
                offset++;
                wUi(data, offset, crc(data, offset - 30, 30));
                offset += 4;
              }
              var imgd = fr.cimg, dl = imgd.length;
              wUi(data, offset, dl + (j == 0 ? 0 : 4));
              offset += 4;
              var ioff = offset;
              wAs(data, offset, j == 0 ? "IDAT" : "fdAT");
              offset += 4;
              if (j != 0) {
                wUi(data, offset, fi++);
                offset += 4;
              }
              for (var i = 0; i < dl; i++) data[offset + i] = imgd[i];
              offset += dl;
              wUi(data, offset, crc(data, ioff, offset - ioff));
              offset += 4;
            }
            wUi(data, offset, 0);
            offset += 4;
            wAs(data, offset, "IEND");
            offset += 4;
            wUi(data, offset, crc(data, offset - 4, 4));
            offset += 4;
            return data.buffer.slice(0, offset);
          };
          UPNG4.encode.compressPNG = function(bufs, w, h, ps, forbidPlte) {
            var out = UPNG4.encode.compress(bufs, w, h, ps, false, forbidPlte);
            for (var i = 0; i < bufs.length; i++) {
              var frm = out.frames[i], nw = frm.rect.width, nh = frm.rect.height, bpl = frm.bpl, bpp = frm.bpp;
              var fdata = new Uint8Array(nh * bpl + nh);
              frm.cimg = UPNG4.encode._filterZero(frm.img, nh, bpp, bpl, fdata);
            }
            return out;
          };
          UPNG4.encode.compress = function(bufs, w, h, ps, forGIF, forbidPlte) {
            if (forbidPlte == null) forbidPlte = false;
            var ctype = 6, depth = 8, bpp = 4, alphaAnd = 255;
            for (var j = 0; j < bufs.length; j++) {
              var img = new Uint8Array(bufs[j]), ilen = img.length;
              for (var i = 0; i < ilen; i += 4) alphaAnd &= img[i + 3];
            }
            var gotAlpha = alphaAnd != 255;
            var cmap = {}, plte = [];
            if (bufs.length != 0) {
              cmap[0] = 0;
              plte.push(0);
              if (ps != 0) ps--;
            }
            if (ps != 0) {
              var qres = UPNG4.quantize(bufs, ps, forGIF);
              bufs = qres.bufs;
              for (var i = 0; i < qres.plte.length; i++) {
                var c = qres.plte[i].est.rgba;
                if (cmap[c] == null) {
                  cmap[c] = plte.length;
                  plte.push(c);
                }
              }
            } else {
              for (var j = 0; j < bufs.length; j++) {
                var img32 = new Uint32Array(bufs[j]), ilen = img32.length;
                for (var i = 0; i < ilen; i++) {
                  var c = img32[i];
                  if ((i < w || c != img32[i - 1] && c != img32[i - w]) && cmap[c] == null) {
                    cmap[c] = plte.length;
                    plte.push(c);
                    if (plte.length >= 300) break;
                  }
                }
              }
            }
            var brute = gotAlpha ? forGIF : false;
            var cc = plte.length;
            if (cc <= 256 && forbidPlte == false) {
              if (cc <= 2) depth = 1;
              else if (cc <= 4) depth = 2;
              else if (cc <= 16) depth = 4;
              else depth = 8;
              if (forGIF) depth = 8;
              gotAlpha = true;
            }
            var frms = [];
            for (var j = 0; j < bufs.length; j++) {
              var cimg = new Uint8Array(bufs[j]), cimg32 = new Uint32Array(cimg.buffer);
              var nx = 0, ny = 0, nw = w, nh = h, blend = 0;
              if (j != 0 && !brute) {
                var tlim = forGIF || j == 1 || frms[frms.length - 2].dispose == 2 ? 1 : 2, tstp = 0, tarea = 1e9;
                for (var it = 0; it < tlim; it++) {
                  var pimg = new Uint8Array(bufs[j - 1 - it]), p32 = new Uint32Array(bufs[j - 1 - it]);
                  var mix = w, miy = h, max = -1, may = -1;
                  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
                    var i = y * w + x;
                    if (cimg32[i] != p32[i]) {
                      if (x < mix) mix = x;
                      if (x > max) max = x;
                      if (y < miy) miy = y;
                      if (y > may) may = y;
                    }
                  }
                  var sarea = max == -1 ? 1 : (max - mix + 1) * (may - miy + 1);
                  if (sarea < tarea) {
                    tarea = sarea;
                    tstp = it;
                    if (max == -1) {
                      nx = ny = 0;
                      nw = nh = 1;
                    } else {
                      nx = mix;
                      ny = miy;
                      nw = max - mix + 1;
                      nh = may - miy + 1;
                    }
                  }
                }
                var pimg = new Uint8Array(bufs[j - 1 - tstp]);
                if (tstp == 1) frms[frms.length - 1].dispose = 2;
                var nimg = new Uint8Array(nw * nh * 4), nimg32 = new Uint32Array(nimg.buffer);
                UPNG4._copyTile(pimg, w, h, nimg, nw, nh, -nx, -ny, 0);
                if (UPNG4._copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 3)) {
                  UPNG4._copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 2);
                  blend = 1;
                } else {
                  UPNG4._copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 0);
                  blend = 0;
                }
                cimg = nimg;
                cimg32 = new Uint32Array(cimg.buffer);
              }
              var bpl = 4 * nw;
              if (cc <= 256 && forbidPlte == false) {
                bpl = Math.ceil(depth * nw / 8);
                var nimg = new Uint8Array(bpl * nh);
                for (var y = 0; y < nh; y++) {
                  var i = y * bpl, ii = y * nw;
                  if (depth == 8) for (var x = 0; x < nw; x++) nimg[i + x] = cmap[cimg32[ii + x]];
                  else if (depth == 4) for (var x = 0; x < nw; x++) nimg[i + (x >> 1)] |= cmap[cimg32[ii + x]] << 4 - (x & 1) * 4;
                  else if (depth == 2) for (var x = 0; x < nw; x++) nimg[i + (x >> 2)] |= cmap[cimg32[ii + x]] << 6 - (x & 3) * 2;
                  else if (depth == 1) for (var x = 0; x < nw; x++) nimg[i + (x >> 3)] |= cmap[cimg32[ii + x]] << 7 - (x & 7) * 1;
                }
                cimg = nimg;
                ctype = 3;
                bpp = 1;
              } else if (gotAlpha == false && bufs.length == 1) {
                var nimg = new Uint8Array(nw * nh * 3), area = nw * nh;
                for (var i = 0; i < area; i++) {
                  var ti = i * 3, qi = i * 4;
                  nimg[ti] = cimg[qi];
                  nimg[ti + 1] = cimg[qi + 1];
                  nimg[ti + 2] = cimg[qi + 2];
                }
                cimg = nimg;
                ctype = 2;
                bpp = 3;
                bpl = 3 * nw;
              }
              frms.push({ rect: { x: nx, y: ny, width: nw, height: nh }, img: cimg, bpl, bpp, blend, dispose: brute ? 1 : 0 });
            }
            return { ctype, depth, plte, gotAlpha, frames: frms };
          };
          UPNG4.encode._filterZero = function(img, h, bpp, bpl, data) {
            var fls = [];
            for (var t = 0; t < 5; t++) {
              if (h * bpl > 5e5 && (t == 2 || t == 3 || t == 4)) continue;
              for (var y = 0; y < h; y++) UPNG4.encode._filterLine(data, img, y, bpl, bpp, t);
              fls.push(pako2["deflate"](data));
              if (bpp == 1) break;
            }
            var ti, tsize = 1e9;
            for (var i = 0; i < fls.length; i++) if (fls[i].length < tsize) {
              ti = i;
              tsize = fls[i].length;
            }
            return fls[ti];
          };
          UPNG4.encode._filterLine = function(data, img, y, bpl, bpp, type) {
            var i = y * bpl, di = i + y, paeth2 = UPNG4.decode._paeth;
            data[di] = type;
            di++;
            if (type == 0) for (var x = 0; x < bpl; x++) data[di + x] = img[i + x];
            else if (type == 1) {
              for (var x = 0; x < bpp; x++) data[di + x] = img[i + x];
              for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - img[i + x - bpp] + 256 & 255;
            } else if (y == 0) {
              for (var x = 0; x < bpp; x++) data[di + x] = img[i + x];
              if (type == 2) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x];
              if (type == 3) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - (img[i + x - bpp] >> 1) + 256 & 255;
              if (type == 4) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - paeth2(img[i + x - bpp], 0, 0) + 256 & 255;
            } else {
              if (type == 2) {
                for (var x = 0; x < bpl; x++) data[di + x] = img[i + x] + 256 - img[i + x - bpl] & 255;
              }
              if (type == 3) {
                for (var x = 0; x < bpp; x++) data[di + x] = img[i + x] + 256 - (img[i + x - bpl] >> 1) & 255;
                for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] + 256 - (img[i + x - bpl] + img[i + x - bpp] >> 1) & 255;
              }
              if (type == 4) {
                for (var x = 0; x < bpp; x++) data[di + x] = img[i + x] + 256 - paeth2(0, img[i + x - bpl], 0) & 255;
                for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] + 256 - paeth2(img[i + x - bpp], img[i + x - bpl], img[i + x - bpp - bpl]) & 255;
              }
            }
          };
          UPNG4.crc = {
            table: function() {
              var tab = new Uint32Array(256);
              for (var n = 0; n < 256; n++) {
                var c = n;
                for (var k = 0; k < 8; k++) {
                  if (c & 1) c = 3988292384 ^ c >>> 1;
                  else c = c >>> 1;
                }
                tab[n] = c;
              }
              return tab;
            }(),
            update: function(c, buf, off, len) {
              for (var i = 0; i < len; i++) c = UPNG4.crc.table[(c ^ buf[off + i]) & 255] ^ c >>> 8;
              return c;
            },
            crc: function(b, o, l) {
              return UPNG4.crc.update(4294967295, b, o, l) ^ 4294967295;
            }
          };
          UPNG4.quantize = function(bufs, ps, roundAlpha) {
            var imgs = [], totl = 0;
            for (var i = 0; i < bufs.length; i++) {
              imgs.push(UPNG4.encode.alphaMul(new Uint8Array(bufs[i]), roundAlpha));
              totl += bufs[i].byteLength;
            }
            var nimg = new Uint8Array(totl), nimg32 = new Uint32Array(nimg.buffer), noff = 0;
            for (var i = 0; i < imgs.length; i++) {
              var img = imgs[i], il = img.length;
              for (var j = 0; j < il; j++) nimg[noff + j] = img[j];
              noff += il;
            }
            var root = { i0: 0, i1: nimg.length, bst: null, est: null, tdst: 0, left: null, right: null };
            root.bst = UPNG4.quantize.stats(nimg, root.i0, root.i1);
            root.est = UPNG4.quantize.estats(root.bst);
            var leafs = [root];
            while (leafs.length < ps) {
              var maxL = 0, mi = 0;
              for (var i = 0; i < leafs.length; i++) if (leafs[i].est.L > maxL) {
                maxL = leafs[i].est.L;
                mi = i;
              }
              if (maxL < 1e-3) break;
              var node = leafs[mi];
              var s0 = UPNG4.quantize.splitPixels(nimg, nimg32, node.i0, node.i1, node.est.e, node.est.eMq255);
              var ln = { i0: node.i0, i1: s0, bst: null, est: null, tdst: 0, left: null, right: null };
              ln.bst = UPNG4.quantize.stats(nimg, ln.i0, ln.i1);
              ln.est = UPNG4.quantize.estats(ln.bst);
              var rn = { i0: s0, i1: node.i1, bst: null, est: null, tdst: 0, left: null, right: null };
              rn.bst = { R: [], m: [], N: node.bst.N - ln.bst.N };
              for (var i = 0; i < 16; i++) rn.bst.R[i] = node.bst.R[i] - ln.bst.R[i];
              for (var i = 0; i < 4; i++) rn.bst.m[i] = node.bst.m[i] - ln.bst.m[i];
              rn.est = UPNG4.quantize.estats(rn.bst);
              node.left = ln;
              node.right = rn;
              leafs[mi] = ln;
              leafs.push(rn);
            }
            leafs.sort(function(a2, b2) {
              return b2.bst.N - a2.bst.N;
            });
            for (var ii = 0; ii < imgs.length; ii++) {
              var planeDst = UPNG4.quantize.planeDst;
              var sb = new Uint8Array(imgs[ii].buffer), tb = new Uint32Array(imgs[ii].buffer), len = sb.length;
              var stack = [], si = 0;
              for (var i = 0; i < len; i += 4) {
                var r = sb[i] * (1 / 255), g2 = sb[i + 1] * (1 / 255), b = sb[i + 2] * (1 / 255), a = sb[i + 3] * (1 / 255);
                var nd = root;
                while (nd.left) nd = planeDst(nd.est, r, g2, b, a) <= 0 ? nd.left : nd.right;
                tb[i >> 2] = nd.est.rgba;
              }
              imgs[ii] = tb.buffer;
            }
            return { bufs: imgs, plte: leafs };
          };
          UPNG4.quantize.getNearest = function(nd, r, g2, b, a) {
            if (nd.left == null) {
              nd.tdst = UPNG4.quantize.dist(nd.est.q, r, g2, b, a);
              return nd;
            }
            var planeDst = UPNG4.quantize.planeDst(nd.est, r, g2, b, a);
            var node0 = nd.left, node1 = nd.right;
            if (planeDst > 0) {
              node0 = nd.right;
              node1 = nd.left;
            }
            var ln = UPNG4.quantize.getNearest(node0, r, g2, b, a);
            if (ln.tdst <= planeDst * planeDst) return ln;
            var rn = UPNG4.quantize.getNearest(node1, r, g2, b, a);
            return rn.tdst < ln.tdst ? rn : ln;
          };
          UPNG4.quantize.planeDst = function(est, r, g2, b, a) {
            var e = est.e;
            return e[0] * r + e[1] * g2 + e[2] * b + e[3] * a - est.eMq;
          };
          UPNG4.quantize.dist = function(q, r, g2, b, a) {
            var d0 = r - q[0], d1 = g2 - q[1], d2 = b - q[2], d3 = a - q[3];
            return d0 * d0 + d1 * d1 + d2 * d2 + d3 * d3;
          };
          UPNG4.quantize.splitPixels = function(nimg, nimg32, i0, i1, e, eMq) {
            var vecDot = UPNG4.quantize.vecDot;
            i1 -= 4;
            var shfs = 0;
            while (i0 < i1) {
              while (vecDot(nimg, i0, e) <= eMq) i0 += 4;
              while (vecDot(nimg, i1, e) > eMq) i1 -= 4;
              if (i0 >= i1) break;
              var t = nimg32[i0 >> 2];
              nimg32[i0 >> 2] = nimg32[i1 >> 2];
              nimg32[i1 >> 2] = t;
              i0 += 4;
              i1 -= 4;
            }
            while (vecDot(nimg, i0, e) > eMq) i0 -= 4;
            return i0 + 4;
          };
          UPNG4.quantize.vecDot = function(nimg, i, e) {
            return nimg[i] * e[0] + nimg[i + 1] * e[1] + nimg[i + 2] * e[2] + nimg[i + 3] * e[3];
          };
          UPNG4.quantize.stats = function(nimg, i0, i1) {
            var R = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            var m = [0, 0, 0, 0];
            var N = i1 - i0 >> 2;
            for (var i = i0; i < i1; i += 4) {
              var r = nimg[i] * (1 / 255), g2 = nimg[i + 1] * (1 / 255), b = nimg[i + 2] * (1 / 255), a = nimg[i + 3] * (1 / 255);
              m[0] += r;
              m[1] += g2;
              m[2] += b;
              m[3] += a;
              R[0] += r * r;
              R[1] += r * g2;
              R[2] += r * b;
              R[3] += r * a;
              R[5] += g2 * g2;
              R[6] += g2 * b;
              R[7] += g2 * a;
              R[10] += b * b;
              R[11] += b * a;
              R[15] += a * a;
            }
            R[4] = R[1];
            R[8] = R[2];
            R[12] = R[3];
            R[9] = R[6];
            R[13] = R[7];
            R[14] = R[11];
            return { R, m, N };
          };
          UPNG4.quantize.estats = function(stats) {
            var R = stats.R, m = stats.m, N = stats.N;
            var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3], iN = N == 0 ? 0 : 1 / N;
            var Rj = [
              R[0] - m0 * m0 * iN,
              R[1] - m0 * m1 * iN,
              R[2] - m0 * m2 * iN,
              R[3] - m0 * m3 * iN,
              R[4] - m1 * m0 * iN,
              R[5] - m1 * m1 * iN,
              R[6] - m1 * m2 * iN,
              R[7] - m1 * m3 * iN,
              R[8] - m2 * m0 * iN,
              R[9] - m2 * m1 * iN,
              R[10] - m2 * m2 * iN,
              R[11] - m2 * m3 * iN,
              R[12] - m3 * m0 * iN,
              R[13] - m3 * m1 * iN,
              R[14] - m3 * m2 * iN,
              R[15] - m3 * m3 * iN
            ];
            var A = Rj, M = UPNG4.M4;
            var b = [0.5, 0.5, 0.5, 0.5], mi = 0, tmi = 0;
            if (N != 0)
              for (var i = 0; i < 10; i++) {
                b = M.multVec(A, b);
                tmi = Math.sqrt(M.dot(b, b));
                b = M.sml(1 / tmi, b);
                if (Math.abs(tmi - mi) < 1e-9) break;
                mi = tmi;
              }
            var q = [m0 * iN, m1 * iN, m2 * iN, m3 * iN];
            var eMq255 = M.dot(M.sml(255, q), b);
            var ia = q[3] < 1e-3 ? 0 : 1 / q[3];
            return {
              Cov: Rj,
              q,
              e: b,
              L: mi,
              eMq255,
              eMq: M.dot(b, q),
              rgba: (Math.round(255 * q[3]) << 24 | Math.round(255 * q[2] * ia) << 16 | Math.round(255 * q[1] * ia) << 8 | Math.round(255 * q[0] * ia) << 0) >>> 0
            };
          };
          UPNG4.M4 = {
            multVec: function(m, v) {
              return [
                m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
                m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
                m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
                m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3]
              ];
            },
            dot: function(x, y) {
              return x[0] * y[0] + x[1] * y[1] + x[2] * y[2] + x[3] * y[3];
            },
            sml: function(a, y) {
              return [a * y[0], a * y[1], a * y[2], a * y[3]];
            }
          };
          UPNG4.encode.alphaMul = function(img, roundA) {
            var nimg = new Uint8Array(img.length), area = img.length >> 2;
            for (var i = 0; i < area; i++) {
              var qi = i << 2, ia = img[qi + 3];
              if (roundA) ia = ia < 128 ? 0 : 255;
              var a = ia * (1 / 255);
              nimg[qi + 0] = img[qi + 0] * a;
              nimg[qi + 1] = img[qi + 1] * a;
              nimg[qi + 2] = img[qi + 2] * a;
              nimg[qi + 3] = ia;
            }
            return nimg;
          };
        })(UPNG3, pako);
      })();
    }
  });

  // ../../packages/browser/src/buffer-polyfill.ts
  var import_buffer = __toESM(require_buffer(), 1);
  var g = globalThis;
  if (typeof g.Buffer === "undefined") {
    g.Buffer = import_buffer.Buffer;
  }

  // ../../packages/core/src/compressors/types.ts
  var AbstractCompressor = class {
    /** Tunable options for this compressor (level etc.). Subclasses override. */
    static optionsSchema = {};
    /** Compressor family id (e.g. 'brotli', 'deflate', 'none'). Subclasses override. */
    static familyId = "none";
    /** Short human-readable explanation for UI tooltips. Subclasses override. */
    static description = "";
    /**
     * Web Streams streaming-decompress entry point. Browser compressors
     * override with `pipeThrough(new DecompressionStream(...))`; Node-side
     * compressors can adapt their `Transform` via `Duplex.toWeb()`.
     *
     * Default implementation buffers the entire input then runs `decompress` —
     * keeps the contract uniform for compressors without a true streaming
     * decoder. The Algorithm.decodeStream orchestrator pipes
     * codec-data-bytes through this; full streaming requires an override.
     */
    decompressWebStream(input, meta) {
      const decompress = this.decompress.bind(this);
      return new ReadableStream({
        async start(controller) {
          const reader = input.getReader();
          const chunks = [];
          let total = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            total += value.byteLength;
          }
          const merged = new Uint8Array(total);
          let offset = 0;
          for (const c of chunks) {
            merged.set(c, offset);
            offset += c.byteLength;
          }
          const decompressed = await decompress(
            Buffer.from(merged.buffer, merged.byteOffset, merged.byteLength),
            meta
          );
          controller.enqueue(
            new Uint8Array(decompressed.buffer, decompressed.byteOffset, decompressed.byteLength)
          );
          controller.close();
        }
      });
    }
  };

  // ../../packages/core/src/compressors/none-compressor.ts
  var NoneCompressor = class extends AbstractCompressor {
    static description = "No outer compression \u2014 input bytes go directly into pixels.";
    id = "none";
    label = "None";
    headerLevel = 0;
    streamableDecode = true;
    requiresFullHeader = false;
    async compress(input) {
      return { data: input, level: 0, uncompressedLength: 0 };
    }
    async decompress(input) {
      return input;
    }
    decompressWebStream(input) {
      return input;
    }
  };

  // ../../packages/core/src/compressors/registry.ts
  function levelValues(Ctor) {
    const levelOpt = Ctor.optionsSchema?.level;
    if (!levelOpt || !levelOpt.values) return [];
    return levelOpt.values;
  }
  function instantiate(Ctor, level) {
    if (Ctor.fromOptions) return Ctor.fromOptions(level !== void 0 ? { level } : {});
    return new Ctor();
  }
  var CompressorRegistry = class {
    classes = /* @__PURE__ */ new Map();
    constructor() {
      this.register(NoneCompressor);
    }
    /** Register a compressor class. Idempotent on duplicate family. */
    register(Ctor) {
      if (this.classes.has(Ctor.familyId)) return;
      this.classes.set(Ctor.familyId, Ctor);
    }
    has(mode) {
      if (!mode || mode === "none") return true;
      const dashIdx = mode.lastIndexOf("-");
      if (dashIdx <= 0) return this.classes.has(mode);
      const familyId = mode.slice(0, dashIdx);
      const level = Number(mode.slice(dashIdx + 1));
      const Ctor = this.classes.get(familyId);
      if (!Ctor) return false;
      return levelValues(Ctor).includes(level);
    }
    byMode(mode) {
      if (!mode || mode === "none") return new NoneCompressor();
      const dashIdx = mode.lastIndexOf("-");
      if (dashIdx <= 0) {
        const Ctor2 = this.classes.get(mode);
        return Ctor2 ? instantiate(Ctor2) : new NoneCompressor();
      }
      const familyId = mode.slice(0, dashIdx);
      const level = Number(mode.slice(dashIdx + 1));
      const Ctor = this.classes.get(familyId);
      if (!Ctor) return new NoneCompressor();
      return instantiate(Ctor, level);
    }
    byHeaderLevel(level) {
      for (const Ctor of this.classes.values()) {
        const levels = levelValues(Ctor);
        if (levels.length === 0) {
          const probe = instantiate(Ctor);
          if (probe.headerLevel === level) return probe;
          continue;
        }
        for (const lv of levels) {
          const inst = instantiate(Ctor, lv);
          if (inst.headerLevel === level) return inst;
        }
      }
      return new NoneCompressor();
    }
    /** All concrete instances expanded across (family × level). */
    list() {
      const out = [];
      for (const Ctor of this.classes.values()) {
        const levels = levelValues(Ctor);
        if (levels.length === 0) {
          out.push(instantiate(Ctor));
          continue;
        }
        for (const lv of levels) out.push(instantiate(Ctor, lv));
      }
      return out;
    }
    /** Class-level metadata: one Ctor per family. Use for dashboard option rendering. */
    listFamilies() {
      return [...this.classes.values()];
    }
    listModes() {
      return this.list().map((c) => c.id);
    }
  };
  var compressorRegistry = new CompressorRegistry();

  // ../../packages/core/src/surfaces/registry.ts
  var SurfaceRegistry = class {
    factories = /* @__PURE__ */ new Map();
    register(id, factory) {
      if (this.factories.has(id)) return;
      this.factories.set(id, factory);
    }
    has(id) {
      return this.factories.has(id);
    }
    byId(id) {
      const factory = this.factories.get(id);
      if (!factory) throw new Error(`Unknown surface id: ${id}. No env package registered it.`);
      return factory();
    }
    byFormat(format, streaming = false) {
      if (format === "png" && streaming) return this.byId("png-stream");
      return this.byId(format);
    }
    byExtension(extension) {
      const normalized = extension.toLowerCase();
      for (const [, factory] of this.factories) {
        const surface = factory();
        if (surface.extension === normalized && !surface.streamable) return surface;
      }
      return this.byId("png");
    }
    /** All non-streaming surfaces that match a given extension, in registration
     *  order. Used by detection when the first surface fails — e.g. an upng-js
     *  encoded PNG with 4 channels can confuse pngjs/sharp because of alpha
     *  premultiplication, but upng-js itself reads it byte-exact. */
    listForExtension(extension) {
      const normalized = extension.toLowerCase();
      const out = [];
      for (const [, factory] of this.factories) {
        const surface = factory();
        if (surface.extension === normalized && !surface.streamable) out.push(surface);
      }
      return out;
    }
    list() {
      return [...this.factories.values()].map((f) => f());
    }
    listIds() {
      return [...this.factories.keys()];
    }
  };
  var surfaceRegistry = new SurfaceRegistry();

  // ../../packages/core/src/components/options.ts
  function enumOption(values, default_, meta = {}) {
    return { type: "enum", values, default: default_, ...meta };
  }
  function numberOption(range, default_, meta = {}) {
    return { type: "number", range, default: default_, ...meta };
  }
  function colorOption(default_, meta = {}) {
    return { type: "color", default: default_, ...meta };
  }

  // ../../packages/browser/src/compressors/brotli-compressor.ts
  var HEADER_LEVEL = {
    "brotli-4": 5,
    "brotli-6": 6,
    "brotli-11": 2
  };
  async function streamThrough(transform) {
    const reader = transform.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return out;
  }
  function makeStream(input) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(input);
        controller.close();
      }
    });
  }
  var BrowserBrotliCompressor = class _BrowserBrotliCompressor extends AbstractCompressor {
    static familyId = "brotli";
    static description = "Brotli \u2014 strongest ratio (~15% smaller than deflate-9), slow encode at quality 11. Server-only on the browser side (no native CompressionStream).";
    static optionsSchema = {
      level: enumOption([4, 6, 11], 11, { label: "Quality level" })
    };
    static fromOptions(opts = {}) {
      const level = opts.level ?? 11;
      return new _BrowserBrotliCompressor(`brotli-${level}`);
    }
    id;
    label;
    streamableDecode = true;
    headerLevel;
    requiresFullHeader;
    constructor(mode) {
      super();
      this.id = mode;
      this.label = `Brotli ${mode.split("-")[1]} (browser, decode-only)`;
      this.headerLevel = HEADER_LEVEL[mode];
      this.requiresFullHeader = mode !== "brotli-11";
    }
    async compress(_input) {
      throw new Error(
        `Brotli encoding is unavailable in the browser (CompressionStream('br') is not implemented). Encode in Node and decode in the browser, or pick a deflate-* mode for browser-side encoding.`
      );
    }
    async decompress(input) {
      if (typeof DecompressionStream === "undefined") {
        throw new Error(
          `DecompressionStream is unavailable in this browser. Brotli decoding requires a recent Chrome/Edge (118+), Firefox (113+) or Safari (17.4+).`
        );
      }
      const stream = makeStream(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
      const Decompress = DecompressionStream;
      const decompressed = await streamThrough(stream.pipeThrough(new Decompress("br")));
      return Buffer.from(decompressed);
    }
    decompressWebStream(input) {
      if (typeof DecompressionStream === "undefined") {
        throw new Error(
          `DecompressionStream is unavailable. Brotli streaming requires Chrome 118+ / Firefox 113+ / Safari 17.4+.`
        );
      }
      const Decompress = DecompressionStream;
      return input.pipeThrough(new Decompress("br"));
    }
  };

  // ../../packages/browser/src/compressors/deflate-compressor.ts
  var HEADER_LEVEL2 = {
    "deflate-1": 3,
    "deflate-6": 1,
    "deflate-9": 4
  };
  async function streamThrough2(transform) {
    const reader = transform.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    if (chunks.length === 1) return chunks[0];
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return out;
  }
  function makeStream2(input) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(input);
        controller.close();
      }
    });
  }
  var BrowserDeflateCompressor = class _BrowserDeflateCompressor extends AbstractCompressor {
    static familyId = "deflate";
    static description = "Deflate (zlib) \u2014 universal browser support via CompressionStream, fast encode, decent ratio. Default for browser-encodable algorithms.";
    static optionsSchema = {
      level: enumOption([1, 6, 9], 9, { label: "Compression level" })
    };
    static fromOptions(opts = {}) {
      const level = opts.level ?? 9;
      return new _BrowserDeflateCompressor(`deflate-${level}`);
    }
    id;
    label;
    streamableDecode = true;
    headerLevel;
    requiresFullHeader = true;
    constructor(mode) {
      super();
      this.id = mode;
      this.label = `Deflate ${mode.split("-")[1]} (browser)`;
      this.headerLevel = HEADER_LEVEL2[mode];
    }
    async compress(input) {
      const stream = makeStream2(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
      const compressed = await streamThrough2(
        stream.pipeThrough(new CompressionStream("deflate"))
      );
      return {
        data: Buffer.from(compressed.buffer, compressed.byteOffset, compressed.byteLength),
        level: this.headerLevel,
        uncompressedLength: input.length
      };
    }
    async decompress(input) {
      const stream = makeStream2(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
      const decompressed = await streamThrough2(
        stream.pipeThrough(new DecompressionStream("deflate"))
      );
      return Buffer.from(decompressed.buffer, decompressed.byteOffset, decompressed.byteLength);
    }
    decompressWebStream(input) {
      return input.pipeThrough(
        new DecompressionStream("deflate")
      );
    }
  };

  // ../../packages/core/src/surfaces/channels.ts
  var CHANNELS = 3;
  function toFileChannels(pixels, n, bpp, fc) {
    if (bpp === fc) return pixels;
    const out = new Uint8Array(n * fc);
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < Math.min(bpp, fc); c++) {
        out[i * fc + c] = pixels[i * bpp + c];
      }
      if (fc === 4 && bpp < 4) out[i * 4 + 3] = 255;
    }
    return out;
  }
  function fromFileChannels(pixels, n, fc, bpp) {
    if (bpp === fc) return pixels;
    const out = new Uint8Array(n * bpp);
    if (bpp === 3 && fc === 4) {
      for (let i = 0; i < n; i++) {
        out[i * 3] = pixels[i * 4];
        out[i * 3 + 1] = pixels[i * 4 + 1];
        out[i * 3 + 2] = pixels[i * 4 + 2];
      }
      return out;
    }
    const minCh = Math.min(bpp, fc);
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < minCh; c++) out[i * bpp + c] = pixels[i * fc + c];
    }
    return out;
  }

  // ../../packages/core/src/surfaces/types.ts
  var AbstractSurface = class {
    /** Tunable options for this surface (channels, etc.). Subclasses override. */
    static optionsSchema = {};
    /**
     * Streaming decode entry point. The Algorithm calls this when it wants to
     * pipeline decompression / codec work with the network transfer; the
     * surface owns the container-format parsing and yields raw pixel rows.
     *
     * Default implementation buffers the entire stream and then yields one
     * "row" containing the whole image — appropriate for surfaces that don't
     * have a streaming decoder (WebP, AVIF, plain canvas-based PNG). True
     * streaming surfaces (`StreamingPngSurface`) override this with a
     * chunk-by-chunk parser.
     */
    async decodeStream(stream) {
      const buffer = await readAllToBuffer(stream);
      const image = await this.readBuffer(buffer);
      const rows = async function* () {
        yield image.pixels;
      }();
      return {
        width: image.width,
        height: image.height,
        fileChannels: image.fileChannels,
        rows
      };
    }
    coerceBpp(bpp) {
      return bpp > this.maxBpp ? this.maxBpp : bpp;
    }
  };
  async function readAllToBuffer(stream) {
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.byteLength;
    }
    return Buffer.from(out.buffer, out.byteOffset, out.byteLength);
  }

  // ../../packages/core/src/surfaces/image-surface.ts
  var ImageSurface = class extends AbstractSurface {
    id;
    label;
    description;
    format;
    extension;
    mimeType;
    inputKind = "raster-pixels";
    lossless = true;
    streamable;
    supportedChannels = /* @__PURE__ */ new Set([3, 4]);
    preservesAlpha;
    maxBpp;
    constructor(init) {
      super();
      this.id = init.id;
      this.label = init.label;
      this.description = init.description ?? "";
      this.format = init.format;
      this.extension = init.extension;
      this.mimeType = init.mimeType;
      this.streamable = init.streamable ?? false;
      this.preservesAlpha = init.preservesAlpha ?? init.format !== "webp";
      this.maxBpp = init.maxBpp ?? 4;
    }
  };

  // ../../packages/core/src/surfaces/streaming-png-decoder.ts
  async function decodeStreamingPng(stream) {
    const reader = stream.getReader();
    const input = new ByteQueue();
    let chunkHeader = null;
    let pngState = "sig";
    let width = 0;
    let height = 0;
    let fileChannels = 3;
    let scanlineLen = 0;
    let prevLine = new Uint8Array(0);
    const scanlineQueue = [];
    let scanlineQueueBytes = 0;
    function takeScanline() {
      if (scanlineLen === 0 || scanlineQueueBytes < scanlineLen) return null;
      const out = new Uint8Array(scanlineLen);
      let written = 0;
      while (written < scanlineLen) {
        const head = scanlineQueue[0];
        const need = scanlineLen - written;
        if (head.byteLength <= need) {
          out.set(head, written);
          written += head.byteLength;
          scanlineQueueBytes -= head.byteLength;
          scanlineQueue.shift();
        } else {
          out.set(head.subarray(0, need), written);
          written += need;
          scanlineQueueBytes -= need;
          scanlineQueue[0] = head.subarray(need);
        }
      }
      return out;
    }
    const readyRows = [];
    let pngDone = false;
    let failure;
    let wake;
    const notify = () => {
      const resolve = wake;
      wake = void 0;
      resolve?.();
    };
    let idatInflate = null;
    let ihdrResolve;
    const ihdrReady = new Promise((r) => {
      ihdrResolve = r;
    });
    let ihdrSeen = false;
    function onScanlineBytes(chunk) {
      scanlineQueue.push(chunk);
      scanlineQueueBytes += chunk.byteLength;
      while (true) {
        const row = takeScanline();
        if (!row) break;
        const filterByte = row[0];
        const line = unfilterInPlace(row, filterByte, prevLine, fileChannels);
        prevLine = line;
        readyRows.push(line);
        notify();
      }
    }
    async function parsePng() {
      while (true) {
        if (pngState === "sig") {
          if (input.length < 8) return;
          const signature = input.take(8);
          if (!signature.every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index])) {
            throw new Error("decodeStreamingPng: invalid PNG signature");
          }
          pngState = "chunk";
        }
        if (pngState === "chunk") {
          if (!chunkHeader) {
            if (input.length < 8) return;
            const header = input.take(8);
            chunkHeader = {
              length: readUint32BE(header, 0),
              type: String.fromCharCode(...header.subarray(4, 8))
            };
          }
          const { length: len, type } = chunkHeader;
          if (input.length < len + 4) return;
          const data = input.take(len);
          input.take(4);
          chunkHeader = null;
          if (type === "IHDR") {
            width = readUint32BE(data, 0);
            height = readUint32BE(data, 4);
            fileChannels = data[9] === 6 ? 4 : 3;
            scanlineLen = 1 + width * fileChannels;
            prevLine = new Uint8Array(width * fileChannels);
            if (!ihdrSeen) {
              ihdrSeen = true;
              ihdrResolve();
            }
          } else if (type === "IDAT") {
            if (!idatInflate) idatInflate = makeInflate(onScanlineBytes);
            await writeChunk(idatInflate.writer, data);
          } else if (type === "IEND") {
            pngState = "done";
            if (idatInflate) {
              await idatInflate.writer.close();
              await idatInflate.pump;
            }
            return;
          }
        }
        if (pngState === "done") return;
      }
    }
    const pumpDone = (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          input.push(value);
          await parsePng();
          if (pngState === "done") break;
        }
        if (pngState !== "done")
          throw new Error("decodeStreamingPng: truncated PNG before IEND");
      } catch (error) {
        failure = error;
        const handle = idatInflate;
        if (handle) await handle.writer.abort(error).catch(() => void 0);
      } finally {
        pngDone = true;
        notify();
        await reader.cancel().catch(() => void 0);
        reader.releaseLock();
      }
    })();
    await Promise.race([ihdrReady, pumpDone]);
    if (!ihdrSeen) throw failure ?? new Error("decodeStreamingPng: input ended before PNG IHDR");
    const rows = async function* () {
      try {
        while (true) {
          if (failure) throw failure;
          const batch = readyRows.splice(0);
          for (const row of batch) yield row;
          if (failure) throw failure;
          if (pngDone && readyRows.length === 0) return;
          if (readyRows.length === 0)
            await new Promise((resolve) => {
              wake = resolve;
            });
        }
      } finally {
        if (!pngDone) await reader.cancel().catch(() => void 0);
      }
    }();
    return { width, height, fileChannels, rows };
  }
  function makeInflate(onChunk) {
    const ds = new DecompressionStream("deflate");
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    const pump = (async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onChunk(value);
      }
    })();
    pump.catch(() => void 0);
    return { writer, pump };
  }
  async function writeChunk(writer, chunk) {
    await writer.write(chunk);
  }
  function unfilterInPlace(row, filterType, prev, channels) {
    const len = row.byteLength - 1;
    if (filterType === 0) return row.subarray(1);
    for (let i = 0; i < len; i++) {
      const idx = 1 + i;
      const a = i >= channels ? row[idx - channels] : 0;
      const b = prev[i] ?? 0;
      const c = i >= channels ? prev[i - channels] ?? 0 : 0;
      if (filterType === 1) row[idx] = row[idx] + a & 255;
      else if (filterType === 2) row[idx] = row[idx] + b & 255;
      else if (filterType === 3) row[idx] = row[idx] + (a + b >>> 1) & 255;
      else if (filterType === 4) row[idx] = row[idx] + paeth(a, b, c) & 255;
    }
    return row.subarray(1);
  }
  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  }
  function readUint32BE(buf, offset) {
    return (buf[offset] << 24 | buf[offset + 1] << 16 | buf[offset + 2] << 8 | buf[offset + 3]) >>> 0;
  }
  var ByteQueue = class {
    chunks = [];
    index = 0;
    length = 0;
    push(bytes) {
      if (bytes.length) {
        this.chunks.push(bytes);
        this.length += bytes.length;
      }
    }
    take(size) {
      if (size === 0) return new Uint8Array(0);
      const head = this.chunks[this.index];
      let out;
      if (head.length >= size) {
        out = head.subarray(0, size);
        if (head.length === size) this.index++;
        else this.chunks[this.index] = head.subarray(size);
      } else {
        out = new Uint8Array(size);
        let written = 0;
        while (written < size) {
          const chunk = this.chunks[this.index];
          const count = Math.min(chunk.length, size - written);
          out.set(chunk.subarray(0, count), written);
          written += count;
          if (count === chunk.length) this.index++;
          else this.chunks[this.index] = chunk.subarray(count);
        }
      }
      this.length -= size;
      if (this.index === this.chunks.length) {
        this.chunks = [];
        this.index = 0;
      } else if (this.index > 1024) {
        this.chunks = this.chunks.slice(this.index);
        this.index = 0;
      }
      return out;
    }
  };

  // ../../packages/browser/src/surfaces/png.ts
  var import_upng_js = __toESM(require_UPNG(), 1);

  // ../../packages/browser/src/algorithms/pixel-range-png-base.ts
  var PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  var CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();
  function crc32(bytes) {
    let c = 4294967295;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ c >>> 8;
    return (c ^ 4294967295) >>> 0;
  }
  function createPngChunk(type, data) {
    const chunk = Buffer.allocUnsafe(data.byteLength + 12);
    chunk.writeUInt32BE(data.byteLength, 0);
    chunk.write(type, 4, 4, "ascii");
    chunk.set(data, 8);
    chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.byteLength)), 8 + data.byteLength);
    return chunk;
  }
  function insertTpakChunk(imageBytes, data) {
    const ihdrEnd = 33;
    if (imageBytes.length < ihdrEnd || !imageBytes.subarray(0, 8).equals(PNG_SIGNATURE) || imageBytes.readUInt32BE(8) !== 13 || imageBytes.toString("ascii", 12, 16) !== "IHDR") {
      throw new Error("not a PNG (missing IHDR)");
    }
    const chunkLength = data.byteLength + 12;
    const output = Buffer.allocUnsafe(imageBytes.length + chunkLength);
    imageBytes.copy(output, 0, 0, ihdrEnd);
    output.writeUInt32BE(data.byteLength, ihdrEnd);
    output.write("tpAK", ihdrEnd + 4, "ascii");
    output.set(data, ihdrEnd + 8);
    output.writeUInt32BE(
      crc32(output.subarray(ihdrEnd + 4, ihdrEnd + 8 + data.byteLength)),
      ihdrEnd + 8 + data.byteLength
    );
    imageBytes.copy(output, ihdrEnd + chunkLength, ihdrEnd);
    return output;
  }
  function extractTpakChunk(artifactBytes) {
    if (artifactBytes.length < 8 || !artifactBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
      throw new Error("not a PNG");
    }
    let pos = 8;
    while (pos + 8 <= artifactBytes.length) {
      const length = artifactBytes.readUInt32BE(pos);
      const type = artifactBytes.subarray(pos + 4, pos + 8).toString("ascii");
      if (pos + 12 + length > artifactBytes.length) throw new Error("truncated PNG chunk");
      if (type === "tpAK") {
        const data = artifactBytes.subarray(pos + 8, pos + 8 + length);
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      }
      if (type === "IEND") break;
      pos = pos + 8 + length + 4;
    }
    throw new Error("no tpAK chunk found in PNG");
  }

  // ../../packages/browser/src/surfaces/png.ts
  var CHANNELS_SCHEMA = {
    channels: enumOption([3, 4], 3, { label: "Channels per pixel" })
  };
  var browserOnly = (method) => new Error(
    `${method}() is not available in the browser surface \u2014 use writeBuffer/readBuffer for byte-level I/O.`
  );
  var BITMAP_OPTS = {
    premultiplyAlpha: "none",
    colorSpaceConversion: "none"
  };
  function makeCanvas(width, height) {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    return c;
  }
  function get2dContext(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    return ctx;
  }
  async function detectChannelsFromBlob(blob) {
    const head = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
    if (head[0] === 137 && head[1] === 80 && head[2] === 78 && head[3] === 71 && head[4] === 13 && head[5] === 10) {
      return head[25] === 6 ? 4 : 3;
    }
    if (head[0] === 82 && head[1] === 73 && head[2] === 70 && head[3] === 70 && head[8] === 87 && head[9] === 69 && head[10] === 66 && head[11] === 80) {
      const c = String.fromCharCode(head[12], head[13], head[14], head[15]);
      if (c === "VP8L") return (head[24] & 16) !== 0 ? 4 : 3;
      if (c === "VP8X") return (head[20] & 16) !== 0 ? 4 : 3;
      if (c === "VP8 ") return 3;
    }
    return 4;
  }
  function bitmapToPixels(bitmap, fileChannels) {
    const { width, height } = bitmap;
    const canvas = makeCanvas(width, height);
    const ctx = get2dContext(canvas);
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const rgba = new Uint8Array(
      imageData.data.buffer,
      imageData.data.byteOffset,
      imageData.data.byteLength
    );
    if (fileChannels === 4) {
      return { pixels: rgba, width, height, fileChannels: 4 };
    }
    const n = width * height;
    const rgb = new Uint8Array(n * 3);
    for (let i = 0; i < n; i++) {
      rgb[i * 3] = rgba[i * 4];
      rgb[i * 3 + 1] = rgba[i * 4 + 1];
      rgb[i * 3 + 2] = rgba[i * 4 + 2];
    }
    return { pixels: rgb, width, height, fileChannels: 3 };
  }
  var BrowserPngSurface = class extends ImageSurface {
    static optionsSchema = CHANNELS_SCHEMA;
    constructor() {
      super({
        id: "png",
        label: "PNG (browser)",
        description: "Lossless 8-bit/channel PNG. Universal browser support, full alpha.",
        format: "png",
        extension: ".png",
        mimeType: "image/png",
        preservesAlpha: true,
        maxBpp: 4
      });
    }
    async write(_filePath, _image) {
      throw browserOnly("PngSurface.write");
    }
    async readFile(_filePath) {
      throw browserOnly("PngSurface.readFile");
    }
    async readBuffer(buffer) {
      const blob = new Blob([buffer]);
      const fileChannels = await detectChannelsFromBlob(blob);
      if (fileChannels === 4) {
        const image = import_upng_js.default.decode(
          buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
          )
        );
        return {
          pixels: new Uint8Array(import_upng_js.default.toRGBA8(image)[0]),
          width: image.width,
          height: image.height,
          fileChannels: 4
        };
      }
      const bitmap = await createImageBitmap(blob, BITMAP_OPTS);
      try {
        return bitmapToPixels(bitmap, fileChannels);
      } finally {
        bitmap.close();
      }
    }
    async writeBuffer(image) {
      const { pixels, width, height, fileChannels } = image;
      const stride = width * fileChannels;
      if (pixels.byteLength !== stride * height) throw new Error("PNG pixel buffer size mismatch");
      const scanlines = new Uint8Array((stride + 1) * height);
      for (let y = 0; y < height; y++)
        scanlines.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
      const compressed = new Uint8Array(
        await new Response(
          new Blob([scanlines]).stream().pipeThrough(new CompressionStream("deflate"))
        ).arrayBuffer()
      );
      const ihdr = Buffer.alloc(13);
      ihdr.writeUInt32BE(width, 0);
      ihdr.writeUInt32BE(height, 4);
      ihdr[8] = 8;
      ihdr[9] = fileChannels === 4 ? 6 : 2;
      return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        createPngChunk("IHDR", ihdr),
        createPngChunk("IDAT", compressed),
        createPngChunk("IEND", new Uint8Array())
      ]);
    }
  };
  var BrowserStreamingPngSurface = class extends ImageSurface {
    static optionsSchema = CHANNELS_SCHEMA;
    constructor() {
      super({
        id: "png-stream",
        label: "Streaming PNG (browser)",
        description: "Same PNG bytes, IDAT framing tuned for chunked decode-as-you-fetch (overlapped network + decode).",
        format: "png",
        extension: ".png",
        mimeType: "image/png",
        streamable: true,
        preservesAlpha: true,
        maxBpp: 4
      });
    }
    async write(_filePath, _image) {
      throw browserOnly("StreamingPngSurface.write");
    }
    async readFile(_filePath) {
      throw browserOnly("StreamingPngSurface.readFile");
    }
    /**
     * Browser doesn't have a separate streaming-PNG path on the read side —
     * the regular `createImageBitmap` + canvas pipeline is fine for any PNG.
     */
    async readBuffer(buffer) {
      return new BrowserPngSurface().readBuffer(buffer);
    }
    /**
     * "Streaming" PNG only matters on the decode-from-network side. For encode
     * we use the same lossless scanline writer as the regular surface.
     */
    async writeBuffer(image) {
      return new BrowserPngSurface().writeBuffer(image);
    }
    /**
     * True streaming-PNG decoder. Owns the PNG container parsing entirely:
     *   1. Read PNG signature + IHDR (sets width/fileChannels)
     *   2. Pipe IDAT chunks through `DecompressionStream('deflate')`
     *   3. Reconstruct scanlines, undo PNG filter
     *   4. Yield raw pixel rows
     *
     * Algorithm.decodeStream consumes these rows — codec header reading,
     * codec decode, and outer-compression decoding all live there.
     */
    async decodeStream(stream) {
      return decodeStreamingPng(stream);
    }
  };

  // ../../packages/browser/src/surfaces/png-upng.ts
  var import_buffer2 = __toESM(require_buffer(), 1);
  var import_upng_js2 = __toESM(require_UPNG(), 1);
  var browserOnly2 = (method) => new Error(
    `${method}() is not available in the browser surface \u2014 use writeBuffer/readBuffer for byte-level I/O.`
  );
  function expandRgbToRgba(rgb, n) {
    const out = new Uint8Array(n * 4);
    for (let i = 0, j = 0; i < n; i += 1, j += 4) {
      out[j] = rgb[i * 3];
      out[j + 1] = rgb[i * 3 + 1];
      out[j + 2] = rgb[i * 3 + 2];
      out[j + 3] = 255;
    }
    return out;
  }
  function stripAlpha(rgba, n) {
    const rgb = new Uint8Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      rgb[i * 3] = rgba[i * 4];
      rgb[i * 3 + 1] = rgba[i * 4 + 1];
      rgb[i * 3 + 2] = rgba[i * 4 + 2];
    }
    return rgb;
  }
  function detectFileChannels(rgbaData, colorType) {
    if (colorType !== 6) return 3;
    const isFull4 = rgbaData[0] === 192 && rgbaData[1] === 222 && rgbaData[2] === 174 && rgbaData[3] === 84;
    if (isFull4) return 4;
    const isCompact = rgbaData[0] === 193;
    if (isCompact && (rgbaData[2] >> 2 & 3) === 3) return 4;
    return 3;
  }
  var BrowserPngUpngSurface = class extends ImageSurface {
    supportedChannels = /* @__PURE__ */ new Set([3]);
    constructor() {
      super({
        id: "png-upng",
        label: "PNG (upng-js, browser)",
        description: "Lossless 8-bit/channel PNG via upng-js \u2014 pure JS, no canvas, byte-exact RGB encode/decode.",
        format: "png",
        extension: ".png",
        mimeType: "image/png",
        preservesAlpha: true,
        maxBpp: 3
      });
    }
    async writeBuffer(image) {
      const { pixels, width, height, fileChannels } = image;
      const n = width * height;
      const rgba = fileChannels === 4 ? pixels : expandRgbToRgba(pixels, n);
      const sliced = rgba.slice();
      const buf = sliced.buffer;
      const png = import_upng_js2.default.encode([buf], width, height, 0, void 0, true);
      return import_buffer2.Buffer.from(png);
    }
    async readBuffer(buffer) {
      const ab = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
      const img = import_upng_js2.default.decode(ab);
      const rgbaFrames = import_upng_js2.default.toRGBA8(img);
      const rgba = new Uint8Array(rgbaFrames[0]);
      const fileChannels = detectFileChannels(rgba, img.ctype);
      const n = img.width * img.height;
      if (fileChannels === 4) {
        return { pixels: rgba, width: img.width, height: img.height, fileChannels: 4 };
      }
      return { pixels: stripAlpha(rgba, n), width: img.width, height: img.height, fileChannels: 3 };
    }
    async write(_filePath, _image) {
      throw browserOnly2("PngUpngSurface.write");
    }
    async readFile(_filePath) {
      throw browserOnly2("PngUpngSurface.readFile");
    }
  };

  // ../../packages/browser/src/register.ts
  var registered = false;
  function registerBrowserDefaults() {
    if (registered) return;
    registered = true;
    compressorRegistry.register(BrowserBrotliCompressor);
    compressorRegistry.register(BrowserDeflateCompressor);
    if (!surfaceRegistry.has("png")) {
      surfaceRegistry.register("png", () => new BrowserPngSurface());
    }
    if (!surfaceRegistry.has("png-stream")) {
      surfaceRegistry.register("png-stream", () => new BrowserStreamingPngSurface());
    }
    if (!surfaceRegistry.has("png-upng")) {
      surfaceRegistry.register("png-upng", () => new BrowserPngUpngSurface());
    }
  }
  registerBrowserDefaults();

  // ../../packages/core/src/pack-builder.ts
  var enc = new TextEncoder();

  // ../../packages/core/src/compressors/index.ts
  async function compressRaw(bytes, mode) {
    const compressor = compressorRegistry.byMode(mode);
    const buffer = bytesToBuffer(bytes);
    const result = await compressor.compress(buffer);
    const compressedBytes = bufferToUint8(result.data);
    return {
      bytes: compressedBytes,
      compressor: compressor.id,
      level: result.level,
      originalSize: bytes.length
    };
  }
  async function decompressRaw(bytes, mode, meta) {
    const compressor = compressorRegistry.byMode(mode);
    const buffer = bytesToBuffer(bytes);
    const out = await compressor.decompress(buffer, {
      level: meta.level,
      uncompressedLength: meta.uncompressedLength
    });
    return bufferToUint8(out);
  }
  function bytesToBuffer(bytes) {
    const B = globalThis.Buffer;
    if (B && typeof B.from === "function") {
      return B.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    return bytes;
  }
  function bufferToUint8(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  // ../../packages/core/src/router/plan.ts
  var DEFAULT_ROUTER_TARGET_CHUNK_BYTES = 1024 * 1024;
  var DEFAULT_ROUTER_TINY_FILE_BYTES = 32 * 1024;

  // ../../packages/core/src/router/types.ts
  var ROUTER_MANIFEST_PATH = "router.json";

  // ../../packages/browser/src/decode-core.ts
  var import_buffer3 = __toESM(require_buffer(), 1);

  // ../../packages/core/src/codecs/types.ts
  var AbstractCodec = class {
    /** Tunable options for this codec. Most codecs have no per-instance options. */
    static optionsSchema = {};
  };
  function isStreamingCodec(c) {
    return "decodeChunk" in c && typeof c.decodeChunk === "function";
  }

  // ../../packages/core/src/crypto.ts
  var SALT_LEN = 16;
  var IV_LEN = 12;
  var TAG_LEN = 16;
  var KEY_BITS = 256;
  var PBKDF2_ITER = 1e4;
  var CRYPTO_OVERHEAD = SALT_LEN + IV_LEN + TAG_LEN;
  var passwordEncoder = new TextEncoder();
  var asBuf = (data) => data;
  async function deriveKey(password, salt) {
    const baseKey = await globalThis.crypto.subtle.importKey(
      "raw",
      asBuf(passwordEncoder.encode(password)),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return globalThis.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: asBuf(salt), iterations: PBKDF2_ITER, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: KEY_BITS },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async function encryptData(data, password) {
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_LEN));
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LEN));
    const key = await deriveKey(password, salt);
    const ctAndTag = new Uint8Array(
      await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv: asBuf(iv) }, key, asBuf(data))
    );
    const out = new Uint8Array(SALT_LEN + IV_LEN + ctAndTag.length);
    out.set(salt, 0);
    out.set(iv, SALT_LEN);
    out.set(ctAndTag, SALT_LEN + IV_LEN);
    return out;
  }
  async function decryptData(data, password) {
    if (data.length < CRYPTO_OVERHEAD) throw new Error("Encrypted payload too short");
    const salt = data.subarray(0, SALT_LEN);
    const iv = data.subarray(SALT_LEN, SALT_LEN + IV_LEN);
    const ctAndTag = data.subarray(SALT_LEN + IV_LEN);
    const key = await deriveKey(password, salt);
    try {
      const plaintext = await globalThis.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: asBuf(iv) },
        key,
        asBuf(ctAndTag)
      );
      return new Uint8Array(plaintext);
    } catch {
      throw new Error("Decryption failed \u2014 wrong key or corrupted data");
    }
  }

  // ../../packages/core/src/header.ts
  var HEADER_PIXELS = 10;
  var HEADER_BYTES = HEADER_PIXELS * 3;
  var COMPACT_MAGIC = 193;
  var COMPACT_HEADER_PIXELS = 2;
  var BPP_FLAGS = { 0: 3, 1: 1, 2: 2, 3: 4 };
  var FLAGS_BPP = { 1: 1, 2: 2, 3: 0, 4: 3 };
  function isCompactToken(pixels) {
    return pixels[0] === COMPACT_MAGIC;
  }
  function writeCompactHeader(pixels, d) {
    const bppBits = FLAGS_BPP[d.channels ?? 3] ?? 0;
    pixels[0] = COMPACT_MAGIC;
    pixels[1] = d.algoId;
    pixels[2] = bppBits << 2 | d.flags & 3;
    pixels[3] = d.dataLength >>> 16 & 255;
    pixels[4] = d.dataLength >>> 8 & 255;
    pixels[5] = d.dataLength & 255;
  }
  function readCompactHeader(pixels) {
    if (pixels[0] !== COMPACT_MAGIC) throw new Error("not a compact tokenpack image");
    const rawFlags = pixels[2];
    const bppBits = rawFlags >> 2 & 3;
    return {
      algoId: pixels[1],
      flags: rawFlags,
      dataLength: pixels[3] << 16 | pixels[4] << 8 | pixels[5],
      channels: BPP_FLAGS[bppBits] ?? 3
    };
  }
  function writeHeader(pixels, d) {
    pixels[0] = 192;
    pixels[1] = 222;
    pixels[2] = 174;
    pixels[3] = 84;
    pixels[4] = d.version;
    pixels[5] = d.algorithmId;
    pixels[6] = d.fileLength >>> 24 & 255;
    pixels[7] = d.fileLength >>> 16 & 255;
    pixels[8] = d.fileLength >>> 8 & 255;
    pixels[9] = d.fileLength & 255;
    pixels[10] = d.width >>> 8 & 255;
    pixels[11] = d.width & 255;
    pixels[12] = d.height >>> 8 & 255;
    pixels[13] = d.height & 255;
    pixels[14] = d.ecLevel;
    pixels[15] = d.compressionLevel;
    pixels[16] = d.uncompressedLength >>> 24 & 255;
    pixels[17] = d.uncompressedLength >>> 16 & 255;
    pixels[18] = d.uncompressedLength >>> 8 & 255;
    pixels[19] = d.uncompressedLength & 255;
    pixels[20] = d.cellSize;
    pixels[21] = d.dataPixelCount >>> 24 & 255;
    pixels[22] = d.dataPixelCount >>> 16 & 255;
    pixels[23] = d.dataPixelCount >>> 8 & 255;
    pixels[24] = d.dataPixelCount & 255;
    pixels[25] = d.channels;
    pixels[26] = d.preFecLength >>> 24 & 255;
    pixels[27] = d.preFecLength >>> 16 & 255;
    pixels[28] = d.preFecLength >>> 8 & 255;
    pixels[29] = d.preFecLength & 255;
  }
  function encodeEcByte(encrypted, fecLevel) {
    if (fecLevel < 0 || fecLevel > 7) throw new Error(`fecLevel out of range: ${fecLevel}`);
    return (encrypted ? 1 : 0) | (fecLevel & 7) << 1;
  }
  function decodeEcByte(b) {
    return { encrypted: (b & 1) !== 0, fecLevel: b >> 1 & 7 };
  }
  function readHeader(pixels) {
    if (pixels[0] !== 192 || pixels[1] !== 222 || pixels[2] !== 174 || pixels[3] !== 84) {
      throw new Error("not a tokenpack image");
    }
    const rawChannels = pixels[25];
    return {
      version: pixels[4],
      algorithmId: pixels[5],
      fileLength: (pixels[6] << 24 | pixels[7] << 16 | pixels[8] << 8 | pixels[9]) >>> 0,
      width: pixels[10] << 8 | pixels[11],
      height: pixels[12] << 8 | pixels[13],
      ecLevel: pixels[14],
      compressionLevel: pixels[15],
      uncompressedLength: (pixels[16] << 24 | pixels[17] << 16 | pixels[18] << 8 | pixels[19]) >>> 0,
      cellSize: pixels[20],
      dataPixelCount: (pixels[21] << 24 | pixels[22] << 16 | pixels[23] << 8 | pixels[24]) >>> 0,
      channels: rawChannels === 0 ? 3 : rawChannels,
      preFecLength: (pixels[26] << 24 | pixels[27] << 16 | pixels[28] << 8 | pixels[29]) >>> 0
    };
  }

  // ../../packages/core/src/drawers/types.ts
  var AbstractDrawer = class {
    /** Tunable options for this drawer (e.g. cellSize for dot drawer). */
    static optionsSchema = {};
    /** Short human-readable explanation for UI tooltips. Subclasses override. */
    description = "";
  };

  // ../../packages/core/src/drawers/dense-drawer.ts
  var MAX_WIDTH = 4096;
  var MAX_PIXELS_PER_CHUNK = MAX_WIDTH * MAX_WIDTH - HEADER_PIXELS;
  var DENSE_CAPABILITIES = {
    streamable: true,
    decodeOnFlight: true,
    requiresLosslessSurface: true,
    requiresAlpha: false,
    supportedChannels: /* @__PURE__ */ new Set([1, 2, 3, 4])
  };
  function fileChannelsForBpp(bpp) {
    return bpp === 4 ? 4 : 3;
  }
  function denseDimensions(dataPixelEst, headerPixels, requestedWidth) {
    const totalPixels = headerPixels + dataPixelEst;
    const side = Math.ceil(Math.sqrt(Math.max(totalPixels, headerPixels + 1)));
    const width = requestedWidth ?? Math.max(side, Math.min(totalPixels, 64));
    const height = Math.ceil(totalPixels / width);
    return { width, height };
  }
  function denseChunkDimensions(dataPixelEst) {
    const totalPixels = HEADER_PIXELS + dataPixelEst;
    const side = Math.min(MAX_WIDTH, Math.ceil(Math.sqrt(Math.max(totalPixels, HEADER_PIXELS + 1))));
    const width = side;
    const height = Math.ceil(totalPixels / width);
    return { width, height };
  }
  var DenseDrawer = class extends AbstractDrawer {
    id = "dense";
    label = "Dense";
    description = "Packs bytes into adjacent pixels \u2014 smallest token, fastest decode, no visual structure.";
    outputKind = "raster-pixels";
    capabilities = DENSE_CAPABILITIES;
    static MAX_WIDTH = MAX_WIDTH;
    static MAX_PIXELS_PER_CHUNK = MAX_PIXELS_PER_CHUNK;
    write(input, ctx) {
      const fc = fileChannelsForBpp(ctx.bpp);
      const dataPixelEst = ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp);
      if (dataPixelEst > MAX_PIXELS_PER_CHUNK) {
        throw new Error(
          `DenseDrawer.write: payload exceeds single-chunk cap (${dataPixelEst} > ${MAX_PIXELS_PER_CHUNK} pixels)`
        );
      }
      if (this.canUseCompact(ctx, dataPixelEst)) {
        return { chunks: [this.writeCompact(input, ctx, fc)] };
      }
      return { chunks: [this.writeFull(input, ctx, fc)] };
    }
    read(image, ctx) {
      return isCompactToken(image.pixels) ? this.readCompact(image, ctx) : this.readFull(image, ctx);
    }
    canUseCompact(ctx, dataPixelEst) {
      return ctx.bpp !== 1 && ctx.bpp !== 2 && dataPixelEst <= MAX_PIXELS_PER_CHUNK && !ctx.requiresFullHeader;
    }
    writeCompact(input, ctx, fc) {
      const dataPixelEst = ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp);
      const { width, height } = denseDimensions(dataPixelEst, COMPACT_HEADER_PIXELS, ctx.width);
      const dataPixelCount = width * height - COMPACT_HEADER_PIXELS;
      const pixels = new Uint8Array(width * height * fc);
      const codecOut = ctx.codec.encode(input, dataPixelCount, width, height, ctx.bpp);
      const expanded = toFileChannels(codecOut, dataPixelCount, ctx.bpp, fc);
      pixels.set(expanded, COMPACT_HEADER_PIXELS * fc);
      const flags = (ctx.compressionLevel > 0 ? 2 : 0) | (ctx.encrypted ? 1 : 0);
      writeCompactHeader(pixels, {
        algoId: ctx.algorithmId,
        flags,
        dataLength: input.length,
        channels: ctx.bpp
      });
      return { pixels, width, height, fileChannels: fc };
    }
    writeFull(input, ctx, fc) {
      const dataPixelEst = ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp);
      const { width, height } = denseChunkDimensions(dataPixelEst);
      const dataPixelCount = width * height - HEADER_PIXELS;
      const pixels = new Uint8Array(width * height * fc);
      const codecOut = ctx.codec.encode(input, dataPixelCount, width, height, ctx.bpp);
      const expanded = toFileChannels(codecOut, dataPixelCount, ctx.bpp, fc);
      pixels.set(expanded, HEADER_PIXELS * fc);
      const headerData = {
        version: 1,
        algorithmId: ctx.algorithmId,
        fileLength: input.length,
        width,
        height,
        ecLevel: encodeEcByte(ctx.encrypted, ctx.fecLevel),
        compressionLevel: ctx.compressionLevel,
        uncompressedLength: ctx.uncompressedLength,
        cellSize: 1,
        dataPixelCount: 0,
        channels: ctx.bpp,
        preFecLength: ctx.preFecLength
      };
      writeHeader(pixels, headerData);
      return { pixels, width, height, fileChannels: fc };
    }
    readCompact(image, ctx) {
      const { pixels, width, height, fileChannels } = image;
      const ch = readCompactHeader(pixels);
      const bpp = ch.channels;
      const dataPixelsFc = pixels.slice(COMPACT_HEADER_PIXELS * fileChannels);
      const dataPixelCount = width * height - COMPACT_HEADER_PIXELS;
      const dataPixels = fromFileChannels(dataPixelsFc, dataPixelCount, fileChannels, bpp);
      return {
        bytes: ctx.codec.decode(dataPixels, ch.dataLength, width, height, bpp),
        compressionLevel: ch.flags & 2 ? 2 : 0,
        encrypted: (ch.flags & 1) !== 0,
        uncompressedLength: 0,
        fecLevel: 0,
        preFecLength: 0
      };
    }
    readFull(image, ctx) {
      const { pixels, width, height, fileChannels } = image;
      const header = readHeader(pixels);
      const bpp = header.channels;
      const dataPixelsFc = pixels.slice(HEADER_PIXELS * fileChannels);
      const dataPixelCount = width * height - HEADER_PIXELS;
      const dataPixels = fromFileChannels(dataPixelsFc, dataPixelCount, fileChannels, bpp);
      const ec = decodeEcByte(header.ecLevel);
      return {
        bytes: ctx.codec.decode(dataPixels, header.fileLength, width, height, bpp),
        compressionLevel: header.compressionLevel,
        encrypted: ec.encrypted,
        uncompressedLength: header.uncompressedLength,
        fecLevel: ec.fecLevel,
        preFecLength: header.preFecLength
      };
    }
  };

  // ../../packages/core/src/surfaces/dot-render.ts
  function dotLayout(totalCells, cellSize, requestedGridWidth) {
    const gridSide = Math.ceil(Math.sqrt(Math.max(totalCells, 33)));
    const gridWidth = requestedGridWidth ?? gridSide;
    const gridHeight = Math.ceil(totalCells / gridWidth);
    return {
      gridWidth,
      gridHeight,
      imageWidth: gridWidth * cellSize,
      imageHeight: gridHeight * cellSize
    };
  }
  function renderDots(dataRgba, dataCount, cellSize, layout, channels = CHANNELS) {
    const { imageWidth, imageHeight, gridWidth } = layout;
    const pixels = new Uint8Array(imageWidth * imageHeight * channels);
    const dotOffset = Math.floor(cellSize / 2);
    for (let i = 0; i < dataCount; i++) {
      const cellIdx = i + HEADER_PIXELS;
      const cx = cellIdx % gridWidth;
      const cy = Math.floor(cellIdx / gridWidth);
      const px = cx * cellSize + dotOffset;
      const py = cy * cellSize + dotOffset;
      if (px < imageWidth && py < imageHeight) {
        const imgIdx = (py * imageWidth + px) * channels;
        pixels.set(dataRgba.subarray(i * channels, i * channels + channels), imgIdx);
      }
    }
    return pixels;
  }
  function readDots(pixels, dataCount, cellSize, layout, channels = CHANNELS) {
    const { imageWidth, gridWidth } = layout;
    const result = new Uint8Array(dataCount * channels);
    const dotOffset = Math.floor(cellSize / 2);
    for (let i = 0; i < dataCount; i++) {
      const cellIdx = i + HEADER_PIXELS;
      const cx = cellIdx % gridWidth;
      const cy = Math.floor(cellIdx / gridWidth);
      const px = cx * cellSize + dotOffset;
      const py = cy * cellSize + dotOffset;
      if (px < imageWidth) {
        const imgIdx = (py * imageWidth + px) * channels;
        result.set(pixels.subarray(imgIdx, imgIdx + channels), i * channels);
      }
    }
    return result;
  }

  // ../../packages/core/src/drawers/dot-drawer.ts
  var DOT_CAPABILITIES = {
    streamable: false,
    decodeOnFlight: false,
    requiresLosslessSurface: true,
    requiresAlpha: false,
    supportedChannels: /* @__PURE__ */ new Set([1, 2, 3, 4])
  };
  function fileChannelsForBpp2(bpp) {
    return bpp === 4 ? 4 : 3;
  }
  var DotDrawer = class extends AbstractDrawer {
    static optionsSchema = {
      cellSize: enumOption([3, 5, 7, 9], 5, { label: "Dot size (pixels per cell)" })
    };
    id = "dot";
    label = "Dot";
    description = "Sparse cells of configurable size \u2014 visually distinct, larger token, decode-after-download.";
    outputKind = "raster-pixels";
    capabilities = DOT_CAPABILITIES;
    write(input, ctx) {
      const fc = fileChannelsForBpp2(ctx.bpp);
      const cellSize = Math.max(1, ctx.cellSize);
      const dataPixelCount = ctx.codec.estimateDataPixels?.(input, ctx.bpp) ?? Math.ceil(input.length / ctx.bpp);
      const layout = dotLayout(HEADER_PIXELS + dataPixelCount, cellSize);
      const { imageWidth, imageHeight, gridWidth, gridHeight } = layout;
      const headerData = {
        version: 1,
        algorithmId: ctx.algorithmId,
        fileLength: input.length,
        width: imageWidth,
        height: imageHeight,
        ecLevel: encodeEcByte(ctx.encrypted, ctx.fecLevel),
        compressionLevel: ctx.compressionLevel,
        uncompressedLength: ctx.uncompressedLength,
        cellSize,
        dataPixelCount,
        channels: ctx.bpp,
        preFecLength: ctx.preFecLength
      };
      const dataRaw = ctx.codec.encode(input, dataPixelCount, gridWidth, gridHeight, ctx.bpp);
      const dataExpanded = toFileChannels(dataRaw, dataPixelCount, ctx.bpp, fc);
      const pixels = renderDots(dataExpanded, dataPixelCount, cellSize, layout, fc);
      writeHeader(pixels, headerData);
      const chunk = { pixels, width: imageWidth, height: imageHeight, fileChannels: fc };
      return { chunks: [chunk] };
    }
    read(image, ctx) {
      const { pixels, fileChannels } = image;
      const header = readHeader(pixels);
      const bpp = header.channels;
      const dataPixelCount = header.dataPixelCount || Math.ceil(header.fileLength / bpp);
      const layout = dotLayout(HEADER_PIXELS + dataPixelCount, header.cellSize);
      const dataRawFc = readDots(pixels, dataPixelCount, header.cellSize, layout, fileChannels);
      const dataRaw = fromFileChannels(dataRawFc, dataPixelCount, fileChannels, bpp);
      const ec = decodeEcByte(header.ecLevel);
      return {
        bytes: ctx.codec.decode(dataRaw, header.fileLength, layout.gridWidth, layout.gridHeight, bpp),
        compressionLevel: header.compressionLevel,
        encrypted: ec.encrypted,
        uncompressedLength: header.uncompressedLength,
        fecLevel: ec.fecLevel,
        preFecLength: header.preFecLength
      };
    }
  };

  // ../../packages/core/src/drawers/index.ts
  function pickDrawerForPixels(pixels) {
    if (isCompactToken(pixels)) return new DenseDrawer();
    const header = readHeader(pixels);
    return header.cellSize > 1 ? new DotDrawer() : new DenseDrawer();
  }

  // ../../packages/core/src/fec/types.ts
  var FecDecodeError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "FecDecodeError";
    }
  };
  var AbstractFec = class {
    /** Tunable options for this FEC scheme. Subclasses override. */
    static optionsSchema = {};
  };

  // ../../packages/core/src/fec/none-fec.ts
  var NoneFec = class extends AbstractFec {
    id = "none";
    label = "None";
    headerLevel = 0;
    parityBytes = 0;
    overheadPct = 0;
    recoverableBytesPerBlock = 0;
    encode(input) {
      return { data: input, level: 0, originalLength: input.length };
    }
    decode(input, originalLength) {
      return input.subarray(0, originalLength);
    }
  };

  // ../../packages/core/src/fec/gf256.ts
  var PRIMITIVE = 285;
  var EXP = new Uint8Array(512);
  var LOG = new Uint8Array(256);
  (() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x = x << 1;
      if (x & 256) x ^= PRIMITIVE;
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }
  function gfDiv(a, b) {
    if (b === 0) throw new Error("div by zero in GF(2^8)");
    if (a === 0) return 0;
    return EXP[(LOG[a] + 255 - LOG[b]) % 255];
  }
  function gfInverse(x) {
    return EXP[255 - LOG[x]];
  }
  function gfPolyAdd(p, q) {
    const r = new Uint8Array(Math.max(p.length, q.length));
    for (let i = 0; i < p.length; i++) r[i + r.length - p.length] = p[i];
    for (let i = 0; i < q.length; i++) r[i + r.length - q.length] ^= q[i];
    return r;
  }
  function gfPolyMul(p, q) {
    const r = new Uint8Array(p.length + q.length - 1);
    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < q.length; j++) {
        r[i + j] ^= gfMul(p[i], q[j]);
      }
    }
    return r;
  }
  function gfPolyEval(p, x) {
    let y = p[0];
    for (let i = 1; i < p.length; i++) {
      y = gfMul(y, x) ^ p[i];
    }
    return y;
  }

  // ../../packages/core/src/fec/rs.ts
  var BLOCK_SIZE = 255;
  function rsGeneratorPoly(nsym) {
    let g2 = new Uint8Array([1]);
    for (let i = 0; i < nsym; i++) {
      g2 = gfPolyMul(g2, new Uint8Array([1, EXP[i]]));
    }
    return g2;
  }
  function rsEncodeBlock(msg, nsym) {
    const gen = rsGeneratorPoly(nsym);
    const out = new Uint8Array(msg.length + nsym);
    out.set(msg);
    for (let i = 0; i < msg.length; i++) {
      const coef = out[i];
      if (coef !== 0) {
        for (let j = 1; j < gen.length; j++) {
          out[i + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    out.set(msg);
    return out;
  }
  function rsCalcSyndromes(msg, nsym) {
    const synd = new Uint8Array(nsym + 1);
    for (let i = 0; i < nsym; i++) {
      synd[i + 1] = gfPolyEval(msg, EXP[i]);
    }
    return synd;
  }
  function polyScale(p, x) {
    const r = new Uint8Array(p.length);
    for (let i = 0; i < p.length; i++) r[i] = gfMul(p[i], x);
    return r;
  }
  function rsFindErrorLocator(synd, nsym) {
    let errLoc = new Uint8Array([1]);
    let oldLoc = new Uint8Array([1]);
    const syndShift = synd.length - nsym;
    for (let i = 0; i < nsym; i++) {
      const k = i + syndShift;
      let delta = synd[k];
      for (let j = 1; j < errLoc.length; j++) {
        delta ^= gfMul(errLoc[errLoc.length - j - 1], synd[k - j]);
      }
      const shifted = new Uint8Array(oldLoc.length + 1);
      shifted.set(oldLoc, 0);
      oldLoc = shifted;
      if (delta !== 0) {
        if (oldLoc.length > errLoc.length) {
          const newLoc = polyScale(oldLoc, delta);
          oldLoc = polyScale(errLoc, gfInverse(delta));
          errLoc = newLoc;
        }
        errLoc = gfPolyAdd(errLoc, polyScale(oldLoc, delta));
      }
    }
    let start = 0;
    while (start < errLoc.length && errLoc[start] === 0) start++;
    errLoc = errLoc.slice(start);
    const errs = errLoc.length - 1;
    if (errs * 2 > nsym) throw new Error("rs: too many errors to correct");
    return errLoc;
  }
  function rsFindErrors(errLoc, msgLen) {
    const errs = errLoc.length - 1;
    const errPos = [];
    for (let i = 0; i < msgLen; i++) {
      if (gfPolyEval(errLoc, EXP[(255 - i) % 255]) === 0) {
        errPos.push(msgLen - 1 - i);
      }
    }
    if (errPos.length !== errs) throw new Error("rs: error locator did not yield enough roots");
    return errPos;
  }
  function polyReverse(p) {
    const r = new Uint8Array(p.length);
    for (let i = 0; i < p.length; i++) r[i] = p[p.length - 1 - i];
    return r;
  }
  function gfPolyDiv(dividend, divisor) {
    const out = new Uint8Array(dividend);
    for (let i = 0; i < dividend.length - divisor.length + 1; i++) {
      const coef = out[i];
      if (coef !== 0) {
        for (let j = 1; j < divisor.length; j++) {
          if (divisor[j] !== 0) out[i + j] ^= gfMul(divisor[j], coef);
        }
      }
    }
    const sep = out.length - (divisor.length - 1);
    return [out.slice(0, sep), out.slice(sep)];
  }
  function rsFindErrorEvaluator(syndRev, errLoc, nsym) {
    const product = gfPolyMul(syndRev, errLoc);
    const divisor = new Uint8Array(nsym + 2);
    divisor[0] = 1;
    const [, remainder] = gfPolyDiv(product, divisor);
    return remainder;
  }
  function rsCorrectErrata(msg, synd, errPos) {
    const coefPos = errPos.map((p) => msg.length - 1 - p);
    const X = coefPos.map((p) => EXP[p % 255]);
    let errLoc = new Uint8Array([1]);
    for (const xi of X) {
      errLoc = gfPolyMul(errLoc, new Uint8Array([xi, 1]));
    }
    const syndRev = polyReverse(synd);
    const errEval = rsFindErrorEvaluator(syndRev, errLoc, errLoc.length - 1);
    for (let i = 0; i < X.length; i++) {
      const Xi = X[i];
      const XiInv = gfInverse(Xi);
      let errLocPrime = 1;
      for (let j = 0; j < X.length; j++) {
        if (j !== i) {
          errLocPrime = gfMul(errLocPrime, 1 ^ gfMul(XiInv, X[j]));
        }
      }
      if (errLocPrime === 0) throw new Error("rs: Forney denominator is zero");
      let y = gfPolyEval(errEval, XiInv);
      y = gfMul(Xi, y);
      const magnitude = gfDiv(y, errLocPrime);
      msg[errPos[i]] ^= magnitude;
    }
    return msg;
  }
  function rsDecodeBlock(received, nsym) {
    const synd = rsCalcSyndromes(received, nsym);
    let allZero = true;
    for (let i = 1; i < synd.length; i++) {
      if (synd[i] !== 0) {
        allZero = false;
        break;
      }
    }
    if (allZero) return received.slice(0, received.length - nsym);
    const errLoc = rsFindErrorLocator(synd, nsym);
    const errPos = rsFindErrors(errLoc, received.length);
    const corrected = rsCorrectErrata(new Uint8Array(received), synd, errPos);
    const syndAfter = rsCalcSyndromes(corrected, nsym);
    for (let i = 1; i < syndAfter.length; i++) {
      if (syndAfter[i] !== 0) throw new Error("rs: correction failed (residual syndrome)");
    }
    return corrected.slice(0, corrected.length - nsym);
  }
  function rsEncode(input, parityBytes) {
    if (parityBytes <= 0 || parityBytes >= BLOCK_SIZE) {
      throw new Error(`rs: parityBytes must be 1..${BLOCK_SIZE - 1}, got ${parityBytes}`);
    }
    const dataPerBlock = BLOCK_SIZE - parityBytes;
    const blockCount = Math.ceil(input.length / dataPerBlock) || 1;
    const out = Buffer.alloc(blockCount * BLOCK_SIZE);
    for (let i = 0; i < blockCount; i++) {
      const srcStart = i * dataPerBlock;
      const srcEnd = Math.min(srcStart + dataPerBlock, input.length);
      const block = new Uint8Array(dataPerBlock);
      for (let j = srcStart; j < srcEnd; j++) block[j - srcStart] = input[j];
      const codeword = rsEncodeBlock(block, parityBytes);
      for (let j = 0; j < BLOCK_SIZE; j++) out[i * BLOCK_SIZE + j] = codeword[j];
    }
    return out;
  }
  function rsDecode(input, parityBytes, originalLength) {
    if (parityBytes <= 0 || parityBytes >= BLOCK_SIZE) {
      throw new Error(`rs: parityBytes must be 1..${BLOCK_SIZE - 1}, got ${parityBytes}`);
    }
    if (input.length % BLOCK_SIZE !== 0) {
      throw new Error(`rs: input length ${input.length} is not a multiple of ${BLOCK_SIZE}`);
    }
    const dataPerBlock = BLOCK_SIZE - parityBytes;
    const blockCount = input.length / BLOCK_SIZE;
    const out = Buffer.alloc(blockCount * dataPerBlock);
    for (let i = 0; i < blockCount; i++) {
      const block = new Uint8Array(input.subarray(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE));
      const decoded = rsDecodeBlock(block, parityBytes);
      for (let j = 0; j < dataPerBlock; j++) out[i * dataPerBlock + j] = decoded[j];
    }
    return out.subarray(0, originalLength);
  }

  // ../../packages/core/src/fec/reed-solomon-fec.ts
  var PARITY_TABLE = {
    5: { id: "rs-5", label: "Reed-Solomon \xB7 light", headerLevel: 1, parityBytes: 12 },
    15: { id: "rs-15", label: "Reed-Solomon \xB7 medium", headerLevel: 2, parityBytes: 38 },
    25: { id: "rs-25", label: "Reed-Solomon \xB7 heavy", headerLevel: 3, parityBytes: 64 }
  };
  var ReedSolomonFec = class _ReedSolomonFec extends AbstractFec {
    static optionsSchema = {
      parity: enumOption([5, 15, 25], 15, {
        label: "Parity bytes",
        description: "Higher = more recoverable corruption, larger overhead."
      })
    };
    static fromOptions(opts = {}) {
      const parity = opts.parity ?? 15;
      const info = PARITY_TABLE[parity];
      if (!info) throw new Error(`unknown parity: ${parity}`);
      return new _ReedSolomonFec(info);
    }
    /** All known parity levels — used by registry to enumerate instances. */
    static enumerate() {
      return Object.values(PARITY_TABLE).map((info) => new _ReedSolomonFec(info));
    }
    id;
    label;
    headerLevel;
    parityBytes;
    overheadPct;
    recoverableBytesPerBlock;
    constructor(init) {
      super();
      this.id = init.id;
      this.label = init.label;
      this.headerLevel = init.headerLevel;
      this.parityBytes = init.parityBytes;
      this.overheadPct = Math.round(init.parityBytes / (255 - init.parityBytes) * 1e3) / 10;
      this.recoverableBytesPerBlock = Math.floor(init.parityBytes / 2);
    }
    encode(input) {
      return {
        data: rsEncode(input, this.parityBytes),
        level: this.headerLevel,
        originalLength: input.length
      };
    }
    decode(input, originalLength) {
      try {
        return rsDecode(input, this.parityBytes, originalLength);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new FecDecodeError(`FEC could not recover token (${this.id}): ${msg}`);
      }
    }
  };

  // ../../packages/core/src/fec/registry.ts
  var FecRegistry = class {
    classes = /* @__PURE__ */ new Map();
    constructor() {
      this.register("none", NoneFec);
      this.register("rs", ReedSolomonFec);
    }
    register(familyId, Ctor) {
      if (this.classes.has(familyId)) return;
      this.classes.set(familyId, Ctor);
    }
    byMode(mode) {
      if (!mode || mode === "none") return new NoneFec();
      const dashIdx = mode.lastIndexOf("-");
      const family = dashIdx > 0 ? mode.slice(0, dashIdx) : mode;
      const level = dashIdx > 0 ? Number(mode.slice(dashIdx + 1)) : void 0;
      const Ctor = this.classes.get(family);
      if (!Ctor) return new NoneFec();
      if (Ctor.fromOptions) return Ctor.fromOptions({ parity: level });
      return new Ctor();
    }
    byHeaderLevel(level) {
      for (const inst of this.list()) {
        if (inst.headerLevel === level) return inst;
      }
      return new NoneFec();
    }
    /** Flat list of all (family × level) instances — for dashboard / decode iteration. */
    list() {
      const out = [];
      for (const Ctor of this.classes.values()) {
        if (Ctor.enumerate) out.push(...Ctor.enumerate());
        else out.push(new Ctor());
      }
      return out;
    }
    /** Class-level metadata. */
    listFamilies() {
      return [...this.classes.values()];
    }
    listModes() {
      return this.list().map((f) => f.id);
    }
  };
  var fecRegistry = new FecRegistry();

  // ../../packages/core/src/finalize-chunks.ts
  async function finalizeChunks(chunks, key) {
    const { compressionLevel, encrypted, fecLevel, preFecLength } = chunks[0];
    let combined = Buffer.concat(chunks.map((c) => c.bytes));
    if (fecLevel > 0) {
      const fec = fecRegistry.byHeaderLevel(fecLevel);
      combined = fec.decode(combined, preFecLength);
    }
    if (encrypted) {
      if (!key) throw new Error("Token is encrypted \u2014 provide --key to decode");
      combined = Buffer.from(await decryptData(combined, key));
    }
    return await compressorRegistry.byHeaderLevel(compressionLevel).decompress(combined);
  }

  // ../../packages/core/src/components/compose.ts
  function composeOptions(parts) {
    const out = {};
    for (const [namespace, schema] of Object.entries(parts)) {
      for (const [key, def] of Object.entries(schema)) {
        out[`${namespace}.${key}`] = def;
      }
    }
    return out;
  }
  function composeEnvironments(components) {
    const allEnvs = ["node", "browser"];
    let result = new Set(allEnvs);
    for (const c of components) {
      const envs = c.environments ?? allEnvs;
      const env = new Set(envs);
      result = new Set([...result].filter((e) => env.has(e)));
    }
    return [...result];
  }

  // ../../packages/core/src/diff.ts
  var DIFF_COMPRESSOR = "deflate-9";
  async function computeTextDiff(packA, packB) {
    const out = [];
    if (packA.isPack() && packB.isPack()) {
      const listA = new Set(packA.list);
      const listB = new Set(packB.list);
      const allPaths = /* @__PURE__ */ new Set([...listA, ...listB]);
      for (const filePath of allPaths) {
        const textA2 = listA.has(filePath) ? await packA.text(filePath).catch(() => null) : null;
        const textB2 = listB.has(filePath) ? await packB.text(filePath).catch(() => null) : null;
        const fd = lineDiff(filePath, textA2, textB2);
        if (fd.hunks.length > 0) out.push(fd);
      }
      return out;
    }
    const textA = !packA.isPack() && !packA.isDiff() ? await packA.text().catch(() => null) : null;
    const textB = !packB.isPack() && !packB.isDiff() ? await packB.text().catch(() => null) : null;
    return [lineDiff("(file)", textA, textB)].filter((fd) => fd.hunks.length > 0);
  }
  function lineDiff(filePath, a, b) {
    const linesA = (a ?? "").split("\n");
    const linesB = (b ?? "").split("\n");
    const hunks = [];
    let added = 0;
    let removed = 0;
    const max = Math.max(linesA.length, linesB.length);
    const lines = [];
    let firstChangeA = -1;
    for (let i = 0; i < max; i++) {
      const la = linesA[i] ?? null;
      const lb = linesB[i] ?? null;
      if (la === lb) {
        if (lines.length > 0) {
          hunks.push({ lineA: firstChangeA + 1, lineB: firstChangeA + 1, lines: lines.slice() });
          lines.length = 0;
          firstChangeA = -1;
        }
        continue;
      }
      if (firstChangeA === -1) firstChangeA = i;
      if (la !== null && (lb === null || la !== lb)) {
        lines.push({ type: "-", text: la });
        removed++;
      }
      if (lb !== null && (la === null || la !== lb)) {
        lines.push({ type: "+", text: lb });
        added++;
      }
    }
    if (lines.length > 0) {
      hunks.push({ lineA: firstChangeA + 1, lineB: firstChangeA + 1, lines });
    }
    return { filePath, hunks, added, removed };
  }
  async function packToEntries(pack2) {
    if (pack2.isPack()) return pack2.extractAll();
    if (pack2.isDiff()) {
      throw new Error("packToEntries: DiffPack inputs not supported");
    }
    const filePack = pack2;
    const bytes = await filePack.content();
    return [{ path: "_root", bytes }];
  }
  async function defaultDiffCompress(bytes) {
    const r = await compressRaw(bytes, DIFF_COMPRESSOR);
    return {
      bytes: r.bytes,
      compressor: r.compressor,
      level: r.level,
      originalSize: r.originalSize
    };
  }

  // ../../packages/core/src/pack-format/format-byte.ts
  var FORMAT_FILE = 1;
  var FORMAT_PACK = 2;
  var FORMAT_DIFF = 3;
  var VALID = /* @__PURE__ */ new Set([FORMAT_FILE, FORMAT_PACK, FORMAT_DIFF]);
  function writeFormatByte(buf, offset, value) {
    if (!VALID.has(value)) throw new Error(`unknown format byte: 0x${value.toString(16)}`);
    buf[offset] = value;
  }
  function readFormatByte(buf, offset) {
    const value = buf[offset];
    if (!VALID.has(value)) throw new Error(`unknown format byte: 0x${value.toString(16)}`);
    return value;
  }

  // ../../packages/core/src/pack-format/manifest.ts
  var SUPPORTED_VERSION = 1;
  var enc2 = new TextEncoder();
  var dec = new TextDecoder("utf-8");
  function readPackManifest(bytes) {
    const parsed = JSON.parse(dec.decode(bytes));
    if (parsed.version !== SUPPORTED_VERSION) {
      throw new Error(`unsupported manifest version: ${parsed.version}`);
    }
    return parsed;
  }
  function writeDiffManifest(m) {
    return enc2.encode(JSON.stringify(m));
  }
  function readDiffManifest(bytes) {
    const parsed = JSON.parse(dec.decode(bytes));
    if (parsed.version !== SUPPORTED_VERSION) {
      throw new Error(`unsupported diff manifest version: ${parsed.version}`);
    }
    return parsed;
  }

  // ../../packages/core/src/pack-format/encode-diff.ts
  var SIG = Uint8Array.of(192, 222, 174, 84);
  function hash(bytes) {
    let h = 2166136261;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }
  function computeDiffOps(prev, next) {
    const prevByPath = new Map(prev.map((e) => [e.path, e]));
    const nextByPath = new Map(next.map((e) => [e.path, e]));
    const prevByHash = /* @__PURE__ */ new Map();
    for (const e of prev) {
      const h = hash(e.bytes);
      if (!prevByHash.has(h)) prevByHash.set(h, e.path);
    }
    const ops = [];
    const renamedFromPaths = /* @__PURE__ */ new Set();
    for (const e of next) {
      const prevEntry = prevByPath.get(e.path);
      if (!prevEntry) {
        const fromPath = prevByHash.get(hash(e.bytes));
        if (fromPath && !nextByPath.has(fromPath) && !renamedFromPaths.has(fromPath)) {
          ops.push({ op: "rename", path: e.path, fromPath });
          renamedFromPaths.add(fromPath);
        } else {
          ops.push({ op: "add", path: e.path });
        }
      } else if (hash(prevEntry.bytes) !== hash(e.bytes)) {
        ops.push({ op: "modify", path: e.path });
      }
    }
    for (const e of prev) {
      if (!nextByPath.has(e.path) && !renamedFromPaths.has(e.path)) {
        ops.push({ op: "delete", path: e.path });
      }
    }
    return ops;
  }
  async function encodeDiff(prev, next, compress) {
    const ops = computeDiffOps(prev, next);
    const nextByPath = new Map(next.map((e) => [e.path, e]));
    let runningOffset = 0;
    const regionBytes = [];
    const manifestEntries = [];
    for (const op of ops) {
      if (op.op === "add") {
        const file = nextByPath.get(op.path);
        if (!file) throw new Error(`encodeDiff: missing next entry for op path: ${op.path}`);
        const c = await compress(file.bytes);
        manifestEntries.push({
          op: op.op,
          path: op.path,
          compressor: c.compressor,
          level: c.level,
          compressedSize: c.bytes.length,
          originalSize: c.originalSize,
          offset: runningOffset
        });
        regionBytes.push(c.bytes);
        runningOffset += c.bytes.length;
      } else if (op.op === "modify") {
        const file = nextByPath.get(op.path);
        const prevFile = prev.find((e) => e.path === op.path);
        if (!file) throw new Error(`encodeDiff: missing next entry for op path: ${op.path}`);
        if (!prevFile) throw new Error(`encodeDiff: missing previous entry for op path: ${op.path}`);
        const full = await compress(file.bytes);
        const patch = computeBytePatch(prevFile.bytes, file.bytes);
        const compressedPatch = await compress(patch.insert);
        const usePatch = compressedPatch.bytes.length < full.bytes.length;
        if (usePatch) {
          manifestEntries.push({
            op: "patch",
            path: op.path,
            compressor: compressedPatch.compressor,
            level: compressedPatch.level,
            compressedSize: compressedPatch.bytes.length,
            originalSize: compressedPatch.originalSize,
            offset: runningOffset,
            patchStart: patch.start,
            deleteSize: patch.deleteSize,
            targetSize: patch.targetSize
          });
          regionBytes.push(compressedPatch.bytes);
          runningOffset += compressedPatch.bytes.length;
        } else {
          manifestEntries.push({
            op: op.op,
            path: op.path,
            compressor: full.compressor,
            level: full.level,
            compressedSize: full.bytes.length,
            originalSize: full.originalSize,
            offset: runningOffset
          });
          regionBytes.push(full.bytes);
          runningOffset += full.bytes.length;
        }
      } else if (op.op === "rename") {
        manifestEntries.push({ op: "rename", path: op.path, fromPath: op.fromPath });
      } else {
        manifestEntries.push({ op: "delete", path: op.path });
      }
    }
    const manifest = { version: 1, ops: manifestEntries };
    const manifestBytes = writeDiffManifest(manifest);
    const totalRegionSize = regionBytes.reduce((s, r) => s + r.length, 0);
    const out = new Uint8Array(4 + 1 + 4 + manifestBytes.length + totalRegionSize);
    out.set(SIG, 0);
    writeFormatByte(out, 4, FORMAT_DIFF);
    new DataView(out.buffer, out.byteOffset, out.byteLength).setUint32(5, manifestBytes.length, true);
    out.set(manifestBytes, 9);
    let pos = 9 + manifestBytes.length;
    for (const r of regionBytes) {
      out.set(r, pos);
      pos += r.length;
    }
    return out;
  }
  function computeBytePatch(prev, next) {
    const min = Math.min(prev.length, next.length);
    let prefix = 0;
    while (prefix < min && prev[prefix] === next[prefix]) prefix += 1;
    let suffix = 0;
    while (suffix < min - prefix && prev[prev.length - 1 - suffix] === next[next.length - 1 - suffix]) {
      suffix += 1;
    }
    const nextEnd = next.length - suffix;
    const prevEnd = prev.length - suffix;
    return {
      start: prefix,
      deleteSize: prevEnd - prefix,
      insert: next.subarray(prefix, nextEnd),
      targetSize: next.length
    };
  }

  // ../../packages/core/src/algorithms/types.ts
  var AbstractAlgorithm = class {
    // Static class bindings — subclass MUST override.
    static id;
    static name;
    static title;
    static description;
    static Codec;
    static Surface;
    static Compressor;
    static Drawer;
    static Fec;
    /** Options schema composed from component bindings. Read at the catalog/dashboard layer. */
    static get optionsSchema() {
      const parts = {
        codec: this.Codec?.optionsSchema ?? {},
        surface: this.Surface?.optionsSchema ?? {},
        compressor: this.Compressor?.optionsSchema ?? {},
        drawer: this.Drawer?.optionsSchema ?? {}
      };
      if (this.Fec) parts.fec = this.Fec.optionsSchema;
      return composeOptions(parts);
    }
    /** Capabilities derived from component classes. Static — no instantiation. */
    static get capabilities() {
      const components = [
        this.Codec,
        this.Surface,
        this.Compressor,
        this.Drawer
      ];
      const environments = composeEnvironments(components);
      const surfaceProbe = new this.Surface();
      return {
        environments,
        surface: surfaceProbe.format,
        channels: [...surfaceProbe.supportedChannels],
        streamable: surfaceProbe.streamable,
        lossless: surfaceProbe.lossless
      };
    }
    // Instance — populated by AbstractAlgorithm constructor based on opts.
    opts;
    codec;
    surface;
    compressor;
    drawer;
    fec;
    constructor(opts = {}) {
      this.opts = opts;
      const ctor = this.constructor;
      this.codec = instantiate2(ctor.Codec, opts.codec);
      this.surface = instantiate2(ctor.Surface, opts.surface);
      this.compressor = instantiate2(ctor.Compressor, opts.compressor);
      this.drawer = instantiate2(ctor.Drawer, opts.drawer);
      if (ctor.Fec) this.fec = instantiate2(ctor.Fec, opts.fec);
    }
    /**
     * Streaming encode. Default: collect input → run encode → emit single chunk.
     * Streaming-aware algorithms override with true pipelining.
     */
    encodeStream(input, opts = {}) {
      const algo = this;
      return new ReadableStream({
        async start(controller) {
          const collected = await collectStream(input);
          const out = await algo.encode(collected, opts);
          controller.enqueue(new Uint8Array(out.buffer, out.byteOffset, out.byteLength));
          controller.close();
        }
      });
    }
    /**
     * Streaming decode. Default: collect source → run decode → emit single chunk.
     */
    decodeStream(source, opts = {}) {
      const algo = this;
      return new ReadableStream({
        async start(controller) {
          const collected = await collectStream(source);
          const buf = Buffer.from(collected.buffer, collected.byteOffset, collected.byteLength);
          const out = await algo.decode(buf, opts);
          controller.enqueue(new Uint8Array(out.buffer, out.byteOffset, out.byteLength));
          controller.close();
        }
      });
    }
    /**
     * Pack-level diff. Returns a chainable result whose `.text()` produces a
     * line-level `FileDiff[]` and `.token()` produces a structured diff token
     * (Uint8Array). The diff token is wrapped using THIS algorithm's `encode()`
     * so applying it later (via `decode → basePack.apply(diffPack)`) is symmetric
     * with the source tokens' packaging.
     *
     * Subclasses may override to redefine diff semantics (e.g. PixelRange could
     * compare `tpAK` chunks directly without re-encoding).
     */
    diff(packA, packB) {
      const algo = this;
      return {
        text: () => computeTextDiff(packA, packB),
        async token() {
          const entriesA = await packToEntries(packA);
          const entriesB = await packToEntries(packB);
          const diffBytes = await encodeDiff(entriesA, entriesB, defaultDiffCompress);
          const buf = Buffer.from(diffBytes.buffer, diffBytes.byteOffset, diffBytes.byteLength);
          const out = await algo.encode(buf);
          return new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
        }
      };
    }
    /** Source detection — does this algorithm own this artifact? */
    canHandle(_buffer, _ext) {
      return false;
    }
  };
  async function collectStream(stream) {
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
    const merged = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      merged.set(c, off);
      off += c.length;
    }
    return merged;
  }
  function instantiate2(Ctor, opts) {
    const optsRecord = opts && typeof opts === "object" ? opts : {};
    if (typeof Ctor.fromOptions === "function") return Ctor.fromOptions(optsRecord);
    return new Ctor();
  }

  // ../../packages/core/src/algorithms/pixel-algorithm.ts
  var PixelAlgorithm = class extends AbstractAlgorithm {
    /**
     * Run the encode pipeline up through `drawer.write`, returning pixel chunks.
     * Browser uses this and writes its own canvas-PNG; Node `encode()` calls
     * this and then runs the chunk through `surface.writeBuffer`.
     */
    async encodeToChunks(input, opts = {}) {
      const merged = { ...this.opts, ...opts };
      const requestedChannels = merged.surface?.channels ?? 3;
      const requiredChannels = this.codec.metadata?.requiredChannels;
      const codecBpp = requiredChannels ?? requestedChannels;
      const bpp = this.surface.coerceBpp(codecBpp);
      let data = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
      let compressionLevel = 0;
      let uncompressedLength = 0;
      if (this.compressor.id !== "none") {
        const result = await this.compressor.compress(data);
        if (result.data.length < data.length) {
          uncompressedLength = data.length;
          data = result.data;
          compressionLevel = result.level;
        }
      }
      let encrypted = false;
      const key = merged.key;
      if (key) {
        data = Buffer.from(await encryptData(data, key));
        encrypted = true;
      }
      let fecLevel = 0;
      let preFecLength = 0;
      if (this.fec) {
        preFecLength = data.length;
        const fecResult = this.fec.encode(data);
        data = fecResult.data;
        fecLevel = fecResult.level;
      }
      const algorithmId = this.constructor.id;
      const ctx = {
        algorithmId,
        codec: this.codec,
        surface: this.surface,
        bpp,
        compressionLevel,
        uncompressedLength,
        encrypted,
        cellSize: 1,
        requiresFullHeader: this.compressor.requiresFullHeader || fecLevel > 0,
        fecLevel,
        preFecLength
      };
      return this.drawer.write(data, ctx).chunks;
    }
    async encode(input, opts = {}) {
      const chunks = await this.encodeToChunks(input, opts);
      if (chunks.length > 1) {
        throw new Error(
          `PixelAlgorithm.encode: payload requires ${chunks.length} chunks; multi-chunk not implemented`
        );
      }
      return this.surface.writeBuffer(chunks[0]);
    }
    /**
     * Decode from pre-decoded pixel images. Browser path: it has already done
     * the canvas → ImageData pipeline, so this skips `surface.readBuffer`.
     */
    async decodeFromImages(images, opts = {}) {
      const reads = images.map((image) => {
        const drawer = pickDrawerForPixels(image.pixels);
        return drawer.read(image, { codec: this.codec });
      });
      return finalizeChunks(reads, opts.key ?? this.opts.key);
    }
    async decode(source, opts = {}) {
      const buf = Buffer.isBuffer(source) ? source : Buffer.from(source.buffer, source.byteOffset, source.byteLength);
      const image = await this.surface.readBuffer(buf);
      const result = await this.decodeFromImages([image], opts);
      return result;
    }
    /**
     * Streaming decode. Orchestrates entity composition:
     *
     *   surface.decodeStream(stream)               → AsyncIterable<pixelRow>
     *   → codec header read from initial rows      (token-format concern)
     *   → codec.decodeChunk(rows, state)           → data byte chunks
     *   → compressor.decompressWebStream(stream)   → final payload bytes
     *
     * Returns a `ReadableStream<Uint8Array>` of decoded payload bytes, matching
     * `AbstractAlgorithm.decodeStream`. True-streaming surfaces (StreamingPng)
     * + compressors (browser deflate/brotli) deliver byte overlap with
     * download. Surfaces or compressors without streaming overrides fall back
     * to buffered defaults — the orchestration is unchanged.
     */
    decodeStream(source, opts = {}) {
      const algorithm = this;
      let readerPromise = null;
      async function reader() {
        if (!readerPromise) {
          readerPromise = runDecodeStream(algorithm, source, opts).then((stream) => stream.getReader());
        }
        return readerPromise;
      }
      return new ReadableStream({
        async pull(controller) {
          try {
            const output = await reader();
            const { done, value } = await output.read();
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
          } catch (e) {
            controller.error(e);
          }
        },
        async cancel(reason) {
          const output = await readerPromise;
          await output?.cancel(reason).catch(() => void 0);
        }
      });
    }
    /** Pixel-header sniff. Recipes whose ID is in the pixel data inherit this. */
    canHandle(buffer) {
      if (!buffer || buffer.length < 6) return false;
      const ctor = this.constructor;
      try {
        if (isCompactToken(buffer)) return readCompactHeader(buffer).algoId === ctor.id;
        return readHeader(buffer).algorithmId === ctor.id;
      } catch {
        return false;
      }
    }
  };
  async function decodeSurfaceStream(algorithm, handle, opts = {}) {
    return collectDecodedStream(runDecodeSurfaceStream(algorithm, handle, opts), opts);
  }
  async function runDecodeStream(algorithm, source, opts) {
    const handle = await algorithm.surface.decodeStream(source);
    return runDecodeSurfaceStream(algorithm, handle, opts);
  }
  function runDecodeSurfaceStream(algorithm, handle, _opts) {
    const { fileChannels, rows } = handle;
    let dataController;
    const dataStream = new ReadableStream({
      start(c) {
        dataController = c;
      }
    });
    let headerParsed = false;
    let bpp = 3;
    let dataLength = 0;
    let compressionLevel = 0;
    let activeCodec = null;
    let codecState = null;
    let pixelBuf = new Uint8Array(0);
    let fedToOuter = 0;
    let resolveHeader;
    const headerReady = new Promise((resolve) => {
      resolveHeader = resolve;
    });
    function appendBytes2(a, b) {
      if (a.byteLength === 0) return b;
      if (b.byteLength === 0) return a;
      const out = new Uint8Array(a.byteLength + b.byteLength);
      out.set(a, 0);
      out.set(b, a.byteLength);
      return out;
    }
    async function finishHeader(headerBytes) {
      headerParsed = true;
      if (activeCodec && isStreamingCodec(activeCodec)) {
        codecState = activeCodec.createDecodeState();
      }
      resolveHeader();
      const dataPixels = pixelBuf.subarray(headerBytes);
      pixelBuf = new Uint8Array(0);
      if (dataPixels.byteLength > 0) {
        feedDataPixels(new Uint8Array(dataPixels));
      }
    }
    function feedDataPixels(pixels) {
      if (fedToOuter >= dataLength) return;
      const pixelCount = Math.floor(pixels.byteLength / fileChannels);
      if (pixelCount === 0) return;
      const fcBytes = pixels.subarray(0, pixelCount * fileChannels);
      const bppBytes = fromFileChannels(fcBytes, pixelCount, fileChannels, bpp);
      let dataBytes;
      if (activeCodec && isStreamingCodec(activeCodec) && codecState) {
        const result = activeCodec.decodeChunk(bppBytes, codecState);
        codecState = result.state;
        dataBytes = new Uint8Array(
          result.bytes.buffer,
          result.bytes.byteOffset,
          result.bytes.byteLength
        );
      } else {
        dataBytes = new Uint8Array(bppBytes.buffer, bppBytes.byteOffset, bppBytes.byteLength);
      }
      const remaining = dataLength - fedToOuter;
      const toFeed = dataBytes.subarray(0, Math.min(remaining, dataBytes.byteLength));
      fedToOuter += toFeed.byteLength;
      dataController.enqueue(toFeed);
    }
    const outputStreamPromise = (async () => {
      await headerReady;
      return compressionLevel === 0 ? dataStream : compressorRegistry.byHeaderLevel(compressionLevel).decompressWebStream(dataStream);
    })();
    const pumpPromise = (async () => {
      try {
        for await (const row of rows) {
          if (!headerParsed) {
            const compactBytes = COMPACT_HEADER_PIXELS * fileChannels;
            const fullBytes = HEADER_PIXELS * fileChannels;
            pixelBuf = appendBytes2(pixelBuf, row);
            if (pixelBuf.byteLength >= compactBytes && isCompactToken(pixelBuf)) {
              const ch = readCompactHeader(pixelBuf);
              bpp = ch.channels;
              compressionLevel = ch.flags & 2 ? 2 : 0;
              dataLength = ch.dataLength;
              activeCodec = algorithm.codec;
              await finishHeader(compactBytes);
            } else if (pixelBuf.byteLength >= fullBytes) {
              try {
                const h = readHeader(pixelBuf);
                const fecLevel = h.ecLevel >> 1 & 7;
                if (fecLevel > 0) {
                  throw new Error("FEC tokens cannot be streamed; use decode() with the full blob");
                }
                bpp = h.channels;
                compressionLevel = h.compressionLevel;
                dataLength = h.fileLength;
                activeCodec = algorithm.codec;
                await finishHeader(fullBytes);
              } catch {
              }
            }
            continue;
          }
          feedDataPixels(row);
        }
        dataController.close();
      } catch (e) {
        dataController.error(e);
        throw e;
      }
    })();
    let outputReaderPromise = null;
    async function outputReader() {
      if (!outputReaderPromise) {
        outputReaderPromise = outputStreamPromise.then((stream) => stream.getReader());
      }
      return outputReaderPromise;
    }
    return new ReadableStream({
      async pull(controller) {
        try {
          const reader = await outputReader();
          const { done, value } = await reader.read();
          if (done) {
            await pumpPromise;
            controller.close();
            return;
          }
          controller.enqueue(value);
        } catch (e) {
          controller.error(e);
        }
      },
      async cancel(reason) {
        const output = await outputReaderPromise;
        await output?.cancel(reason).catch(() => void 0);
      }
    });
  }
  async function collectDecodedStream(stream, opts) {
    const reader = stream.getReader();
    const collected = [];
    let total = 0;
    let sawFirstChunk = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!sawFirstChunk) {
        sawFirstChunk = true;
        opts.onFirstDecodedChunk?.(value);
      }
      collected.push(value);
      total += value.byteLength;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of collected) {
      out.set(c, offset);
      offset += c.byteLength;
    }
    return Buffer.from(out.buffer, out.byteOffset, out.byteLength);
  }
  function definePixelAlgorithm(spec) {
    const Cls = class extends PixelAlgorithm {
    };
    Cls.id = spec.id;
    Cls.title = spec.title;
    Cls.description = spec.description;
    Cls.Codec = spec.Codec;
    Cls.Surface = spec.Surface;
    Cls.Compressor = spec.Compressor;
    Cls.Drawer = spec.Drawer;
    Cls.Fec = spec.Fec;
    Object.defineProperty(Cls, "name", { value: spec.name, configurable: true });
    return Cls;
  }

  // ../../packages/core/src/pack-format/apply-diff.ts
  var SIG2 = Uint8Array.of(192, 222, 174, 84);
  function decodeDiff(bytes) {
    if (bytes.length < 9 || bytes[0] !== SIG2[0] || bytes[1] !== SIG2[1] || bytes[2] !== SIG2[2] || bytes[3] !== SIG2[3]) {
      throw new Error("decodeDiff: missing tokenpack signature");
    }
    const fmt = readFormatByte(bytes, 4);
    if (fmt !== FORMAT_DIFF) {
      throw new Error(`decodeDiff: expected diff format (0x03), got 0x${fmt.toString(16)}`);
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const manifestSize = view.getUint32(5, true);
    const manifestBytes = bytes.subarray(9, 9 + manifestSize);
    const manifest = readDiffManifest(manifestBytes);
    const regionsStart = 9 + manifestSize;
    return {
      manifest,
      regionsStart,
      bytes,
      extractRegion(path) {
        const op = manifest.ops.find(
          (o) => o.path === path && (o.op === "add" || o.op === "modify" || o.op === "patch")
        );
        if (!op || op.offset === void 0 || op.compressedSize === void 0) {
          throw new Error(`decodeDiff: no add/modify region for path: ${path}`);
        }
        const start = regionsStart + op.offset;
        return bytes.subarray(start, start + op.compressedSize);
      }
    };
  }

  // ../../packages/core/src/pack-format/decode-pack.ts
  var SIG3 = Uint8Array.of(192, 222, 174, 84);
  function decodePack(bytes) {
    if (bytes.length < 9 || bytes[0] !== SIG3[0] || bytes[1] !== SIG3[1] || bytes[2] !== SIG3[2] || bytes[3] !== SIG3[3]) {
      throw new Error("decodePack: missing tokenpack signature");
    }
    const fmt = readFormatByte(bytes, 4);
    if (fmt !== FORMAT_PACK) {
      throw new Error(`decodePack: expected pack format (0x02), got 0x${fmt.toString(16)}`);
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const manifestSize = view.getUint32(5, true);
    const manifestBytes = bytes.subarray(9, 9 + manifestSize);
    const manifest = readPackManifest(manifestBytes);
    const regionsStart = 9 + manifestSize;
    const fileByPath = new Map(manifest.files.map((file) => [file.path, file]));
    return {
      manifest,
      regionsStart,
      bytes,
      extractRegion(path) {
        const file = fileByPath.get(path);
        if (!file) throw new Error(`no entry for path: ${path}`);
        const start = regionsStart + file.offset;
        return bytes.subarray(start, start + file.compressedSize);
      }
    };
  }

  // ../../packages/core/src/pack-format/encode-file.ts
  var SIG4 = Uint8Array.of(192, 222, 174, 84);
  var enc3 = new TextEncoder();
  function readWrappedFile(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const nameLen = view.getUint16(5, true);
    const name = new TextDecoder().decode(bytes.subarray(7, 7 + nameLen));
    const payload = bytes.subarray(7 + nameLen);
    return { name, payload };
  }

  // ../../packages/core/src/pack/dir-pack.ts
  var DirPack = class {
    constructor(entries, extractOne, extractAllFn, diffToFn, applyDiffFn) {
      this.extractOne = extractOne;
      this.extractAllFn = extractAllFn;
      this.diffToFn = diffToFn;
      this.applyDiffFn = applyDiffFn;
      this.entries = entries;
      this.list = entries.map((e) => e.path);
    }
    list;
    entries;
    isPack() {
      return true;
    }
    isRouter() {
      return false;
    }
    isDiff() {
      return false;
    }
    async materialize() {
      throw new Error("DirPack.materialize: not configured (env package must attach runtime support)");
    }
    async extract(path) {
      if (!this.entries.find((e) => e.path === path)) {
        throw new Error(`no entry for path: ${path}`);
      }
      return this.extractOne(path);
    }
    async text(path) {
      return new TextDecoder().decode(await this.extract(path));
    }
    async json(path) {
      return JSON.parse(await this.text(path));
    }
    async blob(path) {
      const bytes = await this.extract(path);
      return new Blob([bytes]);
    }
    async extractAll() {
      return this.extractAllFn();
    }
    async diffTo(other) {
      if (!this.diffToFn) {
        throw new Error("DirPack.diffTo: not configured (env package must inject diffToFn)");
      }
      return this.diffToFn(this, other);
    }
    async apply(diff2) {
      if (this.applyDiffFn) return this.applyDiffFn(this, diff2);
      return diff2.apply(this);
    }
  };

  // ../../packages/core/src/pack/diff-pack.ts
  var DiffPack = class {
    constructor(entries, diffBytes, decompress) {
      this.diffBytes = diffBytes;
      this.decompress = decompress;
      this.entries = entries;
      this.list = entries.map((e) => e.path);
    }
    list;
    entries;
    isPack() {
      return false;
    }
    isRouter() {
      return false;
    }
    isDiff() {
      return true;
    }
    async materialize() {
      throw new Error("DiffPack.materialize: diff tokens cannot be materialized directly");
    }
    async apply(prev) {
      const decoded = decodeDiff(this.diffBytes);
      const opsByPath = new Map(decoded.manifest.ops.map((op) => [op.path, op]));
      const deleted = new Set(
        decoded.manifest.ops.filter((op) => op.op === "delete").map((op) => op.path)
      );
      const renamedFrom = new Map(
        decoded.manifest.ops.filter((op) => op.op === "rename" && op.fromPath).map((op) => [op.fromPath, op.path])
      );
      const entries = buildAppliedEntries(prev.entries, this.entries, deleted, renamedFrom);
      const extractOne = async (path) => {
        const op = opsByPath.get(path);
        if (!op) return prev.extract(path);
        if (op.op === "rename") return prev.extract(op.fromPath);
        if (op.op === "delete") throw new Error(`no entry for path: ${path}`);
        const region = decoded.extractRegion(path);
        const bytes = await this.decompress(region, op.compressor, {
          level: op.level,
          uncompressedLength: op.originalSize
        });
        if (op.op !== "patch") return bytes;
        const base2 = await prev.extract(path);
        return applyBytePatch(base2, op.patchStart, op.deleteSize, bytes, op.targetSize);
      };
      return new DirPack(
        entries,
        extractOne,
        async () => Promise.all(
          entries.map(async (entry) => ({ path: entry.path, bytes: await extractOne(entry.path) }))
        )
      );
    }
  };
  function buildAppliedEntries(prevEntries, diffEntries, deleted, renamedFrom) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    const diffByPath = new Map(diffEntries.map((entry) => [entry.path, entry]));
    for (const entry of prevEntries) {
      if (deleted.has(entry.path)) continue;
      const renamedPath = renamedFrom.get(entry.path);
      if (renamedPath) {
        out.push({ path: renamedPath, size: entry.size });
        seen.add(renamedPath);
        continue;
      }
      const diffEntry = diffByPath.get(entry.path);
      if (diffEntry && diffEntry.op !== "rename" && diffEntry.op !== "delete") {
        out.push({ path: entry.path, size: diffEntry.size ?? entry.size });
      } else {
        out.push(entry);
      }
      seen.add(entry.path);
    }
    for (const entry of diffEntries) {
      if (seen.has(entry.path) || !addsEntry(entry.op)) continue;
      out.push({ path: entry.path, size: entry.size ?? 0 });
      seen.add(entry.path);
    }
    return out;
  }
  function addsEntry(op) {
    return op === "add" || op === "modify" || op === "patch";
  }
  function applyBytePatch(base2, start, deleteSize, insert, targetSize) {
    if (start < 0 || deleteSize < 0 || start + deleteSize > base2.length) {
      throw new Error("DiffPack.apply: invalid patch bounds");
    }
    const out = new Uint8Array(base2.length - deleteSize + insert.length);
    out.set(base2.subarray(0, start), 0);
    out.set(insert, start);
    out.set(base2.subarray(start + deleteSize), start + insert.length);
    if (out.length !== targetSize) {
      throw new Error(`DiffPack.apply: patch produced ${out.length} bytes, expected ${targetSize}`);
    }
    return out;
  }

  // ../../packages/core/src/pack/file-pack.ts
  var FilePack = class {
    constructor(info, load) {
      this.load = load;
      this.list = [info.name];
      this.entries = [{ path: info.name, size: info.size }];
    }
    list;
    entries;
    isPack() {
      return false;
    }
    isRouter() {
      return false;
    }
    isDiff() {
      return false;
    }
    async materialize() {
      throw new Error(
        "FilePack.materialize: not configured (env package must attach runtime support)"
      );
    }
    async content() {
      return this.load();
    }
    async text() {
      return new TextDecoder().decode(await this.load());
    }
    async json() {
      return JSON.parse(await this.text());
    }
    async blob() {
      const bytes = await this.load();
      return new Blob([bytes]);
    }
  };

  // ../../packages/core/src/pack/from-bytes.ts
  var SIG5 = Uint8Array.of(192, 222, 174, 84);
  function hasSignature(bytes) {
    return bytes.length >= 4 && bytes[0] === SIG5[0] && bytes[1] === SIG5[1] && bytes[2] === SIG5[2] && bytes[3] === SIG5[3];
  }
  function fromBytes(bytes, opts) {
    const sigPresent = hasSignature(bytes);
    const fmt = sigPresent ? readFormatByte(bytes, 4) : FORMAT_FILE;
    if (fmt === FORMAT_FILE) {
      if (sigPresent) {
        const { name, payload } = readWrappedFile(bytes);
        return new FilePack({ name, size: payload.length }, async () => payload);
      }
      return new FilePack({ name: "", size: bytes.length }, async () => bytes);
    }
    if (fmt === FORMAT_PACK) {
      const decoded = decodePack(bytes);
      const entries = decoded.manifest.files.map((f) => ({ path: f.path, size: f.originalSize }));
      const fileByPath = new Map(decoded.manifest.files.map((file) => [file.path, file]));
      const regionFor = (file) => decoded.bytes.subarray(
        decoded.regionsStart + file.offset,
        decoded.regionsStart + file.offset + file.compressedSize
      );
      return new DirPack(
        entries,
        async (path) => {
          const file = fileByPath.get(path);
          if (!file) throw new Error(`no entry for path: ${path}`);
          const region = regionFor(file);
          return opts.decompress(region, file.compressor, {
            level: file.level,
            uncompressedLength: file.originalSize
          });
        },
        async () => Promise.all(
          decoded.manifest.files.map(async (f) => ({
            path: f.path,
            bytes: await opts.decompress(regionFor(f), f.compressor, {
              level: f.level,
              uncompressedLength: f.originalSize
            })
          }))
        ),
        opts.diffTo
      );
    }
    if (fmt === FORMAT_DIFF) {
      const decoded = decodeDiff(bytes);
      const entries = decoded.manifest.ops.map((o) => ({
        path: o.path,
        op: o.op,
        size: o.op === "patch" ? o.targetSize : o.originalSize,
        fromPath: o.fromPath
      }));
      return new DiffPack(entries, bytes, opts.decompress);
    }
    throw new Error(`fromBytes: unknown format byte 0x${fmt.toString(16)}`);
  }

  // ../../packages/core/src/algorithms/catalog.ts
  var AlgorithmCatalog = class {
    byName = /* @__PURE__ */ new Map();
    byId = /* @__PURE__ */ new Map();
    /** Register an algorithm Ctor. Idempotent on duplicate name. */
    register(Ctor) {
      if (this.byName.has(Ctor.name)) return;
      this.byName.set(Ctor.name, Ctor);
      if (!this.byId.has(Ctor.id)) this.byId.set(Ctor.id, Ctor);
    }
    getByName(name) {
      const Ctor = this.byName.get(name);
      if (!Ctor) throw new Error(`Unknown algorithm: "${name}"`);
      return Ctor;
    }
    getById(id) {
      const Ctor = this.byId.get(id);
      if (!Ctor) throw new Error(`Unknown algorithm id: ${id}`);
      return Ctor;
    }
    list() {
      return [...this.byName.values()];
    }
    /**
     * Resolve which algorithm should handle a given artifact buffer.
     * Strategy:
     *   1. Per-algorithm canHandle (cheap byte-level sniff for plugins).
     *   2. Ask each registered algorithm's own surface to decode pixels, then
     *      read the pixel header for the algorithm id.
     *   3. Throw.
     */
    async detectFromBuffer(buffer, ext) {
      return (await this.detectWithImage(buffer, ext)).Ctor;
    }
    /** Return detection pixels for reuse by the decode pipeline; no global buffer cache. */
    async detectWithImage(buffer, ext) {
      for (const Ctor of this.byName.values()) {
        try {
          const probe = new Ctor();
          if (probe.canHandle(buffer, ext)) return { Ctor };
        } catch {
        }
      }
      if (buffer && buffer.length > 8) {
        const normalizedExt = ext?.toLowerCase();
        for (const Ctor of this.byName.values()) {
          try {
            const probe = new Ctor();
            if (normalizedExt && probe.surface.extension !== normalizedExt) continue;
            if (probe.surface.streamable) continue;
            const image = await probe.surface.readBuffer(buffer);
            const id = isCompactToken(image.pixels) ? readCompactHeader(image.pixels).algoId : readHeader(image.pixels).algorithmId;
            const DetectedCtor = this.byId.get(id);
            if (DetectedCtor) return { Ctor: DetectedCtor, image };
          } catch {
          }
        }
      }
      throw new Error("no algorithm matched the provided artifact buffer");
    }
    clear() {
      this.byName.clear();
      this.byId.clear();
    }
  };

  // ../../packages/core/src/surfaces/decoration-renderer.ts
  function renderDecoration(cfg) {
    if (cfg.kind === "data-art") {
      if (!cfg.dataArtPixels) {
        throw new Error('renderDecoration: dataArtPixels required when kind === "data-art"');
      }
      return cfg.dataArtPixels;
    }
    const size = Math.max(1, cfg.size | 0);
    const fileChannels = 3;
    const pixels = new Uint8Array(size * size * 3);
    if (cfg.kind === "placeholder") {
      const [r, g2, b] = cfg.colorFrom;
      for (let i = 0; i < size * size; i++) {
        pixels[i * 3] = r;
        pixels[i * 3 + 1] = g2;
        pixels[i * 3 + 2] = b;
      }
      return { pixels, width: size, height: size, fileChannels };
    }
    const [r0, g0, b0] = cfg.colorFrom;
    const [r1, g1, b1] = cfg.colorTo;
    const denom = size > 1 ? size - 1 : 1;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const t = x / denom;
        const idx = (y * size + x) * 3;
        pixels[idx] = Math.round(r0 + (r1 - r0) * t);
        pixels[idx + 1] = Math.round(g0 + (g1 - g0) * t);
        pixels[idx + 2] = Math.round(b0 + (b1 - b0) * t);
      }
    }
    return { pixels, width: size, height: size, fileChannels };
  }

  // ../../packages/core/src/algorithms/pixel-range-algorithm.ts
  var TPAK_BODY_MAGIC = Buffer.from("TPK1", "ascii");
  var TPAK_BODY_HEADER_BYTES = TPAK_BODY_MAGIC.length + 2 + 1 + 4;
  var PixelRangeAlgorithm = class extends AbstractAlgorithm {
    static get optionsSchema() {
      const base2 = super.optionsSchema;
      return {
        ...base2,
        "decoration.kind": enumOption(["placeholder", "gradient", "data-art"], "gradient", {
          label: "Decoration",
          description: "Visible image rendered alongside the pack data."
        }),
        "decoration.size": numberOption([1, 512], 64, {
          label: "Decoration size",
          description: "Side length in pixels of the decorative image.",
          step: 1
        }),
        "decoration.colorFrom": colorOption("#ff5050", {
          label: "Color (from)",
          description: "Solid fill (placeholder) or gradient start (gradient)."
        }),
        "decoration.colorTo": {
          ...colorOption("#5050ff", {
            label: "Color (to)",
            description: "Gradient end color."
          }),
          dependsOn: { key: "decoration.kind", value: "gradient" }
        }
      };
    }
    async encode(input, opts = {}) {
      const merged = { ...this.opts, ...opts };
      const decoration = resolveDecoration(merged.decoration);
      const raw = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
      const compressed = await this.compressor.compress(raw);
      const algorithmId = this.constructor.id;
      const packBytes = wrapTpakBody(
        algorithmId,
        compressed.level,
        compressed.uncompressedLength || raw.length,
        compressed.data
      );
      if (decoration.kind === "data-art" && !decoration.dataArtPixels) {
        decoration.dataArtPixels = bytesToDataArt(raw);
      }
      const decorationPixels = renderDecoration(decoration);
      const imageBytes = await this.surface.writeBuffer(decorationPixels);
      return this.embedData(imageBytes, packBytes);
    }
    async decode(source, _opts = {}) {
      const buf = Buffer.isBuffer(source) ? source : Buffer.from(source.buffer, source.byteOffset, source.byteLength);
      const data = this.extractData(buf);
      const body = unwrapTpakBody(data);
      if (!body) {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      }
      const algorithmId = this.constructor.id;
      if (body.algorithmId !== algorithmId) {
        throw new Error(
          `tpAK payload belongs to algorithm id ${body.algorithmId}, not ${algorithmId}`
        );
      }
      const decoded = await this.compressor.decompress(body.payload, {
        level: body.compressionLevel,
        uncompressedLength: body.uncompressedLength
      });
      if (body.uncompressedLength > 0 && decoded.length !== body.uncompressedLength) {
        throw new Error(
          `tpAK payload decoded to ${decoded.length} bytes; expected ${body.uncompressedLength}`
        );
      }
      return decoded;
    }
    decodeStream(source, opts = {}) {
      const algorithm = this;
      let readerPromise = null;
      let total = 0;
      let bodyLength = 0;
      let first = true;
      async function reader() {
        if (!readerPromise) {
          readerPromise = (async () => {
            const tpakBody = extractPngChunkDataStream(source, "tpAK");
            const body = await unwrapTpakBodyStream(tpakBody);
            const algorithmId = algorithm.constructor.id;
            if (body.algorithmId !== null && body.algorithmId !== algorithmId) {
              throw new Error(
                `tpAK payload belongs to algorithm id ${body.algorithmId}, not ${algorithmId}`
              );
            }
            bodyLength = body.uncompressedLength;
            return algorithm.compressor.decompressWebStream(body.payload, {
              level: body.compressionLevel,
              uncompressedLength: body.uncompressedLength
            }).getReader();
          })();
        }
        return readerPromise;
      }
      return new ReadableStream({
        async pull(controller) {
          try {
            const output = await reader();
            const { done, value } = await output.read();
            if (done) {
              if (bodyLength > 0 && total !== bodyLength) {
                throw new Error(`tpAK payload decoded to ${total} bytes; expected ${bodyLength}`);
              }
              controller.close();
              return;
            }
            if (value) {
              total += value.byteLength;
              if (first) {
                first = false;
                opts.onFirstDecodedChunk?.(value);
              }
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        },
        async cancel(reason) {
          const output = await readerPromise;
          await output?.cancel(reason).catch(() => void 0);
        }
      });
    }
    canHandle(buffer, _ext) {
      if (!buffer || buffer.length < 64) return false;
      try {
        const body = unwrapTpakBody(this.extractData(buffer));
        if (!body) return false;
        const algorithmId = this.constructor.id;
        return body.algorithmId === algorithmId;
      } catch {
        return false;
      }
    }
  };
  function wrapTpakBody(algorithmId, compressionLevel, uncompressedLength, payload) {
    const header = Buffer.alloc(TPAK_BODY_HEADER_BYTES);
    TPAK_BODY_MAGIC.copy(header, 0);
    header.writeUInt16BE(algorithmId, TPAK_BODY_MAGIC.length);
    header.writeUInt8(compressionLevel & 255, TPAK_BODY_MAGIC.length + 2);
    header.writeUInt32BE(uncompressedLength >>> 0, TPAK_BODY_MAGIC.length + 3);
    return Buffer.concat([header, payload]);
  }
  function unwrapTpakBody(data) {
    const buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    if (buf.length < TPAK_BODY_HEADER_BYTES) return null;
    if (!buf.subarray(0, TPAK_BODY_MAGIC.length).equals(TPAK_BODY_MAGIC)) return null;
    return {
      algorithmId: buf.readUInt16BE(TPAK_BODY_MAGIC.length),
      compressionLevel: buf.readUInt8(TPAK_BODY_MAGIC.length + 2),
      uncompressedLength: buf.readUInt32BE(TPAK_BODY_MAGIC.length + 3),
      payload: buf.subarray(TPAK_BODY_HEADER_BYTES)
    };
  }
  async function unwrapTpakBodyStream(stream) {
    const reader = new StreamByteReader(stream);
    const first = await reader.readExactly(TPAK_BODY_HEADER_BYTES);
    if (!startsWith(first, TPAK_BODY_MAGIC)) {
      return {
        algorithmId: null,
        compressionLevel: 0,
        uncompressedLength: 0,
        payload: reader.readRemainderStream(first)
      };
    }
    return {
      algorithmId: first[TPAK_BODY_MAGIC.length] << 8 | first[TPAK_BODY_MAGIC.length + 1],
      compressionLevel: first[TPAK_BODY_MAGIC.length + 2],
      uncompressedLength: first[TPAK_BODY_MAGIC.length + 3] * 16777216 + (first[TPAK_BODY_MAGIC.length + 4] << 16) + (first[TPAK_BODY_MAGIC.length + 5] << 8) + first[TPAK_BODY_MAGIC.length + 6],
      payload: reader.readRemainderStream()
    };
  }
  function extractPngChunkDataStream(source, chunkType) {
    let reader = null;
    let scannedSignature = false;
    let remaining = 0;
    let closed = false;
    async function ensureChunkFound() {
      if (!reader) reader = new StreamByteReader(source);
      if (!scannedSignature) {
        const sig = await reader.readExactly(8);
        if (sig[0] !== 137 || sig[1] !== 80 || sig[2] !== 78 || sig[3] !== 71 || sig[4] !== 13 || sig[5] !== 10 || sig[6] !== 26 || sig[7] !== 10) {
          throw new Error("not a PNG");
        }
        scannedSignature = true;
      }
      while (remaining === 0) {
        const header = await reader.readExactly(8);
        const length = header[0] * 16777216 + (header[1] << 16) + (header[2] << 8) + header[3];
        const type = String.fromCharCode(header[4], header[5], header[6], header[7]);
        if (type === chunkType) {
          remaining = length;
          return;
        }
        await reader.skip(length + 4);
        if (type === "IEND") throw new Error(`no ${chunkType} chunk found in PNG`);
      }
    }
    return new ReadableStream({
      async pull(controller) {
        try {
          if (closed) return;
          await ensureChunkFound();
          const chunk = await reader.readUpTo(remaining);
          remaining -= chunk.byteLength;
          controller.enqueue(chunk);
          if (remaining === 0) {
            closed = true;
            controller.close();
            await reader.cancel();
          }
        } catch (error) {
          controller.error(error);
          await reader?.cancel().catch(() => void 0);
        }
      },
      cancel() {
        closed = true;
        return reader?.cancel();
      }
    });
  }
  var StreamByteReader = class {
    reader;
    buffered = new Uint8Array(0);
    constructor(stream) {
      this.reader = stream.getReader();
    }
    async readExactly(size) {
      const out = new Uint8Array(size);
      let offset = 0;
      while (offset < size) {
        const chunk = await this.readUpTo(size - offset);
        out.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return out;
    }
    async readUpTo(size) {
      while (this.buffered.byteLength === 0) {
        const { done, value } = await this.reader.read();
        if (done) throw new Error("PNG stream ended unexpectedly");
        if (value && value.byteLength > 0) this.buffered = value;
      }
      const take = Math.min(size, this.buffered.byteLength);
      const out = this.buffered.subarray(0, take);
      this.buffered = this.buffered.subarray(take);
      return out;
    }
    async skip(size) {
      let remaining = size;
      while (remaining > 0) remaining -= (await this.readUpTo(remaining)).byteLength;
    }
    async cancel() {
      await this.reader.cancel().catch(() => void 0);
      this.reader.releaseLock();
    }
    async readAny() {
      if (this.buffered.byteLength > 0) {
        const chunk = this.buffered;
        this.buffered = new Uint8Array(0);
        return chunk;
      }
      const { done, value } = await this.reader.read();
      if (done) return null;
      if (!value || value.byteLength === 0) return this.readAny();
      return value;
    }
    readRemainderStream(prefix) {
      const reader = this;
      let sentPrefix = false;
      return new ReadableStream({
        async pull(controller) {
          if (!sentPrefix) {
            sentPrefix = true;
            if (prefix && prefix.byteLength > 0) {
              controller.enqueue(prefix);
              return;
            }
          }
          try {
            const chunk = await reader.readAny();
            if (chunk) controller.enqueue(chunk);
            else controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
        cancel() {
          return reader.cancel();
        }
      });
    }
  };
  function startsWith(bytes, prefix) {
    if (bytes.byteLength < prefix.byteLength) return false;
    for (let i = 0; i < prefix.byteLength; i++) if (bytes[i] !== prefix[i]) return false;
    return true;
  }
  function resolveDecoration(opts) {
    return {
      kind: opts?.kind ?? "gradient",
      size: opts?.size ?? 64,
      colorFrom: toRgb(opts?.colorFrom) ?? [255, 80, 80],
      colorTo: toRgb(opts?.colorTo) ?? [80, 80, 255],
      dataArtPixels: opts?.dataArtPixels
    };
  }
  function toRgb(v) {
    if (Array.isArray(v) && v.length === 3) return [v[0], v[1], v[2]];
    if (typeof v === "string") return hexToRgb(v);
    return void 0;
  }
  function bytesToDataArt(input) {
    const pixelCount = Math.ceil(input.length / 3);
    const side = Math.max(1, Math.ceil(Math.sqrt(pixelCount)));
    const pixels = new Uint8Array(side * side * 3);
    pixels.set(input.subarray(0, Math.min(input.length, pixels.length)), 0);
    return { pixels, width: side, height: side, fileChannels: 3 };
  }
  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const value = Number.parseInt(
      normalized.length === 3 ? normalized.split("").map((c) => `${c}${c}`).join("") : normalized.padEnd(6, "0").slice(0, 6),
      16
    );
    return [value >> 16 & 255, value >> 8 & 255, value & 255];
  }

  // ../../packages/core/src/codecs/linear/metadata.ts
  var linearMetadata = {
    pixelLayout: "RGB \xB7 3 bytes/px",
    writeStyle: "sequential",
    dependencies: "none (pure JS)",
    beFriendly: "yes",
    feFriendly: "yes",
    streamFriendly: "yes",
    approxRatio: "15-18% with deflate/brotli",
    description: "Direct byte-to-pixel copy. Baseline layout with strong results once paired with outer compression."
  };
  var linearInfo = { id: 0, name: "linear", metadata: linearMetadata };

  // ../../packages/core/src/codecs/linear/index.ts
  var LinearCodec = class extends AbstractCodec {
    id = linearInfo.id;
    name = linearInfo.name;
    metadata = linearInfo.metadata;
    encode(input, dataPixelCount, _w, _h, channels = 3) {
      const pixels = new Uint8Array(dataPixelCount * channels);
      pixels.set(input.subarray(0, Math.min(input.length, pixels.length)));
      return pixels;
    }
    decode(pixels, length) {
      return Buffer.from(pixels.buffer, pixels.byteOffset, length);
    }
  };
  var linearCodec = new LinearCodec();

  // ../../packages/browser/src/algorithms/index.ts
  var LinearPngBrotli = definePixelAlgorithm({
    id: 0,
    name: "linear",
    title: "Linear \xB7 PNG \xB7 Brotli",
    Codec: LinearCodec,
    Surface: BrowserPngSurface,
    Compressor: BrowserBrotliCompressor,
    Drawer: DenseDrawer
  });
  var LinearPngDeflate = definePixelAlgorithm({
    id: 11,
    name: "linear-deflate",
    title: "Linear \xB7 PNG \xB7 Deflate",
    Codec: LinearCodec,
    Surface: BrowserPngSurface,
    Compressor: BrowserDeflateCompressor,
    Drawer: DenseDrawer
  });
  var LinearStreamingPngDeflate = definePixelAlgorithm({
    id: 12,
    name: "linear-stream-deflate",
    title: "Linear \xB7 Streaming PNG \xB7 Deflate",
    Codec: LinearCodec,
    Surface: BrowserStreamingPngSurface,
    Compressor: BrowserDeflateCompressor,
    Drawer: DenseDrawer
  });
  var LinearStreamingPngBrotli = definePixelAlgorithm({
    id: 15,
    name: "linear-stream",
    title: "Linear \xB7 Streaming PNG \xB7 Brotli",
    Codec: LinearCodec,
    Surface: BrowserStreamingPngSurface,
    Compressor: BrowserBrotliCompressor,
    Drawer: DenseDrawer
  });
  var LinearPngUpngBrotli = definePixelAlgorithm({
    id: 17,
    name: "linear-upng",
    title: "Linear \xB7 PNG (upng) \xB7 Brotli",
    Codec: LinearCodec,
    Surface: BrowserPngUpngSurface,
    Compressor: BrowserBrotliCompressor,
    Drawer: DenseDrawer
  });
  var LinearPngUpngDeflate = definePixelAlgorithm({
    id: 18,
    name: "linear-upng-deflate",
    title: "Linear \xB7 PNG (upng) \xB7 Deflate",
    Codec: LinearCodec,
    Surface: BrowserPngUpngSurface,
    Compressor: BrowserDeflateCompressor,
    Drawer: DenseDrawer
  });
  var PixelRangePngBrotli = class extends PixelRangeAlgorithm {
    static id = 100;
    static title = "PixelRange \xB7 PNG \xB7 Brotli";
    static description = "Pack data stored in a tpAK PNG chunk; pixels are decoration. Range-fetch friendly.";
    static Codec = LinearCodec;
    static Surface = BrowserPngSurface;
    static Compressor = BrowserBrotliCompressor;
    static Drawer = DenseDrawer;
    static {
      Object.defineProperty(this, "name", {
        value: "pixel-range",
        configurable: true
      });
    }
    embedData(imageBytes, packBytes) {
      return insertTpakChunk(imageBytes, packBytes);
    }
    extractData(artifactBytes) {
      return extractTpakChunk(artifactBytes);
    }
  };
  var PixelRangePngDeflate = class extends PixelRangeAlgorithm {
    static id = 101;
    static title = "PixelRange \xB7 PNG \xB7 Deflate";
    static description = "Pack data stored in a tpAK PNG chunk; deflate-compressed pack data. Browser-decodable.";
    static Codec = LinearCodec;
    static Surface = BrowserPngSurface;
    static Compressor = BrowserDeflateCompressor;
    static Drawer = DenseDrawer;
    static {
      Object.defineProperty(this, "name", {
        value: "pixel-range-deflate",
        configurable: true
      });
    }
    embedData(imageBytes, packBytes) {
      return insertTpakChunk(imageBytes, packBytes);
    }
    extractData(artifactBytes) {
      return extractTpakChunk(artifactBytes);
    }
  };
  var PixelRangePngNone = class extends PixelRangeAlgorithm {
    static id = 102;
    static title = "PixelRange \xB7 PNG \xB7 None";
    static description = "Pack data stored in a tpAK PNG chunk; no compression. Browser-decodable.";
    static Codec = LinearCodec;
    static Surface = BrowserPngSurface;
    static Compressor = NoneCompressor;
    static Drawer = DenseDrawer;
    static {
      Object.defineProperty(this, "name", {
        value: "pixel-range-none",
        configurable: true
      });
    }
    embedData(imageBytes, packBytes) {
      return insertTpakChunk(imageBytes, packBytes);
    }
    extractData(artifactBytes) {
      return extractTpakChunk(artifactBytes);
    }
  };
  var PixelRangeStreamPngDeflate = class extends PixelRangeAlgorithm {
    static id = 104;
    static title = "PixelRange \xB7 Streaming PNG \xB7 Deflate";
    static description = "Pack data in a tpAK PNG chunk; streaming-PNG decoration; deflate pack data. Browser-decodable.";
    static Codec = LinearCodec;
    static Surface = BrowserStreamingPngSurface;
    static Compressor = BrowserDeflateCompressor;
    static Drawer = DenseDrawer;
    static {
      Object.defineProperty(this, "name", {
        value: "pixel-range-stream-deflate",
        configurable: true
      });
    }
    embedData(imageBytes, packBytes) {
      return insertTpakChunk(imageBytes, packBytes);
    }
    extractData(artifactBytes) {
      return extractTpakChunk(artifactBytes);
    }
  };
  var ALL_BROWSER_ALGORITHMS = [
    LinearPngBrotli,
    LinearPngDeflate,
    LinearStreamingPngDeflate,
    LinearStreamingPngBrotli,
    LinearPngUpngBrotli,
    LinearPngUpngDeflate,
    PixelRangePngBrotli,
    PixelRangePngDeflate,
    PixelRangePngNone,
    PixelRangeStreamPngDeflate
  ];

  // ../../packages/browser/src/algorithms/catalog.ts
  var browserAlgorithmCatalog = new AlgorithmCatalog();
  for (const Ctor of ALL_BROWSER_ALGORITHMS) {
    browserAlgorithmCatalog.register(Ctor);
  }

  // ../../packages/browser/src/build-diff-to.ts
  function buildDiffToFn(algo) {
    return async (a, b) => {
      const tokenBytes = await algo.diff(a, b).token();
      return wrapTokenBytes(tokenBytes);
    };
  }
  async function wrapTokenBytes(bytes) {
    const blob = new Blob([bytes], { type: "image/png" });
    const objectURL = URL.createObjectURL(blob);
    const dataURL = await blobToDataURL(blob);
    const image = new Image();
    image.src = objectURL;
    return { blobs: [blob], bytes, objectURL, dataURL, image };
  }
  async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ../../packages/browser/src/decode-core.ts
  async function decodeSourceToPack(source, options = {}) {
    const { bytes, algorithm } = await decodeSourceToPayload(source, options);
    return payloadToPack(bytes, algorithm, options.decompress);
  }
  async function decodeSourceToPayload(source, options = {}) {
    const buffer = await sourceToBytes(source);
    const { Ctor, image } = await browserAlgorithmCatalog.detectWithImage(buffer, ".png");
    const algorithm = new Ctor({ key: options.key });
    const decodeOptions = { key: options.key, ext: ".png" };
    const result = image && algorithm instanceof PixelAlgorithm ? await algorithm.decodeFromImages([image], decodeOptions) : await algorithm.decode(buffer, decodeOptions);
    const bytes = new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
    return { bytes, algorithm };
  }
  async function detectSourceAlgorithmName(source) {
    const buffer = await sourceToBytes(source);
    const Ctor = await browserAlgorithmCatalog.detectFromBuffer(buffer, ".png");
    return Ctor.name;
  }
  function payloadToPack(bytes, algorithm, decompress) {
    return fromBytes(bytes, {
      decompress: decompress ?? decompressRaw,
      diffTo: buildDiffToFn(algorithm)
    });
  }
  async function sourceToBytes(source) {
    if (source instanceof Uint8Array) {
      return import_buffer3.Buffer.from(source.buffer, source.byteOffset, source.byteLength);
    }
    if (source instanceof ArrayBuffer) {
      return import_buffer3.Buffer.from(source);
    }
    if (source instanceof Blob) {
      return import_buffer3.Buffer.from(await source.arrayBuffer());
    }
    if (typeof source === "string") {
      const response = await fetch(source);
      if (!response.ok) throw new Error(`fetch ${source}: ${response.status}`);
      return import_buffer3.Buffer.from(await response.arrayBuffer());
    }
    if (source instanceof HTMLImageElement || source instanceof ImageBitmap) {
      const bitmap = source instanceof ImageBitmap ? source : await imageElementToBitmap(source);
      const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(bitmap.width, bitmap.height) : (() => {
        const c = document.createElement("canvas");
        c.width = bitmap.width;
        c.height = bitmap.height;
        return c;
      })();
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("decode(): 2D canvas context unavailable");
      ctx.drawImage(bitmap, 0, 0);
      let blob;
      if ("convertToBlob" in canvas) {
        blob = await canvas.convertToBlob({ type: "image/png" });
      } else {
        blob = await new Promise((resolve, reject) => {
          ;
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("canvas.toBlob returned null"));
          }, "image/png");
        });
      }
      return import_buffer3.Buffer.from(await blob.arrayBuffer());
    }
    throw new TypeError("decode(): unsupported source type");
  }
  async function imageElementToBitmap(img) {
    if (!img.complete) {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("image failed to load"));
      });
    }
    return createImageBitmap(img, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
  }

  // ../../packages/browser/src/decode-stream.ts
  var PEEK_BYTES_FOR_DETECTION = 64;
  async function decodeStream(source, options = {}) {
    const originalSource = source;
    const { bytes, algorithm } = await decodeStreamPayload(source, options);
    const pack2 = payloadToPack(bytes, algorithm, options.decompress);
    return typeof originalSource === "string" || options.baseUrl ? maybeRouterToken(pack2, originalSource, options) : pack2;
  }
  async function decodeStreamPayload(source, options = {}) {
    const { stream, peek } = await peekAndRebuild(source);
    if (!isPng(peek)) {
      return decodeSourceToPayload(await streamToBlob(stream), options);
    }
    const pixelRangeAlgorithmId = detectPixelRangeAlgorithmIdFromPngPrefix(peek);
    if (pixelRangeAlgorithmId !== null) {
      const Ctor2 = browserAlgorithmCatalog.getById(pixelRangeAlgorithmId);
      const algorithm2 = new Ctor2({ key: options.key });
      if (algorithm2 instanceof PixelRangeAlgorithm) {
        const decoded2 = await streamToBytes(algorithm2.decodeStream(stream, options));
        return { bytes: decoded2, algorithm: algorithm2 };
      }
    }
    const [detectStream, fallbackStream] = stream.tee();
    const surface = new BrowserStreamingPngSurface();
    const handle = await surface.decodeStream(detectStream);
    let detected;
    try {
      detected = await detectAlgorithmFromRows(handle);
    } catch {
      return decodeSourceToPayload(await streamToBlob(fallbackStream), options);
    }
    const Ctor = browserAlgorithmCatalog.getById(detected.algorithmId);
    const algorithm = new Ctor({ key: options.key });
    if (!(algorithm instanceof PixelAlgorithm) || !Ctor.capabilities.streamable) {
      return decodeSourceToPayload(await streamToBlob(fallbackStream), options);
    }
    fallbackStream.cancel().catch(() => void 0);
    const decoded = await decodeSurfaceStream(algorithm, detected.handle, options);
    return { bytes: decoded, algorithm };
  }
  function detectPixelRangeAlgorithmIdFromPngPrefix(peek) {
    if (peek.byteLength < 52 || !isPng(peek)) return null;
    const ihdrPos = 8;
    const ihdrLen = readU32be(peek, ihdrPos);
    const ihdrType = ascii4(peek, ihdrPos + 4);
    if (ihdrType !== "IHDR") return null;
    const nextPos = ihdrPos + 8 + ihdrLen + 4;
    if (nextPos + 19 > peek.byteLength) return null;
    const chunkType = ascii4(peek, nextPos + 4);
    if (chunkType !== "tpAK") return null;
    const dataPos = nextPos + 8;
    if (ascii4(peek, dataPos) !== "TPK1") return null;
    return peek[dataPos + 4] << 8 | peek[dataPos + 5];
  }
  function readU32be(bytes, offset) {
    return bytes[offset] * 16777216 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
  }
  function ascii4(bytes, offset) {
    return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
  }
  async function detectAlgorithmFromRows(handle) {
    const iterator = handle.rows[Symbol.asyncIterator]();
    const queued = [];
    let pixelBuf = new Uint8Array(0);
    while (true) {
      const { done, value } = await iterator.next();
      if (done) break;
      queued.push(value);
      const compactBytes = COMPACT_HEADER_PIXELS * handle.fileChannels;
      const fullBytes = HEADER_PIXELS * handle.fileChannels;
      const needHeaderBytes = Math.max(0, fullBytes - pixelBuf.byteLength);
      if (needHeaderBytes > 0) {
        pixelBuf = appendBytes(pixelBuf, value.subarray(0, needHeaderBytes));
      }
      if (pixelBuf.byteLength >= compactBytes && isCompactToken(pixelBuf)) {
        return {
          algorithmId: readCompactHeader(pixelBuf).algoId,
          handle: replayHandle(handle, queued, iterator)
        };
      }
      if (pixelBuf.byteLength >= fullBytes) {
        try {
          return {
            algorithmId: readHeader(pixelBuf).algorithmId,
            handle: replayHandle(handle, queued, iterator)
          };
        } catch {
        }
      }
    }
    throw new Error("decodeStream(): input ended before TokenPack header");
  }
  function replayHandle(handle, queued, iterator) {
    const rows = async function* () {
      for (const row of queued) yield row;
      while (true) {
        const { done, value } = await iterator.next();
        if (done) return;
        yield value;
      }
    }();
    return { ...handle, rows };
  }
  function appendBytes(a, b) {
    if (a.byteLength === 0) return b;
    if (b.byteLength === 0) return a;
    const out = new Uint8Array(a.byteLength + b.byteLength);
    out.set(a, 0);
    out.set(b, a.byteLength);
    return out;
  }
  function isPng(peek) {
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    if (peek.byteLength < sig.length) return false;
    for (let i = 0; i < sig.length; i++) if (peek[i] !== sig[i]) return false;
    return true;
  }
  async function peekAndRebuild(source) {
    const raw = await sourceToReadable(source);
    const reader = raw.getReader();
    const peekChunks = [];
    let total = 0;
    while (total < PEEK_BYTES_FOR_DETECTION) {
      const { done, value } = await reader.read();
      if (done) break;
      peekChunks.push(value);
      total += value.byteLength;
    }
    const peek = concatChunks(peekChunks, total);
    const stream = new ReadableStream({
      start(controller) {
        if (peek.byteLength > 0) controller.enqueue(peek);
      },
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value);
      },
      cancel(reason) {
        reader.cancel(reason).catch(() => void 0);
      }
    });
    return { stream, peek };
  }
  async function sourceToReadable(source) {
    if (source instanceof ReadableStream) return source;
    if (source instanceof Blob) return source.stream();
    if (typeof source === "string") {
      const r = await fetch(source);
      if (!r.ok) throw new Error(`fetch ${source}: ${r.status}`);
      if (!r.body) throw new Error(`fetch ${source}: response has no body`);
      return r.body;
    }
    throw new TypeError("decodeStream(): unsupported source type");
  }
  async function streamToBlob(stream) {
    const chunks = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return new Blob(chunks);
  }
  async function streamToBytes(stream) {
    const chunks = [];
    const reader = stream.getReader();
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(value);
      total += value.byteLength;
    }
    return concatChunks(chunks, total);
  }
  function concatChunks(chunks, total) {
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.byteLength;
    }
    return out;
  }

  // ../../packages/browser/src/fetch-pack.ts
  var PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];
  var TPAK_BODY_MAGIC2 = [84, 80, 75, 49];
  var TPAK_BODY_HEADER_BYTES2 = 4 + 2 + 1 + 4;
  var HEAD_FETCH_DEFAULT_BYTES = 8192;
  async function fetchPixelRangePayloadHandle(url, initialBytes = HEAD_FETCH_DEFAULT_BYTES) {
    const head = await fetchRange(url, 0, initialBytes - 1);
    return parsePixelRangePayloadHandleFromHead(url, head, initialBytes);
  }
  async function fetchPixelRangePayloadBytes(handle, offset, length) {
    const start = handle.payloadAbsOffset + offset;
    const end = start + length - 1;
    return fetchRangeWithPrefetch(handle, start, end);
  }
  async function fetchPixelRangePayloadStream(handle, offset, length) {
    const start = handle.payloadAbsOffset + offset;
    const end = start + length - 1;
    if (end < handle.prefetchedBytes.byteLength) {
      return streamFromBytes(handle.prefetchedBytes.subarray(start, end + 1));
    }
    if (start < handle.prefetchedBytes.byteLength) {
      const response2 = await fetchRangeResponse(handle.url, handle.prefetchedBytes.byteLength, end);
      if (!response2.body) {
        throw new Error(
          `range fetch ${handle.prefetchedBytes.byteLength}-${end}: response has no body`
        );
      }
      if (response2.status === 200) {
        const full = new Uint8Array(await response2.arrayBuffer());
        return streamFromBytes(full.subarray(start, end + 1));
      }
      return concatStreams(
        streamFromBytes(handle.prefetchedBytes.subarray(start)),
        response2.body
      );
    }
    const response = await fetchRangeResponse(handle.url, start, end);
    if (!response.body) throw new Error(`range fetch ${start}-${end}: response has no body`);
    if (response.status === 200) {
      const full = new Uint8Array(await response.arrayBuffer());
      return streamFromBytes(full.subarray(start, end + 1));
    }
    return response.body;
  }
  async function parsePixelRangePayloadHandleFromHead(url, head, initialBytes) {
    const { tpakDataAbs, tpakDataLen } = findTpakChunkInHead(head, initialBytes);
    const payloadAbsOffset = packPayloadOffset(head, tpakDataAbs, tpakDataLen);
    const payloadByteLength = tpakDataLen - (payloadAbsOffset - tpakDataAbs);
    return {
      url,
      prefetchedBytes: head,
      payloadAbsOffset,
      payloadByteLength
    };
  }
  function findTpakChunkInHead(head, initialBytes) {
    if (head.byteLength < 8) throw new Error("initial fetch too small for PNG signature");
    for (let i = 0; i < 8; i++) {
      if (head[i] !== PNG_SIG[i]) throw new Error("not a PNG (signature mismatch)");
    }
    let pos = 8;
    while (pos + 8 <= head.byteLength) {
      const length = head[pos] * 16777216 + (head[pos + 1] << 16) + (head[pos + 2] << 8) + head[pos + 3];
      const type = String.fromCharCode(head[pos + 4], head[pos + 5], head[pos + 6], head[pos + 7]);
      if (type === "tpAK") {
        return { tpakDataAbs: pos + 8, tpakDataLen: length };
      }
      if (type === "IEND") throw new Error("reached IEND without finding tpAK chunk");
      pos += 8 + length + 4;
    }
    throw new Error(
      `tpAK chunk not found in initial ${initialBytes}-byte fetch (try a larger initialBytes)`
    );
  }
  function packPayloadOffset(head, tpakDataAbs, tpakDataLen) {
    if (tpakDataAbs + 4 > head.byteLength) return tpakDataAbs;
    let hasWrappedBody = true;
    for (let i = 0; i < 4; i++) {
      if (head[tpakDataAbs + i] !== TPAK_BODY_MAGIC2[i]) hasWrappedBody = false;
    }
    if (!hasWrappedBody) return tpakDataAbs;
    if (tpakDataLen < TPAK_BODY_HEADER_BYTES2) {
      throw new Error("tpAK body is too small for TPK1 wrapper");
    }
    if (tpakDataAbs + TPAK_BODY_HEADER_BYTES2 > head.byteLength) {
      return tpakDataAbs + TPAK_BODY_HEADER_BYTES2;
    }
    const compressionLevel = head[tpakDataAbs + 6];
    if (compressionLevel !== 0) {
      throw new Error(
        "tpAK body is outer-compressed; range pack access requires pixel-range-none fixtures"
      );
    }
    return tpakDataAbs + TPAK_BODY_HEADER_BYTES2;
  }
  async function fetchRangeWithPrefetch(remote, start, end) {
    if (end < remote.prefetchedBytes.byteLength) {
      return remote.prefetchedBytes.subarray(start, end + 1);
    }
    if (start < remote.prefetchedBytes.byteLength) {
      return concatBytes([
        remote.prefetchedBytes.subarray(start),
        await fetchRange(remote.url, remote.prefetchedBytes.byteLength, end)
      ]);
    }
    return fetchRange(remote.url, start, end);
  }
  async function fetchRange(url, start, end) {
    const r = await fetchRangeResponse(url, start, end);
    const buf = await r.arrayBuffer();
    if (r.status === 200) {
      const expected = end - start + 1;
      if (buf.byteLength === expected) return new Uint8Array(buf);
      return new Uint8Array(buf, start, Math.min(expected, buf.byteLength - start));
    }
    return new Uint8Array(buf);
  }
  async function fetchRangeResponse(url, start, end) {
    const r = await fetch(url, {
      cache: "default",
      credentials: "omit",
      headers: { Range: `bytes=${start}-${end}` },
      mode: "cors"
    });
    if (r.status !== 206 && r.status !== 200) {
      throw new Error(`range fetch ${start}-${end}: HTTP ${r.status}`);
    }
    return r;
  }
  function streamFromBytes(bytes) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      }
    });
  }
  function concatStreams(first, second) {
    return new ReadableStream({
      async start(controller) {
        try {
          await pumpStream(first, controller);
          await pumpStream(second, controller);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }
  async function pumpStream(stream, controller) {
    const reader = stream.getReader();
    try {
      for (; ; ) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) controller.enqueue(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  function concatBytes(chunks) {
    if (chunks.length === 1) return chunks[0];
    const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return out;
  }

  // ../../packages/browser/src/router-load-plan.ts
  var SMALL_SELECTED_BYTES = 512 * 1024;
  var WHOLE_CHUNK_WASTE_RATIO = 1.35;
  var MERGE_RANGE_GAP_BYTES = 16 * 1024;
  var RANGE_REQUEST_PENALTY_BYTES = 96 * 1024;
  var CHUNK_PAYLOAD_HEADER_PROBE_BYTES = 8192;
  var MAX_RANGES_PER_CHUNK = 8;
  var TINY_FILE_BYTES = 32 * 1024;
  var TINY_FILE_BURST_FILE_COUNT = 8;
  var TINY_FILE_REQUEST_PENALTY_BYTES = 768 * 1024;
  var TINY_FILE_MAX_RANGES_PER_CHUNK = 4;
  var LARGE_FILE_WHOLE_CHUNK_BYTES = 512 * 1024;
  var LARGE_FILE_WHOLE_CHUNK_MAX_WASTE_RATIO = 1.6;
  var NETWORK_PROFILE_DEFAULTS = {
    // Mobile data-saver mode — minimize fanout so we don't burn the user's quota.
    "save-data": { maxParallelChunkRequests: 2, maxParallelSegmentRequests: 4 },
    "slow-2g": { maxParallelChunkRequests: 2, maxParallelSegmentRequests: 4 },
    "2g": { maxParallelChunkRequests: 3, maxParallelSegmentRequests: 6 },
    "3g": { maxParallelChunkRequests: 4, maxParallelSegmentRequests: 8 },
    // Most desktops + good mobile sit here; the Network Information API caps
    // effectiveType at '4g' even on gigabit links, so we lean on downlink for
    // the boundary between '4g-slow' and '4g-fast'.
    "4g-slow": { maxParallelChunkRequests: 5, maxParallelSegmentRequests: 8 },
    "4g-fast": { maxParallelChunkRequests: 12, maxParallelSegmentRequests: 16 },
    // Safari/Firefox don't expose Network Information API. Pick the same shape
    // as 4g-slow — a safe middle ground that doesn't bandwidth-starve streams.
    unknown: { maxParallelChunkRequests: 5, maxParallelSegmentRequests: 8 }
  };
  function readNetworkInformation() {
    if (typeof navigator === "undefined") return void 0;
    const candidate = navigator.connection;
    return candidate && typeof candidate === "object" ? candidate : void 0;
  }
  function resolveNetworkProfile() {
    const info = readNetworkInformation();
    const effectiveType = info?.effectiveType;
    const downlink = typeof info?.downlink === "number" ? info.downlink : void 0;
    const rtt = typeof info?.rtt === "number" ? info.rtt : void 0;
    const saveData = info?.saveData === true ? true : info?.saveData === false ? false : void 0;
    const name = classifyNetwork(effectiveType, downlink, saveData);
    const defaults = NETWORK_PROFILE_DEFAULTS[name];
    return {
      name,
      effectiveType,
      downlinkMbps: downlink,
      rttMs: rtt,
      saveData,
      maxParallelChunkRequests: defaults.maxParallelChunkRequests,
      maxParallelSegmentRequests: defaults.maxParallelSegmentRequests
    };
  }
  function classifyNetwork(effectiveType, downlink, saveData) {
    if (saveData === true) return "save-data";
    if (effectiveType === "slow-2g") return "slow-2g";
    if (effectiveType === "2g") return "2g";
    if (effectiveType === "3g") return "3g";
    if (effectiveType === "4g") {
      return downlink !== void 0 && downlink < 5 ? "4g-slow" : "4g-fast";
    }
    if (!effectiveType && downlink !== void 0) {
      return downlink >= 5 ? "4g-fast" : downlink >= 1 ? "4g-slow" : "3g";
    }
    return "unknown";
  }
  function planRouterLoad(files, chunks, options) {
    const profile = resolveNetworkProfile();
    const tuning = plannerTuning(options, profile);
    const core = planRouterLoadCore(files, chunks, options, tuning);
    return { ...core, profile, tuning };
  }
  function planRouterLoadCore(files, chunks, options, baseTuning) {
    const mode = resolveMode(options.strategy, options.mode);
    const planned = collectPlannedSegments(files, chunks);
    const selectedBytes = planned.reduce((sum, item) => sum + item.segment.length, 0);
    const selectedChunks = uniqueChunks(planned);
    const selectedChunkBytes = selectedChunks.reduce((sum, chunk) => sum + (chunk.byteLength ?? 0), 0);
    if (shouldForceWholeChunks(options.strategy)) {
      return wholeChunks(
        selectedChunks,
        mode,
        "forced-full-chunks",
        baseTuning.maxParallelChunkRequests
      );
    }
    if (shouldForceSegments(options.strategy)) {
      return bestRangePlan(planned, mode, "forced-segments", baseTuning, false);
    }
    const tinyBurst = isTinyFileBurst(files, planned, baseTuning);
    const tuning = tinyBurst ? tinyFileBurstTuning(baseTuning) : baseTuning;
    if (isCompleteFileSet(files, options.allFiles)) {
      return wholeChunks(selectedChunks, mode, "complete-file-set", tuning.maxParallelChunkRequests);
    }
    if (planned.every((item) => segmentCoversChunkPayload(item.chunk, item.segment))) {
      return wholeChunks(
        selectedChunks,
        mode,
        "segments-cover-chunks",
        tuning.maxParallelChunkRequests
      );
    }
    const rangeMode = selectedBytes <= SMALL_SELECTED_BYTES ? "buffered" : mode;
    const rangeReason = tinyBurst ? "tiny-file-burst-range-fetch" : selectedBytes <= SMALL_SELECTED_BYTES ? "small-selection-range-fetch" : "range-segments";
    const bestRange = bestRangePlan(
      planned,
      rangeMode,
      rangeReason,
      tuning,
      true,
      tinyBurst ? "tiny-file-burst-coalesced" : "hot-chunk-range-coalesced"
    );
    const whole = wholeChunks(
      selectedChunks,
      mode,
      "whole-chunks-lower-cost",
      tuning.maxParallelChunkRequests
    );
    if (!tinyBurst && shouldPreferLargeFileWholeChunkStream(files, selectedBytes, selectedChunkBytes, mode, tuning)) {
      return {
        ...whole,
        reason: "large-file-whole-chunk-stream"
      };
    }
    if (planCost(whole, tuning) <= planCost(bestRange, tuning)) {
      return tinyBurst ? { ...whole, reason: "tiny-file-burst-whole-chunks" } : whole;
    }
    if (selectedChunkBytes > 0 && selectedChunkBytes <= Math.ceil(selectedBytes * WHOLE_CHUNK_WASTE_RATIO) && planCost(whole, tuning) <= planCost(bestRange, tuning) * WHOLE_CHUNK_WASTE_RATIO) {
      return {
        ...whole,
        reason: "whole-chunks-cheaper-than-ranges"
      };
    }
    return bestRange;
  }
  function plannerTuning(options, profile) {
    return {
      rangeRequestPenaltyBytes: positiveFinite(
        options.rangeRequestPenaltyBytes,
        RANGE_REQUEST_PENALTY_BYTES
      ),
      mergeRangeGapBytes: positiveFinite(options.mergeRangeGapBytes, MERGE_RANGE_GAP_BYTES),
      maxRangesPerChunk: positiveInt(options.maxRangesPerChunk, MAX_RANGES_PER_CHUNK),
      tinyFileBytes: positiveFinite(options.tinyFileBytes, TINY_FILE_BYTES),
      tinyFileBurstFileCount: positiveInt(options.tinyFileBurstFileCount, TINY_FILE_BURST_FILE_COUNT),
      tinyFileRequestPenaltyBytes: positiveFinite(
        options.tinyFileRequestPenaltyBytes,
        TINY_FILE_REQUEST_PENALTY_BYTES
      ),
      tinyFileMaxRangesPerChunk: positiveInt(
        options.tinyFileMaxRangesPerChunk,
        TINY_FILE_MAX_RANGES_PER_CHUNK
      ),
      largeFileWholeChunkBytes: positiveFinite(
        options.largeFileWholeChunkBytes,
        LARGE_FILE_WHOLE_CHUNK_BYTES
      ),
      largeFileWholeChunkMaxWasteRatio: positiveFinite(
        options.largeFileWholeChunkMaxWasteRatio,
        LARGE_FILE_WHOLE_CHUNK_MAX_WASTE_RATIO
      ),
      // Concurrency caps are network-shape-driven by default; callers can still
      // pin specific values via the planner options (the sweep harness uses this
      // to compare profiles head-to-head against the auto-detected defaults).
      maxParallelChunkRequests: positiveInt(
        options.maxParallelChunkRequests,
        profile.maxParallelChunkRequests
      ),
      maxParallelSegmentRequests: positiveInt(
        options.maxParallelSegmentRequests,
        profile.maxParallelSegmentRequests
      )
    };
  }
  function shouldPreferLargeFileWholeChunkStream(files, selectedBytes, selectedChunkBytes, mode, tuning) {
    if (mode !== "stream" || selectedChunkBytes <= 0 || selectedBytes <= 0) return false;
    const largestFileBytes = files.reduce(
      (max, file) => Math.max(max, file.compressedByteLength ?? file.byteLength),
      0
    );
    if (largestFileBytes < tuning.largeFileWholeChunkBytes) return false;
    return selectedChunkBytes <= Math.ceil(selectedBytes * tuning.largeFileWholeChunkMaxWasteRatio);
  }
  function isTinyFileBurst(files, segments, tuning) {
    if (files.length < tuning.tinyFileBurstFileCount || segments.length === 0) return false;
    const largestSegment = segments.reduce((max, item) => Math.max(max, item.segment.length), 0);
    const averageSegment = segments.reduce((sum, item) => sum + item.segment.length, 0) / segments.length;
    return largestSegment <= tuning.tinyFileBytes && averageSegment <= tuning.tinyFileBytes;
  }
  function tinyFileBurstTuning(tuning) {
    return {
      ...tuning,
      rangeRequestPenaltyBytes: Math.max(
        tuning.rangeRequestPenaltyBytes,
        tuning.tinyFileRequestPenaltyBytes
      ),
      maxRangesPerChunk: Math.min(tuning.maxRangesPerChunk, tuning.tinyFileMaxRangesPerChunk)
    };
  }
  function resolveMode(strategy, mode) {
    if (strategy === "range-fetch" || strategy === "range-fetch-all" || strategy === "full") {
      return "buffered";
    }
    if (strategy === "range-stream" || strategy === "range-stream-all") return "stream";
    return mode ?? (canStreamDecode() ? "stream" : "buffered");
  }
  function shouldForceWholeChunks(strategy) {
    return strategy === "full" || strategy === "range-fetch-all" || strategy === "range-stream-all";
  }
  function shouldForceSegments(strategy) {
    return strategy === "range-fetch" || strategy === "range-stream";
  }
  function collectPlannedSegments(files, chunks) {
    const out = [];
    for (const file of files) {
      for (const segment of file.segments) {
        const chunk = chunks.get(segment.chunkId);
        if (!chunk) throw new Error(`router file references missing chunk: ${segment.chunkId}`);
        out.push({ file, segment, chunk });
      }
    }
    return out;
  }
  function uniqueChunks(planned) {
    const byId = /* @__PURE__ */ new Map();
    for (const item of planned) byId.set(item.chunk.id, item.chunk);
    return [...byId.values()];
  }
  function isCompleteFileSet(files, allFiles) {
    if (files.length !== allFiles.length) return false;
    const requested = new Set(files);
    return allFiles.every((file) => requested.has(file));
  }
  function wholeChunks(chunks, mode, reason, maxParallelChunkRequests) {
    const fetchedBytes = chunks.reduce((sum, chunk) => sum + (chunk.byteLength ?? 0), 0);
    return {
      kind: "whole-chunks",
      mode,
      chunks,
      concurrency: Math.min(maxParallelChunkRequests, Math.max(1, chunks.length)),
      reason,
      estimate: {
        requestCount: chunks.length,
        selectedBytes: fetchedBytes,
        fetchedBytes,
        chunkCount: chunks.length,
        segmentCount: 0
      }
    };
  }
  function parallelSegments(segments, mode, reason, tuning) {
    const selectedBytes = segments.reduce((sum, item) => sum + item.segment.length, 0);
    const rangeEstimate = estimateRangeAccess(
      segments.map((item) => ({
        chunk: item.chunk,
        offset: item.segment.offset,
        length: item.segment.length,
        segments: [item]
      }))
    );
    return {
      kind: "parallel-segments",
      mode,
      segments,
      concurrency: segmentConcurrency(segments.length, rangeEstimate.fetchedBytes, tuning),
      reason,
      estimate: {
        selectedBytes,
        requestCount: rangeEstimate.requestCount,
        fetchedBytes: rangeEstimate.fetchedBytes,
        chunkCount: uniqueChunks(segments).length,
        segmentCount: segments.length
      }
    };
  }
  function rangePlan(segments, mode, reason, tuning, mergeRangeGapBytes = tuning.mergeRangeGapBytes, options = {}) {
    const ranges = mergeRanges(segments, mergeRangeGapBytes, options, tuning);
    if (ranges.length === segments.length) return parallelSegments(segments, mode, reason, tuning);
    const selectedBytes = segments.reduce((sum, item) => sum + item.segment.length, 0);
    const rangeEstimate = estimateRangeAccess(ranges);
    const estimate = {
      requestCount: rangeEstimate.requestCount,
      selectedBytes,
      fetchedBytes: rangeEstimate.fetchedBytes,
      chunkCount: new Set(ranges.map((range) => range.chunk.id)).size,
      segmentCount: segments.length
    };
    if (ranges.length === 1) {
      return {
        kind: "single-merged",
        mode,
        ranges,
        concurrency: 1,
        reason,
        estimate
      };
    }
    return {
      kind: "merged-ranges",
      mode,
      ranges,
      concurrency: segmentConcurrency(ranges.length, rangeEstimate.fetchedBytes, tuning),
      reason,
      estimate
    };
  }
  function bestRangePlan(segments, mode, reason, tuning, coalesceHotChunks = true, coalescedReason = "hot-chunk-range-coalesced") {
    const gaps = [
      0,
      tuning.mergeRangeGapBytes,
      Math.max(tuning.mergeRangeGapBytes, 64 * 1024),
      Math.max(tuning.mergeRangeGapBytes, 256 * 1024)
    ];
    let best = null;
    for (const gap of new Set(gaps)) {
      const candidate = rangePlan(segments, mode, reason, tuning, gap);
      if (!best || planCost(candidate, tuning) < planCost(best, tuning)) best = candidate;
      if (coalesceHotChunks && hasHotChunkFanout(segments, gap, tuning)) {
        const capped = rangePlan(segments, mode, coalescedReason, tuning, gap, {
          coalesceHotChunks: true
        });
        if (!best || planCost(capped, tuning) < planCost(best, tuning)) best = capped;
      }
    }
    return best;
  }
  function hasHotChunkFanout(segments, mergeRangeGapBytes, tuning) {
    const ranges = mergeRanges(segments, mergeRangeGapBytes);
    const counts = /* @__PURE__ */ new Map();
    for (const range of ranges) {
      const nextCount = (counts.get(range.chunk.id) ?? 0) + 1;
      if (nextCount > tuning.maxRangesPerChunk && typeof range.chunk.byteLength === "number") {
        return true;
      }
      counts.set(range.chunk.id, nextCount);
    }
    return false;
  }
  function mergeRanges(segments, mergeRangeGapBytes, options = {}, tuning) {
    const byChunk = /* @__PURE__ */ new Map();
    for (const item of segments) {
      const chunkSegments = byChunk.get(item.chunk.id) ?? [];
      chunkSegments.push(item);
      byChunk.set(item.chunk.id, chunkSegments);
    }
    const ranges = [];
    for (const chunkSegments of byChunk.values()) {
      chunkSegments.sort((a, b) => a.segment.offset - b.segment.offset);
      const chunkRanges = [];
      for (const item of chunkSegments) {
        const last = chunkRanges.at(-1);
        const itemEnd = item.segment.offset + item.segment.length;
        if (last && last.chunk.id === item.chunk.id && item.segment.offset - (last.offset + last.length) <= mergeRangeGapBytes) {
          last.length = Math.max(last.length, itemEnd - last.offset);
          last.segments.push(item);
          continue;
        }
        chunkRanges.push({
          chunk: item.chunk,
          offset: item.segment.offset,
          length: item.segment.length,
          segments: [item]
        });
      }
      const first = chunkSegments[0];
      if (options.coalesceHotChunks && tuning && first && chunkRanges.length > tuning.maxRangesPerChunk) {
        ranges.push(...coalesceRangeFanout(chunkRanges, tuning.maxRangesPerChunk));
        continue;
      }
      ranges.push(...chunkRanges);
    }
    return ranges;
  }
  function coalesceRangeFanout(ranges, maxRangesPerChunk) {
    const out = ranges.map((range) => ({
      ...range,
      segments: [...range.segments]
    }));
    while (out.length > maxRangesPerChunk) {
      let mergeAt = 0;
      let smallestGap = Number.POSITIVE_INFINITY;
      let smallestMergedSegmentCount = Number.POSITIVE_INFINITY;
      for (let index = 0; index < out.length - 1; index += 1) {
        const current2 = out[index];
        const next2 = out[index + 1];
        const currentEnd = current2.offset + current2.length;
        const gap = next2.offset - currentEnd;
        const mergedSegmentCount = current2.segments.length + next2.segments.length;
        if (gap < smallestGap || gap === smallestGap && mergedSegmentCount < smallestMergedSegmentCount) {
          smallestGap = gap;
          smallestMergedSegmentCount = mergedSegmentCount;
          mergeAt = index;
        }
      }
      const current = out[mergeAt];
      const next = out[mergeAt + 1];
      const nextEnd = next.offset + next.length;
      current.length = Math.max(current.length, nextEnd - current.offset);
      current.segments.push(...next.segments);
      out.splice(mergeAt + 1, 1);
    }
    return out;
  }
  function planCost(plan, tuning) {
    return plan.estimate.fetchedBytes + plan.estimate.requestCount * tuning.rangeRequestPenaltyBytes;
  }
  function segmentConcurrency(count, fetchedBytes, tuning) {
    const max = fetchedBytes <= SMALL_SELECTED_BYTES ? Math.min(4, tuning.maxParallelSegmentRequests) : tuning.maxParallelSegmentRequests;
    return Math.min(max, Math.max(1, count));
  }
  function positiveFinite(value, fallback) {
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }
  function positiveInt(value, fallback) {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
  }
  function estimateRangeAccess(ranges) {
    const byChunk = /* @__PURE__ */ new Map();
    for (const range of ranges) {
      const chunkRanges = byChunk.get(range.chunk.id) ?? [];
      chunkRanges.push(range);
      byChunk.set(range.chunk.id, chunkRanges);
    }
    let requestCount = 0;
    let fetchedBytes = 0;
    for (const chunkRanges of byChunk.values()) {
      const firstRange = chunkRanges[0];
      if (firstRange?.chunk.kind === "concat-deflate") {
        requestCount += 1;
        fetchedBytes += firstRange.chunk.byteLength ?? 0;
        continue;
      }
      if (firstRange && typeof firstRange.chunk.payloadOffset === "number") {
        requestCount += chunkRanges.length;
        fetchedBytes += chunkRanges.reduce((sum, range) => sum + range.length, 0);
        continue;
      }
      requestCount += 1;
      fetchedBytes += CHUNK_PAYLOAD_HEADER_PROBE_BYTES;
      for (const range of chunkRanges) {
        const rangeEnd = range.offset + range.length;
        if (rangeEnd <= CHUNK_PAYLOAD_HEADER_PROBE_BYTES) continue;
        requestCount += 1;
        fetchedBytes += rangeEnd - Math.max(range.offset, CHUNK_PAYLOAD_HEADER_PROBE_BYTES);
      }
    }
    return { requestCount, fetchedBytes };
  }
  function segmentCoversChunkPayload(chunk, segment) {
    return typeof chunk.byteLength === "number" && segment.offset === 0 && segment.length === chunk.byteLength;
  }
  function canStreamDecode() {
    return typeof DecompressionStream !== "undefined";
  }

  // ../../packages/core/src/token/base.ts
  var PackTokenBase = class {
    constructor(source, options) {
      this.source = source;
      this.options = options;
    }
    cachedPack = null;
    pack() {
      this.cachedPack ??= this.decodeSourceToPack(this.source, this.options);
      return this.cachedPack;
    }
    async text(path) {
      const pack2 = await this.pack();
      if (pack2.isPack()) {
        if (!path) throw new Error("Token.text(path): path is required for directory packs");
        return pack2.text(path);
      }
      if (pack2.isDiff()) throw new Error("Token.text(): diff packs do not expose file text");
      return pack2.text();
    }
    async blob(path) {
      const pack2 = await this.pack();
      if (pack2.isPack()) {
        if (!path) throw new Error("Token.blob(path): path is required for directory packs");
        return pack2.blob(path);
      }
      if (pack2.isDiff()) throw new Error("Token.blob(): diff packs do not expose file blobs");
      return pack2.blob();
    }
  };
  var TokenBase = class _TokenBase extends PackTokenBase {
    async diff(other) {
      const otherToken = other instanceof _TokenBase ? other : this.createToken(other, this.options);
      const [algoA, algoB] = await Promise.all([
        this.detectSourceAlgorithmName(this.source),
        otherToken.detectSourceAlgorithmName(otherToken.source)
      ]);
      if (algoA !== algoB) {
        throw new Error(`diff: source algorithms differ (${algoA} vs ${algoB}); same-algo only`);
      }
      const a = await this.pack();
      const b = await otherToken.pack();
      if (!a.isPack() || !b.isPack()) {
        throw new Error("Token.diff(): both tokens must decode to directory packs");
      }
      const diffResult = await a.diffTo(b);
      return this.createToken(
        diffResult.bytes,
        this.options
      ).pack();
    }
    async applyDiff(diffToken) {
      const base2 = await this.pack();
      const diff2 = await (diffToken instanceof _TokenBase ? diffToken : this.createToken(diffToken, this.options)).pack();
      if (!base2.isPack()) throw new Error("Token.applyDiff(): source must be a directory pack");
      if (!diff2.isDiff()) throw new Error("Token.applyDiff(): diff token must decode to a diff pack");
      return base2.apply(diff2);
    }
  };

  // ../../packages/browser/src/token.ts
  var Token = class _Token extends TokenBase {
    constructor(source, options = {}) {
      super(source, options);
    }
    decodeSourceToPack = decodeSourceToPack;
    detectSourceAlgorithmName = detectSourceAlgorithmName;
    createToken(source, options) {
      return new _Token(source, options);
    }
    stream(source = this.source) {
      return new TokenStream(source, this.options);
    }
  };
  var TokenStream = class extends PackTokenBase {
    constructor(source, options = {}) {
      super(source, options);
    }
    decodeSourceToPack = decodeStream;
  };

  // ../../packages/browser/src/router-token.ts
  var textDecoder = new TextDecoder();
  var CHUNK_PAYLOAD_HEADER_BYTES = 8192;
  var SINGLE_LOAD_BATCH_WINDOW_MS = 4;
  async function decodeRouter(source, options = {}) {
    const decoded = typeof source === "string" ? await decodeStream(source, options) : await new Token(source, options).pack();
    const pack2 = await maybeRouterToken(decoded, source, options);
    if (!pack2.isRouter()) throw new Error("decodeRouter(source): token is not a router token");
    return pack2;
  }
  var RouterToken = class {
    constructor(source, options = {}, manifest) {
      this.source = source;
      this.options = options;
      this.routerBaseUrl = resolveRouterBaseUrl(source, options.baseUrl);
      if (manifest) this.manifestPromise = Promise.resolve(manifest);
      this.list = Object.assign(async () => this.files(), []);
      this.stream = new RouterTokenStreamApi(this);
      if (options.prefetchOnInit) this.kickOffPrefetch(options.prefetchOnInit);
    }
    list;
    entries = [];
    stream;
    routerBaseUrl;
    manifestPromise = null;
    chunkByIdPromise = null;
    filesPromise = null;
    fileLookupPromise = null;
    chunkPayloadHandleCache = /* @__PURE__ */ new Map();
    chunkBytesCache = /* @__PURE__ */ new Map();
    chunkBytesSettled = /* @__PURE__ */ new Set();
    chunkPayloadHandleSettled = /* @__PURE__ */ new Set();
    fileContentCache = /* @__PURE__ */ new Map();
    bytesCache = /* @__PURE__ */ new Map();
    singleLoadBatches = /* @__PURE__ */ new Map();
    nextBatchId = 0;
    firstBatchFlushScheduled = false;
    kickOffPrefetch(opts) {
      void this.prefetchChunksInBackground(opts).catch(() => void 0);
    }
    async prefetchChunksInBackground(opts) {
      const manifest = await this.manifest();
      const chunksById = await this.chunkById();
      const chunkList = [...chunksById.values()];
      const requestedStrategy = opts.strategy;
      const anyPriority = chunkList.some((c) => typeof c.priority === "number");
      const strategy = requestedStrategy ?? (anyPriority ? "priority" : "manifest");
      const ordered = strategy === "priority" ? chunkList.filter((c) => typeof c.priority === "number").sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity)) : chunkList;
      const count = strategy === "all" ? ordered.length : opts.count ?? 16;
      const selected = ordered.slice(0, count);
      const concurrency = opts.concurrency ?? this.options.plannerDefaults?.maxParallelChunkRequests ?? 8;
      const startMs = now();
      this.emitDebug({
        type: "prefetch-start",
        startMs,
        strategy,
        requested: requestedStrategy ?? null,
        count: selected.length,
        concurrency,
        totalChunkCount: manifest.chunks.length,
        chunkIds: selected.map((c) => c.id)
      });
      await mapWithConcurrency(selected, concurrency, async (chunk) => {
        try {
          await this.chunkBytes(chunk, "stream");
        } catch {
        }
      });
      this.emitDebug({
        type: "prefetch-end",
        startMs,
        durationMs: now() - startMs,
        count: selected.length
      });
    }
    isPack() {
      return false;
    }
    isDiff() {
      return false;
    }
    isRouter() {
      return true;
    }
    async manifest() {
      this.manifestPromise ??= this.readManifest();
      return this.manifestPromise;
    }
    async plan(pathOrUrlsOrOptions, maybeOptions = {}) {
      const options = typeof pathOrUrlsOrOptions === "string" || Array.isArray(pathOrUrlsOrOptions) ? maybeOptions : pathOrUrlsOrOptions ?? {};
      const files = typeof pathOrUrlsOrOptions === "string" ? [await this.resolveFile(pathOrUrlsOrOptions)] : Array.isArray(pathOrUrlsOrOptions) ? await Promise.all(pathOrUrlsOrOptions.map((path) => this.resolveFile(path))) : await this.list();
      return this.createLoadPlan(files, this.readModeFor(options), options);
    }
    async files() {
      this.filesPromise ??= (async () => {
        const manifest = await this.manifest();
        const chunks = await this.chunkById();
        return manifest.files.map((file) => {
          for (const segment of file.segments) {
            const chunk = chunks.get(segment.chunkId);
            if (!chunk) throw new Error(`router file references missing chunk: ${segment.chunkId}`);
          }
          return file;
        });
      })();
      return this.filesPromise;
    }
    async load(pathOrUrl, options = {}) {
      return this.loadWithMode(pathOrUrl, options, this.readModeFor(options));
    }
    async loadStream(pathOrUrl, options = {}) {
      return this.loadWithMode(pathOrUrl, options, "stream");
    }
    async loadWithMode(pathOrUrl, options, mode) {
      const entry = await this.resolveFile(pathOrUrl);
      const cacheKey = `${mode}:${entry.url}:${options.strategy ?? this.options.strategy ?? "auto"}`;
      let cached = this.bytesCache.get(cacheKey);
      if (!cached) {
        cached = this.enqueueSingleLoad(entry, mode, options, cacheKey);
        this.bytesCache.set(cacheKey, cached);
      }
      return cached;
    }
    async loadText(pathOrUrl, options = {}) {
      return textDecoder.decode(await this.load(pathOrUrl, options));
    }
    async text(pathOrUrlsOrOptions, maybeOptions = {}) {
      if (typeof pathOrUrlsOrOptions === "string") {
        return this.loadText(pathOrUrlsOrOptions, maybeOptions);
      }
      if (Array.isArray(pathOrUrlsOrOptions)) {
        return this.textMany(pathOrUrlsOrOptions, maybeOptions, this.readModeFor(maybeOptions));
      }
      const files = await this.loadAll(pathOrUrlsOrOptions ?? {});
      return files.map((file) => textDecoder.decode(file.bytes)).join("");
    }
    async content(options = {}) {
      const files = await this.loadAll(options);
      return concatBytes2(files.map((file) => file.bytes));
    }
    async json(pathOrUrl, options = {}) {
      const text = pathOrUrl === void 0 ? await this.text(options) : await this.text(pathOrUrl, options);
      return JSON.parse(text);
    }
    async blob(pathOrUrlsOrOptions, maybeOptions = {}) {
      if (typeof pathOrUrlsOrOptions === "string") {
        const bytes = await this.load(pathOrUrlsOrOptions, maybeOptions);
        return new Blob([bytes]);
      }
      if (Array.isArray(pathOrUrlsOrOptions)) {
        return this.blobMany(pathOrUrlsOrOptions, maybeOptions, this.readModeFor(maybeOptions));
      }
      const files = await this.loadAll(pathOrUrlsOrOptions ?? {});
      return new Blob(files.map((file) => file.bytes));
    }
    async loadAll(options = {}) {
      const files = await this.list();
      const loaded = await this.loadMany(files, this.readModeFor(options), options);
      return files.map((file) => ({ entry: file, bytes: loaded.get(file) }));
    }
    async extractAll() {
      const files = await this.loadAll();
      return files.map((file) => ({ path: file.entry.path, bytes: file.bytes }));
    }
    async materialize(pathOrUrlsOrOptions, maybeOptions = {}) {
      if (typeof pathOrUrlsOrOptions === "string") {
        return this.materializeOne(pathOrUrlsOrOptions, maybeOptions);
      }
      if (Array.isArray(pathOrUrlsOrOptions)) {
        return this.materializeMany(pathOrUrlsOrOptions, maybeOptions);
      }
      return this.materializeAll(pathOrUrlsOrOptions ?? {});
    }
    async materializeAll(options = {}) {
      const files = await this.list();
      return this.materializeEntries(files, options);
    }
    async materializeOne(pathOrUrl, options = {}) {
      const entry = await this.resolveFile(pathOrUrl);
      const bytes = await this.loadWithMode(pathOrUrl, options, this.readModeFor(options));
      const kind = materializedKind(entry, options.as ?? "auto");
      const decodeStart = now();
      const text = kind === "bytes" ? "" : textDecoder.decode(bytes);
      const decodeMs = now() - decodeStart;
      const executeStart = now();
      const element = executeMaterialized(kind, text, options.nonce);
      const executeMs = now() - executeStart;
      this.emitDebug({
        type: "materialize",
        path: entry.path,
        kind,
        startMs: decodeStart,
        durationMs: decodeMs + executeMs,
        decodeMs,
        executeMs,
        bytes: bytes.byteLength
      });
      return { entry, bytes, text, kind, element, timing: { decodeMs, executeMs } };
    }
    async materializeMany(pathOrUrls, options = {}) {
      const files = await Promise.all(pathOrUrls.map((pathOrUrl) => this.resolveFile(pathOrUrl)));
      return this.materializeEntries(files, options);
    }
    async materializeEntries(files, options, mode = this.readModeFor(options)) {
      const load = await this.startProgressiveLoad(files, mode, options);
      const materialized = [];
      try {
        for (const file of files) {
          const bytes = await load.ready.get(file);
          materialized.push(this.materializeLoadedFile(file, bytes, options));
        }
        await load.done;
      } catch (error) {
        await load.done.catch(() => void 0);
        throw error;
      }
      return materialized;
    }
    readModeFor(options = {}) {
      const strategy = options.strategy ?? this.options.strategy ?? "auto";
      return strategy === "full" || strategy === "range-fetch" || strategy === "range-fetch-all" ? "buffered" : "stream";
    }
    async readManifest() {
      const startMs = now();
      const tokenStartMs = now();
      const pack2 = await new Token(this.source, this.options).pack();
      const tokenDecodeMs = now() - tokenStartMs;
      if (pack2.isDiff()) throw new Error("router token cannot be a diff token");
      const text = pack2.isPack() ? await pack2.text(ROUTER_MANIFEST_PATH) : await pack2.text();
      const jsonStartMs = now();
      const manifest = JSON.parse(text);
      const jsonParseMs = now() - jsonStartMs;
      if (manifest.version !== 1) {
        throw new Error(`unsupported router token manifest version: ${manifest.version}`);
      }
      this.emitDebug({
        type: "manifest",
        startMs,
        durationMs: now() - startMs,
        tokenDecodeMs,
        jsonParseMs,
        chunkCount: manifest.chunks.length,
        fileCount: manifest.files.length,
        byteLength: text.length
      });
      return manifest;
    }
    async chunkById() {
      this.chunkByIdPromise ??= (async () => {
        const manifest = await this.manifest();
        return new Map(
          manifest.chunks.map((chunk) => [
            chunk.id,
            { ...chunk, url: resolveChunkUrl(chunk.href, this.routerBaseUrl) }
          ])
        );
      })();
      return this.chunkByIdPromise;
    }
    async fileLookup() {
      this.fileLookupPromise ??= (async () => {
        const files = await this.list();
        const byUrl = /* @__PURE__ */ new Map();
        const byPath = /* @__PURE__ */ new Map();
        for (const file of files) {
          byUrl.set(file.url, file);
          const pathMatches = byPath.get(file.path) ?? [];
          pathMatches.push(file);
          byPath.set(file.path, pathMatches);
        }
        return { byUrl, byPath };
      })();
      return this.fileLookupPromise;
    }
    async resolveFile(pathOrUrl) {
      const lookup = await this.fileLookup();
      const urlMatch = lookup.byUrl.get(pathOrUrl);
      if (urlMatch) return urlMatch;
      const pathMatches = lookup.byPath.get(pathOrUrl) ?? [];
      if (pathMatches.length === 1) return pathMatches[0];
      if (pathMatches.length > 1) {
        throw new Error(
          `router token path is ambiguous: ${pathOrUrl}. Use a full URL or inspect list().`
        );
      }
      throw new Error(`router token has no file: ${pathOrUrl}`);
    }
    async textMany(paths, options, mode) {
      const files = await Promise.all(paths.map((path) => this.resolveFile(path)));
      const loaded = await this.loadMany(files, mode, options);
      const out = /* @__PURE__ */ new Map();
      for (const file of files) out.set(file.url, textDecoder.decode(loaded.get(file)));
      return out;
    }
    async blobMany(paths, options, mode) {
      const files = await Promise.all(paths.map((path) => this.resolveFile(path)));
      const loaded = await this.loadMany(files, mode, options);
      const out = /* @__PURE__ */ new Map();
      for (const file of files) {
        out.set(file.url, new Blob([loaded.get(file)]));
      }
      return out;
    }
    async loadMany(files, mode, options = {}) {
      return this.executeLoadMany(files, mode, options);
    }
    enqueueSingleLoad(file, mode, options, cacheKey) {
      const batchKey = this.singleLoadBatchKey(mode, options);
      let batch = this.singleLoadBatches.get(batchKey);
      if (!batch) {
        batch = {
          id: ++this.nextBatchId,
          startMs: now(),
          mode,
          options,
          items: []
        };
        this.singleLoadBatches.set(batchKey, batch);
        this.scheduleSingleLoadBatchFlush(batchKey, batch);
      }
      const deferred = createDeferred();
      batch.items.push({ file, cacheKey, deferred });
      return deferred.promise;
    }
    async flushSingleLoadBatch(batchKey, batch) {
      if (this.singleLoadBatches.get(batchKey) !== batch) return;
      this.singleLoadBatches.delete(batchKey);
      const files = uniqueFiles(batch.items.map((item) => item.file));
      const strategy = batch.options.strategy ?? this.options.strategy ?? "auto";
      this.emitDebug({
        type: "batch",
        batchId: batch.id,
        mode: batch.mode,
        strategy,
        startMs: batch.startMs,
        durationMs: now() - batch.startMs,
        fileCount: files.length,
        paths: files.map((file) => file.path),
        files: routerDebugPlanFiles(files)
      });
      try {
        const load = await this.startProgressiveLoad(files, batch.mode, batch.options);
        await Promise.all(
          batch.items.map(async (item) => {
            const filePromise = load.ready.get(item.file);
            if (!filePromise) {
              const cacheKey = item.cacheKey;
              if (this.bytesCache.get(cacheKey) === item.deferred.promise) {
                this.bytesCache.delete(cacheKey);
              }
              item.deferred.reject(new Error(`router batch did not include file: ${item.file.path}`));
              return;
            }
            try {
              item.deferred.resolve(await filePromise);
            } catch (error) {
              if (this.bytesCache.get(item.cacheKey) === item.deferred.promise) {
                this.bytesCache.delete(item.cacheKey);
              }
              item.deferred.reject(error);
            }
          })
        );
        await load.done.catch(() => void 0);
      } catch (error) {
        for (const item of batch.items) {
          if (this.bytesCache.get(item.cacheKey) === item.deferred.promise) {
            this.bytesCache.delete(item.cacheKey);
          }
          item.deferred.reject(error);
        }
      }
    }
    singleLoadBatchKey(mode, options) {
      const strategy = options.strategy ?? this.options.strategy ?? "auto";
      const planner = options.planner ? JSON.stringify(options.planner) : "";
      const batchWindowMs = this.singleLoadBatchWindowMs(options);
      return `${mode}:${strategy}:${batchWindowMs}:${planner}`;
    }
    scheduleSingleLoadBatchFlush(batchKey, batch) {
      if (!this.firstBatchFlushScheduled) {
        this.firstBatchFlushScheduled = true;
        queueMicrotask(() => this.flushSingleLoadBatch(batchKey, batch));
        return;
      }
      const batchWindowMs = this.singleLoadBatchWindowMs(batch.options);
      if (batchWindowMs <= 0) {
        queueMicrotask(() => this.flushSingleLoadBatch(batchKey, batch));
        return;
      }
      setTimeout(() => this.flushSingleLoadBatch(batchKey, batch), batchWindowMs);
    }
    singleLoadBatchWindowMs(options) {
      const configured = options.singleLoadBatchWindowMs ?? this.options.singleLoadBatchWindowMs;
      if (configured === void 0) return SINGLE_LOAD_BATCH_WINDOW_MS;
      if (!Number.isFinite(configured) || configured <= 0) return 0;
      return configured;
    }
    async executeLoadMany(files, mode, options = {}) {
      const load = await this.startProgressiveLoad(files, mode, options);
      const entries = await Promise.all(
        files.map(async (file) => {
          const promise = load.ready.get(file);
          if (!promise) throw new Error(`router progressive load missing file: ${file.path}`);
          return [file, await promise];
        })
      );
      await load.done.catch(() => void 0);
      return new Map(entries);
    }
    async startProgressiveLoad(files, mode, options = {}) {
      const ready = /* @__PURE__ */ new Map();
      const states = /* @__PURE__ */ new Map();
      for (const file of files) {
        let pending = this.fileContentCache.get(file);
        if (!pending) {
          const deferred = createDeferred();
          pending = deferred.promise;
          states.set(file, { file, pendingSegments: file.segments.length, deferred });
          this.fileContentCache.set(file, pending);
          pending.catch(() => {
            if (this.fileContentCache.get(file) === pending) this.fileContentCache.delete(file);
          });
        }
        ready.set(file, pending);
      }
      const missing = [...states.keys()];
      const done = (async () => {
        try {
          if (missing.length === 0) return;
          const plan = await this.createLoadPlan(missing, mode, options);
          if (plan.kind === "whole-chunks") {
            await this.progressiveWholeChunks(
              missing,
              plan.chunks,
              plan.mode,
              plan.concurrency,
              states
            );
          } else if (plan.kind === "merged-ranges" || plan.kind === "single-merged") {
            await this.progressiveRanges(plan.ranges, plan.mode, plan.concurrency, states);
          } else {
            await this.progressiveSegments(plan.segments, plan.mode, plan.concurrency, states);
          }
        } catch (error) {
          rejectPending(states, error);
          throw error;
        }
      })();
      done.catch(() => void 0);
      return { ready, done };
    }
    async progressiveSegments(segments, mode, concurrency, states) {
      await mapWithConcurrency(segments, concurrency, async (item) => {
        const bytes = await this.segmentBytes(item.chunk, item.segment, mode);
        await this.addProgressiveSegment(states.get(item.file), item.segment, bytes);
      });
    }
    async progressiveRanges(ranges, mode, concurrency, states) {
      await mapWithConcurrency(ranges, concurrency, async (range) => {
        const bytes = await this.rangeBytes(range.chunk, range.offset, range.length, mode);
        await Promise.all(
          range.segments.map((item) => {
            const localOffset = item.segment.offset - range.offset;
            const segmentBytes = bytes.subarray(localOffset, localOffset + item.segment.length);
            return this.addProgressiveSegment(states.get(item.file), item.segment, segmentBytes);
          })
        );
      });
    }
    async progressiveWholeChunks(files, chunks, mode, concurrency, states) {
      const byChunk = /* @__PURE__ */ new Map();
      for (const file of files) {
        for (const segment of file.segments) {
          const items = byChunk.get(segment.chunkId) ?? [];
          items.push({ file, segment });
          byChunk.set(segment.chunkId, items);
        }
      }
      await mapWithConcurrency(chunks, concurrency, async (chunk) => {
        const chunkBytes = await this.chunkBytes(chunk, mode);
        const items = byChunk.get(chunk.id) ?? [];
        await Promise.all(
          items.map((item) => {
            const bytes = chunkBytes.subarray(
              item.segment.offset,
              item.segment.offset + item.segment.length
            );
            return this.addProgressiveSegment(states.get(item.file), item.segment, bytes);
          })
        );
      });
    }
    async addProgressiveSegment(state, segment, bytes) {
      if (this.isCompleteCompressedFileSegment(state.file, segment, bytes)) {
        state.directCompressed = bytes;
      } else {
        state.directCompressed = void 0;
        state.compressed ??= new Uint8Array(this.compressedLength(state.file));
        state.compressed.set(bytes, segment.fileOffset ?? 0);
      }
      state.pendingSegments -= 1;
      if (state.pendingSegments > 0) return;
      try {
        const compressed = state.directCompressed ?? state.compressed;
        if (!compressed) throw new Error(`router file had no loaded bytes: ${state.file.path}`);
        state.deferred.resolve(await this.decompressFile(state.file, compressed));
      } catch (error) {
        state.deferred.reject(error);
        throw error;
      }
    }
    materializeLoadedFile(file, bytes, options) {
      const startMs = now();
      const kind = materializedKind(file, options.as ?? "auto");
      const decodeStart = now();
      const text = kind === "bytes" ? "" : textDecoder.decode(bytes);
      const decodeMs = now() - decodeStart;
      const executeStart = now();
      const element = executeMaterialized(kind, text, options.nonce);
      const executeMs = now() - executeStart;
      this.emitDebug({
        type: "materialize",
        path: file.path,
        kind,
        startMs,
        durationMs: now() - startMs,
        decodeMs,
        executeMs,
        bytes: bytes.byteLength
      });
      return { entry: file, bytes, text, kind, element, timing: { decodeMs, executeMs } };
    }
    async createLoadPlan(files, mode, options) {
      const startMs = now();
      const strategy = options.strategy ?? this.options.strategy ?? "auto";
      const plan = planRouterLoad(files, await this.chunkById(), {
        allFiles: await this.list(),
        mode,
        ...this.options.plannerDefaults ?? {},
        ...options.planner ?? {},
        strategy
      });
      this.emitDebug({
        type: "plan",
        startMs,
        durationMs: now() - startMs,
        kind: plan.kind,
        mode: plan.mode,
        strategy,
        reason: plan.reason,
        fileCount: files.length,
        paths: files.map((file) => file.path),
        files: routerDebugPlanFiles(files),
        chunkIds: chunkIdsForPlan(plan),
        requestCount: plan.estimate.requestCount,
        chunkCount: plan.estimate.chunkCount,
        segmentCount: plan.estimate.segmentCount,
        selectedBytes: plan.estimate.selectedBytes,
        fetchedBytes: plan.estimate.fetchedBytes,
        concurrency: plan.concurrency,
        profile: plan.profile,
        tuning: plan.tuning
      });
      return plan;
    }
    isCompleteCompressedFileSegment(file, segment, bytes) {
      return (segment.fileOffset ?? 0) === 0 && segment.length === this.compressedLength(file) && bytes.byteLength === segment.length;
    }
    compressedLength(file) {
      return file.compressedByteLength ?? file.byteLength;
    }
    async decompressFile(file, compressed) {
      if (!file.compressor) return compressed;
      const startMs = now();
      const bytes = await decompressRaw(compressed, file.compressor, {
        level: file.level ?? 0,
        uncompressedLength: file.byteLength
      });
      this.emitDebug({
        type: "decompress",
        path: file.path,
        compressor: file.compressor,
        level: file.level,
        startMs,
        durationMs: now() - startMs,
        compressedBytes: compressed.byteLength,
        rawBytes: bytes.byteLength
      });
      return bytes;
    }
    chunkBytes(chunk, mode) {
      const cacheKey = chunk.id;
      let cached = this.chunkBytesCache.get(cacheKey);
      const startMs = now();
      const cacheState = !cached ? "miss" : this.chunkBytesSettled.has(cacheKey) ? "hit" : "pending";
      if (!cached) {
        const promise = (async () => {
          const raw = await this.decodeChunkBytes(chunk, mode);
          if (chunk.kind !== "concat-deflate") {
            return { bytes: raw, inflateMs: 0 };
          }
          const compressor = chunk.compressor ?? "deflate-9";
          const inflateStart = now();
          const inflated = await decompressRaw(raw, compressor, {
            level: chunk.level ?? 0,
            uncompressedLength: chunk.uncompressedByteLength ?? 0
          });
          return { bytes: inflated, inflateMs: now() - inflateStart };
        })();
        cached = promise.then(({ bytes, inflateMs }) => {
          this.chunkBytesSettled.add(cacheKey);
          this.emitDebug({
            type: "chunk",
            chunkId: chunk.id,
            url: chunk.url,
            mode,
            cacheState,
            startMs,
            durationMs: now() - startMs,
            pngBytes: chunk.byteLength,
            payloadBytes: bytes.byteLength,
            kind: chunk.kind,
            inflateMs
          });
          return bytes;
        }).catch((error) => {
          if (this.chunkBytesCache.get(cacheKey) === cached) {
            this.chunkBytesCache.delete(cacheKey);
            this.chunkBytesSettled.delete(cacheKey);
          }
          throw error;
        });
        this.chunkBytesCache.set(cacheKey, cached);
      } else {
        cached.then(
          (bytes) => {
            this.emitDebug({
              type: "chunk",
              chunkId: chunk.id,
              url: chunk.url,
              mode,
              cacheState,
              startMs,
              durationMs: now() - startMs,
              pngBytes: chunk.byteLength,
              payloadBytes: bytes.byteLength,
              kind: chunk.kind
            });
          },
          () => void 0
        );
      }
      return cached;
    }
    async segmentBytes(chunk, segment, mode) {
      if (chunk.kind === "concat-deflate" || segmentCoversChunkPayload(chunk, segment)) {
        const bytes = await this.chunkBytes(chunk, mode);
        return bytes.byteLength === segment.length ? bytes : bytes.subarray(segment.offset, segment.offset + segment.length);
      }
      try {
        const handle = await this.chunkPayloadHandle(chunk);
        if (mode === "stream") {
          return this.fetchRangeBytes(
            chunk,
            segment.offset,
            segment.length,
            mode,
            async () => readStreamBytes(
              await fetchPixelRangePayloadStream(handle, segment.offset, segment.length)
            )
          );
        }
        return this.fetchRangeBytes(
          chunk,
          segment.offset,
          segment.length,
          mode,
          () => fetchPixelRangePayloadBytes(handle, segment.offset, segment.length)
        );
      } catch {
        const chunkBytes = await this.chunkBytes(chunk, mode);
        const bytes = chunkBytes.subarray(segment.offset, segment.offset + segment.length);
        this.emitDebug({
          type: "range",
          chunkId: chunk.id,
          url: chunk.url,
          mode,
          startMs: now(),
          durationMs: 0,
          offset: segment.offset,
          length: segment.length,
          bytes: bytes.byteLength,
          fallback: true
        });
        return bytes;
      }
    }
    async rangeBytes(chunk, offset, length, mode) {
      if (chunk.kind === "concat-deflate") {
        const bytes = await this.chunkBytes(chunk, mode);
        return bytes.subarray(offset, offset + length);
      }
      try {
        const handle = await this.chunkPayloadHandle(chunk);
        if (mode === "stream") {
          return this.fetchRangeBytes(
            chunk,
            offset,
            length,
            mode,
            async () => readStreamBytes(await fetchPixelRangePayloadStream(handle, offset, length))
          );
        }
        return this.fetchRangeBytes(
          chunk,
          offset,
          length,
          mode,
          () => fetchPixelRangePayloadBytes(handle, offset, length)
        );
      } catch {
        const chunkBytes = await this.chunkBytes(chunk, mode);
        const bytes = chunkBytes.subarray(offset, offset + length);
        this.emitDebug({
          type: "range",
          chunkId: chunk.id,
          url: chunk.url,
          mode,
          startMs: now(),
          durationMs: 0,
          offset,
          length,
          bytes: bytes.byteLength,
          fallback: true
        });
        return bytes;
      }
    }
    async fetchRangeBytes(chunk, offset, length, mode, read) {
      const startMs = now();
      const bytes = await read();
      this.emitDebug({
        type: "range",
        chunkId: chunk.id,
        url: chunk.url,
        mode,
        startMs,
        durationMs: now() - startMs,
        offset,
        length,
        bytes: bytes.byteLength,
        fallback: false
      });
      return bytes;
    }
    chunkPayloadHandle(chunk) {
      if (typeof chunk.payloadOffset === "number") {
        const startMs2 = now();
        this.emitDebug({
          type: "payload-handle",
          chunkId: chunk.id,
          url: chunk.url,
          cacheState: "hit",
          startMs: startMs2,
          durationMs: 0,
          payloadOffset: chunk.payloadOffset,
          payloadBytes: chunk.byteLength ?? 0,
          prefetchedBytes: 0
        });
        return Promise.resolve({
          url: chunk.url,
          prefetchedBytes: new Uint8Array(0),
          payloadAbsOffset: chunk.payloadOffset,
          payloadByteLength: chunk.byteLength ?? 0
        });
      }
      const initialBytes = CHUNK_PAYLOAD_HEADER_BYTES;
      const cached = this.chunkPayloadHandleCache.get(chunk.id);
      if (cached && cached.initialBytes >= initialBytes) {
        const startMs2 = now();
        const cacheState = this.chunkPayloadHandleSettled.has(chunk.id) ? "hit" : "pending";
        return cached.promise.then((handle) => {
          this.emitDebug({
            type: "payload-handle",
            chunkId: chunk.id,
            url: chunk.url,
            cacheState,
            startMs: startMs2,
            durationMs: now() - startMs2,
            payloadOffset: handle.payloadAbsOffset,
            payloadBytes: handle.payloadByteLength,
            prefetchedBytes: handle.prefetchedBytes.byteLength
          });
          return handle;
        });
      }
      const startMs = now();
      const promise = fetchPixelRangePayloadHandle(chunk.url, initialBytes).then((handle) => {
        this.chunkPayloadHandleSettled.add(chunk.id);
        this.emitDebug({
          type: "payload-handle",
          chunkId: chunk.id,
          url: chunk.url,
          cacheState: "miss",
          startMs,
          durationMs: now() - startMs,
          payloadOffset: handle.payloadAbsOffset,
          payloadBytes: handle.payloadByteLength,
          prefetchedBytes: handle.prefetchedBytes.byteLength
        });
        return handle;
      });
      this.chunkPayloadHandleCache.set(chunk.id, { initialBytes, promise });
      return promise.catch((error) => {
        if (this.chunkPayloadHandleCache.get(chunk.id)?.promise === promise) {
          this.chunkPayloadHandleCache.delete(chunk.id);
        }
        throw error;
      });
    }
    async decodeChunkBytes(chunk, mode) {
      const { bytes } = mode === "stream" ? await decodeStreamPayload(chunk.url, this.options) : await decodeSourceToPayload(chunk.url, this.options);
      return bytes;
    }
    emitDebug(event) {
      this.options.debug?.(event);
    }
  };
  async function readStreamBytes(stream) {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(value);
    }
    return concatBytes2(chunks);
  }
  function createDeferred() {
    let resolve;
    let reject;
    const promise = new Promise((promiseResolve, promiseReject) => {
      resolve = promiseResolve;
      reject = promiseReject;
    });
    return { promise, resolve, reject };
  }
  function uniqueFiles(files) {
    const seen = /* @__PURE__ */ new Set();
    const unique = [];
    for (const file of files) {
      if (seen.has(file.url)) continue;
      seen.add(file.url);
      unique.push(file);
    }
    return unique;
  }
  function routerDebugPlanFiles(files) {
    return files.map((file) => ({
      path: file.path,
      url: file.url,
      chunkIds: [...new Set(file.segments.map((segment) => segment.chunkId))],
      segmentCount: file.segments.length,
      rawBytes: file.byteLength,
      compressedBytes: file.compressedByteLength ?? file.byteLength
    }));
  }
  function rejectPending(states, error) {
    for (const state of states.values()) {
      if (state.pendingSegments > 0) state.deferred.reject(error);
    }
  }
  function chunkIdsForPlan(plan) {
    if (plan.kind === "whole-chunks") return plan.chunks.map((chunk) => chunk.id);
    const ids = plan.kind === "parallel-segments" ? plan.segments.map((item) => item.chunk.id) : plan.ranges.map((range) => range.chunk.id);
    return [...new Set(ids)];
  }
  var RouterTokenStreamApi = class {
    constructor(router) {
      this.router = router;
    }
    async text(path) {
      if (typeof path === "string") {
        return textDecoder.decode(await this.router.loadStream(path));
      }
      if (Array.isArray(path)) {
        return this.router.textMany(path, {}, "stream");
      }
      const files = await this.router.list();
      const loaded = await this.router.loadMany(files, "stream");
      return files.map((file) => textDecoder.decode(loaded.get(file))).join("");
    }
    async blob(path) {
      if (typeof path === "string") {
        return new Blob([await this.router.loadStream(path)]);
      }
      if (Array.isArray(path)) {
        return this.router.blobMany(path, {}, "stream");
      }
      const files = await this.router.list();
      const loaded = await this.router.loadMany(files, "stream");
      return new Blob(files.map((file) => loaded.get(file)));
    }
    async extractAll() {
      const files = await this.router.list();
      const loaded = await this.router.loadMany(files, "stream");
      return files.map((file) => ({ path: file.path, bytes: loaded.get(file) }));
    }
    async materialize(path) {
      const paths = Array.isArray(path) ? path : path ? [path] : (await this.router.list()).map((file) => file.url);
      const files = await Promise.all(paths.map((item) => this.router.resolveFile(item)));
      const materialized = await this.router.materializeEntries(files, {}, "stream");
      return Array.isArray(path) || path === void 0 ? materialized : materialized[0];
    }
  };
  async function maybeRouterToken(rawPack, source, options = {}) {
    const manifest = await maybeReadRouterManifest(rawPack);
    return manifest ? new RouterToken(source, options, manifest) : withBrowserMaterialize(rawPack);
  }
  function withBrowserMaterialize(pack2) {
    if (pack2.isRouter()) return pack2;
    const target = pack2;
    if (pack2.isDiff()) return pack2;
    target.materialize = async (path) => materializePack(pack2, path);
    return target;
  }
  async function maybeReadRouterManifest(pack2) {
    if (pack2.isRouter() || pack2.isDiff()) return null;
    try {
      const text = pack2.isPack() ? await readPackRouterManifest(pack2) : await readFileRouterManifest(pack2);
      const manifest = JSON.parse(text);
      return manifest?.version === 1 && Array.isArray(manifest.chunks) && Array.isArray(manifest.files) ? manifest : null;
    } catch {
      return null;
    }
  }
  async function readPackRouterManifest(pack2) {
    if (!pack2.entries.some((entry) => entry.path === ROUTER_MANIFEST_PATH)) {
      throw new Error("not a router pack");
    }
    return pack2.text(ROUTER_MANIFEST_PATH);
  }
  async function readFileRouterManifest(pack2) {
    if (pack2.list[0] !== ROUTER_MANIFEST_PATH) throw new Error("not a router file");
    return pack2.text();
  }
  async function materializePack(pack2, path) {
    if (pack2.isPack()) {
      const paths = Array.isArray(path) ? path : path ? [path] : pack2.list;
      const files = await Promise.all(
        paths.map(async (filePath2) => ({
          path: filePath2,
          bytes: await pack2.extract(filePath2)
        }))
      );
      const materialized = files.map((file) => materializeBytes(file.path, file.bytes, {}));
      return Array.isArray(path) || path === void 0 ? materialized : materialized[0];
    }
    if (Array.isArray(path))
      throw new Error("FilePack.materialize: array path is only valid for packs");
    const filePath = path ?? pack2.list[0] ?? "";
    return materializeBytes(filePath, await pack2.content(), {});
  }
  function materializeBytes(path, bytes, headers) {
    const entry = {
      url: path,
      path,
      status: 200,
      headers,
      byteLength: bytes.byteLength,
      segments: []
    };
    const kind = materializedKind(entry, "auto");
    const text = kind === "bytes" ? "" : textDecoder.decode(bytes);
    const executeStart = now();
    const element = executeMaterialized(kind, text, void 0);
    const executeMs = now() - executeStart;
    return { entry, bytes, text, kind, element, timing: { decodeMs: 0, executeMs } };
  }
  function resolveRouterBaseUrl(source, baseUrl) {
    if (baseUrl) return baseUrl;
    if (typeof source === "string") {
      const documentBase = typeof document === "undefined" ? void 0 : document.baseURI;
      const locationBase = typeof location === "undefined" ? void 0 : location.href;
      return new URL(source, documentBase ?? locationBase).href;
    }
    throw new Error("decodeRouter(source): baseUrl is required when source is not a URL string");
  }
  function resolveChunkUrl(href, routerBaseUrl) {
    const routerUrl = new URL(routerBaseUrl);
    const chunkUrl = new URL(href, routerUrl);
    if (!chunkUrl.search && routerUrl.search) chunkUrl.search = routerUrl.search;
    return chunkUrl.href;
  }
  function materializedKind(entry, as) {
    if (as !== "auto") return as === "bytes" ? "bytes" : as;
    const contentType = entry.headers["content-type"] ?? entry.headers["Content-Type"] ?? "";
    const path = entry.path.toLowerCase();
    if (contentType.includes("javascript") || path.endsWith(".js") || path.endsWith(".mjs")) {
      return "js";
    }
    if (contentType.includes("css") || path.endsWith(".css")) return "css";
    if (contentType.startsWith("text/") || path.endsWith(".json")) return "text";
    return "bytes";
  }
  function executeMaterialized(kind, text, nonce) {
    if (kind !== "js" && kind !== "css") return null;
    if (typeof document === "undefined") {
      throw new Error(`RouterToken.materialize(${kind}): document is not available`);
    }
    if (kind === "css") {
      const style = document.createElement("style");
      if (nonce) style.nonce = nonce;
      style.textContent = text;
      document.head.appendChild(style);
      return style;
    }
    const script = document.createElement("script");
    if (nonce) script.nonce = nonce;
    script.text = text;
    document.head.appendChild(script);
    return script;
  }
  function concatBytes2(chunks) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return out;
  }
  async function mapWithConcurrency(values, concurrency, fn) {
    let next = 0;
    const workers = Array.from(
      { length: Math.min(Math.max(1, concurrency), Math.max(1, values.length)) },
      async () => {
        for (; ; ) {
          const index = next;
          next += 1;
          if (index >= values.length) return;
          await fn(values[index]);
        }
      }
    );
    await Promise.all(workers);
  }
  function now() {
    return typeof performance === "undefined" ? Date.now() : performance.now();
  }

  // ../../packages/core/src/pack-format/encode-pack.ts
  var SIG6 = Uint8Array.of(192, 222, 174, 84);

  // bench-app/src/benchBytes.ts
  function collectWireBytes() {
    const totals = {
      requests: 0,
      transferBytes: 0,
      encodedBytes: 0,
      decodedBytes: 0
    };
    const resources = performance.getEntriesByType("resource");
    for (const entry of resources) {
      if (!entry.name.startsWith("http")) continue;
      totals.requests += 1;
      totals.transferBytes += entry.transferSize;
      totals.encodedBytes += entry.encodedBodySize;
      totals.decodedBytes += entry.decodedBodySize;
    }
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav) {
      totals.requests += 1;
      totals.transferBytes += nav.transferSize;
      totals.encodedBytes += nav.encodedBodySize;
      totals.decodedBytes += nav.decodedBodySize;
    }
    return totals;
  }
  function diffWireBytes(after, before) {
    return {
      requests: after.requests - before.requests,
      transferBytes: after.transferBytes - before.transferBytes,
      encodedBytes: after.encodedBytes - before.encodedBytes,
      decodedBytes: after.decodedBytes - before.decodedBytes
    };
  }

  // bench-app/src/benchScope.ts
  var RANDOM_RATIO = 0.5;
  var RANDOM_SEED = "tokenpack-bench-v1";
  function parseBenchScope(value) {
    return value === "random" || value === "half" ? "random" : "full";
  }
  function selectBenchEntries(scope2, source) {
    if (scope2 === "full") return source;
    return {
      modules: selectRandomHalf(source.modules),
      styles: selectRandomHalf(source.styles),
      assets: selectRandomHalf(source.assets)
    };
  }
  function selectRandomHalf(items) {
    const target = Math.max(1, Math.ceil(items.length * RANDOM_RATIO));
    return [...items].sort((a, b) => stablePathScore(a.path) - stablePathScore(b.path)).slice(0, target).sort((a, b) => a.path.localeCompare(b.path));
  }
  function stablePathScore(path) {
    let hash2 = 2166136261;
    const value = `${RANDOM_SEED}:${path}`;
    for (let i = 0; i < value.length; i += 1) {
      hash2 ^= value.charCodeAt(i);
      hash2 = Math.imul(hash2, 16777619);
    }
    return hash2 >>> 0;
  }

  // bench-app/src/bootloader.ts
  var params = new URLSearchParams(location.search);
  var loader = params.get("loader") ?? "multi";
  var origin = params.get("origin") ?? "local";
  var scope = parseBenchScope(params.get("scope"));
  var cacheMode = params.get("cache") ?? "cold";
  var runId = params.get("run") ?? String(Date.now());
  var cdnBaseParam = params.get("cdnBase");
  var cdnBase = cdnBaseParam ?? ("".startsWith("http") ? "" : "");
  var base = origin === "cdn" ? cdnBase.replace(/\/$/, "") : "/bench-app/medium/assets";
  window.__BENCH_VARIANT = { loader, origin, base };
  performance.setResourceTimingBufferSize(2e4);
  var manifestCache = null;
  var routerCache = null;
  var bootBytes = null;
  boot().catch(reportBenchError);
  function reportBenchError(err) {
    const message = err instanceof Error ? err.message : String(err);
    window.__BENCH_ERROR = message;
    setStatus(`boot failed: ${message}`);
  }
  async function boot() {
    const t0 = benchStart();
    const phases = {};
    setStatus(`loading manifest from ${base}`);
    const tManifest = performance.now();
    const manifest = await fetchManifest(base);
    manifestCache = manifest;
    phases.manifestMs = performance.now() - tManifest;
    window.__BENCH_COUNTS = {
      modules: manifest.modules.length,
      styles: manifest.styles?.length ?? 0,
      images: manifest.assets?.length ?? 0,
      lazyModules: manifest.lazyModules?.length ?? 0,
      lazyStyles: manifest.lazyStyles?.length ?? 0,
      lazyImages: manifest.lazyAssets?.length ?? 0
    };
    const eager = selectEager(manifest);
    setStatus(`eager: ${describeEager(eager)} via ${loader} \xB7 ${describeScope(scope)}`);
    const tLoad = performance.now();
    const loadPhases = loader === "multi" ? await loadEagerMulti(eager, base) : loader === "single" ? await loadEagerSingle(eager, base) : loader === "router" ? await loadEagerRouter(eager, base) : void 0;
    if (!loadPhases) throw new Error(`unknown loader: ${loader}`);
    Object.assign(phases, loadPhases);
    phases.loadMs = performance.now() - tLoad;
    const tRender = performance.now();
    renderEager(eager.modules);
    phases.renderMs = performance.now() - tRender;
    const total = performance.now() - t0;
    bootBytes = collectWireBytes();
    window.__BENCH_BYTES = bootBytes;
    window.__BENCH_BOOT_DONE = total;
    window.__BENCH_PHASES = phases;
    document.title = `${loader}/${origin} \xB7 boot ${Math.round(total)}ms`;
    setStatus(
      `boot ${Math.round(total)} ms \xB7 ${phaseSummary(phases)} \xB7 render ${Math.round(phases.renderMs)} ms (${eager.modules.length} modules)`
    );
    setupLazyButton();
    window.dispatchEvent(
      new CustomEvent("bench:boot:done", { detail: { loader, origin, totalMs: total, phases } })
    );
  }
  async function fetchManifest(b) {
    const r = await fetch(cacheUrl(`${b}/manifest.json`), {
      cache: cacheMode === "cold" ? "no-store" : "default"
    });
    if (!r.ok) throw new Error(`manifest fetch failed: ${r.status}`);
    return await r.json();
  }
  async function loadEagerMulti(eager, b) {
    const imageRoot = ensureImageContainer();
    const started = performance.now();
    const jsCssTasks = [];
    const imageTasks = [];
    for (const m of eager.modules) jsCssTasks.push(injectScript(cacheUrl(`${b}/${m.path}`)));
    for (const s of eager.styles) jsCssTasks.push(injectStylesheet(cacheUrl(`${b}/${s.path}`)));
    for (const a of eager.assets) imageTasks.push(attachImage(cacheUrl(`${b}/${a.path}`), imageRoot));
    const jsCssDone = Promise.all(jsCssTasks).then(() => performance.now() - started);
    const imagesDone = Promise.all(imageTasks).then(() => performance.now() - started);
    const [jsCssMs, imagesMs] = await Promise.all([jsCssDone, imagesDone]);
    return { jsCssMs, imagesMs };
  }
  async function loadEagerSingle(eager, b) {
    const imageRoot = ensureImageContainer();
    const started = performance.now();
    const jsCssTasks = [
      injectScript(cacheUrl(`${b}/bundle.js`)),
      injectStylesheet(cacheUrl(`${b}/bundle.css`))
    ];
    const imageTasks = [];
    for (const a of eager.assets) imageTasks.push(attachImage(cacheUrl(`${b}/${a.path}`), imageRoot));
    const jsCssDone = Promise.all(jsCssTasks).then(() => performance.now() - started);
    const imagesDone = Promise.all(imageTasks).then(() => performance.now() - started);
    const [jsCssMs, imagesMs] = await Promise.all([jsCssDone, imagesDone]);
    return { jsCssMs, imagesMs };
  }
  async function loadEagerRouter(eager, b) {
    const started = performance.now();
    const router = await decodeRouter(cacheUrl(`${b}/router/router.png`));
    routerCache = router;
    const eagerPaths = [
      ...eager.modules.map((m) => m.path),
      ...eager.styles.map((s) => s.path),
      ...eager.assets.map((a) => a.path)
    ];
    const files = await router.materialize(eagerPaths);
    const materializeMs = performance.now() - started;
    const tImages = performance.now();
    await attachImagesFromMaterialized(files, ensureImageContainer());
    return { materializeMs, imagesMs: performance.now() - tImages };
  }
  async function loadLazyMulti(manifest, b) {
    const tasks = [];
    const imagePromises = [];
    for (const m of manifest.lazyModules ?? []) tasks.push(injectScript(cacheUrl(`${b}/${m.path}`)));
    for (const s of manifest.lazyStyles ?? [])
      tasks.push(injectStylesheet(cacheUrl(`${b}/${s.path}`)));
    for (const a of manifest.lazyAssets ?? []) {
      const p = fetchLazyBitmap(cacheUrl(`${b}/${a.path}`));
      imagePromises.push(p);
      tasks.push(p);
    }
    await Promise.all(tasks);
    return Promise.all(imagePromises);
  }
  async function loadLazySingle(manifest, b) {
    const tasks = [
      injectScript(cacheUrl(`${b}/lazy.js`)),
      injectStylesheet(cacheUrl(`${b}/lazy.css`))
    ];
    const imagePromises = [];
    for (const a of manifest.lazyAssets ?? []) {
      const p = fetchLazyBitmap(cacheUrl(`${b}/${a.path}`));
      imagePromises.push(p);
      tasks.push(p);
    }
    await Promise.all(tasks);
    return Promise.all(imagePromises);
  }
  async function loadLazyRouter(manifest, b) {
    const router = routerCache ?? await decodeRouter(cacheUrl(`${b}/router/router.png`));
    routerCache = router;
    const lazyPaths = [
      ...(manifest.lazyModules ?? []).map((m) => m.path),
      ...(manifest.lazyStyles ?? []).map((s) => s.path),
      ...(manifest.lazyAssets ?? []).map((a) => a.path)
    ];
    const files = await router.materialize(lazyPaths);
    return decodeImageBitmaps(files);
  }
  async function decodeImageBitmaps(files) {
    const imageFiles = files.filter((f) => f.kind === "bytes" && f.entry.path.endsWith(".png"));
    if (imageFiles.length === 0) return [];
    return Promise.all(
      imageFiles.map((f) => {
        const blob = new Blob([snapshotBytes(f.bytes)], { type: "image/png" });
        return createImageBitmap(blob);
      })
    );
  }
  async function attachImagesFromMaterialized(files, container) {
    const imageFiles = files.filter((f) => f.kind === "bytes" && f.entry.path.endsWith(".png"));
    if (imageFiles.length === 0) return;
    await Promise.all(
      imageFiles.map((f) => {
        const blob = new Blob([snapshotBytes(f.bytes)], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        return attachImageUrl(url, container);
      })
    );
  }
  function snapshotBytes(bytes) {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return copy.buffer;
  }
  function ensureImageContainer() {
    let container = document.getElementById("images");
    if (!container) {
      container = document.createElement("div");
      container.id = "images";
      document.body.appendChild(container);
    }
    return container;
  }
  function attachImage(url, container) {
    return attachImageUrl(url, container);
  }
  function attachImageUrl(url, container) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.decoding = "async";
      img.loading = "eager";
      container.appendChild(img);
      img.decode().then(() => resolve()).catch(reject);
    });
  }
  function setupLazyButton() {
    const btn = document.getElementById("open-dialog");
    if (!btn) return;
    btn.disabled = false;
    btn.addEventListener(
      "click",
      () => {
        void openLazyDialog();
      },
      { once: true }
    );
  }
  async function openLazyDialog() {
    const t0 = performance.now();
    const phases = {};
    const manifest = manifestCache;
    if (!manifest) throw new Error("manifest missing in lazy phase");
    const dialog = ensureDialog();
    setLazyStatus("loading\u2026");
    const tLoad = performance.now();
    let bitmaps = [];
    if (loader === "multi") bitmaps = await loadLazyMulti(manifest, base);
    else if (loader === "single") bitmaps = await loadLazySingle(manifest, base);
    else if (loader === "router") bitmaps = await loadLazyRouter(manifest, base);
    phases.loadMs = performance.now() - tLoad;
    const tRender = performance.now();
    renderLazyTags(dialog);
    if (window.__BENCH_LAZY?.initScene) {
      const sceneRoot = dialog.querySelector(".scene");
      if (sceneRoot) window.__BENCH_LAZY.initScene(sceneRoot, bitmaps);
    }
    phases.renderMs = performance.now() - tRender;
    const total = performance.now() - t0;
    window.__BENCH_LAZY_BYTES = bootBytes ? diffWireBytes(collectWireBytes(), bootBytes) : collectWireBytes();
    window.__BENCH_LAZY_DONE = total;
    window.__BENCH_LAZY_PHASES = phases;
    setLazyStatus(
      `done \xB7 ${Math.round(total)}ms (load ${Math.round(phases.loadMs)} \xB7 render ${Math.round(phases.renderMs)})`
    );
    window.dispatchEvent(
      new CustomEvent("bench:lazy:done", { detail: { loader, origin, totalMs: total, phases } })
    );
  }
  function ensureDialog() {
    const existing = document.getElementById("lazy-dialog");
    if (existing) return existing;
    const dialog = document.createElement("div");
    dialog.id = "lazy-dialog";
    const bar = document.createElement("div");
    bar.className = "bar";
    const title = document.createElement("strong");
    title.textContent = "Lazy dialog";
    const sep = document.createTextNode(" \xB7 ");
    const status = document.createElement("span");
    status.id = "lazy-status";
    status.textContent = "opening";
    bar.append(title, sep, status);
    const scene = document.createElement("div");
    scene.className = "scene";
    const tags = document.createElement("div");
    tags.className = "tags";
    dialog.append(bar, scene, tags);
    document.body.appendChild(dialog);
    return dialog;
  }
  function setLazyStatus(msg) {
    const el = document.getElementById("lazy-status");
    if (el) el.textContent = msg;
  }
  function renderLazyTags(dialog) {
    const tagsRoot = dialog.querySelector(".tags");
    if (!tagsRoot) return;
    const bag = window.__BENCH_LAZY_MODULES ?? {};
    const ids = Object.keys(bag).map(Number).sort((a, b) => a - b);
    for (const id of ids) bag[id]?.render(tagsRoot);
  }
  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`script failed: ${src}`));
      document.head.appendChild(s);
    });
  }
  function injectStylesheet(href) {
    return new Promise((resolve, reject) => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      l.onload = () => resolve();
      l.onerror = () => reject(new Error(`stylesheet failed: ${href}`));
      document.head.appendChild(l);
    });
  }
  async function fetchLazyBitmap(url) {
    const r = await fetch(url, { cache: cacheMode === "cold" ? "no-store" : "default" });
    if (!r.ok) throw new Error(`image fetch failed: ${r.status} ${url}`);
    const blob = await r.blob();
    return createImageBitmap(blob);
  }
  function selectEager(manifest) {
    const modules = manifest.modules;
    const styles = manifest.styles ?? [];
    const assets = manifest.assets ?? [];
    return selectBenchEntries(scope, { modules, styles, assets });
  }
  function describeEager(eager) {
    return `${eager.modules.length} JS + ${eager.styles.length} CSS + ${eager.assets.length} PNG`;
  }
  function describeScope(value) {
    return value === "random" ? "50% deterministic random request set" : "full app request set";
  }
  function benchStart() {
    return typeof window.__BENCH_START === "number" ? window.__BENCH_START : performance.now();
  }
  function cacheUrl(rawUrl) {
    if (cacheMode !== "cold") return rawUrl;
    const url = new URL(rawUrl, location.href);
    url.searchParams.set("benchRun", runId);
    return url.href;
  }
  function phaseSummary(phases) {
    const parts = [];
    if (phases.manifestMs !== void 0) parts.push(`manifest ${Math.round(phases.manifestMs)} ms`);
    if (phases.materializeMs !== void 0)
      parts.push(`materialize ${Math.round(phases.materializeMs)} ms`);
    if (phases.jsCssMs !== void 0) parts.push(`JS/CSS ${Math.round(phases.jsCssMs)} ms`);
    if (phases.imagesMs !== void 0) parts.push(`images ${Math.round(phases.imagesMs)} ms`);
    if (phases.loadMs !== void 0) parts.push(`load ${Math.round(phases.loadMs)} ms`);
    return parts.join(" \xB7 ");
  }
  function renderEager(modules) {
    const root = document.getElementById("root");
    if (!root) throw new Error("#root missing");
    const bag = window.__BENCH_MODULES ?? {};
    const ids = modules.map((module) => module.id).filter((id) => id !== void 0);
    for (const id of ids) bag[id]?.render(root);
  }
  function setStatus(msg) {
    const el = document.getElementById("status");
    if (el) el.textContent = msg;
  }
})();
/*! Bundled license information:

ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)
*/
//# sourceMappingURL=bootloader.js.map
