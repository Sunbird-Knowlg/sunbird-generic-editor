org.ekstep.contenteditor = {};
org.ekstep.contenteditor.config = org.ekstep.contenteditor.config || {};
org.ekstep.contenteditor.config.basURL = "https://dev.ekstep.in";

org.ekstep.services.telemetryService = {
    apiCall: function() {}
};

var config = {
    baseURL: "",
    env: "editor",
    previewURL: "/preview/preview.html",
    apislug: "/action"
};

window.org.ekstep.pluginframework.initialize(config);

window.context = {
    "contentId": "do_1123102913293189121226",
    "sid": "rctrs9r0748iidtuhh79ust993",
    "user": {
        "id": "390",
        "name": "Santhosh Vasabhaktula",
        "email": "santhosh@ilimi.in"
    }
};

org.ekstep.contenteditor.globalContext = window.context;

window.ServiceConstants = {
    SEARCH_SERVICE: "search",
    POPUP_SERVICE: "popup",
    CONTENT_SERVICE: "content",
    ASSESSMENT_SERVICE: "assessment",
    LANGUAGE_SERVICE: "language",
    META_SERVICE: "meta",
    ASSET_SERVICE: "asset",
    TELEMETRY_SERVICE: "telemetry"
};