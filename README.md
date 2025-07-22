# Generic editor

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/1902ad4c61a74e3c98ba11a6a16e08eb)](https://app.codacy.com/app/sunbird-bot/sunbird-generic-editor?utm_source=github.com&utm_medium=referral&utm_content=project-sunbird/sunbird-generic-editor&utm_campaign=Badge_Grade_Settings)
[![npm version](https://badge.fury.io/js/%40project-sunbird%2Fgeneric-editor.svg)](https://badge.fury.io/js/%40project-sunbird%2Fgeneric-editor) [![Build Status](https://travis-ci.org/project-sunbird/sunbird-generic-editor.svg?branch=release-1.11.0)](https://travis-ci.org/project-sunbird/sunbird-generic-editor)

## Introduction
The generic editor is used to create contents which can be uploaded as files(H5P, epub, PDF, HTML, Youtube, Video).

## Step 1: Installation

 Download the content editor using the following command: 
```red
Run npm i @project-sunbird/generic-editor
```
## Step 2: Configure the generic editor

**Required configuration**

```js
window.context = {
  user: {
    id: "",
    name: "",
    orgIds: []
  },
  sid: "",
  contentId: "do_2125953980374712321362",
  pdata: {
    id: "",
    ver: "1.10.",
    pid: ""
  },
  tags: [],
  channel: "",
  env: "genericeditor",
  framework: "NCF",
  uid: "",
  etags: {
    app: [],
    partner: [],
    dims: []
  }
}
```

```js
window.config = {
  baseURL: "",
  apislug: "/action",
  build_number: "",
  pluginRepo: "/content-plugins",
  aws_s3_urls: [],
  plugins: [
    {
      id: "",
      ver: "",
      type: ""
    }
  ],
  corePluginsPackaged: true,
  dispatcher: "local",
  localDispatcherEndpoint: "/app/telemetry",
  previewURL: "/content/preview/preview.html",
  extContWhitelistedDomains: "youtube.com,youtu.be",
  modalId: "genericEditor",
  alertOnUnload: true,
  headerLogo: "",
  loadingImage: "",
  previewConfig: {
    repos: [],
    plugins: [
      {
        id: "",
        ver: "",
        type: ""
      }
    ],
    splash: {
      text: "",
      icon: "",
      bgImage: "",
      webLink: ""
    },
    overlay: {
      showUser: false
    },
    showEndPage: false
  },
  enableTelemetryValidation: false,
  absURL: "",
  genericeditorPlugins: [
    {
      id: "",
      ver: "",
      type: "plugin"
    }
  ],
  corePlugins: [],
  corePluginMapping: {},
  useProxyForURL: false,
  cloudStorage: {}
}
```

| Property Name | Description | Default Value   | Example |
| --- | --- | --- | --- |
| `user` | It is a `object`, Which should contain the user details(userId, name)  | NA  |
| `sid` | It is a `string`, Session identifier  | NA  |
| `contentId ` | It is a `string`,  content identifier | NA  |
| `pdata ` | It is a `object`,  producer information.It can have producer version, producer Id | NA  |
| `tags ` | It is a `array`,  Encrypted dimension tags passed by respective channels| NA  |
| `channel ` | It is a `string`,  Channel which has produced the event| NA  |
| `framework ` | It is a `string`, example:NCF, NCERT| NA  |
| `baseURL ` | It is a `string`, host url| NA  |
| `corePluginsPackaged ` | It is a `boolean`, Which enables the collection-editor to load the plugins from packaged script rather than individual  | true  |
| `pluginRepo ` | It is a `string`, From which location plugins should load  | /plugins  |
| `dispatcher ` | It is a `string`,Where the telemetry should log ex(console, piwik, library, local) | console |
| `plugins ` | It is a `array`, Array of plugins ex:`[{id:"org.sunbird.header",ver:"1.0",type:"plugin"}]`| NA |
| `cloudStorage` |  It is `object` and which defines cloud storage configuration which contains provider & presigned_headers for diff service provider for example: Azure, AWS | ``` cloudStorage: { provider: azure, presigned_headers: { 'x-ms-blob-type': 'BlockBlob' // This header is specific to azure storage provider. } } ``` | The default configuration can be overwrite by passing empty headers. ***For example:*** If you don't want to pass any headers for AWS than pass as empty headers as below: ``` cloudStorage: { provider: azure, presigned_headers: { } } ```

## Step 3: Integration
```js
  openGenericEditor() {
    jQuery.fn.iziModal = iziModal;
    jQuery('#genericEditor').iziModal({
      title: '',
      iframe: true,
      iframeURL: 'url', // collection-editor node_modules index.html path
      navigateArrows: false,
      fullscreen: false,
      openFullscreen: true,
      closeOnEscape: false,
      overlayClose: false,
      overlay: false,
      overlayColor: '',
      history: false,
      onClosing: () => {
        this._zone.run(() => {
          this.closeModal();
        });
      }
    });
```

# How to setup sunbird-generic-editor in local
1. Clone this sunbird-generic-editor repo from [here](https://github.com/project-sunbird/sunbird-generic-editor) 
2. Clone the sunbird-content-plugins repo from [here](https://github.com/project-sunbird/sunbird-content-plugins) 
3. Go to the root directory sunbird-generic-editor.
4. Run `npm install` to install node modules.
5. `cd app` and run `bower install` to install bower components
6. Create a symlink to 'sunbird-content-plugins' (`ln -s ../sunbird-content-plugins plugins`) 
>On Windows: use `mklink`
7. Configure the genric editor [here](https://github.com/project-sunbird/sunbird-genric-editor#how-to-configure-the-sunbird-generic-editor)
7. Run `node app`
8. Open Chrome and visit this link: http://localhost:3000/app


## ChangeLogs
   For changes logs please refer [here](https://github.com/project-sunbird/sunbird-generic  -editor/releases) 

  
 >For sunbird-generic-editor demo please visit [here](https://staging.open-sunbird.org/workspace/content/create)   


## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/project-sunbird/sunbird-generic-editor/blob/master/LICENSE) file for details

## Versioning
We use [SemVer](https://semver.org/) for versioning. For the versions available, see the [tags](https://github.com/project-sunbird/sunbird-generic-editor/tags) on this repository.

## Any Issues?
We have an open and active [issue tracker](https://project-sunbird.atlassian.net/issues/). Please report any issues.

# GitHub Actions

## Build and Test on Pull Request

This GitHub Actions workflow runs **build, test, and lint checks** automatically when a pull request is opened against any branch.

### When It Runs

- **Trigger**: On every `pull_request` to any branch (`'**'`)

### Prerequisites Before Triggering

Make sure the following are set up **before** opening a pull request:

### Secrets
`SONAR_TOKEN`: For SonarQube authentication 

### Repository Variables
`CONTENT_PLUGIN_VERSION`: Have to specify the branch or tag you want fetch. By default it will take `release-8.0.0`

Note: The secrets and variables should be set in Github UI (`settings/secrets and variables/actions`).

For any changes to the workflow, update the file `.github/workflows/pull-request.yml` accordingly.

# Build and Upload Content Editor Workflow

**Workflow Name:** `Publish Sunbird-generic-editor to blob`

This GitHub Actions workflow builds the Generic Editor and uploads the generated build artifacts to a cloud storage provider — **GCP**, **Azure**, or **AWS**.  
It is triggered **whenever a new Git tag is pushed** to the repository.

---

## Prerequisites

Before triggering this workflow, ensure the following:

- A valid Git tag is pushed to start the workflow.
- The pushed tag **must also exist** in the [`sunbird-content-plugins`](https://github.com/project-sunbird/sunbird-content-plugins) repository.
- Required **GitHub Actions Variables** and **Secrets** are configured based on the selected cloud provider.

You can set **Variables and Secrets** in GitHub under:  
`Settings → Secrets and Variables → Actions`

---

## Cloud Provider Configuration

The workflow uses the `CLOUD_PROVIDER` variable to determine where to upload the build artifacts. Based on the provider selected, configure the following:

### GCP (Google Cloud Platform)

**Repository Variable:**
- `CLOUD_PROVIDER` = `gcp`
- `GCP_BUCKET` — Name of the GCP bucket to upload to.

**Repository Secret:**
- `GCP_SERVICE_ACCOUNT_KEY` — Base64-encoded GCP service account key.

---

### Azure

**Repository Variable:**
- `CLOUD_PROVIDER` = `azure`
- `AZURE_CONTAINER` — Name of the Azure Blob Storage container.

**Repository Secrets:**
- `AZURE_STORAGE_ACCOUNT` — Azure Storage account name.
- `AZURE_STORAGE_KEY` — Azure Storage account key.

---

### AWS (Amazon Web Services)

> **Note:** AWS upload is defined in the workflow but marked as **not tested**.

**Repository Variable:**
- `CLOUD_PROVIDER` = `aws`
- `S3_BUCKET` — Name of the AWS S3 bucket.
- `AWS_REGION` — AWS region where the bucket is located.

**Repository Secrets:**
- `AWS_ACCESS_KEY_ID` — AWS access key ID.
- `AWS_SECRET_ACCESS_KEY` — AWS secret access key.

---