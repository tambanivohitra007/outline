"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "scriptures",
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
          },
          reference: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          text: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          book: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          chapter: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          verseStart: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          verseEnd: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          translation: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "KJV",
          },
          theme: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          spiritOfProphecy: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          sopSource: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          sopPage: {
            type: Sequelize.STRING,
            allowNull: true,
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
          teamId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: "teams",
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

      await queryInterface.addIndex("scriptures", ["conditionId"], {
        transaction,
      });
      await queryInterface.addIndex("scriptures", ["interventionId"], {
        transaction,
      });
      await queryInterface.addIndex("scriptures", ["book", "chapter"], {
        transaction,
      });
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("scriptures", { transaction });
    });
  },
};
