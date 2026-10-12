import { DOMParser } from "@xmldom/xmldom";

// Minimal structural types so the helpers work with both xmldom and browser DOM nodes.
export type XmlNode = {
  nodeType: number;
  localName?: string | null;
  childNodes?: ArrayLike<XmlNode>;
  attributes?: ArrayLike<{ localName?: string | null; name: string; value: string }>;
  textContent?: string | null;
};

const ELEMENT_NODE = 1;

export function parseXml(source: string): XmlNode {
  return new DOMParser().parseFromString(source, "text/xml").documentElement as unknown as XmlNode;
}

export function children(node: XmlNode | undefined, name?: string): XmlNode[] {
  if (!node?.childNodes) return [];
  const result: XmlNode[] = [];
  for (let index = 0; index < node.childNodes.length; index++) {
    const child = node.childNodes[index];
    if (child.nodeType === ELEMENT_NODE && (!name || child.localName === name)) result.push(child);
  }
  return result;
}

export function child(node: XmlNode | undefined, name: string) {
  return children(node, name)[0];
}

export function descendants(node: XmlNode | undefined, name: string): XmlNode[] {
  const result: XmlNode[] = [];
  const visit = (current: XmlNode) => {
    for (const item of children(current)) {
      if (item.localName === name) result.push(item);
      visit(item);
    }
  };
  if (node) visit(node);
  return result;
}

/** Attribute value by local name, so documents using non-standard namespace prefixes still work. */
export function attr(node: XmlNode | undefined, name: string) {
  if (!node?.attributes) return undefined;
  for (let index = 0; index < node.attributes.length; index++) {
    const attribute = node.attributes[index];
    const localName = attribute.localName ?? attribute.name.split(":").pop();
    if (localName === name) return attribute.value;
  }
  return undefined;
}

/** `<w:x w:val="..."/>` child value lookup used throughout OOXML property blocks. */
export function childVal(node: XmlNode | undefined, name: string) {
  return attr(child(node, name), "val");
}
