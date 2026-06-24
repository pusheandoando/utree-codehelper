// src/webview/controlPanelProvider.js
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
				this.onSubmitNewChange(message.userInstructions);
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