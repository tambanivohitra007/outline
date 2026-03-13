"use strict";

const { v4: uuidv4 } = require("uuid");

const careDomains = [
  { name: "Nutrition", slug: "nutrition", icon: "utensils", color: "#16a34a", description: "Culinary medicine, plant-based nutrition" },
  { name: "Exercise", slug: "exercise", icon: "dumbbell", color: "#2563eb", description: "Physical activity, fitness interventions" },
  { name: "Water Therapy", slug: "water-therapy", icon: "droplets", color: "#0891b2", description: "Hydrotherapy, hydration" },
  { name: "Sunlight", slug: "sunlight", icon: "sun", color: "#f59e0b", description: "Light therapy, vitamin D optimization" },
  { name: "Temperance", slug: "temperance", icon: "shield", color: "#7c3aed", description: "Avoiding harmful substances" },
  { name: "Air", slug: "air", icon: "wind", color: "#06b6d4", description: "Fresh air, breathing exercises" },
  { name: "Rest", slug: "rest", icon: "moon", color: "#6366f1", description: "Sleep hygiene, Sabbath rest" },
  { name: "Trust in God", slug: "trust-in-god", icon: "heart", color: "#e63950", description: "Spiritual care, faith-based healing" },
  { name: "Mental Health", slug: "mental-health", icon: "brain", color: "#ec4899", description: "Stress management, emotional wellness" },
  { name: "Supplements", slug: "supplements", icon: "pill", color: "#84cc16", description: "Herbs, vitamins, natural supplements" },
  { name: "Medications", slug: "medications", icon: "syringe", color: "#64748b", description: "Pharmaceutical interventions" },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const rows = careDomains.map((domain, index) => ({
        id: uuidv4(),
        ...domain,
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      }));
      await queryInterface.bulkInsert("care_domains", rows, { transaction });
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete("care_domains", null, { transaction });
    });
  },
};
