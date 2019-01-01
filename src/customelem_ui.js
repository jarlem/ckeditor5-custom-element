import Plugin 				from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView 			from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { downcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import { upcastElementToElement } 	from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';
import { toWidget } 				from '@ckeditor/ckeditor5-widget/src/utils';
import {CustomElemCommand}  from './customelem_command';
import defaultIcon 			from '../theme/icons/default.svg';


export default class CustomElemUI extends Plugin {


	init() {
		const editor 		= this.editor;
		const items      	= editor.config.get(( 'CustomElement.items' ))

		
		for (let i=0; i<items.length; i++){
			const tag  		= items[i].tag;
			const text 		= this._safeGet(items[i].placeholder, tag);
			const attr 		= this._safeGet(items[i].attributes, {});
			const block		= this._safeGet(items[i].block, true);
			let   icon	 	= this._safeGet(items[i].icon, defaultIcon);


			///schema
			editor.model.schema.register(tag, {
				allowWhere: block? '$block' : '$text',
				isObject: true
			}); 			
			editor.model.schema.extend( '$text', {
				allowIn: tag
			} );
			// editor.model.schema.register(tag, {
			// 	inheritAllFrom: '$block'
			// });



			//---conversion
			//editor.conversion.elementToElement({ model: tag, view: tag });
			editor.conversion.for( 'editingDowncast' ).add(
				downcastElementToElement( {
					model: tag,
					view: 
						block? ( modelItem, viewWriter ) => {
									const widgetElement = viewWriter.createContainerElement( tag );
									return toWidget( widgetElement, viewWriter );
								}
						: tag
				} )
			);
			editor.conversion.for( 'dataDowncast' ).add(
				downcastElementToElement( {
					model: tag,
					view: tag
				} )
			);	
			editor.conversion.for( 'upcast' ).add(
				upcastElementToElement( {
					view: tag,
					model: tag
				} )
			);



			//---command
			const com =  'custom-element-'+tag;
			editor.commands.add( com, new CustomElemCommand( editor, tag, text, attr  ) );

			//---toolbar
			this._createToolbarButton(com, icon);
			
		}		
		
	}

	
	_createToolbarButton(name, tbicon) {
		const editor = this.editor;

		editor.ui.componentFactory.add( name, locale => {
			const button = new ButtonView( locale );
			const command = editor.commands.get( name );


			button.isEnabled = true;
			button.isOn      = true;
			button.label     = name;
			button.tooltip   = true;
			button.icon		 = tbicon;

			button.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );
			this.listenTo( button, 'execute', () => editor.execute( name ) );

			return button;
		} );
	}


	_safeGet(input, safeDefault){
		if( typeof input !== 'undefined' &&  (input || input===false || input===0) ){
			return input;
		}
		else{
			return safeDefault;
		}
	}
}

