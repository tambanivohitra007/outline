"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "condition_recipes",
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
          },
          conditionId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "conditions",
              key: "id",
            },
            onDelete: "CASCADE",
          },
          recipeId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "recipes",
              key: "id",
            },
            onDelete: "CASCADE",
          },
          careDomainId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "care_domains",
              key: "id",
            },
          },
          sortOrder: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction }
      );

      await queryInterface.addIndex(
        "condition_recipes",
        ["conditionId", "recipeId"],
        {
          unique: true,
          transaction,
        }
      );
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("condition_recipes", { transaction });
    });
  },
};
