// src/parser/changeApplier.js
const path = require('path');
const vscode = require('vscode');

const { COMMAND_TYPE } = require('./commandParser');





class LineRangeOutOfBoundsError extends Error {
    constructor(filePath, requestedLine, totalLines) {
        super(`Line ${requestedLine} is out of bounds in ${filePath} (file has ${totalLines} lines)`);
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
            case COMMAND_TYPE.REPLACE_LINES:
                return this.applyReplaceLines(command);
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
            case COMMAND_TYPE.REPLACE_LINES:
                return this.validateReplaceLines(command);
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

    async validateReplaceLines(command) {
        const targetUri = this.resolveUri(command.path);

        let fileBytes;
        try {
            fileBytes = await vscode.workspace.fs.readFile(targetUri);
        } catch {
            return `Could not locate ${command.path}`;
        }

        const fileText = Buffer.from(fileBytes).toString('utf8');
        const totalLines = fileText.split('\n').length;

        if (command.startLine < 1 || command.startLine > totalLines) {
            return `Line ${command.startLine} is out of bounds in ${command.path} (file has ${totalLines} lines)`;
        }

        if (command.endLine !== -1 && command.endLine > totalLines) {
            return `Line ${command.endLine} is out of bounds in ${command.path} (file has ${totalLines} lines)`;
        }

        return null;
    }

    async readOldContent(command) {
        const targetUri = this.resolveUri(command.path);

        let fileBytes;
        try {
            fileBytes = await vscode.workspace.fs.readFile(targetUri);
        } catch {
            return null;
        }

        const fileText = Buffer.from(fileBytes).toString('utf8');
        const lines = fileText.split('\n');

        const isInsertOnly = command.endLine === -1;
        if (isInsertOnly) {
            return null;
        }

        if (command.startLine < 1 || command.startLine > lines.length || command.endLine > lines.length) {
            return null;
        }

        return lines.slice(command.startLine - 1, command.endLine).join('\n');
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

    async applyReplaceLines(command) {
        const targetUri = this.resolveUri(command.path);
        const fileBytes = await vscode.workspace.fs.readFile(targetUri);
        const fileText = Buffer.from(fileBytes).toString('utf8');
        const lines = fileText.split('\n');

        if (command.startLine < 1 || command.startLine > lines.length) {
            throw new LineRangeOutOfBoundsError(command.path, command.startLine, lines.length);
        }

        const newLines = command.newContent.split('\n');
        const isInsertOnly = command.endLine === -1;

        if (isInsertOnly) {
            lines.splice(command.startLine - 1, 0, ...newLines);
        } else {
            if (command.endLine > lines.length) {
                throw new LineRangeOutOfBoundsError(command.path, command.endLine, lines.length);
            }

            const deleteCount = command.endLine - command.startLine + 1;

            lines.splice(command.startLine - 1, deleteCount, ...newLines);
        }

        const updatedText = lines.join('\n');
        await vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(updatedText));
    }
}





module.exports = {
    ChangeApplier,
    LineRangeOutOfBoundsError,
};