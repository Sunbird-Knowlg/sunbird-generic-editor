'use strict';

describe('container manager', function() {

     beforeAll(function(done) {
        org.ekstep.contenteditor.containerManager.initialize({ loadNgModules: function() {}, scope: { addToSidebar: function() {} } });
        spyOn(org.ekstep.contenteditor.containerManager, 'register').and.callThrough();
        spyOn(org.ekstep.contenteditor.containerManager, 'load').and.callThrough();
        spyOn(org.ekstep.contenteditor.containerManager, 'loadNgModules').and.returnValue({ then: function(cb1, cb2) {} });
        done();
    });

    it('should register the container', function() {
        var container = {
            "id": "core_editor_area",
            "templateURL": org.ekstep.contenteditor.config.pluginRepo + "/org.ekstep.genericeditor-1.0/editor/genericeditor.html",
            "controllerURL": org.ekstep.contenteditor.config.pluginRepo + "/org.ekstep.genericeditor-1.0/editor/genericeditorApp.js"
        }
        var genericeditorManifest = org.ekstep.contenteditor.config.pluginRepo + "/org.ekstep.genericeditor-1.0/manifest.json";
        org.ekstep.contenteditor.containerManager.register(container, genericeditorManifest);
        expect(org.ekstep.contenteditor.containerManager.register.calls.count()).toEqual(1);
        org.ekstep.contenteditor.containerManager.register({ "id": "core_editor_area" }, genericeditorManifest);
        expect(org.ekstep.contenteditor.containerManager.load.calls.count()).toEqual(2);
    });

});
