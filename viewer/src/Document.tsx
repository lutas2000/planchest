import {useState,useEffect} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {asset} from "./paths";
export function Document({
  file,
  onSelect,
}: {
  file: string;
  onSelect: (file: string) => void;
}) {
  const [text, setText] = useState("Loading document…");
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
  return (
    <article className="document">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const url = new URL(
              href ?? "",
              new URL(asset(file), location.href),
            );
            const base = new URL("repo/", location.href);
            const local =
              url.origin === base.origin &&
              url.pathname.startsWith(base.pathname);
            return (
              <a
                href={url.href}
                onClick={
                  local
                    ? (e) => {
                        e.preventDefault();
                        onSelect(
                          decodeURIComponent(
                            url.pathname.slice(base.pathname.length),
                          ),
                        );
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
        }}
      >
        {text}
      </Markdown>
    </article>
  );
}
