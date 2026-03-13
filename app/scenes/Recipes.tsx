import { observer } from "mobx-react";
import { LeafIcon, PlusIcon } from "outline-icons";
import { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Action } from "~/components/Actions";
import Button from "~/components/Button";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import useStores from "~/hooks/useStores";
import styled from "styled-components";
import { s } from "@shared/styles";

function Recipes() {
  const { t } = useTranslation();
  const { recipes } = useStores();

  useEffect(() => {
    void recipes.fetchPage();
  }, [recipes]);

  const handleCreate = useCallback(async () => {
    const name = window.prompt(t("Enter the recipe name:"));
    if (!name?.trim()) {
      return;
    }
    await recipes.create({
      name: name.trim(),
    });
  }, [recipes, t]);

  return (
    <Scene
      icon={<LeafIcon />}
      title={t("Recipes")}
      actions={
        <Action>
          <Button icon={<PlusIcon />} onClick={handleCreate}>
            {t("New recipe")}
          </Button>
        </Action>
      }
    >
      <Heading>{t("Recipes")}</Heading>
      <Text as="p" size="large">
        {t(
          "Plant-based recipes for therapeutic nutrition, organized by dietary needs and conditions."
        )}
      </Text>

      <Subheading sticky>{t("All Recipes")}</Subheading>

      {recipes.orderedData.length === 0 && recipes.isLoaded ? (
        <Empty>{t("No recipes have been created yet.")}</Empty>
      ) : (
        <RecipeGrid>
          {recipes.orderedData.map((recipe) => (
            <RecipeCard key={recipe.id}>
              <RecipeName>{recipe.name}</RecipeName>
              {recipe.description && (
                <RecipeDescription>{recipe.description}</RecipeDescription>
              )}
              <RecipeMeta>
                {recipe.prepTime != null && (
                  <MetaItem>
                    {t("Prep")}: {recipe.prepTime}{t("min")}
                  </MetaItem>
                )}
                {recipe.cookTime != null && (
                  <MetaItem>
                    {t("Cook")}: {recipe.cookTime}{t("min")}
                  </MetaItem>
                )}
                {recipe.servings != null && (
                  <MetaItem>
                    {t("Serves")}: {recipe.servings}
                  </MetaItem>
                )}
              </RecipeMeta>
              {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
                <TagList>
                  {recipe.dietaryTags.map((tag) => (
                    <DietaryTag key={tag}>{tag}</DietaryTag>
                  ))}
                </TagList>
              )}
            </RecipeCard>
          ))}
        </RecipeGrid>
      )}
    </Scene>
  );
}

const RecipeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 8px;
`;

const RecipeCard = styled.div`
  border: 1px solid ${s("divider")};
  border-radius: 8px;
  padding: 16px;
  transition: all 100ms ease-in-out;

  &:hover {
    border-color: ${s("accent")};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const RecipeName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: ${s("text")};
`;

const RecipeDescription = styled.p`
  margin: 0 0 8px 0;
  font-size: 13px;
  color: ${s("textSecondary")};
  line-height: 1.4;
`;

const RecipeMeta = styled(Flex)`
  gap: 12px;
  margin-bottom: 8px;
`;

const MetaItem = styled.span`
  font-size: 12px;
  color: ${s("textTertiary")};
`;

const TagList = styled(Flex)`
  flex-wrap: wrap;
  gap: 4px;
`;

const DietaryTag = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
  background: #d4edda;
  color: #155724;
`;

export default observer(Recipes);
