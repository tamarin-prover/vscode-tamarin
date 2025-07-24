import * as path from 'path';
import {ExtensionContext, window} from 'vscode';
import {LanguageClient,LanguageClientOptions,ServerOptions,TransportKind} from 'vscode-languageclient/node';
import {NotificationType} from "vscode-languageclient";


let client: LanguageClient;
const NotifyUserNotification = new NotificationType<string>('custom/notifyUser');


export const startLanguageServer= async(context: ExtensionContext) =>{
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc }
	};
    const parserPath = context.asAbsolutePath(
        path.join('server', 'out', 'grammar', 'tree-sitter-tamarin', 'tree-sitter-spthy.wasm')
    );
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{scheme: 'file', language: 'tamarin'}],
        outputChannelName: 'Tamarin Language Server',
        initializationOptions: {
            parserPath: parserPath
        }
    }
    client = new LanguageClient(
        'tamarinLanguageServer',
        'Tamarin Language Server',
        serverOptions,
        clientOptions
    );
    client.onNotification(NotifyUserNotification, (params) => {window.showWarningMessage(params);});

	await client.start();
}

export const stopLanguageServer = async() => {
    await client?.stop();
}