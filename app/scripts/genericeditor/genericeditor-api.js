window.org.ekstep.genericeditor.api = _.assign(org.ekstep.contenteditor.api, {
    initEditor: function(config, cb) {
        var startTime = Date.now();   
        var gcPlugins = [
            { "id": "org.ekstep.genericeditorpreview", "ver": "1.0", "type": "plugin" },        
            { "id": "org.ekstep.genericeditorsidebar", "ver": "1.0", "type": "plugin" }];
        gcPlugins = _.concat(gcPlugins, ecEditor.getConfig('genericeditorPlugins'));     
        org.ekstep.pluginframework.pluginManager.loadAllPlugins(gcPlugins, undefined, function () {
            org.ekstep.services.telemetryService.initialize({
                uid: ecEditor.getContext('uid'),
                sid: ecEditor.getContext('sid'),
                content_id: ecEditor.getContext('contentId'),
                etags: ecEditor.getContext('etags') || {},
                channel: ecEditor.getContext('channel')  || "",
                pdata: ecEditor.getContext('pdata') || {}
            }, ecEditor.getConfig('dispatcher'));
            org.ekstep.services.telemetryService.startEvent(true).append("loadtimes", { plugins: (Date.now() - startTime) });        
            if (cb) cb();    
        });        
    },
    /**
     * Returns the handle to the Angular services. The services can be used by plugisn to achieve
     * the functional calls or render custom views. Valid services are:
     *     popup - UI service to render popup
     *     content - Provides access to the content API (for loading templates and assets)
     *     assessment - Provides access to the assessment API (for loading questions)
     *     language - Provides access to the wordnet API (for loading words and aksharas)
     *     search - Provides access to search API (for search activities, question, domains)
     *     meta - Provides access to metadata API (for resource bundles, ordinals, definitions)
     *     asset - Provides access to the content API (for save assets)
     *     telemetry - Service to genarate and log telemetry events
     * @param serviceId {string} id of the service to return. Returns undefined if the id is invalid
     * @memberof org.ekstep.contenteditor.api
     */
    getService: function(serviceId) {
        var service = '';
        switch (serviceId) {
            case ServiceConstants.POPUP_SERVICE:
                service = org.ekstep.services.popupService;
                break;
            case ServiceConstants.CONTENT_SERVICE:
                service = org.ekstep.services.contentService;
                break;
            case ServiceConstants.ASSESSMENT_SERVICE:
                service = org.ekstep.services.assessmentService;
                break;
            case ServiceConstants.LANGUAGE_SERVICE:
                service = org.ekstep.services.languageService;
                break;
            case ServiceConstants.SEARCH_SERVICE:
                service = org.ekstep.services.searchService;
                break;
            case ServiceConstants.META_SERVICE:
                service = org.ekstep.services.metaService;
                break;
            case ServiceConstants.ASSET_SERVICE:
                service = org.ekstep.services.assetService;
                break;
            case ServiceConstants.TELEMETRY_SERVICE:
                service = org.ekstep.services.telemetryService;
                break;
        }
        return service;
    },

    getCurrentStage: function() {
        return {};
    }
});

window.ecEditor = window.org.ekstep.genericeditor.api;