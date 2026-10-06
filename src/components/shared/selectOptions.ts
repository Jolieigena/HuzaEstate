import { Children, Fragment, isValidElement, type ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
  /** The <optgroup label> this option sits under, if any. */
  group?: string;
}

/** Plain text of a React node (what an <option> shows), so "{count} items" becomes "3 items". */
export function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/** Reads the <option> and <optgroup> children a native <select> would take, so the custom Select can be
 *  dropped in wherever a <select> was, without rewriting how its options are written. Fragments and
 *  arrays (from .map) are flattened; anything that isn't an option or group is ignored. */
export function parseSelectChildren(children: ReactNode, group?: string): SelectOption[] {
  const result: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: unknown; label?: unknown; disabled?: boolean; children?: ReactNode };
    if (child.type === "option") {
      const label = textOf(props.children);
      result.push({ value: props.value === undefined || props.value === null ? label : String(props.value), label, disabled: !!props.disabled, group });
    } else if (child.type === "optgroup") {
      result.push(...parseSelectChildren(props.children, typeof props.label === "string" ? props.label : group));
    } else if (child.type === Fragment) {
      result.push(...parseSelectChildren(props.children, group));
    }
  });
  return result;
}
