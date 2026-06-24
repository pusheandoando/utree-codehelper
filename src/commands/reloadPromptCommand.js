// src/commands/reloadPromptCommand.js
const vscode = require('vscode');
const ExtensionState = require('../core/extensionState');





async function executeReloadPromptCommand() {
	const extensionState = ExtensionState.getInstance();
	const lastGeneratedPrompt = extensionState.getLastGeneratedPrompt();
	const activeEditor = vscode.window.activeTextEditor;

	if (!lastGeneratedPrompt) {
		vscode.window.showWarningMessage('There is no generated prompt to reload yet.');
		return;
	}

	if (!activeEditor) {
		vscode.window.showWarningMessage('Open the prompt document before reloading it.');
		return;
	}

	const fullDocumentRange = new vscode.Range(
		activeEditor.document.positionAt(0),
		activeEditor.document.positionAt(activeEditor.document.getText().length)
	);

	await activeEditor.edit((editBuilder) => {
		editBuilder.replace(fullDocumentRange, lastGeneratedPrompt);
	});
}

module.exports = {
	executeReloadPromptCommand,
};