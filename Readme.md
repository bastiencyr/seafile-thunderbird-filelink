# Thunderbird Seafile Extension

This mail extension allow user to use seafile for large attachments. 
This is a beta version. I will publish  this extension on Thunderbird when it 
will be stable. You can use and test this extension, all basics features are 
implemented and I don't have intention to break things.

To test this extension, first clone this git repository on your computer.

## Load the extension as a temporary addon

1. Open the Add-ons manager (Menu > Add-ons & Themes)
2. Select Extensions in the left vertical bar
3. Click the gear and select "Debug Add-ons"

In the new window, in the "Temporary Extensions" section, click "Load Temporary
Add-on..." and select this project's `manifest.json` file.

This install this extension for the session duration only.

Click "Inspect" button to open developpers tools.
Messages logged with `console.log()` will appear in the console tab.

You can inspect content of browser storage in storage tab. This extension uses
browser storage to store accounts configuration. Look at the "Extension Storage"
section.

## Configuration

Once the extension is loaded, open Preferences > Composition.

At the bottom in the attachments section, click on `Add Seafile` to add a
filelink provider.

Configure the provider with your seafile server and your credentials.

In order to test with small files, set `Offer to share for files larger than`
at 0.

## Usage

1. Compose a new email

2. Attach a file
   
   A yellow message at screen's bottom allow you to use Filelink to store the
   attachement: just click `Link`

## Development

This extension use webpack. You need to install npm before.
Then:

```shell
npm init -y
npm install webpack webpack-cli --save-dev
npm install seafile-js --save
npx webpack
```

This repository use gitflow.

## Publish the code to thunderbird

After npm dependencies has been installed, you can generate the zip file that
will be send to the Thunderbird team with the following commands:

```shell
bash publish.sh
``` 

You need to execute the publish.sh file in the root folder of this project. 
A zip file will be generated in the parent folder.

## Code quality

Install first js-beautify and jshint with npm. Then you can check the code.

```shell
npm install js-beautify jshint --save-dev
# run js-beautify
js-beautify.js -r src/*.js
js-beautify.js -r *.js
js-beautify.js -r *.html
# run jshint
jshint src/*.js
```