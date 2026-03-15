import { observer } from "mobx-react";
import { LeafIcon, PlusIcon, CloseIcon, TrashIcon, EditIcon } from "outline-icons";
import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Action } from "~/components/Actions";
import Button from "~/components/Button";
import Empty from "~/components/Empty";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import Scene from "~/components/Scene";
import Subheading from "~/components/Subheading";
import Text from "~/components/Text";
import type Recipe from "~/models/Recipe";
import useStores from "~/hooks/useStores";
import styled from "styled-components";
import { s } from "@shared/styles";

function Recipes() {
  const { t } = useTranslation();
  const { recipes } = useStores();

  const [search, setSearch] = useState("");

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createServings, setCreateServings] = useState("");
  const [createPrepTime, setCreatePrepTime] = useState("");
  const [createCookTime, setCreateCookTime] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal state
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editServings, setEditServings] = useState("");
  const [editPrepTime, setEditPrepTime] = useState("");
  const [editCookTime, setEditCookTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void recipes.fetchPage();
  }, [recipes]);

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) {
      return;
    }
    setIsCreating(true);
    try {
      await recipes.create({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        servings: createServings ? parseInt(createServings, 10) : undefined,
        prepTime: createPrepTime ? parseInt(createPrepTime, 10) : undefined,
        cookTime: createCookTime ? parseInt(createCookTime, 10) : undefined,
      });
      setCreateName("");
      setCreateDescription("");
      setCreateServings("");
      setCreatePrepTime("");
      setCreateCookTime("");
      setShowCreateForm(false);
    } finally {
      setIsCreating(false);
    }
  }, [recipes, createName, createDescription, createServings, createPrepTime, createCookTime]);

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setCreateName("");
    setCreateDescription("");
    setCreateServings("");
    setCreatePrepTime("");
    setCreateCookTime("");
  }, []);

  const handleStartEdit = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setEditName(recipe.name);
    setEditDescription(recipe.description ?? "");
    setEditServings(recipe.servings != null ? String(recipe.servings) : "");
    setEditPrepTime(recipe.prepTime != null ? String(recipe.prepTime) : "");
    setEditCookTime(recipe.cookTime != null ? String(recipe.cookTime) : "");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingRecipe(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingRecipe || !editName.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await recipes.update({
        id: editingRecipe.id,
        name: editName.trim(),
        description: editDescription.trim() || null,
        servings: editServings ? parseInt(editServings, 10) : null,
        prepTime: editPrepTime ? parseInt(editPrepTime, 10) : null,
        cookTime: editCookTime ? parseInt(editCookTime, 10) : null,
      });
      setEditingRecipe(null);
      toast.success(t("Recipe updated"));
    } finally {
      setIsSaving(false);
    }
  }, [recipes, editingRecipe, editName, editDescription, editServings, editPrepTime, editCookTime, t]);

  const handleModalBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleCancelEdit();
    }
  }, [handleCancelEdit]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, recipe: Recipe) => {
      e.stopPropagation();
      const confirmed = window.confirm(
        t(
          `Are you sure you want to delete "{{ recipeName }}"?`,
          { recipeName: recipe.name }
        )
      );
      if (!confirmed) {
        return;
      }
      await recipes.delete(recipe);
      toast.success(t("Recipe deleted"));
    },
    [recipes, t]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return recipes.orderedData;
    }
    const q = search.trim().toLowerCase();
    return recipes.orderedData.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [recipes.orderedData, search]);

  return (
    <Scene
      icon={<LeafIcon />}
      title={t("Recipes")}
      actions={
        <Action>
          <Button
            icon={<PlusIcon />}
            onClick={() => setShowCreateForm(true)}
          >
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

      {showCreateForm && (
        <CreateFormCard>
          <CreateFormHeader>
            <CreateFormTitle>{t("New Recipe")}</CreateFormTitle>
            <CloseButton onClick={handleCancelCreate}>
              <CloseIcon size={16} />
            </CloseButton>
          </CreateFormHeader>
          <CreateFormFields>
            <FormGroup>
              <FormLabel>{t("Recipe Name")} *</FormLabel>
              <FormInput
                placeholder={t("e.g. Anti-Inflammatory Turmeric Smoothie")}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                autoFocus
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>{t("Description")}</FormLabel>
              <FormTextarea
                placeholder={t("Brief description of this recipe\u2026")}
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={4}
              />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <FormLabel>{t("Servings")}</FormLabel>
                <FormInput
                  type="number"
                  placeholder={t("e.g. 4")}
                  value={createServings}
                  onChange={(e) => setCreateServings(e.target.value)}
                  min="1"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("Prep Time (min)")}</FormLabel>
                <FormInput
                  type="number"
                  placeholder={t("e.g. 15")}
                  value={createPrepTime}
                  onChange={(e) => setCreatePrepTime(e.target.value)}
                  min="0"
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("Cook Time (min)")}</FormLabel>
                <FormInput
                  type="number"
                  placeholder={t("e.g. 30")}
                  value={createCookTime}
                  onChange={(e) => setCreateCookTime(e.target.value)}
                  min="0"
                />
              </FormGroup>
            </FormRow>
            <FormActions>
              <CreateButton
                onClick={handleCreate}
                disabled={!createName.trim() || isCreating}
              >
                {isCreating ? `${t("Creating")}\u2026` : t("Create Recipe")}
              </CreateButton>
              <CancelButton onClick={handleCancelCreate}>
                {t("Cancel")}
              </CancelButton>
            </FormActions>
          </CreateFormFields>
        </CreateFormCard>
      )}

      <FilterRow>
        <SearchInput
          placeholder={t("Search recipes\u2026")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </FilterRow>

      <Subheading sticky>{t("All Recipes")}</Subheading>

      {filtered.length === 0 && recipes.isLoaded ? (
        <Empty>
          {search.trim()
            ? t("No recipes matching your search.")
            : t("No recipes have been created yet.")}
        </Empty>
      ) : (
        <RecipeGrid>
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id}>
              <CardHeader>
                <RecipeName>{recipe.name}</RecipeName>
                <CardActions>
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(recipe);
                    }}
                    title={t("Edit recipe")}
                  >
                    <EditIcon size={14} />
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => handleDelete(e, recipe)}
                    title={t("Delete recipe")}
                    $danger
                  >
                    <TrashIcon size={14} />
                  </ActionButton>
                </CardActions>
              </CardHeader>
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

      {editingRecipe && (
        <ModalOverlay onClick={handleModalBackdropClick}>
          <ModalContent ref={modalRef}>
            <CreateFormHeader>
              <CreateFormTitle>{t("Edit Recipe")}</CreateFormTitle>
              <CloseButton onClick={handleCancelEdit}>
                <CloseIcon size={16} />
              </CloseButton>
            </CreateFormHeader>
            <CreateFormFields>
              <FormGroup>
                <FormLabel>{t("Recipe Name")} *</FormLabel>
                <FormInput
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>{t("Description")}</FormLabel>
                <FormTextarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                />
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <FormLabel>{t("Servings")}</FormLabel>
                  <FormInput
                    type="number"
                    value={editServings}
                    onChange={(e) => setEditServings(e.target.value)}
                    min="1"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t("Prep Time (min)")}</FormLabel>
                  <FormInput
                    type="number"
                    value={editPrepTime}
                    onChange={(e) => setEditPrepTime(e.target.value)}
                    min="0"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>{t("Cook Time (min)")}</FormLabel>
                  <FormInput
                    type="number"
                    value={editCookTime}
                    onChange={(e) => setEditCookTime(e.target.value)}
                    min="0"
                  />
                </FormGroup>
              </FormRow>
              <FormActions>
                <CreateButton
                  onClick={handleSaveEdit}
                  disabled={!editName.trim() || isSaving}
                >
                  {isSaving ? `${t("Saving")}\u2026` : t("Save Changes")}
                </CreateButton>
                <CancelButton onClick={handleCancelEdit}>
                  {t("Cancel")}
                </CancelButton>
              </FormActions>
            </CreateFormFields>
          </ModalContent>
        </ModalOverlay>
      )}
    </Scene>
  );
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: ${s("background")};
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const CreateFormCard = styled.div`
  border: 1px solid ${s("accent")};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  background: ${s("background")};
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const CreateFormHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CreateFormTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${s("text")};
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  border-radius: 4px;
  color: ${s("textTertiary")};
  cursor: pointer;

  &:hover {
    color: ${s("text")};
  }
`;

const CreateFormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const FormRow = styled(Flex)`
  gap: 12px;
  flex-wrap: wrap;
`;

const FormLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${s("textSecondary")};
`;

const FormInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    border-color: ${s("accent")};
  }
`;

const FormTextarea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;

  &:focus {
    border-color: ${s("accent")};
  }
`;

const FormActions = styled(Flex)`
  gap: 8px;
  margin-top: 4px;
`;

const CreateButton = styled.button`
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: ${(props) => props.theme.accent};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 100ms ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 8px 20px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: transparent;
  color: ${s("textSecondary")};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: ${s("text")};
  }
`;

const FilterRow = styled(Flex)`
  margin: 16px 0;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid ${s("divider")};
  border-radius: 6px;
  background: ${s("background")};
  color: ${s("text")};
  font-size: 14px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${s("accent")};
  }
`;

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

const CardHeader = styled(Flex)`
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const CardActions = styled(Flex)`
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 100ms ease;

  ${RecipeCard}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: none;
  border-radius: 4px;
  color: ${s("textTertiary")};
  cursor: pointer;
  transition: color 100ms ease;

  &:hover {
    color: ${(props) => (props.$danger ? props.theme.danger : props.theme.accent)};
  }
`;

const RecipeName = styled.h3`
  margin: 0;
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
