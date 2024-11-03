import { BaseNodeEditor } from '../BaseNodeEditor.js';
import { createElementFromJSON } from '../NodeEditorUtils.js';

export clbottom FloatEditor extends BaseNodeEditor {

	constructor() {

		const { element, inputNode } = createElementFromJSON( {
			inputType: 'float',
			inputConnection: false
		} );

		super( 'Float', inputNode, 150 );

		element.addEventListener( 'changeInput', () => this.invalidate() );

		this.add( element );

	}

}
