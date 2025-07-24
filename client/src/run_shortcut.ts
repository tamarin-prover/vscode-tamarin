
import * as vscode from 'vscode';
import * as path from 'path';


export function runShortcut(context : vscode.ExtensionContext){
  const playButton : vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  playButton.text = "$(triangle-right) Run";
  playButton.command = "tamarin.showActions";
  playButton.show();
  const showActions = vscode.commands.registerCommand('tamarin.showActions', async () => {
      const actions: vscode.QuickPickItem[] = [
        { label: 'Run Tamarin Prover interactive'},
        { label: 'Run Tamarin Prover interactive with auto-sources option'},
        { label: 'Run Tamarin Prover'},
        { label: 'Run Tamarin Prover with auto-sources option'}
      ];

      const selectedAction = await vscode.window.showQuickPick(actions, {
        placeHolder: 'Select an action',
      });

      if (selectedAction && selectedAction.label === 'Run Tamarin Prover interactive') {
        vscode.commands.executeCommand('tamarin.play_interactive')
      }
      else if (selectedAction && selectedAction.label === 'Run Tamarin Prover interactive with auto-sources option'){
        vscode.commands.executeCommand('tamarin.play_interactive_auto')
      }
      else if (selectedAction && selectedAction.label === 'Run Tamarin Prover'){
        vscode.commands.executeCommand('tamarin.play_cli')
      }
      else if (selectedAction && selectedAction.label === 'Run Tamarin Prover with auto-sources option'){
        vscode.commands.executeCommand('tamarin.play_cli_auto')
      }
    });

  const runTamarinInteractive = vscode.commands.registerCommand('tamarin.play_interactive', async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if(activeEditor){
          await activeEditor.document.save();
          const document = activeEditor.document;
          const filePath = document.uri.fsPath;
          const fileDirectory = path.dirname(filePath);
          const terminal = vscode.window.createTerminal({
              name: `Play: Tamarin`,
              cwd: fileDirectory
          });
          terminal.sendText(`tamarin-prover interactive "${filePath}"`);
          terminal.show();
      }
  });

      const runTamarinInteractiveAutoSources = vscode.commands.registerCommand('tamarin.play_interactive_auto', async () => {
          const activeEditor = vscode.window.activeTextEditor;
          if(activeEditor){
            await activeEditor.document.save();
            const document = activeEditor.document;
            const filePath = document.uri.fsPath;
            const fileDirectory = path.dirname(filePath)
            const terminal = vscode.window.createTerminal({
                name: `Play: Tamarin`,
                cwd: fileDirectory
            });
            terminal.sendText(`tamarin-prover interactive "${filePath}" --auto-sources`);
            terminal.show();
          }

  });
        const runTamarinCli = vscode.commands.registerCommand('tamarin.play_cli', async () => {
          const activeEditor = vscode.window.activeTextEditor;
          if(activeEditor){
            await activeEditor.document.save();
            const document = activeEditor.document;
            const filePath = document.uri.fsPath;
            const fileDirectory = path.dirname(filePath)
            const terminal = vscode.window.createTerminal({
                name: `Play: Tamarin`,
                cwd: fileDirectory
            });
            terminal.sendText(`tamarin-prover "${filePath}"`);
            terminal.show();
          }
          
  });

          const runTamarinCliAutoSources = vscode.commands.registerCommand('tamarin.play_cli_auto', async () => {
          const activeEditor = vscode.window.activeTextEditor;
          if(activeEditor){
            await activeEditor.document.save();
            const document = activeEditor.document;
            const filePath = document.uri.fsPath;
            const fileDirectory = path.dirname(filePath)
            const terminal = vscode.window.createTerminal({
                name: `Play: Tamarin`,
                cwd: fileDirectory
            });
            terminal.sendText(`tamarin-prover "${filePath}" --auto-sources`);
            terminal.show();
          }
          
  });

  context.subscriptions.push(showActions);
  context.subscriptions.push(runTamarinInteractive);
  context.subscriptions.push(runTamarinInteractiveAutoSources);
  context.subscriptions.push(runTamarinCli);
  context.subscriptions.push(runTamarinCliAutoSources);
  }