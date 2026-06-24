// src/parser/commandParser.js





const COMMAND_OPEN_PATTERN = /^@@COMMAND:[ \t]*(\w+)[ \t]*$/;
const FIELD_TAG_PATTERN = /^@@(PATH|CONTENT|START_MARKER|END_MARKER|NEW_CONTENT):[ \t]*(.*?)[ \t]*$/;
const END_COMMAND_TAG = '@@END_COMMAND';
const MARKDOWN_FENCE_PATTERN = /^[ \t]*```[a-zA-Z0-9]*[ \t]*$/;

const COMMAND_TYPE = {
    CREATE_SCRIPT: 'CREATE_SCRIPT',
    DELETE_SCRIPT: 'DELETE_SCRIPT',
    CREATE_FOLDER: 'CREATE_FOLDER',
    DELETE_FOLDER: 'DELETE_FOLDER',
    REPLACE_FRAGMENT: 'REPLACE_FRAGMENT',
};

function normalizeLineEndings(text) {
    return text.replace(/\r\n/g, '\n');
}

function stripMarkdownFenceLines(text) {
    return text
        .split('\n')
        .filter((line) => !MARKDOWN_FENCE_PATTERN.test(line))
        .join('\n');
}

function parseBlocks(text) {
    const lines = text.split('\n');
    const blocks = [];

    let i = 0;
    while (i < lines.length) {
        const openMatch = lines[i].match(COMMAND_OPEN_PATTERN);
        if (!openMatch) {
            i++;
            continue;
        }

        const commandType = openMatch[1];
        const fields = {};
        let currentField = null;
        let fieldLines = [];
        i++;

        while (i < lines.length && lines[i] !== END_COMMAND_TAG) {
            const tagMatch = lines[i].match(FIELD_TAG_PATTERN);
            if (tagMatch) {
                if (currentField !== null) {
                    fields[currentField] = fieldLines.join('\n');
                }
                currentField = tagMatch[1];
                const inlineValue = tagMatch[2];
                fieldLines = inlineValue.length > 0 ? [inlineValue] : [];
            } else {
                if (currentField !== null) {
                    fieldLines.push(lines[i]);
                }
            }
            i++;
        }

        if (currentField !== null) {
            fields[currentField] = fieldLines.join('\n');
        }

        blocks.push({ commandType, fields });
        i++;
    }

    return blocks;
}

function trimFieldValue(value) {
    if (value === undefined || value === null) {
        return null;
    }
    return value.replace(/^\n/, '').replace(/\n$/, '');
}

function buildReplaceFragmentCommand(path, fields) {
    const startMarker = trimFieldValue(fields['START_MARKER']);
    const endMarker = trimFieldValue(fields['END_MARKER']);
    const newContent = trimFieldValue(fields['NEW_CONTENT']);

    // Two-field form: START_MARKER=text to find, END_MARKER=replacement.
    // Normalize to the three-field internal representation so the applier
    // always works the same way: find startMarker..endMarker, replace with newContent.
    if (newContent === null && startMarker !== null && endMarker !== null) {
        return {
            type: COMMAND_TYPE.REPLACE_FRAGMENT,
            path,
            startMarker,
            endMarker: startMarker,
            newContent: endMarker,
        };
    }

    return {
        type: COMMAND_TYPE.REPLACE_FRAGMENT,
        path,
        startMarker,
        endMarker,
        newContent,
    };
}

function buildParsedCommand(commandType, fields) {
    const path = trimFieldValue(fields['PATH']);

    switch (commandType) {
        case COMMAND_TYPE.CREATE_SCRIPT:
            return {
                type: commandType,
                path,
                content: trimFieldValue(fields['CONTENT']),
            };

        case COMMAND_TYPE.DELETE_SCRIPT:
            return { type: commandType, path };

        case COMMAND_TYPE.CREATE_FOLDER:
            return { type: commandType, path };

        case COMMAND_TYPE.DELETE_FOLDER:
            return { type: commandType, path };

        case COMMAND_TYPE.REPLACE_FRAGMENT:
            return buildReplaceFragmentCommand(path, fields);

        default:
            return null;
    }
}

function describeValidationError(command) {
    if (!command.path) {
        return '@@PATH field is missing';
    }
    if (command.type === COMMAND_TYPE.REPLACE_FRAGMENT) {
        if (!command.startMarker) {
            return '@@START_MARKER field is missing or empty';
        }
        if (!command.endMarker) {
            return '@@END_MARKER field is missing or empty';
        }
        if (command.newContent === null) {
            return '@@NEW_CONTENT field is missing';
        }
    }
    if (command.type === COMMAND_TYPE.CREATE_SCRIPT && command.content === null) {
        return '@@CONTENT field is missing';
    }
    return null;
}

function parseAiResponse(rawResponseText) {
    const normalized = normalizeLineEndings(rawResponseText);
    const cleaned = stripMarkdownFenceLines(normalized);
    const blocks = parseBlocks(cleaned);

    return blocks.map(({ commandType, fields }) => {
        const knownType = COMMAND_TYPE[commandType];

        if (!knownType) {
            return {
                type: commandType,
                path: trimFieldValue(fields['PATH']) || '(unknown)',
                parseError: `Unknown command type: ${commandType}`,
            };
        }

        const command = buildParsedCommand(knownType, fields);
        const validationError = describeValidationError(command);

        if (validationError) {
            return { ...command, parseError: validationError };
        }

        return command;
    });
}

module.exports = {
    COMMAND_TYPE,
    parseAiResponse,
};