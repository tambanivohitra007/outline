"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "condition_interventions",
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
          interventionId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "interventions",
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
          evidenceLevel: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          recommendationLevel: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          clinicalNotes: {
            type: Sequelize.TEXT,
            allowNull: true,
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
        "condition_interventions",
        ["conditionId", "interventionId"],
        {
          unique: true,
          transaction,
        }
      );
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("condition_interventions", {
        transaction,
      });
    });
  },
};
