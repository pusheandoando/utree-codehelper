// src/webview/previousChangesProvider.js
const vscode = require('vscode');
const { buildPreviousChangesHtml } = require('./previousChangesHtml');
const { buildDiffReviewHtml } = require('./diffReviewHtml');
const { buildCommitPromptHtml } = require('./commitPromptHtml');
const { listSessions, clearSessions, formatDatetimeForDisplay } = require('../dependency/changeLogger');
const { ChangeApplier } = require('../parser/changeApplier');
const { findUnapplicableCommands } = require('../parser/changeValidator');
const { buildCommitPrompt } = require('../prompt/commitPromptTemplate');





class PreviousChangesProvider {
	constructor(extensionUri, getWorkspaceRootPath) {
		this.extensionUri = extensionUri;
		this.getWorkspaceRootPath = getWorkspaceRootPath;
		this.view = null;
	}

	resolveWebviewView(webviewView) {
		this.view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		webviewView.webview.onDidReceiveMessage((message) => {
			if (message.type === 'openSession') {
				this.openSession(message.index);
			}
			if (message.type === 'clearLogs') {
				this.clearLogs();
			}
		});

		this.render();
	}

	render() {
		if (!this.view) {
			return;
		}
		const workspaceRootPath = this.getWorkspaceRootPath();
		const sessions = workspaceRootPath ? listSessions(workspaceRootPath) : [];
		this.view.webview.html = buildPreviousChangesHtml(sessions);
	}

	refresh() {
		this.render();
	}

	openSession(index) {
		const workspaceRootPath = this.getWorkspaceRootPath();
		if (!workspaceRootPath) {
			return;
		}
		const sessions = listSessions(workspaceRootPath);
		const session = sessions[index];
		if (!session) {
			return;
		}
		const datetimeLabel = formatDatetimeForDisplay(session.datetime);
		openReadOnlyDiffReviewPanel(session.commands, datetimeLabel, workspaceRootPath);
	}

	clearLogs() {
		const workspaceRootPath = this.getWorkspaceRootPath();
		if (!workspaceRootPath) {
			return;
		}
		clearSessions(workspaceRootPath);
		this.render();
	}
}

function openReadOnlyDiffReviewPanel(commands, datetimeLabel, workspaceRootPath) {
	const panel = vscode.window.createWebviewPanel(
		'utreeCodehelperDiffReview',
		`Review Changes (${datetimeLabel})`,
		vscode.ViewColumn.Active,
		{ enableScripts: true, retainContextWhenHidden: true }
	);

	panel.webview.html = buildDiffReviewHtml(commands, datetimeLabel);
	const changeApplier = new ChangeApplier(workspaceRootPath);

	panel.webview.onDidReceiveMessage(async (message) => {
		if (message.type === 'applySelected') {
			await applySelected(changeApplier, commands, message.indices, panel);
		}
		if (message.type === 'getCommitPrompt') {
			openCommitPromptPanel(commands);
		}
	});
}

function openCommitPromptPanel(commands) {
	const panel = vscode.window.createWebviewPanel(
		'utreeCodehelperCommitPrompt',
		'Git Commit Prompt',
		vscode.ViewColumn.Active,
		{ enableScripts: true, retainContextWhenHidden: true }
	);

	panel.webview.html = buildCommitPromptHtml(buildCommitPrompt(commands));
}

async function confirmProceedIfSomeUnapplicable(unapplicableCommands) {
	if (unapplicableCommands.length === 0) {
		return true;
	}

	const proceedChoice = 'Continue with recognized changes only';
	const userChoice = await vscode.window.showWarningMessage(
		'Not all selected changes can be applied. Continuing will apply only the changes that are valid, skipping the rest. This may leave the update incomplete.',
		{ modal: true },
		proceedChoice
	);

	return userChoice === proceedChoice;
}

async function applySelected(changeApplier, commands, indices, panel) {
	const selectedCommands = indices.map((index) => commands[index]);
	const unapplicableCommands = await findUnapplicableCommands(changeApplier, selectedCommands);

	const canProceed = await confirmProceedIfSomeUnapplicable(unapplicableCommands);
	if (!canProceed) {
		return;
	}

	for (const index of indices) {
		const command = commands[index];
		if (command.parseError) {
			continue;
		}
		try {
			await changeApplier.apply(command);
			panel.webview.postMessage({ type: 'stepDone', index });
		} catch (error) {
			panel.webview.postMessage({ type: 'stepFailed', index, error: error.message });
			vscode.window.showErrorMessage(`Applying changes stopped because "${command.path}" failed: ${error.message}. Changes already written before this step remain on disk.`);
			return;
		}
	}
	panel.webview.postMessage({ type: 'applyComplete' });
}

module.exports = PreviousChangesProvider;