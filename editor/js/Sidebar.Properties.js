/**
 * @author mrdoob / http://mrdoob.com/
 */

import { UITabbedPanel } from './libs/ui/index.js';

import { SidebarObject } from './Sidebar.Object.js';
import { SidebarGeometry } from './Sidebar.Geometry.js';
import { SidebarMaterial } from './Sidebar.Material.js';

var SidebarProperties = function ( editor ) {

	var strings = editor.strings;

	var container = new UITabbedPanel();
	container.setId( 'properties' );

	container.addTab( 'object', strings.getKey( 'sidebar/properties/object' ), new SidebarObject( editor ) );
	container.addTab( 'geometry', strings.getKey( 'sidebar/properties/geometry' ), new SidebarGeometry( editor ) );
	container.addTab( 'material', strings.getKey( 'sidebar/properties/material' ), new SidebarMaterial( editor ) );
	container.select( 'object' );

	return container;

};

export { SidebarProperties };
