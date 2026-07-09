// src/webview/commitPromptHtml.js
const { SHARED_STYLES } = require('./webviewStyles');





function escapeHtml(rawText) {
	return rawText
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function buildCommitPromptHtml(commitPrompt) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
	<style>${SHARED_STYLES}
		body {
			padding: 0;
		}
		.uc-commit-modal {
			display: flex;
			flex-direction: column;
			height: 100vh;
			padding: 16px;
			gap: 12px;
		}
		.uc-commit-header {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.uc-commit-title {
			font-size: 14px;
			font-weight: 600;
		}
		.uc-commit-hint {
			color: var(--uc-text-secondary);
			font-size: 12px;
		}
		.uc-editor-wrapper {
			flex: 1;
			display: flex;
			min-height: 0;
			border: 1px solid var(--uc-border);
			border-radius: var(--uc-radius);
			overflow: hidden;
			background-color: var(--uc-bg-input);
			position: relative;
		}
		.uc-copy-btn {
			position: absolute;
			top: 8px;
			right: 20px;
			z-index: 10;
			background-color: var(--uc-bg-panel);
			border: 1px solid var(--uc-border);
			padding: 5px 7px;
			cursor: pointer;
			color: var(--uc-text-secondary);
			border-radius: var(--uc-radius);
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0.85;
			transition: opacity 0.15s, color 0.15s;
		}
		.uc-copy-btn:hover {
			opacity: 1;
			color: var(--uc-text-primary);
			background-color: var(--uc-border);
		}
		.uc-copy-btn svg {
			width: 14px;
			height: 14px;
			fill: currentColor;
		}
		#uc-commit-prompt-field {
			flex: 1;
			min-height: 0;
			width: 100%;
			font-family: var(--vscode-editor-font-family, monospace);
			white-space: pre;
			overflow-y: scroll;
			resize: none;
			border: none;
			border-radius: 0;
			padding: 8px;
			line-height: 1.5;
			background-color: var(--uc-bg-input);
			color: var(--uc-text-primary);
		}
		#uc-commit-prompt-field:focus {
			outline: none;
		}
	</style>
</head>
<body>
	<div class="uc-commit-modal">
		<div class="uc-commit-header">
			<div class="uc-commit-title">Git commit prompt</div>
			<div class="uc-commit-hint">Copy this and paste it into the AI model to get an ideal git commit -m message for this change.</div>
		</div>
		<div class="uc-editor-wrapper">
			<button class="uc-copy-btn" id="uc-copy-btn" title="Copy prompt">
				<svg id="uc-icon-copy" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
					<path d="M4 2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h7v-1H2V6h-.5A.5.5 0 0 1 2 5z"/>
				</svg>
				<svg id="uc-icon-check" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style="display:none;">
					<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
				</svg>
			</button>
			<textarea id="uc-commit-prompt-field" spellcheck="false">${escapeHtml(commitPrompt)}</textarea>
		</div>
	</div>
	<script>
		const promptField = document.getElementById('uc-commit-prompt-field');
		const copyBtn = document.getElementById('uc-copy-btn');
		const iconCopy = document.getElementById('uc-icon-copy');
		const iconCheck = document.getElementById('uc-icon-check');
		let copyResetTimer = null;

		copyBtn.addEventListener('click', () => {
			navigator.clipboard.writeText(promptField.value).catch(() => {
				promptField.select();
				document.execCommand('copy');
			});
			iconCopy.style.display = 'none';
			iconCheck.style.display = '';
			copyBtn.style.color = 'var(--uc-success)';
			if (copyResetTimer) {
				clearTimeout(copyResetTimer);
			}
			copyResetTimer = setTimeout(() => {
				iconCheck.style.display = 'none';
				iconCopy.style.display = '';
				copyBtn.style.color = '';
				copyResetTimer = null;
			}, 2000);
		});
	</script>
</body>
</html>`;
}

module.exports = {
	buildCommitPromptHtml,
};