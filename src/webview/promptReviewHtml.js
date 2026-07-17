// src/webview/promptReviewHtml.js
const { SHARED_STYLES } = require('./webviewStyles');





function escapeHtml(rawText) {
	return rawText
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function buildPromptReviewHtml(generatedPrompt) {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
	<style>${SHARED_STYLES}
		body {
			padding: 0;
		}
		.uc-prompt-modal {
			display: flex;
			flex-direction: column;
			height: 100vh;
			padding: 16px;
			gap: 12px;
		}
		.uc-prompt-header {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: flex-start;
			gap: 8px;
			flex-wrap: wrap;
		}
		.uc-prompt-header-left {
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: 0;
		}
		.uc-prompt-title {
			font-size: 14px;
			font-weight: 600;
		}
		.uc-prompt-hint {
			color: var(--uc-text-secondary);
			font-size: 12px;
		}
		.uc-token-count {
			font-size: 12px;
			color: var(--uc-text-secondary);
			white-space: nowrap;
			padding-top: 2px;
			flex-shrink: 0;
		}
		.uc-token-count span {
			color: var(--uc-text-primary);
			font-weight: 600;
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
			right: 24px;
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
		.uc-line-numbers {
			padding: 8px 6px 8px 8px;
			background-color: var(--uc-bg-panel);
			color: var(--uc-text-secondary);
			font-family: var(--vscode-editor-font-family, monospace);
			font-size: 13px;
			line-height: 1.5;
			text-align: right;
			user-select: none;
			overflow: hidden;
			min-width: 36px;
			white-space: pre;
			border-right: 1px solid var(--uc-border);
		}
		#uc-prompt-field {
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
		#uc-prompt-field:focus {
			outline: none;
		}
		.uc-prompt-actions {
			display: flex;
			justify-content: flex-end;
			gap: 10px;
		}
	</style>
</head>
<body>
	<div class="uc-prompt-modal">
		<div class="uc-prompt-header">
			<div class="uc-prompt-header-left">
				<div class="uc-prompt-title">Generated prompt</div>
				<div class="uc-prompt-hint">Edit freely, then copy &amp; paste into the AI model.</div>
			</div>
			<div class="uc-token-count">~<span id="uc-token-display">0</span> tokens</div>
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
			<div class="uc-line-numbers" id="uc-line-numbers">1</div>
			<textarea id="uc-prompt-field" spellcheck="false">${escapeHtml(generatedPrompt)}</textarea>
		</div>
		<div class="uc-prompt-actions">
			<button id="uc-reload-button">Reload</button>
			<button class="uc-primary" id="uc-apply-button">Apply changes</button>
		</div>
	</div>
	<script>
		const vscodeApi = acquireVsCodeApi();
		const promptField = document.getElementById('uc-prompt-field');
		const lineNumbersEl = document.getElementById('uc-line-numbers');
		const tokenDisplay = document.getElementById('uc-token-display');
		const copyBtn = document.getElementById('uc-copy-btn');

		function rebuildLineNumbers() {
			const lineCount = promptField.value.split('\\n').length;
			const numbers = [];
			for (let i = 1; i <= lineCount; i++) {
				numbers.push(i);
			}
			lineNumbersEl.textContent = numbers.join('\\n');
		}

		function updateTokenCount() {
			const charCount = promptField.value.length;
			const tokens = Math.round(charCount / 4);
			let display;
			if (tokens >= 1000000) {
				display = (tokens / 1000000).toFixed(2).replace(/\\.?0+$/, '') + 'M';
			} else {
				display = tokens.toLocaleString();
			}
			tokenDisplay.textContent = display;
		}

		function syncScroll() {
			lineNumbersEl.scrollTop = promptField.scrollTop;
		}

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

		promptField.addEventListener('input', () => {
			rebuildLineNumbers();
			updateTokenCount();
		});
		promptField.addEventListener('scroll', syncScroll);

		document.getElementById('uc-reload-button').addEventListener('click', () => {
			vscodeApi.postMessage({ type: 'reloadPrompt' });
		});

		document.getElementById('uc-apply-button').addEventListener('click', () => {
			vscodeApi.postMessage({ type: 'openApplyChanges' });
		});

		window.addEventListener('message', (event) => {
			const message = event.data;
			if (message.type === 'setPromptText') {
				promptField.value = message.promptText;
				rebuildLineNumbers();
				updateTokenCount();
			}
		});

		rebuildLineNumbers();
		updateTokenCount();
	</script>
</body>
</html>`;
}





module.exports = {
	buildPromptReviewHtml,
};