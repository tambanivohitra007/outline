"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("scriptures", "careDomainId", {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
      references: {
        model: "care_domains",
        key: "id",
      },
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("scriptures", ["careDomainId"]);

    // Map existing scriptures to care domains based on their themes
    const themeToSlug = {
      nutrition: "nutrition",
      temperance: "temperance",
      healing: "trust-in-god",
      air: "air",
      "heart-health": "nutrition",
      health: "nutrition",
      trust: "trust-in-god",
      comfort: "mental-health",
      "mental-health": "mental-health",
    };

    for (const [theme, slug] of Object.entries(themeToSlug)) {
      await queryInterface.sequelize.query(
        `UPDATE scriptures SET "careDomainId" = (
          SELECT id FROM care_domains WHERE slug = :slug LIMIT 1
        ) WHERE theme = :theme AND "careDomainId" IS NULL`,
        { replacements: { slug, theme } }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("scriptures", "careDomainId");
  },
};
