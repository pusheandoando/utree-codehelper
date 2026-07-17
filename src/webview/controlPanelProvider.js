// src/webview/controlPanelProvider.js
const vscode = require('vscode');

const { buildControlPanelHtml } = require('./controlPanelHtml');





class ControlPanelProvider {
	constructor(extensionUri, onSubmitNewChange) {
		this.extensionUri = extensionUri;
		this.onSubmitNewChange = onSubmitNewChange;
		this.view = null;
	}

	resolveWebviewView(webviewView) {
		this.view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		this.render();

		webviewView.webview.onDidReceiveMessage((message) => {
			if (message.type === 'submitNewChange') {
				Promise.resolve(this.onSubmitNewChange(message.userInstructions)).catch((error) => {
					vscode.window.showErrorMessage(`Failed to generate prompt: ${error.message}`);
				});
			}
		});
	}

	render() {
		if (!this.view) {
			return;
		}

		this.view.webview.html = buildControlPanelHtml(this.view.webview);
	}

	refresh() {
		this.render();
	}
}





module.exports = ControlPanelProvider;