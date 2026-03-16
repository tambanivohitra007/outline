The platform supports creating and managing therapeutic recipes that can be linked to conditions as part of lifestyle medicine treatment plans.

## What is a recipe?

A recipe represents a food preparation with nutritional and therapeutic value. Recipes can be linked to conditions through care domains, making them part of the treatment guide.

## Recipe fields

| Field | Description |
|-------|-------------|
| **Name** | Recipe name (e.g., "Anti-Inflammatory Turmeric Smoothie") |
| **Description** | Brief description of the recipe and its health benefits |
| **Servings** | Number of servings the recipe yields |
| **Prep Time** | Preparation time in minutes |
| **Cook Time** | Cooking time in minutes |
| **Ingredients** | List of ingredients with quantities and units |
| **Instructions** | Step-by-step preparation instructions |
| **Dietary Tags** | Labels like "vegan", "gluten-free", "raw", "whole-food" |
| **Nutrition Data** | Nutritional information per serving (calories, macros, key nutrients) |
| **Document** | Optional backing document for detailed notes, variations, or research |

## Creating a recipe

1. Navigate to the **Recipes** section
2. Click **New Recipe**
3. Fill in the recipe details
4. Save

## Linking recipes to conditions

Recipes are linked to conditions through **condition-recipe** associations. Each link specifies:
- The **condition** the recipe is recommended for
- The **care domain** it falls under (typically Nutrition)

## Dietary tags

Use dietary tags to help users filter recipes by dietary requirements:

| Tag | Meaning |
|-----|---------|
| vegan | Contains no animal products |
| vegetarian | No meat or fish |
| gluten-free | No gluten-containing ingredients |
| raw | No cooking required |
| whole-food | Made from minimally processed ingredients |
| nut-free | Contains no tree nuts or peanuts |
| soy-free | Contains no soy products |

## Nutrition data

Nutrition data is stored as structured JSON. Include as much detail as available:
- Calories per serving
- Macronutrients (protein, carbohydrates, fat, fiber)
- Key micronutrients relevant to the condition (e.g., potassium for hypertension)
