## Build
*Do not forget to have ```.wasm``` parser build , see [parser documentation](Parser.md) for more details*
First you will have to build the package containing the extension, it will include all files and folders in the project except those that are in the ```.vscodeignore file.```
```npm install```
```npx vsce package```
This will generate a  ```.vsix``` package.
## Testing the release
To install the package on your computer only run :
```code --install-extension extension_name.vsix``` , then it will be installed as an ordinary vscode extension. 
To uninstall the package run : 
```code --uninstall-extension extension_name.vsix``` , you can also uninstall using vscode interface

*Sometimes, the extension might not be uninstalled correctly, you can remove the package by removing the tamarin's extension folder in vscode extensions folder*
## Publication  

The plugin is available on two different websites :
 - https://marketplace.visualstudio.com/items?itemName=tamarin-prover.tamarin-prover

 - https://open-vsx.org/extension/tamarin-prover/tamarin-prover

 For each website you will need an access token in order to publish the extension. This you can create using your [azure dev ops account](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)or your [Eclipse account](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions)
 For vscode the access token is required before publishing using ```vsce login private_access_token```.
 In order to push a new version or release you will need to use the following commands : 
- ```vsce publish version_n°``` 
- for vscode and ```npx ovsx publish -p private_access_token``` for openVSX

**Make sure to remove all the errors otherwise it won't publish. The error messages are quite clear to help you debug. For vscode you can specify in the ```package.json``` file the files you want to include in the extension. Make sure everything necessary to run your code is present. **



