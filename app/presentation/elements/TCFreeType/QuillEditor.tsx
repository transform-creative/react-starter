import Quill from "quill";
import {
  ForwardedRef,
  forwardRef,
  RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import "./Quill.css";
import { sanitizeQuillHtml } from "./sanitizeQuillHtml";

const Link = Quill.import("formats/link") as any;
class CustomLink extends Link {
  static blotName = "link";
  static create(value: string) {
    const node = super.create(value);
    if (value.startsWith("/")) node.setAttribute("target", "_self");
    return node;
  }
}
Quill.register(CustomLink as any, true);

type QuillEditorProps = {
  readOnly?: boolean;
  defaultValue: string;
  initialHTML?: string;
  onTextChange: () => any;
  onSelectionChange?: () => any;
  /** Called when the user clicks the toolbar image button.
   *  Return the URL to embed (e.g. after uploading to storage),
   *  or null to cancel. When provided, this replaces Quill's default
   *  base64-embedding image handler. */
  onImageRequest?: () => Promise<string | null>;
  toolbar: any[] | boolean;
  className: string;
};

/****************************************
 * The Quill editor component for contracts
 * @requires The accompanying css file. Quill's `snow` theme CSS is bundled
 * via `import "quill/dist/quill.snow.css"` in `app/root.tsx` so it ships
 * from `'self'` and stays inside the app's CSP.
 * @example //Set it up like this
     <QuillEditor
        ref={quillRef as RefObject<Quill>}
        defaultValue={"Add your notes here..."}
        onTextChange={() => setEdited(true)}
        toolbar={[
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          [
            { list: "ordered" },
            { list: "bullet" },
            { list: "check" },
          ],
          ["clean"],
        ]}
      />
 */
const QuillEditor = forwardRef(
  (
    {
      readOnly,
      defaultValue,
      initialHTML,
      onTextChange,
      onSelectionChange,
      onImageRequest,
      toolbar,
      className
    }: QuillEditorProps,
    ref: ForwardedRef<Quill>
  ) => {
    const containerRef = useRef<any>(undefined);
    const onTextChangeRef = useRef(onTextChange);
    const onSelectionChangeRef = useRef(onSelectionChange);
    const onImageRequestRef = useRef(onImageRequest);

    useLayoutEffect(() => {
      onTextChangeRef.current = onTextChange;
      onSelectionChangeRef.current = onSelectionChange;
      onImageRequestRef.current = onImageRequest;
    });

    useEffect(() => {
      if (ref) (ref as RefObject<Quill>).current?.enable(!readOnly);
    }, [ref, readOnly]);

    useEffect(() => {
      const container = containerRef.current;
      const editorContainer = container.appendChild(
        container.ownerDocument.createElement("div")
      );
      const quill = new Quill(editorContainer, {
        theme: "snow",
        readOnly: readOnly,
        //debug: "info",
        modules: {
          toolbar: toolbar,
          history: {
            delay: 2000,
            maxStack: 200,
            userOnly: true,
          },
        },
        placeholder: defaultValue,
      });

      // Defer the HTML paste a tick — Quill's clipboard module isn't fully
      // wired up until after the constructor returns, and consumers usually
      // pass `initialHTML` from state that updates one render after mount.
      let pasteTimer: ReturnType<typeof setTimeout> | undefined;
      if (initialHTML) {
        const safeHTML = sanitizeQuillHtml(initialHTML);
        pasteTimer = setTimeout(() => {
          quill.clipboard.dangerouslyPasteHTML(safeHTML);
        }, 2);
      }

      if (typeof toolbar !== "boolean" && onImageRequestRef.current) {
        const toolbarModule: any = quill.getModule("toolbar");
        toolbarModule?.addHandler?.("image", async () => {
          const url = await onImageRequestRef.current?.();
          if (!url) return;
          const range = quill.getSelection(true);
          const index = range?.index ?? quill.getLength();
          quill.insertEmbed(index, "image", url, "user");
          quill.setSelection(index + 1, 0);
        });
      }

      (ref as RefObject<Quill>).current = quill;

      quill.on(Quill.events.TEXT_CHANGE, (...args) => {
        onTextChangeRef.current?.();
      });
      quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
        onSelectionChangeRef.current?.();
      });

      if (ref)
        return () => {
          if (pasteTimer) clearTimeout(pasteTimer);
          /**@ts-ignore */
          ref.current = null;
          container.innerHTML = "";
        };
    }, [ref]);

    return (
      <div
        className={`${readOnly ? "readOnly" : "none"} slowFade ${className}`}
        ref={containerRef}
      ></div>
    );
  }
);

QuillEditor.displayName = "Editor";

export default QuillEditor;
