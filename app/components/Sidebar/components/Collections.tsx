import fractionalIndex from "fractional-index";
import { observer } from "mobx-react";
import { useMemo, useState } from "react";
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { s } from "@shared/styles";
import type Collection from "~/models/Collection";
import Flex from "~/components/Flex";
import Error from "~/components/List/Error";
import PaginatedList from "~/components/PaginatedList";
import { createCollection } from "~/actions/definitions/collections";
import useStores from "~/hooks/useStores";
import type { DragObject } from "../hooks/useDragAndDrop";
import DraggableCollectionLink from "./DraggableCollectionLink";
import DropCursor from "./DropCursor";
import Header from "./Header";
import PlaceholderCollections from "./PlaceholderCollections";
import Relative from "./Relative";
import SidebarAction from "./SidebarAction";
import SidebarContext from "./SidebarContext";
import SidebarLink from "./SidebarLink";
import Text from "@shared/components/Text";
import usePolicy from "~/hooks/usePolicy";

function Collections() {
  const { documents, auth, collections } = useStores();
  const { t } = useTranslation();
  const can = usePolicy(auth.team?.id);
  const [filter, setFilter] = useState("");

  const sidebarCollections = collections.sidebarCollections;
  const orderedCollections = useMemo(() => {
    if (!filter.trim()) {
      return sidebarCollections;
    }
    const q = filter.trim().toLowerCase();
    return sidebarCollections.filter((c) =>
      c.name.toLowerCase().includes(q)
    );
  }, [sidebarCollections, filter]);

  const params = useMemo(
    () => ({
      limit: 100,
    }),
    []
  );

  const [
    { isCollectionDropping, isDraggingAnyCollection },
    dropToReorderCollection,
  ] = useDrop({
    accept: "collection",
    drop: async (item: DragObject) => {
      void collections.move(
        item.id,
        fractionalIndex(null, sidebarCollections[0].index)
      );
    },
    canDrop: (item) =>
      sidebarCollections.length > 0 &&
      item.id !== sidebarCollections[0].id,
    collect: (monitor) => ({
      isCollectionDropping: monitor.isOver(),
      isDraggingAnyCollection: monitor.getItemType() === "collection",
    }),
  });

  const showFilter = sidebarCollections.length > 5;

  return (
    <SidebarContext.Provider value="collections">
      <Flex column>
        <Header id="collections" title={t("Collections")}>
          {showFilter && (
            <FilterWrapper>
              <FilterInput
                type="text"
                placeholder={`${t("Filter collections")}…`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </FilterWrapper>
          )}
          <Relative>
            <PaginatedList<Collection>
              options={params}
              aria-label={t("Collections")}
              items={orderedCollections}
              loading={<PlaceholderCollections />}
              heading={
                isDraggingAnyCollection ? (
                  <DropCursor
                    isActiveDrop={isCollectionDropping}
                    innerRef={dropToReorderCollection}
                    position="top"
                  />
                ) : undefined
              }
              empty={
                filter ? (
                  <SidebarLink
                    label={
                      <Text type="tertiary" size="small" italic>
                        {t("No matching collections")}
                      </Text>
                    }
                    onClick={() => {}}
                    depth={1.5}
                  />
                ) : can.createCollection ? null : (
                  <SidebarLink
                    label={
                      <Text type="tertiary" size="small" italic>
                        {t("No collections")}
                      </Text>
                    }
                    onClick={() => {}}
                    depth={1.5}
                  />
                )
              }
              renderError={(props) => <StyledError {...props} />}
              renderItem={(item, index) => (
                <DraggableCollectionLink
                  key={item.id}
                  collection={item}
                  activeDocument={documents.active}
                  belowCollection={orderedCollections[index + 1]}
                />
              )}
            />
            <SidebarAction action={createCollection} depth={0} />
          </Relative>
        </Header>
      </Flex>
    </SidebarContext.Provider>
  );
}

export const StyledError = styled(Error)`
  font-size: 15px;
  padding: 0 8px;
`;

const FilterWrapper = styled.div`
  padding: 4px 12px 4px 12px;
`;

const FilterInput = styled.input`
  width: 100%;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid ${s("inputBorder")};
  border-radius: 4px;
  background: ${s("backgroundSecondary")};
  color: ${s("text")};
  outline: none;

  &:focus {
    border-color: ${s("accent")};
  }

  &::placeholder {
    color: ${s("textTertiary")};
  }
`;

export default observer(Collections);
