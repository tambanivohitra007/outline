"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "condition_sections",
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
          sectionType: {
            type: Sequelize.ENUM(
              "risk_factors",
              "physiology",
              "complications",
              "solutions",
              "bible_sop",
              "research_ideas"
            ),
            allowNull: false,
          },
          careDomainId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "care_domains",
              key: "id",
            },
          },
          documentId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "documents",
              key: "id",
            },
          },
          title: {
            type: Sequelize.STRING,
            allowNull: false,
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

      await queryInterface.addIndex("condition_sections", ["conditionId"], {
        transaction,
      });
      await queryInterface.addIndex("condition_sections", ["documentId"], {
        transaction,
      });
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("condition_sections", { transaction });
    });
  },
};
