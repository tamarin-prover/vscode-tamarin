import * as vscode from 'vscode';
import path = require('path');


export function runShortcut(context : vscode.ExtensionContext){

//Feature to run tamarin directly using vscode just click on the bottom right handcorner and select the mode.

let playButton : vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
playButton.text = "$(triangle-right) Run";
playButton.command = "tamarin.showActions";
playButton.show();

const showActions = vscode.commands.registerCommand('tamarin.showActions', async () => {
    const actions: vscode.QuickPickItem[] = [
      { label: 'Run Tamarin Prover', description: 'Run Tamarin prover ' },
      { label: 'Run Tamarin Prover  auto-sources', description: 'Run Tamarin prover with --auto-sources option'  },
    ];

    const selectedAction = await vscode.window.showQuickPick(actions, {
      placeHolder: 'Select an action',
    });

    if (selectedAction && selectedAction.label === 'Run Tamarin Prover') {
      vscode.commands.executeCommand('tamarin.play')
    }
    else if (selectedAction && selectedAction.label === 'Run Tamarin Prover  auto-sources'){
        vscode.commands.executeCommand('tamarin.play2')
    }
  });

const runTamarin = vscode.commands.registerCommand('tamarin.play', () => {
    if(vscode.window.activeTextEditor){
        const source = vscode.window.activeTextEditor.document.uri.fsPath;
        const program = "tamarin-prover interactive "; 
        const args = [path.basename(source)];
        const terminal = vscode.window.createTerminal(`Play: Tamarin`);
        terminal.sendText(`${program} ./${args.join(" ")}`);
        terminal.show();
    }
});

    const runTamarinAutoSources = vscode.commands.registerCommand('tamarin.play2', () => {
        if(vscode.window.activeTextEditor){
            const source = vscode.window.activeTextEditor.document.uri.fsPath;
            const program = "tamarin-prover interactive "; 
            const args = [path.basename(source)];
            const terminal = vscode.window.createTerminal(`Play: Tamarin`);
            terminal.sendText(`${program} ./${args.join("")} --auto-sources`);
            terminal.show();
        }

});

context.subscriptions.push(runTamarin);
context.subscriptions.push(runTamarinAutoSources);
}