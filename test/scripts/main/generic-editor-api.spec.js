describe('Generic Editor', function() {

    it('should init editor', function() {
        org.ekstep.contenteditor.config.genericeditorPlugins = [
            { "id": "org.ekstep.genericeditorheader", "ver": "1.0", "type": "plugin" }
        ];
        org.ekstep.contenteditor.config.pluginRepo = "https://s3.ap-south-1.amazonaws.com/ekstep-public-dev/content-plugins";
        org.ekstep.contenteditor.config.corePluginsPackaged = false;
        spyOn(org.ekstep.genericeditor.api, "initEditor").and.callThrough();
        //expect(org.ekstep.contenteditor.config).toEqual('');
        // org.ekstep.genericeditor.api.initEditor(org.ekstep.contenteditor.config, undefined, function(){});
        // expect(org.ekstep.genericeditor.api.initEditor).toHaveBeenCalled();
        org.ekstep.genericeditor.api.initEditor('', '');
        // expect(org.ekstep.genericeditor.api.initEditor.calls.count()).toEqual(2);
    });

    it('should return respective services', function() {
        spyOn(org.ekstep.genericeditor.api, "getService").and.callThrough();
        expect(org.ekstep.genericeditor.api.getService("popup")).toBe(org.ekstep.services.popupService);
        expect(org.ekstep.genericeditor.api.getService("content")).toBe(org.ekstep.services.contentService);
        expect(org.ekstep.genericeditor.api.getService("assessment")).toBe(org.ekstep.services.assessmentService);
        expect(org.ekstep.genericeditor.api.getService("language")).toBe(org.ekstep.services.languageService);
        expect(org.ekstep.genericeditor.api.getService("search")).toBe(org.ekstep.services.searchService);
        expect(org.ekstep.genericeditor.api.getService("meta")).toBe(org.ekstep.services.metaService);
        expect(org.ekstep.genericeditor.api.getService("asset")).toBe(org.ekstep.services.assetService);
        expect(org.ekstep.genericeditor.api.getService("telemetry")).toBe(org.ekstep.services.telemetryService);
    });

    it('should return current stage', function() {
        spyOn(org.ekstep.genericeditor.api, "getCurrentStage").and.callThrough();
        var returnValue = org.ekstep.genericeditor.api.getCurrentStage();
        expect(org.ekstep.genericeditor.api.getCurrentStage).toHaveBeenCalled();
        expect(returnValue).toBeDefined();
    });
    
});
