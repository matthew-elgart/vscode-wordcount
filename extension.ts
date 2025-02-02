// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, Selection} from 'vscode';

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(ctx: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "Wordcount" is now active!');

    // create a new word counter
    let wordCounter = new WordCounter();
    let controller = new WordCounterController(wordCounter);

    // add to a list of disposables which are disposed when this extension
    // is deactivated again.
    ctx.subscriptions.push(controller);
    ctx.subscriptions.push(wordCounter);
}

export class WordCounter {

    private _statusBarItem: StatusBarItem;

    public updateWordCount() {
        
        // Create as needed
        if (!this._statusBarItem) {
			// set the status bar item to be to the right of the VSCodeVim one (since it only appears
			// conditionally).
			// VSCodeVim sets its status bar item at priority Number.MIN_SAFE_INTEGER to ensure it is the
			// rightmost item on the left:
			// https://github.com/VSCodeVim/Vim/blob/a4656a6e53a81e1ae4e2406f81ad831afffd0a18/src/statusBar.ts#L23
			// A bit frustrating it takes that priority for itself, but doing this seemed to work.
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, Number.MIN_SAFE_INTEGER - 1);
        } 

		let editor = window.activeTextEditor;
		if (!editor) {
			this._statusBarItem.hide();
			return;
		}

		// Only update status if an MD file
		let document = editor.document;
		if (document.languageId !== "markdown" && document.languageId !== "plaintext") {
            this._statusBarItem.hide();
            return;
		}

		let selectionText = document.getText(editor.selection);
		if (selectionText === "") {
			this._statusBarItem.hide();
			return;
		}

		let wordCount = this._getWordCount(selectionText);
		console.log(document.languageId);

		// Update the status bar
		this._statusBarItem.text = wordCount !== 1 ? `$(pencil) ${wordCount} Words` : '$(pencil) 1 Word';
		this._statusBarItem.show();
    }

    public _getWordCount(content: string): number {
        // Parse out unwanted whitespace so the split is accurate
        content = content.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
		content = content.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        let wordCount = 0;
        if (content != "") {
            wordCount = content.split(" ").length;
        }

        return wordCount;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

class WordCounterController {

    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
