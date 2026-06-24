// src/commands/applyChangesCommand.js
const vscode = require('vscode');
const path = require('path');
const { buildPasteResponseHtml } = require('../webview/pasteResponseHtml');
const { buildDiffReviewHtml } = require('../webview/diffReviewHtml');
const { parseAiResponse } = require('../parser/commandParser');
const { ChangeApplier } = require('../parser/changeApplier');
const { COMMAND_TYPE } = require('../parser/commandParser');
const { saveSession } = require('../dependency/changeLogger');
const { getActivePromptPanel } = require('./newChangeCommand');





function openPasteResponsePanel(extensionUri) {
	return new Promise((resolve) => {
		let hasResolved = false;
		const resolveOnce = (value) => {
			if (hasResolved) {
				return;
			}
			hasResolved = true;
			resolve(value);
		};

		const panel = vscode.window.createWebviewPanel(
			'utreeCodehelperPasteResponse',
			'Paste AI Response',
			vscode.ViewColumn.Active,
			{ enableScripts: true, retainContextWhenHidden: false }
		);

		panel.iconPath = vscode.Uri.joinPath(extensionUri, 'assets', 'icon-state-work.png');
		panel.webview.html = buildPasteResponseHtml();

		panel.webview.onDidReceiveMessage((message) => {
			if (message.type === 'acceptResponse') {
				resolveOnce(message.responseText);
				panel.dispose();
			}
			if (message.type === 'cancelResponse') {
				resolveOnce(null);
				panel.dispose();
			}
		});

		panel.onDidDispose(() => resolveOnce(null));
	});
}

function resolveFileUri(workspaceRootPath, command) {
	const fileCommands = new Set([
		COMMAND_TYPE.CREATE_SCRIPT,
		COMMAND_TYPE.DELETE_SCRIPT,
		COMMAND_TYPE.REPLACE_FRAGMENT,
	]);

	if (!fileCommands.has(command.type) || !command.path) {
		return null;
	}

	return vscode.Uri.file(path.join(workspaceRootPath, command.path));
}

function openDiffReviewPanel(parsedCommands, workspaceRootPath, onComplete) {
	const panel = vscode.window.createWebviewPanel(
		'utreeCodehelperDiffReview',
		'Review Changes',
		vscode.ViewColumn.Active,
		{ enableScripts: true, retainContextWhenHidden: true }
	);

	panel.webview.html = buildDiffReviewHtml(parsedCommands);
	const changeApplier = new ChangeApplier(workspaceRootPath);

	panel.webview.onDidReceiveMessage(async (message) => {
		if (message.type === 'applySelected') {
			await applySelected(changeApplier, parsedCommands, message.indices, workspaceRootPath, panel, onComplete);
		}
	});

	return panel;
}

async function applySelected(changeApplier, parsedCommands, indices, workspaceRootPath, panel, onComplete) {
	const appliedFileUris = [];

	for (const index of indices) {
		const command = parsedCommands[index];

		if (command.parseError) {
			continue;
		}

		try {
			await changeApplier.apply(command);
			panel.webview.postMessage({ type: 'stepDone', index });
			const fileUri = resolveFileUri(workspaceRootPath, command);
			if (fileUri) {
				appliedFileUris.push(fileUri);
			}
		} catch (error) {
			panel.webview.postMessage({ type: 'stepFailed', index, error: error.message });
			return;
		}
	}

	saveSession(workspaceRootPath, parsedCommands);
	panel.webview.postMessage({ type: 'applyComplete' });

	closeActivePromptPanel();
	panel.dispose();
	await openAppliedFiles(appliedFileUris);

	if (onComplete) {
		onComplete();
	}
}

function closeActivePromptPanel() {
	const promptPanel = getActivePromptPanel();
	if (promptPanel) {
		promptPanel.dispose();
	}
}

async function openAppliedFiles(fileUris) {
	for (const fileUri of fileUris) {
		try {
			const document = await vscode.workspace.openTextDocument(fileUri);
			await vscode.window.showTextDocument(document, {
				preview: false,
				preserveFocus: false,
			});
		} catch {
			// file may have been deleted
		}
	}
}

async function executeApplyChangesCommand(extensionUri, workspaceRootPath, onComplete) {
	const aiResponseText = await openPasteResponsePanel(extensionUri);
	if (!aiResponseText) {
		return;
	}

	const parsedCommands = parseAiResponse(aiResponseText);
	if (parsedCommands.length === 0) {
		vscode.window.showWarningMessage('No valid @@COMMAND blocks were found in the pasted response.');
		return;
	}

	openDiffReviewPanel(parsedCommands, workspaceRootPath, onComplete);
}

module.exports = {
	executeApplyChangesCommand,
};