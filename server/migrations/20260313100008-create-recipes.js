"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "recipes",
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          slug: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          servings: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          prepTime: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          cookTime: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          ingredients: {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          instructions: {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          dietaryTags: {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          nutritionData: {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          documentId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "documents",
              key: "id",
            },
          },
          teamId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "teams",
              key: "id",
            },
          },
          createdById: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "users",
              key: "id",
            },
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction }
      );

      await queryInterface.addIndex("recipes", ["teamId"], {
        transaction,
      });
      await queryInterface.addIndex("recipes", ["slug", "teamId"], {
        unique: true,
        transaction,
      });
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("recipes", { transaction });
    });
  },
};
