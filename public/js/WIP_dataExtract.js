
class ExtractGeometry extends Autodesk.Viewing.Extension{

    constructor(viewer,options){
        super(viewer,options)
        console.log("called")
        this._group = null
        this.__button = null
    }

    load(){
        return true;
    }

    unload(){
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }

        return true;
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('allCadmiumExtensionToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('allCadmiumExtensionToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Button for exporting CO2 JSON configuration files
        this._button = new Autodesk.Viewing.UI.Button('co2CadmiumExtensionButton');
        this._button.onClick = (ev) => {
            //action
            
        };
        this._button.setToolTip('Export Geometry');
        this._button.addClass('co2DataExtractExtensionIcon');
        this._group.addControl(this._button);

    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('ExtractGeometry', ExtractGeometry);