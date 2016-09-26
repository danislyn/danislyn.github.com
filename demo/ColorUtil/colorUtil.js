var ColorUtil = {
    parseColorHex: function (hex) {
        if (typeof hex === 'number') {
            // 转成16进制字符串
            hex = parseInt(hex, 10).toString(16);
        }
        if (hex.indexOf('#') === 0) {
            hex = hex.substr(1);
        }

        if (/^[0-9A-F]{6}$/i.test(hex)) {
            return {
                r: parseInt('0x' + hex.substr(0, 2), 16),
                g: parseInt('0x' + hex.substr(2, 2), 16),
                b: parseInt('0x' + hex.substr(4, 2), 16)
            };
        }
        if (/^[0-9A-F]{3}$/i.test(hex)) {
            return {
                r: parseInt('0x' + hex.substr(0, 1), 16),
                g: parseInt('0x' + hex.substr(1, 1), 16),
                b: parseInt('0x' + hex.substr(2, 1), 16)
            };
        }
        return null;
    },

    parseRgbArguments: function () {
        var r;
        var g;
        var b;

        if (arguments.length === 1) {
            r = arguments[0].r;
            g = arguments[0].g;
            b = arguments[0].b;
        }
        else {
            r = arguments[0];
            g = arguments[1];
            b = arguments[2];
        }

        return {
            r: r,
            g: g,
            b: b
        };
    },

    parseHsvArguments: function () {
        var h;
        var s;
        var v;

        if (arguments.length === 1) {
            h = arguments[0].h;
            s = arguments[0].s;
            v = arguments[0].v;
        }
        else {
            h = arguments[0];
            s = arguments[1];
            v = arguments[2];
        }

        return {
            h: h,
            s: s,
            v: v
        };
    },

    rgb2hex: function () {
        var hex = function (c) {
            // 转成16进制字符串
            c = parseInt(c, 10).toString(16);
            return c.length < 2 ? '0' + c : c;
        };

        var rgb = this.parseRgbArguments.apply(null, arguments);
        return (hex(rgb.r) + hex(rgb.g) + hex(rgb.b)).toUpperCase();
    },

    rgb2hsv: function () {
        // 读取 rgb
        var rgb = this.parseRgbArguments.apply(null, arguments);
        var r = rgb.r;
        var g = rgb.g;
        var b = rgb.b;

        // rgb 分量的最大最小值
        var max;
        var min;

        if (r > g) {
            max = Math.max(r, b);
            min = Math.min(g, b);
        }
        else {
            max = Math.max(g, b);
            min = Math.min(r, b);
        }

        var delta = max - min;

        // hsv 分量
        var v = max;
        var s = (v === 0.0) ? 0.0 : delta / v;
        var h;

        if (s === 0.0) {
            h = 0.0;
        }
        else {
            if (r === max) {
                h = 60.0 * (g - b) / delta;
            }
            else if (g === max) {
                h = 120 + 60.0 * (b - r) / delta;
            }
            else {
                h = 240 + 60.0 * (r - g) / delta;
            }

            // 修正色调 ( 0~360 度)
            if (h < 0.0) {
                h += 360.0;
            }
            if (h > 360.0) {
                h -= 360.0;
            }
        }

        h = Math.round(h);
        s = Math.round(s * 255.0);
        v = Math.round(v);

        // avoid the ambiguity of returning different values for the same color
        if (h === 360) {
            h = 0;
        }
        // 注: s,v 分量值域为 0~255
        return {
            h: h,
            s: s,
            v: v
        };
    },

    hsv2rgb: function () {
        // 读取 hsv
        var hsv = this.parseHsvArguments.apply(null, arguments);
        var h = hsv.h;
        var s = hsv.s;
        var v = hsv.v;

        // rgb 分量
        var r;
        var g;
        var b;

        // 特殊处理
        if (s === 0) {
            r = v;
            g = v;
            b = v;
        }
        else {
            // 原始亮度
            var value = v;
            // s,v 分量归一化
            var s = s / 255.0;
            var v = v  / 255.0;

            // 修正后的 h 分量
            var hFix = (h === 360) ? 0 : h / 60;
            var hIndex = Math.floor(hFix);
            var hLeft = hFix - hIndex;

            // v 分量转化的中间变量
            var vs = v * s;
            var vLeft  = value - value * s;

            switch (hIndex) {
                case 0:
                    var vTemp = v - vs * (1 - hLeft);
                    r = Math.round(value);
                    g = Math.round(vTemp * 255.0);
                    b = Math.round(vLeft);
                    break;

                case 1:
                    var vTemp = v - vs * hLeft;
                    r = Math.round(vTemp * 255.0);
                    g = Math.round(value);
                    b = Math.round(vLeft);
                    break;

                case 2:
                    var vTemp  = v - vs * (1 - hLeft);
                    r = Math.round(vLeft);
                    g = Math.round(value);
                    b = Math.round(vTemp * 255.0);
                    break;

                case 3:
                    var vTemp = v - vs * hLeft;
                    r = Math.round(vLeft);
                    g = Math.round(vTemp * 255.0);
                    b = Math.round(value);
                    break;

                case 4:
                    var vTemp = v - vs * (1 - hLeft);
                    r = Math.round(vTemp * 255.0);
                    g = Math.round(vLeft);
                    b = Math.round(value);
                    break;

                case 5:
                    var vTemp = v - vs * hLeft;
                    r = Math.round(value);
                    g = Math.round(vLeft);
                    b = Math.round(vTemp * 255.0);
                    break;
            }
        }

        return {
            r: r,
            g: g,
            b: b
        };
    }
}
