document.addEventListener('DOMContentLoaded', () => {
    const textArea = document.getElementById('file-content');
    textArea.addEventListener('input', highlightSyntax);
    textArea.addEventListener('keydown', handleKeydown);
    highlightSyntax();
});

function highlightSyntax() {
    const textArea = document.getElementById('file-content');
    const highlightLayer = document.getElementById('highlight-layer');
    const content = textArea.value;

    // Escape HTML first.
    const escapedContent = escapeHtml(content);

    // Apply syntax highlighting with a single regex.
    // The regex captures comments, docstrings, strings, and special tokens ensuring longest match wins.
    let highlightedContent = escapedContent.replace(
        /(\$(?:.*?))$|(#(?:.*?))$|(&quot;.*?(?:&quot;|$))|((?:&lt;)?[0-9A-Z/%\\\-+*\.][0-9A-Za-z/%\\\-+*\.]*(?:&gt;)?)|([a-z][0-9A-Za-z/%\\\-+*\.]*)/gm,
        function(match, docstring, comment, doubleQuoteString, specialToken, functionToken) {
            if (docstring) {
                return `<span class="highlighted-docstring">${docstring}</span>`;
            } else if (comment) {
                return `<span class="highlighted-comment">${comment}</span>`;
            } else if (doubleQuoteString) {
                return `<span class="highlighted-string">${doubleQuoteString}</span>`;
            } else if (specialToken) {
                return `<span class="highlighted-special">${specialToken}</span>`;
            } else if (functionToken) {
                return `<span class="highlighted-function">${functionToken}</span>`;
            }
            return match;
        }
    );

    // Replace line breaks with <br> for HTML display.
    highlightedContent = highlightedContent.replace(/\n/g, '<br>');

    highlightLayer.innerHTML = highlightedContent;
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
}

function isCursorOnWhitespaceLine(textArea) {
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const content = textArea.value;
    
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', start);
    const line = content.slice(lineStart, lineEnd !== -1 ? lineEnd : content.length);

    return /^\s*$/.test(line);
}

function isCursorOnLineWithNoLeadingWhitespace(textArea) {
    const cursorPosition = textArea.selectionStart; // Get the current cursor position
    const textContent = textArea.value; // Get the full content of the text area

    // Find the start of the current line
    const lineStart = textContent.lastIndexOf('\n', cursorPosition - 1) + 1;

    // Find the end of the current line
    const lineEnd = textContent.indexOf('\n', cursorPosition);
    const line = textContent.slice(lineStart, lineEnd !== -1 ? lineEnd : textContent.length);

    // Check if the line starts with a non-whitespace character
    return line.startsWith(' ') || line.startsWith('\t') ? false : true;
}

function isCursorInLeftmostPosition(textArea) {
    const cursorPosition = textArea.selectionStart; // Get the position of the cursor in the text area
    const textContent = textArea.value; // Get the full content of the text area

    // Check if the cursor is at the very start or right after a newline character
    if (cursorPosition === 0 || textContent.charAt(cursorPosition - 1) === '\n') {
        return true; // The cursor is in the leftmost position
    }

    return false; // The cursor is not in the leftmost position
}


function handleKeydown(event) {
    const textArea = event.target;

    if (event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault();
        if (textArea.selectionStart === textArea.selectionEnd && isCursorInLeadingWhitespace(textArea)) {
            handleTabInLeadingWhitespace(textArea);
        } else {
            indentSelection(textArea);
        }
        highlightSyntax();
    } else if (event.key === 'Tab' && event.shiftKey) {
        event.preventDefault();
        if (isCursorOnLineWithNoLeadingWhitespace(textArea)) {
            return;
        }
        if (textArea.selectionStart === textArea.selectionEnd && isCursorInLeadingWhitespace(textArea)) {
            handleShiftTabInLeadingWhitespace(textArea);
        } else {
            deindentSelection(textArea);
        }
        highlightSyntax();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        insertNewlineWithIndent(textArea);
        highlightSyntax();
    } else if (event.key === 'Backspace') {
        if (isCursorInLeftmostPosition(textArea)) {
            return;
        }
        if (
            textArea.selectionStart === textArea.selectionEnd
            && isCursorInLeadingWhitespace(textArea)
        ) {
            event.preventDefault();
            handleShiftTabInLeadingWhitespace(textArea);
            highlightSyntax();
        }
    }
}

function handleTabInLeadingWhitespace(textArea) {
    const start = textArea.selectionStart;
    const value = textArea.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const beforeCursor = value.slice(0, start);
    const afterCursor = value.slice(start);
    const leadingWhitespace = beforeCursor.slice(lineStart);
    const nonWhitespaceIndex = value.slice(lineStart).search(/\S|\n|$/);

    if (/^\s*$/.test(leadingWhitespace)) {
        const currentIndent = nonWhitespaceIndex;
        const spacesToInsert = 4 - (currentIndent % 4);
        document.execCommand('insertText', false, ' '.repeat(spacesToInsert));
    }
}

function handleShiftTabInLeadingWhitespace(textArea) {
    const start = textArea.selectionStart;
    const value = textArea.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', start);
    const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);

    const beforeCursor = value.slice(0, start);
    const afterCursor = value.slice(start);
    const leadingWhitespace = beforeCursor.slice(lineStart);
    let nonWhitespaceIndex = value.slice(lineStart).search(/\S|\n|$/);

    if (/^\s*$/.test(leadingWhitespace)) {
        const currentIndent = nonWhitespaceIndex;
        const spacesToRemove = currentIndent % 4 === 0 ? 4 : currentIndent % 4;

        let leftSpacesToRemove = Math.min(spacesToRemove, start - lineStart);
        let rightSpacesToRemove = spacesToRemove - leftSpacesToRemove;

        // Remove spaces to the left of the cursor
        if (leftSpacesToRemove > 0) {
            const newStart = start - leftSpacesToRemove;
            textArea.setSelectionRange(newStart, start);
            document.execCommand('delete', false, null);
        }

        // Adjust the cursor position after the left space removal
        const adjustedStart = start - leftSpacesToRemove;

        // Remove spaces to the right of the cursor
        if (rightSpacesToRemove > 0) {
            textArea.setSelectionRange(adjustedStart, adjustedStart + rightSpacesToRemove);
            document.execCommand('delete', false, null);
        }
    }
}

function indentSelection(textArea) {
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const value = textArea.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const newEnd = lineEnd === -1 ? value.length : lineEnd;

    const lines = value.slice(lineStart, newEnd).split('\n');
    const newLines = lines.map(line => '    ' + line);

    textArea.setSelectionRange(lineStart, newEnd);
    document.execCommand('insertText', false, newLines.join('\n'));

    textArea.selectionStart = start + 4;
    textArea.selectionEnd = end + (lines.length * 4);
}

function deindentSelection(textArea) {
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const value = textArea.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const newEnd = lineEnd === -1 ? value.length : lineEnd;

    const lines = value.slice(lineStart, newEnd).split('\n');
    const newLines = lines.map(line => line.startsWith('    ') ? line.slice(4) : line);

    textArea.setSelectionRange(lineStart, newEnd);
    document.execCommand('insertText', false, newLines.join('\n'));

    const removedSpaces = lines.reduce((acc, line) => acc + (line.startsWith('    ') ? 4 : 0), 0);
    textArea.selectionStart = start;
    textArea.selectionEnd = end - removedSpaces;
}

function insertNewlineWithIndent(textArea) {
    const start = textArea.selectionStart;
    const value = textArea.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const line = value.slice(lineStart, start);
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : '';

    document.execCommand('insertText', false, '\n' + indent);

    textArea.selectionStart = textArea.selectionEnd = start + indent.length + 1;
}

function isCursorInLeadingWhitespace(textArea) {
    const start = textArea.selectionStart;
    const value = textArea.value;

    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const leadingWhitespace = value.slice(lineStart, start);

    return /^\s*$/.test(leadingWhitespace);
}

function toggleDirectory(event) {
    event.stopPropagation();
    const directory = event.currentTarget;
    directory.classList.toggle('expanded');
}

function handleClick(event, fileName) {
    event.stopPropagation();
    console.log(fileName);
}
