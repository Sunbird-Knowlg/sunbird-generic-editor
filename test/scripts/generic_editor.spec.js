describe("content editor integration test: ", function() {

    beforeAll(function(done) {
        org.ekstep.contenteditor.globalContext = {};
        var corePlugins = [
            { "id": "org.ekstep.genericeditor", "ver": "1.0", "type": "plugin" }
        ];
        
        org.ekstep.contenteditor.config.useProxyForURL = false;
        org.ekstep.contenteditor.config.corePluginsPackaged = false;

        org.ekstep.services.config = {
            baseURL: org.ekstep.contenteditor.config.baseURL,
            apislug: org.ekstep.contenteditor.config.apislug
        }        

        org.ekstep.pluginframework.initialize({
            env: 'editor',
            pluginRepo: "https://s3.ap-south-1.amazonaws.com/ekstep-public-dev/content-plugins"
        });

        org.ekstep.pluginframework.pluginManager.loadAllPlugins(corePlugins, undefined, function() {
            done();    
        });
    });

    it('should load default plugins', function() {
        var context = { contentId: "", uid: 346 };
        spyOn(org.ekstep.pluginframework.pluginManager, 'loadAllPlugins');
        org.ekstep.contenteditor._loadDefaultPlugins(context, function(){});
        //expect(org.ekstep.contenteditor.config.plugins).toEqual('');
        expect(org.ekstep.pluginframework.pluginManager.loadAllPlugins).toHaveBeenCalledWith(org.ekstep.contenteditor.config.plugins, undefined, jasmine.any(Function));
    });

});