// src/webview/webviewStyles.js





const SHARED_STYLES = `
:root {
	--uc-bg-base: #1a1d23;
	--uc-bg-panel: #22262e;
	--uc-bg-input: #1e2127;
	--uc-border: #343a45;
	--uc-text-primary: #e4e6eb;
	--uc-text-secondary: #8b919c;
	--uc-accent: #5b8def;
	--uc-accent-hover: #4a7bd9;
	--uc-danger: #e05c5c;
	--uc-success: #4caf7d;
	--uc-radius: 4px;
}

* {
	box-sizing: border-box;
}

body {
	margin: 0;
	padding: 0;
	background-color: var(--uc-bg-base);
	color: var(--uc-text-primary);
	font-family: var(--vscode-font-family, sans-serif);
	font-size: 13px;
}

button {
	font-family: inherit;
	font-size: 12px;
	font-weight: 600;
	border: 1px solid var(--uc-border);
	border-radius: var(--uc-radius);
	background-color: var(--uc-bg-panel);
	color: var(--uc-text-primary);
	padding: 6px 14px;
	cursor: pointer;
}

button:hover {
	background-color: var(--uc-border);
}

button.uc-primary {
	background-color: var(--uc-accent);
	border-color: var(--uc-accent);
	color: #ffffff;
}

button.uc-primary:hover {
	background-color: var(--uc-accent-hover);
}

button.uc-danger {
	background-color: transparent;
	border-color: var(--uc-danger);
	color: var(--uc-danger);
}

textarea, input {
	font-family: inherit;
	font-size: 13px;
	background-color: var(--uc-bg-input);
	color: var(--uc-text-primary);
	border: 1px solid var(--uc-border);
	border-radius: var(--uc-radius);
	padding: 8px;
}

textarea:focus, input:focus {
	outline: 1px solid var(--uc-accent);
	outline-offset: -1px;
}
`;

module.exports = {
	SHARED_STYLES,
};