// src/webview/fileSearchHtml.js
const { SHARED_STYLES } = require('./webviewStyles');





const PAGE_SIZE = 10;

function buildFileSearchHtml() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
	<style>${SHARED_STYLES}
		.uc-search-panel {
			padding: 10px 14px 14px;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		#uc-file-search {
			width: 100%;
			box-sizing: border-box;
		}
		.uc-search-results {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.uc-search-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 5px 8px;
			border: 1px solid var(--uc-border);
			border-radius: var(--uc-radius);
			background-color: var(--uc-bg-panel);
			cursor: pointer;
			gap: 8px;
		}
		.uc-search-item:hover {
			border-color: var(--uc-accent);
			background-color: var(--uc-bg-input);
		}
		.uc-search-item-path {
			font-family: var(--vscode-editor-font-family, monospace);
			font-size: 11px;
			color: var(--uc-text-primary);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			flex: 1;
			min-width: 0;
		}
		.uc-search-item-badge {
			font-size: 10px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			flex-shrink: 0;
			padding: 1px 5px;
			border-radius: var(--uc-radius);
		}
		.uc-search-item-badge.selected {
			color: var(--uc-danger);
			border: 1px solid var(--uc-danger);
		}
		.uc-search-item-badge.not-selected {
			color: var(--uc-text-secondary);
			border: 1px solid var(--uc-border);
		}
		.uc-search-empty {
			font-size: 12px;
			color: var(--uc-text-secondary);
			padding: 4px 0;
		}
		.uc-load-more {
			font-size: 11px;
			color: var(--uc-text-secondary);
			text-align: center;
			padding: 6px 0 2px;
		}
	</style>
</head>
<body>
	<div class="uc-search-panel">
		<input type="text" id="uc-file-search" placeholder="Search files to include/exclude..." autocomplete="off" />
		<div class="uc-search-results" id="uc-search-results"></div>
		<div class="uc-load-more" id="uc-load-more" style="display:none;"></div>
	</div>
	<script>
		const vscodeApi = acquireVsCodeApi();
		const fileSearchField = document.getElementById('uc-file-search');
		const searchResultsEl = document.getElementById('uc-search-results');
		const loadMoreEl = document.getElementById('uc-load-more');
		const PAGE_SIZE = ${PAGE_SIZE};

		let allEntries = [];
		let currentMatches = [];
		let visibleCount = 0;

		fileSearchField.addEventListener('input', () => {
			const term = fileSearchField.value.trim().toLowerCase();
			currentMatches = term
				? allEntries.filter((entry) => entry.relativePath.toLowerCase().includes(term))
				: [];
			visibleCount = 0;
			searchResultsEl.innerHTML = '';
			renderNextPage();
		});

		function renderNextPage() {
			if (currentMatches.length === 0 && visibleCount === 0) {
				const term = fileSearchField.value.trim();
				if (term) {
					const empty = document.createElement('div');
					empty.className = 'uc-search-empty';
					empty.textContent = 'No matches found.';
					searchResultsEl.appendChild(empty);
				}
				loadMoreEl.style.display = 'none';
				return;
			}

			const slice = currentMatches.slice(visibleCount, visibleCount + PAGE_SIZE);
			slice.forEach((entry) => {
				searchResultsEl.appendChild(buildResultItem(entry));
			});
			visibleCount += slice.length;

			const remaining = currentMatches.length - visibleCount;
			if (remaining > 0) {
				loadMoreEl.style.display = 'block';
				loadMoreEl.textContent = remaining + ' more - scroll down to load';
			} else {
				loadMoreEl.style.display = 'none';
			}
		}

		function buildResultItem(entry) {
			const item = document.createElement('div');
			item.className = 'uc-search-item';

			const pathEl = document.createElement('span');
			pathEl.className = 'uc-search-item-path';
			pathEl.textContent = entry.relativePath;
			pathEl.title = entry.relativePath;

			const badge = document.createElement('span');
			badge.className = 'uc-search-item-badge ' + (entry.excluded ? 'selected' : 'not-selected');
			badge.textContent = entry.excluded ? 'excluded' : 'included';

			item.appendChild(pathEl);
			item.appendChild(badge);

			item.addEventListener('click', () => {
				vscodeApi.postMessage({
					type: 'toggleFileSelection',
					relativePath: entry.relativePath,
					currentlySelected: entry.excluded,
				});
			});

			return item;
		}

		// Infinite scroll: observe the load-more sentinel element.
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && visibleCount < currentMatches.length) {
				renderNextPage();
			}
		}, { threshold: 0.1 });
		observer.observe(loadMoreEl);

		window.addEventListener('message', (event) => {
			const message = event.data;
			if (message.type === 'fileEntries') {
				allEntries = message.entries;
				const term = fileSearchField.value.trim().toLowerCase();
				currentMatches = term
					? allEntries.filter((entry) => entry.relativePath.toLowerCase().includes(term))
					: [];
				visibleCount = 0;
				searchResultsEl.innerHTML = '';
				renderNextPage();
			}
		});

		vscodeApi.postMessage({ type: 'requestFileEntries' });
	</script>
</body>
</html>`;
}

module.exports = {
	buildFileSearchHtml,
};