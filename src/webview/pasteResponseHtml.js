// src/webview/pasteResponseHtml.js
const { SHARED_STYLES } = require('./webviewStyles');





function buildPasteResponseHtml() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
	<style>${SHARED_STYLES}
		.uc-modal {
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 12px;
			height: calc(100vh - 32px);
		}
		.uc-modal-title {
			font-size: 14px;
			font-weight: 600;
		}
		.uc-modal-hint {
			color: var(--uc-text-secondary);
		}
		#uc-response-field {
			flex: 1;
			width: 100%;
			font-family: var(--vscode-editor-font-family, monospace);
		}
		.uc-modal-actions {
			display: flex;
			justify-content: flex-end;
			gap: 10px;
		}
	</style>
</head>
<body>
	<div class="uc-modal">
		<div class="uc-modal-title">Paste the AI response</div>
		<div class="uc-modal-hint">Paste the full response containing the @@COMMAND blocks below.</div>
		<textarea id="uc-response-field" autofocus></textarea>
		<div class="uc-modal-actions">
			<button id="uc-cancel-button">Cancel</button>
			<button class="uc-primary" id="uc-accept-button">Accept</button>
		</div>
	</div>
	<script>
		const vscodeApi = acquireVsCodeApi();
		const responseField = document.getElementById('uc-response-field');
		const acceptButton = document.getElementById('uc-accept-button');
		const cancelButton = document.getElementById('uc-cancel-button');

		acceptButton.addEventListener('click', () => {
			vscodeApi.postMessage({ type: 'acceptResponse', responseText: responseField.value });
		});

		cancelButton.addEventListener('click', () => {
			vscodeApi.postMessage({ type: 'cancelResponse' });
		});
	</script>
</body>
</html>`;
}

module.exports = {
	buildPasteResponseHtml,
};