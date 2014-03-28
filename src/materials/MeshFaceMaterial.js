/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.MeshFaceMaterial = function ( materials ) {

	this.materials = materials instanceof Array ? materials : [];

};

THREE.MeshFaceMaterial.prototype.clone = function () {

	var material = new THREE.MeshFaceMaterial();

	for ( var i = 0; i < this.materials.length; i ++ ) {

		material.materials.push( this.materials[ i ].clone() );

	}

	return material;

};

THREE.MeshFaceMaterial.prototype.serialize = function () {

  var data = THREE.Material.prototype.serialize.call(this);
  data.type = 'MeshFaceMaterial';
  data.materials = [];

  for ( var i = 0, l = this.materials.length; i < l; i ++ ) {

    data.materials.push( this.materials[ i ].serialize() );

  }

  return data;

};

