window.org.ekstep.genericeditor.api = _.assign(org.ekstep.contenteditor.api, {
	initEditor: function (config, cb) {
		var startTime = Date.now()
		var gcPlugins = [
			{ 'id': 'org.ekstep.genericeditorpreview', 'ver': '1.1', 'type': 'plugin' },
			{ 'id': 'org.ekstep.genericeditorsidebar', 'ver': '1.0', 'type': 'plugin' }]
		gcPlugins = _.concat(gcPlugins, ecEditor.getConfig('genericeditorPlugins'))
		org.ekstep.pluginframework.pluginManager.loadAllPlugins(gcPlugins, undefined, function () {
			var EDITOR_LOADED = Date.now();
			org.ekstep.services.telemetryService.start(EDITOR_LOADED - startTime)
			ecEditor.addEventListener("content:load:complete", function () {
				//subtype should be "content_load_time"
				if(ecEditor.getContext('contentId')) ecEditor.getService(ServiceConstants.TELEMETRY_SERVICE).interact({ id: "screen", type: "click", subtype: "content_load_time", duration: (Date.now() - EDITOR_LOADED).toString() })
			})
			if (cb) cb()
		})
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
	getService: function (serviceId) {
		var service = ''
		switch (serviceId) {
			case ServiceConstants.POPUP_SERVICE:
				service = org.ekstep.services.popupService
				break
			case ServiceConstants.CONTENT_SERVICE:
				service = org.ekstep.services.contentService
				break
			case ServiceConstants.ASSESSMENT_SERVICE:
				service = org.ekstep.services.assessmentService
				break
			case ServiceConstants.LANGUAGE_SERVICE:
				service = org.ekstep.services.languageService
				break
			case ServiceConstants.SEARCH_SERVICE:
				service = org.ekstep.services.searchService
				break
			case ServiceConstants.META_SERVICE:
				service = org.ekstep.services.metaService
				break
			case ServiceConstants.ASSET_SERVICE:
				service = org.ekstep.services.assetService
				break
			case ServiceConstants.TELEMETRY_SERVICE:
				service = org.ekstep.services.telemetryService
				break
			case ServiceConstants.USER_SERVICE:
				service = org.ekstep.services.userService
				break
			case ServiceConstants.CONTENT_LOCK_SERVICE:
				service = org.ekstep.services.lockService
				break
		}
		return service
	},

	getCurrentStage: function () {
		return {}
	}
})

window.ecEditor = window.org.ekstep.genericeditor.api
