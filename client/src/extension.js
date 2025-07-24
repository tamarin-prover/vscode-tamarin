"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const path = require("path");
const node_1 = require("vscode-languageclient/node");
const node_2 = require("vscode-languageclient/node");
function activate(context) {
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    const serverOptions = {
        run: { module: serverModule, transport: node_2.TransportKind.ipc },
        debug: { module: serverModule, transport: node_2.TransportKind.ipc, options: { execArgv: ['--nolazy', '--inspect=6009'] } }
    };
    const clientOptions = { documentSelector: [{ scheme: 'file', language: 'tamarin' }] };
    const client = new node_1.LanguageClient('tamarinLSP', 'Tamarin Language Server', serverOptions, clientOptions);
    client.start();
}
//# sourceMappingURL=extension.js.map