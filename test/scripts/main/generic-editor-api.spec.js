describe('Generic Editor', function() {

    it('should init editor', function() {
        org.ekstep.contenteditor.config.corePluginsPackaged = false;
        spyOn(org.ekstep.genericeditor.api, "initEditor").and.callThrough();
        //org.ekstep.genericeditor.api.initEditor('', '');
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
