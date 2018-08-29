/**
 * Generated from 'examples\modules\AnimationClipCreator.js'
 **/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('../../build/three.module.js')) :
	typeof define === 'function' && define.amd ? define(['exports', '../../build/three.module.js'], factory) :
	(factory((global.THREE = global.THREE || {}),global.THREE));
}(this, (function (exports,THREE) { 'use strict';

/**
 *
 * Creator of typical test AnimationClips / KeyframeTracks
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 */



exports.AnimationClipCreator = function () {};

exports.AnimationClipCreator.CreateRotationAnimation = function ( period, axis ) {

	var times = [ 0, period ], values = [ 0, 360 ];

	axis = axis || 'x';
	var trackName = '.rotation[' + axis + ']';

	var track = new THREE.NumberKeyframeTrack( trackName, times, values );

	return new THREE.AnimationClip( null, period, [ track ] );

};

exports.AnimationClipCreator.CreateScaleAxisAnimation = function ( period, axis ) {

	var times = [ 0, period ], values = [ 0, 1 ];

	axis = axis || 'x';
	var trackName = '.scale[' + axis + ']';

	var track = new THREE.NumberKeyframeTrack( trackName, times, values );

	return new THREE.AnimationClip( null, period, [ track ] );

};

exports.AnimationClipCreator.CreateShakeAnimation = function ( duration, shakeScale ) {

	var times = [], values = [], tmp = new THREE.Vector3();

	for ( var i = 0; i < duration * 10; i ++ ) {

		times.push( i / 10 );

		tmp.set( Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0 ).
			multiply( shakeScale ).
			toArray( values, values.length );

	}

	var trackName = '.position';

	var track = new THREE.VectorKeyframeTrack( trackName, times, values );

	return new THREE.AnimationClip( null, duration, [ track ] );

};


exports.AnimationClipCreator.CreatePulsationAnimation = function ( duration, pulseScale ) {

	var times = [], values = [], tmp = new THREE.Vector3();

	for ( var i = 0; i < duration * 10; i ++ ) {

		times.push( i / 10 );

		var scaleFactor = Math.random() * pulseScale;
		tmp.set( scaleFactor, scaleFactor, scaleFactor ).
			toArray( values, values.length );

	}

	var trackName = '.scale';

	var track = new THREE.VectorKeyframeTrack( trackName, times, values );

	return new THREE.AnimationClip( null, duration, [ track ] );

};


exports.AnimationClipCreator.CreateVisibilityAnimation = function ( duration ) {

	var times = [ 0, duration / 2, duration ], values = [ true, false, true ];

	var trackName = '.visible';

	var track = new THREE.BooleanKeyframeTrack( trackName, times, values );

	return new THREE.AnimationClip( null, duration, [ track ] );

};


exports.AnimationClipCreator.CreateMaterialColorAnimation = function ( duration, colors ) {

	var times = [], values = [],
		timeStep = duration / colors.length;

	for ( var i = 0; i <= colors.length; i ++ ) {

		times.push( i * timeStep );
		values.push( colors[ i % colors.length ] );

	}

	var trackName = '.material[0].color';

	var track = new THREE.ColorKeyframeTrack( trackName, times, values );

	return new THREE.AnimationClip( null, duration, [ track ] );

};

Object.defineProperty(exports, '__esModule', { value: true });

})));
