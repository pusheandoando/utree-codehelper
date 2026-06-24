// src/tree/projectTreeItem.js
const vscode = require('vscode');





class ProjectTreeItem extends vscode.TreeItem {
	constructor(label, relativePath, isDirectory, collapsibleState, isChecked) {
		super(label, collapsibleState);
		this.relativePath = relativePath;
		this.isDirectory = isDirectory;
		this.contextValue = isDirectory ? 'projectDirectory' : 'projectFile';
		this.checkboxState = isChecked
			? vscode.TreeItemCheckboxState.Checked
			: vscode.TreeItemCheckboxState.Unchecked;
		this.resourceUri = vscode.Uri.file(relativePath);
		this.iconPath = isDirectory ? vscode.ThemeIcon.Folder : vscode.ThemeIcon.File;
	}
}

module.exports = ProjectTreeItem;