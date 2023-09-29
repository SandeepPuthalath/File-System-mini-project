const fs = require("fs/promises");

(async () => {


    //commands
    const CREATE_FILE = "create a file";
    const DELETE_FILE = "delete the file";
    const RENAME_FILE = "rename the file";
    const ADD_TO_FILE = "add to the file";

    const createFile = async (path) => {
        try {
            // we want to check or not we already have that file.
            const exisingFileHandle = await fs.open(path, "r");
            // we already have that file ....
            exisingFileHandle.close()
            return console.log(`the file ${path} already exists`);
        } catch (error) {
            // we don't have the file , now we should create the file
            const newFileHandle = await fs.open(path, "w");
            console.log("A new file successfull created.");
            newFileHandle.close();
        }
    }

    const deleteFile = async (path) => {
        try {
            await fs.unlink(path);
            console.log(`Deleting file ${path} has been successfull`);
        } catch (error) {
            if (error.code === "ENOENT") {
                console.log(`No file at this path to remove`);
            } else {
                console.log(`An error occured while removing the file`);
                console.log(error)
            }
        }
    }

    const renameFile = async (oldPath, newPath) => {
        try {
            await fs.rename(oldPath, newPath)
            console.log(`File name has been changed to ${newPath}`);
        } catch (error) {
            if (error.code === "ENOENT") {
                console.log(`No file at this path to rename`);
            } else {
                console.log(`An error occured while removing the file`);
                console.log(error)
            }
        }
    }
    let addedContent;
    const addToFile = async (path, content) => {
        if (addedContent === content) return;
        try {
            const fileHandle = await fs.open(path, "a");
            fileHandle.write(content);
            addedContent = content;
            console.log("The content was added successfully")
        } catch (error) {
            if (error.code === "ENOENT") {
                console.log(`No file at this path to write to`);
            } else {
                console.log(`An error occured while removing the file`);
                console.log(error)
            }
        }
    }

    // important to close after done using also. we are just saving this in a memory location not actually opening it
    const commandFileHandler = await fs.open("./command.txt", "r"); // r mean only going to read

    commandFileHandler.on("change", async () => {
        //Get the size of our file
        const size = (await commandFileHandler.stat()).size;
        //allocate our buffer with the size of file
        const buff = Buffer.alloc(size)
        // the location at which we want to start filling our buffer
        const offset = 0;
        // how many bytes we want to read
        const length = size;
        // the position that we want to start reading the file from
        const position = 0;

        // we always want to read the whole content (from  beginning to all the way to the end)
        await commandFileHandler.read(
            buff,
            offset,
            length,
            position
        );

        // decoder 01 => meaninful
        const command = buff.toString("utf-8");

        //create a file:
        //create a file <path>
        if (command.includes(CREATE_FILE)) {
            const filePath = command.substring(CREATE_FILE.length + 1)
            createFile(filePath);
        }

        //delete file
        //delete the <path>
        if (command.includes(DELETE_FILE)) {
            const filePath = command.substring(DELETE_FILE.length + 1);
            deleteFile(filePath)
        }

        //rename file
        //rename the file <path> to <new path>
        if (command.includes(RENAME_FILE)) {
            const _idx = command.indexOf(" to ");
            const oldFilePath = command.substring(RENAME_FILE.length + 1, _idx);
            const newFilePath = command.substring(_idx + 4);

            renameFile(oldFilePath, newFilePath);
        }

        //add to file:
        //add to the file <path> this content: <content>
        if (command.includes(ADD_TO_FILE)) {
            const _idx = command.indexOf(" this content: ");
            const filePath = command.substring(ADD_TO_FILE.length + 1, _idx);
            const content = command.substring(_idx + 15);

            addToFile(filePath, content);

        }

        // encoder meaningful => 01

    })

    //watcher...
    const watcher = fs.watch("./command.txt")
    for await (const event of watcher) {
        if (event.eventType === "change" && event.filename === "command.txt") {
            commandFileHandler.emit("change")
        }
    }
})()

