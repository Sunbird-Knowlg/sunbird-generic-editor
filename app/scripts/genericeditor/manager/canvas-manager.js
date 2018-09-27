org.ekstep.contenteditor.canvasManager = new (Class.extend({
	registeredcanvas: [],
	initialize: function (config) {
		this.loadNgModules = config.loadNgModules
		this.scope = config.scope
	},
	register: function (canvas, manifest) {
		this.registeredcanvas.push({ id: manifest.id, canvas: canvas })
		this.load(canvas, manifest)
	},
	load: function (canvas, manifest) {
		var instance = this
		if (canvas.templateURL) {
			canvas.templateURL = org.ekstep.contenteditor.api.resolvePluginResource(manifest.id, manifest.ver, canvas.templateURL)
			instance.loadNgModules(canvas.templateURL)

			if (canvas.controllerURL) {
				canvas.controllerURL = org.ekstep.contenteditor.api.resolvePluginResource(manifest.id, manifest.ver, canvas.controllerURL)
				instance.loadNgModules(undefined, canvas.controllerURL)
					.then(function () {
						instance.scope.addToCanvasArea(canvas)
					}, function () {
						throw new Error('unable to load controller :' + canvas.controllerURL)
					})
			} else {
				instance.scope.addToCanvasArea(canvas)
			}
		};
	}
}))()
