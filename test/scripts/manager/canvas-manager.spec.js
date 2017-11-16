'use strict';

describe('canvas manager', function() {

    beforeAll(function(done) {
        org.ekstep.contenteditor.canvasManager.initialize({ loadNgModules: function() {}, scope: { addToSidebar: function() {} } });
        spyOn(org.ekstep.contenteditor.canvasManager, 'register').and.callThrough();
        spyOn(org.ekstep.contenteditor.canvasManager, 'load').and.callThrough();
        spyOn(org.ekstep.contenteditor.canvasManager, 'loadNgModules').and.returnValue({ then: function(cb1, cb2) {} });
        done();
    });

    it('should register the container', function() {
        var container = {
            "id": "tree",
            "templateURL": org.ekstep.contenteditor.config.pluginRepo + "/org.ekstep.genericeditorpreview-1.0/editor/previewApp.html",
            "controllerURL": org.ekstep.contenteditor.config.pluginRepo + "/org.ekstep.genericeditorpreview-1.0/editor/contentPreview.js"
        }
        var collectionManifest = org.ekstep.contenteditor.config.pluginRepo + "/org.ekstep.genericeditorpreview-1.0/manifest.json";
        org.ekstep.contenteditor.canvasManager.register(container, collectionManifest);
        expect(org.ekstep.contenteditor.canvasManager.register.calls.count()).toEqual(1);
        org.ekstep.contenteditor.canvasManager.register({ "id": "tree" }, collectionManifest);
        expect(org.ekstep.contenteditor.canvasManager.load.calls.count()).toEqual(2);
    });
});