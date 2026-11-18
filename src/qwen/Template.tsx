import { createElement } from "react";
import type { ReactNode } from "react";
import parse, {
  Element,
  attributesToProps,
  domToReact,
} from "html-react-parser";
import type { DOMNode, HTMLReactParserOptions } from "html-react-parser";
import type { ScreenId } from "./navigation";

const templates = import.meta.glob("./templates/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
interface Props {
  screen: ScreenId;
  values: Record<string, string | boolean | undefined>;
  bindings: Record<string, ReactNode>;
  slots: Record<string, ReactNode>;
  action: (name: string) => void;
  change: (field: string, value: string | boolean) => void;
  passwordVisible: boolean;
}
export function Template({
  screen,
  values,
  bindings,
  slots,
  action,
  change,
  passwordVisible,
}: Props) {
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!(node instanceof Element)) return;
      if (["script", "iframe", "object", "embed"].includes(node.name))
        return <></>;
      const attr = node.attribs;
      const props = attributesToProps(attr);
      if (attr["data-slot"])
        return createElement(
          node.name,
          props,
          slots[attr["data-slot"]] ?? null,
        );
      if (attr["data-bind"])
        return createElement(
          node.name,
          props,
          bindings[attr["data-bind"]] ?? "—",
        );
      if (attr["data-field"]) {
        const field = attr["data-field"];
        const checkbox = attr.type === "checkbox";
        return createElement(node.name, {
          ...props,
          ...(checkbox
            ? { checked: Boolean(values[field]) }
            : { value: values[field] ?? "" }),
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            change(field, checkbox ? e.target.checked : e.target.value),
          ...(field === "password"
            ? { type: passwordVisible ? "text" : "password", autoComplete: "current-password" }
            : {}),
          ...(field === "username" ? { autoComplete: "username" } : {}),
          ...(field === "borrowedDate" ? { type: "date", readOnly: true } : {}),
          ...(field === "dueDate" || field === "birthDate"
            ? { type: "date" }
            : {}),
          ...(field === "email" ? { type: "email" } : {}),
          ...(field === "phone" ? { type: "tel" } : {}),
        });
      }
      if (attr["data-action"])
        return createElement(
          node.name,
          {
            ...props,
            type: node.name === "button" ? "button" : undefined,
            onClick: (e: React.MouseEvent) => {
              e.preventDefault();
              action(attr["data-action"]);
            },
          },
          domToReact(node.children as DOMNode[], options),
        );
    },
  };
  return <>{parse(templates[`./templates/${screen}.html`], options)}</>;
}
