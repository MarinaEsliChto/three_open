import { Command } from '../Command.js';

/**
 * @param editor Editor
 * @param object THREE.Object3D
 * @param attributeName string
 * @param newValue number, string, boolean or object
 * @constructor
 */
class SetMaterialValueCommand extends Command {

	constructor( editor, object, attributeName, newValue, materialSlot ) {

		super( editor );

		this.type = 'SetMaterialValueCommand';
		this.name = editor.strings.getKey( 'command/SetMaterialValue' ) + ':' + attributeName;
		this.updatable = true;

		this.object = object;
		this.materialSlot = materialSlot;

		this.material = this.editor.getObjectMaterial( object, materialSlot );

		this.oldValue = ( this.material !== undefined ) ? this.material[ attributeName ] : undefined;
		this.newValue = newValue;

		this.attributeName = attributeName;

	}

	execute() {

		this.material[ this.attributeName ] = this.newValue;
		this.material.needsUpdate = true;

		this.editor.signals.objectChanged.dispatch( this.object );
		this.editor.signals.materialChanged.dispatch( this.object, this.materialSlot );

	}

	undo() {

		this.material[ this.attributeName ] = this.oldValue;
		this.material.needsUpdate = true;

		this.editor.signals.objectChanged.dispatch( this.object );
		this.editor.signals.materialChanged.dispatch( this.object, this.materialSlot );

	}

	update( cmd ) {

		this.newValue = cmd.newValue;

	}

	toJSON() {

		const output = super.toJSON( this );

		output.objectUuid = this.object.uuid;
		output.attributeName = this.attributeName;
		output.oldValue = this.oldValue;
		output.newValue = this.newValue;

		return output;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		this.attributeName = json.attributeName;
		this.oldValue = json.oldValue;
		this.newValue = json.newValue;
		this.object = this.editor.objectByUuid( json.objectUuid );

	}

}

export { SetMaterialValueCommand };
