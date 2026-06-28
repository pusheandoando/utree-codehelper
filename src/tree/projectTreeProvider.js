// src/tree/projectTreeProvider.js
const vscode = require('vscode');
const path = require('path');

const ProjectTreeItem = require('./projectTreeItem');
const { listDirectoryEntries } = require('./projectFileScanner');
const ExtensionState = require('../core/extensionState');
const { saveExclusions } = require('../dependency/exclusionCache');





class ProjectTreeProvider {
	constructor(workspaceRootPath) {
		this.workspaceRootPath = workspaceRootPath;
		this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
		this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
	}

	get absoluteRootPath() {
		return this.workspaceRootPath;
	}

	refresh() {
		this.onDidChangeTreeDataEmitter.fire();
	}

	getTreeItem(element) {
		return element;
	}

	getChildren(element) {
		const absoluteDirectoryPath = element
			? path.join(this.workspaceRootPath, element.relativePath)
			: this.workspaceRootPath;

		const entries = listDirectoryEntries(absoluteDirectoryPath);
		const extensionState = ExtensionState.getInstance();

		return entries.map((entry) => {
			const relativePath = path.relative(this.workspaceRootPath, entry.absolutePath);
			const isChecked = extensionState.isExcluded(relativePath);
			const collapsibleState = entry.isDirectory
				? vscode.TreeItemCollapsibleState.Collapsed
				: vscode.TreeItemCollapsibleState.None;

			return new ProjectTreeItem(entry.name, relativePath, entry.isDirectory, collapsibleState, isChecked);
		});
	}

	handleCheckboxToggle(checkedItems) {
		const extensionState = ExtensionState.getInstance();

		checkedItems.forEach(([item, newState]) => {
			const isSelected = newState === vscode.TreeItemCheckboxState.Checked;
			this.applyStateToSubtree(item.relativePath, item.isDirectory, isSelected, extensionState);
		});

		saveExclusions(this.workspaceRootPath, extensionState.getExcludedPaths());
		this.refresh();
	}

	applyStateToSubtree(relativePath, isDirectory, isSelected, extensionState) {
		extensionState.setExcluded(relativePath, isSelected);

		if (!isDirectory) {
			return;
		}

		const absolutePath = path.join(this.workspaceRootPath, relativePath);
		let entries;
		try {
			entries = listDirectoryEntries(absolutePath);
		} catch {
			return;
		}

		for (const entry of entries) {
			const childRelativePath = path.relative(this.workspaceRootPath, entry.absolutePath);
			this.applyStateToSubtree(childRelativePath, entry.isDirectory, isSelected, extensionState);
		}
	}
}

module.exports = ProjectTreeProvider;