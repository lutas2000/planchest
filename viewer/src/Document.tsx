import {useState,useEffect,useRef,createElement} from "react";
import Markdown, {type Components} from "react-markdown";
import remarkGfm from "remark-gfm";
import {asset} from "./paths";

/** GitHub-style heading slug, so `#some-heading` links resolve. */
function slug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}
function textOf(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(textOf).join("");
}

export function Document({
  file,
  onSelect,
  isEntry,
}: {
  file: string;
  onSelect: (file: string) => void;
  isEntry: (file: string) => boolean;
}) {
  const [text, setText] = useState("Loading document…");
  const article = useRef<HTMLElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setText("Loading document…");
    fetch(asset(file), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error("Document unavailable");
        return r.text();
      })
      .then(setText)
      .catch((e) => {
        if (e.name !== "AbortError") setText(e.message);
      });
    return () => controller.abort();
  }, [file]);

  const docUrl = new URL(asset(file), location.href);
  const base = new URL("repo/", location.href);
  const heading =
    (tag: string) =>
    ({ node, children }: any) =>
      createElement(tag, { id: slug(textOf(node)) }, children);
  const components: Components = {
    h1: heading("h1"),
    h2: heading("h2"),
    h3: heading("h3"),
    h4: heading("h4"),
    h5: heading("h5"),
    h6: heading("h6"),
    // Resolve images against the document's own location in repo/.
    img: ({ src, alt, title }) => (
      <img
        src={typeof src === "string" ? new URL(src, docUrl).href : undefined}
        alt={alt ?? ""}
        title={title}
      />
    ),
    a: ({ href, children }) => {
      const url = new URL(href ?? "", docUrl);
      const inRepo =
        url.origin === base.origin && url.pathname.startsWith(base.pathname);
      const target = inRepo
        ? decodeURIComponent(url.pathname.slice(base.pathname.length))
        : "";
      const samePage = inRepo && target === file && url.hash;
      const local = inRepo && (samePage || isEntry(target));
      return (
        <a
          href={url.href}
          onClick={
            local
              ? (e) => {
                  e.preventDefault();
                  if (samePage) {
                    const id = decodeURIComponent(url.hash.slice(1));
                    article.current
                      ?.querySelector(`[id="${CSS.escape(id)}"]`)
                      ?.scrollIntoView({ behavior: "smooth" });
                  } else onSelect(target);
                }
              : undefined
          }
          target={local ? undefined : "_blank"}
          rel="noreferrer"
        >
          {children}
        </a>
      );
    },
  };
  return (
    <article className="document" ref={article}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </Markdown>
    </article>
  );
}
