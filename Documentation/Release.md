## Build
*Do not forget to have ```.wasm``` parser built , see [parser documentation](Parser.md) for more details*
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
*You can remove files and folders that are unnecessary in the package in the .vscodeignore file*
## Publication  

The plugin is available on two different websites :
 - https://marketplace.visualstudio.com/items?itemName=tamarin-prover.tamarin-prover
 - https://open-vsx.org/extension/tamarin-prover/tamarin-prover

 For each website you will need an access token in order to publish the extension.
 [azure dev ops account](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)[Eclipse account](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions)

 
### On VsCode
 ```npx vsce login tamarin-prover```. to connect as tamarin-prover team , a private token will be required.
 ```vsce publish version_n°``` To publish the plugin
## On openVSX
 ```npx ovsx publish -p private_access_token```

**Make sure to remove all the errors and all unnecessary dependencies otherwise it won't publish.**



