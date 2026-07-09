// src/parser/changeApplier.js
const vscode = require('vscode');
const path = require('path');
const { COMMAND_TYPE } = require('./commandParser');





class FragmentNotFoundError extends Error {
    constructor(filePath) {
        super(`Could not locate the exact fragment boundaries in ${filePath}`);
        this.filePath = filePath;
    }
}

class ChangeApplier {
    constructor(workspaceRootPath) {
        this.workspaceRootPath = workspaceRootPath;
    }

    resolveUri(relativePath) {
        return vscode.Uri.file(path.join(this.workspaceRootPath, relativePath));
    }

    async apply(command) {
        switch (command.type) {
            case COMMAND_TYPE.CREATE_SCRIPT:
                return this.applyCreateScript(command);
            case COMMAND_TYPE.DELETE_SCRIPT:
                return this.applyDeleteScript(command);
            case COMMAND_TYPE.CREATE_FOLDER:
                return this.applyCreateFolder(command);
            case COMMAND_TYPE.DELETE_FOLDER:
                return this.applyDeleteFolder(command);
            case COMMAND_TYPE.REPLACE_FRAGMENT:
                return this.applyReplaceFragment(command);
            default:
                throw new Error(`Unsupported command type: ${command.type}`);
        }
    }

    async validate(command) {
        switch (command.type) {
            case COMMAND_TYPE.CREATE_SCRIPT:
            case COMMAND_TYPE.CREATE_FOLDER:
                return null;
            case COMMAND_TYPE.DELETE_SCRIPT:
            case COMMAND_TYPE.DELETE_FOLDER:
                return this.validateTargetExists(command);
            case COMMAND_TYPE.REPLACE_FRAGMENT:
                return this.validateReplaceFragment(command);
            default:
                return `Unsupported command type: ${command.type}`;
        }
    }

    async validateTargetExists(command) {
        try {
            await vscode.workspace.fs.stat(this.resolveUri(command.path));
            return null;
        } catch {
            return `Could not locate ${command.path}`;
        }
    }

    async validateReplaceFragment(command) {
        const targetUri = this.resolveUri(command.path);

        let fileBytes;
        try {
            fileBytes = await vscode.workspace.fs.readFile(targetUri);
        } catch {
            return `Could not locate ${command.path}`;
        }

        const fileText = Buffer.from(fileBytes).toString('utf8');
        const fragmentRange = this.locateFragmentRange(fileText, command.startMarker, command.endMarker);

        if (!fragmentRange) {
            return `Could not locate the exact fragment boundaries in ${command.path}`;
        }

        return null;
    }

    async applyCreateScript(command) {
        const targetUri = this.resolveUri(command.path);
        const encodedContent = new TextEncoder().encode(command.content || '');
        await vscode.workspace.fs.writeFile(targetUri, encodedContent);
    }

    async applyDeleteScript(command) {
        const targetUri = this.resolveUri(command.path);
        await vscode.workspace.fs.delete(targetUri, { recursive: false, useTrash: true });
    }

    async applyCreateFolder(command) {
        const targetUri = this.resolveUri(command.path);
        await vscode.workspace.fs.createDirectory(targetUri);
    }

    async applyDeleteFolder(command) {
        const targetUri = this.resolveUri(command.path);
        await vscode.workspace.fs.delete(targetUri, { recursive: true, useTrash: true });
    }

    async applyReplaceFragment(command) {
        const targetUri = this.resolveUri(command.path);
        const fileBytes = await vscode.workspace.fs.readFile(targetUri);
        const fileText = Buffer.from(fileBytes).toString('utf8');

        const fragmentRange = this.locateFragmentRange(fileText, command.startMarker, command.endMarker);
        if (!fragmentRange) {
            throw new FragmentNotFoundError(command.path);
        }

        const updatedText = fileText.slice(0, fragmentRange.start) + command.newContent + fileText.slice(fragmentRange.end);
        await vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(updatedText));
    }

    locateFragmentRange(fileText, startMarker, endMarker) {
        const startIndex = fileText.indexOf(startMarker);
        if (startIndex === -1) {
            return null;
        }

        // When both markers are identical the command uses the 2-field form:
        // find the exact text and replace it in place without a second anchor search.
        if (startMarker === endMarker) {
            return { start: startIndex, end: startIndex + startMarker.length };
        }

        const endMarkerSearchStart = startIndex + startMarker.length;
        const endMarkerIndex = fileText.indexOf(endMarker, endMarkerSearchStart);
        if (endMarkerIndex === -1) {
            return null;
        }

        return {
            start: startIndex,
            end: endMarkerIndex + endMarker.length,
        };
    }
}

module.exports = {
    ChangeApplier,
    FragmentNotFoundError,
};