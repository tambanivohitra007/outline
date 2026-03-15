"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();

      // ── Clear ALL existing data ────────────────────────────
      await queryInterface.bulkDelete("condition_recipes", null, { transaction });
      await queryInterface.bulkDelete("condition_interventions", null, { transaction });
      await queryInterface.bulkDelete("evidence_entries", null, { transaction });
      await queryInterface.bulkDelete("scriptures", null, { transaction });
      await queryInterface.bulkDelete("condition_sections", null, { transaction });
      await queryInterface.bulkDelete("recipes", null, { transaction });
      await queryInterface.bulkDelete("interventions", null, { transaction });
      await queryInterface.bulkDelete("conditions", null, { transaction });

      // Clean up all referencing tables, then documents and collections
      await queryInterface.sequelize.query(`DELETE FROM "stars"`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM "views"`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM "revisions"`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM "backlinks"`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM "events"`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM "notifications"`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM "search_queries"`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM "collection_groups"`, { transaction });
      await queryInterface.sequelize.query(`DELETE FROM "collection_users"`, { transaction });
      await queryInterface.bulkDelete("documents", null, { transaction });
      await queryInterface.bulkDelete("collections", null, { transaction });

      // Get team and user
      const [teams] = await queryInterface.sequelize.query(
        `SELECT id FROM teams LIMIT 1`,
        { transaction }
      );
      if (!teams.length) {
        console.log("No teams found — skipping seed.");
        return;
      }
      const teamId = teams[0].id;

      const [users] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE "teamId" = :teamId LIMIT 1`,
        { replacements: { teamId }, transaction }
      );
      if (!users.length) {
        console.log("No users found — skipping seed.");
        return;
      }
      const userId = users[0].id;

      // Get care domains
      const [domains] = await queryInterface.sequelize.query(
        `SELECT id, slug FROM care_domains`,
        { transaction }
      );
      const dm = {};
      for (const d of domains) {
        dm[d.slug] = d.id;
      }

      // ══════════════════════════════════════════════════════════
      //  CONDITIONS
      // ══════════════════════════════════════════════════════════

      const conditions = [
        { id: uuidv4(), name: "Obesity", slug: "obesity", snomedCode: "414916001", icdCode: "E66", status: "published" },
        { id: uuidv4(), name: "Gastroesophageal Reflux Disease (GERD)", slug: "gerd", snomedCode: "235595009", icdCode: "K21", status: "published" },
        { id: uuidv4(), name: "Rheumatoid Arthritis", slug: "rheumatoid-arthritis", snomedCode: "69896004", icdCode: "M06.9", status: "review" },
        { id: uuidv4(), name: "Chronic Obstructive Pulmonary Disease (COPD)", slug: "copd", snomedCode: "13645005", icdCode: "J44.1", status: "review" },
        { id: uuidv4(), name: "Coronary Artery Disease (CAD)", slug: "coronary-artery-disease", snomedCode: "53741008", icdCode: "I25.10", status: "published" },
        { id: uuidv4(), name: "Migraines", slug: "migraines", snomedCode: "37796009", icdCode: "G43", status: "draft" },
      ];

      // Create a collection for each condition
      const collectionMap = {};
      for (const condition of conditions) {
        const collId = uuidv4();
        collectionMap[condition.slug] = collId;
        await queryInterface.bulkInsert("collections", [{
          id: collId,
          urlId: uuidv4().replace(/-/g, "").slice(0, 10),
          name: condition.name,
          description: `Treatment guide for ${condition.name}`,
          icon: "kit-medical",
          teamId,
          createdById: userId,
          permission: "read_write",
          maintainerApprovalRequired: false,
          sharing: true,
          sort: JSON.stringify({ field: "index", direction: "asc" }),
          documentStructure: JSON.stringify([]),
          createdAt: now,
          updatedAt: now,
        }], { transaction });
      }

      await queryInterface.bulkInsert(
        "conditions",
        conditions.map((c) => ({
          ...c,
          overviewDocumentId: null,
          collectionId: collectionMap[c.slug],
          teamId,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })),
        { transaction }
      );

      // Helper to find condition id by slug
      const cid = (slug) => conditions.find((c) => c.slug === slug).id;

      // ══════════════════════════════════════════════════════════
      //  CONDITION SECTIONS
      // ══════════════════════════════════════════════════════════

      const sectionDefs = [
        { sectionType: "risk_factors", title: "Risk Factors/Causes", sortOrder: 0, icon: "warning" },
        { sectionType: "physiology", title: "Relevant Physiology", sortOrder: 1, icon: "beaker" },
        { sectionType: "complications", title: "Complications", sortOrder: 2, icon: "flame" },
        { sectionType: "solutions", title: "Solutions", sortOrder: 3, icon: "done" },
        { sectionType: "bible_sop", title: "Bible & Spirit of Prophecy", sortOrder: 4, icon: "book" },
        { sectionType: "research_ideas", title: "Ideas for Potential Research", sortOrder: 5, icon: "lightbulb" },
      ];

      // Short random id generator for urlId
      const urlId = () => uuidv4().replace(/-/g, "").slice(0, 10);

      const sectionRows = [];
      const documentRows = [];

      for (const condition of conditions) {
        const collId = collectionMap[condition.slug];
        const docStructure = [];

        for (const st of sectionDefs) {
          const docId = uuidv4();
          const docTitle = `${condition.name} \u2014 ${st.title}`;

          documentRows.push({
            id: docId,
            urlId: urlId(),
            title: docTitle,
            text: `# ${docTitle}\n\n`,
            collectionId: collId,
            teamId,
            createdById: userId,
            lastModifiedById: userId,
            publishedAt: now,
            icon: st.icon,
            revisionCount: 0,
            isWelcome: false,
            template: false,
            fullWidth: false,
            insightsEnabled: true,
            collaboratorIds: [userId],
            popularityScore: 0,
            createdAt: now,
            updatedAt: now,
          });

          sectionRows.push({
            id: uuidv4(),
            conditionId: condition.id,
            sectionType: st.sectionType,
            careDomainId: null,
            documentId: docId,
            title: st.title,
            sortOrder: st.sortOrder,
            createdAt: now,
            updatedAt: now,
          });

          const docSlug = docTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          docStructure.push({ id: docId, title: docTitle, url: `/doc/${docSlug}-${documentRows[documentRows.length - 1].urlId}`, children: [] });
        }

        // Update collection documentStructure
        await queryInterface.sequelize.query(
          `UPDATE collections SET "documentStructure" = :ds WHERE id = :collId`,
          {
            replacements: { ds: JSON.stringify(docStructure), collId },
            transaction,
          }
        );
      }

      await queryInterface.bulkInsert("documents", documentRows, { transaction });
      await queryInterface.bulkInsert("condition_sections", sectionRows, { transaction });

      // ══════════════════════════════════════════════════════════
      //  INTERVENTIONS
      // ══════════════════════════════════════════════════════════

      const interventions = [
        // Nutrition
        { id: uuidv4(), name: "Plant-Based Diet", slug: "plant-based-diet", category: "Nutrition", careDomainSlug: "nutrition", description: "Whole-food plant-based dietary pattern emphasizing fruits, vegetables, legumes, whole grains, nuts, and seeds." },
        { id: uuidv4(), name: "DASH Diet", slug: "dash-diet", category: "Nutrition", careDomainSlug: "nutrition", description: "Dietary Approaches to Stop Hypertension — high in fruits, vegetables, whole grains, low in sodium and saturated fat." },
        { id: uuidv4(), name: "Mediterranean Diet", slug: "mediterranean-diet", category: "Nutrition", careDomainSlug: "nutrition", description: "Emphasizes olive oil, fish, whole grains, legumes, fruits, vegetables, and nuts." },
        { id: uuidv4(), name: "Anti-Inflammatory Diet", slug: "anti-inflammatory-diet", category: "Nutrition", careDomainSlug: "nutrition", description: "Eliminates processed foods, refined sugars, and emphasizes omega-3 rich foods, turmeric, ginger, and colorful produce." },
        { id: uuidv4(), name: "Low-Acid Diet", slug: "low-acid-diet", category: "Nutrition", careDomainSlug: "nutrition", description: "Avoids citrus, tomatoes, chocolate, coffee, spicy and fried foods. Emphasizes alkaline foods to reduce reflux symptoms." },
        { id: uuidv4(), name: "Elimination Diet", slug: "elimination-diet", category: "Nutrition", careDomainSlug: "nutrition", description: "Systematic removal and reintroduction of potential trigger foods to identify dietary causes of migraines." },
        { id: uuidv4(), name: "Caloric Restriction", slug: "caloric-restriction", category: "Nutrition", careDomainSlug: "nutrition", description: "Moderate caloric deficit (500-750 kcal/day) combined with nutrient-dense foods for sustainable weight loss." },
        { id: uuidv4(), name: "Intermittent Fasting", slug: "intermittent-fasting", category: "Nutrition", careDomainSlug: "nutrition", description: "Time-restricted eating (16:8 or 5:2 patterns) to improve insulin sensitivity and promote autophagy." },

        // Exercise
        { id: uuidv4(), name: "Aerobic Exercise Program", slug: "aerobic-exercise", category: "Exercise", careDomainSlug: "exercise", description: "150 minutes/week of moderate-intensity aerobic activity (brisk walking, cycling, swimming)." },
        { id: uuidv4(), name: "Resistance Training", slug: "resistance-training", category: "Exercise", careDomainSlug: "exercise", description: "Progressive resistance exercises 2-3x/week targeting major muscle groups." },
        { id: uuidv4(), name: "Pulmonary Rehabilitation", slug: "pulmonary-rehab", category: "Exercise", careDomainSlug: "exercise", description: "Supervised exercise program with education for COPD patients, including endurance and strength training with breathing techniques." },
        { id: uuidv4(), name: "Low-Impact Joint Exercise", slug: "low-impact-joint-exercise", category: "Exercise", careDomainSlug: "exercise", description: "Gentle exercises (swimming, tai chi, yoga) that maintain joint mobility without stressing inflamed joints." },
        { id: uuidv4(), name: "Yoga", slug: "yoga", category: "Exercise", careDomainSlug: "exercise", description: "Mind-body practice combining postures, breathing, and meditation. Reduces stress, improves flexibility and pain management." },

        // Water Therapy
        { id: uuidv4(), name: "Hydrotherapy", slug: "hydrotherapy", category: "Water Therapy", careDomainSlug: "water-therapy", description: "Therapeutic use of water: contrast showers, warm baths, and aquatic exercises for pain relief and circulation." },
        { id: uuidv4(), name: "Adequate Hydration", slug: "adequate-hydration", category: "Water Therapy", careDomainSlug: "water-therapy", description: "8-10 glasses of water daily, avoiding drinking during meals to reduce GERD symptoms." },

        // Sunlight
        { id: uuidv4(), name: "Morning Sunlight Exposure", slug: "morning-sunlight", category: "Sunlight", careDomainSlug: "sunlight", description: "15-30 minutes of morning sunlight to optimize circadian rhythm, vitamin D synthesis, and mood." },

        // Temperance
        { id: uuidv4(), name: "Smoking Cessation", slug: "smoking-cessation", category: "Temperance", careDomainSlug: "temperance", description: "Complete tobacco cessation — critical for COPD management and cardiovascular risk reduction." },
        { id: uuidv4(), name: "Alcohol Cessation", slug: "alcohol-cessation", category: "Temperance", careDomainSlug: "temperance", description: "Complete abstinence from alcohol to reduce GERD, liver stress, and weight gain." },
        { id: uuidv4(), name: "Caffeine Reduction", slug: "caffeine-reduction", category: "Temperance", careDomainSlug: "temperance", description: "Gradual reduction or elimination of caffeine to reduce migraine triggers and GERD symptoms." },

        // Air
        { id: uuidv4(), name: "Deep Breathing Exercises", slug: "deep-breathing", category: "Air", careDomainSlug: "air", description: "Diaphragmatic breathing, pursed-lip breathing, and box breathing for stress reduction and lung function." },
        { id: uuidv4(), name: "Air Quality Management", slug: "air-quality", category: "Air", careDomainSlug: "air", description: "HEPA filtration, avoiding pollutants, and spending time in clean outdoor environments." },

        // Rest
        { id: uuidv4(), name: "Sleep Hygiene Protocol", slug: "sleep-hygiene", category: "Rest", careDomainSlug: "rest", description: "7-9 hours consistent sleep, dark cool room, no screens 1hr before bed, regular schedule." },
        { id: uuidv4(), name: "Elevated Head Sleep Position", slug: "elevated-head-sleep", category: "Rest", careDomainSlug: "rest", description: "Sleeping with head elevated 6-8 inches to prevent nighttime acid reflux. Left-side sleeping preferred." },

        // Trust in God
        { id: uuidv4(), name: "Scripture-Based Meditation", slug: "scripture-meditation", category: "Trust in God", careDomainSlug: "trust-in-god", description: "Daily meditative reading of Scripture focused on healing promises and God\u2019s care for physical wellbeing." },
        { id: uuidv4(), name: "Prayer Therapy", slug: "prayer-therapy", category: "Trust in God", careDomainSlug: "trust-in-god", description: "Structured intercessory and personal prayer as part of holistic healing, reducing anxiety and promoting hope." },

        // Mental Health
        { id: uuidv4(), name: "Mindfulness Meditation", slug: "mindfulness-meditation", category: "Mental Health", careDomainSlug: "mental-health", description: "Daily 10-20 minute meditation for stress reduction, pain perception management, and emotional regulation." },
        { id: uuidv4(), name: "Cognitive Behavioral Therapy", slug: "cbt", category: "Mental Health", careDomainSlug: "mental-health", description: "Structured therapeutic approach to identify and reframe negative thought patterns, manage chronic pain and stress." },
        { id: uuidv4(), name: "Stress Management Program", slug: "stress-management", category: "Mental Health", careDomainSlug: "mental-health", description: "Comprehensive program combining relaxation techniques, time management, and social support for chronic disease management." },
        { id: uuidv4(), name: "Biofeedback", slug: "biofeedback", category: "Mental Health", careDomainSlug: "mental-health", description: "Electronic monitoring to teach voluntary control of physiological processes. Effective for migraine prevention." },

        // Supplements
        { id: uuidv4(), name: "Omega-3 Supplementation", slug: "omega-3", category: "Supplements", careDomainSlug: "supplements", description: "EPA/DHA (1-2g daily) from algae-based sources for anti-inflammatory and cardiovascular benefits." },
        { id: uuidv4(), name: "Vitamin D Supplementation", slug: "vitamin-d", category: "Supplements", careDomainSlug: "supplements", description: "Vitamin D3 1000-4000 IU daily to maintain 40-60 ng/mL serum levels for immune and bone health." },
        { id: uuidv4(), name: "Magnesium Supplementation", slug: "magnesium", category: "Supplements", careDomainSlug: "supplements", description: "Magnesium glycinate or citrate (400-600mg daily) for migraine prevention, muscle relaxation, and cardiovascular health." },
        { id: uuidv4(), name: "Turmeric/Curcumin", slug: "turmeric-curcumin", category: "Supplements", careDomainSlug: "supplements", description: "Curcumin extract (500-1000mg daily) with black pepper for enhanced absorption. Potent anti-inflammatory properties." },
        { id: uuidv4(), name: "Riboflavin (B2)", slug: "riboflavin", category: "Supplements", careDomainSlug: "supplements", description: "Vitamin B2 400mg daily for migraine prophylaxis. Improves mitochondrial energy metabolism." },
        { id: uuidv4(), name: "Coenzyme Q10", slug: "coq10", category: "Supplements", careDomainSlug: "supplements", description: "CoQ10 100-300mg daily for migraine prevention and cardiovascular support." },
        { id: uuidv4(), name: "Probiotics", slug: "probiotics", category: "Supplements", careDomainSlug: "supplements", description: "Multi-strain probiotics for gut health, immune modulation, and reducing systemic inflammation." },
        { id: uuidv4(), name: "Ginger Extract", slug: "ginger-extract", category: "Supplements", careDomainSlug: "supplements", description: "Ginger supplementation for GERD symptom relief and anti-inflammatory effects in arthritis." },

        // Medications
        { id: uuidv4(), name: "Proton Pump Inhibitors", slug: "ppi", category: "Medications", careDomainSlug: "medications", description: "Omeprazole, esomeprazole — reduce stomach acid production. Short-term use recommended." },
        { id: uuidv4(), name: "DMARDs", slug: "dmards", category: "Medications", careDomainSlug: "medications", description: "Disease-modifying antirheumatic drugs (methotrexate, hydroxychloroquine) to slow RA progression." },
        { id: uuidv4(), name: "Bronchodilators", slug: "bronchodilators", category: "Medications", careDomainSlug: "medications", description: "Short and long-acting bronchodilators (albuterol, tiotropium) for COPD airway management." },
        { id: uuidv4(), name: "Statins", slug: "statins", category: "Medications", careDomainSlug: "medications", description: "HMG-CoA reductase inhibitors for LDL cholesterol reduction in CAD management." },
        { id: uuidv4(), name: "Triptans", slug: "triptans", category: "Medications", careDomainSlug: "medications", description: "Selective serotonin receptor agonists for acute migraine treatment (sumatriptan, rizatriptan)." },
      ];

      await queryInterface.bulkInsert(
        "interventions",
        interventions.map((i) => ({
          id: i.id,
          name: i.name,
          slug: i.slug,
          category: i.category,
          description: i.description,
          careDomainId: dm[i.careDomainSlug] || null,
          documentId: null,
          teamId,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })),
        { transaction }
      );

      // Helper to find intervention id by slug
      const iid = (slug) => interventions.find((i) => i.slug === slug).id;

      // ══════════════════════════════════════════════════════════
      //  CONDITION ↔ INTERVENTION LINKS
      // ══════════════════════════════════════════════════════════

      const ciLinks = [
        // ── Obesity ──
        { c: "obesity", i: "plant-based-diet", d: "nutrition", ev: "A" },
        { c: "obesity", i: "caloric-restriction", d: "nutrition", ev: "A" },
        { c: "obesity", i: "intermittent-fasting", d: "nutrition", ev: "B" },
        { c: "obesity", i: "aerobic-exercise", d: "exercise", ev: "A" },
        { c: "obesity", i: "resistance-training", d: "exercise", ev: "A" },
        { c: "obesity", i: "adequate-hydration", d: "water-therapy", ev: "C" },
        { c: "obesity", i: "morning-sunlight", d: "sunlight", ev: "C" },
        { c: "obesity", i: "sleep-hygiene", d: "rest", ev: "B" },
        { c: "obesity", i: "stress-management", d: "mental-health", ev: "B" },
        { c: "obesity", i: "mindfulness-meditation", d: "mental-health", ev: "B" },
        { c: "obesity", i: "probiotics", d: "supplements", ev: "C" },

        // ── GERD ──
        { c: "gerd", i: "low-acid-diet", d: "nutrition", ev: "A" },
        { c: "gerd", i: "plant-based-diet", d: "nutrition", ev: "B" },
        { c: "gerd", i: "adequate-hydration", d: "water-therapy", ev: "B" },
        { c: "gerd", i: "alcohol-cessation", d: "temperance", ev: "A" },
        { c: "gerd", i: "caffeine-reduction", d: "temperance", ev: "B" },
        { c: "gerd", i: "elevated-head-sleep", d: "rest", ev: "A" },
        { c: "gerd", i: "sleep-hygiene", d: "rest", ev: "B" },
        { c: "gerd", i: "stress-management", d: "mental-health", ev: "B" },
        { c: "gerd", i: "ginger-extract", d: "supplements", ev: "B" },
        { c: "gerd", i: "probiotics", d: "supplements", ev: "C" },
        { c: "gerd", i: "ppi", d: "medications", ev: "A" },
        { c: "gerd", i: "aerobic-exercise", d: "exercise", ev: "B" },

        // ── Rheumatoid Arthritis ──
        { c: "rheumatoid-arthritis", i: "anti-inflammatory-diet", d: "nutrition", ev: "B" },
        { c: "rheumatoid-arthritis", i: "plant-based-diet", d: "nutrition", ev: "B" },
        { c: "rheumatoid-arthritis", i: "elimination-diet", d: "nutrition", ev: "C" },
        { c: "rheumatoid-arthritis", i: "low-impact-joint-exercise", d: "exercise", ev: "A" },
        { c: "rheumatoid-arthritis", i: "yoga", d: "exercise", ev: "B" },
        { c: "rheumatoid-arthritis", i: "hydrotherapy", d: "water-therapy", ev: "B" },
        { c: "rheumatoid-arthritis", i: "morning-sunlight", d: "sunlight", ev: "C" },
        { c: "rheumatoid-arthritis", i: "sleep-hygiene", d: "rest", ev: "B" },
        { c: "rheumatoid-arthritis", i: "mindfulness-meditation", d: "mental-health", ev: "B" },
        { c: "rheumatoid-arthritis", i: "cbt", d: "mental-health", ev: "B" },
        { c: "rheumatoid-arthritis", i: "omega-3", d: "supplements", ev: "A" },
        { c: "rheumatoid-arthritis", i: "turmeric-curcumin", d: "supplements", ev: "B" },
        { c: "rheumatoid-arthritis", i: "vitamin-d", d: "supplements", ev: "B" },
        { c: "rheumatoid-arthritis", i: "probiotics", d: "supplements", ev: "C" },
        { c: "rheumatoid-arthritis", i: "dmards", d: "medications", ev: "A" },

        // ── COPD ──
        { c: "copd", i: "plant-based-diet", d: "nutrition", ev: "B" },
        { c: "copd", i: "anti-inflammatory-diet", d: "nutrition", ev: "B" },
        { c: "copd", i: "pulmonary-rehab", d: "exercise", ev: "A" },
        { c: "copd", i: "aerobic-exercise", d: "exercise", ev: "A" },
        { c: "copd", i: "deep-breathing", d: "air", ev: "A" },
        { c: "copd", i: "air-quality", d: "air", ev: "A" },
        { c: "copd", i: "smoking-cessation", d: "temperance", ev: "A" },
        { c: "copd", i: "sleep-hygiene", d: "rest", ev: "B" },
        { c: "copd", i: "stress-management", d: "mental-health", ev: "B" },
        { c: "copd", i: "vitamin-d", d: "supplements", ev: "B" },
        { c: "copd", i: "omega-3", d: "supplements", ev: "C" },
        { c: "copd", i: "bronchodilators", d: "medications", ev: "A" },
        { c: "copd", i: "scripture-meditation", d: "trust-in-god", ev: "C" },

        // ── Coronary Artery Disease ──
        { c: "coronary-artery-disease", i: "plant-based-diet", d: "nutrition", ev: "A" },
        { c: "coronary-artery-disease", i: "mediterranean-diet", d: "nutrition", ev: "A" },
        { c: "coronary-artery-disease", i: "dash-diet", d: "nutrition", ev: "A" },
        { c: "coronary-artery-disease", i: "aerobic-exercise", d: "exercise", ev: "A" },
        { c: "coronary-artery-disease", i: "resistance-training", d: "exercise", ev: "B" },
        { c: "coronary-artery-disease", i: "smoking-cessation", d: "temperance", ev: "A" },
        { c: "coronary-artery-disease", i: "alcohol-cessation", d: "temperance", ev: "B" },
        { c: "coronary-artery-disease", i: "sleep-hygiene", d: "rest", ev: "B" },
        { c: "coronary-artery-disease", i: "stress-management", d: "mental-health", ev: "A" },
        { c: "coronary-artery-disease", i: "mindfulness-meditation", d: "mental-health", ev: "B" },
        { c: "coronary-artery-disease", i: "omega-3", d: "supplements", ev: "A" },
        { c: "coronary-artery-disease", i: "coq10", d: "supplements", ev: "B" },
        { c: "coronary-artery-disease", i: "statins", d: "medications", ev: "A" },
        { c: "coronary-artery-disease", i: "prayer-therapy", d: "trust-in-god", ev: "C" },

        // ── Migraines ──
        { c: "migraines", i: "elimination-diet", d: "nutrition", ev: "B" },
        { c: "migraines", i: "anti-inflammatory-diet", d: "nutrition", ev: "B" },
        { c: "migraines", i: "adequate-hydration", d: "water-therapy", ev: "B" },
        { c: "migraines", i: "aerobic-exercise", d: "exercise", ev: "B" },
        { c: "migraines", i: "yoga", d: "exercise", ev: "B" },
        { c: "migraines", i: "caffeine-reduction", d: "temperance", ev: "B" },
        { c: "migraines", i: "sleep-hygiene", d: "rest", ev: "A" },
        { c: "migraines", i: "deep-breathing", d: "air", ev: "C" },
        { c: "migraines", i: "mindfulness-meditation", d: "mental-health", ev: "B" },
        { c: "migraines", i: "cbt", d: "mental-health", ev: "B" },
        { c: "migraines", i: "biofeedback", d: "mental-health", ev: "A" },
        { c: "migraines", i: "magnesium", d: "supplements", ev: "A" },
        { c: "migraines", i: "riboflavin", d: "supplements", ev: "A" },
        { c: "migraines", i: "coq10", d: "supplements", ev: "B" },
        { c: "migraines", i: "omega-3", d: "supplements", ev: "C" },
        { c: "migraines", i: "triptans", d: "medications", ev: "A" },
      ];

      const ciRows = ciLinks.map((link) => ({
        id: uuidv4(),
        conditionId: cid(link.c),
        interventionId: iid(link.i),
        careDomainId: dm[link.d] || null,
        evidenceLevel: link.ev,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      }));
      await queryInterface.bulkInsert("condition_interventions", ciRows, { transaction });

      // ══════════════════════════════════════════════════════════
      //  EVIDENCE ENTRIES
      // ══════════════════════════════════════════════════════════

      const evidence = [
        // Obesity
        { c: "obesity", title: "A multicenter randomized controlled trial of a plant-based nutrition program to reduce body weight", pubmedId: "25592014", journal: "J Gen Intern Med", authors: "Mishra S, Xu J, Agarwal U, et al.", date: "2015-01-01" },
        { c: "obesity", title: "Intermittent fasting vs daily calorie restriction for type 2 diabetes prevention: a review", pubmedId: "24993615", journal: "Translational Research", authors: "Barnosky AR, Hoddy KK, Unterman TG, Varady KA", date: "2014-10-01" },
        { c: "obesity", title: "Effects of aerobic and resistance training on abdominal fat, apolipoproteins and high-sensitivity C-reactive protein", pubmedId: "24552392", journal: "Obesity", authors: "Willis LH, Slentz CA, Bateman LA, et al.", date: "2012-02-01" },

        // GERD
        { c: "gerd", title: "Association between body mass index and gastroesophageal reflux symptoms", pubmedId: "15765388", journal: "Ann Intern Med", authors: "Jacobson BC, Somers SC, Fuchs CS, et al.", date: "2006-08-01" },
        { c: "gerd", title: "The effect of dietary fat and calorie restriction on GERD symptoms", pubmedId: "16246942", journal: "Gut", authors: "Fox M, Barr C, Nolan S, et al.", date: "2005-01-01" },
        { c: "gerd", title: "Head of bed elevation for GERD: a systematic review", pubmedId: "16393212", journal: "J Gastroenterol Hepatol", authors: "Khan BA, Sodhi JS, Zargar SA, et al.", date: "2012-03-01" },

        // Rheumatoid Arthritis
        { c: "rheumatoid-arthritis", title: "A vegan diet free of gluten improves the signs and symptoms of rheumatoid arthritis", pubmedId: "11705328", journal: "Rheumatology", authors: "Hafstrom I, Ringertz B, Spangberg A, et al.", date: "2001-10-01" },
        { c: "rheumatoid-arthritis", title: "Omega-3 fatty acids in rheumatoid arthritis: an overview", pubmedId: "30217564", journal: "Int J Clin Pract", authors: "Gioxari A, Kaliora AC, Marantidou F, Panagiotakos DP", date: "2018-01-01" },
        { c: "rheumatoid-arthritis", title: "Curcumin in autoimmune and rheumatic diseases: a systematic review", pubmedId: "30199706", journal: "Drug Des Devel Ther", authors: "Dai Q, Zhou D, Xu L, Song X", date: "2018-09-01" },

        // COPD
        { c: "copd", title: "Pulmonary rehabilitation for COPD: a Cochrane systematic review", pubmedId: "25705944", journal: "Cochrane Database Syst Rev", authors: "McCarthy B, Casey D, Devane D, et al.", date: "2015-02-23" },
        { c: "copd", title: "Smoking cessation in COPD patients: long-term impact on mortality", pubmedId: "11050261", journal: "Am J Respir Crit Care Med", authors: "Anthonisen NR, Skeans MA, Wise RA, et al.", date: "2005-11-01" },
        { c: "copd", title: "Dietary patterns and COPD: a systematic review", pubmedId: "26038349", journal: "Eur Respir J", authors: "Varraso R, Chiuve SE, Fung TT, et al.", date: "2015-07-01" },

        // CAD
        { c: "coronary-artery-disease", title: "Can lifestyle changes reverse coronary heart disease? The Lifestyle Heart Trial", pubmedId: "2136947", journal: "The Lancet", authors: "Ornish D, Brown SE, Scherwitz LW, et al.", date: "1990-07-21" },
        { c: "coronary-artery-disease", title: "Intensive lifestyle changes for reversal of coronary heart disease — 5-year follow-up", pubmedId: "9863851", journal: "JAMA", authors: "Ornish D, Scherwitz LW, Billings JH, et al.", date: "1998-12-16" },
        { c: "coronary-artery-disease", title: "Mediterranean diet, traditional risk factors, and the rate of cardiovascular complications: PREDIMED trial", pubmedId: "23432189", journal: "N Engl J Med", authors: "Estruch R, Ros E, Salas-Salvado J, et al.", date: "2013-04-04" },
        { c: "coronary-artery-disease", title: "A way to reverse CAD?", pubmedId: "24444323", journal: "J Fam Pract", authors: "Esselstyn CB Jr, Gendy G, Doyle J, et al.", date: "2014-07-01" },

        // Migraines
        { c: "migraines", title: "Magnesium in the prophylaxis of migraine: a double-blind placebo-controlled study", pubmedId: "8985047", journal: "Cephalalgia", authors: "Peikert A, Wilimzig C, Kohne-Volland R", date: "1996-06-01" },
        { c: "migraines", title: "Effectiveness of high-dose riboflavin in migraine prophylaxis: a randomized controlled trial", pubmedId: "9484373", journal: "Neurology", authors: "Schoenen J, Jacquy J, Lenaerts M", date: "1998-02-01" },
        { c: "migraines", title: "Biofeedback and relaxation training in migraine: a meta-analytic review", pubmedId: "15122679", journal: "Pain", authors: "Nestoriuc Y, Martin A", date: "2007-03-01" },
        { c: "migraines", title: "Diet and migraine: a review of the literature", pubmedId: "31671491", journal: "Headache", authors: "Razeghi Jahromi S, Ghorbani Z, Martelletti P, et al.", date: "2019-11-01" },
      ];

      await queryInterface.bulkInsert(
        "evidence_entries",
        evidence.map((e) => ({
          id: uuidv4(),
          conditionId: cid(e.c),
          interventionId: null,
          title: e.title,
          pubmedId: e.pubmedId,
          doi: null,
          authors: e.authors,
          journal: e.journal,
          publicationDate: new Date(e.date),
          abstract: null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${e.pubmedId}/`,
          studyType: null,
          qualityRating: null,
          sampleSize: null,
          summary: null,
          teamId,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction }
      );

      // ══════════════════════════════════════════════════════════
      //  SCRIPTURES
      // ══════════════════════════════════════════════════════════

      const scriptures = [
        // Obesity
        { c: "obesity", reference: "1 Corinthians 6:19-20", text: "What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own? For ye are bought with a price: therefore glorify God in your body.", book: "1 Corinthians", chapter: 6, vs: 19, ve: 20, sop: false, sopSrc: null, theme: "temperance" },
        { c: "obesity", reference: "1 Corinthians 10:31", text: "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God.", book: "1 Corinthians", chapter: 10, vs: 31, ve: null, sop: false, sopSrc: null, theme: "nutrition" },
        { c: "obesity", reference: "Counsels on Diet and Foods, p. 37", text: "Since the laws of nature are the laws of God, it is plainly our duty to give these laws careful study.", book: null, chapter: null, vs: null, ve: null, sop: true, sopSrc: "Counsels on Diet and Foods", theme: "temperance" },

        // GERD
        { c: "gerd", reference: "Proverbs 23:20-21", text: "Be not among winebibbers; among riotous eaters of flesh: For the drunkard and the glutton shall come to poverty.", book: "Proverbs", chapter: 23, vs: 20, ve: 21, sop: false, sopSrc: null, theme: "temperance" },
        { c: "gerd", reference: "Ministry of Healing, p. 305", text: "Regularity in eating should be carefully observed. Nothing should be eaten between meals, no confectionery, nuts, fruits, or food of any kind.", book: null, chapter: null, vs: null, ve: null, sop: true, sopSrc: "Ministry of Healing", theme: "nutrition" },

        // Rheumatoid Arthritis
        { c: "rheumatoid-arthritis", reference: "Psalm 41:3", text: "The LORD will strengthen him upon the bed of languishing: thou wilt make all his bed in his sickness.", book: "Psalms", chapter: 41, vs: 3, ve: null, sop: false, sopSrc: null, theme: "healing" },
        { c: "rheumatoid-arthritis", reference: "Isaiah 53:5", text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.", book: "Isaiah", chapter: 53, vs: 5, ve: null, sop: false, sopSrc: null, theme: "healing" },
        { c: "rheumatoid-arthritis", reference: "Ministry of Healing, p. 127", text: "In grains, fruits, vegetables, and nuts are to be found all the food elements that we need.", book: null, chapter: null, vs: null, ve: null, sop: true, sopSrc: "Ministry of Healing", theme: "nutrition" },

        // COPD
        { c: "copd", reference: "Genesis 2:7", text: "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.", book: "Genesis", chapter: 2, vs: 7, ve: null, sop: false, sopSrc: null, theme: "air" },
        { c: "copd", reference: "Counsels on Health, p. 58", text: "In order to have good health, we must have good blood; for the blood is the current of life. It repairs waste and nourishes the body. Properly nourished and supplied with fresh air\u2026", book: null, chapter: null, vs: null, ve: null, sop: true, sopSrc: "Counsels on Health", theme: "air" },

        // CAD
        { c: "coronary-artery-disease", reference: "3 John 1:2", text: "Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth.", book: "3 John", chapter: 1, vs: 2, ve: null, sop: false, sopSrc: null, theme: "health" },
        { c: "coronary-artery-disease", reference: "Proverbs 4:23", text: "Keep thy heart with all diligence; for out of it are the issues of life.", book: "Proverbs", chapter: 4, vs: 23, ve: null, sop: false, sopSrc: null, theme: "heart-health" },
        { c: "coronary-artery-disease", reference: "Counsels on Diet and Foods, p. 380", text: "The liability to take disease is increased tenfold by meat eating.", book: null, chapter: null, vs: null, ve: null, sop: true, sopSrc: "Counsels on Diet and Foods", theme: "nutrition" },

        // Migraines
        { c: "migraines", reference: "Philippians 4:6-7", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds.", book: "Philippians", chapter: 4, vs: 6, ve: 7, sop: false, sopSrc: null, theme: "trust" },
        { c: "migraines", reference: "Psalm 34:18", text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.", book: "Psalms", chapter: 34, vs: 18, ve: null, sop: false, sopSrc: null, theme: "comfort" },
        { c: "migraines", reference: "Ministry of Healing, p. 241", text: "Nothing tends more to promote health of body and of soul than does a spirit of gratitude and praise.", book: null, chapter: null, vs: null, ve: null, sop: true, sopSrc: "Ministry of Healing", theme: "mental-health" },
      ];

      await queryInterface.bulkInsert(
        "scriptures",
        scriptures.map((s) => ({
          id: uuidv4(),
          conditionId: cid(s.c),
          interventionId: null,
          reference: s.reference,
          text: s.text,
          book: s.book,
          chapter: s.chapter,
          verseStart: s.vs,
          verseEnd: s.ve,
          translation: s.sop ? "SoP" : "KJV",
          spiritOfProphecy: s.sop,
          sopSource: s.sopSrc,
          sopPage: null,
          theme: s.theme,
          teamId,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction }
      );

      // ══════════════════════════════════════════════════════════
      //  RECIPES
      // ══════════════════════════════════════════════════════════

      const recipes = [
        { id: uuidv4(), name: "Anti-Inflammatory Turmeric Lentil Soup", slug: "turmeric-lentil-soup", description: "Warming, protein-rich soup featuring turmeric and lentils. Supports blood sugar regulation and reduces inflammation.", servings: 6, prepTime: 15, cookTime: 35, ingredients: ["1 cup red lentils","1 tbsp turmeric","1 onion diced","3 cloves garlic","2 carrots","4 cups vegetable broth","1 can coconut milk","1 tsp cumin","Fresh cilantro"], instructions: ["Saute onion and garlic","Add carrots, turmeric, cumin","Add lentils and broth, boil","Simmer 25 min","Stir in coconut milk","Garnish with cilantro"], tags: ["vegan","gluten-free","anti-inflammatory"], nutrition: { calories: 280, protein: 14, fiber: 12, fat: 8 } },
        { id: uuidv4(), name: "Berry Overnight Oats", slug: "berry-overnight-oats", description: "High-fiber breakfast rich in antioxidants for cardiovascular health and steady blood sugar.", servings: 2, prepTime: 10, cookTime: 0, ingredients: ["1 cup rolled oats","1 cup plant milk","1/2 cup mixed berries","2 tbsp chia seeds","1 tbsp flaxseed meal","1/4 tsp cinnamon"], instructions: ["Combine oats, milk, chia, flax, cinnamon","Stir, cover, refrigerate overnight","Top with berries"], tags: ["vegan","high-fiber","heart-healthy"], nutrition: { calories: 320, protein: 10, fiber: 14, fat: 9 } },
        { id: uuidv4(), name: "Mediterranean Chickpea Bowl", slug: "mediterranean-chickpea-bowl", description: "Colorful grain bowl with chickpeas, roasted vegetables, and tahini dressing.", servings: 4, prepTime: 15, cookTime: 25, ingredients: ["2 cans chickpeas","1 cup quinoa","1 cucumber","1 cup cherry tomatoes","1/4 cup kalamata olives","2 tbsp tahini","1 lemon juiced"], instructions: ["Cook quinoa","Roast chickpeas at 400F 20 min","Combine all ingredients","Whisk tahini dressing","Drizzle and serve"], tags: ["vegan","mediterranean","high-protein"], nutrition: { calories: 420, protein: 18, fiber: 12, fat: 14 } },
        { id: uuidv4(), name: "Green Smoothie for Blood Pressure", slug: "green-smoothie-bp", description: "Potassium-rich smoothie with leafy greens, banana, and beets for healthy blood pressure.", servings: 2, prepTime: 5, cookTime: 0, ingredients: ["2 cups spinach","1 banana","1/2 cup cooked beets","1 cup almond milk","1 tbsp flaxseed","1/2 cup frozen berries"], instructions: ["Add all to blender","Blend until smooth","Serve immediately"], tags: ["vegan","gluten-free","dash-friendly"], nutrition: { calories: 180, protein: 5, fiber: 6, fat: 4 } },
        { id: uuidv4(), name: "Ginger-Oat Soothing Porridge", slug: "ginger-oat-porridge", description: "Gentle, low-acid porridge with ginger for GERD-friendly breakfast. Soothes the digestive tract.", servings: 2, prepTime: 5, cookTime: 10, ingredients: ["1 cup oats","2 cups water","1 tsp fresh ginger grated","1 banana mashed","Pinch of cinnamon","1 tbsp almond butter"], instructions: ["Bring water and ginger to boil","Add oats, cook 5 min","Stir in banana and cinnamon","Top with almond butter"], tags: ["vegan","low-acid","gerd-friendly"], nutrition: { calories: 260, protein: 8, fiber: 6, fat: 7 } },
        { id: uuidv4(), name: "Omega-3 Power Bowl", slug: "omega-3-power-bowl", description: "Walnut and flaxseed-rich bowl with anti-inflammatory properties for joint and brain health.", servings: 2, prepTime: 10, cookTime: 15, ingredients: ["1 cup quinoa","1/4 cup walnuts","2 tbsp ground flaxseed","1 avocado","1 cup roasted sweet potato","2 cups mixed greens","Lemon tahini dressing"], instructions: ["Cook quinoa","Roast sweet potato cubes","Assemble bowls with greens, quinoa, sweet potato","Top with walnuts, flax, avocado","Drizzle dressing"], tags: ["vegan","anti-inflammatory","omega-3-rich"], nutrition: { calories: 480, protein: 16, fiber: 14, fat: 24 } },
        { id: uuidv4(), name: "Magnesium-Rich Dark Chocolate Chia Pudding", slug: "dark-chocolate-chia-pudding", description: "Dessert-style pudding rich in magnesium for migraine prevention and relaxation.", servings: 4, prepTime: 10, cookTime: 0, ingredients: ["1/2 cup chia seeds","2 cups oat milk","3 tbsp cacao powder","2 tbsp maple syrup","1/4 cup pumpkin seeds","Fresh raspberries"], instructions: ["Whisk chia, milk, cacao, maple","Refrigerate 4 hours or overnight","Top with pumpkin seeds and raspberries"], tags: ["vegan","high-magnesium","migraine-friendly"], nutrition: { calories: 220, protein: 8, fiber: 12, fat: 10 } },
      ];

      await queryInterface.bulkInsert(
        "recipes",
        recipes.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          description: r.description,
          servings: r.servings,
          prepTime: r.prepTime,
          cookTime: r.cookTime,
          ingredients: JSON.stringify(r.ingredients),
          instructions: JSON.stringify(r.instructions),
          dietaryTags: JSON.stringify(r.tags),
          nutritionData: JSON.stringify(r.nutrition),
          documentId: null,
          teamId,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })),
        { transaction }
      );

      // Helper
      const rid = (slug) => recipes.find((r) => r.slug === slug).id;

      // ══════════════════════════════════════════════════════════
      //  CONDITION ↔ RECIPE LINKS
      // ══════════════════════════════════════════════════════════

      const crLinks = [
        { c: "obesity", r: "turmeric-lentil-soup", d: "nutrition" },
        { c: "obesity", r: "green-smoothie-bp", d: "nutrition" },
        { c: "obesity", r: "berry-overnight-oats", d: "nutrition" },
        { c: "gerd", r: "ginger-oat-porridge", d: "nutrition" },
        { c: "gerd", r: "berry-overnight-oats", d: "nutrition" },
        { c: "rheumatoid-arthritis", r: "turmeric-lentil-soup", d: "nutrition" },
        { c: "rheumatoid-arthritis", r: "omega-3-power-bowl", d: "nutrition" },
        { c: "copd", r: "green-smoothie-bp", d: "nutrition" },
        { c: "copd", r: "mediterranean-chickpea-bowl", d: "nutrition" },
        { c: "coronary-artery-disease", r: "mediterranean-chickpea-bowl", d: "nutrition" },
        { c: "coronary-artery-disease", r: "omega-3-power-bowl", d: "nutrition" },
        { c: "coronary-artery-disease", r: "berry-overnight-oats", d: "nutrition" },
        { c: "migraines", r: "dark-chocolate-chia-pudding", d: "nutrition" },
        { c: "migraines", r: "omega-3-power-bowl", d: "nutrition" },
      ];

      await queryInterface.bulkInsert(
        "condition_recipes",
        crLinks.map((link) => ({
          id: uuidv4(),
          conditionId: cid(link.c),
          recipeId: rid(link.r),
          careDomainId: dm[link.d] || null,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        })),
        { transaction }
      );

      // ── Summary ─────────────────────────────────────────────
      console.log("Seed data created:");
      console.log(`  - ${conditions.length} conditions`);
      console.log(`  - ${sectionRows.length} condition sections`);
      console.log(`  - ${interventions.length} interventions`);
      console.log(`  - ${ciRows.length} condition-intervention links`);
      console.log(`  - ${evidence.length} evidence entries`);
      console.log(`  - ${scriptures.length} scriptures`);
      console.log(`  - ${recipes.length} recipes`);
      console.log(`  - ${crLinks.length} condition-recipe links`);
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete("condition_recipes", null, { transaction });
      await queryInterface.bulkDelete("condition_interventions", null, { transaction });
      await queryInterface.bulkDelete("evidence_entries", null, { transaction });
      await queryInterface.bulkDelete("scriptures", null, { transaction });
      await queryInterface.bulkDelete("condition_sections", null, { transaction });
      await queryInterface.bulkDelete("recipes", null, { transaction });
      await queryInterface.bulkDelete("interventions", null, { transaction });
      await queryInterface.bulkDelete("conditions", null, { transaction });
    });
  },
};
