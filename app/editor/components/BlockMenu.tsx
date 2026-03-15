import {
  BookmarkedIcon,
  DocumentIcon,
  LightBulbIcon,
  ShapesIcon,
  SparklesIcon,
} from "outline-icons";
import cloneDeep from "lodash/cloneDeep";
import { observer } from "mobx-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import Icon from "@shared/components/Icon";
import type { MenuItem } from "@shared/editor/types";
import { ProsemirrorHelper } from "@shared/utils/ProsemirrorHelper";
import { TextHelper } from "@shared/utils/TextHelper";
import useCurrentUser from "~/hooks/useCurrentUser";
import useDictionary from "~/hooks/useDictionary";
import useStores from "~/hooks/useStores";
import getMenuItems from "../menus/block";
import { useEditor } from "./EditorContext";
import MedicalInsertDialog from "./MedicalInsertDialog";
import type { Props as SuggestionsMenuProps } from "./SuggestionsMenu";
import SuggestionsMenu from "./SuggestionsMenu";
import SuggestionsMenuItem from "./SuggestionsMenuItem";

/**
 * Hook that returns a template menu item with children for inserting template
 * content into the editor, or undefined if no templates are available.
 */
function useTemplateMenuItem(): MenuItem | undefined {
  const { t } = useTranslation();
  const user = useCurrentUser({ rejectOnEmpty: false });
  const { documents, templates: templatesStore } = useStores();
  const editor = useEditor();
  const documentId = editor.props.id;
  const document = documentId ? documents.get(documentId) : undefined;
  const collectionId = document?.collectionId;

  return useMemo(() => {
    if (!user) {
      return undefined;
    }

    const allTemplates = templatesStore.orderedData.filter(
      (template) => template.isActive
    );
    const hasTemplates = allTemplates.some(
      (template) =>
        template.isWorkspaceTemplate || template.collectionId === collectionId
    );

    if (!hasTemplates) {
      return undefined;
    }

    const toMenuItem = (template: (typeof allTemplates)[0]): MenuItem => ({
      name: "noop",
      title: TextHelper.replaceTemplateVariables(
        template.titleWithDefault,
        user
      ),
      icon: template.icon ? (
        <Icon
          value={template.icon}
          initial={template.initial}
          color={template.color ?? undefined}
        />
      ) : (
        <DocumentIcon />
      ),
      keywords: template.titleWithDefault,
      onClick: () => {
        const data = cloneDeep(template.data);
        ProsemirrorHelper.replaceTemplateVariables(data, user);
        editor.insertContent(data);
      },
    });

    const children = (): MenuItem[] => {
      const collectionTemplates = allTemplates.filter(
        (template) =>
          !template.isWorkspaceTemplate &&
          template.collectionId === collectionId
      );
      const workspaceTemplates = allTemplates.filter(
        (tmpl) => tmpl.isWorkspaceTemplate
      );

      const items: MenuItem[] = collectionTemplates.map(toMenuItem);

      if (collectionTemplates.length && workspaceTemplates.length) {
        items.push({ name: "separator" });
      }

      if (workspaceTemplates.length) {
        for (const template of workspaceTemplates) {
          items.push(toMenuItem(template));
        }
      }

      return items;
    };

    return {
      name: "noop",
      title: t("Templates"),
      icon: <ShapesIcon />,
      keywords: "template",
      children,
    } satisfies MenuItem;
  }, [user, templatesStore.orderedData, collectionId, editor, t]);
}

type InsertMode = "bible" | "egw" | "ai";

type Props = Omit<SuggestionsMenuProps, "renderMenuItem" | "items"> &
  Required<Pick<SuggestionsMenuProps, "embeds">>;

function BlockMenu(props: Props) {
  const { t } = useTranslation();
  const dictionary = useDictionary();
  const editor = useEditor();
  const { elementRef } = editor;
  const templateMenuItem = useTemplateMenuItem();
  const [insertMode, setInsertMode] = useState<InsertMode | null>(null);

  const documentId = editor.props.id;
  const { documents } = useStores();
  const document = documentId ? documents.get(documentId) : undefined;
  const documentTitle = document?.title ?? "";

  const medicalItems: MenuItem[] = useMemo(
    () => [
      { name: "separator" } as MenuItem,
      {
        name: "noop",
        title: t("Bible verse"),
        icon: <BookmarkedIcon />,
        keywords: "bible verse scripture reference",
        onClick: () => setInsertMode("bible"),
      },
      {
        name: "noop",
        title: t("Spirit of Prophecy"),
        icon: <LightBulbIcon />,
        keywords: "egw ellen white spirit prophecy sop quote",
        onClick: () => setInsertMode("egw"),
      },
      {
        name: "noop",
        title: t("AI explanation"),
        icon: <SparklesIcon />,
        keywords: "ai explain generate medical",
        onClick: () => setInsertMode("ai"),
      },
    ],
    [t]
  );

  const items = useMemo(() => {
    const baseItems = getMenuItems(dictionary, elementRef);
    const extras: MenuItem[] = [...medicalItems];

    if (templateMenuItem) {
      extras.push({ name: "separator" } as MenuItem, templateMenuItem);
    }

    return [...baseItems, ...extras];
  }, [dictionary, elementRef, medicalItems, templateMenuItem]);

  const handleInsert = useCallback(
    (text: string) => {
      setInsertMode(null);

      // Insert as markdown text parsed into the editor
      const { view } = editor;
      const { state } = view;
      const { $from } = state.selection;

      // Use the editor's parser to convert markdown to prosemirror nodes
      const parser = editor.parser;
      const doc = parser.parse(text);

      if (doc) {
        const start = $from.before($from.depth);
        const end = $from.after($from.depth);
        view.dispatch(state.tr.replaceWith(start, end, doc.content));
      }

      requestAnimationFrame(() => view.focus());
    },
    [editor]
  );

  const handleCloseDialog = useCallback(() => {
    setInsertMode(null);
    requestAnimationFrame(() => editor.view.focus());
  }, [editor]);

  const renderMenuItem = useCallback(
    (item, _index, options) => (
      <SuggestionsMenuItem
        {...options}
        icon={item.icon}
        title={item.title}
        shortcut={item.shortcut}
        disclosure={options.disclosure}
      />
    ),
    []
  );

  return (
    <>
      <SuggestionsMenu
        {...props}
        filterable
        trigger="/"
        renderMenuItem={renderMenuItem}
        items={items}
      />
      {insertMode &&
        createPortal(
          <MedicalInsertDialog
            mode={insertMode}
            documentTitle={documentTitle}
            onInsert={handleInsert}
            onClose={handleCloseDialog}
          />,
          window.document.body
        )}
    </>
  );
}

export default observer(BlockMenu);
