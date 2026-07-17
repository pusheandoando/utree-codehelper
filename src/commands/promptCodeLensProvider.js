// src/commands/promptCodeLensProvider.js
const vscode = require('vscode');

const ExtensionState = require('../core/extensionState');
const { COMMAND_RELOAD_PROMPT, COMMAND_APPLY_CHANGES, PROMPT_DOCUMENT_LANGUAGE } = require('../core/constants');





class PromptCodeLensProvider {
	constructor() {
		this.onDidChangeCodeLensesEmitter = new vscode.EventEmitter();
		this.onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;
	}

	refresh() {
		this.onDidChangeCodeLensesEmitter.fire();
	}

	provideCodeLenses(document) {
		const extensionState = ExtensionState.getInstance();
		const pendingPromptUri = extensionState.getPendingPromptUri();

		const isPendingPromptDocument = document.languageId === PROMPT_DOCUMENT_LANGUAGE
			&& pendingPromptUri
			&& document.uri.toString() === pendingPromptUri.toString();

		if (!isPendingPromptDocument) {
			return [];
		}

		const lastLineIndex = document.lineCount - 1;
		const lensRange = new vscode.Range(lastLineIndex, 0, lastLineIndex, 0);

		return [
			new vscode.CodeLens(lensRange, { title: 'Reload', command: COMMAND_RELOAD_PROMPT }),
			new vscode.CodeLens(lensRange, { title: 'Apply Changes', command: COMMAND_APPLY_CHANGES }),
		];
	}
}





module.exports = PromptCodeLensProvider;