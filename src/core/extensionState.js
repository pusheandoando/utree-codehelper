// src/core/extensionState.js





let instance = null;

class ExtensionState {
	constructor(context) {
		this.context = context;
		this.excludedPaths = new Set();
		this.lastGeneratedPrompt = null;
		this.lastChangeTimestamp = null;
	}

	static initialize(context) {
		if (!instance) {
			instance = new ExtensionState(context);
		}
		return instance;
	}

	static getInstance() {
		if (!instance) {
			throw new Error('ExtensionState must be initialized before use');
		}
		return instance;
	}

	isSelected(relativePath) {
		return this.excludedPaths.has(relativePath);
	}

	setSelected(relativePath, selected) {
		if (selected) {
			this.excludedPaths.add(relativePath);
		} else {
			this.excludedPaths.delete(relativePath);
		}
	}

	getSelectedPaths() {
		return Array.from(this.excludedPaths);
	}

	setSelectedPaths(relativePaths) {
		this.excludedPaths = new Set(relativePaths);
	}

	isExcluded(relativePath) {
		return this.excludedPaths.has(relativePath);
	}

	setExcluded(relativePath, excluded) {
		if (excluded) {
			this.excludedPaths.add(relativePath);
		} else {
			this.excludedPaths.delete(relativePath);
		}
	}

	getExcludedPaths() {
		return Array.from(this.excludedPaths);
	}

	setExcludedPaths(relativePaths) {
		this.excludedPaths = new Set(relativePaths);
	}

	setLastGeneratedPrompt(promptText) {
		this.lastGeneratedPrompt = promptText;
		this.lastChangeTimestamp = new Date();
	}

	getLastGeneratedPrompt() {
		return this.lastGeneratedPrompt;
	}

	getLastChangeTimestamp() {
		return this.lastChangeTimestamp;
	}
}

module.exports = ExtensionState;