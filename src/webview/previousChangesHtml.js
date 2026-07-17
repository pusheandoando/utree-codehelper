// src/webview/previousChangesHtml.js
const { SHARED_STYLES } = require('./webviewStyles');





function escapeHtml(rawText) {
	return String(rawText)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}


function buildPreviousChangesHtml(sessions) {
	const hasEntries = sessions.length > 0;

	const listMarkup = hasEntries
		? sessions.map((session, i) => {
			const label = escapeHtml(session.datetime.toLocaleString());
			const commandCount = session.commands.length;
			const subtitle = `${commandCount} change${commandCount !== 1 ? 's' : ''}`;
			return `<div class="uc-log-item" data-index="${i}" tabindex="0" role="button">
				<div class="uc-log-datetime">${label}</div>
				<div class="uc-log-subtitle">${escapeHtml(subtitle)}</div>
			</div>`;
		}).join('\n')
		: `<div class="uc-empty">No previous changes recorded for this project.</div>`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
	<style>${SHARED_STYLES}
		.uc-prev-panel {
			padding: 14px;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.uc-prev-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.uc-prev-title {
			font-size: 11px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--uc-text-secondary);
		}
		.uc-clear-btn {
			font-size: 11px;
			padding: 3px 8px;
			background: transparent;
			border-color: var(--uc-danger);
			color: var(--uc-danger);
		}
		.uc-clear-btn:hover {
			background-color: rgba(224, 92, 92, 0.1);
		}
		.uc-log-list {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}
		.uc-log-item {
			padding: 8px 10px;
			border: 1px solid var(--uc-border);
			border-radius: var(--uc-radius);
			cursor: pointer;
			background-color: var(--uc-bg-panel);
			transition: border-color 0.15s, background-color 0.15s;
		}
		.uc-log-item:hover,
		.uc-log-item:focus {
			border-color: var(--uc-accent);
			background-color: var(--uc-bg-input);
			outline: none;
		}
		.uc-log-datetime {
			font-size: 12px;
			color: var(--uc-text-primary);
		}
		.uc-log-subtitle {
			font-size: 11px;
			color: var(--uc-text-secondary);
			margin-top: 2px;
		}
		.uc-empty {
			font-size: 12px;
			color: var(--uc-text-secondary);
			padding: 8px 0;
		}

		/* confirmation overlay */
		.uc-confirm-overlay {
			display: none;
			position: fixed;
			inset: 0;
			background-color: rgba(0,0,0,0.6);
			align-items: center;
			justify-content: center;
			z-index: 100;
		}
		.uc-confirm-overlay.visible {
			display: flex;
		}
		.uc-confirm-box {
			background-color: var(--uc-bg-panel);
			border: 1px solid var(--uc-border);
			border-radius: var(--uc-radius);
			padding: 20px;
			max-width: 280px;
			display: flex;
			flex-direction: column;
			gap: 14px;
		}
		.uc-confirm-title {
			font-size: 13px;
			font-weight: 600;
			color: var(--uc-text-primary);
		}
		.uc-confirm-body {
			font-size: 12px;
			color: var(--uc-text-secondary);
			line-height: 1.5;
		}
		.uc-confirm-actions {
			display: flex;
			justify-content: flex-end;
			gap: 8px;
		}
	</style>
</head>
<body>
	<div class="uc-prev-panel">
		<div class="uc-prev-header">
			<span class="uc-prev-title">Previous changes</span>
			${hasEntries ? '<button class="uc-clear-btn" id="uc-clear-btn">Clear logs</button>' : ''}
		</div>
		<div class="uc-log-list">
			${listMarkup}
		</div>
	</div>

	<div class="uc-confirm-overlay" id="uc-confirm-overlay">
		<div class="uc-confirm-box">
			<div class="uc-confirm-title">Clear all logs?</div>
			<div class="uc-confirm-body">This will permanently delete all recorded change history for this project. This cannot be undone.</div>
			<div class="uc-confirm-actions">
				<button id="uc-confirm-cancel">Cancel</button>
				<button class="uc-danger" id="uc-confirm-accept">Delete</button>
			</div>
		</div>
	</div>

	<script>
		const vscodeApi = acquireVsCodeApi();

		document.querySelectorAll('.uc-log-item').forEach((item) => {
			const activate = () => {
				vscodeApi.postMessage({ type: 'openSession', index: Number(item.dataset.index) });
			};
			item.addEventListener('click', activate);
			item.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					activate();
				}
			});
		});

		const clearBtn = document.getElementById('uc-clear-btn');
		const overlay = document.getElementById('uc-confirm-overlay');
		const cancelBtn = document.getElementById('uc-confirm-cancel');
		const acceptBtn = document.getElementById('uc-confirm-accept');

		if (clearBtn) {
			clearBtn.addEventListener('click', () => {
				overlay.classList.add('visible');
			});
		}

		if (cancelBtn) {
			cancelBtn.addEventListener('click', () => {
				overlay.classList.remove('visible');
			});
		}

		if (acceptBtn) {
			acceptBtn.addEventListener('click', () => {
				overlay.classList.remove('visible');
				vscodeApi.postMessage({ type: 'clearLogs' });
			});
		}
	</script>
</body>
</html>`;
}





module.exports = {
	buildPreviousChangesHtml,
};