import { Model, Constants } from "@croquet/worldcore";
import { startShell, getWindowType } from "./shell.js";
import { startWorld, basenames } from "./root.js";
import { WorldSaver } from "./src/worldSaver.js";
import { CodeLibrary } from "./src/code.js";

const defaultAvatarNames = [
    "newwhite", "madhatter", "marchhare", "queenofhearts", "cheshirecat", "alice"
];

const defaultSystemBehaviorDirectory = "behaviors/croquet";
const defaultSystemBehaviorModules = [
    "menu.js", "elected.js", "propertySheet.js"
];

async function startMicroverse() {
    let {basedir, basename} = basenames();

    if (!basename.endsWith(".json")) {
        // eval to hide import from webpack
        const worldModule = await eval(`import("${basedir}worlds/${basename}.js")`);
        // use bit-identical math for constant initialization
        Model.evaluate(() => worldModule.init(Constants));
    } else {
        const response = await fetch(basename);
        if (!response.ok) throw Error(`world not found: ${basename}`);
        const text = await response.text();
        const json = new WorldSaver().parse(text);
        Constants.AvatarNames = defaultAvatarNames;
        Constants.SystemBehaviorDirectory = defaultSystemBehaviorDirectory;
        Constants.SystemBehaviorModules = defaultSystemBehaviorModules;
        Constants.BehaviorModules = json.data.behaviormodules;
        Constants.DefaultCards = json.data.cards;
        Constants.Library = new CodeLibrary();
        Constants.Library.addModules(json.data.behaviorModules);
    }
    let apiKeysModule;
    try {
        // eval to hide import from webpack
        apiKeysModule = await eval(`import('${basedir}apiKey.js')`);
    } catch (error) {
        console.log(error);
        throw Error("Please make sure that you have created a valid apiKey.js");
    };
    // Default parameters are filled in the body of startWorld. You can override them.
    startWorld(apiKeysModule.default);
}

async function start() {
    const windowType = await getWindowType();
    if (windowType === "shell") startShell();
    else startMicroverse();
}

start();
