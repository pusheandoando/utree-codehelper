// src/core/constants.js





const STORAGE_FOLDER_NAME = '.utree_codehelper';
const BINARY_SUBFOLDER_NAME = 'code';
const BINARY_FILE_NAME = 'utree';

const GITHUB_OWNER = 'pusheandoando';
const GITHUB_REPO = 'utree';
const GITHUB_RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

const COMMAND_OPEN_SIDEBAR = 'utree-codehelper.openSidebar';
const COMMAND_NEW_CHANGE = 'utree-codehelper.newChange';
const COMMAND_APPLY_CHANGES = 'utree-codehelper.applyChanges';
const COMMAND_REFRESH_FILE_TREE = 'utree-codehelper.refreshFileTree';
const COMMAND_TOGGLE_TREE_ITEM = 'utree-codehelper.toggleTreeItem';

const VIEW_TREE_SELECTION = 'utreeCodehelperTreeSelection';
const VIEW_FILE_SEARCH = 'utreeCodehelperFileSearch';
const VIEW_CONTROL_PANEL = 'utreeCodehelperControlPanel';
const VIEW_PREVIOUS_CHANGES = 'utreeCodehelperPreviousChanges';

const WEBVIEW_MESSAGE_TYPE = {
	REQUEST_SUMMARY: 'requestSummary',
	SUMMARY_DATA: 'summaryData',
	SUBMIT_NEW_CHANGE: 'submitNewChange',
	OPEN_APPLY_MODAL: 'openApplyModal',
};

module.exports = {
	STORAGE_FOLDER_NAME,
	BINARY_SUBFOLDER_NAME,
	BINARY_FILE_NAME,
	GITHUB_RELEASES_API_URL,
	COMMAND_OPEN_SIDEBAR,
	COMMAND_NEW_CHANGE,
	COMMAND_APPLY_CHANGES,
	COMMAND_REFRESH_FILE_TREE,
	COMMAND_TOGGLE_TREE_ITEM,
	VIEW_TREE_SELECTION,
	VIEW_FILE_SEARCH,
	VIEW_CONTROL_PANEL,
	VIEW_PREVIOUS_CHANGES,
	WEBVIEW_MESSAGE_TYPE,
};