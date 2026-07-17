// src/webview/fileSearchProvider.js
const vscode = require('vscode');

const { buildFileSearchHtml } = require('./fileSearchHtml');
const { collectAllEntries } = require('../tree/projectFileScanner');
const ExtensionState = require('../core/extensionState');





class FileSearchProvider {
	constructor(extensionUri, workspaceRootPath, onExclusionChanged) {
		this.extensionUri = extensionUri;
		this.workspaceRootPath = workspaceRootPath;
		this.onExclusionChanged = onExclusionChanged;
		this.view = null;
	}

	resolveWebviewView(webviewView) {
		this.view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		webviewView.webview.html = buildFileSearchHtml();

		webviewView.webview.onDidReceiveMessage((message) => {
			if (message.type === 'requestFileEntries') {
				this.sendFileEntries();
			}
			
			if (message.type === 'toggleFileExclusion') {
				const extensionState = ExtensionState.getInstance();
				extensionState.setExcluded(message.relativePath, !message.currentlyExcluded);
				this.sendFileEntries();
				if (this.onExclusionChanged) {
					this.onExclusionChanged();
				}
			}

			if (message.type === 'toggleFileSelection') {
				const extensionState = ExtensionState.getInstance();
				extensionState.setExcluded(message.relativePath, !message.currentlySelected);
				this.sendFileEntries();
				
				if (this.onExclusionChanged) {
					this.onExclusionChanged();
				}
			}
		});
	}

	sendFileEntries() {
		if (!this.view) {
			return;
		}

		const extensionState = ExtensionState.getInstance();
		const entries = collectAllEntries(this.workspaceRootPath);
		const payload = entries.map((relativePath) => ({
			relativePath,
			excluded: extensionState.isExcluded(relativePath),
		}));
		this.view.webview.postMessage({ type: 'fileEntries', entries: payload });
	}

	refresh() {
		this.sendFileEntries();
	}
}





module.exports = FileSearchProvider;