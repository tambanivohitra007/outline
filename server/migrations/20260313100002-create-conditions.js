"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "conditions",
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
          snomedCode: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          icdCode: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          status: {
            type: Sequelize.ENUM("draft", "review", "published"),
            allowNull: false,
            defaultValue: "draft",
          },
          overviewDocumentId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "documents",
              key: "id",
            },
          },
          collectionId: {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
              model: "collections",
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

      await queryInterface.addIndex("conditions", ["teamId"], {
        transaction,
      });
      await queryInterface.addIndex("conditions", ["slug", "teamId"], {
        unique: true,
        transaction,
      });
      await queryInterface.addIndex("conditions", ["snomedCode"], {
        transaction,
      });
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("conditions", { transaction });
    });
  },
};
