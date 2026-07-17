// src/parser/appliedFilesOpener.js
const path = require('path');
const vscode = require('vscode');

const { COMMAND_TYPE } = require('./commandParser');





const OPENABLE_COMMAND_TYPES = new Set([
	COMMAND_TYPE.CREATE_SCRIPT,
	COMMAND_TYPE.REPLACE_LINES,
]);





function resolveFileUri(workspaceRootPath, command) {
	if (!OPENABLE_COMMAND_TYPES.has(command.type) || !command.path) {
		return null;
	}

	return vscode.Uri.file(path.join(workspaceRootPath, command.path));
}

function dedupeUris(fileUris) {
	const seen = new Map();
	
	for (const uri of fileUris) {
		seen.set(uri.toString(), uri);
	}

	return Array.from(seen.values());
}

async function openAppliedFiles(fileUris) {
	const uniqueUris = dedupeUris(fileUris);

	for (const fileUri of uniqueUris) {
		try {
			const document = await vscode.workspace.openTextDocument(fileUri);
			await vscode.window.showTextDocument(document, {
				viewColumn: vscode.ViewColumn.Active,
				preview: false,
				preserveFocus: false,
			});
		} catch (error) {
			vscode.window.showWarningMessage(`Could not open "${fileUri.fsPath}" after applying changes: ${error.message}`);
		}
	}
}





module.exports = {
	resolveFileUri,
	openAppliedFiles,
};