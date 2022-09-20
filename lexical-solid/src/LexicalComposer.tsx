import { JSX, onMount } from "solid-js";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  createEditor,
  EditorState,
  Klass,
} from "lexical";
import type { EditorThemeClasses, LexicalEditor, LexicalNode } from "lexical";
import {
  LexicalComposerContext,
  createLexicalComposerContext,
  LexicalComposerContextType,
} from "./LexicalComposerContext";

const HISTORY_MERGE_OPTIONS = { tag: "history-merge" };

export type InitialEditorStateType =
  | null
  | string
  | EditorState
  | ((editor: LexicalEditor) => void);

type Props = {
  children: JSX.Element | string | (JSX.Element | string)[];
  initialConfig: Readonly<{
    namespace: string;
    nodes?: ReadonlyArray<Klass<LexicalNode>>;
    onError: (error: Error, editor: LexicalEditor) => void;
    editable?: boolean;
    theme?: EditorThemeClasses;
    editorState?: InitialEditorStateType;
  }>;
};

export function LexicalComposer(props: Props): JSX.Element {
  const {
    theme,
    namespace,
    nodes,
    onError,
    editorState: initialEditorState,
  } = props.initialConfig;

  const context: LexicalComposerContextType = createLexicalComposerContext(
    null,
    theme
  );

  const editor = createEditor({
    editable: false,
    namespace,
    nodes,
    onError: (error) => onError(error, editor),
    theme,
  });
  initializeEditor(editor, initialEditorState);

  onMount(() => {
    const isEditable = props.initialConfig.editable;
    editor.setEditable(isEditable !== undefined ? isEditable : true);
  });

  return (
    <LexicalComposerContext.Provider value={[editor, context]}>
      {props.children}
    </LexicalComposerContext.Provider>
  );
}

function initializeEditor(
  editor: LexicalEditor,
  initialEditorState?: InitialEditorStateType
): void {
  if (initialEditorState === null) {
    return;
  } else if (initialEditorState === undefined) {
    editor.update(() => {
      const root = $getRoot();
      if (root.isEmpty()) {
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        const activeElement = document.activeElement;
        if (
          $getSelection() !== null ||
          (activeElement !== null && activeElement === editor.getRootElement())
        ) {
          paragraph.select();
        }
      }
    }, HISTORY_MERGE_OPTIONS);
  } else if (initialEditorState !== null) {
    switch (typeof initialEditorState) {
      case "string": {
        const parsedEditorState = editor.parseEditorState(initialEditorState);
        editor.setEditorState(parsedEditorState, HISTORY_MERGE_OPTIONS);
        break;
      }
      case "object": {
        editor.setEditorState(initialEditorState, HISTORY_MERGE_OPTIONS);
        break;
      }
      case "function": {
        editor.update(() => {
          const root = $getRoot();
          if (root.isEmpty()) {
            initialEditorState(editor);
          }
        }, HISTORY_MERGE_OPTIONS);
        break;
      }
    }
  }
}
