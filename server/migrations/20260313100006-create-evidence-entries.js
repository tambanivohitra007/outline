"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "evidence_entries",
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
          },
          conditionId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "conditions",
              key: "id",
            },
            onDelete: "SET NULL",
          },
          interventionId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "interventions",
              key: "id",
            },
            onDelete: "SET NULL",
          },
          pubmedId: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          doi: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          title: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          authors: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          journal: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          publicationDate: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          abstract: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          url: {
            type: Sequelize.STRING(2048),
            allowNull: true,
          },
          studyType: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          qualityRating: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          sampleSize: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          summary: {
            type: Sequelize.TEXT,
            allowNull: true,
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
        },
        { transaction }
      );

      await queryInterface.addIndex("evidence_entries", ["conditionId"], {
        transaction,
      });
      await queryInterface.addIndex("evidence_entries", ["interventionId"], {
        transaction,
      });
      await queryInterface.addIndex("evidence_entries", ["pubmedId"], {
        transaction,
      });
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("evidence_entries", { transaction });
    });
  },
};
