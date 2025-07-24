import { ExtensionContext } from 'vscode';
import { startLanguageServer, stopLanguageServer } from './languageServer';
import {runShortcut} from './run_shortcut';

export async function activate(context: ExtensionContext) {
    console.log('[Client] Activating Tamarin extension...');
    await startLanguageServer(context);
    runShortcut(context);
}

export async function deactivate() {
    await stopLanguageServer();
}

