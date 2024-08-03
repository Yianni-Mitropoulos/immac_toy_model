class AnonymousDirectory {
    constructor(values = [], directories = {}) {
        this.values = values;
        this.directories = directories;
    }

    pushItem(path, val) {
        if (!path) {
            return new AnonymousDirectory([...this.values, val], {...this.directories});
        }
        const parts = path.split("/");
        const firstPart = parts[0];
        const remainingPath = parts.slice(1).join("/");
        const updatedDirectories = {
            ...this.directories,
            [firstPart]: (this.directories[firstPart] || new AnonymousDirectory()).pushItem(remainingPath, val)
        };
        return new AnonymousDirectory(this.values, updatedDirectories);
    }

    popItem(path) {
        if (!path) {
            if (this.values.length === 0) return { newDir: this, poppedItem: null };
            return { newDir: new AnonymousDirectory(this.values.slice(0, -1), {...this.directories}), poppedItem: this.values[this.values.length - 1] };
        }
        const parts = path.split("/");
        const firstPart = parts[0];
        const remainingPath = parts.slice(1).join("/");
        if (!this.directories[firstPart]) return { newDir: this, poppedItem: null };

        const { newDir, poppedItem } = this.directories[firstPart].popItem(remainingPath);
        const newDirectories = {...this.directories, [firstPart]: newDir};
        if (newDir.values.length === 0 && Object.keys(newDir.directories).length === 0) {
            delete newDirectories[firstPart];
        }
        return { newDir: new AnonymousDirectory(this.values, newDirectories), poppedItem };
    }
}

let root_dir = new AnonymousDirectory();

// Update Left Panel: Main function to update the directory structure display
function updateLeftPanel(directory = root_dir, container = document.getElementById('left-panel')) {

    // Clear the container to ensure a fresh start
    container.innerHTML = '';

    // Recursive Function: Create HTML structure for directories and files
    function createDirectoryHtml(currentDirectory, depth = 0) {
        const directoryContainer = document.createElement('div');

        // Process Subdirectories
        Object.entries(currentDirectory.directories).forEach(([dirName, dirObj]) => {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'directory-name';
            folderDiv.style.paddingLeft = `${20 * depth}px`;

            // Setup Folder Label and Inline Values
            const folderLabel = document.createElement('span');
            folderLabel.textContent = dirName;
            const folderValues = document.createElement('span');
            folderValues.textContent = ` (${dirObj.values.join(', ')})`;
            folderValues.style.display = 'inline';  // Inline values are visible by default

            folderDiv.appendChild(folderLabel);
            folderDiv.appendChild(folderValues);

            // Children Container: holds subdirectories and files
            const childrenContainer = document.createElement('div');
            childrenContainer.style.display = 'none';

            // Event Listener: Toggle visibility of children and inline values
            folderDiv.addEventListener('click', (event) => {
                event.stopPropagation();
                const isHidden = childrenContainer.style.display === 'none';
                childrenContainer.style.display = isHidden ? 'block' : 'none';
                folderValues.style.display = isHidden ? 'none' : 'inline';
            });

            // Recursive Call: Append nested directories and files
            childrenContainer.appendChild(createDirectoryHtml(dirObj, depth + 1));

            // Append folder and its children to the directory container
            directoryContainer.appendChild(folderDiv);
            directoryContainer.appendChild(childrenContainer);

        });

        // Process Files in Current Directory
        currentDirectory.values.forEach(value => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'sub-directory';
            fileDiv.textContent = value;
            fileDiv.style.paddingLeft = `${20 * (depth + 1)}px`;

            // Event Listener: Handle file selection
            fileDiv.addEventListener('click', (event) => {
                event.stopPropagation();
                handleClick(event, value);
            });

            // Append file to the directory container
            directoryContainer.appendChild(fileDiv);

        });

        return directoryContainer;

    }

    // Start building the directory structure from the root
    container.appendChild(createDirectoryHtml(directory, 0));

}

// Handle Click on File: Logs the selected file name
function handleClick(event, fileName) {

    event.stopPropagation();
    console.log(`File selected: ${fileName}`);

}

document.addEventListener('DOMContentLoaded', () => {
    updateLeftPanel();
});








// Initialize the root directory with some directories and files
root_dir = root_dir.pushItem("dir1", "Hello");
root_dir = root_dir.pushItem("dir1", "World");
root_dir = root_dir.pushItem("dir1/dir2", "Nested File 1");
root_dir = root_dir.pushItem("dir1/dir2", "Nested File 2");
root_dir = root_dir.pushItem("dir3", "Another File");

// Function to simulate adding new directories or files
function addSampleContent() {
    root_dir = root_dir.pushItem("dir3/dir4", "Deeply Nested File");
    root_dir = root_dir.pushItem("dir3", "Test File in Dir3");
    updateLeftPanel(); // Update the panel to reflect changes
}

// Function to simulate removing an item
function removeSampleContent() {
    let result = root_dir.popItem("dir1/dir2/Nested File 1");
    root_dir = result.newDir;
    updateLeftPanel(); // Update the panel to reflect changes
}

// Attach these functions to buttons or call directly to modify the structure
document.addEventListener('DOMContentLoaded', () => {
    updateLeftPanel(); // Initial rendering of the directory structure
    // Optionally, you can hook these functions to buttons or other UI elements
    // Example:
    // document.getElementById('addButton').onclick = addSampleContent;
    // document.getElementById('removeButton').onclick = removeSampleContent;
});