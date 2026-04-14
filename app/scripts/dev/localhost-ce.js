window.context = {
    "contentId": "", //do_1123102913293189121226
    "sid": "rctrs9r0748iidtuhh79ust993",
    "user": {
        "id": "390",
        "name": "Sunil A S",
        "email": "sunils@ilimi.in"
    },
    "framework": "NCF"
};

window.config = {
    baseURL: "",
    previewURL: "/preview/preview.html",
    apislug: "/action",
    dispatcher: "local",
    cloudStorage: {
      "presigned_headers": {
        'x-ms-blob-type': 'BlockBlob' // This header is specific to azure storage provider.
        /* TODO: if more configurations comes for cloud service provider
           than we have do in more generic way like below:
           For example:
           cloudStorage: {
              provider: 'azure' // azure, aws, etc..
              azure: {
                url: 'https://www.azureblogstorage.com'
                presigned_headers: {
                  x-ms-blob-type: 'BlockBlob'
                }
              }
           }
        */
      }
    }
}