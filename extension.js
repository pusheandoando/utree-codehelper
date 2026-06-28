// extension.js
const vscode = require('vscode');
const ExtensionState = require('./src/core/extensionState');
const ProjectTreeProvider = require('./src/tree/projectTreeProvider');
const ControlPanelProvider = require('./src/webview/controlPanelProvider');
const FileSearchProvider = require('./src/webview/fileSearchProvider');
const PreviousChangesProvider = require('./src/webview/previousChangesProvider');
const UtreeManager = require('./src/dependency/utreeManager');
const { loadExclusions, saveExclusions } = require('./src/dependency/exclusionCache');
const { executeNewChangeCommand } = require('./src/commands/newChangeCommand');
const { executeApplyChangesCommand } = require('./src/commands/applyChangesCommand');
const {
	COMMAND_NEW_CHANGE,
	COMMAND_APPLY_CHANGES,
	COMMAND_REFRESH_FILE_TREE,
	VIEW_TREE_SELECTION,
	VIEW_FILE_SEARCH,
	VIEW_CONTROL_PANEL,
	VIEW_PREVIOUS_CHANGES,
} = require('./src/core/constants');





function getWorkspaceRootPath() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return null;
	}
	return workspaceFolders[0].uri.fsPath;
}

function registerMainWorkspaceFeatures(context, workspaceRootPath) {
	const extensionUri = context.extensionUri;

	const projectTreeProvider = new ProjectTreeProvider(workspaceRootPath);
	const treeView = vscode.window.createTreeView(VIEW_TREE_SELECTION, {
		treeDataProvider: projectTreeProvider,
		manageCheckboxStateManually: false,
	});

	treeView.onDidChangeCheckboxState((event) => {
		projectTreeProvider.handleCheckboxToggle(event.items);
	});

	const previousChangesProvider = new PreviousChangesProvider(
		extensionUri,
		() => workspaceRootPath
	);

	const onApplyComplete = () => {
		previousChangesProvider.refresh();
	};

	const onExclusionChanged = () => {
		const extensionState = ExtensionState.getInstance();
		saveExclusions(workspaceRootPath, extensionState.getExcludedPaths());
		projectTreeProvider.refresh();
	};

	const fileSearchProvider = new FileSearchProvider(
		extensionUri,
		workspaceRootPath,
		onExclusionChanged
	);

	const controlPanelProvider = new ControlPanelProvider(extensionUri, async (userInstructions) => {
		await executeNewChangeCommand(
			extensionUri,
			workspaceRootPath,
			userInstructions,
			() => executeApplyChangesCommand(extensionUri, workspaceRootPath, onApplyComplete)
		);
		controlPanelProvider.refresh();
	});

	context.subscriptions.push(
		treeView,
		vscode.window.registerWebviewViewProvider(VIEW_FILE_SEARCH, fileSearchProvider),
		vscode.window.registerWebviewViewProvider(VIEW_CONTROL_PANEL, controlPanelProvider),
		vscode.window.registerWebviewViewProvider(VIEW_PREVIOUS_CHANGES, previousChangesProvider),
		vscode.commands.registerCommand(COMMAND_REFRESH_FILE_TREE, () => {
			projectTreeProvider.refresh();
		}),
		vscode.commands.registerCommand(COMMAND_NEW_CHANGE, async () => {
			const userInstructions = await vscode.window.showInputBox({
				prompt: 'Describe the requested changes',
				placeHolder: 'e.g. Add a settings page with a dark mode toggle',
			});
			if (userInstructions) {
				await executeNewChangeCommand(
					extensionUri,
					workspaceRootPath,
					userInstructions,
					() => executeApplyChangesCommand(extensionUri, workspaceRootPath, onApplyComplete)
				);
				controlPanelProvider.refresh();
			}
		}),
		vscode.commands.registerCommand(COMMAND_APPLY_CHANGES, () => executeApplyChangesCommand(extensionUri, workspaceRootPath, onApplyComplete))
	);
}

async function activate(context) {
	ExtensionState.initialize(context);

	const workspaceRootPath = getWorkspaceRootPath();
	if (!workspaceRootPath) {
		vscode.window.showWarningMessage('utree-codehelper requires an open workspace folder.');
		return;
	}

	const manager = UtreeManager.getInstance();

	if (!manager.isBinaryPresent()) {
		const choice = await vscode.window.showInformationMessage(
			'utree-codehelper requires the utree binary, which was not found. Download it now?',
			{ modal: true },
			'Download',
			'Cancel'
		);

		if (choice !== 'Download') {
			await vscode.commands.executeCommand('workbench.view.explorer');
			return;
		}

		await vscode.window.withProgress(
			{ location: vscode.ProgressLocation.Notification, title: 'Downloading utree...' },
			async () => {
				await manager.downloadLatestBinary();
				await manager.makeExecutable();
			}
		);
	}

	const cachedExclusions = loadExclusions(workspaceRootPath);
	if (cachedExclusions.length > 0) {
		ExtensionState.getInstance().setExcludedPaths(cachedExclusions);
	}

	registerMainWorkspaceFeatures(context, workspaceRootPath);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate,
};