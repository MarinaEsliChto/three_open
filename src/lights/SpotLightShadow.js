/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.SpotLightShadow = function () {
	var fov = 50;
	this.cameraParams = new THREE.Vector3( fov, 10.5, 1000 );
	THREE.LightShadow.call( this, new THREE.PerspectiveCamera( this.cameraParams.x, 1, this.cameraParams.y, this.cameraParams.z ) );

};

THREE.SpotLightShadow.prototype = Object.create( THREE.LightShadow.prototype );
THREE.SpotLightShadow.prototype.constructor = THREE.SpotLightShadow;

THREE.SpotLightShadow.prototype.update = function ( light ) {

	var fov = THREE.Math.RAD2DEG * 2 * light.angle;
	var aspect = this.mapSize.width / this.mapSize.height;
	var far = light.distance || 500;

	var camera = this.camera;

	if ( fov !== camera.fov || aspect !== camera.aspect || far !== camera.far ) {

		this.cameraParams.x = fov * THREE.Math.DEG2RAD;
		this.cameraParams.y = light.shadow.camera.near;
		this.cameraParams.z = far;

		var camera = this.camera;

		camera.fov = fov;
		camera.aspect = aspect;
		camera.far = far;
		camera.updateProjectionMatrix();

	}

};
