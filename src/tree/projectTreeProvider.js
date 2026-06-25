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
			extensionState.setExcluded(item.relativePath, isSelected);

			if (item.isDirectory) {
				if (isSelected) {
					this.cascadeToDescendants(extensionState, item.relativePath, true);
				} else {
					this.cascadeToDescendants(extensionState, item.relativePath, false);
				}
			}
		});

		saveExclusions(this.workspaceRootPath, extensionState.getExcludedPaths());
		this.refresh();
	}

	cascadeToDescendants(extensionState, parentRelativePath, selected) {
		const { collectAllEntries } = require('./projectFileScanner');
		const allEntries = collectAllEntries(this.workspaceRootPath);
		const prefix = parentRelativePath + path.sep;

		for (const entry of allEntries) {
			if (entry.startsWith(prefix)) {
				extensionState.setExcluded(entry, selected);
			}
		}
	}
}

module.exports = ProjectTreeProvider;