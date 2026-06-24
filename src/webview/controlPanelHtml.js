// src/webview/controlPanelHtml.js
const { SHARED_STYLES } = require('./webviewStyles');





function buildControlPanelHtml(webview) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
	<style>${SHARED_STYLES}
		.uc-panel {
			padding: 14px;
			display: flex;
			flex-direction: column;
			gap: 14px;
		}
		.uc-input-label {
			display: block;
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--uc-text-secondary);
			margin-bottom: 6px;
		}
		#uc-instructions {
			width: 100%;
			min-height: 140px;
			resize: vertical;
			box-sizing: border-box;
		}
		.uc-actions {
			display: flex;
			justify-content: flex-end;
		}
	</style>
</head>
<body>
	<div class="uc-panel">
		<div>
			<label class="uc-input-label" for="uc-instructions">Requested changes</label>
			<textarea id="uc-instructions" placeholder="Describe the problem, implementation or change you want the AI to perform..."></textarea>
		</div>
		<div class="uc-actions">
			<button class="uc-primary" id="uc-new-change-button">(+) New change</button>
		</div>
	</div>
	<script>
		const vscodeApi = acquireVsCodeApi();
		const newChangeButton = document.getElementById('uc-new-change-button');
		const instructionsField = document.getElementById('uc-instructions');

		newChangeButton.addEventListener('click', () => {
			vscodeApi.postMessage({
				type: 'submitNewChange',
				userInstructions: instructionsField.value,
			});
		});
	</script>
</body>
</html>`;
}

module.exports = {
	buildControlPanelHtml,
};