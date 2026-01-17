// src/data/questions.js

// --- 1. LES QUESTIONNAIRES SPÉCIAUX (Rapportent +) ---
const QUESTIONNAIRES = [
  {
    id: "onboarding_rh",
    title: "Mise à jour Dossier RH",
    active: true, // ACTIF : Apparaît comme prioritaire (si on gérait l'affichage par groupe)
    bonusReward: 150, // Gagne plus
    questions: [
      {
        id: "rh_phone",
        text: "Pour la sécurité, confirmez votre numéro de mobile personnel :",
        type: "free",
        placeholder: "Ex: 06 12 34 56 78",
        tag: "RH_UPDATE",
        targetField: "info.telephone", // <--- C'est ça qui va modifier le profil utilisateur !
        reward: 150
      },
      {
        id: "rh_dispo",
        text: "Êtes-vous disponible pour des astreintes le week-end ?",
        type: "qcm",
        options: ["Oui, toujours", "Non, jamais", "À discuter"],
        tag: "RH_DISPO",
        reward: 150
      }
    ]
  },
  {
    id: "old_mission_z",
    title: "Mission Z (Archivée)",
    active: false, // INACTIF : Ses questions tombent dans le pool aléatoire standard
    questions: [
      {
        id: "z_report",
        text: "Rapport d'anomalie secteur Z (Question d'archive).",
        type: "free",
        tag: "SECURITY_ARCHIVE",
        reward: 50 // Récompense standard car désactivé
      }
    ]
  }
];

// --- 2. LE POOL ALÉATOIRE DE BASE ---
const BASE_RANDOM_QUESTIONS = [
  { 
    id: 101, 
    text: "Avez-vous remarqué des interférences sur le réseau ?", 
    type: "qcm", 
    reward: 50, 
    sensitive: true, 
    tag: "SECURITE", 
    options: ["Oui, fréquentes", "Non, R.A.S.", "Je ne sais pas"] 
  },
  { 
    id: 102, 
    text: "Niveau de stress actuel au poste de travail :", 
    type: "qcm", 
    reward: 50, 
    sensitive: false, 
    options: ["Faible", "Modéré", "Critique"] 
  },
  { 
    id: 103, 
    text: "Message libre à l'administration (Boîte à idées) :", 
    type: "free", 
    reward: 50, 
    sensitive: false,
    tag: "FEEDBACK",
    placeholder: "Écrivez votre suggestion..."
  }
];

// --- 3. GÉNÉRATEUR INTELLIGENT ---
export const getQuestionPool = () => {
  let pool = [...BASE_RANDOM_QUESTIONS];

  QUESTIONNAIRES.forEach(q => {
    if (q.active) {
      // Si on voulait traiter les questionnaires à part, on pourrait les renvoyer séparément.
      // Ici, pour le mode "Tinder", on mélange tout mais on garde les grosses récompenses.
      pool = [...pool, ...q.questions];
    } else {
      // Si DÉSACTIVÉ : On ajoute les questions au pool mais avec récompense standard (50)
      const downgraded = q.questions.map(item => ({
        ...item,
        reward: 50, 
        source: `archive_${q.id}`
      }));
      pool = [...pool, ...downgraded];
    }
  });

  return pool;
};