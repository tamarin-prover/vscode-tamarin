// Dans server/src/server.ts
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    createConnection,
    ProposedFeatures, 
    TextDocuments, 
    InitializeParams,
    ServerCapabilities,
    TextDocumentSyncKind,
    DefinitionParams, 
    RenameParams,
    WorkspaceEdit
} from 'vscode-languageserver/node';

import { AnalysisManager } from './AnalysisManager';


console.error('[Server] Tamarin Language Server starting...');
const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let analysisManager: AnalysisManager;


connection.onInitialize(async (params: InitializeParams) => {
    const parserPath = params.initializationOptions.parserPath;
    analysisManager = new AnalysisManager();
    await analysisManager.initParser(parserPath)
    console.error('[Server] Received "initialize" request from client.');
    const capabilities: ServerCapabilities = {
        textDocumentSync: TextDocumentSyncKind.Full, 
        definitionProvider: true,
        renameProvider: true,
    };
    console.error('[Server] Sending server capabilities back.');
    return { capabilities };
});

connection.onInitialized(() => {
    console.error('[Server] Received "initialized" notification. Handshake complete!');
});

documents.onDidChangeContent(async (change) => {
    console.error(`[Server] File changed: ${change.document.uri}. Triggering validation.`);
    const diagnostics = await analysisManager.AnalyseDocument(change.document);

    connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
    console.error(`[Server] Diagnostics sent for ${change.document.uri}.`);
});

connection.onDefinition((params: DefinitionParams)=> {
    if (!analysisManager) return null;
    console.error(`[Server] Received 'onDefinition' request for ${params.textDocument.uri}.`);
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        console.error(`[Server] Document not found: ${params.textDocument.uri}`);
        return null;
    }
    return analysisManager.getDefinition(document, params.position);
    }
);

connection.onRenameRequest(async (params: RenameParams): Promise<WorkspaceEdit | null> => {
    if (!analysisManager){
        return null;
    }
    console.error(`[Server] Received 'onRenameRequest' for ${params.textDocument.uri} at position ${params.position.line}:${params.position.character}.`);
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        console.error(`[Server] Document not found: ${params.textDocument.uri}`);
        return null;
    }
    return analysisManager.handleRenameRequest(document, params.position, params.newName)
});


documents.onDidClose(event => {
    console.error(`[Server] Document closed: ${event.document.uri}. Cleaning up state.`);
    if (analysisManager) {
        analysisManager.handleDocumentClose(event.document.uri);
    }
});



documents.listen(connection);
connection.listen();