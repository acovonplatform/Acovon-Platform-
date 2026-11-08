import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'CODE',
  'PRE',
  'NOSCRIPT',
  'TEXTAREA',
  'SVG',
  'PATH'
]);

/**
 * GlobalDomTranslator ensures that every UI text node, button label, modal title,
 * form label, and input placeholder across all 20+ ACOVON modules adapts immediately
 * when the user switches languages or when a new modal/tab mounts.
 *
 * Strictly respects `[data-ugc="true"]` and `[data-no-translate="true"]` so
 * user-generated content (creator posts, bios, comments, private messages) and
 * native language names are never silently overwritten.
 */
export const GlobalDomTranslator: React.FC = () => {
  const { activeLanguageCode, translatePhrase, translationRecords } = useApp();

  const originalTextMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const originalPlaceholderMapRef = useRef<WeakMap<Element, string>>(new WeakMap());
  const originalTitleMapRef = useRef<WeakMap<Element, string>>(new WeakMap());
  const isApplyingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const shouldSkipElement = (el: Element | null): boolean => {
      if (!el) return true;
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.closest('[data-ugc="true"], [data-no-translate="true"]')) return true;
      return false;
    };

    const processSubtree = (rootNode: Node) => {
      if (isApplyingRef.current) return;
      isApplyingRef.current = true;

      try {
        // 1. Translate Text Nodes
        const walker = document.createTreeWalker(
          rootNode,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node: Node) => {
              const parent = node.parentElement;
              if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
              if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        let currentNode = walker.nextNode() as Text | null;
        while (currentNode) {
          const currentVal = currentNode.nodeValue || '';
          let originalVal = originalTextMapRef.current.get(currentNode);

          if (originalVal === undefined) {
            originalVal = currentVal;
            originalTextMapRef.current.set(currentNode, originalVal);
          }

          if (activeLanguageCode === 'en') {
            if (currentVal !== originalVal) {
              currentNode.nodeValue = originalVal;
            }
          } else {
            const translated = translatePhrase(originalVal);
            if (translated !== currentVal) {
              currentNode.nodeValue = translated;
            }
          }

          currentNode = walker.nextNode() as Text | null;
        }

        // 2. Translate Placeholders and Titles on Elements
        if (rootNode instanceof Element || rootNode instanceof Document) {
          const elements = rootNode.querySelectorAll('[placeholder], [title]');
          elements.forEach(el => {
            if (shouldSkipElement(el)) return;

            const placeholderAttr = el.getAttribute('placeholder');
            if (placeholderAttr !== null) {
              let origPlaceholder = originalPlaceholderMapRef.current.get(el);
              if (origPlaceholder === undefined) {
                origPlaceholder = placeholderAttr;
                originalPlaceholderMapRef.current.set(el, origPlaceholder);
              }
              const targetPlaceholder =
                activeLanguageCode === 'en'
                  ? origPlaceholder
                  : translatePhrase(origPlaceholder);
              if (placeholderAttr !== targetPlaceholder) {
                el.setAttribute('placeholder', targetPlaceholder);
              }
            }

            const titleAttr = el.getAttribute('title');
            if (titleAttr !== null) {
              let origTitle = originalTitleMapRef.current.get(el);
              if (origTitle === undefined) {
                origTitle = titleAttr;
                originalTitleMapRef.current.set(el, origTitle);
              }
              const targetTitle =
                activeLanguageCode === 'en' ? origTitle : translatePhrase(origTitle);
              if (titleAttr !== targetTitle) {
                el.setAttribute('title', targetTitle);
              }
            }
          });
        }
      } finally {
        isApplyingRef.current = false;
      }
    };

    processSubtree(document.body);

    const observer = new MutationObserver(mutations => {
      if (isApplyingRef.current) return;
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(added => {
            if (added.nodeType === Node.ELEMENT_NODE || added.nodeType === Node.TEXT_NODE) {
              processSubtree(added);
            }
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [activeLanguageCode, translatePhrase, translationRecords]);

  return null;
};
