// src/webview/diffReviewHtml.js
const { SHARED_STYLES } = require('./webviewStyles');





function escapeHtml(rawText) {
	return rawText
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/_/g, '&#95;');
}

function describeCommand(command) {
	switch (command.type) {
		case 'CREATE_SCRIPT':
			return { label: 'Create script', path: command.path, oldText: '', newText: command.content || '' };
		case 'DELETE_SCRIPT':
			return { label: 'Delete script', path: command.path, oldText: '(file will be removed)', newText: '' };
		case 'CREATE_FOLDER':
			return { label: 'Create folder', path: command.path, oldText: '', newText: '(folder will be created)' };
		case 'DELETE_FOLDER':
			return { label: 'Delete folder', path: command.path, oldText: '(folder will be removed)', newText: '' };
		case 'REPLACE_FRAGMENT':
			return { label: 'Replace fragment', path: command.path, oldText: command.startMarker, newText: command.newContent || '' };
		default:
			return { label: command.type, path: command.path, oldText: '', newText: '' };
	}
}

function buildDiffReviewHtml(commands, sessionDatetime) {
	const titleSuffix = sessionDatetime ? ` (${sessionDatetime})` : '';
	const isReadOnly = Boolean(sessionDatetime);

	const cardsMarkup = commands
		.map((command, i) => {
			const hasError = Boolean(command.parseError);
			const d = describeCommand(command);

			const diffSection = hasError
				? `<div class="uc-parse-error">Parse error: ${escapeHtml(command.parseError)}</div>`
				: `<div class="uc-diff-columns">
				<div class="uc-diff-block uc-diff-old">
					<div class="uc-diff-block-title">Before</div>
					<pre>${escapeHtml(d.oldText)}</pre>
				</div>
				<div class="uc-diff-block uc-diff-new">
					<div class="uc-diff-block-title">After</div>
					<pre>${escapeHtml(d.newText)}</pre>
				</div>
			</div>`;

			const switchHtml = isReadOnly
				? ''
				: hasError
					? `<span class="uc-parse-error-badge">Cannot apply</span>`
					: `<div class="uc-switch-wrapper">
					<label class="uc-switch">
						<input type="checkbox" class="uc-switch-input" data-index="${i}" checked>
						<span class="uc-switch-track"></span>
					</label>
					<span class="uc-switch-state-label" id="uc-switch-label-${i}">Apply</span>
				</div>`;

			return `
		<div class="uc-card${hasError ? ' uc-card-error' : ''}" id="uc-card-${i}">
			<div class="uc-card-header">
				<div class="uc-card-meta">
					<div class="uc-card-meta-top">
						<span class="uc-card-index">${i + 1}</span>
						<span class="uc-card-label">${escapeHtml(d.label)}</span>
					</div>
					<code class="uc-card-path">${escapeHtml(d.path || '')}</code>
				</div>
				${switchHtml}
			</div>
			${diffSection}
			<div class="uc-card-status" id="uc-status-${i}"></div>
		</div>`;
		})
		.join('\n');

	const totalCount = commands.length;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
	<style>${SHARED_STYLES}
		body {
			padding: 16px 16px 80px;
		}
		.uc-page-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
		}
		.uc-page-title {
			font-size: 13px;
			font-weight: 600;
			color: var(--uc-text-primary);
		}
		.uc-page-count {
			font-size: 12px;
			color: var(--uc-text-secondary);
		}
		.uc-card {
			border: 1px solid var(--uc-border);
			border-radius: var(--uc-radius);
			margin-bottom: 14px;
			overflow: hidden;
			transition: opacity 0.2s;
		}
		.uc-card.uc-card-skipped {
			opacity: 0.4;
		}
		.uc-card.uc-card-done {
			border-color: var(--uc-success);
		}
		.uc-card.uc-card-failed {
			border-color: var(--uc-danger);
		}
		.uc-card.uc-card-error {
			border-color: var(--uc-danger);
			opacity: 0.7;
		}
		.uc-card-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 12px;
			background-color: var(--uc-bg-panel);
			border-bottom: 1px solid var(--uc-border);
			gap: 12px;
		}
		.uc-card-meta {
			display: flex;
			flex-direction: column;
			gap: 3px;
			min-width: 0;
		}
		.uc-card-meta-top {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.uc-card-index {
			font-size: 11px;
			font-weight: 700;
			color: var(--uc-text-secondary);
			background-color: var(--uc-bg-input);
			border-radius: 50%;
			width: 20px;
			height: 20px;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
		.uc-card-label {
			font-weight: 600;
			font-size: 12px;
			flex-shrink: 0;
		}
		.uc-card-path {
			color: var(--uc-text-secondary);
			font-family: var(--vscode-editor-font-family, monospace);
			font-size: 11px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			background: none;
			border: none;
			padding: 0;
		}
		.uc-parse-error-badge {
			font-size: 11px;
			color: var(--uc-danger);
			border: 1px solid var(--uc-danger);
			border-radius: var(--uc-radius);
			padding: 2px 8px;
			flex-shrink: 0;
		}
		.uc-parse-error {
			padding: 10px 12px;
			font-size: 12px;
			color: var(--uc-danger);
			font-family: var(--vscode-editor-font-family, monospace);
		}
		.uc-switch-wrapper {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
			flex-shrink: 0;
		}
		.uc-switch {
			display: flex;
			align-items: center;
			cursor: pointer;
			user-select: none;
		}
		.uc-switch-input {
			position: absolute;
			opacity: 0;
			width: 0;
			height: 0;
		}
		.uc-switch-track {
			position: relative;
			width: 32px;
			height: 18px;
			background-color: var(--uc-border);
			border-radius: 9px;
			transition: background-color 0.2s;
			flex-shrink: 0;
		}
		.uc-switch-track::after {
			content: '';
			position: absolute;
			top: 3px;
			left: 3px;
			width: 12px;
			height: 12px;
			background-color: var(--uc-text-secondary);
			border-radius: 50%;
			transition: transform 0.2s, background-color 0.2s;
		}
		.uc-switch-input:checked + .uc-switch-track {
			background-color: var(--uc-accent);
		}
		.uc-switch-input:checked + .uc-switch-track::after {
			transform: translateX(14px);
			background-color: #fff;
		}
		.uc-switch-state-label {
			font-size: 10px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--uc-text-secondary);
		}
		.uc-switch-state-label.is-apply {
			color: var(--uc-accent);
		}
		.uc-diff-columns {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
		.uc-diff-block {
			padding: 10px 12px;
			border-left: 3px solid transparent;
			min-height: 48px;
		}
		.uc-diff-old {
			border-left-color: var(--uc-danger);
			border-right: 1px solid var(--uc-border);
		}
		.uc-diff-new {
			border-left-color: var(--uc-success);
		}
		.uc-diff-block-title {
			color: var(--uc-text-secondary);
			font-size: 11px;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			margin-bottom: 6px;
		}
		pre {
			margin: 0;
			white-space: pre-wrap;
			word-break: break-word;
			font-family: var(--vscode-editor-font-family, monospace);
			font-size: 12px;
		}
		.uc-card-status {
			font-size: 11px;
			padding: 0;
			height: 0;
			overflow: hidden;
			transition: height 0.15s, padding 0.15s;
		}
		.uc-card-status.uc-visible {
			height: auto;
			padding: 6px 12px;
		}
		.uc-card-status.uc-status-ok {
			color: var(--uc-success);
			background-color: var(--uc-bg-panel);
		}
		.uc-card-status.uc-status-err {
			color: var(--uc-danger);
			background-color: var(--uc-bg-panel);
		}
		.uc-footer {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			padding: 12px 16px;
			background-color: var(--uc-bg-base);
			border-top: 1px solid var(--uc-border);
			display: flex;
			justify-content: flex-end;
			align-items: center;
			gap: 12px;
		}
		.uc-footer-count {
			font-size: 12px;
			color: var(--uc-text-secondary);
		}
		#uc-apply-button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	</style>
</head>
<body>
	<div class="uc-page-header">
		<span class="uc-page-title">Review Changes${titleSuffix}</span>
		<span class="uc-page-count">${totalCount} change${totalCount !== 1 ? 's' : ''}</span>
	</div>

	<div id="uc-cards">${cardsMarkup}</div>

	${isReadOnly ? '' : `<div class="uc-footer">
		<span class="uc-footer-count" id="uc-footer-count"></span>
		<button class="uc-primary" id="uc-apply-button">Apply selected</button>
	</div>`}

	<script>
		const vscodeApi = acquireVsCodeApi();
		const isReadOnly = ${isReadOnly};
		const total = ${totalCount};

		function getSelectedIndices() {
			return Array.from(document.querySelectorAll('.uc-switch-input:checked'))
				.map((el) => Number(el.dataset.index));
		}

		function updateSwitchLabel(index, checked) {
			const label = document.getElementById('uc-switch-label-' + index);
			if (!label) {
				return;
			}
			if (checked) {
				label.textContent = 'Apply';
				label.classList.add('is-apply');
			} else {
				label.textContent = 'Skip';
				label.classList.remove('is-apply');
			}
		}

		function updateFooterCount() {
			const selected = getSelectedIndices().length;
			const countEl = document.getElementById('uc-footer-count');
			const applyBtn = document.getElementById('uc-apply-button');
			countEl.textContent = selected + ' of ' + total + ' selected';
			applyBtn.disabled = selected === 0;
		}

		function markCardDone(index) {
			const card = document.getElementById('uc-card-' + index);
			const status = document.getElementById('uc-status-' + index);
			card.classList.add('uc-card-done');
			status.textContent = 'Applied';
			status.classList.add('uc-visible', 'uc-status-ok');
		}

		function markCardFailed(index, errorMessage) {
			const card = document.getElementById('uc-card-' + index);
			const status = document.getElementById('uc-status-' + index);
			card.classList.add('uc-card-failed');
			status.textContent = 'Failed: ' + errorMessage;
			status.classList.add('uc-visible', 'uc-status-err');
		}

		function markCardSkipped(index) {
			const card = document.getElementById('uc-card-' + index);
			if (!card.classList.contains('uc-card-done') && !card.classList.contains('uc-card-failed')) {
				card.classList.add('uc-card-skipped');
			}
		}

		if (!isReadOnly) {
			document.querySelectorAll('.uc-switch-input').forEach((checkbox) => {
				updateSwitchLabel(Number(checkbox.dataset.index), checkbox.checked);

				checkbox.addEventListener('change', () => {
					const index = Number(checkbox.dataset.index);
					const card = document.getElementById('uc-card-' + index);
					updateSwitchLabel(index, checkbox.checked);
					if (checkbox.checked) {
						card.classList.remove('uc-card-skipped');
					} else {
						card.classList.add('uc-card-skipped');
					}
					updateFooterCount();
				});
			});

			document.getElementById('uc-apply-button').addEventListener('click', () => {
				const selectedIndices = getSelectedIndices();
				if (selectedIndices.length === 0) {
					return;
				}
				document.getElementById('uc-apply-button').disabled = true;
				vscodeApi.postMessage({ type: 'applySelected', indices: selectedIndices });
			});

			updateFooterCount();
		}

		window.addEventListener('message', (event) => {
			const message = event.data;
			if (message.type === 'stepDone') {
				markCardDone(message.index);
			}
			if (message.type === 'stepFailed') {
				markCardFailed(message.index, message.error);
				document.getElementById('uc-apply-button').disabled = false;
			}
			if (message.type === 'applyComplete') {
				const allSwitches = Array.from(document.querySelectorAll('.uc-switch-input'));
				allSwitches.forEach((sw) => {
					if (!sw.checked) {
						markCardSkipped(Number(sw.dataset.index));
					}
				});
				vscodeApi.postMessage({ type: 'applyComplete' });
			}
		});

		</script>
</body>
</html>`;
}

module.exports = {
	buildDiffReviewHtml,
};