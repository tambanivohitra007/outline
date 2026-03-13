"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "interventions",
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
          category: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
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

      await queryInterface.addIndex("interventions", ["teamId"], {
        transaction,
      });
      await queryInterface.addIndex("interventions", ["slug", "teamId"], {
        unique: true,
        transaction,
      });
      await queryInterface.addIndex("interventions", ["careDomainId"], {
        transaction,
      });
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("interventions", { transaction });
    });
  },
};
