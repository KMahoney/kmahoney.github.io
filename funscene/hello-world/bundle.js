/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].e;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			e: {},
/******/ 			i: moduleId,
/******/ 			l: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.e, module, module.e, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.e;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var matrix_1 = __webpack_require__(1);
	/**
	 * A mutable set of properties for objects in a scene.
	 */
	var Properties = (function () {
	    function Properties() {
	        this.matrix = new matrix_1.Matrix();
	        this.blend = new Float32Array([1, 1, 1, 1]);
	    }
	    Properties.prototype.reset = function () {
	        this.matrix.setIdentity();
	        var b = this.blend;
	        b[0] = b[1] = b[2] = b[3] = 1;
	    };
	    return Properties;
	}());
	exports.Properties = Properties;
	exports.interpolators = {
	    linear: function (t, a, b) { return (b - a) * t + a; },
	    cubic: function (t, a, b) { return (b - a) * Math.pow(t, 3) + a; },
	    inverseCubic: function (t, a, b) { return (b - a) * (1.0 - Math.pow(1.0 - t, 3)) + a; },
	};
	exports.noOp = {
	    length: null,
	    updateProperties: function (t, prop) { }
	};
	/**
	 * Translate a scene object by (x, y)
	 */
	function translate(x, y) {
	    return {
	        length: null,
	        updateProperties: function (t, prop) {
	            prop.matrix.translate(x, y, 0);
	        }
	    };
	}
	exports.translate = translate;
	/**
	 * Interpolate a scene object's alpha over `length` ms.
	 */
	function fade(interpolator, length, a, b) {
	    return {
	        length: length,
	        updateProperties: function (t, prop) {
	            prop.blend[3] = interpolator(t / length, a, b);
	        }
	    };
	}
	exports.fade = fade;
	/**
	 * Interpolate a scene object's blend modifier. `a` and `b` should be
	 * an array of 4 numbers from 0 to 1.
	 */
	function blend(interpolator, length, a, b) {
	    return {
	        length: length,
	        updateProperties: function (t, prop) {
	            var t2 = t / length;
	            prop.blend[0] = interpolator(t2, a[0], b[0]);
	            prop.blend[1] = interpolator(t2, a[1], b[1]);
	            prop.blend[2] = interpolator(t2, a[2], b[2]);
	            prop.blend[3] = interpolator(t2, a[3], b[3]);
	        }
	    };
	}
	exports.blend = blend;
	/**
	 * Do nothing for `length` ms.
	 */
	function wait(length) {
	    return {
	        length: length,
	        updateProperties: function (t, prop) { }
	    };
	}
	exports.wait = wait;
	/**
	 * Interpolate an object from (x1, y1) to (x2, y2) over `length` ms.
	 */
	function move(interpolator, length, x1, y1, x2, y2) {
	    return {
	        length: length,
	        updateProperties: function (t, prop) {
	            var t2 = t / length;
	            var x = interpolator(t2, x1, x2);
	            var y = interpolator(t2, y1, y2);
	            prop.matrix.translate(x, y, 0);
	        }
	    };
	}
	exports.move = move;
	/**
	 * Rotate an object over `length` ms. 1.0 = 360deg.
	 */
	function rotate(interpolator, length, from, to) {
	    return {
	        length: length,
	        updateProperties: function (t, prop) {
	            var rad = interpolator(t / length, from, to) * Math.PI * 2;
	            prop.matrix.rotateZ(rad);
	        }
	    };
	}
	exports.rotate = rotate;
	/**
	 * Combine two or more transformers in to one. The transforms are
	 * applied in the declared order to the scene object.
	 */
	function combine(transformers) {
	    return {
	        length: Math.max.apply(undefined, transformers.map(function (t) { return t.length; })),
	        updateProperties: function (t, prop) {
	            transformers.forEach(function (i) { i.updateProperties(t, prop); });
	        }
	    };
	}
	exports.combine = combine;
	/**
	 * Modify the length of a transform to `length` ms.
	 */
	function stretch(length, transform) {
	    if (transform.length === Infinity || transform.length === null || transform.length === 0) {
	        throw "Cannot stretch transform of unknown, zero or infinite length";
	    }
	    return {
	        length: length,
	        updateProperties: function (t, prop) {
	            var t2 = Math.min(1, t / length) * transform.length;
	            transform.updateProperties(t2, prop);
	        }
	    };
	}
	exports.stretch = stretch;
	/**
	 * Apply a series of transformers in sequence in the declared order.
	 */
	function sequence(seq) {
	    var n = seq.length;
	    return {
	        length: seq.map(function (s) { return s.length; }).reduce(function (a, b) { return a + b; }, 0),
	        updateProperties: function (t, prop) {
	            var acc = 0;
	            for (var i = 0; i < n; i++) {
	                var len = seq[i].length;
	                if (t < acc + len) {
	                    seq[i].updateProperties(t - acc, prop);
	                    return;
	                }
	                acc += len;
	            }
	        }
	    };
	}
	exports.sequence = sequence;
	/**
	 * Apply a series of transformers in sequence in the declared order
	 * and repeat infinitely.
	 */
	function repeat(seq) {
	    var transform_seq = sequence(seq);
	    return {
	        length: Infinity,
	        updateProperties: function (t, prop) {
	            transform_seq.updateProperties(t % transform_seq.length, prop);
	        }
	    };
	}
	exports.repeat = repeat;


/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * Utility class for mutating a matrix in-place.
	 */
	var Matrix = (function () {
	    function Matrix() {
	        this.array = new Float32Array(16);
	        this.setIdentity();
	    }
	    Matrix.prototype.setIdentity = function () {
	        var m = this.array;
	        m[0] = 1;
	        m[1] = 0;
	        m[2] = 0;
	        m[3] = 0;
	        m[4] = 0;
	        m[5] = 1;
	        m[6] = 0;
	        m[7] = 0;
	        m[8] = 0;
	        m[9] = 0;
	        m[10] = 1;
	        m[11] = 0;
	        m[12] = 0;
	        m[13] = 0;
	        m[14] = 0;
	        m[15] = 1;
	    };
	    Matrix.prototype.translate = function (x, y, z) {
	        var m = this.array;
	        m[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
	        m[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
	        m[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
	        m[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
	    };
	    Matrix.prototype.rotateZ = function (rad) {
	        var m = this.array;
	        var s = Math.sin(rad);
	        var c = Math.cos(rad);
	        var m0 = m[0];
	        var m1 = m[1];
	        var m2 = m[2];
	        var m3 = m[3];
	        var m4 = m[4];
	        var m5 = m[5];
	        var m6 = m[6];
	        var m7 = m[7];
	        m[0] = m0 * c + m4 * s;
	        m[1] = m1 * c + m5 * s;
	        m[2] = m2 * c + m6 * s;
	        m[3] = m3 * c + m7 * s;
	        m[4] = m4 * c - m0 * s;
	        m[5] = m5 * c - m1 * s;
	        m[6] = m6 * c - m2 * s;
	        m[7] = m7 * c - m3 * s;
	    };
	    Matrix.prototype.setOrtho = function (left, right, bottom, top, near, far) {
	        var m = this.array;
	        var leftright = 1 / (left - right);
	        var bottomtop = 1 / (bottom - top);
	        var nearfar = 1 / (near - far);
	        m[0] = -2 * leftright;
	        m[1] = 0;
	        m[2] = 0;
	        m[3] = 0;
	        m[4] = 0;
	        m[5] = -2 * bottomtop;
	        m[6] = 0;
	        m[7] = 0;
	        m[8] = 0;
	        m[9] = 0;
	        m[10] = 2 * nearfar;
	        m[11] = 0;
	        m[12] = (left + right) * leftright;
	        m[13] = (top + bottom) * bottomtop;
	        m[14] = (far + near) * nearfar;
	        m[15] = 1;
	    };
	    return Matrix;
	}());
	exports.Matrix = Matrix;
	;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	function nearest_pow2(x) {
	    var p = 1;
	    while (p < x) {
	        p *= 2;
	    }
	    ;
	    return p;
	}
	/**
	 * A WebGL Texture
	 */
	var Texture = (function () {
	    function Texture(gl, width, height) {
	        this.gl = gl;
	        this.width = width;
	        this.height = height;
	        this.texture_id = gl.createTexture();
	        this.texture_width = nearest_pow2(width);
	        this.texture_height = nearest_pow2(height);
	        this.texture_scale_x = this.width / this.texture_width;
	        this.texture_scale_y = this.height / this.texture_height;
	    }
	    /**
	     * Draw to the texture using a canvas.
	     */
	    Texture.prototype.make = function (callback) {
	        var gl = this.gl;
	        var canvas = document.createElement('canvas');
	        canvas.width = this.texture_width;
	        canvas.height = this.texture_height;
	        var context = canvas.getContext('2d');
	        callback(context);
	        gl.bindTexture(gl.TEXTURE_2D, this.texture_id);
	        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	        gl.generateMipmap(gl.TEXTURE_2D);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	    };
	    return Texture;
	}());
	exports.Texture = Texture;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var context_1 = __webpack_require__(5);
	exports.Context = context_1.Context;
	var sprite_1 = __webpack_require__(7);
	exports.Sprite = sprite_1.Sprite;
	var texture_1 = __webpack_require__(2);
	exports.Texture = texture_1.Texture;
	var scene_1 = __webpack_require__(6);
	exports.Scene = scene_1.Scene;
	var matrix_1 = __webpack_require__(1);
	exports.Matrix = matrix_1.Matrix;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var funscene_1 = __webpack_require__(3);
	var transformers_1 = __webpack_require__(0);
	var canvas = document.getElementById("stage");
	var context = new funscene_1.Context(canvas);
	context.fullscreen();
	var hello_world = context.createTexture(250, 50);
	hello_world.make(function (context) {
	    context.fillStyle = "rgb(200,200,200)";
	    context.font = "40px sans";
	    context.fillText("Hello World!", 0, 50);
	});
	var sprites = [
	    new funscene_1.Sprite(hello_world, transformers_1.sequence([
	        // fade in and scroll from top of the screen
	        transformers_1.combine([
	            transformers_1.fade(transformers_1.interpolators.linear, 3000, 0, 1),
	            transformers_1.move(transformers_1.interpolators.inverseCubic, 3000, 0, 0, 0, 300)
	        ]),
	        // move left and right, repeat
	        transformers_1.repeat([
	            transformers_1.move(transformers_1.interpolators.inverseCubic, 3000, 0, 300, 300, 300),
	            transformers_1.move(transformers_1.interpolators.inverseCubic, 3000, 300, 300, 0, 300)
	        ])
	    ]))
	];
	var scene = new funscene_1.Scene(transformers_1.noOp, sprites);
	context.runAnimation(scene.createAnimation());


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var texture_1 = __webpack_require__(2);
	;
	;
	function initProgram(gl) {
	    var frag = "varying highp vec2 texture_coord;\n" +
	        "uniform sampler2D sampler;\n" +
	        "uniform mediump vec4 blend;\n" +
	        "void main(void) {\n" +
	        "  gl_FragColor = texture2D(sampler, texture_coord) * blend;\n" +
	        "}";
	    var frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
	    gl.shaderSource(frag_shader, frag);
	    gl.compileShader(frag_shader);
	    var vert = "attribute vec2 vertex;\n" +
	        "varying highp vec2 texture_coord;\n" +
	        "uniform mat4 model;\n" +
	        "uniform mat4 projection;\n" +
	        "uniform highp vec2 size;\n" +
	        "uniform highp vec2 texture_scale;\n" +
	        "void main(void) {\n" +
	        "  gl_Position = projection * model * vec4(vertex * size, 0, 1);\n" +
	        "  texture_coord = vertex * texture_scale;\n" +
	        "}";
	    var vert_shader = gl.createShader(gl.VERTEX_SHADER);
	    gl.shaderSource(vert_shader, vert);
	    gl.compileShader(vert_shader);
	    var program = gl.createProgram();
	    gl.attachShader(program, vert_shader);
	    gl.attachShader(program, frag_shader);
	    gl.linkProgram(program);
	    gl.useProgram(program);
	    return {
	        vertex: gl.getAttribLocation(program, "vertex"),
	        model: gl.getUniformLocation(program, "model"),
	        projection: gl.getUniformLocation(program, "projection"),
	        size: gl.getUniformLocation(program, "size"),
	        texture_scale: gl.getUniformLocation(program, "texture_scale"),
	        sampler: gl.getUniformLocation(program, "sampler"),
	        blend: gl.getUniformLocation(program, "blend"),
	    };
	}
	function throttledResizeHandler(callback) {
	    var resize_throttled = false;
	    function resize() {
	        if (resize_throttled) {
	            return;
	        }
	        resize_throttled = true;
	        requestAnimationFrame(function () {
	            callback();
	            resize_throttled = false;
	        });
	    }
	    window.addEventListener("resize", resize);
	}
	function initGL(gl, program) {
	    gl.disable(gl.CULL_FACE);
	    gl.disable(gl.DEPTH_TEST);
	    gl.enable(gl.BLEND);
	    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	    gl.clearColor(0.0, 0.0, 0.0, 1.0);
	    // We only ever use a rectangle for sprites. This is used for
	    // vertex position and texture coordiantes, which are scaled to
	    // size by the program.size and program.texture_scale uniforms.
	    gl.enableVertexAttribArray(program.vertex);
	    var vertex_buffer = gl.createBuffer();
	    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW);
	    gl.vertexAttribPointer(program.vertex, 2, gl.FLOAT, false, 0, 0);
	    // We only use one texture at a time, so only use slot 0
	    gl.activeTexture(gl.TEXTURE0);
	    gl.uniform1i(program.sampler, 0);
	}
	/**
	 * A wrapper around the the WebGL context.
	 *
	 * When created, initialises WebGL and binds a shader program
	 * specialised for displaying 2d sprites.
	 *
	 * A Context can run animations that conform to the `DrawCallback`
	 * interface, such as Scene animations.
	 */
	var Context = (function () {
	    function Context(canvas) {
	        this.canvas = canvas;
	        this.width = canvas.width;
	        this.height = canvas.height;
	        this.gl = canvas.getContext("experimental-webgl");
	        this.program = initProgram(this.gl);
	        initGL(this.gl, this.program);
	        this.raf_id = null;
	    }
	    /**
	     * Create a new WebGL texture with the specified width and height (in pixels).
	     */
	    Context.prototype.createTexture = function (width, height) {
	        return new texture_1.Texture(this.gl, width, height);
	    };
	    /**
	     * Bind a texture to the current context.
	     */
	    Context.prototype.bindTexture = function (texture) {
	        if (texture === this.bound_texture) {
	            return;
	        }
	        ;
	        this.bound_texture = texture;
	        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture_id);
	    };
	    /**
	     * Resizes the WebGL canvas to full screen. Automatically resizes
	     * when the browser window resize and then emits a 'contextResize'
	     * event on the window.
	     */
	    Context.prototype.fullscreen = function () {
	        throttledResizeHandler(this.resize.bind(this));
	        this.resize();
	    };
	    Context.prototype.resize = function () {
	        this.width = window.innerWidth;
	        this.height = window.innerHeight;
	        this.canvas.width = this.width;
	        this.canvas.height = this.height;
	        this.gl.viewport(0, 0, this.width, this.height);
	        window.dispatchEvent(new Event("contextResize"));
	    };
	    /**
	     * Start an animation loop. Stops when the draw callback returns
	     * false or `stopAnimation` is called.
	     */
	    Context.prototype.runAnimation = function (draw) {
	        this.stopAnimation();
	        // I'm not sure if .bind allocates, and we wouldn't want to do
	        // that every frame. To be safe close over the 'this' pointer.
	        var context = this;
	        var gl = this.gl;
	        function loop(t) {
	            var cont = draw(context, t);
	            gl.finish();
	            if (cont) {
	                context.raf_id = requestAnimationFrame(loop);
	            }
	            ;
	        }
	        this.raf_id = requestAnimationFrame(loop);
	    };
	    /**
	     * Stop a currently active animation loop.
	     */
	    Context.prototype.stopAnimation = function () {
	        if (this.raf_id !== null) {
	            cancelAnimationFrame(this.raf_id);
	            this.raf_id = null;
	        }
	    };
	    return Context;
	}());
	exports.Context = Context;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var transformers_1 = __webpack_require__(0);
	/**
	 * A scene consists of a world transformation and an array of sprites.
	 */
	var Scene = (function () {
	    function Scene(world_transform, sprites) {
	        this.world_transform = world_transform;
	        this.sprites = sprites;
	    }
	    /**
	     * Create an animation callback for use with the current context.
	     */
	    Scene.prototype.createAnimation = function () {
	        var start = performance.now();
	        // Pre-allocate sprite properties. These will be mutated in
	        // place to avoid allocations.
	        var properties = new transformers_1.Properties();
	        var world_properties = new transformers_1.Properties();
	        var world_transform = this.world_transform;
	        var sprites = this.sprites;
	        return function (context, t) {
	            var gl = context.gl;
	            var program = context.program;
	            var incomplete = false;
	            gl.clear(gl.COLOR_BUFFER_BIT);
	            world_properties.matrix.setOrtho(0, context.width, context.height, 0, 0, 1);
	            world_transform.updateProperties(t - start, world_properties);
	            incomplete = incomplete || (t < world_transform.length);
	            gl.uniformMatrix4fv(program.projection, false, world_properties.matrix.array);
	            // We currently do a series of WebGL calls for each
	            // sprite. This could be sped up considerably by using
	            // fewer draw calls with the instance rendering extension.
	            sprites.forEach(function (sprite) {
	                var texture = sprite.texture;
	                // mutate model and blend in place
	                sprite.updateProperties(t - start, properties);
	                incomplete = incomplete || (t < sprite.length);
	                // send the updated model and blend to webgl
	                gl.uniform4fv(program.blend, properties.blend);
	                gl.uniformMatrix4fv(program.model, false, properties.matrix.array);
	                // scale the vertex position and texture coordinates
	                gl.uniform2f(program.size, texture.width, texture.height);
	                gl.uniform2f(program.texture_scale, texture.texture_scale_x, texture.texture_scale_y);
	                context.bindTexture(texture);
	                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	            });
	            return incomplete;
	        };
	    };
	    return Scene;
	}());
	exports.Scene = Scene;


/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * An animated object in a scene, consisting of a texture and a tranformer.
	 */
	var Sprite = (function () {
	    function Sprite(texture, transform) {
	        this.texture = texture;
	        this.transform = transform;
	    }
	    Sprite.prototype.updateProperties = function (t, properties) {
	        properties.reset();
	        this.transform.updateProperties(t, properties);
	    };
	    Object.defineProperty(Sprite.prototype, "length", {
	        get: function () {
	            return this.transform.length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return Sprite;
	}());
	exports.Sprite = Sprite;
	;


/***/ }
/******/ ]);