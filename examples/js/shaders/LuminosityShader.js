/**
 * Generated from 'examples\modules\shaders\LuminosityShader.js'
 **/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.THREE = global.THREE || {})));
}(this, (function (exports) { 'use strict';

/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Luminosity
 * http://en.wikipedia.org/wiki/Luminosity
 */


exports.LuminosityShader = {

	uniforms: {

		"tDiffuse": { value: null }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",

			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"#include <common>",

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D( tDiffuse, vUv );",

			"float l = linearToRelativeLuminance( texel.rgb );",

			"gl_FragColor = vec4( l, l, l, texel.w );",

		"}"

	].join( "\n" )

};

Object.defineProperty(exports, '__esModule', { value: true });

})));
