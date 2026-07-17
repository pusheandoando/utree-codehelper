// src/commands/newChangeCommand.js
const vscode = require('vscode');

const PromptBuilder = require('../prompt/promptBuilder');
const ExtensionState = require('../core/extensionState');
const { buildPromptReviewHtml } = require('../webview/promptReviewHtml');





function openPromptReviewPanel(extensionUri, generatedPrompt, onReload, onApply) {
	const panel = vscode.window.createWebviewPanel(
		'utreeCodehelperPromptReview',
		'Generated Prompt',
		vscode.ViewColumn.Active,
		{ enableScripts: true, retainContextWhenHidden: true }
	);

	panel.iconPath = vscode.Uri.joinPath(extensionUri, 'assets', 'icon-state-prompt.png');
	panel.webview.html = buildPromptReviewHtml(generatedPrompt);

	panel.webview.onDidReceiveMessage(async (message) => {
		if (message.type === 'reloadPrompt') {
			const reloadedPrompt = await onReload();
			panel.webview.postMessage({ type: 'setPromptText', promptText: reloadedPrompt });
		}

		if (message.type === 'openApplyChanges') {
			await onApply();
		}
	});

	return panel;
}

async function generatePrompt(workspaceRootPath, userInstructions) {
	const extensionState = ExtensionState.getInstance();
	const promptBuilder = new PromptBuilder(workspaceRootPath);

	const generatedPrompt = await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: 'Building prompt with utree...' },
		() => promptBuilder.build(userInstructions, extensionState.getExcludedPaths())
	);

	extensionState.setLastGeneratedPrompt(generatedPrompt);
	
	return generatedPrompt;
}


let activePromptPanel = null;

function getActivePromptPanel() {
	return activePromptPanel;
}

function clearActivePromptPanel() {
	activePromptPanel = null;
}


async function executeNewChangeCommand(extensionUri, workspaceRootPath, userInstructions, onApplyChanges) {
	if (!userInstructions || userInstructions.trim().length === 0) {
		vscode.window.showWarningMessage('Describe the requested changes before generating a new prompt.');
		return;
	}

	const generatedPrompt = await generatePrompt(workspaceRootPath, userInstructions);

	activePromptPanel = openPromptReviewPanel(
		extensionUri,
		generatedPrompt,
		() => generatePrompt(workspaceRootPath, userInstructions),
		onApplyChanges
	);

	activePromptPanel.onDidDispose(clearActivePromptPanel);
}





module.exports = {
	executeNewChangeCommand,
	getActivePromptPanel,
};